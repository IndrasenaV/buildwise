# Loopway — Applied AI Product Portfolio  
### BuildWise (Construction Intelligence)  
### Nexsense (Smart-City Intelligence)

---

## BuildWise — AI-Enabled Construction Planning & Decision Assistant

BuildWise is an AI-driven platform that helps builders, planners, and trade partners move from **plans + requirements → structured decisions, options, and budgets** — with reliability, citations, and workflow continuity.

It demonstrates Loopway’s strength in:

- structured outputs  
- deterministic JSON contracts  
- multimodal plan analysis  
- retrieval-augmented reasoning  
- workflow-aware UX

---

## 1) Core AI Architecture

BuildWise uses a **structured AI orchestration stack** designed for predictable outputs:

- LangChain orchestration with schema-enforced responses  
- Zod-based deterministic structured JSON parsers  
- OCR + PDF parsing pipeline (plans, specs, images)  
- Metadata tagging (rooms, trades, sheets, levels)
- Chunking + embeddings for targeted retrieval
- Vector search for semantic relevance
- RAG with citations and evidence references

This ensures the system:

- returns **stable, machine-consumable outputs**
- supports **composable UI rendering**
- avoids free-form hallucinated responses
- integrates cleanly into planning & budget workflows

---

## 2) Knowledge Center & Multimodal Ingestion

BuildWise ingests:

- plans & blueprints (PDF)
- images and annotated markups
- trade documents
- customer requirements

Pipeline includes:

- OCR + LLM parsing  
- text normalization  
- structural metadata extraction  
- chunking by:
  - home / project
  - trade
  - sheet / page
  - region (when coordinates exist)

These chunks feed the **vector index**, enabling:

- high-precision retrieval  
- trade-specific context targeting  
- source-aware reasoning

---

## 3) Structured RAG Responses

When a user asks a question or runs an analysis:

1. Relevant chunks are retrieved  
2. Context is packed with sources  
3. The LLM returns **strict JSON** including:

- answer summary
- comparison tables
- option cards
- follow-up actions
- citations & document references

This supports:

- explainable decisions
- repeatable workflows
- auditable rationale

---

## 4) Plan Analysis + Requirements Fusion

BuildWise fuses:

- plan analysis results  
- customer-stated requirements  
- trade logic & domain knowledge

Examples:

- room & area detection  
- trade planning (HVAC zones / tonnage ranges)
- capacity guidance
- cost band estimation
- recommended configuration options

Outputs are packaged as:

- structured planning summary  
- per-trade breakdown  
- cost & execution guidance

---

## 5) Rich Structured Chat + Workflow UI

The chat experience renders **structured AI outputs**, including:

- comparison tables
- option cards (pros / cons / attributes / ranges)
- follow-up prompts as action chips
- planning → budgeting workflow transitions

Users can:

- refine decisions
- branch scenarios
- attach docs & plans
- move outputs into budgeting

BuildWise functions as a:

> **Planning + Knowledge + Structured Decision AI layer for construction workflows**

---

# 6) Agentic Automation via MCP (Model Context Protocol)

We use MCP to let AI agents reliably invoke external tools with clear, schema-defined contracts. This lets BuildWise move beyond “answering” into “doing” while preserving guardrails and observability.

What this enables in BuildWise:
- Browser automation for guided demos, data capture, and verification (Playwright MCP).
- Project-aware tools exposed as MCP (Buildwise MCP server) for first-class operations like home summaries, city docs by ZIP, and build tips.
- Declarative tool catalogs so assistants know exactly what they can do and how to call each tool (JSON schema).

Why MCP fits our architecture:
- Strong contracts: each tool declares a name, description, and strict input schema.
- Auditable: all tool calls are logged and can be replayed.
- Extensible: adding a new tool is a small, well-scoped change without changing the client.

## 6.1 Playwright MCP — Browser Automation
We register a Playwright MCP server so the assistant can:
- open/navigate pages
- click, fill, select, press keys
- capture screenshots/PDFs
- extract visible HTML/text

Uses in BuildWise:
- “Guided requirement questionnaire” demo flows (open, navigate, click, verify, screenshot) for clients.
- Smoke checks of key UI flows (e.g., upload plan → classify pages → open analysis).
- Fast interactive validation during sales demos.

