# Phase 10: セキュリティレビュー / 最終レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production Worker route inventory script (UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | セキュリティレビュー / 最終レビューゲート |
| 作成日 | 2026-05-01 |
| 前 Phase | 9 (品質保証 / read-only API allowlist 検証) |
| 次 Phase | 11 (NON_VISUAL 受入検証) |
| 状態 | spec_created |
| タスク分類 | docs-only / infrastructure-automation（read-only inventory script の spec 整備） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| user_approval_required | false（本 Phase は Design GO 判定のみ。commit / push / PR 承認は Phase 13 で blocked 管理） |
| GitHub Issue | #328（CLOSED 状態のままで OK・本タスクは spec_created） |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001 |

## 目的

Phase 1〜9 で蓄積した「Cloudflare route / custom domain inventory script」の設計・API allowlist 設計・出力フォーマット設計・secret-leak 防止設計・runbook 連携設計をセキュリティレビュー観点で横断確認し、production 環境への副作用ゼロ・secret 漏洩ゼロ・wrangler 直接実行ゼロ・mutation endpoint 呼び出しゼロを担保する spec に到達しているかを最終確定する。本タスクは **production deploy / route 付け替え / DNS 変更 / Worker 削除を一切実行しないスコープ** であり、read-only inventory 取得手順の正本化のみを成果物とする。

## 実行タスク

1. read-only API allowlist の妥当性レビュー（完了条件: 列挙 endpoint がすべて `GET` で、mutation 系 `POST` / `PUT` / `PATCH` / `DELETE` を含まない）。
2. secret leakage 防止レビュー（完了条件: 出力 / ログ / evidence に API token / OAuth token / Bearer header / Cookie / Zone ID 実値が一切載らない grep gate が設計されている）。
3. `bash scripts/cf.sh` ラッパー経由統一の確認（完了条件: spec 内すべての CLI 例が `bash scripts/cf.sh` 経由で記述。`wrangler` 直呼びサンプルが 0 件）。
4. production 副作用ゼロの確認（完了条件: DNS 変更 / route 付け替え / Worker 削除 / deploy のいずれも spec / 想定実装に出現しない）。
5. rate limit 配慮の確認（完了条件: CI 自動実行禁止 / 手動 Phase 11 実行のみ / API 呼び出し回数の上限と再試行戦略が記述）。
6. 脅威モデル（情報漏洩 / 権限昇格 / 否認 / 改ざん / DoS / 仕様逸脱）整理（完了条件: 6 観点すべてに対策記述）。
7. CLAUDE.md「Cloudflare 系 CLI 実行ルール」整合確認（完了条件: 不変条件 #5 / `.env` Read 禁止 / OAuth token 非保持と矛盾なし）。
8. 4条件最終判定（価値性 / 実現性 / 整合性 / 運用性）を確定する。
9. ユーザー承認ゲート: commit / push / PR は Phase 13 でユーザー承認待ちにする。
10. Design GO/NO-GO 判定を確定し `outputs/phase-10/security-review.md` を生成する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-001.md | 正本仕様（目的 / scope / リスクと対策 / 完了条件） |
| 必須 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md | 親タスク runbook（route 突合手順） |
| 必須 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-11/route-snapshot.md | 親タスク E-2（route スナップショット） |
| 必須 | CLAUDE.md | Cloudflare 系 CLI 実行ルール / `.env` Read 禁止 / OAuth token 非保持 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md | Cloudflare deploy 正本（追記方針対象） |
| 参考 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-10.md | 親 Phase 10 レビュー観点フォーマット |

## レビュー観点と結果テーブル

### 観点 × 状態 × 証跡パス

