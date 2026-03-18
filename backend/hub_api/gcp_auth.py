"""Utility for fetching GCP identity tokens for service-to-service auth on Cloud Run."""

import logging

import google.auth
import google.auth.transport.requests
from google.oauth2 import id_token as google_id_token

logger = logging.getLogger(__name__)

_request = None


def _get_request():
    global _request
    if _request is None:
        _request = google.auth.transport.requests.Request()
    return _request


def get_id_token(audience: str) -> str | None:
    """Fetch a GCP identity token for the given audience (target Cloud Run URL).

    Returns the token string, or None if running locally (no metadata server).
    """
    try:
        token = google_id_token.fetch_id_token(_get_request(), audience)
        return token
    except Exception:
        logger.debug("Could not fetch GCP identity token (likely running locally)", exc_info=True)
        return None
