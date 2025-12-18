import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

/**
 * Radar chart for functional scores (0..1)
 * props:
 * - scores: { key: number, ... }
 * - width, height
 */
export default function FunctionalRadar({ scores = {}, width = 360, height = 320 }) {
  const ref = useRef(null)
  useEffect(() => {
    const entries = Object.entries(scores || {})
    if (!entries.length) return
    const margin = { top: 16, right: 16, bottom: 16, left: 16 }
    const w = width - margin.left - margin.right
    const h = height - margin.top - margin.bottom
    const radius = Math.min(w, h) / 2
    const center = { x: margin.left + w / 2, y: margin.top + h / 2 }

    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()
    const root = svg.attr('viewBox', `0 0 ${width} ${height}`)

    const angle = d3.scaleLinear().domain([0, entries.length]).range([0, Math.PI * 2])
    const r = d3.scaleLinear().domain([0, 1]).range([0, radius])

    const grid = root.append('g').attr('transform', `translate(${center.x},${center.y})`)
    ;[0.25, 0.5, 0.75, 1].forEach(level => {
      grid.append('circle').attr('r', r(level)).attr('fill', 'none').attr('stroke', 'rgba(255,255,255,0.2)')
    })

    // Axes
    entries.forEach(([, value], i) => {
      const a = angle(i) - Math.PI / 2
      const x = Math.cos(a) * radius
      const y = Math.sin(a) * radius
      grid.append('line')
        .attr('x1', 0).attr('y1', 0).attr('x2', x).attr('y2', y)
        .attr('stroke', 'rgba(255,255,255,0.2)')
    })

    // Labels
    entries.forEach(([key], i) => {
      const a = angle(i) - Math.PI / 2
      const x = Math.cos(a) * (radius + 12)
      const y = Math.sin(a) * (radius + 12)
      root.append('text')
        .attr('x', center.x + x).attr('y', center.y + y)
        .attr('text-anchor', x >= 0 ? 'start' : 'end')
        .attr('alignment-baseline', 'middle')
        .style('font-size', '11px')
        .text(key)
    })

    // Polygon
    const points = entries.map(([_, v], i) => {
      const a = angle(i) - Math.PI / 2
      return [center.x + Math.cos(a) * r(v), center.y + Math.sin(a) * r(v)]
    })
    root.append('polygon')
      .attr('points', points.map(p => p.join(',')).join(' '))
      .attr('fill', '#42a5f544')
      .attr('stroke', '#42a5f5')
      .attr('stroke-width', 2)
  }, [scores, width, height])

  return <svg ref={ref} style={{ width: '100%', height }} />
}