| # | レビュー観点 | 状態 | 証跡パス | 判定 |
| --- | --- | --- | --- | --- |
| R-1 | read-only API allowlist が `GET` のみ（zones, workers, routes, custom_hostnames, scripts list 系） | spec 確定 | outputs/phase-02/api-allowlist.md（前 Phase 設計） | PASS |
| R-2 | mutation 系 endpoint（`POST` / `PUT` / `PATCH` / `DELETE`）が allowlist に存在しない | spec 確定 | outputs/phase-10/security-review.md §api-allowlist | PASS |
| R-3 | API token scope が read-only（Account.Workers Scripts:Read / Zone.Workers Routes:Read 等）に限定 | spec 確定 | outputs/phase-10/cloudflare-token-scope-check.md | PASS |
| R-4 | secret-leak 防止 grep gate（`Bearer ` / `sk_` / `token=` / `secret=` / `Authorization` 等）が設計済み | spec 確定 | outputs/phase-11/secret-leak-grep.md（次 Phase で実出力） | PASS |
| R-5 | 出力 evidence が key 名 / Worker 名 / route パターンのみ（Zone ID / Account ID は mask） | spec 確定 | outputs/phase-11/route-inventory-output-sample.md | PASS |
| R-6 | `bash scripts/cf.sh` ラッパー経由統一（`wrangler ` 直呼び 0 件） | spec 確定 | grep gate（Phase 11 E-2 相当） | PASS |
| R-7 | production 副作用ゼロ（DNS / route 付け替え / Worker 削除 / deploy 不実行） | spec 確定 | 正本 §2「含まない」/ runbook 冒頭 scope | PASS |
| R-8 | rate limit 配慮（CI 自動実行禁止 / 手動 Phase 11 実行のみ / 呼び出し回数上限） | spec 確定 | outputs/phase-10/security-review.md §rate-limit | PASS |
| R-9 | NON_VISUAL evidence 設計（output sample / leak grep / mutation grep）が十分 | spec 確定 | Phase 11 evidence 設計 | PASS |
| R-10 | 受け側実装タスクへの handoff 設計（後続 unassigned `UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001`） | spec 確定 | Phase 12 unassigned-task-detection | PASS |

## 脅威モデル

| # | 脅威カテゴリ | シナリオ | 対策 | 残存リスク |
| --- | --- | --- | --- | --- |
| T-1 | 情報漏洩（Confidentiality） | API token 値 / OAuth token / Bearer header が出力 / ログ / commit 履歴に残る | (a) `bash scripts/cf.sh` で op 経由揮発注入のみ (b) 出力前 grep gate (c) evidence は key 名 / pattern 名のみ (d) `.env` Read 禁止再掲 | grep gate が pattern を漏らす可能性。`outputs/phase-10/security-review.md` で正規表現一覧を網羅化し対策。 |
| T-2 | 権限昇格（Authorization） | mutation 権限を持つ token を script が誤使用し production を変更 | API token scope を read-only に限定（Account.Workers Scripts:Read / Zone.Workers Routes:Read / Zone.Zone:Read のみ）。token-scope-check.md に scope 列挙。 | 1Password 側 token scope の実値確認は手動 Phase 11 で実施（受け側実装タスク完了後）。 |
| T-3 | 否認（Non-repudiation） | inventory 結果が誰による取得か追跡不能 | 取得日時 / 取得者（`bash scripts/cf.sh whoami` のアカウント名のみ）/ 取得コマンドラインを evidence header に記録。 | アカウント名以上の identity 情報は記録しない（PII 配慮）。 |
| T-4 | 改ざん（Integrity） | inventory 出力後に手動編集で route 対応表が偽装される | output に source（`api` / `dashboard-fallback`）と取得 timestamp を埋め込む。Phase 11 evidence は git で commit され diff レビュー対象。 | git commit 前の手動編集は git diff で検出可能。 |
| T-5 | DoS（Availability） | inventory script を高頻度実行し Cloudflare API rate limit を超過 | (a) CI 自動実行禁止 (b) 手動 Phase 11 実行のみ (c) 呼び出し回数を 1 回 / 取得セッションに制限 (d) 429 時は再試行せず fail-fast | 親タスク Phase 11 と同時実行時の rate limit 競合は serial 実行ルールで回避。 |
| T-6 | 仕様逸脱（Scope creep） | script に DNS 変更 / route 付け替え / Worker 削除 / deploy が紛れ込む | (a) 正本 §2「含まない」明記 (b) Phase 10 / 11 / 13 で重複明記 (c) read-only API allowlist 限定 (d) PR diff レビューで実コード混入チェック | docs-only スコープ違反は Phase 13 grep gate で検出。 |

