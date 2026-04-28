# Phase 11 — リンク整合チェックリスト

## 0. 前提

- 本タスクは docs-only / NON_VISUAL のため、検証は **静的なリンク存在確認**
  と **相互参照の整合** に閉じる。
- 2026-04-28 の Phase 12 再検証で、結果欄を静的チェックとして記録済み。

## 1. ルートインデックス系

| ID | 対象 | 期待 | 結果 | メモ |
| --- | --- | --- | --- | --- |
| L-01 | `index.md` 存在 | 存在 | PASS | 確認済み |
| L-02 | `artifacts.json` 存在 | 存在 | PASS | 確認済み |
| L-03 | `index.md` Phase 一覧件数 = `artifacts.json.phases.length` | 13 = 13 | PASS | 確認済み |
| L-04 | `index.md` 横断依存リスト = `artifacts.json.cross_task_order` | 一致 | PASS | 確認済み |
| L-05 | `index.md` 完了条件に Phase 13 ユーザー承認待ちが明記 | 明記 | PASS | 確認済み |

## 2. Phase 仕様書（phase-01.md 〜 phase-13.md）

| ID | 対象 | 期待 | 結果 | メモ |
| --- | --- | --- | --- | --- |
| L-10 | `phase-01.md` 〜 `phase-13.md` 全 13 ファイルが存在 | 13 件 | PASS | 確認済み |
| L-11 | 各 `phase-NN.md` の「成果物」節が `artifacts.json.phases[N-1].outputs` と一致 | 一致 | PASS | validate-phase-output PASS |
| L-12 | 各 `phase-NN.md` 冒頭に docs-only / NON_VISUAL / spec_created の表記 | 明記 | PASS | 確認済み |
| L-13 | `phase-13.md` のみユーザー承認待ちを宣言 | 宣言 | PASS | 確認済み |

## 3. outputs/phase-N/*.md

| ID | 対象 | 期待 | 結果 | メモ |
| --- | --- | --- | --- | --- |
| L-20 | `outputs/phase-1/main.md` 〜 `outputs/phase-13/main.md` 全存在 | 13 件 | PASS | 確認済み |
| L-21 | Phase 2 outputs（main.md / design.md） | 存在 | PASS | 確認済み |
| L-22 | Phase 3 outputs（main.md / review.md） | 存在 | PASS | 確認済み |
| L-23 | Phase 4 outputs（main.md / test-matrix.md） | 存在 | PASS | 確認済み |
| L-24 | Phase 5 outputs（main.md / runbook.md） | 存在 | PASS | 確認済み |
| L-25 | Phase 6 outputs（main.md / failure-cases.md） | 存在 | PASS | 確認済み |
| L-26 | Phase 7 outputs（main.md / coverage.md） | 存在 | PASS | 確認済み |
| L-27 | Phase 8 outputs（main.md / before-after.md） | 存在 | PASS | 確認済み |
| L-28 | Phase 9 outputs（main.md / quality-gate.md） | 存在 | PASS | 確認済み |
| L-29 | Phase 10 outputs（main.md / go-no-go.md） | 存在 | PASS | 確認済み |
| L-30 | Phase 11 outputs（main.md / manual-smoke-log.md / link-checklist.md） | 存在 | PASS | 確認済み |
| L-31 | Phase 12 outputs 7 ファイル | 存在 | PASS | 確認済み |
| L-32 | Phase 13 outputs（main.md / change-summary.md / pr-template.md） | 存在 | PASS | 確認済み |

## 4. artifacts.json と outputs/artifacts.json の整合

| ID | 対象 | 期待 | 結果 | メモ |
| --- | --- | --- | --- | --- |
| L-40 | ルート `artifacts.json` 存在 | 存在 | PASS | 確認済み |
| L-41 | `outputs/artifacts.json` 存在（あれば） | 任意 | PASS | 確認済み |
| L-42 | 両者の `phases[].outputs` が同一（`outputs/artifacts.json` を採用する場合） | 一致 | PASS | 確認済み |
| L-43 | `task_name` / `task_path` / `execution_mode` がルートと outputs 側で一致 | 一致 | PASS | 確認済み |

## 5. CLAUDE.md / 上位文書からの参照

| ID | 対象 | 期待 | 結果 | メモ |
| --- | --- | --- | --- | --- |
| L-50 | CLAUDE.md ブランチ戦略表（dev=1名 / main=2名）と本タスク reviewer 数の整合 | 整合 | PASS | 確認済み |
| L-51 | CLAUDE.md シークレット管理規定（GitHub Secrets / 1Password）と Phase 2 design.md の整合 | 整合 | PASS | 確認済み |
| L-52 | `scripts/cf.sh` 経由のルールと CI ジョブ設計の整合 | 整合 | PASS | 確認済み |
| L-53 | `docs/01-infrastructure-setup/` の関連タスクからの相互リンク（必要時） | 任意 | PASS | 確認済み |

## 6. 横断依存タスク参照

| ID | 対象タスク | 期待 | 結果 | メモ |
| --- | --- | --- | --- | --- |
| L-60 | `task-conflict-prevention-skill-state-redesign` 参照 | 責務境界記述あり | PASS | 確認済み |
| L-61 | `task-git-hooks-lefthook-and-post-merge` 参照 | 責務境界記述あり | PASS | 確認済み |
| L-62 | `task-worktree-environment-isolation` 参照 | 責務境界記述あり | PASS | 確認済み |
| L-63 | `task-claude-code-permissions-decisive-mode` 参照 | 責務境界記述あり | PASS | 確認済み |
| L-64 | `cross_task_order` の順序が Phase 1 §6 と一致 | 一致 | PASS | 確認済み |

## 7. セキュリティ最終確認

| ID | 対象 | 期待 | 結果 | メモ |
| --- | --- | --- | --- | --- |
| L-70 | API トークン / OAuth トークンの平文転記なし | なし | PASS | 確認済み |
| L-71 | `.env` 実値の転記なし | なし | PASS | 確認済み |
| L-72 | `wrangler login` 推奨記述なし（`scripts/cf.sh` のみ） | なし | PASS | 確認済み |

## 8. 完了条件

- [x] L-01〜L-72 のすべての行が表として存在する
- [x] 各行の結果が PASS として記録されている
- [x] index.md / phase-NN.md / outputs/phase-N/*.md / artifacts.json の相互整合観点が網羅されている
