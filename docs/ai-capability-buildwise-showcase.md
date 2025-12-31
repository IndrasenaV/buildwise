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
