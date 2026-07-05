# Project Folders Structure Blueprint

This document serves as the definitive architectural guide for maintaining consistent code organization in the **Autonomic Industrial Control Tower** codebase. It covers the folder layout, architectural principles, naming conventions, and file placement patterns of the project.

---

## 1. Initial Auto-detection Phase

The codebase has been scanned and analyzed, revealing a hybrid, multi-language structure with the following characteristics:

*   **Primary Technologies**: 
    *   **Frontend**: React (Next.js 16+ App Router) utilizing ESM modules, Tailwind CSS, Lucide icons, and Chart.js.
    *   **Backend & Multi-Agent**: Python 3.10+ leveraging PostgreSQL (with pgvector/pg_similarity capability), ChromaDB (semantic vector store), and a custom Multi-Agent Orchestrator pipeline.
*   **Architecture**: Single hybrid repository containing a decoupled Python CLI IoT simulator/agents layer and a Next.js web dashboard.
*   **Monorepo**: False (single project layout containing co-located web application and agent runtimes).
*   **Microservices**: False (monolithic web client and agent runner).

---

## 2. Structural Overview

The **Autonomic Industrial Control Tower** is organized into two primary layers:
1.  **AI & Telemetry Engine (inside `/backend`)**: Coordinates sensor polling rules, isolates mechanical faults using RAG equipment manuals, and executes backward recursive CTE supply-chain queries.
2.  **Next.js Dashboard (`src/`)**: Renders real-time telemetry sparklines, active sourcing logistics paths, and configuration portals.

### Organization Principles
*   **Encapsulation by Feature**: Components are co-located within the specific page route folder they belong to (e.g. `src/app/dashboard/_components`).
*   **Separation of Runtimes**: All backend agent modules, database schemas, and seed scripts are cleanly isolated under `/backend`, keeping the root directory clutter-free.
*   **Dynamic Workspaces**: Local state is isolated client-side by workspace IDs to allow testing multiple factories independently.

---

## 3. Directory Visualization

Below is the ASCII tree visualization of the project structure to depth level 3 (excluding build artifacts like `.next/` or environment files like `.venv/`):

```
.
├── .agents/                               # Workspace agent and workflow definitions
│   └── workflows/                         # Custom IDE workflow slash commands
├── assets/                                # Global assets (fonts, stylesheets)
├── backend/                               # Python Backend & Multi-Agent system
│   ├── agent.py                           # Multi-agent core pipeline
│   ├── run_agent.py                       # IoT Telemetry simulator & runner
│   ├── init_db.py                         # Database seeding and migration script
│   ├── requirements.txt                   # Python dependency list
│   └── schema.sql                         # Relational and graph schema definition
├── public/                                # Static files (PWA icons, manifest files)
├── src/                                   # Frontend web source files
│   ├── app/                               # Next.js App Router
│   │   ├── _components/                   # Landing page components (co-located)
│   │   ├── admin/                         # Admin portal routes
│   │   ├── api/                           # On-demand API endpoints
│   │   │   ├── admin/login/               # Admin auth handler
│   │   │   ├── config/                    # Fleet configuration sync API
│   │   │   ├── data/                      # Live database state sync API
│   │   │   ├── health/                    # Health check API
│   │   │   ├── reports/                   # Live diagnostic reports API
│   │   │   ├── setup/                     # Setup API handler
│   │   │   └── simulate/                  # Simulation trigger API (calls Python backend)
│   │   ├── dashboard/                     # Main operator console route
│   │   │   ├── _components/               # Dashboard widgets (co-located)
│   │   │   └── page.js                    # Dashboard viewport
│   │   ├── device/                        # IoT broadcast panel route
│   │   │   ├── _components/               # Device widgets (co-located)
│   │   │   └── page.js                    # Device simulator view
│   │   ├── sourcing-test/                 # Sourcing testing viewport
│   │   ├── globals.css                    # Global design variables & Tailwind styles
│   │   ├── layout.js                      # Root HTML layout wrapper
│   │   └── page.js                        # Landing configuration portal page
│   └── lib/                               # Core client utilities and configuration
│       └── templatesData.js               # Industrial sector presets
├── package.json                           # Next.js packages and runner scripts
└── Project_Folders_Structure_Blueprint.md  # Folder structure specification
```

---

## 4. Key Directory Analysis

### Backend Layer (`backend/`)
Contains the full Python system for IoT simulation and agentic analysis.
*   `agent.py`: Houses Anomaly Detection, Diagnostic RAG, and Logistics Sourcing agent classes.
*   `run_agent.py`: Simulates anomalies on virtual machine trains.
*   `init_db.py`: Migrates and seeds the relational database.

### Frontend React & Next.js Layer (`src/`)

