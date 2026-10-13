# SYSTEM ARCHITECTURE SPECIFICATION — STOCK INTELLIGENCE

## 1. High-Level Technology Stack

```text
Frontend Framework  : Next.js 15 (App Router, React 19, TypeScript)
UI & Styling        : Tailwind CSS v4, Lucide Icons, Radix UI / shadcn/ui primitives
Data Visualization  : Recharts / Lightweight Charts (Financial Candlesticks & Technical Overlays)
Backend API Gateway : Python 3.12, FastAPI, Pydantic v2
Agent Orchestration : LangGraph, LangChain Core
Database            : PostgreSQL 16 with pgvector extension (Relational + Vector Search)
Cache & Broker      : Redis 7.2 (Caching, Rate Limiting, Task Queue Broker)
Async Task Queue    : Celery / ARQ (Background monitoring, scheduler, batch RAG indexing)
Data Processing     : Pandas, NumPy, TA-Lib / pandas-ta
Web Search Engine   : Tavily / Serper API with custom source ranking & deduplication
Authentication      : FastAPI OAuth2 with JWT tokens + HTTP-only secure cookies
Containerization    : Docker, Docker Compose, Kubernetes ready
```

---

## 2. System Component Topology

```text
                                   +-------------------------+
                                   |    Browser / Client     |
                                   |    (Next.js App)        |
                                   +------------+------------+
                                                |
                                        HTTPS / WSS API
                                                |
                                                v
                                   +-------------------------+
                                   |     Nginx / Ingress     |
                                   +------------+------------+
                                                |
                                                v
                                   +-------------------------+
                                   |   FastAPI Gateway API   |
                                   |  (Auth, REST, WebSockets)|
                                   +------------+------------+
                                                |
            +-----------------------------------+-----------------------------------+
            |                                   |                                   |
            v                                   v                                   v
+-----------------------+           +-----------------------+           +-----------------------+
|  LangGraph Agent      |           | Data Provider Adapters|           | Celery Worker Cluster |
|  Supervisor Service   |           | (Financial, News, SEC)|           | (Monitoring/Scheduler)|
+-----------+-----------+           +-----------+-----------+           +-----------+-----------+
            |                                   |                                   |
            +-----------------------------------+-----------------------------------+
                                                |
                                                v
                                   +-------------------------+
                                   | Data & Storage Layer    |
                                   | - PostgreSQL (Relational|
                                   | - pgvector (Embeddings) |
                                   | - Redis (Cache & Queue) |
                                   +-------------------------+
```

---

## 3. Directory Layout Specification

### 3.1. Frontend Architecture (`frontend/` or `apps/web/`)
```text
frontend/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── (auth)/                 # Auth routes (login, signup, reset)
│   │   ├── (dashboard)/            # Dashboard & main navigation routes
│   │   │   ├── dashboard/
│   │   │   ├── search/
│   │   │   ├── stock/[ticker]/     # 15-tab company workspace
│   │   │   ├── mutual-fund/[ticker]/
│   │   │   ├── screener/
│   │   │   │   ├── stock/
│   │   │   │   └── mutual-fund/
│   │   │   ├── watchlist/
│   │   │   ├── ai-research/
│   │   │   ├── news/
│   │   │   ├── events/
│   │   │   ├── filings/
│   │   │   ├── company-intelligence/
│   │   │   ├── my-research/
│   │   │   ├── alerts/
│   │   │   └── settings/
│   │   ├── admin/                  # Admin portal routes
│   │   └── editor/                 # Editor approval portal routes
│   ├── components/                 # Modular React components
│   │   ├── ui/                     # Base design system primitives (shadcn/ui)
│   │   ├── common/                 # Modals, headers, navigation bars, footers
│   │   ├── company/                # Tab-specific views (Overview, Fundamentals, Valuation, etc.)
│   │   ├── charts/                 # Recharts candlestick, area, bar, and segment charts
│   │   ├── screener/               # Visual filter builder & Natural language filter prompt
│   │   ├── research/               # AI Research Report renderer, source modal, scenario cards
│   │   ├── watchlist/              # Watchlist grid, alert configuration drawer
│   │   └── admin/                  # Admin monitoring tables & editor approval tools
│   ├── features/                   # Domain state modules & hooks
│   ├── hooks/                      # Custom React hooks (useAuth, useStockQuote, useResearchGraph)
│   ├── lib/                        # API clients, formatting utilities, chart helpers
│   ├── services/                   # Axios API service instances
│   └── types/                      # TypeScript definitions (Company, Financials, AgentReport, etc.)
├── public/                         # Static assets & brand media
├── tailwind.config.ts              # Tailwind CSS configuration
├── package.json
└── tsconfig.json
```

