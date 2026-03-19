"""Deployment status: last Cloud Run and Cloudflare deploy times."""

import os
from typing import Any

import httpx
from fastapi import APIRouter
from google.auth import default as google_default
from google.auth.transport.requests import Request

from hub_api.config import settings

router = APIRouter()

# Deploy config: mirrors projects.config.ts + platform
# accountId filled from CLOUDFLARE_ACCOUNT_ID when fetching
DEPLOY_CONFIG = {
    "hub": {
        "cloudRun": {"projectId": "216566158850", "location": "us-central1", "serviceName": "dc-hub-api"},
        "cloudflarePages": {"projectName": "dc-hub"},
    },
    "engine": {
        "cloudRun": {"projectId": "216566158850", "location": "us-central1", "serviceName": "dc-engine-api"},
        "cloudflarePages": {"projectName": "dc-engine"},
    },
    "notion-sync": {
        "cloudRun": {"projectId": "216566158850", "location": "us-central1", "serviceName": "dc-notion-sync-api"},
        "cloudflarePages": {"projectName": "dc-notion-sync"},
    },
    "portal": {
        "cloudRun": {"projectId": "216566158850", "location": "us-central1", "serviceName": "dc-portal-api"},
        "cloudflarePages": {"projectName": "dc-portal"},
    },
    "bd-tools": {
        "cloudflarePages": {"projectName": "dc-bd-tools"},
    },
}


async def _get_gcp_token() -> str | None:
    """Get GCP access token via Application Default Credentials."""
    try:
        creds, _ = google_default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
        creds.refresh(Request())
        return creds.token
    except Exception:
        return None


async def _cloud_run_last_deploy(project_id: str, location: str, service_name: str) -> str | None:
    """Fetch latest revision createTime from Cloud Run."""
    token = await _get_gcp_token()
    if not token:
        return None
    url = (
        f"https://run.googleapis.com/v2/projects/{project_id}/locations/{location}/services/{service_name}/revisions"
    )
    params = {"pageSize": 1}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                url,
                params=params,
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0,
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            revisions = data.get("revisions", [])
            if not revisions:
                return None
            return revisions[0].get("createTime")
        except Exception:
            return None


async def _cloudflare_pages_last_deploy(account_id: str, project_name: str, token: str) -> str | None:
    """Fetch latest Pages deployment created_on."""
    if not account_id or not token:
        return None
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project_name}/deployments"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                url,
                headers={"Authorization": f"Bearer {token}"},
                params={"per_page": 1},
                timeout=10.0,
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            if not data.get("success"):
                return None
            result = data.get("result", [])
            if isinstance(result, list) and result:
                return result[0].get("created_on")
            return None
        except Exception:
            return None


async def _cloudflare_worker_last_deploy(account_id: str, script_name: str, token: str) -> str | None:
    """Fetch latest Worker deployment created_on."""
    if not account_id or not token:
        return None
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/{script_name}/deployments"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                url,
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0,
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            if not data.get("success"):
                return None
            result = data.get("result", {})
            deployments = result.get("deployments", []) if isinstance(result, dict) else []
            if deployments:
                return deployments[0].get("created_on")
            return None
        except Exception:
            return None


@router.get("/api/status/deployments")
async def get_deployments() -> dict[str, Any]:
    """Return last deploy times for hub and projects (Cloud Run, Cloudflare Pages, Workers)."""
    cf_token = settings.cloudflare_api_token or os.environ.get("CLOUDFLARE_API_TOKEN", "")
    cf_account = settings.cloudflare_account_id or os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")

    result: dict[str, Any] = {}

    for key, cfg in DEPLOY_CONFIG.items():
        entry: dict[str, Any] = {}

        if cloud_run := cfg.get("cloudRun"):
            last = await _cloud_run_last_deploy(
                cloud_run["projectId"],
                cloud_run["location"],
                cloud_run["serviceName"],
            )
            entry["cloudRun"] = {
                "lastDeploy": last,
                "service": cloud_run["serviceName"],
            }

        if cloudflare_pages := cfg.get("cloudflarePages"):
            last = await _cloudflare_pages_last_deploy(
                cf_account,
                cloudflare_pages["projectName"],
                cf_token,
            )
            entry["cloudflarePages"] = {
                "lastDeploy": last,
                "project": cloudflare_pages["projectName"],
            }

        if cloudflare_worker := cfg.get("cloudflareWorker"):
            last = await _cloudflare_worker_last_deploy(
                cf_account,
                cloudflare_worker["scriptName"],
                cf_token,
            )
            entry["cloudflareWorker"] = {
                "lastDeploy": last,
                "script": cloudflare_worker["scriptName"],
            }

        result[key] = entry

    return result
