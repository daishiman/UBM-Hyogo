# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-GOV-001 second-stage contexts reapply（task-utgov001-second-stage-reapply-001） |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（後追い再 PUT 検証戦略） |
| 作成日 | 2026-04-30 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | spec_created |
| タスク状態 | spec_created（GitHub Issue #202 は CLOSED でも仕様書 GO 済み） |
| タスク分類 | implementation / governance / NON_VISUAL（REST API 検証 / 静的検証 / 差分検証） |

## 目的

本タスクはコード実装ゼロ・REST API 操作のみ・成果物が JSON / runbook の NON_VISUAL タスクである。したがって従来の Vitest unit / integration テストではなく、**「GitHub branch protection の GET / PUT 往復を経由した実値検証」+「適用前後 GET の差分が contexts のみであることの静的検証」+「期待 contexts と適用後 contexts の集合一致検証」+「dev / main 独立検証（片側のみパスは全体 FAIL）」**を中心に検証戦略を組む。Phase 5 の実装ランブックが「同じ検証を 2 回（dev / main 別）回し、片側でも FAIL なら全体 FAIL」とする運用を、本 Phase の `outputs/phase-04/test-strategy.md` で固定する。

## 本 Phase でトレースする AC

- AC-3（適用前 GET が dev / main で個別取得・保全されている）
- AC-5（dev / main 独立 PUT が REST API で成功し応答 JSON が保存されている）
- AC-6（適用後 GET の `required_status_checks.contexts` が期待 contexts と完全一致している証跡）
- AC-7（CLAUDE.md / deployment-branch-strategy.md と drift がないことの確認）

## 実行タスク

1. 検証スイートを 4 種類（静的検証 / REST API 検証 / 差分検証 / drift 検証）に分類する（完了条件: 種別 × 検証観点のマトリクスに空セルなし）。
2. GET → PUT → GET の往復検証手順を確定する（完了条件: HTTP ステータス・headers・body の検証ポイントが記述）。
3. 期待 contexts と適用後 contexts の集合一致検証コマンドを定義する（完了条件: `jq` ベースで順序不問の集合比較 1-liner が記述）。
4. dev / main 独立検証ルール（片側 FAIL = 全体 FAIL）を明文化する（完了条件: 失敗時挙動と合否判定が記述）。
5. 暫定 `contexts=[]` 残留検出手順を記述する（完了条件: applied JSON が `[]` でないことの検査コマンド）。
6. workflow 名混入検出（実在 check-run のみであることの検証）を記述する（完了条件: `.yml` 拡張子が contexts に含まれていないことの検査コマンド）。
7. drift 検証（CLAUDE.md / deployment-branch-strategy.md）の手順を記述する（完了条件: 6 値の対応表との手動 diff 手順）。
8. rollback 経路は UT-GOV-001 rollback payload の再利用検証のみであることを明記する（完了条件: 本タスクで新規 rollback rehearsal を行わない原則の記述）。
9. admin block 回避検証（PUT 直前チェックリスト適用結果の確認）を記述する（完了条件: open PR の check-run 進行状況確認手順）。
10. 実行順序・失敗時挙動・AC 対応表を記述する（完了条件: AC-3 / AC-5 / AC-6 / AC-7 がトレース可能）。
11. 成果物 1 ファイル（`outputs/phase-04/test-strategy.md`）を作成する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/index.md | 正本語彙・AC・苦戦箇所 |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-02.md | 設計成果物（contexts-source.json / expected-contexts-{dev,main}.json / payload-design.md） |
| 必須 | docs/30-workflows/completed-tasks/utgov001-second-stage-reapply/phase-03.md | 4 条件 PASS / 30 種思考法 PASS / リスクレジスタ |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 1 段階目 applied JSON / rollback payload |
| 必須 | UT-GOV-004 成果物（`required-status-checks-contexts.{dev,main}.json`） | 期待 contexts の唯一の入力源 |
| 必須 | CLAUDE.md（ブランチ戦略 / Governance） | drift 検証基準（6 値） |
| 必須 | GitHub REST API: `GET/PUT /repos/{owner}/{repo}/branches/{branch}/protection` | スキーマ正本 |
| 参考 | docs/30-workflows/ut09-direction-reconciliation/phase-04.md | NON_VISUAL タスクのテスト戦略フォーマット参考 |

## 検証スイート設計（4 種類）

### 1. 静的検証（payload 構造 / contexts 配列要素のセマンティクス確認）

| 検証観点 | 対象ファイル | 期待結果 | 検証コマンド例 |
| --- | --- | --- | --- |
| payload スキーマ妥当性 | `branch-protection-payload-{dev,main}.json` | `required_status_checks.contexts` が配列型・空でない | `jq '.required_status_checks.contexts | type=="array" and length>0'` |
| 暫定 `contexts=[]` 残留なし | 同上 | 配列長 ≥ 1 | `jq '.required_status_checks.contexts | length'` が 1 以上 |
| workflow 名混入なし | 同上 | 各要素が `.yml` を含まない | `jq '.required_status_checks.contexts[] | test("\\.ya?ml$")'` がすべて `false` |
| 不変条件 6 値の維持 | 同上 | `enforce_admins=true` / `allow_force_pushes=false` / `allow_deletions=false` / `required_linear_history=true` / `required_conversation_resolution=true` / `required_pull_request_reviews=null` | `jq` で 6 値を個別検査 |
| dev / main payload の差分が contexts のみであること | 両 payload | 他 5 軸が完全一致 | `jq 'del(.required_status_checks.contexts)'` 同士の diff が 0 行 |

