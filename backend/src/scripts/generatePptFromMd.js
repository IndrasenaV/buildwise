/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

function resolveFromRepoRoot(p) {
  if (!p) return null
  if (path.isAbsolute(p)) return p
  // backend/src/scripts -> repo root is ../../..
  const repoRoot = path.resolve(__dirname, '../../..')
  return path.resolve(repoRoot, p)
}

function parseMarkdown(mdText) {
  const lines = mdText.split(/\r?\n/)
  const slides = []
  let current = null
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    // Titles start with "## "
    if (line.startsWith('## ')) {
      if (current) slides.push(current)
      current = { title: line.replace(/^##\s+/, '').trim(), bullets: [] }
      continue
    }
    // Bullets start with "- "
    if (line.startsWith('- ')) {
      if (!current) {
        current = { title: '', bullets: [] }
      }
      current.bullets.push(line.replace(/^-+\s*/, '').trim())
      continue
    }
    // "Screenshot:" lines -> add as italic bullet placeholder
    if (/^screenshot:/i.test(line)) {
      if (!current) {
        current = { title: '', bullets: [] }
      }
      current.bullets.push(`(screenshot) ${line.replace(/^screenshot:\s*/i, '')}`)
      continue
    }
  }
  if (current) slides.push(current)
  return slides
}

async function run() {
  const inArg = process.argv[2] || 'docs/ai-capability-buildwise-showcase.md'
  const outArg = process.argv[3] || 'docs/ai-capability-buildwise-showcase.pptx'
  const inPath = resolveFromRepoRoot(inArg)
  const outPath = resolveFromRepoRoot(outArg)

  if (!fs.existsSync(inPath)) {
    console.error(`Input markdown not found: ${inPath}`)
    process.exit(1)
  }

  let PptxGenJS
  try {
    PptxGenJS = require('pptxgenjs')
  } catch (e) {
    console.error('pptxgenjs is not installed. Run:')
    console.error('  npm --prefix backend install pptxgenjs')
    console.error('Then re-run:')
    console.error('  npm --prefix backend run build:ppt')
    process.exit(1)
  }

  const md = fs.readFileSync(inPath, 'utf8')
  const slides = parseMarkdown(md)

  const pptx = new PptxGenJS()
  pptx.author = 'BuildWise'
  pptx.company = 'BuildWise'
  pptx.revision = '1'
  pptx.layout = 'LAYOUT_16x9'

  const titleSlide = slides[0] || { title: 'AI Product Showcase', bullets: [] }
  pptx.addSlide().addText(titleSlide.title || 'AI Product Showcase', {
    x: 0.5, y: 1.5, w: 9, h: 1, fontSize: 36, bold: true
  })

  const bodySlides = slides.slice(1)
  for (const s of bodySlides) {
    const slide = pptx.addSlide()
    if (s.title) {
      slide.addText(s.title, { x: 0.5, y: 0.5, w: 9, h: 0.6, fontSize: 28, bold: true })
    }
    if (Array.isArray(s.bullets) && s.bullets.length) {
      // Split bullets if they are too long
      const items = []
      for (const b of s.bullets) {
        if (b.length > 120) {
          const chunks = b.match(/.{1,110}(\s|$)/g) || [b]
          items.push(...chunks.map((c, i) => (i === 0 ? c.trim() : `… ${c.trim()}`)))
        } else {
          items.push(b)
        }
      }
      const textRuns = items.map((t) => ({ text: String(t) }))
      slide.addText(textRuns, {
        x: 0.75, y: 1.2, w: 8.5, h: 4.5, fontSize: 18, bullet: true, lineSpacingMultiple: 1.1
      })
    }
  }

  await pptx.writeFile({ fileName: outPath })
  console.log(`PPTX created: ${outPath}`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})