## production 副作用ゼロ宣言【Phase 10 / 11 / 13 で重複明記】

> **本タスク（UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001）は production 環境に対する一切の mutation を実行しない。**
>
> 以下のいずれも本 PR / 本 spec / 受け側実装タスク（後続 unassigned）で実行禁止:
>
> - DNS record の変更（A / CNAME / TXT / MX いずれも）
> - route / custom domain の付け替え（routes API の `POST` / `PUT` / `DELETE`）
> - Worker（旧 / 新 いずれも）の削除（scripts API の `DELETE`）
> - production deploy（`bash scripts/cf.sh deploy` 実行）
> - secret put / delete（secrets API の mutation）
> - `wrangler login` による OAuth token のローカル保持
>
> 確認手段: Phase 11 `outputs/phase-11/mutation-endpoint-grep.md` で script 内 `POST|PUT|PATCH|DELETE` 0 件を grep 確定する。

## 4条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 親タスク Phase 11 で手動転記に依存していた route → Worker 対応表を機械的に取得可能にし、production deploy 直前の split-brain 検出を自動化する一次防御線を確立。 |
| 実現性 | PASS | Cloudflare API は read-only scope でも routes / custom hostnames / scripts list を取得可能。`bash scripts/cf.sh` で op 経由 token 注入が確立済み。 |
| 整合性 | PASS | CLAUDE.md「Cloudflare 系 CLI 実行ルール」/「`.env` Read 禁止」/「OAuth token 非保持」/ 不変条件 #5 に矛盾なし。 |
| 運用性 | PASS | CI 自動実行禁止 / 手動 Phase 11 実行のみ。rate limit 配慮済み。受け側実装タスクへの handoff が unassigned-task として明示。 |

**最終判定: Design GO（PASS）**

実測 GO は後続実装タスク `UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001` の read-only smoke 完了後に判定する。本 Phase の GO は、docs-only spec と handoff 契約が実装に進める状態であることだけを意味する。

## blocker 一覧

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | 親タスク UT-06-FU-A-PROD-ROUTE-SECRET-001 が完了 | 上流 | completed-tasks 配下に移動済 | `ls docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/` |
| B-02 | 1Password 上の `CLOUDFLARE_API_TOKEN`（read-only scope）が登録済み | 環境 | `op` 経由解決可能 | `bash scripts/cf.sh whoami` |
| B-03 | `bash scripts/cf.sh` ラッパー存在 | 環境 | `scripts/cf.sh` 実在 | `ls scripts/cf.sh` |
| B-04 | API allowlist 設計が前 Phase で確定 | 設計 | outputs/phase-02/api-allowlist.md 存在 | grep |
| B-05 | secret-leak 検出 grep pattern 列挙 | 設計 | 正規表現リスト確定 | outputs/phase-10/security-review.md §grep-pattern |

## MAJOR 検出時の戻りフロー

| 検出例 | 戻り先 Phase | 再評価条件 |
| --- | --- | --- |
| spec / 想定実装に mutation endpoint が含まれる | Phase 2（API 設計） | allowlist を `GET` のみに絞り直し |
| `wrangler` 直呼びサンプルが残存 | Phase 8（DRY 化） | 全 CLI を `bash scripts/cf.sh` 経由に統一 |
| 出力 evidence サンプルに API token 実値 | Phase 8 → Phase 9 | サンプル全箇所 mask 化 / grep gate 強化 |
| API token scope が write 権限を含む | Phase 2 → Phase 10 再実行 | scope を read-only に限定 |
| CI 自動実行手順が残っている | Phase 9（QA） | CI 不実行を明記し手動 Phase 11 のみへ |

## ユーザー承認ゲート【Phase 13 blocked】

