# Phase 11 Evidence Pointer (Refs #775)

このディレクトリは pointer のみで、実 evidence は親 workflow に集約されています。

## 実 evidence path

- screenshots: `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/screenshots/`
- logs: `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/evidence/`
- manifest: `docs/30-workflows/completed-tasks/serial-05-step-03-schema-diff-resolve/outputs/phase-11/manifest.json`

## なぜ pointer 形式か

親 workflow が既に `completed-tasks/` 配下に存在し、Phase 11 evidence path が定着しているため、本 issue-775 recovery workflow では evidence を二重管理せず親 workflow の正本 path に追記する。本 workflow root は gate / phase 文書のみ管理する責務とする。
