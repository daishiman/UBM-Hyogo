# Phase 11 成果物 — 手動 smoke walkthrough（NON_VISUAL / spec_created）

> **本 Phase は「実地操作不可」**: 実 `gh api PUT` / GET / rollback リハーサル / `enforce_admins` 詰み再現は **Phase 13 ユーザー明示承認後** の別オペレーションでのみ実行する。
> 本 Phase 11 は spec walkthrough と 4 ステップ手動 smoke の **仕様レベル固定** に閉じる。実行ログ・実 PUT 応答は本 Phase では取得しない。

## 1. テスト方式

| 項目 | 値 |
| --- | --- |
| mode | NON_VISUAL |
| taskType | implementation（governance 適用） |
| 状態 | spec_created |
| 主ソース | spec walkthrough（本ファイル）/ `manual-smoke-log.md`（NOT EXECUTED）/ `link-checklist.md` |
| screenshot | 不要（UI/Renderer/画面遷移なし） |
| 実行日時 | 2026-04-28 |
| 実行者 | worktree branch: `task-20260428-223418-wt-1`（solo 開発） |

## 2. NON_VISUAL 代替 evidence 4 階層（L1/L2/L3/L4）

| 階層 | 代替手段 | 何を保証 | 何を保証しない（→ 申し送り） |
| --- | --- | --- | --- |
| L1: 型 | adapter 出力 payload が GitHub REST `PUT /repos/{owner}/{repo}/branches/{branch}/protection` schema field（Phase 2 §4.1 マッピング表）を満たすかを jq 構造で読み取り検証 | payload field 名 / 型 / 配列 vs bool の整合 | 実 PUT 応答（200 / 422）の意味的整合 |
| L2: lint / boundary | snapshot（GET 形）vs payload（PUT 形）の **用途分離 boundary** を仕様レベルで読取検証。snapshot は PUT 不可（422 期待）、payload / rollback のみ PUT 可 | 「snapshot をそのまま PUT に流す」二重正本事故の境界 | 実走時の人為ミス（誤ファイル指定）— `apply-runbook.md` で緩和 |
| L3: in-memory test | 4 ステップ手動 smoke（dry-run / apply / GET 検証 / grep 検証）のコマンド系列を仕様レベル固定（manual-smoke-log.md に NOT EXECUTED で列挙） | 「再現する手順」の網羅性 | GitHub 実値 drift / network race / API rate limit |
| L4: 意図的 violation | (a) `required_pull_request_reviews` を非 null にした payload で適用するケース → CLAUDE.md solo 運用ポリシーと drift する状態を red 確認 / (b) snapshot をそのまま PUT する 422 ケースの red 確認 | 「赤がちゃんと赤になる」（drift / schema 違反検出） | L4 自体は green 保証ではない |

## 3. 4 ステップ手動 smoke（仕様レベル固定）

詳細は [`manual-smoke-log.md`](./manual-smoke-log.md) に NOT EXECUTED ステータスで記録。本ファイルではサマリのみ示す。

| STEP | 概要 | 期待結果 | 実走タイミング |
| --- | --- | --- | --- |
| 0 | 前提確認（UT-GOV-004 completed / 親タスク Phase 13 承認 / `gh auth status` の `administration:write` スコープ） | 全 PASS | Phase 13 承認後 |
| 1 | dry-run プレビュー（snapshot 取得 + adapter 通過後の payload との `diff -S`） | intended diff のみ（design.md §2 と一致） | Phase 13 承認後 |
| 2 | 実適用（dev / main それぞれ独立 PUT、bulk 化禁止） | HTTP 200 / applied JSON 保存 | Phase 13 承認後 |
| 3 | `gh api` GET で実値確認（`required_pull_request_reviews=null` / `required_status_checks.contexts` / `enforce_admins.enabled=true` / `lock_branch=false` 等） | 全 field が design.md §2 と一致 | Phase 13 承認後 |
| 4 | CLAUDE.md と grep 一致確認（`required_pull_request_reviews=null` / 線形履歴 / force-push 禁止 / 削除禁止 / 会話解決必須） | grep ヒット件数が期待通り、二重正本 drift 0 | Phase 13 承認後 |

## 4. spec walkthrough 確認項目