| 段階 | アクション | 承認証跡パス |
| --- | --- | --- |
| 1. 観点マトリクス提示 | R-1〜R-10 + 4条件 + 脅威モデル + blocker をユーザーに提示 | outputs/phase-10/security-review.md §「観点マトリクス」 |
| 2. MAJOR 不在の確認 | MAJOR 0 を明示 | outputs/phase-10/security-review.md §「MAJOR 判定結果」 |
| 3. ユーザー承認取得 | ユーザーから commit / push / PR の明示的応答を得る | Phase 13 `pr-info.md` / `pr-creation-result.md` |
| 4. 承認後 Phase 13 実行 | 承認後のみ commit / PR 作成を実行 | Phase 13 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | Design GO 判定 + 脅威モデルの対策結果を NON_VISUAL evidence の検証項目として転記 |
| Phase 12 | 受け側実装タスクを unassigned-task として formalize（`UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001`） |
| Phase 13 | Design GO/NO-GO 結果と production 副作用ゼロ宣言を PR description に転記 |
| 親 UT-06-FU-A-PROD-ROUTE-SECRET-001 | runbook の link を双方向化 |

## 多角的チェック観点

- 価値性: 手動転記 → 機械化による split-brain 検出強化
- 実現性: read-only API token + `scripts/cf.sh` で完結
- 整合性: CLAUDE.md / aiworkflow-requirements 正本と矛盾なし
- 運用性: CI 自動実行禁止 / 手動 Phase 11 のみ
- 認可境界: API token scope read-only 限定
- Secret hygiene: grep gate / op 経由揮発注入 / `.env` Read 禁止

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | read-only API allowlist 妥当性レビュー | spec_created | `GET` のみ |
| 2 | secret leakage 防止レビュー | spec_created | grep pattern 列挙 |
| 3 | scripts/cf.sh 経由統一確認 | spec_created | wrangler 直呼び 0 |
| 4 | production 副作用ゼロ確認 | spec_created | DNS/route/delete/deploy 不実行 |
| 5 | rate limit 配慮確認 | spec_created | CI 自動実行禁止 |
| 6 | 脅威モデル整理（6 観点） | spec_created | T-1〜T-6 |
| 7 | CLAUDE.md 整合確認 | spec_created | 不変条件 #5 |
| 8 | 4条件最終判定 | spec_created | PASS |
| 9 | ユーザー承認取得設計 | spec_created | Phase 13 approval-record で統合 |
| 10 | Design GO/NO-GO 判定 | spec_created | Design GO |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/security-review.md | レビュー観点 / 4条件 / blocker / MAJOR 戻りフロー / Design GO/NO-GO |
| ドキュメント | outputs/phase-10/threat-model.md | T-1〜T-6 脅威モデル詳細 |
| ドキュメント | outputs/phase-10/cloudflare-token-scope-check.md | API token scope（read-only）列挙 |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 完了条件

- [ ] R-1〜R-10 観点マトリクスがすべて PASS
- [ ] 脅威モデル T-1〜T-6 すべてに対策記述
- [ ] read-only API allowlist が `GET` のみで mutation 系不在
- [ ] secret-leak 防止 grep pattern が列挙されている
- [ ] `bash scripts/cf.sh` 経由統一（`wrangler ` 直呼び 0）
- [ ] production 副作用ゼロ宣言が記述
- [ ] rate limit 配慮（CI 自動実行禁止 / 手動 Phase 11 のみ）
- [ ] CLAUDE.md「Cloudflare 系 CLI 実行ルール」整合
- [ ] 4条件最終判定が PASS
- [ ] blocker B-01〜B-05 が記述
- [ ] MAJOR 検出時の戻りフローが定義
- [ ] ユーザー承認ゲートが Phase 13 approval-record と連動

## タスク100%実行確認【必須】

- 全実行タスク（10 件）が `spec_created`
- 成果物 3 ファイル（security-review.md / threat-model.md / cloudflare-token-scope-check.md）が配置予定
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11 (NON_VISUAL 受入検証)
- 引き継ぎ事項:
  - Design GO 判定 + 脅威モデル対策結果
  - blocker B-01〜B-05（Phase 11 着手前再確認）
  - production 副作用ゼロ宣言を Phase 11 冒頭に再宣言
  - secret-leak 防止 grep pattern を Phase 11 evidence で実行
- ブロック条件:
  - mutation endpoint が allowlist に残存
  - secret-leak grep pattern 未確定
  - `wrangler` 直呼びサンプル残存
  - rate limit 配慮なし
