## BuildWise Enhancements Proposal

### 1) Ingestion & RAG
- Trade ontologies to normalize terms across plans, specs, and invoices.
- Hybrid search (BM25 + embeddings) plus cross-encoders for reranking.
- Drawing diff between plan versions; surface scope deltas visually and in summaries.
- Provenance-first UI: source → chunk → answer lineage with quick previews.

### 2) Finance Automation
- Invoice OCR + line-item extraction; auto-map to trades/cost codes.
- Two-way sync with accounting (QuickBooks/Xero) and payment rails (Stripe/ACH).
- Variance alerts when actuals deviate from planned ranges; cashflow views.

### 3) Trade Productivity
- Submittal/spec synthesis with citations from vendor PDFs and plans.
- Schedule agent: propose durations and dependencies; reflow on delays.
- Vendor marketplace integration for structured bid intake and comparison.

### 4) Site and Quality
- Site photo CV checks (safety/completion); auto-generate punch lists with evidence.
- Phase-specific quality checklists with acceptance logs and sign-offs.

### 5) UX & Chat
- Source link previews, exportable artifacts (PDF/CSV), side-by-side model compare.
- One-click flows (“Explain my plan”, “What changed?”, “Summarize trade”).
- Per-trade dashboards with KPIs (budget adherence, schedule risk, QC status).

### 6) Observability & Governance
- Tracing (e.g., LangSmith) with cost/latency dashboards; cache hit rates; tool success ratios.
- Evals with golden sets; nightly regression runs; policy checks by tool scope.
- Tenant isolation, row-level security, secret management, and audit trails.

### 7) Performance & Cost
- Context/response caching; selective retrieval; adaptive truncation for long docs.
- Lightweight/on-device embeddings where feasible for local feature extraction.

### 8) MCP Tooling Roadmap
- Files: list/get/pin project docs; manage plan versions.
- Knowledge: semantic search; chunk-by-id for citations.
- Schedules: milestones CRUD; ICS export; resource calendars.
- Trades/Finance: tasks, quality checks, invoices, payments; bid ops.
- Contracts & Sign: upload, status, e-sign (DocuSign/Adobe).
- BIM/CAD: quantities from Revit/IFC via secure compute.
- Integrations: Procore/Buildertrend; city permit portals; weather data.


