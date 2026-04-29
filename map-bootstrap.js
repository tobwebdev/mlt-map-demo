/*!
 * MLT Map Bootstrap
 * Loaded on the home page (Before </body>) of the Minnesota Land Trust Webflow site.
 * Injects layer CSS, loads d3 + topojson, builds the SVG, reads CMS Collection Lists,
 * and wires up toggles, filters, and the click-to-detail panel.
 *
 * The map will render with just MN county outlines until the 7 hidden Collection
 * Lists are added (cms-statistics / cms-biomes / cms-habitats / cms-regions /
 * cms-counties / cms-properties / cms-locations).
 */
(function () {
  // Layer-specific styles that the whtml_builder CSS param couldn't apply
  const CSS = `
.ltm-layer-outline path{fill:#f4f1e6;stroke:#a8a08e;stroke-width:1.2}
.ltm-layer-counties path{fill:none;stroke:#cfc8b6;stroke-width:0.5}
.ltm-layer-counties path.in-cms{fill:rgba(0,0,0,0.04);cursor:pointer}
.ltm-layer-counties path.in-cms:hover{fill:rgba(0,0,0,0.10)}
.ltm-layer-biomes path{fill-opacity:0.55;stroke:rgba(0,0,0,0.18);stroke-width:0.6;cursor:pointer;transition:fill-opacity 0.15s}
.ltm-layer-biomes path:hover{fill-opacity:0.75}
.ltm-layer-regions path{fill-opacity:0.35;stroke:rgba(0,0,0,0.25);stroke-width:0.8;cursor:pointer}
.ltm-layer-properties rect{fill:#2c5f3f;stroke:white;stroke-width:1.2;cursor:pointer;transition:transform 0.15s;transform-box:fill-box;transform-origin:center}
.ltm-layer-properties rect:hover{transform:scale(2)}
.ltm-layer-properties rect.private{fill:#6f6a5e}
.ltm-layer-locations .marker{stroke:white;stroke-width:1.2;cursor:pointer}
.ltm-layer-locations .marker.statepark,.ltm-layer-locations .marker.staterec{fill:#639922;transition:transform 0.15s;transform-box:fill-box;transform-origin:center}
.ltm-layer-locations .marker.staterec{fill:#c99a3a}
.ltm-layer-locations .marker.statepark:hover,.ltm-layer-locations .marker.staterec:hover{transform:scale(2)}
.ltm-layer-locations .marker.city{fill:#1f4f7a}
.ltm-layer-locations .area{fill:#185fa5;fill-opacity:0.25;stroke:#185fa5;stroke-width:1;cursor:pointer;transition:fill-opacity 0.15s,stroke-width 0.15s}
.ltm-layer-locations .area:hover{fill-opacity:0.55;stroke-width:2.5}
.ltm-layer-locations .area.stateforest{fill:#5b7a2f;stroke:#5b7a2f}
.ltm-layer-locations .area.nationalpark{fill:#993c1d;stroke:#993c1d}
.ltm-layer-locations .area.nationalforest{fill:#2c5f3f;stroke:#2c5f3f}
.ltm-layer.hidden{display:none}
.ltm-dimmed{opacity:0.18}
.ltm-detail .kicker{color:#6f6a5e;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 8px}
.ltm-detail h2{margin:0 0 8px}
.ltm-detail p{margin:6px 0}
.ltm-detail .stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.ltm-detail .stat{background:#f4f1e6;border-radius:6px;padding:8px 10px}
.ltm-detail .stat .v{font-weight:600;margin:0}
.ltm-detail .stat .l{color:#6f6a5e;text-transform:uppercase;letter-spacing:0.04em;margin:0}
.ltm-detail img{max-width:100%;border-radius:6px;margin-top:10px}
.ltm-detail .ltm-cta{display:inline-block;margin-top:14px;padding:10px 16px;background:#2c5f3f;color:#fff;border-radius:6px;text-decoration:none;border:1px solid #2c5f3f;transition:background 0.15s}
.ltm-detail .ltm-cta:hover{background:#3a7a52}
.ltm-tooltip{position:absolute;pointer-events:none;background:#fafaf6;color:#2a2a26;border:1px solid #d8d3c4;border-left:3px solid #2c5f3f;border-radius:4px;padding:6px 10px;box-shadow:0 4px 12px rgba(0,0,0,0.08);opacity:0;transition:opacity 0.12s;z-index:50;max-width:240px}
.ltm-tooltip.show{opacity:1}
.ltm-tooltip .ltm-tt-name{font-weight:600;margin:0}
.ltm-tooltip .ltm-tt-type{color:#6f6a5e;margin:2px 0 0}
.ltm-sidebar h3{margin:0 0 8px}
.ltm-sidebar .ltm-section{margin-bottom:18px}
.ltm-sidebar label{display:flex;align-items:center;gap:8px;padding:3px 0;cursor:pointer}
.ltm-sidebar .swatch{width:12px;height:12px;border-radius:50%;flex:none}
.ltm-sidebar .swatch.sq{border-radius:2px}
.ltm-sidebar .swatch.area{border-radius:2px;opacity:0.6}
#ltm-svg.hide-property-public .ltm-layer-properties rect:not(.private){display:none}
#ltm-svg.hide-property-private .ltm-layer-properties rect.private{display:none}
#ltm-svg.hide-loc-city .ltm-layer-locations .marker.city{display:none}
#ltm-svg.hide-loc-statepark .ltm-layer-locations .marker.statepark{display:none}
#ltm-svg.hide-loc-staterec .ltm-layer-locations .marker.staterec{display:none}
#ltm-svg.hide-loc-stateforest .ltm-layer-locations-areas .area.stateforest,#ltm-svg.hide-loc-stateforest .ltm-layer-locations .marker.stateforest{display:none}
#ltm-svg.hide-loc-nationalpark .ltm-layer-locations-areas .area.nationalpark,#ltm-svg.hide-loc-nationalpark .ltm-layer-locations .marker.nationalpark{display:none}
#ltm-svg.hide-loc-nationalforest .ltm-layer-locations-areas .area.nationalforest,#ltm-svg.hide-loc-nationalforest .ltm-layer-locations .marker.nationalforest{display:none}
.cms-data,.cms-data *{display:none!important}
@media (max-width:900px){#ltm-mount{grid-template-columns:1fr!important}}`;
  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  // FIPS lookup for the 18 currently-active counties (extend as needed).
  const FIPS = {"beltrami":"27007","cass":"27021","clearwater":"27029","cook":"27031","crow-wing":"27035","goodhue":"27049","hennepin":"27053","houston":"27055","itasca":"27061","koochiching":"27071","lake":"27075","lyon":"27083","murray":"27101","olmsted":"27109","polk":"27119","ramsey":"27123","st-louis":"27137","winona":"27169"};

  function readItems(wrapClass) {
    const wrap = document.querySelector("." + wrapClass);
    if (!wrap) return [];
    return Array.from(wrap.querySelectorAll(".cms-item")).map(el => {
      const item = { ...el.dataset };
      el.querySelectorAll(".ref-list").forEach(rl => {
        item[rl.dataset.key] = Array.from(rl.querySelectorAll(".ref")).map(r => r.dataset.slug).filter(Boolean);
      });
      const photo = el.querySelector("img.photo");
      if (photo && photo.src) item.photo = photo.src;
      const area = el.querySelector(".area-svg");
      if (area) item.areaSvgHtml = area.innerHTML.trim();
      const boundary = el.querySelector(".boundary-svg");
      if (boundary) item.boundarySvgHtml = boundary.innerHTML.trim();
      // CMS Color fields can't bind to custom attributes, so read from a child
      // element whose background-color is bound to the Color field.
      const colorSrc = el.querySelector(".color-source");
      if (colorSrc) {
        const bg = getComputedStyle(colorSrc).backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") item.color = bg;
      }
      // Strip any "BIND -> ..." placeholder values so they don't pollute output
      Object.keys(item).forEach(k => {
        if (typeof item[k] === "string" && item[k].startsWith("BIND -> ")) delete item[k];
      });
      return item;
    });
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = () => rej(new Error('Failed: ' + src));
      document.head.appendChild(s);
    });
  }

  function init() {
    const canvas = document.getElementById("ltm-canvas");
    if (!canvas) {
      console.warn("[ltm] #ltm-canvas not found; aborting init");
      return;
    }

    // Build the SVG layer stack inside the canvas
    canvas.innerHTML = '<svg id="ltm-svg" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid meet">' +
      '<defs><clipPath id="ltm-mn-clip"><path id="ltm-mn-clip-path"></path></clipPath></defs>' +
      '<g class="ltm-layer ltm-layer-outline"></g>' +
      '<g class="ltm-layer ltm-layer-biomes" clip-path="url(#ltm-mn-clip)"></g>' +
      '<g class="ltm-layer ltm-layer-regions hidden" clip-path="url(#ltm-mn-clip)"></g>' +
      '<g class="ltm-layer ltm-layer-counties hidden"></g>' +
      '<g class="ltm-layer ltm-layer-locations-areas" clip-path="url(#ltm-mn-clip)"></g>' +
      '<g class="ltm-layer ltm-layer-properties"></g>' +
      '<g class="ltm-layer ltm-layer-locations"></g></svg>';

    const stats = readItems("cms-statistics");
    const biomes = readItems("cms-biomes");
    const habitats = readItems("cms-habitats");
    const regions = readItems("cms-regions");
    const counties = readItems("cms-counties");
    const properties = readItems("cms-properties");
    const locations = readItems("cms-locations");

    const byKey = a => Object.fromEntries(a.map(d => [d.slug, d]));
    const I = { stats: byKey(stats), biomes: byKey(biomes), habitats: byKey(habitats), regions: byKey(regions), counties: byKey(counties) };

    // Rebuild the sidebar with granular toggles (Boundary layers / Properties / Locations / Habitat filter)
    const sidebar = document.getElementById("ltm-sidebar");
    if (sidebar) {
      sidebar.innerHTML = `
        <div class="ltm-section">
          <h3>Boundary layers</h3>
          <label><input type="checkbox" data-layer="biomes" checked><span class="swatch area" style="background:#5b7a2f"></span> Biomes</label>
          <label><input type="checkbox" data-layer="regions"><span class="swatch area" style="background:#185fa5"></span> Regions</label>
          <label><input type="checkbox" data-layer="counties"><span class="swatch area" style="background:#cfc8b6"></span> Counties</label>
        </div>
        <div class="ltm-section">
          <h3>Properties</h3>
          <label><input type="checkbox" data-toggle="property-public" checked><span class="swatch sq" style="background:#2c5f3f"></span> Public access</label>
          <label><input type="checkbox" data-toggle="property-private" checked><span class="swatch sq" style="background:#6f6a5e"></span> Private</label>
        </div>
        <div class="ltm-section">
          <h3>Locations</h3>
          <label><input type="checkbox" data-toggle="loc-city" checked><span class="swatch" style="background:#1f4f7a"></span> Cities</label>
          <label><input type="checkbox" data-toggle="loc-statepark" checked><span class="swatch" style="background:#639922"></span> State parks</label>
          <label><input type="checkbox" data-toggle="loc-staterec" checked><span class="swatch" style="background:#c99a3a"></span> State recreation areas</label>
          <label><input type="checkbox" data-toggle="loc-stateforest" checked><span class="swatch sq" style="background:#5b7a2f"></span> State forests</label>
          <label><input type="checkbox" data-toggle="loc-nationalpark" checked><span class="swatch sq" style="background:#993c1d"></span> National parks</label>
          <label><input type="checkbox" data-toggle="loc-nationalforest" checked><span class="swatch sq" style="background:#2c5f3f"></span> National forests</label>
        </div>
        <div class="ltm-section">
          <h3>Filter by habitat</h3>
          <select id="ltm-habitat-filter" multiple class="p3" style="width:100%;min-height:120px;padding:6px 8px;border:1px solid #d8d3c4;border-radius:6px;background:white"></select>
        </div>`;
    }
    const habitatSelect = document.getElementById("ltm-habitat-filter");
    if (habitatSelect) {
      habitats.sort((a,b) => (+a["sort-order"]||0) - (+b["sort-order"]||0)).forEach(h => {
        const opt = document.createElement("option");
        opt.value = h.slug; opt.textContent = h.name;
        habitatSelect.appendChild(opt);
      });
    }

    // Tooltip element (single, reused)
    const tooltip = document.createElement("div");
    tooltip.className = "ltm-tooltip";
    tooltip.innerHTML = '<p class="ltm-tt-name p2"></p><p class="ltm-tt-type p3"></p>';
    document.body.appendChild(tooltip);
    const ttName = tooltip.querySelector(".ltm-tt-name");
    const ttType = tooltip.querySelector(".ltm-tt-type");
    function showTooltip(name, type, evt) {
      ttName.textContent = name || "";
      ttType.textContent = type || "";
      tooltip.classList.add("show");
      moveTooltip(evt);
    }
    function moveTooltip(evt) {
      tooltip.style.left = (evt.clientX + window.scrollX + 14) + "px";
      tooltip.style.top = (evt.clientY + window.scrollY + 14) + "px";
    }
    function hideTooltip() { tooltip.classList.remove("show"); }

    Promise.all([
      loadScript("https://cdn.jsdelivr.net/npm/d3@7"),
      loadScript("https://cdn.jsdelivr.net/npm/topojson-client@3")
    ]).then(() =>
      d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json")
    ).then(us => {
      const allG = us.objects.counties.geometries;
      const mnG = allG.filter(g => String(g.id).startsWith("27"));
      const mnFC = topojson.feature(us, { type: "GeometryCollection", geometries: mnG });
      const geomByFips = new Map(mnG.map(g => [String(g.id), g]));
      const svg = d3.select("#ltm-svg");
      const projection = d3.geoAlbers().fitSize([800, 900], mnFC);
      const path = d3.geoPath(projection);
      const slugByFips = Object.fromEntries(Object.entries(FIPS).map(([s,f]) => [f,s]));

      // MN outline as base + clip-path source
      const mnUnion = topojson.merge(us, mnG);
      const mnOutlineD = path(mnUnion);
      svg.select(".ltm-layer-outline").selectAll("path").data([mnOutlineD]).join("path").attr("d", d => d);
      const clipPath = document.getElementById("ltm-mn-clip-path");
      if (clipPath) clipPath.setAttribute("d", mnOutlineD);

      svg.select(".ltm-layer-counties").selectAll("path")
        .data(mnFC.features).join("path")
          .attr("d", path).attr("data-fips", d => d.id)
          .attr("data-slug", d => slugByFips[String(d.id)] || "")
          .classed("in-cms", d => !!I.counties[slugByFips[String(d.id)]])
          .on("click", function (e, d) {
            const it = I.counties[slugByFips[String(d.id)]];
            if (it) showDetail("County", it, ["regions","biomes","habitats"]);
          });

      function mergeForGroup(slugs) {
        const geoms = slugs.map(s => FIPS[s]).filter(Boolean).map(f => geomByFips.get(f)).filter(Boolean);
        return geoms.length ? topojson.merge(us, geoms) : null;
      }
      const countiesIn = (k, s) => counties.filter(c => (c[k]||[]).includes(s)).map(c => c.slug);
      const extractD = h => { if (!h) return null; const m = h.match(/d="([^"]+)"/); return m ? m[1] : null; };

      const BIOME_GEOM = {
        "tallgrass-aspen-parklands": {type:"Polygon",coordinates:[[
          [-97.2,49.0],[-96.6,49.0],[-95.1,49.4],[-94.7,49.0],
          [-94.6,48.5],[-94.9,48.0],[-95.2,47.7],[-95.4,47.5],
          [-95.8,47.4],[-96.4,47.3],[-97.0,47.2],[-97.2,47.5],[-97.2,49.0]
        ]]},
        "laurentian-mixed-forest": {type:"Polygon",coordinates:[[
          [-94.7,49.0],[-94.0,49.4],[-92.5,49.4],[-91.0,49.0],[-89.5,48.4],
          [-89.5,48.0],[-89.8,47.7],[-90.4,47.5],[-91.0,47.1],
          [-91.4,46.8],[-92.0,46.7],[-92.5,46.4],[-93.0,46.1],[-93.5,46.1],
          [-94.0,45.9],[-94.4,46.1],[-94.6,46.5],[-95.0,46.9],[-95.4,47.5],
          [-95.2,47.7],[-94.9,48.0],[-94.6,48.5],[-94.7,49.0]
        ]]},
        "prairie-parkland": {type:"Polygon",coordinates:[[
          [-97.2,47.5],[-97.0,47.2],[-96.4,47.3],[-95.8,47.4],
          [-95.4,47.5],[-95.0,46.9],[-94.6,46.5],[-94.4,46.0],
          [-94.4,45.5],[-94.6,45.0],[-94.4,44.5],[-94.7,44.0],
          [-94.5,43.5],[-96.5,43.5],[-97.2,43.5],[-97.2,47.5]
        ]]},
        "eastern-broadleaf-forest": {type:"Polygon",coordinates:[[
          [-94.5,43.5],[-91.2,43.5],[-91.2,43.7],[-91.8,44.0],
          [-92.6,44.6],[-92.5,45.0],[-92.3,45.5],[-91.8,46.0],
          [-91.4,46.8],[-92.0,46.7],[-92.5,46.4],[-93.0,46.1],
          [-93.5,46.1],[-94.0,45.9],[-94.4,46.1],[-94.6,46.5],
          [-94.4,46.0],[-94.4,45.5],[-94.6,45.0],[-94.4,44.5],
          [-94.7,44.0],[-94.5,43.5]
        ]]}
      };
      svg.select(".ltm-layer-biomes").selectAll("path")
        .data(biomes
          .map(b => {
            const customD = extractD(b.boundarySvgHtml);
            const geom = BIOME_GEOM[b.slug];
            return customD ? { b, customD } : (geom ? { b, geom } : null);
          })
          .filter(Boolean))
        .join("path")
          .attr("d", d => d.customD || path(d.geom))
          .attr("fill", d => d.b.color || "#2c5f3f")
          .attr("data-slug", d => d.b.slug)
          .on("click", (e, d) => showDetail("Biome", d.b, ["stats"]));

      svg.select(".ltm-layer-regions").selectAll("path")
        .data(regions.map(r => ({ r, f: mergeForGroup(countiesIn("regions", r.slug)) })).filter(d => d.f))
        .join("path")
          .attr("d", d => path(d.f)).attr("fill", d => d.r.color || "#185fa5")
          .on("click", (e, d) => showDetail("Region", d.r, ["stats"]));

      const project = (lat, lng) => { const la = +lat, ln = +lng; if (isNaN(la) || isNaN(ln)) return null; const p = projection([ln, la]); return p && !isNaN(p[0]) && !isNaN(p[1]) ? { x: p[0], y: p[1] } : null; };

      function attachHover(sel, label, getType) {
        sel.on("mouseenter", function(e, d) { showTooltip(d.name || d.slug, label + (getType && getType(d) ? " — " + getType(d) : ""), e); })
           .on("mousemove", moveTooltip)
           .on("mouseleave", hideTooltip);
      }

      svg.select(".ltm-layer-properties").selectAll("rect")
        .data(properties.filter(p => project(p.lat, p.lng))).join("rect")
          .attr("x", d => project(d.lat, d.lng).x - 5).attr("y", d => project(d.lat, d.lng).y - 5)
          .attr("width", 10).attr("height", 10)
          .classed("private", d => /private/i.test(d.type || ""))
          .on("click", (e, d) => showDetail("Property", d, ["habitats","biomes"]))
          .call(attachHover, "Property", d => d.type);

      const POINT = ["City","State park","State recreation area"];
      const AREA = ["State forest","National park","National forest"];
      const tcss = t => (t || "").toLowerCase().replace(/\s+/g, "");

      svg.select(".ltm-layer-locations").selectAll("circle.marker")
        .data(locations.filter(l => POINT.includes(l.type) && project(l.lat, l.lng))).join("circle")
          .attr("class", d => "marker " + tcss(d.type))
          .attr("cx", d => project(d.lat, d.lng).x).attr("cy", d => project(d.lat, d.lng).y).attr("r", 4)
          .on("click", (e, d) => showDetail("Location", d, ["habitats","biomes"]))
          .call(attachHover, "Location", d => d.type);

      const areaLocs = locations.filter(l => AREA.includes(l.type));
      svg.select(".ltm-layer-locations-areas").selectAll("path")
        .data(areaLocs.filter(l => extractD(l.areaSvgHtml))).join("path")
          .attr("class", d => "area " + tcss(d.type)).attr("d", d => extractD(d.areaSvgHtml))
          .on("click", (e, d) => showDetail("Location", d, ["habitats","biomes"]))
          .call(attachHover, "Location", d => d.type);
      svg.select(".ltm-layer-locations").selectAll("circle.fallback")
        .data(areaLocs.filter(l => !extractD(l.areaSvgHtml) && project(l.lat, l.lng))).join("circle")
          .attr("class", d => "marker fallback " + tcss(d.type))
          .attr("cx", d => project(d.lat, d.lng).x).attr("cy", d => project(d.lat, d.lng).y).attr("r", 4)
          .on("click", (e, d) => showDetail("Location", d, ["habitats","biomes"]))
          .call(attachHover, "Location", d => d.type);

      document.querySelectorAll('input[data-layer]').forEach(input => {
        input.addEventListener("change", () => {
          const sel = ".ltm-layer-" + input.dataset.layer;
          document.querySelectorAll(sel).forEach(g => g.classList.toggle("hidden", !input.checked));
        });
        input.dispatchEvent(new Event("change"));
      });

      // Type-specific toggles use a CSS class on #ltm-svg to hide matching markers/areas
      const svgEl = document.getElementById("ltm-svg");
      document.querySelectorAll('input[data-toggle]').forEach(input => {
        input.addEventListener("change", () => {
          svgEl.classList.toggle("hide-" + input.dataset.toggle, !input.checked);
        });
        input.dispatchEvent(new Event("change"));
      });

      function applyFilters() {
        const sel = habitatSelect ? Array.from(habitatSelect.selectedOptions).map(o => o.value) : [];
        const passes = (it, k) => !sel.length || sel.some(s => (it[k]||[]).includes(s));
        svg.selectAll(".ltm-layer-properties rect").classed("ltm-dimmed", d => !passes(d, "habitats"));
        svg.selectAll(".ltm-layer-locations .marker").classed("ltm-dimmed", d => !passes(d, "habitats"));
        svg.selectAll(".ltm-layer-locations-areas .area").classed("ltm-dimmed", d => !passes(d, "habitats"));
      }
      if (habitatSelect) habitatSelect.addEventListener("change", applyFilters);

      const URL_PATTERNS = { Region: "/regions/", County: "/counties/", Property: "/property/", Location: "/locations/", Biome: "/biomes/", Habitat: "/habitats/", Statistic: "/statistics/" };

      function showDetail(kind, item, refKeys) {
        const detail = document.getElementById("ltm-detail"); if (!detail) return;
        const refsHtml = (refKeys || []).map(k => {
          const slugs = item[k]; if (!slugs || !slugs.length) return "";
          const lookup = I[k] || {};
          const names = slugs.map(s => (lookup[s] || {}).name || s).join(", ");
          return `<p><strong>${k[0].toUpperCase()+k.slice(1)}:</strong> ${names}</p>`;
        }).join("");
        const statsHtml = (item.stats && item.stats.length)
          ? `<div class="stats">${item.stats.map(s => { const st = I.stats[s]; if (!st) return ""; return `<div class="stat"><p class="v p1">${st.value || ""}</p><p class="l p3">${st.name || ""}${st.unit?(" — "+st.unit):""}</p></div>`; }).join("")}</div>` : "";
        const pattern = URL_PATTERNS[kind];
        const ctaHtml = (pattern && item.slug) ? `<a class="ltm-cta" href="${pattern}${item.slug}">Learn more</a>` : "";
        detail.innerHTML = `<p class="kicker p3">${kind}</p><h2>${item.name || item.slug}</h2>${item.summary ? `<p>${item.summary}</p>` : ""}${item.acreage ? `<p><strong>Acreage:</strong> ${(+item.acreage).toLocaleString()} acres</p>` : ""}${item.type ? `<p><strong>Type:</strong> ${item.type}</p>` : ""}${refsHtml}${statsHtml}${item.photo ? `<img src="${item.photo}" alt="">` : ""}${ctaHtml}`;
      }
    }).catch(err => {
      console.error("[ltm]", err);
      const det = document.getElementById("ltm-detail");
      if (det) det.innerHTML = '<p class="ltm-empty">Map data failed to load. Check the browser console.</p>';
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