### 3.2. Backend Architecture (`backend/` or `apps/api/`)
```text
backend/
├── app/
│   ├── api/                        # FastAPI Router endpoints
│   │   ├── v1/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── search.py
│   │   │   ├── companies.py
│   │   │   ├── market_data.py
│   │   │   ├── fundamentals.py
│   │   │   ├── technicals.py
│   │   │   ├── screeners.py
│   │   │   ├── news.py
│   │   │   ├── filings.py
│   │   │   ├── research.py
│   │   │   ├── watchlists.py
│   │   │   ├── alerts.py
│   │   │   ├── admin.py
│   │   │   └── editor.py
│   ├── agents/                     # LangGraph Specialist Agents & Supervisor
│   │   ├── supervisor.py           # Core LangGraph research router
│   │   ├── state.py                # ResearchGraphState definition
│   │   ├── specialists/            # Specialist agent node definitions
│   │   │   ├── fundamental_agent.py
│   │   │   ├── technical_agent.py
│   │   │   ├── news_agent.py
│   │   │   ├── web_search_agent.py
│   │   │   ├── rag_filing_agent.py
│   │   │   ├── management_agent.py
│   │   │   ├── structure_agent.py
│   │   │   ├── competitor_agent.py
│   │   │   ├── risk_agent.py
│   │   │   └── evidence_agent.py
│   │   └── tools/                  # Deterministic tool bindings for agents
│   │       ├── market_tools.py
│   │       ├── sec_tools.py
│   │       ├── web_tools.py
│   │       └── db_tools.py
│   ├── core/                       # App configuration, DB session setup, security
│   │   ├── config.py               # Pydantic BaseSettings
│   │   ├── database.py             # Async SQLAlchemy engine session manager
│   │   ├── redis.py                # Async Redis connection pool
│   │   └── security.py             # Password hashing, JWT creation & verification
│   ├── models/                     # SQLAlchemy 2.0 ORM Models
│   │   ├── user.py
│   │   ├── company.py
│   │   ├── market_data.py
│   │   ├── financial.py
│   │   ├── news.py
│   │   ├── document.py
│   │   ├── management.py
│   │   ├── watchlist.py
│   │   ├── alert.py
│   │   └── research.py
│   ├── schemas/                    # Pydantic Data Transfer Objects (DTOs)
│   ├── repositories/               # Data access layer / CRUD repositories
│   ├── providers/                  # External Data Adapters (Interface implementation)
│   │   ├── base.py                 # Abstract base provider interfaces
│   │   ├── market/                 # Stock/Fund market data providers (FMP, AlphaVantage, Yahoo)
│   │   ├── news/                   # Financial news providers
│   │   ├── filings/                # SEC EDGAR providers
│   │   └── search/                 # Tavily / Serper search providers
│   ├── rag/                        # RAG Pipeline (Parsing, Chunking, Embedding, Vector Search)
│   │   ├── parser.py
│   │   ├── chunker.py
│   │   ├── embeddings.py           # OpenAI / Gemini / Cohere embeddings
│   │   └── retriever.py            # Hybrid BM25 + Vector retriever with Reranking
│   ├── workers/                    # Celery / ARQ background tasks & cron scheduler
│   │   ├── celery_app.py
│   │   ├── monitoring_worker.py
│   │   └── alert_worker.py
│   └── tests/                      # Pytest test suite
│       ├── unit/
│       ├── integration/
│       ├── agents/
│       └── security/
├── alembic/                        # PostgreSQL database migrations
├── Dockerfile
└── requirements.txt
```

---

## 4. Multi-Layer Caching Strategy

```text
Layer 1: Memory & Edge Cache (CDN / Next.js Data Cache)
- Static company metadata, logo assets, UI component bundles.

Layer 2: Redis Key-Value Cache
- Real-time stock quotes: 15-60 seconds TTL.
- Calculated technical indicators: 15 minutes TTL.
- Financial statement summaries: 24 hours TTL.
- Deduplicated news event feeds: 1 hour TTL.
- Web search snippet cache: 12 hours TTL.

Layer 3: PostgreSQL Database Storage
- Historical quotes, 10-K/10-Q statements, SEC filings, saved research reports, user watchlists.
```

---

## 5. Cost Control & LLM Token Optimization

1. **Model Tiering Strategy**:
   - **Fast / Lightweight Models (e.g. Gemini 1.5 Flash / GPT-4o-mini)**: Router intent classification, news category tagging, duplicate news clustering, metadata extraction.
   - **High-Reasoning Models (e.g. Gemini 1.5 Pro / GPT-4o / Claude 3.5 Sonnet)**: Deep financial synthesis, executive goal tracking, multi-scenario evaluation, final evidence checking.
2. **Deterministic Pre-Computation**: All financial ratios, CAGR calculations, and technical indicator values (RSI, MACD, Moving Averages) are pre-calculated in Python/Pandas before being passed to LLM prompts, reducing token usage by over 70%.
3. **Structured Prompt Truncation & Vector Filtering**: Strict RAG retrieval caps (maximum 5 re-ranked document chunks per specialist call) prevent context bloat.
