# Phase 10 成果物 — 最終レビュー

> 本ワークフローはタスク仕様書整備と実コード hardening。GO 判定は実装サイクル着手可否の基準を確定する。

## 1. AC 達成判定基準と blocker 判定

| AC | 判定基準 | blocker 判定 |
| --- | --- | --- |
| AC-1 | 失敗注入時 exit=1 | 未達=blocker |
| AC-2 | 途中失敗で本ファイル不変 + tmp 残存 0 | 未達=blocker |
| AC-3 | stderr に `[generate-index] <skill> / <index-file> (<step>) 失敗:` | 未達=blocker |
| AC-4 | hook/CI 回帰グリーン + `git diff` 0 | 未達=blocker |
| AC-5 | ENOENT 空継続 / その他 throw | 破損握り潰し再発なら blocker |
| AC-6 | index.md に単一経路 / task-spec-creator scope 外を記録 | 未達=MINOR |
| AC-7 | TC-01〜07 全 PASS | 未達=blocker |
| AC-8 | 4 条件全 PASS | 未達=blocker |

## 2. GO / NO-GO 判定ルール

- **GO**: AC-1〜AC-8 全達成 + blocker 0 件 → Phase 11 CLI 回帰 smoke へ進行可。
- **NO-GO**: blocker 1 件以上 → 戻し先（実装は Phase 5 / 設計は Phase 2）。
- **MINOR**: blocker でない指摘は Phase 12 未タスク検出へ記録。マージは妨げない。

## 3. MINOR / 未タスク候補（Phase 12 へ記録）

| # | 指摘 | 区分 |
| --- | --- | --- |
| M-1 | `task-specification-creator/scripts/generate-index.js` の同等 hardening（`indexes:rebuild` 未配線で scope 外） | 未タスク候補（新規 Issue 起票は user-gated） |
| M-2 | rename EXDEV リスク（出力先が将来別 FS になる場合の再確認） | MINOR（Phase 2 D-1 / 苦戦箇所に記録済み） |

## 4. 現時点の判定（仕様書整備フェーズ）

- 仕様上 AC-1〜AC-8 は Phase 1〜3 で全カバー。4 条件全 PASS。
- 実装サイクル着手時に S-1〜S-5 / TC-01〜07 / 7 品質ゲートを実走し、blocker 0 件を確認したうえで GO とする。
- 本ワークフロー（仕様書整備）時点では blocker 該当なし。実走証跡は実装サイクルで採取。

## 5. Phase 11 evidence 保存先

- `outputs/phase-11/`（main.md / manual-smoke-log.md / manual-test-checklist.md / manual-test-result.md / link-checklist.md / discovered-issues.md / screenshot-plan.json）。