| 確認項目 | 方法 | 結果 |
| --- | --- | --- |
| 仕様書の自己完結性（前提・AC-1〜AC-14・成果物パス） | `index.md` / `phase-NN.md` 横断確認 | OK |
| adapter field マッピング表が `PUT` schema 全件カバー | Phase 2 §4.1 vs GitHub REST docs | OK（11 field） |
| dev / main 別ファイル戦略（bulk 化禁止） | `artifacts.json` の `phases[13].outputs` で `{branch}` サフィックス分離を確認 | OK |
| `enforce_admins=true` rollback 2 経路（DELETE / PUT） | Phase 2 §9.2 と Phase 13 `apply-runbook.md` 草案 | OK |
| UT-GOV-004 完了 NO-GO 条件 | Phase 1 / Phase 2 / Phase 3 で 3 重明記 + 本 Phase 11 STEP 0 で再掲 | OK |
| Phase 3/10 レビュー指摘との照合 | Phase 3 main.md PASS/MINOR 表 | OK |
| 後続実装への引き継ぎ（型定義 → 実装 / 契約 → テスト） | adapter jq 擬似コード / 4 ステップ手順 | OK |

## 5. 「実地操作不可」明示

- 本 Phase 11 は **spec walkthrough のみ**。`gh api PUT` / GET / rollback / `enforce_admins` 詰み再現は **Phase 13 ユーザー明示承認後** に別オペレーションで実走する。
- 4 ステップ手動 smoke のコマンド系列は `manual-smoke-log.md` に NOT EXECUTED ステータスで列挙し、Phase 13 で実走時にそのまま辿れる粒度で固定する。
- `enforce_admins=true` で admin 自身が block される事故シナリオは実走でしか再現できないため、本 Phase では「緊急 rollback 2 経路（`enforce_admins` サブリソース DELETE / `enforce_admins=false` 最小 patch PUT）」の存在確認に留める。

## 6. 保証できない範囲（Phase 12 unassigned-task-detection 候補）

最低 3 項目を列挙する（Phase 12 で current 区分へ formalize 判定）。

| # | 範囲 | 理由 | 受け皿候補 |
| --- | --- | --- | --- |
| 1 | GitHub 実値の eventual consistency（PUT → GET 反映の時間差） | 仕様 walkthrough では再現不可。実走時のリトライ / 確認待ち時間を runbook で別途保証する必要あり | Phase 12 unassigned-task-detection.md → `apply-runbook.md` への retry / sleep 規約追加 |
| 2 | `enforce_admins=true` 詰みの再現実験 | 実走でしか発生しないため本 Phase では未保証。緊急 rollback 2 経路の動作確認は Phase 13 実走時に行う | Phase 13 `rollback-rehearsal-log.md` へ |
| 3 | UT-GOV-004 contexts 未同期下の 2 段階適用フォールバック | UT-GOV-004 の完了状態に依存し、未完了下での挙動（contexts=[] で先行 PUT → 後追い再 PUT）は実走でしか確認できない | UT-GOV-004 完了後の併走確認タスクとして formalize 候補 |
| 4 | `gh api` rate limit / network race | 連続 PUT 4 回（dev/main × apply/rollback/再適用）の race / rate limit 抵触は spec では検出不可 | Phase 12 → `apply-runbook.md` の rate limit 待機規約 |

## 7. 関連リンク

- 上位 index: [../../index.md](../../index.md)
- Phase 2 設計: [../phase-02/main.md](../phase-02/main.md)
- Phase 3 レビュー: [../phase-03/main.md](../phase-03/main.md)
- 4 ステップ smoke 詳細: [./manual-smoke-log.md](./manual-smoke-log.md)
- リンク健全性: [./link-checklist.md](./link-checklist.md)
- 親仕様: [../../../completed-tasks/UT-GOV-001-github-branch-protection-apply.md](../../../completed-tasks/UT-GOV-001-github-branch-protection-apply.md)

## 8. 完了判定

- [x] 4 階層代替 evidence（L1/L2/L3/L4）記載済
- [x] 4 ステップ手動 smoke の NOT EXECUTED 列挙（manual-smoke-log.md）
- [x] 「実地操作不可 / Phase 13 ユーザー承認後実走」明示
- [x] 保証できない範囲 4 項目列挙（最低 3 項目要件 PASS）
- [x] spec walkthrough 確認項目 7 件すべて OK
