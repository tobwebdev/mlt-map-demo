# mlt-map-demo

JavaScript hosted for the Minnesota Land Trust Webflow site.

## Files

- `map-bootstrap.js` — Home page interactive map. Loads d3 + topojson, builds the SVG inside `#ltm-canvas`, reads CMS Collection Lists, wires up toggles/filters/detail panel.

## Webflow paste

In **Site settings → Custom Code → Footer Code** (or page-level Before `</body>`), use the `@main` URL while iterating:

```html
<script src="https://cdn.jsdelivr.net/gh/tobwebdev/mlt-map-demo@main/map-bootstrap.js"></script>
```

For production, pin to a commit SHA + add an SRI integrity hash. Get the hash from:

```
https://cdn.jsdelivr.net/gh/tobwebdev/mlt-map-demo@<commit-sha>/map-bootstrap.js?meta
```

Then:

```html
<script
  src="https://cdn.jsdelivr.net/gh/tobwebdev/mlt-map-demo@<commit-sha>/map-bootstrap.js"
  integrity="sha384-..."
  crossorigin="anonymous"></script>
```

## Cache invalidation

jsDelivr caches `@main` for ~12 hours. After pushing changes, force a refresh with:

```
https://purge.jsdelivr.net/gh/tobwebdev/mlt-map-demo@main/map-bootstrap.js
```
