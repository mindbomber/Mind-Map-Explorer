
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { MindMapNode, MindMapLink } from '../types';

interface GraphViewProps {
  nodes: MindMapNode[];
  links: MindMapLink[];
  onNodeClick: (node: MindMapNode) => void;
  isLoading: boolean;
}

const GraphView: React.FC<GraphViewProps> = ({ nodes, links, onNodeClick, isLoading }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous content

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Initial positioning if nodes are new
    nodes.forEach(node => {
      if (node.x === undefined) node.x = width / 2 + (Math.random() - 0.5) * 100;
      if (node.y === undefined) node.y = height / 2 + (Math.random() - 0.5) * 100;
    });

    // Create simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(80));

    simulationRef.current = simulation;

    // Draw links
    const link = g.append("g")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2);

    // Draw nodes
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => onNodeClick(d))
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    // Node circles (background)
    node.append("rect")
      .attr("rx", 10)
      .attr("ry", 10)
      .attr("x", d => - (d.label.length * 5 + 20))
      .attr("y", -20)
      .attr("width", d => d.label.length * 10 + 40)
      .attr("height", 40)
      .attr("fill", d => d.depth === 0 ? "#3b82f6" : "#1e293b")
      .attr("stroke", d => d.depth === 0 ? "#60a5fa" : "#3b82f6")
      .attr("stroke-width", 2);

    // Node labels
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("fill", "white")
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .text(d => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, links, onNodeClick]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center pointer-events-none transition-opacity">
          <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-400 font-medium animate-pulse">Expanding Consciousness...</p>
          </div>
        </div>
      )}
      {!nodes.length && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 flex-col gap-4">
          <i className="fa-solid fa-brain text-6xl opacity-20"></i>
          <p className="text-xl">Enter a word to start your journey</p>
        </div>
      )}
    </div>
  );
};

export default GraphView;
