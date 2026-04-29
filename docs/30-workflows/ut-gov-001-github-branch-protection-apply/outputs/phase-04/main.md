# Phase 4 成果物 — テスト戦略

## 1. テスト戦略サマリ

UT-GOV-001 base case（案 A: gh api 直叩き + payload Git 管理 / lane 1〜5 直列）に対し、**T1〜T5 の 5 ケース**を Phase 5 着手前の Green 条件として固定する。実走は Phase 5 / Phase 6 / Phase 11 / Phase 13（ユーザー承認後 PUT）に委譲し、本 Phase はコマンド系列・期待値・Red 状態の正本化のみを行う。`gh api PUT` は本 Phase で実行しない。

## 2. 前提条件（NO-GO ゲート再確認）

- UT-GOV-004（`required_status_checks.contexts` 実在 job 名同期）が completed（Phase 1 / 2 / 3 で 3 重明記済み）。
- 同時完了の場合のみ T5（2 段階適用フォールバック）を採用し、Phase 13 完了条件に第 2 段階再 PUT を含める。
- Phase 13 のユーザー承認（user_approval_required: true）が未完了の状態では、本テストの **実走は禁止**（仕様確認のみ）。

## 3. T1: dry-run 差分検証（snapshot ↔ payload）

| 項目 | 内容 |
| --- | --- |
| ID | T1 |
| 対象 lane | lane 3（dry-run） |
| 検証コマンド | `diff <(jq -S . snapshot-dev.json) <(jq -S . payload-dev.json)` / `diff <(jq -S . snapshot-main.json) <(jq -S . payload-main.json)` |
| 期待値 | intended diff のみが出力され、`outputs/phase-13/apply-runbook.md §dry-run-diff` に記録された差分とバイト一致 |
| Red 状態 | snapshot と payload の構造が一致せず unintended diff が混入（adapter 未通過 / 古い contexts 残存 / `lock_branch=true` 混入） |
| 失敗時切り分け | (a) adapter で `enforce_admins.enabled` 抽出漏れ / (b) `restrictions.users[].login` flatten 漏れ / (c) `required_pull_request_reviews=null` 固定漏れ / (d) UT-GOV-004 未反映 contexts |

## 4. T2: GET → PUT 正規化 adapter の単体検証

| 項目 | 内容 |
| --- | --- |
| ID | T2 |
| 対象 lane | lane 2（adapter） |
| 検証コマンド | `jq -e` で 11 field の型・必須キー・禁止値を検証し、UT-GOV-004 contexts 積集合と `diff` する。API への PUT / curl は Phase 13 承認前に実行しない |
| 期待値 | 11 field（§8.1 最低限）が PUT schema に正規化済み。`enforce_admins=bool` / `restrictions.users=[login]` / `required_pull_request_reviews=null` / `lock_branch=false` 固定 |
| Red 状態 | GET 形ネスト構造（`enforce_admins.enabled` / `restrictions.users[].login`）が残存 / `lock_branch=true` 混入 |
| 失敗時切り分け | (a) jq adapter の field 漏れ / (b) UT-GOV-004 contexts 未反映 → 空配列で 2 段階適用 (T5) へ / (c) `lock_branch=true` 混入（§8.3 違反） |

### 3.1 adapter 11 field チェックリスト（T2 突合用）

| # | field | PUT 形 | 検証 jq |
| --- | --- | --- | --- |
| 1 | `required_status_checks` | `{strict, contexts[]}` | `.required_status_checks \| (.strict, .contexts) ` |
| 2 | `enforce_admins` | bool | `.enforce_admins \| type == "boolean"` |
| 3 | `required_pull_request_reviews` | null | `.required_pull_request_reviews == null` |
| 4 | `restrictions` | `{users:[login], teams:[slug], apps:[slug]} or null` | `.restrictions == null or (.restrictions.users \| all(type == "string"))` |
| 5 | `required_linear_history` | bool | `.required_linear_history \| type == "boolean"` |
| 6 | `allow_force_pushes` | bool（false 固定） | `.allow_force_pushes == false` |
| 7 | `allow_deletions` | bool（false 固定） | `.allow_deletions == false` |
| 8 | `required_conversation_resolution` | bool | `.required_conversation_resolution \| type == "boolean"` |
| 9 | `lock_branch` | bool（**false 固定**） | `.lock_branch == false` |
| 10 | `allow_fork_syncing` | bool | `.allow_fork_syncing \| type == "boolean"` |
| 11 | `block_creations` | bool（任意） | `.block_creations \| type == "boolean" or . == null` |

## 5. T3: dev / main 独立 PUT 検証（bulk 化禁止）

| 項目 | 内容 |
| --- | --- |
| ID | T3 |
| 対象 lane | lane 4（apply） |
| 検証コマンド | (1) `gh api repos/{owner}/{repo}/branches/dev/protection -X PUT --input payload-dev.json > applied-dev.json` の exit 0 / (2) **別コマンドとして** `gh api repos/{owner}/{repo}/branches/main/protection -X PUT --input payload-main.json > applied-main.json` の exit 0 |
| 期待値 | 2 コマンドそれぞれが独立 exit 0。`applied-{dev,main}.json` が `{branch}` サフィックス分離で生成 |
| Red 状態 | bulk script で一括 PUT / `applied.json`（サフィックス無し）出力 / 片側失敗で両側 rollback の設計 |
| 失敗時切り分け | (a) bulk script 残存（§8.5） / (b) `{branch}` サフィックス未分離 / (c) 片側失敗時の連鎖 rollback 設計 |

## 6. T4: rollback リハーサル検証（double-apply）

