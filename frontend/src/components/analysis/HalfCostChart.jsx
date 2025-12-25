import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

/**
 * Half-circle cost chart (semi-donut) showing relative cost contributions.
 * props:
 * - data: [{ label, value, color }]
 * - width, height: numbers (defaults 560x200)
 */
export default function HalfCostChart({ data = [], width = 560, height = 200 }) {
  const ref = useRef(null)

  useEffect(() => {
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()

    const margin = { top: 8, right: 16, bottom: 8, left: 16 }
    const w = width - margin.left - margin.right
    const h = height - margin.top - margin.bottom
    const radius = Math.min(w, h * 2) / 2
    const innerRadius = radius * 0.6

    const root = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2},${height - margin.bottom})`)

    const total = d3.sum(data, d => Math.max(0, Number(d.value || 0)))
    const arcs = d3.pie()
      .startAngle(-Math.PI / 1) // -180deg
      .endAngle(0)              // 0deg -> half circle
      .value(d => Math.max(0, Number(d.value || 0)))
      .padAngle(0.01)
      (data)

    const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius)

    root.selectAll('path')
      .data(arcs)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color || '#90caf9')
      .append('title')
      .text((d) => `${d.data.label}: ${formatCurrency(d.data.value)} (${formatPct(total ? d.data.value / total : 0)})`)

    // center labels: total
    root.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.4em')
      .style('font-weight', 700)
      .style('font-size', '14px')
      .text('Estimated cost')

    root.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .style('font-size', '16px')
      .text(formatCurrency(total))

    // legend at top-left
    const legend = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
    const entries = data.filter(d => Number(d.value) > 0)
    const itemH = 18
    legend.selectAll('rect').data(entries).enter().append('rect')
      .attr('x', 0).attr('y', (d, i) => i * itemH).attr('width', 12).attr('height', 12)
      .attr('fill', d => d.color || '#90caf9')
    legend.selectAll('text').data(entries).enter().append('text')
      .attr('x', 18).attr('y', (d, i) => i * itemH + 10)
      .style('font-size', '12px')
      .text(d => `${d.label}: ${formatCurrency(d.value)} (${formatPct(total ? d.value / total : 0)})`)
  }, [data, width, height])

  return <svg ref={ref} style={{ width: '100%', height }} />
}

function formatCurrency(n) {
  const v = Number(n || 0)
  return `$${Math.round(v).toLocaleString()}`
}
function formatPct(x) {
  return `${Math.round((Number(x || 0) * 100))}%`
}


