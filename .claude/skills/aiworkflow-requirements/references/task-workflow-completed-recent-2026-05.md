# 完了タスク記録 — 2026-05（recent shard）

> 親ファイル: [task-workflow-completed.md](task-workflow-completed.md)
> 役割: 月次 shard（task-workflow-completed.md の line budget 抑制）

## 2026-05-19: parallel-04 Shared Page Chrome（spec_created + Phase 11 evidence captured）

| 項目       | 値                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------- |
| タスクID   | parallel-04-shared-page-chrome                                                              |
| ステータス | `spec_created / implementation / VISUAL / Phase 11 evidence captured (EV-01..16)`           |
| 親 workflow | `docs/30-workflows/ui-prototype-design-system-foundation/`                                  |
| sub workflow root | `docs/30-workflows/ui-prototype-design-system-foundation/parallel-04-shared-page-chrome/` |
| commit     | 549ec713a20313bd2dbc9fed9658514ee9cc355f                                                    |
| 実装対象 | `apps/web/app/{layout,error,not-found,loading}.tsx` + `apps/web/app/__tests__/error.component.spec.tsx` + `apps/web/app/__smoke__/loading-state/{page,loading}.tsx` |
| Phase 12 集約方針 | sub-workflow に複製せず parent root `outputs/phase-12/` に集約（parent-sub-workflow strict7 aggregation） |
| artifact inventory | `.claude/skills/aiworkflow-requirements/references/workflow-parallel-04-shared-page-chrome-artifact-inventory.md` |
| lessons    | `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-parallel-04-root-chrome-2026-05.md` (L-PARA04-001..007) |
| changelog  | `.claude/skills/aiworkflow-requirements/changelog/20260519-parallel-04-shared-page-chrome.md` |
| evidence   | EV-01..09 静的 gate ログ + EV-10..11 capture provenance + EV-12..15 root chrome / fallback PNG + EV-16 visual review |
| user gate  | commit / push / PR / serial-07 19 routes 全体 visual regression                              |

### 実施内容

- `app/layout.tsx`: warm theme / OKLch token 読込順整合 / object metadata template / viewport export での themeColor OKLch 指定 / `ToastProvider` root mount 維持
- `app/error.tsx`: Card primitive 採用 / `logger.error` を `useEffect([])` で mount 時 1 回 / Strict Mode 重複 invoke 抑止
- `app/not-found.tsx`: Card + EmptyState primitive 採用
- `app/loading.tsx`: Card 内 skeleton grey 帯
- `apps/web/app/__tests__/error.component.spec.tsx`: 再 render しても `logger.error` 1 回のみ呼出 test を追加
- `apps/web/app/__smoke__/loading-state/{page,loading}.tsx`: task-25 follow-up 由来の fixture 修正と整合

### 検証証跡 (Phase 11 EV-01..16)

| EV | path | 概要 |
|----|------|------|
| EV-01..07 | `outputs/phase-11/*.log` | typecheck / lint / vitest / build / design-tokens / test-suffix / pr-ready 全 PASS |
| EV-08 | `outputs/phase-11/toast-provider-grep.txt` | `__tests__` 除外 runtime source-only で ToastProvider 単一 mount を確認 |
| EV-09 | `outputs/phase-11/hex-direct-grep.txt` | 4 ファイル中 HEX 直書き 0 件 |
| EV-10..11 | `outputs/phase-11/{screenshot-plan,phase11-capture-metadata}.json` | VISUAL plan + provenance |
| EV-12..15 | `outputs/phase-11/{root-layout,fallback-error,fallback-not-found,fallback-loading}.png` | Chromium ローカル capture |
| EV-16 | `outputs/phase-11/ui-sanity-visual-review.md` | viewport / overlap / token / CTA 人手レビュー |

### Lessons Carry-forward

- L-PARA04-001: 単一 mount 系 grep gate は `__tests__` 除外 default 化を `phase11-evidence-inventory` テンプレへ反映
- L-PARA04-002: Next.js 16 系 minor up ごとに Turbopack / OpenNext 互換 release-notes を確認
- L-PARA04-003: parent + N sub-workflow 構造は Phase 12 strict 7 を parent root 集約に固定
- L-PARA04-004: legacy scaffold 由来の HEX 直書きは PR 前 `pnpm verify:tokens` 必須
- L-PARA04-006: root boundary に logger を追加する場合は `useEffect([])` mount-once パターンを徹底
