import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

/**
 * Horizontal cost range bar from min -> max with markers.
 * props:
 * - minLabel, minValue
 * - maxLabel, maxValue
 * - currentValue (optional)
 * - budgetValue (optional)
 * - width, height (defaults 640 x 90)
 */
export default function RangeCostBar({
  minLabel = 'Min',
  minValue = 0,
  maxLabel = 'Max',
  maxValue = 0,
  currentValue = null,
  budgetValue = null,
  width = 640,
  height = 90,
}) {
  const ref = useRef(null)

  useEffect(() => {
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()

    const margin = { top: 12, right: 16, bottom: 24, left: 16 }
    const w = width - margin.left - margin.right
    const h = height - margin.top - margin.bottom

    const root = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const min = Number(minValue || 0)
    const max = Number(maxValue || 0)
    const domainMin = Math.min(min, max)
    const domainMax = Math.max(min, max) || 1
    const x = d3.scaleLinear().domain([domainMin, domainMax]).range([0, w]).nice()

    // Bar background
    root.append('rect')
      .attr('x', 0)
      .attr('y', h / 2 - 8)
      .attr('width', w)
      .attr('height', 16)
      .attr('rx', 8)
      .attr('fill', 'rgba(144,202,249,0.25)')

    // Labels at ends
    root.append('text')
      .attr('x', 0)
      .attr('y', h / 2 - 12)
      .style('font-size', '11px')
      .text(`${minLabel}: ${formatCurrency(min)}`)
    root.append('text')
      .attr('x', w)
      .attr('y', h / 2 - 12)
      .attr('text-anchor', 'end')
      .style('font-size', '11px')
      .text(`${maxLabel}: ${formatCurrency(max)}`)

    // Markers
    const markers = []
    if (currentValue !== null && currentValue !== undefined) {
      markers.push({ key: 'current', value: Number(currentValue), color: '#42a5f5', label: `Current ${formatCurrency(currentValue)}` })
    }
    if (budgetValue !== null && budgetValue !== undefined) {
      markers.push({ key: 'budget', value: Number(budgetValue), color: '#66bb6a', label: `Budget ${formatCurrency(budgetValue)}` })
    }

    for (const m of markers) {
      const px = x(Math.max(domainMin, Math.min(domainMax, m.value)))
      // line
      root.append('line')
        .attr('x1', px).attr('x2', px)
        .attr('y1', h / 2 - 12).attr('y2', h / 2 + 12)
        .attr('stroke', m.color).attr('stroke-width', 2).attr('opacity', 0.9)
      // dot
      root.append('circle')
        .attr('cx', px).attr('cy', h / 2)
        .attr('r', 4).attr('fill', m.color)
      // label
      root.append('text')
        .attr('x', px)
        .attr('y', h)
        .attr('text-anchor', px < w * 0.85 ? 'start' : 'end')
        .style('font-size', '11px')
        .text(m.label)
    }
  }, [minLabel, minValue, maxLabel, maxValue, currentValue, budgetValue, width, height])

  return <svg ref={ref} style={{ width: '100%', height }} />
}

function formatCurrency(n) {
  const v = Number(n || 0)
  return `$${Math.round(v).toLocaleString()}`
}


