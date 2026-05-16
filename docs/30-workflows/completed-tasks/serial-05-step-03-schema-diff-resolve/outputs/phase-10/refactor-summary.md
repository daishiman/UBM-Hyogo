**[実装区分: 実装仕様書]**

# Phase 10 — Refactor Summary

## 1. Refactor Policy

This task is an existing-component hardening task. The elegant solution is to keep `SchemaDiffPanel` as the current owner instead of adding parallel greenfield components.

## 2. Responsibility Boundaries

| File | Keep | Avoid |
| --- | --- | --- |
| `page.tsx` | server fetch and render only | client state / mutation |
| `SchemaDiffPanel.tsx` | 4 panes, row selection, form state, feedback | direct D1 access / duplicate API helper |
| `api.ts` | browser proxy mutation helper | UI state |
| `server-fetch.ts` | server fetch helper and fixture | client mutation |

## 3. Naming

| Concept | Canonical name |
| --- | --- |
| list response | `SchemaDiffListView` |
| item | `SchemaDiffItem` |
| unresolved status | `queued` |
| resolved status | `resolved` |
| mutation helper | `postSchemaAlias` |

## 4. Refactor Guard

Do not split `SchemaDiffPanel` into `SchemaDiffList` / `SchemaDiffResolveForm` unless the same wave removes the old panel references and updates tests, docs, and evidence together.
