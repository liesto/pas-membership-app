# React Libraries

## Prompt
I want to build an enterprise app (think serviceNow or salesforce) using React. What helper open source packs/libraries/etc. should I consider. I'm thinking about responsive UI, validation, charting/reporting, map based reporting, automations/workflow, data import/export, etc. Please fill in gaps if you can think of more.

## Answer
If I were assembling a React-based “Salesforce/ServiceNow-class” app today, I’d think in two layers:

### Meta-framework / admin framework (optional but big time-saver)

Meta-frameworks (worth evaluating before you reinvent the platform)

These give you CRUD, routing, data providers, RBAC hooks, etc. out of the box:

#### Refine – React meta-framework focused on admin / internal tools.
Data providers (REST/GraphQL), auth, access control, i18n, audit log, resource conventions.
Integrates nicely with Ant Design, Mantine, MUI, etc.

#### React-admin – Mature admin framework for data-driven SPAs.
CRUD screens, filters, pagination, data providers, theming (Material-UI), good docs.

If you want “platform-y” features (resources, record views, list/detail/edit patterns) similar to Salesforce, start by prototyping in one of these and only drop down to raw React if they really constrain you.

### Best-in-class libraries per concern (UI, forms, grids, charts, maps, workflows, import/export, etc.)

#### App shell, layout, responsive UI
You need a design system + layout primitives that won’t fight you long term.

Component libraries / design systems

1. MUI – Huge ecosystem, Material-design-based, good DataGrid, theming, accessibility.

2. Ant Design – Enterprise-y look, heavy on data-entry widgets (tables, forms, trees). Pairs well with Refine.

3. Mantine – Modern, headless-ish vibe, strong form + table components, SSR-friendly.

4. Chakra UI – Simpler, very composable style props, good if you want more control and lighter visual opinion.

Pick one and commit; mixing too many will hurt you.

Layout / grid

Use the layout system inside your component lib (MUI Grid, Flex/Stack, Ant Layout, etc.).

For advanced dashboard layouts (user-rearrangeable panels): react-grid-layout (not browsed here, but still widely used).

#### Forms, validation, and schemas
This is core for an enterprise app.

1. React Hook Form – My default for React forms.
Uncontrolled inputs → minimal re-renders, tiny bundle, integrates well with any UI lib.

2. Zod – TypeScript-first schema validation.
Single source of truth for API payloads, form validation, and runtime checks.

Pattern I’d use:
Define domain schemas in Zod.

Use React Hook Form + @hookform/resolvers/zod for front-end validation and types.

Use the same Zod schemas (or shared package) on the backend to validate requests.

#### Data fetching and client/server state
You absolutely don’t want to hand-roll caching, retries, and background sync.

1. TanStack Query (React Query) – Standard for server state.
Query caching, pagination, optimistic updates, devtools, works great with REST or GraphQL.

For local UI/global state:

2. Redux Toolkit if you prioritize explicitness/debuggability and already like Redux.

3. Zustand if you want a minimal, ergonomic store; pairs nicely with node-based UIs like React Flow. React Flow’s docs even show Zustand specifically.
React Flow

#### Data grids, list views, and search
Enterprise apps live and die by their table UX.

1. TanStack Table (formerly React Table) – Headless table/datagrid.

Gives you sorting, filtering, grouping, pagination, virtualization hooks; you bring UI.

2. AG Grid (Community edition) – “Batteries included” data grid.

Massive feature set: pivoting, grouping, infinite scroll, cell editors, integrated charts, etc. Community edition is free/open-source.

For a Salesforce-style grid with column menus, filters, inline editing, etc., AG Grid Community plus some customization is often worth the learning curve.

#### Charting & analytics
You don’t want to build charts by hand.

1. Recharts – React chart lib built on D3, with a declarative API; widely used, solid docs.

Alternatives: Nivo, ECharts for React, Victory if you care a lot about specific aesthetics.

Consider pairing charts + tables with download/export buttons (CSV/XLSX/PDF) for “reporting”.

