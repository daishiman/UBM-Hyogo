# Phase 2 — Architecture

## 影響範囲俯瞰

```
docs/30-workflows/
├── ui-prototype-design-system-foundation/serial-06-form-response-binding/
│   ├── phase-06-test-strategy.md          ← 編集 (§3 末尾に SSR intercept note)
│   ├── phase-10-local-verification.md     ← 編集 (line 130/141 文言 backfill)
│   └── outputs/phase-12/implementation-guide.md  ← read-only 参照（既に判断記録あり）
├── unassigned-task/
│   └── serial-06-followup-003-phase-6-playwright-topology-sync.md  ← consumed 化
└── serial-06-followup-003-phase6-topology-sync-backfill/            ← 本 workflow root（新設）

.claude/skills/task-specification-creator/references/
├── patterns-lessons-and-pitfalls.md       ← 編集 (2 entry or cross-link)
├── server-component-e2e-pattern.md        ← read-only 参照（既存 SSOT）
├── quality-gates.md                       ← read-only 参照（line 95 既存記述）
└── phase-11-screenshot-guide.md           ← read-only 参照（line 95-96/101/118-119/157 既存記述）
```

## アーキテクチャ判断

- **SSOT 集約**: SSR fetch / page.route の知見は既に `server-component-e2e-pattern.md` という**専用 reference**に集約されている。`patterns-lessons-and-pitfalls.md` には同知見を重複記載せず、**cross-link 1 行**で集約先へ誘導する方針を採る（DRY 原則 / 重複ドキュメントの drift 防止）。
- **flat-layout 採用**: 本 workflow は docs-only の小規模 backfill なので canonical `phase-{01..13}-*.md` の flat layout で十分。`apps/` / `packages/` 配下のコード差分は持たないが、対象ドキュメントと skill reference の実編集は完了しているため `artifacts.json` は `implemented_local_evidence_captured`、Phase 1-12 は `completed`、Phase 13 は `pending_user_approval` とする。
- **canonical_workflow pointer**: unassigned-task は削除せず、frontmatter に `status: consumed` / `canonical_workflow: docs/30-workflows/completed-tasks/serial-06-followup-003-phase6-topology-sync-backfill/` を追記する（`closed-issue-canonical-workflow-recovery.md` のパターンに準拠）。
