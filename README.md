# STOCK INTELLIGENCE

> **AI-Powered Financial Research & Continuous Monitoring Platform**

`STOCK INTELLIGENCE` is an enterprise-grade financial research and continuous monitoring platform for **U.S. Stocks** and **U.S. Mutual Funds**. It is designed to act as a structured, evidence-based research assistant and real-time sentinel for investors, analysts, and wealth managers.

---

## 🎯 Core Product Mission

Existing AI financial tools often suffer from halluncinations, lack of verifiable source attribution, superficial chatbot interfaces, or unsupported "BUY/SELL" predictions.

**STOCK INTELLIGENCE** solves this by enforcing a strict **Supervisor + Specialist Agents + Evidence Checker** architecture:
- **Evidence-First Research**: Every financial insight, management assertion, segment breakdown, and scenario must be tied directly to Tier 1-3 primary sources (SEC filings, official press releases, audited financial reports).
- **Continuous Monitoring & Execution Tracking**: Tracks what management promised vs. what actually happened over time ("Management Execution Tracker").
- **No Unfounded Predictions**: Provides Bull, Base, and Bear scenarios with clear assumptions rather than fake target prices or speculative recommendations.
- **Dual Security Analysis Engine**: Separate analytical workflows for individual equities and mutual funds/ETFs.

---

## 📁 Phase 0 Specification Documents

| Document | Description |
| :--- | :--- |
| 📘 [`PRODUCT_SPEC.md`](file:///d:/DOCUMENT/in&out/NewAPP/PRODUCT_SPEC.md) | Complete product scope, functional requirements, navigation hierarchy, 15+ company tabs, screener specs, and reporting structures. |
| 🏗️ [`ARCHITECTURE.md`](file:///d:/DOCUMENT/in&out/NewAPP/ARCHITECTURE.md) | System topology, tech stack (Next.js, FastAPI, LangGraph, PostgreSQL/pgvector, Redis), and directory layouts. |
| 🗄️ [`DATABASE_SPEC.md`](file:///d:/DOCUMENT/in&out/NewAPP/DATABASE_SPEC.md) | PostgreSQL relational schema, vector database schema, indexing strategies, audit logging, and metadata design. |
| 🤖 [`AGENT_SPEC.md`](file:///d:/DOCUMENT/in&out/NewAPP/AGENT_SPEC.md) | LangGraph multi-agent supervisor graph, specialist agent specs, evidence checking, hallucination shields, and tool permissions. |
| 🔌 [`DATA_SOURCES.md`](file:///d:/DOCUMENT/in&out/NewAPP/DATA_SOURCES.md) | Provider abstraction adapters, 5-Tier source hierarchy, dispute resolution logic, freshness SLAs, and data fallback handling. |
| 🔒 [`SECURITY.md`](file:///d:/DOCUMENT/in&out/NewAPP/SECURITY.md) | RBAC model, authentication, API security, prompt injection defenses for external web/PDF content, and audit trails. |
| 🗺️ [`DEVELOPMENT_PLAN.md`](file:///d:/DOCUMENT/in&out/NewAPP/DEVELOPMENT_PLAN.md) | 31-Phase granular roadmap (Phase 0 to Phase 30), Definition of Done, evaluation thresholds, and risk matrix. |

---

## 🏗️ High-Level Architecture Overview

```text
                                 +-------------------------+
                                 |    Next.js 15 Web UI    |
                                 +------------+------------+
                                              |
                                              v
                                 +-------------------------+
                                 |   FastAPI Gateway API   |
                                 +------------+------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
      +------------------------------+                  +------------------------------+
      |      LangGraph Agent Engine  |                  |     Scheduled Monitoring     |
      | (Supervisor + 10 Specialists)|                  |    & Alerting Service        |
      +--------------+---------------+                  +--------------+---------------+
                     |                                                 |
        +------------+------------+                       +------------+------------+
        v                         v                       v                         v
+---------------+       +------------------+       +---------------+       +------------------+
| Market Data   |       | Web/Filing RAG   |       | PostgreSQL /  |       | Redis Cache      |
| Adapters      |       | Search Pipeline  |       | pgvector      |       | & Queue          |
+---------------+       +------------------+       +---------------+       +------------------+
```

---

## 🚦 Phase 0 Approval Status

- [x] Phase 0 Specifications Drafted
- [ ] Phase 0 Architecture Review & Approval
- [ ] Proceed to Phase 1 (Foundation Setup)
