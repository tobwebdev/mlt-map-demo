# mlt-map-demo

Files for the Minnesota Land Trust Webflow site's interactive home page map.

## Files

- `map-bootstrap.js` — Map logic. Loads d3 + topojson, fetches `biome-geometry.json`, builds the SVG inside `#ltm-canvas`, reads CMS Collection Lists, wires up toggles/filters/detail panel. **Hosted on jsDelivr.**
- `biome-geometry.json` — SVG path data for the four MN biome boundaries (Tallgrass Aspen Parklands, Laurentian Mixed Forest, Prairie Parkland, Eastern Broadleaf Forest), in `0 0 614 699` user-space. The bootstrap fetches it at runtime and scales it to fit the d3-projected MN bounding box. **Hosted on jsDelivr alongside the JS.** To update: re-export the biome SVG, paste each `<path d="..."/>` value into the matching slug.
- `map-styles.css` — Map styling. **Reference snapshot only.** The canonical copy lives in Webflow page custom code so the client can edit colors without redeploying. See "Webflow setup" below.

The bootstrap resolves `biome-geometry.json` relative to its own URL (via `document.currentScript.src`), so pinning the JS to a commit SHA also pins the JSON to that SHA — no separate version management needed.

## Webflow setup

Two pieces, both on the home page.

### 1. CSS — paste in Page settings → Custom Code → **Inside `<head>` tag**

Wrap the contents of `map-styles.css` in `<style>` tags:

```html
<style>
  /* ...paste the contents of map-styles.css here... */
</style>
```

The client can edit any color or layout rule directly here. Save → Publish → live.
The CSS uses Webflow brand variables (`var(--primary--evergreen, #1d4925)` etc.) with hex fallbacks, so colors stay in sync with the Variables panel.

### 2. JS — paste in Page settings → Custom Code → **Before `</body>` tag**

While iterating, use the `@main` URL (auto-updates on push, ~12 hr CDN cache):

```html
<script src="https://cdn.jsdelivr.net/gh/tobwebdev/mlt-map-demo@main/map-bootstrap.js"></script>
```

For production, pin to a commit SHA + add an SRI integrity hash:

```html
<script
  src="https://cdn.jsdelivr.net/gh/tobwebdev/mlt-map-demo@<commit-sha>/map-bootstrap.js"
  integrity="sha384-..."
  crossorigin="anonymous"></script>
```

Get the hash from `https://cdn.jsdelivr.net/gh/tobwebdev/mlt-map-demo@<commit-sha>/map-bootstrap.js?meta` or via:

```bash
curl -s "https://cdn.jsdelivr.net/gh/tobwebdev/mlt-map-demo@<sha>/map-bootstrap.js" \
  | openssl dgst -sha384 -binary | openssl base64 -A
```

## Updating

- **Color or layout changes** → edit the `<style>` block in Webflow custom code → publish. No GitHub push needed.
- **Logic changes** (toggles, filter behavior, click handlers) → edit `map-bootstrap.js` here → push → purge jsDelivr cache (below).
- Keep `map-styles.css` in this repo in sync with the Webflow `<style>` block as a versioned snapshot.

## jsDelivr cache invalidation

`@main` URLs are CDN-cached for ~12 hours. After pushing JS changes, force a refresh:

```
https://purge.jsdelivr.net/gh/tobwebdev/mlt-map-demo@main/map-bootstrap.js
```

(Just visit the URL; returns JSON when done.)