#### Map-based reporting / geospatial
1. React Leaflet + Leaflet – Go-to OSS stack for web maps.
Tiles, markers, popups, heat maps, clustering via plugins; easy to plug in your own tileserver or Mapbox/OSM tiles.

2. For heavy visualization (thousands of shapes, 3D): deck.gl (React bindings) with Mapbox or similar.

#### Workflow / automation
Two pieces here: workflow engine (backend concern) and workflow UI (how users design/see flows).

##### Workflow/automation engines (server-side)
If you want ServiceNow-/Salesforce-style “process automation”:

1. n8n – Open-source Zapier-style automation.
Node-based flows, runs self-hosted, exposes APIs; good for integrating systems and cron-like automations.

2. Temporal – Code-first, durable workflow engine.
You define workflows in code; Temporal handles retries, state, timeouts, etc. Great for long-running business processes.

3. Camunda / Flowable / other BPMN engines if you want BPMN/DMN diagrams as the primary abstraction and strict process modeling.

You’d typically integrate your React app with these via REST/GraphQL events, webhooks, or task inbox UIs.

##### Workflow designer UI (what users see)
For “build a flow” like Salesforce Flow or ServiceNow Flow Designer:

1. React Flow – Node-based editors and interactive diagrams in React.
Drag/drop nodes, connect edges, custom node types, layouts, persistence.

2. bpmn-js – If you want full BPMN 2.0 diagrams in the browser.
Viewer + modeler, embed in your app to let users design executable BPMN processes.

Pattern: let users design flows in React Flow or bpmn-js; export a JSON/BPMN model that your backend engine (Temporal/n8n/Camunda/etc.) actually executes.

#### Data import/export (CSV, Excel, JSON, PDFs)
##### Tabular data (CSV / Excel)

1. PapaParse – Fast CSV parser/stringifier in JS; good for bulk imports and quick downloads.

2. SheetJS / xlsx – De-facto standard for reading/writing Excel and other spreadsheet formats in JS.
Read XLSX/CSV, manipulate in JS, export back to files.

##### PDFs and “reports”

1. react-pdf (@react-pdf/renderer) – Render PDFs from React components on client or server.

For “print this screen as-PDF” style output, libs like html2canvas + jsPDF or react-to-print can be enough.

#### Validation, auth, and access control

You’ll want both auth and fine-grained permissions.

Auth / OIDC/OAuth: typically solved by your identity provider + its SDK, but on the React side:
react-oidc-context, @azure/msal-react, or vendor SDKs (Auth0, Cognito, etc.) depending on your IdP.

Authorization / RBAC:
CASL (not browsed here, but widely used) for front-end permission checks (can('edit','Account')-style) while you enforce real rules server-side.

#### Internationalization & accessibility
If you expect multi-region or multi-language use:

1. react-i18next or react-intl for i18n.

Stick with a UI system that takes accessibility seriously (MUI, Chakra, Ant, etc. all lean into this).
Prismic

#### Observability, logging, testing (don’t skip this)

Libraries are mostly non-React specific, but for an “enterprise” build you should plan them early:

Testing: Jest or Vitest + React Testing Library; Cypress or Playwright for E2E.

Logging/monitoring:

OpenTelemetry JS for structured tracing/metrics from the front-end.
Stack Overflow

Tie into whatever backend stack you pick (Grafana/Loki, Elastic, etc.).

### If you want a concrete “starter stack”

If I had to pick a modern, open-source-friendly stack for a new enterprise app today:

Framework: Refine or React-admin on top of React.

UI: Mantine or MUI.

Forms: React Hook Form + Zod.

Data layer: TanStack Query (+ Zustand or Redux Toolkit for UI state).

Tables: TanStack Table; AG Grid Community where you need hardcore grid features.

Charts: Recharts.

Maps: React Leaflet.

Workflow: React Flow for UI; Temporal or n8n for actual automation.

Import/Export: PapaParse (CSV) + SheetJS (Excel) + react-pdf/jsPDF for reports.

If you tell me more about your backend stack (Node/.NET/etc.) and how “platform-y” you want this to be (multi-tenant, app marketplace, etc.), I can sketch a more opinionated architecture around these pieces.