Typical setup (in Cursor settings JSON):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@microsoft/playwright-mcp@latest"],
      "env": { "HEADLESS": "1", "PWDEBUG": "0" }
    }
  }
}
```

With this, the AI can use tools like `playwright_navigate`, `playwright_click`, `playwright_fill`, `playwright_screenshot`, `playwright_get_visible_html`, etc., to execute UI steps deterministically.

## 6.2 Buildwise MCP Server — Project-Aware Tools
We built a dedicated MCP server for BuildWise to expose domain tools:

- `home_summary` (DB-backed): returns a concise summary for a home (name, address, requirements, requirementsList, counts).
- `city_documents_by_zip`: returns known/stubbed permit/city docs for a ZIP (wire to live sources as needed).
- `building_tips`: topic-based tips (foundation, HVAC, daylight, etc.) for quick guidance.

Server layout:
- `server.js`: registers all tools; loads `.env`.
- `src/tools/*`: one file per tool (clean testability).
- `src/db.js`: Mongo connection helper (env-driven).
- `test/*`: unit/integration tests (vitest).

Local env:
- `.env` next to `server.js`:
  - `MONGODB_URI` (required)
  - `MONGODB_DB` (optional, derived from URI if unset)
  - `BUILDWISE_API_BASE` (optional)

Register in Cursor (example):

```json
{
  "mcpServers": {
    "buildwise-mcp": {
      "command": "node",
      "args": ["/Users/indra/buildwise/mcp/buildwise-mcp-server/server.js"],
      "env": { "NODE_ENV": "production" }
    }
  }
}
```

Example flows we enable:
- Requirements-driven analysis
  1) `home_summary` → fetch requirements (including tagged `requirementsList`).
  2) `playwright_navigate` to analysis and confirm UI reflects that context.
  3) `playwright_screenshot` to collect artifacts for demo/proof.
- City/permit check
  - `city_documents_by_zip` with the project ZIP to surface required forms/checklists and pin relevant docs to the home.
- Guidance
  - `building_tips` for targeted design/plan nudges (foundation/HVAC/daylight), feeding follow-ups and tasks.

## 6.3 Guardrails, Observability, and CI
- Each MCP tool declares strict JSON schemas. The assistant must satisfy these schemas to call tools.
- We log and can replay tool calls for traceability (who did what, when, with which inputs).
- Vitest-based tests cover all tools; a real-ID integration test validates DB-backed `home_summary` when `MONGODB_URI` is present.
- We keep browser runs headless in CI and enable `PWDEBUG` for local debugging.

Key takeaways for clients:
- MCP gives BuildWise a stable “action layer” — the assistant doesn’t just answer; it performs verifiable, contract-based operations.
- Playwright MCP and our Buildwise MCP server combine to bridge UI, data, and expert guidance with reliability.

---

# 🌆 Nexsense — Smart-City Digital Twin & Vision AI Intelligence Platform

Nexsense is a **smart-city operations intelligence platform** combining:

- Vision AI  
- IoT & sensor telemetry  
- crowd & traffic analytics  
- incident detection & correlation  
- AI-assisted operator workflows

Where BuildWise focuses on **plan intelligence**,  
Nexsense focuses on **city & infrastructure intelligence**.

---

## 1) Smart-City Data Fusion Core

Nexsense ingests:

- camera snapshots & detections
- incident clips
- IoT telemetry streams
- asset & zone metadata
- historical event logs

Data is normalized into:

- assets  
- zones  
- cameras  
- events  
- time-series traces

This powers:

- real-time situational awareness  
- correlation analysis  
- temporal pattern discovery

---

## 2) Vision AI Capabilities

Nexsense applies Vision AI for:

- crowd density estimation  
- queue & congestion analytics  
- pedestrian–vehicle interaction awareness  
- risk-zone monitoring  
- near-miss event detection  
- safety hazard indicators

Outputs include:

- event type
- confidence score
- affected assets / zones
- severity level
- recommended operator actions

---

## 3) GenAI-Driven Incident Intelligence

GenAI analyzes and contextualizes events:

- explains what happened  
- correlates across cameras + sensors  
- identifies contributing factors  
- recommends operational response paths

Structured outputs include:

- incident summary
- impacted locations / assets
- safety implications
- escalation recommendations
- source references (logs / detections / images)

This helps operators move from:

> **raw alerts → actionable understanding**

---

## 4) Timeline Replay & Historical Insight

Nexsense supports:

- event history timeline
- back-in-time navigation
- cross-sensor playback
- incident evolution tracking

Use cases:

- crowd movement reconstruction
- operations audit review
- safety & risk analysis
- “what changed over time” diagnostics

---

## 5) Operator-Focused AI UX

Outputs render as:

- structured incident summaries
- risk scoring cards
- correlation insight panels
- recommended playbooks
- one-click follow-up actions

The platform enables:

- faster response
- clearer decision-making
- safer operational outcomes

---

# Loopway Positioning

Together, **BuildWise** and **Nexsense** demonstrate Loopway’s expertise in:

- applied AI system design
- structured output engineering
- multimodal reasoning
- RAG & context fusion
- Vision AI + GenAI orchestration
- workflow-embedded intelligence
- enterprise-grade observability & guardrails

Loopway is positioned as:

> **an expert partner for designing, implementing, and operationalizing AI systems — not prototypes — but real, production-ready platforms.**
