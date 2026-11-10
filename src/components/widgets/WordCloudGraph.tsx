import React, { useEffect, useRef } from "react";
import { Typography, Box } from "@mui/material";
import * as d3 from "d3";

type Word = { text: string; value: number };

type Props = {
  words: Word[];
  width: number;
  height: number;
  question?: string;
  questionFontSize?: number | string;
};

interface CloudWord extends Word {
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

export default function WordCloudGraph({
  words,
  width,
  height,
  question,
  questionFontSize = "18px",
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || words.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    // Color palette (matching your original)
    const colors = [
      "#e79727",
      "#78b7e5",
      "#acd6f2",
      "#4f86b5",
      "#5f7286",
      "#ffffff",
    ];

    // Use actual SVG dimensions for calculations
    const svgHeight = height - 40;
    const svgWidth = width;

    // Calculate font sizes based on word values and container size
    const maxValue = Math.max(...words.map((w) => w.value));
    const minValue = Math.min(...words.map((w) => w.value));
    const minFontSize = Math.min(16, svgHeight / 20);
    const maxFontSize = Math.min(svgHeight / 4, svgWidth / 10);

    // Create font size scale
    const fontScale = d3
      .scaleLinear()
      .domain([minValue, maxValue])
      .range([minFontSize, maxFontSize]);

    // Simple grid-based layout (alternative to complex cloud algorithms)
    const processedWords: CloudWord[] = words.map((word, i) => ({
      ...word,
      x: 0,
      y: 0,
      fontSize: fontScale(word.value),
      color: colors[i % colors.length],
    }));

    // Simple spiral placement algorithm - use actual SVG dimensions
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    const placedWords: CloudWord[] = [];

    processedWords.forEach((word, index) => {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;

      // Try center first for largest words
      if (index === 0) {
        word.x = centerX;
        word.y = centerY;
        placedWords.push(word);
        return;
      }

      // Spiral outward to find placement
      while (!placed && attempts < maxAttempts) {
        const angle = attempts * 0.5;
        const radius = attempts * 8;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        // Simple bounds check using actual SVG dimensions
        if (x > 50 && x < svgWidth - 50 && y > 30 && y < svgHeight - 30) {
          // Simple collision detection (basic bounding box)
          const textWidth = word.text.length * word.fontSize * 0.6;
          const textHeight = word.fontSize;

          let collision = false;
          for (const placed of placedWords) {
            const placedWidth = placed.text.length * placed.fontSize * 0.6;
            const placedHeight = placed.fontSize;

            if (
              Math.abs(x - placed.x) < (textWidth + placedWidth) / 2 + 10 &&
              Math.abs(y - placed.y) < (textHeight + placedHeight) / 2 + 5
            ) {
              collision = true;
              break;
            }
          }

          if (!collision) {
            word.x = x;
            word.y = y;
            placed = true;
            placedWords.push(word);
          }
        }
        attempts++;
      }

      // Fallback: place randomly if spiral fails
      if (!placed) {
        word.x = Math.random() * (svgWidth - 100) + 50;
        word.y = Math.random() * (svgHeight - 60) + 30;
        placedWords.push(word);
      }
    });

    // Render the words
    svg
      .selectAll("text")
      .data(placedWords)
      .enter()
      .append("text")
      .attr("x", (d: CloudWord) => d.x)
      .attr("y", (d: CloudWord) => d.y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-family", "Impact, Arial Black, sans-serif")
      .attr("font-weight", "700")
      .attr("font-size", (d: CloudWord) => `${d.fontSize}px`)
      .attr("fill", (d: CloudWord) => d.color)
      .text((d: CloudWord) => d.text)
      .style("cursor", "default")
      .on("mouseover", function (this: Element) {
        d3.select(this).attr("opacity", 0.7);
      })
      .on("mouseout", function (this: Element) {
        d3.select(this).attr("opacity", 1);
      });
  }, [words, width, height]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        maxWidth: width,
        maxHeight: height,
      }}
    >
      <Typography
        variant="subtitle2"
        textAlign="center"
        sx={{
          mb: 1,
          fontWeight: 600,
          flexShrink: 0,
          color: "#ffffff",
          fontSize: questionFontSize,
        }}
      >
        {question || "Keywords"}
      </Typography>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        <svg
          ref={svgRef}
          width={width}
          height={height - 40}
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        />
      </Box>
    </Box>
  );
}
