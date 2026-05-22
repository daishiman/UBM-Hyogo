# Stage 0 — Spec/Doc consistency cleanup

PR #594 の置き土産整理サイクル。`apps/web/playwright/` の README 整備、stale comment 除去、`evidence-capture` project 分離、標準 E2E project filter 固定、quality-gates §7.1 例外リストへの正式登録を同一サイクルで実装する。

- workflow ID: `e2e-quality-uplift-stage-0`
- branch: `feat/e2e-quality-uplift`（PR base = `dev`）
- date (absolute): 2026-05-08
- 上位 workflow: `e2e-quality-uplift`（Stage 0 → 1 → 2 → 3）
- canonical source: `.claude/skills/task-specification-creator/references/quality-gates.md` §7 / §7.5
- coverageTier: `standard`（solo MVP recovery、`apps/web` 全体方針）

## 機械検証メタ情報

| key | value |
| --- | --- |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| coverageTier | standard |
| workflow_state | verified |

---

## サブタスク一覧

| ID | 概要 | implementation_mode | task classification | 主要 deliverable |
| --- | --- | --- | --- | --- |
| Stage 0b | `apps/web/playwright/README.md` 新規作成 | `new` | implementation | `apps/web/playwright/README.md` |
| Stage 0c | `profile-readonly` skip の formalize と `profile-{visibility,delete}-request` の stale comment 除去仕様化 | `new` | implementation/NON_VISUAL | quality-gates §7.1 exception list 追記 + Playwright project 設計記述 |

両サブタスクとも `implementation` 分類。仕様書と実ファイルを同一サイクルで同期する。

---

## 依存関係

```
Stage 0b ─┐
          ├─→ Phase 4 以降
Stage 0c ─┘
```

- Stage 0b と 0c は独立だが、0b が `evidence-capture` Playwright project の存在を文書化するため、0c の design とは naming を共有する（`evidence-capture` project 名で統一）。
- 上流: PR #594 merged into `dev`（前提）。
- 下流: Stage 1（critical route smoke 整備）が 0c の §7.1 例外リストに依存。

---

## Acceptance Criteria サマリ

| # | AC | 検証方法 |
| --- | --- | --- |
| AC-0b-1 | `apps/web/playwright/README.md` が存在し、§7 un-skip 不変条件・§7.5 standard tier (lines >= 70%)・`pnpm e2e` 実行手順・critical route smoke list・`auth fixture (memberPage / adminPage)` 解説の 5 項目を含む | `grep` で 5 項目の見出しを確認 |
| AC-0b-2 | `pnpm e2e` の実行コマンドが `mise exec --` 経由で 1 行記載されている | README 内の code fence |
| AC-0c-1 | quality-gates.md §7.1 に `profile-readonly-logged-in.spec.ts` の `evidence-capture` project への分離と例外条件が同一サイクルで追記される | Stage 0c phase-2 設計と `.claude/skills/task-specification-creator/references/quality-gates.md` 実差分が一致している |
| AC-0c-2 | `profile-{visibility,delete}-request.spec.ts` の冒頭 stale comment（`Phase 11 manual smoke で test.describe.skip を解除して活性化する`）を除去する仕様が明記されている | phase-1 inventory に対象行が列挙される |
| AC-0c-3 | Playwright project `evidence-capture`（opt-in via env）の責務境界が phase-2 設計で明確化されている | phase-2 design topology 表 |

---

## Phase 1-13 status table

| Phase | 名称 | status | 配置 |
| --- | --- | --- | --- |
| 1 | 要件定義 | `done` | `phase-1.md` |
| 2 | 設計 | `done` | `phase-2.md` |
| 3 | 設計レビュー | `done` | `phase-3.md` |
| 4 | 実装計画 | `done` | `phase-4.md` |
| 5 | 実装 | `done` | `phase-5.md` |
| 6 | 単体テスト | `done` | `phase-6.md` |
| 7 | 統合検証 | `done` | `phase-7.md` |
| 8 | 回帰検証 | `done` | `phase-8.md` |
| 9 | パフォーマンス | `done` | `phase-9.md` |
| 10 | セキュリティ | `done` | `phase-10.md` |
| 11 | 視覚 / evidence | `done` | `phase-11.md` |
| 12 | 仕様反映 | `done` | `phase-12.md` |
| 13 | レビュー / PR | `done` | `phase-13.md` |

> Phase 1-3 は前セッション、Phase 4-13 は本セッションで生成済。Phase 4 §0 で R1（profile-readonly evidence spec の責務名 drift）を **案 A: evidence-only spec rename/extract** に確定。実コード edit は本サイクルで実施済み。

---

## CONST 整合

- `CONST_007` 単一サイクルスコープ: 本ステージは README 1 ファイル + Playwright config/package script + logged-in evidence spec split + skill reference 追記 + stale comment 除去 2 行のみ。スコープ拡張禁止。
- `apps/web` D1 直接アクセス禁止: 影響なし（implementation）。
- branch 戦略: PR base = `dev`、本サイクル内では `main` への merge を扱わない。
