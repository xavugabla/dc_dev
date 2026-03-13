#!/usr/bin/env bash
set -e

# Run after: npx wrangler login  (or set CLOUDFLARE_API_TOKEN)
cd "$(dirname "$0")/.."

echo "==> Building hub..."
npm run build

echo "==> Creating KV namespace (if needed)..."
WRANGLER_TOML="worker/wrangler.toml"
if grep -q "PREPLACE_KV_ID" "$WRANGLER_TOML" 2>/dev/null; then
  KV_OUT=$(cd worker && npx wrangler kv namespace create AUTH 2>&1)
  echo "$KV_OUT"
  KV_ID=$(echo "$KV_OUT" | grep -oE 'id = "[a-f0-9]+"' | head -1 | cut -d'"' -f2)
  if [ -n "$KV_ID" ]; then
    if sed --version 2>/dev/null | grep -q GNU; then
      sed -i "s/PREPLACE_KV_ID/$KV_ID/" "$WRANGLER_TOML"
    else
      sed -i '' "s/PREPLACE_KV_ID/$KV_ID/" "$WRANGLER_TOML"
    fi
    echo "Updated wrangler.toml with KV id: $KV_ID"
  else
    echo "Could not parse KV id. Add it manually to worker/wrangler.toml"
    exit 1
  fi
fi

echo "==> Deploying Worker..."
cd worker
npx wrangler deploy

echo ""
echo "Done. Next steps:"
echo "  1. ADMIN_SECRET: already set (or run: cd worker && npx wrangler secret put ADMIN_SECRET)"
echo "  2. Hub: deployed to dc-dev-hub.pages.dev"
echo "  3. Worker route: Add dc-dev.pages.dev/* to this Worker in Cloudflare dashboard"
echo "     (Workers & Pages > dc-dev-gateway > Settings > Triggers > Add route)"
