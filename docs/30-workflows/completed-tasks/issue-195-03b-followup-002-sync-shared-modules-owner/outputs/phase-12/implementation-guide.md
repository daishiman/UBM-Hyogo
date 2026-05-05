# Implementation Guide

## Part 1: 中学生レベル

03a と 03b は同じ部品を使う 2 人組のような関係です。今までは「どっちが部品を作る人」「どっちが借りて使う人」を紙に書いていなかったので、ぶつかって壊す危険がありました。今回は「紙（owner 表）」を新しい引き出し（`docs/30-workflows/_design/`）に作って、2 人の作業ノート（03a / 03b の `index.md`）にも「ここにルールがあるよ」というリンクを貼り付ける作業をしました。

## Part 2: 技術者レベル

### 対象モジュール

- `apps/api/src/jobs/_shared/ledger.ts`（実体化済み skeleton、owner: 03a, co-owner: 03b）
- `apps/api/src/jobs/_shared/sync-error.ts`（実体化済み skeleton、owner: 03a, co-owner: 03b）
- `apps/api/src/jobs/_shared/index.ts`（barrel、owner: 03a, co-owner: 03b）

既存本体ロジックは `apps/api/src/repository/syncJobs.ts` と `apps/api/src/jobs/sync-forms-responses.ts` に残し、このタスクでは re-export facade と最小 error helper を実体化した。

### 実施した編集

| 種別 | パス | 内容 |
| --- | --- | --- |
| 新規 | `docs/30-workflows/_design/README.md` | `_design/` 階層の趣旨・現在の登録物・関連未割当タスク |
| 新規 | `docs/30-workflows/_design/sync-shared-modules-owner.md` | 5列 owner 表（3 行）+ 変更ルール 4 項目 + 後続 sync 系タスク参加手順 + 関連未割当節 |
| 新規 | `apps/api/src/jobs/_shared/{ledger,sync-error,index}.ts` | skeleton 実体化 |
| 新規 | `apps/api/src/jobs/_shared/__tests__/*.test.ts` | focused unit tests |
| 編集 | `docs/30-workflows/completed-tasks/03a-.../index.md` | `## dependencies` 直下に `> **共通モジュールの owner 表**: [../../_design/sync-shared-modules-owner.md](../../_design/sync-shared-modules-owner.md)` を追記 |
| 編集 | `docs/30-workflows/completed-tasks/03b-.../index.md` | 同上 |

### 検証ゲート（すべて PASS）

- Phase 6 markdown lint: U-1〜U-5 → `outputs/phase-06/markdown-lint.log`
- Phase 7 cross-reference: I-1〜I-5 → `outputs/phase-07/cross-ref.log`
- Phase 8 受け入れテスト: AC-1〜AC-12 → `outputs/phase-08/acceptance.log`
- Phase 9 品質ゲート: Q-1〜Q-5（secret hygiene / 不変条件 #5 / #6 / branch 戦略 / `.env` 混入なし）→ `outputs/phase-09/secret-hygiene-grep.log`
- Phase 11 NON_VISUAL evidence: 4 ログ → `outputs/phase-11/evidence/`

### 不変条件遵守

- #5: 新規コードは `apps/api/src/jobs/_shared/` に限定し、`apps/web` と D1 schema に触れない
- #6: GAS prototype を canonical workflow に昇格させない
- secret hygiene: `_design/` 配下に API token / OAuth secret / `op://` 実値混入なし

### 後続タスク

- 未割当 #7（`sync_jobs` `job_type` enum / `metrics_json` schema 集約）— 本表を foundation として起票
- 03a / 03b spec 内の「主担当 / サブ担当」語彙の "owner / co-owner" 統一
- `apps/api/src/jobs/_shared/ledger.ts` / `sync-error.ts` の実体作成と既存実装からの移管判断
