import {
  CountryData,
  CountryFeature,
  MapWidgetProps,
} from "@/interfaces/DashboardProps";
import { Box, Typography } from "@mui/material";
import * as d3 from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import { feature, GeoJsonFeature } from "topojson-client";
import { GeometryCollection, Topology } from "topojson-specification";
import * as worldData from "world-atlas/countries-110m.json";
import countryCodeMap from "../../assets/countryCodeMap";
import { countryColorsById } from "../../assets/countryColors";
import { getCountryCoordinates } from "../../utils/countryCoordinates";
import { getCountryCodeFromName } from "../../utils/countryNameMapping";
import { createISOToNumericMap } from "../../utils/mapHelpers";

// MAP ZOOM CONFIGURATION
// Adjust this value to control zoom level:
// - Negative values = more zoomed in
// - Positive values = more zoomed out
const MAP_ZOOM_OFFSET = 40;

// --- Helper functions extracted outside the component ---

function resolveCountryCode(label: string): string | undefined {
  let countryCode = countryCodeMap[label];

  // If exact match not found, try case-insensitive lookup in countryCodeMap
  if (!countryCode) {
    const normalizedLabel = label.toLowerCase().trim();
    const matchingKey = Object.keys(countryCodeMap).find(
      (key) => key.toLowerCase().trim() === normalizedLabel,
    );
    if (matchingKey) {
      countryCode = countryCodeMap[matchingKey];
    }
  }

  // Try the countryNameMapping helper as final fallback
  if (!countryCode) {
    const code = getCountryCodeFromName(label);
    if (code) countryCode = code;
  }

  if (!countryCode) {
    console.warn(`Country not found in any mapping: "${label}"`);
  }

  return countryCode;
}

function buildCountryData(labels: string[], values: number[]): CountryData {
  const countryData: CountryData = {};
  labels.forEach((label, index) => {
    const value = values[index] ?? 0;
    if (value <= 0) return;
    const countryCode = resolveCountryCode(label);
    if (countryCode) {
      countryData[countryCode] = {
        name: label,
        value,
      };
    }
  });
  return countryData;
}

function getThemeColors(theme: "classic" | "dark") {
  return theme === "dark"
    ? {
        background: "var(--abwe-blue-dark)",
        land: "#5f7286",
        landMuted: "#566a7d",
        dataFill: "#78b7e5",
        stroke: "#3a4b60",
        pole: "#e6f1ff",
        flagBorder: "#233246",
        badge: "var(--abwe-gold)",
        tooltipBg: "rgba(0, 21, 47, 0.92)",
        tooltipBorder: "rgba(120, 183, 229, 0.4)",
      }
    : {
        background: "transparent",
        land: "#e0e0e0",
        landMuted: "#e0e0e0",
        dataFill: "#e0e0e0",
        stroke: "#ffffff",
        pole: "#333",
        flagBorder: "#333",
        badge: "#dc004e",
        tooltipBg: "rgba(0, 0, 0, 0.8)",
        tooltipBorder: "transparent",
      };
}