### 2. REST API 検証（HTTP ステータス・headers・body）

| 検証観点 | 対象 endpoint | 期待結果 | 検証手段 |
| --- | --- | --- | --- |
| 適用前 GET 成功 | `GET /repos/{owner}/{repo}/branches/dev/protection` | HTTP 200 | `gh api ... --include` で headers 確認 |
| 適用前 GET 成功（main） | `GET /repos/{owner}/{repo}/branches/main/protection` | HTTP 200 | 同上 |
| dev PUT 成功 | `PUT /repos/{owner}/{repo}/branches/dev/protection` | HTTP 200 | `gh api -X PUT ... --include` |
| main PUT 成功 | `PUT /repos/{owner}/{repo}/branches/main/protection` | HTTP 200 | 同上 |
| 適用後 GET 成功（両 branch） | `GET /repos/{owner}/{repo}/branches/{dev,main}/protection` | HTTP 200 | 同上 |
| rate limit 残量 | response header `x-ratelimit-remaining` | 任意（記録のみ） | `--include` で記録 |

### 3. 差分検証（適用前後 GET の `jq` diff、contexts 以外不変）

| 検証観点 | 対象ファイル | 期待結果 | 検証コマンド例 |
| --- | --- | --- | --- |
| dev: 適用前後 GET の差分が contexts のみ | `branch-protection-current-dev.json` vs `branch-protection-applied-dev.json` | contexts 以外完全一致 | `diff <(jq 'del(.required_status_checks.contexts)' current) <(jq 'del(.required_status_checks.contexts)' applied)` 出力 0 行 |
| main: 同上 | 対応する dev 版を main に置換 | 同上 | 同上 |
| dev: 適用後 contexts が期待 contexts と集合一致 | `branch-protection-applied-dev.json` vs `expected-contexts-dev.json` | 配列の集合一致（順序不問） | `jq -S '.required_status_checks.contexts | sort'` 同士の diff が 0 行 |
| main: 同上 | dev を main に置換 | 同上 | 同上 |

### 4. drift 検証（CLAUDE.md / deployment-branch-strategy.md と GitHub 側）

| 検証観点 | 対象 | 期待結果 |
| --- | --- | --- |
| `required_pull_request_reviews=null` 維持 | applied JSON / CLAUDE.md | 両者で `null` |
| `enforce_admins=true` 維持 | applied JSON / CLAUDE.md | 両者で `true` |
| `allow_force_pushes=false` 維持 | applied JSON / CLAUDE.md | 両者で `false` |
| `allow_deletions=false` 維持 | applied JSON / CLAUDE.md | 両者で `false` |
| `required_linear_history=true` 維持 | applied JSON / CLAUDE.md | 両者で `true` |
| `required_conversation_resolution=true` 維持 | applied JSON / CLAUDE.md | 両者で `true` |

> drift 検出時は別タスク起票（CLAUDE.md / deployment-branch-strategy.md / aiworkflow-requirements references の追従更新）として Phase 12 unassigned-task-detection に渡す。

## 実行順序

1. 静的検証（PUT 前に payload を全件チェック / 失敗時は PUT に進まない）
2. REST API 検証（適用前 GET → dev PUT → dev 適用後 GET → main PUT → main 適用後 GET）
3. 差分検証（適用前後 GET の差分・期待 contexts との集合一致）
4. drift 検証（CLAUDE.md / deployment-branch-strategy.md と applied JSON の照合）
5. admin block 回避検証（PUT 直前 / 直後の open PR check-run 進行状況確認）

> 1 → 2 → 3 → 4 → 5 の直列実行。dev / main それぞれで 2 → 3 を完結させ、片側 FAIL は即時 rollback。

## 失敗時挙動

| 失敗パターン | 即時挙動 | rollback 採否 |
| --- | --- | --- |
| 静的検証 FAIL | PUT を実行しない / payload 修正 | rollback 不要（PUT 未実行） |
| dev PUT FAIL（HTTP ≠ 200） | main PUT に進まない / dev 側 rollback 検討 | UT-GOV-001 rollback payload を dev に再 PUT |
| main PUT FAIL（dev PUT 成功後） | dev は維持・main 側のみ rollback | UT-GOV-001 rollback payload を main に再 PUT |
| 適用後 GET の集合不一致 | 該当 branch のみ rollback | UT-GOV-001 rollback payload を該当 branch に再 PUT |
| drift 検出 | applied JSON を正本としつつ CLAUDE.md 等の追従更新タスクを別起票 | rollback しない（drift は GitHub 側を正本とする原則） |
| admin block 検出 | 即時 rollback | UT-GOV-001 rollback payload を該当 branch に再 PUT |

