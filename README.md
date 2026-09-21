# CML Field Manual

A practical, code-first field manual for **Cloudera Machine Learning (CML)** — built as a fast, fully client-side documentation site.

## What it covers

- **CML Jobs** — scheduling, running, and monitoring jobs
- **Pipelines / Workflows** — chaining steps into directed pipelines
- **API v2** — the CML REST API: endpoints, request/response shapes, examples
- **Model Serving** — deploying and calling models in production
- **FastAPI** — serving custom inference endpoints alongside CML

## Tech stack

- **React 19** + **TypeScript**
- **Vite** (build tool / dev server)
- **Tailwind CSS** + **shadcn/ui** component primitives
- React Router, Radix UI, lucide-react icons

## Running locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

Other scripts:

```bash
npm run build      # production build
npm run preview    # preview the production build
npm run lint       # eslint
```

## Note on package-lock.json

`package-lock.json` is **intentionally not committed** to this repository. Running `npm install` will regenerate it automatically from `package.json`.
