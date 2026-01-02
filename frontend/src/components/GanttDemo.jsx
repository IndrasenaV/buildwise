import { useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'

export default function GanttDemo() {
  const containerRef = useRef(null)
  const [width, setWidth] = useState(960)
  const [scale, setScale] = useState('month') // 'week' | 'month'
  const [showCritical, setShowCritical] = useState(true)

  // Mock tasks (self-contained)
  const tasks = useMemo(() => {
    const today = new Date()
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    function addDays(date, days) {
      const d = new Date(date)
      d.setDate(d.getDate() + days)
      return d
    }
    return [
      {
        id: 'site',
        text: 'Site Preparation',
        start: addDays(base, 0),
        durationDays: 5,
        progress: 0.4,
        baselineStart: addDays(base, -1),
        baselineDurationDays: 4,
        deps: []
      },
      {
        id: 'foundation',
        text: 'Foundation',
        start: addDays(base, 6),
        durationDays: 6,
        progress: 0.2,
        baselineStart: addDays(base, 5),
        baselineDurationDays: 6,
        deps: ['site']
      },
      {
        id: 'framing',
        text: 'Framing',
        start: addDays(base, 13),
        durationDays: 9,
        progress: 0.1,
        baselineStart: addDays(base, 12),
        baselineDurationDays: 9,
        deps: ['foundation']
      },
      {
        id: 'roof',
        text: 'Roofing',
        start: addDays(base, 23),
        durationDays: 5,
        progress: 0.0,
        baselineStart: addDays(base, 22),
        baselineDurationDays: 5,
        deps: ['framing']
      },
      {
        id: 'windows',
        text: 'Windows & Doors',
        start: addDays(base, 24),
        durationDays: 7,
        progress: 0.0,
        baselineStart: addDays(base, 23),
        baselineDurationDays: 7,
        deps: ['framing']
      },
      {
        id: 'mep',
        text: 'MEP Rough-ins',
        start: addDays(base, 31),
        durationDays: 10,
        progress: 0.0,
        baselineStart: addDays(base, 30),
        baselineDurationDays: 10,
        deps: ['framing']
      },
    ]
  }, [])

  // Compute timeline extents
  const timeline = useMemo(() => {
    if (!tasks.length) {
      const now = new Date()
      return { start: now, end: new Date(now.getTime() + 7 * 86400000) }
    }
    const starts = tasks.map(t => t.start.getTime())
    const ends = tasks.map(t => new Date(t.start.getTime() + Math.max(1, t.durationDays) * 86400000).getTime())
    const min = Math.min(...starts)
    const max = Math.max(...ends)
    // Add padding on both sides
    const pad = 3 * 86400000
    return { start: new Date(min - pad), end: new Date(max + pad) }
  }, [tasks])

  // Layout constants
  const leftColWidth = 220
  const rowHeight = 28
  const rowGap = 8
  const headerHeight = 36
  const contentWidth = Math.max(400, (width || 800) - leftColWidth - 16)

  function daysBetween(a, b) {
    const ms = b.getTime() - a.getTime()
    return Math.max(0, Math.floor(ms / 86400000))
  }

  const totalDays = Math.max(1, daysBetween(timeline.start, timeline.end))
  const dayWidth = (() => {
    // Heuristic: month scale shows more days with smaller width; week scale makes days wider
    const base = contentWidth / totalDays
    if (scale === 'week') return Math.max(16, base * 1.6)
    return Math.max(8, Math.min(32, base)) // month default range
  })()

  const gridWidth = Math.max(200, Math.floor(totalDays * dayWidth))
  const chartHeight = tasks.length * (rowHeight + rowGap) + headerHeight + 16

  // Build maps for dependencies and compute critical path (longest path by duration)
  const criticalSet = useMemo(() => {
    const byId = new Map(tasks.map(t => [t.id, t]))
    const indeg = new Map(tasks.map(t => [t.id, 0]))
    const adj = new Map(tasks.map(t => [t.id, []]))
    for (const t of tasks) {
      const deps = Array.isArray(t.deps) ? t.deps : []
      for (const p of deps) {
        if (!byId.has(p)) continue
        adj.get(p).push(t.id)
        indeg.set(t.id, (indeg.get(t.id) || 0) + 1)
      }
    }
    // Topological order
    const q = []
    for (const [id, deg] of indeg.entries()) if (deg === 0) q.push(id)
    const order = []
    while (q.length) {
      const n = q.shift()
      order.push(n)
      for (const v of adj.get(n)) {
        indeg.set(v, indeg.get(v) - 1)
        if (indeg.get(v) === 0) q.push(v)
      }
    }
    // Longest path DP
    const dist = new Map()
    const prev = new Map()
    for (const id of order) {
      const node = byId.get(id)
      const dur = Math.max(1, node.durationDays || 1)
      if (!Array.isArray(node.deps) || node.deps.length === 0) {
        dist.set(id, dur)
        prev.set(id, null)
      } else {
        let best = -Infinity
        let bestPred = null
        for (const p of node.deps) {
          const cand = (dist.get(p) || 0) + dur
          if (cand > best) {
            best = cand
            bestPred = p
          }
        }
        dist.set(id, best)
        prev.set(id, bestPred)
      }
    }
    // Find sink with max dist
    let endId = null
    let endDist = -Infinity
    for (const [id, d] of dist.entries()) {
      if (d > endDist) {
        endDist = d
        endId = id
      }
    }
    // Reconstruct path
    const path = new Set()
    let cur = endId
    let safety = 0
    while (cur && safety < 100) {
      path.add(cur)
      cur = prev.get(cur)
      safety++
    }
    return path
  }, [tasks])

  // Build ticks depending on scale
  const ticks = useMemo(() => {
    const list = []
    const start = new Date(timeline.start)
    const end = timeline.end
    if (scale === 'week') {
      // One tick per 7 days
      let d = new Date(start)
      let idx = 0
      while (d <= end) {
        list.push({ date: new Date(d), label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) })
        d = new Date(d.getTime() + 7 * 86400000)
        if (++idx > 1000) break
      }
    } else {
      // Month scale: tick at each Monday (or 1st of month if you prefer)
      let d = new Date(start)
      // move to next Monday
      while (d.getDay() !== 1) d = new Date(d.getTime() + 86400000)
      let idx = 0
      while (d <= end) {
        list.push({ date: new Date(d), label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) })
        d = new Date(d.getTime() + 7 * 86400000)
        if (++idx > 1000) break
      }
    }
    return list
  }, [timeline.start, timeline.end, scale])

  function xForDate(d) {
    const days = daysBetween(timeline.start, d)
    return leftColWidth + Math.floor(days * dayWidth)
  }

  // Resize observer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width)
        if (Number.isFinite(w) && w > 0) setWidth(w)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const todayX = xForDate(new Date())

  return (
    <Box ref={containerRef} sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Gantt</Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={scale}
          onChange={(_e, v) => { if (v) setScale(v) }}
        >
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
        </ToggleButtonGroup>
        <FormControlLabel
          control={<Switch size="small" checked={showCritical} onChange={(_e, v) => setShowCritical(v)} />}
          label={<Typography variant="caption">Critical path</Typography>}
        />
      </Stack>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'auto' }}>
        <svg width={leftColWidth + gridWidth} height={chartHeight} style={{ display: 'block', background: 'transparent' }}>
          <defs>
            <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 z" fill="#ef5350" />
            </marker>
          </defs>
          {/* Header background */}
          <rect x="0" y="0" width={leftColWidth + gridWidth} height={headerHeight} fill="rgba(255,255,255,0.04)" />
          {/* Left column divider */}
          <line x1={leftColWidth} y1={0} x2={leftColWidth} y2={chartHeight} stroke="rgba(255,255,255,0.12)" />

          {/* Time ticks and vertical grid */}
          {ticks.map((t, i) => {
            const x = xForDate(t.date)
            return (
              <g key={`tick-${i}`}>
                <line x1={x} y1={headerHeight} x2={x} y2={chartHeight} stroke="rgba(255,255,255,0.08)" />
                <text x={x + 4} y={headerHeight - 12} fill="#9aa4c7" fontSize="11">{t.label}</text>
              </g>
            )
          })}

          {/* Today marker */}
          <line x1={todayX} y1={0} x2={todayX} y2={chartHeight} stroke="#ff6b6b" strokeDasharray="4,3" />
          <text x={todayX + 4} y={12} fill="#ff6b6b" fontSize="11">Today</text>

          {/* Rows and labels */}
          {tasks.map((task, idx) => {
            const y = headerHeight + idx * (rowHeight + rowGap)
            // Label area
            return (
              <g key={task.id}>
                <text x={12} y={y + rowHeight * 0.7} fill="#e6ebff" fontSize="12">{task.text}</text>
              </g>
            )
          })}

          {/* Bars */}
          {tasks.map((task, idx) => {
            const startX = xForDate(task.start)
            const y = headerHeight + idx * (rowHeight + rowGap) + 4
            const w = Math.max(6, Math.floor(task.durationDays * dayWidth))
            const isCritical = criticalSet.has(task.id)
            const barColor = isCritical && showCritical ? '#ef5350' : '#42a5f5'
            const progressW = Math.floor(w * Math.max(0, Math.min(1, task.progress || 0)))
            return (
              <g key={`bar-${task.id}`}>
                {/* Track */}
                <rect
                  x={startX}
                  y={y}
                  width={w}
                  height={rowHeight - 8}
                  rx="3"
                  ry="3"
                  fill={isCritical && showCritical ? 'rgba(239,83,80,0.22)' : 'rgba(66,165,245,0.24)'}
                  stroke={isCritical && showCritical ? '#ef5350' : 'transparent'}
                  strokeWidth={isCritical && showCritical ? 1 : 0}
                />
                {/* Progress */}
                <rect x={startX} y={y} width={progressW} height={rowHeight - 8} rx="3" ry="3" fill={barColor} />
              </g>
            )
          })}

          {/* Critical path connectors (L-shaped) */}
          {showCritical && tasks.map((task) => {
            const deps = Array.isArray(task.deps) ? task.deps : []
            return deps.map((p) => {
              if (!criticalSet.has(task.id) || !criticalSet.has(p)) return null
              const toIdx = tasks.findIndex(t => t.id === task.id)
              const fromIdx = tasks.findIndex(t => t.id === p)
              if (toIdx < 0 || fromIdx < 0) return null
              const fromTask = tasks[fromIdx]
              const toTask = tasks[toIdx]
              const fromStartX = xForDate(fromTask.start)
              const fromW = Math.max(6, Math.floor(fromTask.durationDays * dayWidth))
              const fromY = headerHeight + fromIdx * (rowHeight + rowGap) + 4 + (rowHeight - 8) / 2
              const toStartX = xForDate(toTask.start)
              const toY = headerHeight + toIdx * (rowHeight + rowGap) + 4 + (rowHeight - 8) / 2
              const x1 = fromStartX + fromW
              const midX = x1 + 12
              const x2 = toStartX
              const points = `${x1},${fromY} ${midX},${fromY} ${midX},${toY} ${x2},${toY}`
              return (
                <polyline
                  key={`cp-${p}->${task.id}`}
                  points={points}
                  fill="none"
                  stroke="#ef5350"
                  strokeWidth="1.5"
                  markerEnd="url(#arrow-red)"
                />
              )
            })
          })}
        </svg>
      </Box>
    </Box>
  )
}