| 項目 | 内容 |
| --- | --- |
| ID | T4 |
| 対象 lane | lane 5（rollback rehearsal） |
| 検証コマンド | (1) `gh api repos/{owner}/{repo}/branches/dev/protection -X PUT --input rollback-dev.json` → (2) `gh api repos/{owner}/{repo}/branches/dev/protection \| jq -S .` が rollback payload と一致 → (3) `gh api repos/{owner}/{repo}/branches/dev/protection -X PUT --input payload-dev.json` で再適用 → (4) `gh api repos/{owner}/{repo}/branches/dev/protection \| jq -S .` が payload と一致。main 側も同手順 |
| 緊急経路 | (a) `gh api repos/{owner}/{repo}/branches/main/protection/enforce_admins -X DELETE`（DELETE 経路） / (b) `gh api ... -X PUT --input rollback-main.json`（PUT 経路） |
| 期待値 | 4 ステップすべて exit 0。GitHub 実値が rollback → 本適用の double-apply を通過。緊急 DELETE 経路が runbook に記載・担当者（solo 運用 = 実行者本人）明記 |
| Red 状態 | rollback payload が adapter 未通過 / DELETE 経路 runbook 未記載 / 再適用後の GET が payload と乖離 |
| 失敗時切り分け | (a) rollback payload が snapshot そのまま（§8.1 違反） / (b) `enforce_admins=true` 詰み rollback 担当者明記なし（§8.4） / (c) `required_pull_request_reviews` が null 以外で復元 |

## 7. T5: contexts 空配列 → UT-GOV-004 反映の 2 段階適用ケース

| 項目 | 内容 |
| --- | --- |
| ID | T5 |
| 対象 lane | lane 2 + lane 4（案 D フォールバック） |
| シナリオ | UT-GOV-004 が同時完了で第 1 段階時点では同期済み job 名が空。第 1 段階で `contexts=[]` payload 適用 → UT-GOV-004 完了後に第 2 段階で contexts 入り payload を再 PUT |
| 検証コマンド | (1) `jq '.required_status_checks.contexts' payload-dev.json` → `[]` / (2) `gh api ... -X PUT --input payload-dev.json` 第 1 段階適用 / (3) UT-GOV-004 完了後 `jq '.required_status_checks.contexts' payload-dev.json` 非空 / (4) `gh api ... -X PUT` 第 2 段階再適用 / (5) `gh api ... GET \| jq '.required_status_checks.contexts'` が UT-GOV-004 積集合と一致 |
| 期待値 | 第 1・第 2 段階とも exit 0。第 2 段階完了後の GitHub 実値 contexts に typo / 将来予定 job が無く UT-GOV-004 同期済み job 名のみ |
| Red 状態 | 第 1 段階で contexts に未出現値混入 → PR 全 block / 第 2 段階の再 PUT が runbook 不在で抜け落ち / Phase 13 完了条件に第 2 段階未組込 |
| 失敗時切り分け | (a) 第 1 段階で `contexts=[]` 強制ロジック未実装 / (b) UT-GOV-004 完了通知から第 2 段階トリガの runbook 手順欠落 / (c) 第 2 段階再 PUT 後の GET 検証欠落 |

## 8. テストカバレッジ目標（変更ブロック 100%）

| スコープ | 対象 | 100% 被覆を担う T |
| --- | --- | --- |
| adapter 11 field マッピング（§8.1 最低限） | payload-{dev,main}.json / rollback-{dev,main}.json の生成行 | T1 + T2 |
| dev / main 独立 PUT（§8.5） | lane 4 apply ステップ × 2 | T3 |
| rollback 3 経路（§8.4 / Phase 2 §9） | 通常 PUT / 緊急 DELETE / 再適用 PUT | T4 |
| 2 段階適用フォールバック（案 D / §8.2） | 第 1 段階 `contexts=[]` / 第 2 段階再 PUT | T5 |
| CLAUDE.md ↔ GitHub 実値の drift 検出（§8.6） | `grep -E "required_pull_request_reviews\s*[:=]?\s*null" CLAUDE.md` + GET 結果 | T4 末尾 |

> 「全ファイル一律 X%」表記は **禁止**（payload JSON / runbook を触るのみで apps/* に影響しない）。スコープ 5 件で line / branch 100% を要求する。

## 9. 実走計画（本 Phase 範囲外）

| 実走 Phase | 対象 T | 備考 |
| --- | --- | --- |
| Phase 5 ランブック実走 | T1 / T2 | adapter 生成・dry-run までは実 PUT を伴わず実行可能 |
| Phase 6 異常系 | T1〜T5 の Red 系 | 422 / contexts 不在 / lock_branch 誤投入 / 片側適用ミス / GET→PUT field drift |
| Phase 11 smoke | T3 / T4 / T5 | 実 PUT を伴うため Phase 13 ユーザー承認後の dev → main 順序で実走 |
| Phase 13 PR + ユーザー承認後 PUT | T3 / T4 / T5 全件 | applied-{dev,main}.json / rollback-rehearsal-log.md を最終証跡として保全 |

## 10. 引き渡し（Phase 5 へ）

- T1〜T5 を Phase 5 ランブック Step 1〜5 の Green 条件として転記
- T2 の 11 field チェックリストを Phase 5 Step 2 の確認コマンドへ転記
- T4 緊急 DELETE 経路を Phase 5 Step 5 / Phase 11 apply-runbook.md に転記
- T5 第 2 段階再 PUT を Phase 13 完了条件に組み込む（Phase 3 notes #1 の最終受け皿）
- 実走は本ワークフロー外 / 本 Phase で `gh api PUT` を実行しない
