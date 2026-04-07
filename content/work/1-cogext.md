---
title: "CogExt — Self-Hosted Personal Knowledge Base"
slug: "cogext"
date: "2026"
type: "personal-project"
organization: ""
role: ""
summary: "A self-hosted app for collecting, organizing, and rediscovering ideas with AI-powered tagging, semantic search, and conversational Q&A."
stack: ["Next.js 16", "React 19", "TypeScript", "PostgreSQL", "pgvector", "Drizzle ORM", "Tailwind CSS", "Radix UI", "Claude API", "Voyage AI", "Docker", "GitHub Actions"]
liveUrl: ""
githubUrl: "https://github.com/emdecr/cogext"
recordSlug: ""
order: 1
status: "published"
---

A self-hosted app for collecting, organizing, and rediscovering ideas — images, quotes, articles, links, and notes — with AI-powered tagging, semantic search, and conversational Q&A over your own data.

I built CogExt as an alternative to tools like mymind and Pinterest, with full ownership of data and no algorithmic feed. It started from a personal need: I wanted a single place to save things I encounter and actually find them again later, organized by meaning rather than manual effort.

**Key work:**

- Designed and built the full application end to end — data modelling, API routes, UI components, AI integrations, auth, and deployment
- Implemented semantic search using pgvector embeddings alongside keyword search, with a provider abstraction layer that makes the AI backend swappable between cloud (Voyage AI / Claude) and local (Ollama) with a single file change
- Built AI-powered features including auto-tagging on save, image analysis via Claude Vision, RAG-based chat over saved records, and weekly AI-generated reflection digests
- Set up production infrastructure: Docker multi-stage builds (~150MB image), Docker Compose for the full stack (app + Postgres + MinIO), deployed to a Linode instance, database backup/restore scripts, and a CI pipeline with automated deploys
- Wrote unit, integration, and E2E tests (Vitest + React Testing Library + Playwright)

**How I built it:** I used Claude as a development partner throughout — not as a code generator, but as a collaborator I worked with iteratively, directing architecture decisions, scoping features, and reviewing implementation. The project has 82 commits and reflects sustained, intentional building over time. I deployed and maintain it on my own server.

**What this project sharpened:** How to scope and ship a complex full-stack application independently, how to work effectively with AI tools as part of a real development workflow, and how much I enjoy building software that serves a genuine personal need.