function renderAllFlags(
  pinGroup: any,
  countryData: CountryData,
  projection: d3.GeoProjection,
  flagWidth: number,
  flagHeight: number,
  pinScale: number,
  themeColors: ReturnType<typeof getThemeColors>,
  tileOffsets: number[],
) {
  // Clear existing flags
  pinGroup.selectAll(".flag-group").remove();

  tileOffsets.forEach((xOffset) => {
    Object.entries(countryData).forEach(([countryCode, data]) => {
      const coords = getCountryCoordinates(countryCode);
      if (!coords) return;

      const projected = projection(coords);
      if (!projected) return;

      const [x, y] = projected;
      const adjustedX = x + xOffset;

      // Create a container group for both pole and flag
      const flagContainer = pinGroup
        .append("g")
        .attr("class", "flag-group")
        .attr("data-country", countryCode)
        .attr("data-x", adjustedX)
        .attr("data-y", y);

      // Flag pole (vertical line)
      flagContainer
        .append("line")
        .attr("x1", adjustedX)
        .attr("y1", y)
        .attr("x2", adjustedX)
        .attr("y2", y - flagHeight - 5)
        .attr("stroke", themeColors.pole)
        .attr("stroke-width", 2)
        .attr("vector-effect", "non-scaling-stroke")
        .style("cursor", "pointer");

      // Flag as foreignObject with flag emoji/SVG
      const flagGroup = flagContainer.append("g").style("cursor", "pointer");

      // Flag background rectangle with border
      flagGroup
        .append("rect")
        .attr("x", adjustedX)
        .attr("y", y - flagHeight - 5)
        .attr("width", flagWidth)
        .attr("height", flagHeight)
        .attr("fill", "#fff")
        .attr("stroke", themeColors.flagBorder)
        .attr("stroke-width", 1)
        .attr("vector-effect", "non-scaling-stroke")
        .attr("rx", 2);

      // Flag using foreignObject to embed image
      flagGroup
        .append("foreignObject")
        .attr("x", adjustedX + 2)
        .attr("y", y - flagHeight - 3)
        .attr("width", flagWidth - 4)
        .attr("height", flagHeight - 4)
        .html(`<img src="https://flagcdn.com/w2560/${countryCode.toLowerCase()}.png"
               style="width: 100%; height: 100%; object-fit: cover; border-radius: 1px;"
               alt="${countryCode}" />`);

      // Number badge on the flag
      const fontSize = Math.max(10, pinScale / 15);
      flagGroup
        .append("circle")
        .attr("cx", adjustedX + flagWidth - 8)
        .attr("cy", y - flagHeight - 5 + 8)
        .attr("r", 10)
        .attr("fill", themeColors.badge)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("vector-effect", "non-scaling-stroke");

      flagGroup
        .append("text")
        .attr("class", "badge-text")
        .attr("x", adjustedX + flagWidth - 8)
        .attr("y", y - flagHeight - 5 + 8)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", `${Math.min(fontSize, 10)}px`)
        .attr("font-weight", "bold")
        .attr("fill", "#ffffff")
        .attr("pointer-events", "none")
        .text(data.value);

      // Add tooltip to flag group
      flagGroup
        .on("mouseover", function (this: Element, event: Event) {
          d3.select(this).attr("opacity", 0.8);

          const mouseEvent = event as MouseEvent;
          d3.select("body")
            .append("div")
            .attr("class", "map-tooltip")
            .style("position", "absolute")
            .style("background", themeColors.tooltipBg)
            .style("color", "#fff")
            .style("padding", "8px 12px")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("border", `1px solid ${themeColors.tooltipBorder}`)
            .style("pointer-events", "none")
            .style("opacity", 1)
            .style("z-index", 1000)
            .html(
              `<strong>${data.name}</strong><br/>Participants: ${data.value}`,
            )
            .style("left", mouseEvent.pageX + 10 + "px")
            .style("top", mouseEvent.pageY - 28 + "px");
        })
        .on("mousemove", function (this: Element, event: Event) {
          const mouseEvent = event as MouseEvent;
          d3.selectAll(".map-tooltip")
            .style("left", mouseEvent.pageX + 10 + "px")
            .style("top", mouseEvent.pageY - 28 + "px");
        })
        .on("mouseout", function (this: Element) {
          d3.select(this).attr("opacity", 1);
          d3.selectAll(".map-tooltip").remove();
        });
    });
  });
}

// --- Component ---

