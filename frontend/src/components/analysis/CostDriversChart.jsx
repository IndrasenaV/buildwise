import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

/**
 * Grouped bar chart comparing project vs typical values for cost drivers.
 * props:
 * - data: [{ label, project, typical }]
 * - width, height: numbers (optional)
 */
export default function CostDriversChart({ data = [], width = 720, height = 280 }) {
  const ref = useRef(null)

  useEffect(() => {
    const margin = { top: 16, right: 16, bottom: 48, left: 56 }
    const w = width - margin.left - margin.right
    const h = height - margin.top - margin.bottom
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()
    const root = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const x0 = d3.scaleBand().domain(data.map(d => d.label)).range([0, w]).padding(0.2)
    const x1 = d3.scaleBand().domain(['project', 'typical']).range([0, x0.bandwidth()]).padding(0.2)
    const maxVal = d3.max(data.flatMap(d => [d.project, d.typical])) || 1
    const y = d3.scaleLinear().domain([0, maxVal * 1.15]).range([h, 0]).nice()

    const color = d3.scaleOrdinal().domain(['project', 'typical']).range(['#42a5f5', '#90caf9'])

    root.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x0))
      .selectAll('text')
      .style('font-size', '10px')
      .call((sel) => sel.each(function () {
        const t = d3.select(this)
        const full = t.text()
        if (full.length > 18) t.text(full.slice(0, 16) + '…')
      }))

    root.append('g').call(d3.axisLeft(y).ticks(5))

    const g = root.append('g')
    const s = g.selectAll('g.bar-group').data(data).enter().append('g')
      .attr('class', 'bar-group')
      .attr('transform', d => `translate(${x0(d.label)},0)`)

    s.selectAll('rect')
      .data(d => ([
        { key: 'project', value: d.project },
        { key: 'typical', value: d.typical },
      ]))
      .enter()
      .append('rect')
      .attr('x', d => x1(d.key))
      .attr('y', d => y(d.value))
      .attr('width', x1.bandwidth())
      .attr('height', d => h - y(d.value))
      .attr('fill', d => color(d.key))
      .append('title')
      .text(d => `${d.key}: ${d.value}`)

    // Legend
    const legend = root.append('g').attr('transform', `translate(${w - 140}, 0)`)
    const keys = ['project', 'typical']
    legend.selectAll('rect').data(keys).enter().append('rect')
      .attr('x', 0).attr('y', (d, i) => i * 18).attr('width', 12).attr('height', 12)
      .attr('fill', d => color(d))
    legend.selectAll('text').data(keys).enter().append('text')
      .attr('x', 18).attr('y', (d, i) => i * 18 + 10).text(d => d)
      .style('font-size', '12px')
  }, [data, width, height])

  return <svg ref={ref} style={{ width: '100%', height }} />
}