## AC との対応表

| AC | 検証手段 | 検証種別 | 成果物 |
| --- | --- | --- | --- |
| AC-3 | 適用前 GET 2 回（dev / main）の成功と保全 | REST API 検証 | `outputs/phase-13/branch-protection-current-{dev,main}.json` |
| AC-5 | dev / main 独立 PUT 各 HTTP 200 と applied JSON 保全 | REST API 検証 | `outputs/phase-13/branch-protection-applied-{dev,main}.json` |
| AC-6 | applied JSON の contexts と expected-contexts の集合一致 | 差分検証 | `outputs/phase-09/main.md` 内の集合一致記録 |
| AC-7 | drift 検査 6 値の一致 | drift 検証 | `outputs/phase-09/drift-check.md` |
| AC-9 | workflow 名混入検出スキャン | 静的検証 | `outputs/phase-04/test-strategy.md` 内のチェック項目 |
| AC-10 | admin block 回避 PUT 直前チェックリスト適用結果 | REST API 検証 | runbook 内の direct check |

## rollback リハーサル代替

本タスクでは新規 rollback rehearsal を行わない（UT-GOV-001 で完了済）。代替として以下を行う:

- UT-GOV-001 で確立した rollback payload（dev / main 各 1 ファイル）が `docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md` 配下に保全されていることを確認。
- 本タスクで rollback payload を上書き・再生成しない原則を `outputs/phase-04/test-strategy.md` に明記。
- 失敗時は本タスクの runbook（Phase 5）から UT-GOV-001 rollback payload を **そのまま再 PUT** する経路のみを採用。

## admin block 検証（PUT 直前チェックリスト適用結果）

PUT 直前 / 直後で以下を確認し、すべて PASS であることを `outputs/phase-04/test-strategy.md` のチェックリストとして固定する:

- [ ] 直前 open PR の HEAD が、期待 contexts に対応する check-run を **すべて green** で完了している
- [ ] 期待 contexts に typo / 廃止 workflow 名が混入していない（静的検証 1 回目で確認済）
- [ ] rollback payload（UT-GOV-001 由来）への path が手元で開かれている
- [ ] PUT 後 60 秒以内に open PR の merge 可否が UI で確認可能な状態である

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | GET / PUT / GET と差分検証のテスト観点を runbook へ渡す |
| Phase 7 | AC-1〜AC-14 の evidence matrix へ検証観点を渡す |
| Phase 9 | payload/current/applied JSON の品質検証へ渡す |
| Phase 13 | user approval 後の実測ログへ渡す |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| テスト戦略 | outputs/phase-04/test-strategy.md | 4 種検証スイート / 実行順序 / 失敗時挙動 / AC 対応表 / admin block チェックリスト |
| メタ | artifacts.json | Phase 4 状態の更新 |

## 完了条件

Acceptance Criteria for this Phase:

- [ ] 検証スイート 4 種類（静的 / REST API / 差分 / drift）が定義されている
- [ ] GET → PUT → GET の往復検証手順が記述されている
- [ ] 期待 contexts と適用後 contexts の集合一致検証コマンドが `jq` ベースで記述されている
- [ ] dev / main 独立検証（片側 FAIL = 全体 FAIL）が明文化されている
- [ ] 暫定 `contexts=[]` 残留検出 / workflow 名混入検出のコマンドが記述されている
- [ ] drift 検証 6 値が CLAUDE.md / deployment-branch-strategy.md と対応している（AC-7）
- [ ] rollback リハーサル代替（UT-GOV-001 rollback payload 再利用検証のみ）が明記されている
- [ ] admin block 回避 PUT 直前チェックリストが 4 項目以上記述されている（AC-10）
- [ ] AC 対応表に AC-3 / AC-5 / AC-6 / AC-7 / AC-9 / AC-10 が含まれている
- [ ] 成果物 `outputs/phase-04/test-strategy.md` が配置設計済み

## タスク 100% 実行確認【必須】

- 全実行タスク（11 件）が `spec_created`
- 全成果物が `outputs/phase-04/` 配下に配置設計済み
- 本 Phase でトレースする AC（AC-3 / AC-5 / AC-6 / AC-7）が完了条件にすべて含まれている
- 静的 / REST API / 差分 / drift の 4 系統で空セルなし
- artifacts.json の `phases[3].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - 検証スイート 4 種類（静的 / REST API / 差分 / drift）が確定
  - dev / main 独立検証ルール（片側 FAIL = 全体 FAIL）を runbook に組み込む
  - 失敗時の rollback 経路は UT-GOV-001 rollback payload の再利用のみ（新規生成禁止）
  - admin block 回避 PUT 直前チェックリストを runbook に組み込む
  - drift 検出時は別タスク起票（CLAUDE.md / deployment-branch-strategy.md / references の追従）として Phase 12 へ
- ブロック条件:
  - 検証スイートの不足 / AC-3, AC-5, AC-6, AC-7 のいずれかが未トレース
  - rollback 経路が UT-GOV-001 由来でなく本タスクで新規生成されている