export default function WorldMapGraph({
  question,
  labels,
  values,
  width,
  height,
  enableZoom = false,
  flagScale = 1,
  center,
  zoom,
  theme = "classic",
  titleFontSize,
  persistKey,
}: MapWidgetProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Refs to persist D3 state across effects
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const pinScaleRef = useRef<number>(0);
  const isoToTopoIdRef = useRef<Record<string, string>>({});
  const tileOffsetsRef = useRef<number[]>([]);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<
    SVGSVGElement,
    unknown
  > | null>(null);
  const zoomTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const mapBuiltRef = useRef(false);

  const titleRef = useRef<HTMLDivElement>(null);
  const [titleHeight, setTitleHeight] = useState(0);

  useEffect(() => {
    if (!titleRef.current) return;

    const updateTitleHeight = () => {
      if (titleRef.current) {
        setTitleHeight(titleRef.current.getBoundingClientRect().height);
      }
    };

    const ro = new ResizeObserver(updateTitleHeight);
    ro.observe(titleRef.current);
    updateTitleHeight();

    return () => ro.disconnect();
  }, [question]);

  // Create a stable key from labels and values to detect actual data changes
  const dataKey = useMemo(() => {
    return JSON.stringify({ labels, values });
  }, [labels, values]);

  // ─── Effect 1: BUILD ───
  // Builds projection, country paths, glow filters, tiles, zoom behavior.
  // Does NOT depend on labels/values — only on size/scale/theme.
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    mapBuiltRef.current = false;

    const themeColors =
      theme === "dark"
        ? {
            background: "rgba(0, 0, 0, 0)",
            land: "#5f7286",
            landMuted: "#566a7d",
            dataFill: "#78b7e5",
            stroke: "#3a4b60",
            pole: "#e6f1ff",
            flagBorder: "#233246",
            badge: "var(--abwe-gold)",
            tooltipBg: "rgba(0, 21, 47, 0.92)",
            tooltipBorder: "rgba(120, 183, 229, 0.4)",
          }
        : {
            background: "transparent",
            land: "#e0e0e0",
            landMuted: "#e0e0e0",
            dataFill: "#e0e0e0",
            stroke: "#ffffff",
            pole: "#333",
            flagBorder: "#333",
            badge: "#dc004e",
            tooltipBg: "rgba(0, 0, 0, 0.8)",
            tooltipBorder: "transparent",
          };

    if (themeColors.background !== "transparent") {
      svg.style("background", themeColors.background);
    }

    const titleGap = question ? 8 : 0;
    const svgHeight = Math.max(0, height - titleHeight - titleGap);

    // Use actual SVG dimensions
    const svgWidth = width;

    // Convert TopoJSON to GeoJSON
    const countries = feature(
      worldData as unknown as Topology,
      (worldData as any).objects.countries as GeometryCollection,
    );

    // Filter out Antarctica (id: 010) to allow more zoom on populated continents
    const countriesWithoutAntarctica = {
      ...countries,
      features: countries.features.filter(
        (d: GeoJsonFeature) => d.id !== "010",
      ),
    };

    // Use Natural Earth projection for wider middle, narrower poles (globe-like)
    const padding = 10;
    const projection = d3.geoNaturalEarth1().fitExtent(
      [
        [padding, padding],
        [svgWidth - padding, svgHeight - padding],
      ],
      countriesWithoutAntarctica,
    );

    // Apply zoom offset
    const currentScale = projection.scale();
    const baseScale = currentScale - MAP_ZOOM_OFFSET;
    projection.scale(baseScale);

    // Calculate bounds for positioning
    const bounds = d3
      .geoPath()
      .projection(projection)
      .bounds(countriesWithoutAntarctica);
    const mapHeight = bounds[1][1] - bounds[0][1];
    const mapWidth = bounds[1][0] - bounds[0][0];

    // Center vertically for initial view
    const verticalOffset = (svgHeight - mapHeight) / 2 - bounds[0][1];
    const [tx, ty] = projection.translate();
    projection.translate([tx, ty + verticalOffset]);
    // If center prop is provided AND enableZoom is false, translate the map to center on that point
    // When enableZoom is true, we let the user freely drag/zoom without prop interference
    if (center && !enableZoom) {
      // Project the center coordinates to get pixel position
      const centerPixels = projection([center.lng, center.lat]);
      if (centerPixels) {
        const [centerX, centerY] = centerPixels;
        const [tx, ty] = projection.translate();

        // Calculate how much to move to center this point
        const targetX = svgWidth / 2;
        const targetY = svgHeight / 2;
        const offsetX = targetX - centerX;
        const offsetY = targetY - centerY;

        projection.translate([tx + offsetX, ty + offsetY]);
      }
    } else if (!enableZoom) {
      // Center the map vertically in the available space (only if center not provided and not interactive)
      const verticalOffset = (svgHeight - mapHeight) / 2 - bounds[0][1];
      const [tx, ty] = projection.translate();
      projection.translate([tx, ty + verticalOffset]);
    } else {
      // When enableZoom is true, just center for initial view
      const offsetX = (svgWidth - mapWidth) / 2 - bounds[0][0];
      const offsetY = (svgHeight - mapHeight) / 2 - bounds[0][1];
      const [tx, ty] = projection.translate();
      projection.translate([tx + offsetX, ty + offsetY]);

      // Final correction pass to ensure true visual centering
      const centeredBounds = d3
        .geoPath()
        .projection(projection)
        .bounds(countriesWithoutAntarctica);
      const centeredWidth = centeredBounds[1][0] - centeredBounds[0][0];
      const centeredHeight = centeredBounds[1][1] - centeredBounds[0][1];
      const adjustX = (svgWidth - centeredWidth) / 2 - centeredBounds[0][0];
      const centerBiasX = -24;
      const centerBiasY = -12;
      const adjustY = (svgHeight - centeredHeight) / 2 - centeredBounds[0][1];
      const [cx, cy] = projection.translate();
      projection.translate([
        cx + adjustX + centerBiasX,
        cy + adjustY + centerBiasY,
      ]);
    }

    const path = d3.geoPath().projection(projection);

    // Store projection and pin scale in refs
    projectionRef.current = projection;
    pinScaleRef.current = projection.scale();
    isoToTopoIdRef.current = createISOToNumericMap();

    // Create glow filter for selected countries
    if (theme === "dark") {
      const defs = svg.append("defs");
      const filter = defs
        .append("filter")
        .attr("id", "country-glow")
        .attr("height", "200%")
        .attr("width", "200%")
        .attr("x", "-50%")
        .attr("y", "-50%");

      filter
        .append("feDropShadow")
        .attr("dx", 0)
        .attr("dy", 0)
        .attr("stdDeviation", 1.5)
        .attr("flood-color", "#78b7e5")
        .attr("flood-opacity", 0.45);
    }

    // Create main group for zoom transformations
    const mainGroup = svg.append("g").attr("class", "map-container");

    // Get map bounds for tiling
    const tileBounds = d3
      .geoPath()
      .projection(projection)
      .bounds(countriesWithoutAntarctica);
    const tileMapWidth = tileBounds[1][0] - tileBounds[0][0];

    // Create multiple tiles for infinite scrolling effect (render 3 copies: left, center, right)
    const tiles = enableZoom ? [-1, 0, 1] : [0];
    tileOffsetsRef.current = tiles.map((t) => t * mapWidth);

    tiles.forEach((tileOffset) => {
      const tileGroup = mainGroup
        .append("g")
        .attr("class", `tile-${tileOffset}`);
      const xOffset = tileOffset * tileMapWidth;

      // Draw countries — initially all muted (data update effect will color them)
      tileGroup
        .append("g")
        .attr("transform", `translate(${xOffset}, 0)`)
        .selectAll("path")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("d", path as (d: CountryFeature) => string | null)
        .attr("class", "country-path")
        .attr("data-id", (d: CountryFeature) => (d.id ? String(d.id) : ""))
        .attr("fill", themeColors.landMuted)
        .attr("stroke", themeColors.stroke)
        .attr("stroke-width", 0.5)
        .attr("vector-effect", "non-scaling-stroke")
        .attr("opacity", 0.7);
    });

    // Create pin group
    mainGroup.append("g").attr("class", "pins");

    // Render initial flags from current data
    const countryData = buildCountryData(labels, values);
    const pinScale = pinScaleRef.current;
    const flagWidth = (pinScale / 4) * flagScale;
    const flagHeight = flagWidth * 0.75;
    const pinGroup = mainGroup.select(".pins");

    renderAllFlags(
      pinGroup,
      countryData,
      projection,
      flagWidth,
      flagHeight,
      pinScale,
      themeColors,
      tileOffsetsRef.current,
    );

    // Update country colors for initial data
    const countriesWithData = new Set<string>();
    Object.keys(countryData).forEach((isoCode) => {
      const topoId = isoToTopoIdRef.current[isoCode];
      if (topoId) countriesWithData.add(topoId);
    });

    mainGroup
      .selectAll<SVGPathElement, CountryFeature>(".country-path")
      .each(function () {
        const el = d3.select(this);
        const countryId = el.attr("data-id") || "";
        if (countriesWithData.has(countryId)) {
          el.attr(
            "fill",
            theme === "dark"
              ? themeColors.dataFill
              : countryColorsById[countryId] || themeColors.land,
          )
            .attr("filter", theme === "dark" ? "url(#country-glow)" : null)
            .attr("opacity", 0.95);
        }
      });

    // Add zoom and pan functionality if enabled
    if (enableZoom) {
      const mapHeight = tileBounds[1][1] - tileBounds[0][1];
      let storedTransform: d3.ZoomTransform | null = null;

      if (persistKey) {
        const raw = localStorage.getItem(`world-map-transform-${persistKey}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as {
              x?: number;
              y?: number;
              k?: number;
              xNorm?: number;
              yNorm?: number;
            };
            if (typeof parsed.k === "number") {
              const xValue =
                typeof parsed.xNorm === "number"
                  ? parsed.xNorm * svgWidth
                  : typeof parsed.x === "number"
                    ? parsed.x
                    : 0;
              const yValue =
                typeof parsed.yNorm === "number"
                  ? parsed.yNorm * svgHeight
                  : typeof parsed.y === "number"
                    ? parsed.y
                    : 0;
              storedTransform = d3.zoomIdentity
                .translate(xValue, yValue)
                .scale(parsed.k);
            }
          } catch {
            // Ignore invalid cached transforms
          }
        }
      }

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 8])
        .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          let transform = event.transform;

          const scaledMapHeight = mapHeight * transform.k;
          const maxVerticalPan = scaledMapHeight * 0.5;

          const clampedY = Math.max(
            -maxVerticalPan,
            Math.min(maxVerticalPan, transform.y),
          );

          // Implement horizontal wrapping for infinite loop
          // Account for zoom scale so wrapping works at any zoom level
          const scaledMapWidth = tileMapWidth * transform.k;
          let wrappedX = transform.x % scaledMapWidth;

          if (wrappedX > scaledMapWidth / 2) {
            wrappedX -= scaledMapWidth;
          } else if (wrappedX < -scaledMapWidth / 2) {
            wrappedX += scaledMapWidth;
          }

          const constrainedTransform = d3.zoomIdentity
            .translate(wrappedX, clampedY)
            .scale(transform.k);

          mainGroup.attr("transform", constrainedTransform.toString());
          zoomTransformRef.current = constrainedTransform;

          if (persistKey) {
            const xNorm = svgWidth > 0 ? constrainedTransform.x / svgWidth : 0;
            const yNorm =
              svgHeight > 0 ? constrainedTransform.y / svgHeight : 0;
            localStorage.setItem(
              `world-map-transform-${persistKey}`,
              JSON.stringify({
                xNorm,
                yNorm,
                k: constrainedTransform.k,
              }),
            );
          }

          // Apply inverse scaling to flags so they maintain constant size
          const inverseScale = 1 / transform.k;
          pinGroup.selectAll(".flag-group").each(function (this: Element) {
            const flagX = parseFloat(d3.select(this).attr("data-x") || "0");
            const flagY = parseFloat(d3.select(this).attr("data-y") || "0");
            d3.select(this).attr(
              "transform",
              `translate(${flagX}, ${flagY}) scale(${inverseScale}) translate(${-flagX}, ${-flagY})`,
            );
          });
        });

      zoomBehaviorRef.current = zoom;
      svg.call(zoom);

      if (storedTransform) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        svg.call((zoom as any).transform, storedTransform);
      }

      // Set cursor to indicate map is draggable
      svg.style("cursor", "grab");
      svg.on("mousedown.cursor", function (this: Element) {
        d3.select(this).style("cursor", "grabbing");
      });
      svg.on("mouseup.cursor", function (this: Element) {
        d3.select(this).style("cursor", "grab");
      });
    } else {
      zoomBehaviorRef.current = null;
    }

    mapBuiltRef.current = true;

    // Cleanup tooltip on unmount
    return () => {
      d3.selectAll(".map-tooltip").remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, flagScale, theme, enableZoom]);

  // ─── Effect 2: DATA UPDATE ───
  // Runs when labels/values change. Updates flags in-place using
  // enter/update/exit. Does NOT touch SVG structure or zoom transform.
  useEffect(() => {
    if (!svgRef.current || !mapBuiltRef.current || !projectionRef.current)
      return;

    const svg = d3.select(svgRef.current);
    const mainGroup: any = svg.select(".map-container");
    const pinGroup: any = mainGroup.select(".pins");
    if (!pinGroup.node()) return;

    const projection = projectionRef.current;
    const pinScale = pinScaleRef.current;
    const themeColors = getThemeColors(theme);
    const flagWidth = (pinScale / 4) * flagScale;
    const flagHeight = flagWidth * 0.75;
    const countryData = buildCountryData(labels, values);

    // Re-render all flags (clear and rebuild flag groups only)
    renderAllFlags(
      pinGroup,
      countryData,
      projection,
      flagWidth,
      flagHeight,
      pinScale,
      themeColors,
      tileOffsetsRef.current,
    );

    // Update country path colors to reflect current data
    const countriesWithData = new Set<string>();
    Object.keys(countryData).forEach((isoCode) => {
      const topoId = isoToTopoIdRef.current[isoCode];
      if (topoId) countriesWithData.add(topoId);
    });

    (mainGroup as any).selectAll(".country-path").each(function (
      this: Element,
    ) {
      const el = d3.select(this);
      const countryId = el.attr("data-id") || "";
      if (countriesWithData.has(countryId)) {
        el.attr(
          "fill",
          theme === "dark"
            ? themeColors.dataFill
            : countryColorsById[countryId] || themeColors.land,
        )
          .attr("filter", theme === "dark" ? "url(#country-glow)" : null)
          .attr("opacity", 0.95);
      } else {
        el.attr("fill", themeColors.landMuted)
          .attr("filter", null)
          .attr("opacity", 0.7);
      }
    });

    // Re-apply current zoom transform to new flags so they have correct size
    if (enableZoom && zoomTransformRef.current) {
      const inverseScale = 1 / zoomTransformRef.current.k;
      pinGroup.selectAll(".flag-group").each(function (this: Element) {
        const flagX = parseFloat(d3.select(this).attr("data-x") || "0");
        const flagY = parseFloat(d3.select(this).attr("data-y") || "0");
        d3.select(this).attr(
          "transform",
          `translate(${flagX}, ${flagY}) scale(${inverseScale}) translate(${-flagX}, ${-flagY})`,
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey]);

  // ─── Effect 3: CENTER / ZOOM ───
  // Handles programmatic center/zoom prop changes.
  // Works for both enableZoom=true (via zoomBehaviorRef) and enableZoom=false (direct transform).
  useEffect(() => {
    if (!svgRef.current || !mapBuiltRef.current) return;

    const svg = d3.select(svgRef.current);
    const mainGroup: any = svg.select(".map-container");
    if (!(mainGroup as any).node()) return;

    // Calculate transform based on center and zoom props
    const titleGap = question ? 8 : 0;
    const svgWidth = width;
    const svgHeight = Math.max(0, height - titleHeight - titleGap);

    // Convert zoom prop (1-20) to scale multiplier
    const zoomMultiplier = zoom ? 1 + ((zoom - 1) / 19) * 4 : 1;

    let translateX = 0;
    let translateY = 0;

    let transform: d3.ZoomTransform | null = null;

    if (persistKey) {
      const raw = localStorage.getItem(`world-map-transform-${persistKey}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as {
            x?: number;
            y?: number;
            k?: number;
            xNorm?: number;
            yNorm?: number;
          };
          if (typeof parsed.k === "number") {
            const xValue =
              typeof parsed.xNorm === "number"
                ? parsed.xNorm * svgWidth
                : typeof parsed.x === "number"
                  ? parsed.x
                  : 0;
            const yValue =
              typeof parsed.yNorm === "number"
                ? parsed.yNorm * svgHeight
                : typeof parsed.y === "number"
                  ? parsed.y
                  : 0;
            transform = d3.zoomIdentity
              .translate(xValue, yValue)
              .scale(parsed.k);
          }
        } catch {
          // Ignore invalid cached transforms
        }
      }
    }

    if (!transform) {
      if (center) {
        // Rough conversion: lng maps to x, lat maps to y (inverted)
        // Center of map is roughly lng=0, lat=20
        translateX = -(center.lng - 0) * (svgWidth / 360) * zoomMultiplier;
        translateY = (center.lat - 20) * (svgHeight / 180) * zoomMultiplier;
      }

      transform = d3.zoomIdentity
        .translate(translateX, translateY)
        .scale(zoomMultiplier);
    }

    if (enableZoom && zoomBehaviorRef.current) {
      // Use D3's zoom.transform to keep internal state in sync
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      svg.call((zoomBehaviorRef.current as any).transform, transform);
    } else if (!enableZoom) {
      mainGroup.attr("transform", transform.toString());

      // Update flag sizes for new zoom level
      const pinGroup = mainGroup.select(".pins");
      const inverseScale = 1 / zoomMultiplier;
      pinGroup.selectAll(".flag-group").each(function (this: Element) {
        const flagX = parseFloat(d3.select(this).attr("data-x") || "0");
        const flagY = parseFloat(d3.select(this).attr("data-y") || "0");
        d3.select(this).attr(
          "transform",
          `translate(${flagX}, ${flagY}) scale(${inverseScale}) translate(${-flagX}, ${-flagY})`,
        );
      });
    }
    // Update flag sizes for new zoom level
    const pinGroup = mainGroup.select(".pins");
    const inverseScale = 1 / transform.k;
    pinGroup.selectAll(".flag-group").each(function (this: Element) {
      const flagX = parseFloat(d3.select(this).attr("data-x") || "0");
      const flagY = parseFloat(d3.select(this).attr("data-y") || "0");
      d3.select(this).attr(
        "transform",
        `translate(${flagX}, ${flagY}) scale(${inverseScale}) translate(${-flagX}, ${-flagY})`,
      );
    });
  }, [center, zoom, enableZoom, width, height]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height,
        maxWidth: width,
        position: "relative",
      }}
    >
      {question && (
        <Typography
          variant="subtitle1"
          textAlign="center"
          sx={{
            mb: 1,
            fontWeight: 600,
            flexShrink: 0,
            color: "#ffffff",
            fontSize: titleFontSize ?? "18px",
          }}
          ref={titleRef}
        >
          {question}
        </Typography>
      )}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          minHeight: 0,
        }}
      >
        <svg
          ref={svgRef}
          width={width}
          height={Math.max(0, height - titleHeight - (question ? 8 : 0))}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            background: "transparent",
          }}
        />
      </Box>
    </Box>
  );
}
