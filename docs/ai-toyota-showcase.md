## 1) AI Product Showcase — For Toyota

- Purpose: Demonstrate end-to-end AI capability across prompts, structured outputs, RAG, multimodal analysis, and UX.
- What you’ll see: Prompt Library, Deterministic Output Parser, Knowledge Center (OCR/PDF→Vectors), RAG, Rich Chat, Planning + Requirements, Context Engineering.
- Screenshot: Title/Architecture overview.


## 2) System Overview

- LLM Orchestration: LangChain with structured output enforcement.
- Deterministic Parsing: Zod schemas to guarantee JSON shape.
- Knowledge Center: OCR + PDF extraction → chunking → embeddings → vector index.
- RAG: Retrieve relevant chunks and sources; surface citations.
- Rich UI: Structured chat responses (tables/options/follow-ups); planning + budget flows.
- Screenshot: High-level architecture diagram.


## 3) Prompts Library

- Centralized prompt keys for consistent authoring and reuse per workflow/trade.
- Template variables and actions (analyze/compare/general) plugged into flows.
- Versionable and testable prompts; supports agent-specific context.
- Screenshot: Prompts admin/listing screen.


## 4) Deterministic Output Parser (Structured JSON)

- Zod + LangChain `withStructuredOutput` to enforce a strict schema.
- Fields are required by API contract; nullable/defaults used for optionality.
- Response schema includes: answer, comparisons (tables), options (cards), followUps, sources.
- Backward compatibility: normalization when legacy fields differ (e.g., arrays of strings vs objects).
- Screenshot: Code snippet of Zod schema and a rendered rich response.


## 5) Knowledge Center: OCR and PDF Extraction

- Multi-modal ingestion: PDFs (plans/specs) and images.
- OCR and parsing (incl. LlamaParse) → clean text + structural metadata.
- Chunking with metadata (home/trade/doc/page) for targeted retrieval and debugging.
- Stored in a vector index with embeddings for semantic search.
- Screenshot: Knowledge ingest log and document list.


## 6) Retrieval-Augmented Generation (RAG)

- Query-building from user prompt + selected documents/context.
- Retrieve top-k semantic chunks; pack context window with sources.
- Answers return citations; UI shows source titles/links.
- Screenshot: Chat response with sources; “View source” demo.


## 7) Customized Chat Window (Rich, Structured UI)

- Structured JSON → UI renders tables (comparisons), option cards (pros/cons/attributes/cost), and follow-up question chips.
- Event-driven UX: clicking follow-ups sends templated prompts; easy workflow chaining.
- Multimodal: Optionally include images/PDFs to improve accuracy for plan analysis.
- Screenshot: Chat UI with comparisons, options, and follow-ups.


## 8) Plan Analysis + Requirements Fusion

- Architecture Analysis: detect rooms, areas, and metadata from plans.
- Trade Planning (e.g., HVAC): zones, capacity (tons), cost ranges, brand guidance.
- Combine with explicit customer requirements to tailor options and recommendations.
- Screenshot: Planning screen showing detected rooms and HVAC recommendations.


## 9) Budget and Trade Financials

- Per-trade planned cost range (from planning) vs. actual price; bids/contracts/invoices tracking.
- Dedicated Budget page: bid comparison (PDFs), contracts upload, invoice management, payment status.
- Trade detail “3-step” header: Planning → Budget → Execution navigation.
- Screenshot: Budget overview and Trade Budget detail.


## 10) Context Engineering Methodology

- Intake: Collect user problem, goals, constraints, and available data.
- Feasibility: Validate if AI is the right tool; align on success metrics.
- Architecture: Models, retrieval (RAG), parsers, orchestration, guardrails.
- Implementation: Prompts + structured outputs + data pipelines + rich UX.
- Delivery: Evals, telemetry, cost controls, iteration loop.
- Screenshot: Method checklist.


## 11) Enterprise Readiness

- Observability: AI logs, prompts/outputs, latency/cost dashboards.
- Evals: Scenario-based tests for regressions in structured outputs and accuracy.
- Security/Privacy: Scoped data access, source tracking, PII handling options.
- Cost & Performance: Caching, retrieval tuning, structured output to reduce retries.
- Screenshot: Logs/evals dashboard mock.


## 12) Toyota Use-Case Alignment (Examples)

- Quality & Manufacturing: SOP retrieval, deviation analysis, checklists with structured outputs.
- Procurement & Vendor Bids: Side-by-side comparisons, requirement matching, lifecycle cost.
- Maintenance: Multimodal troubleshooting (images/manuals), recommended actions with confidence and sources.
- Metrics: Time-to-answer, citation coverage, task completion accuracy.
- Screenshot: Example comparison table tailored to Toyota processes.


## 13) Tech Stack Summary

- Backend: Node/Express, LangChain, Zod for structured outputs, Joi for REST validation.
- Knowledge: OCR/PDF parsing (incl. LlamaParse), vector index service for embeddings/RAG.
- Frontend: React + MUI; rich structured chat renderers; planning and budget UIs.
- Integrations: Event-driven prompts, multimodal analysis, bid comparison flows.
- Screenshot: Stack diagram.


## 14) Next Steps

- Select pilot scope and data sources; define KPIs and acceptance criteria.
- Configure ingestion and RAG domains; tailor prompts and schemas.
- Run evaluations; iterate on UX and guardrails; plan rollout.
- Screenshot: Project plan/timeline.