#### Component Organization (`src/app/**/_components/`)
*   **Grouping Strategy**: Components are strictly co-located inside route private folders:
    *   `src/app/_components/`: Landing page widgets (e.g. `ProjectConfigurator.js`, `WorkspaceSidebar.js`).
    *   `src/app/dashboard/_components/`: Dashboard widgets (e.g. `TelemetryLiveMonitor.js`, `SourcingRoadmap.js`).
    *   `src/app/device/_components/`: Client broadcast modules (e.g. `ConsoleOut.js`, `GatewayConfig.js`).
*   **State Sharing**: Global state is stored client-side in React state and synchronized via LocalStorage workspace nodes.

#### Routing Organization (`src/app/`)
*   **Structure**: Uses Next.js App Router (directory-based routing).
*   **API Directory (`src/app/api/`)**: Hosts route handlers (`route.js`) executing serverless actions.
*   `simulate/route.js` targets execution inside `backend/run_agent.py` by calling standard shell subprocesses.

---

## 5. File Placement Patterns

Consistent file placement rules for code categories:

*   **Page Views**: Must reside under `src/app/{route}/page.js`.
*   **API Routes**: Must reside under `src/app/api/{route}/route.js`.
*   **Shared Templates**: Industry presets belong inside `src/lib/templatesData.js`.
*   **UI Components**: Must go to `src/app/{route}/_components/{ComponentName}.js`.
*   **Python Scripts**: Located within the `backend/` directory.

---

## 6. Naming and Organization Conventions

*   **File Casings**:
    *   React UI Components: PascalCase (e.g., `TelemetryLiveMonitor.js`).
    *   App Router files: lowercase (e.g., `page.js`, `layout.js`, `route.js`).
    *   Python scripts: snake_case (e.g., `run_agent.py`, `init_db.py`).
*   **Folder Naming**:
    *   Next.js Routes: lowercase kebab-case (e.g., `sourcing-test`).
    *   Private Component Folders: lowercase with leading underscore (e.g. `_components`).
*   **Code Co-location**: Keep presentation and logic files grouped within their feature folder.

---

## 7. Navigation and Development Workflow

### Main Entry Points
1.  **Landing / Setup Portal**: `src/app/page.js` — Core page where users set up a project workspace.
2.  **Dashboard Console**: `src/app/dashboard/page.js` — Main operator panel showing telemetry and RAG diagnostics.
3.  **IoT Client Panel**: `src/app/device/page.js` — Control interface simulating IoT broadcasts.

### Content Statistics (Approximate File Counts)
*   `src/app/`: ~11 files (API endpoints, layout configs, router targets).
*   `src/app/**/_components/`: ~14 files (dashboard: 8, device: 4, landing: 2).
*   `src/lib/`: ~1 file (`templatesData.js` presets).
*   `backend/`: ~5 files (Python scripts and schema files).

---

## 8. Build and Output Organization

*   **Build Scripts**: Controlled via `package.json` scripts:
    *   `npm run dev`: Fires the Next.js local development server.
    *   `npm run build`: Compiles production assets.
*   **Output Files**: Next.js compiles static and serverless files to `.next/`.
*   **Environment Settings**: Next.js env configurations reside in `.env`, `.env.local`, and `.env.production`.

---

## 9. Technology-Specific Organization

### Node.js (Next.js)
*   **Package Management**: Configured via `package.json` with ESM module rules.
*   **Scripts**: Standard automation commands defined inside `package.json`.

### Python (AI Agents)
*   **Dependency Management**: Specified inside `backend/requirements.txt`.
*   **Seeding Rules**: Run `python backend/init_db.py` to seed PostgreSQL tables and insert ChromaDB manual chunks.

---

## 10. Extension and Evolution

*   **Adding New Industries**: Add a new sector node containing machines and raw materials to `src/lib/templatesData.js`.
*   **Scaling Components**: Keep directories split by feature. If a category grows to more than 10 files, create a subfolder or abstract handlers to custom React hooks.
*   **Extending Agents**: Add new modular agent classes directly in `backend/agent.py` to keep the orchestration pipeline centralized.

---

## 11. Structure Templates

### New Component Template
Save to `src/app/dashboard/_components/MyWidget.js`:
```javascript
"use client";

import { Activity } from "lucide-react";

export default function MyWidget({ theme, data }) {
  const isDark = theme === "dark";
  return (
    <div className={`p-4 border rounded-xl shadow-sm ${
      isDark ? "bg-[#0a0d16] border-[#1b2336] text-white" : "bg-white border-slate-250 text-slate-800"
    }`}>
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-mono font-bold uppercase">Widget Title</span>
      </div>
      <p className="text-sm mt-2">{data}</p>
    </div>
  );
}
```

### New API Route Template
Save to `src/app/api/custom-endpoint/route.js`:
```javascript
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    return NextResponse.json({ success: true, status: "healthy" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

---

## 12. Structure Enforcement

*   **Linters**: ESLint config validates visual files prior to build.
*   **NPM Compilation checks**: Automatically run as a gate during production compiles to prevent build errors.

---
*Last Updated: 2026-07-05*
