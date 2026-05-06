# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | issue-351-09c-post-release-dashboard-automation |
| phase | 03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local |
| phase_status | completed |

Phase 02 の設計を 3 系統（システム系 / 戦略・価値系 / 問題解決系）でレビューし、Phase 04 以降に進める前に論点を解消する。


## 目的

設計が 09c 親仕様、Cloudflare 運用、secret 分離、free-tier 制約と矛盾しないことを確認する。


## 実行タスク

- 既存本文の該当 Phase 内容を確認する。
- artifacts.json の phase status と outputs 宣言に矛盾がないことを確認する。
- 後続実装が必要な項目は user gate と evidence path を明示する。


## 参照資料

- `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/index.md`
- `docs/30-workflows/issue-351-09c-post-release-dashboard-automation/artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`


## 成果物

- `phase-03.md`
- `outputs/phase-03/` 配下の宣言済み成果物


## 完了条件

- [x] Phase 本文が skill 必須セクションを満たす
- [x] artifacts.json の status と矛盾しない
- [x] commit / push / PR を user 明示承認まで実行しない


## 統合テスト連携

- 本仕様書サイクルでは実装未着手のため、実行可能な統合テストは後続実装サイクルで取得する。
- Phase 11 では NON_VISUAL evidence として CLI / GitHub Actions log / artifact JSON / redaction check / schema check を保存する。

## 1. システム系レビュー

| 観点 | 判定 | 根拠 / 改善 |
| --- | --- | --- |
| 単一責務（SRP） | OK | workflow = 起動・upload、collector = データ取得、format = 整形、redaction-check = 検証。lib 関数は 1 ファイル 1 責務 |
| 不変条件 #5（apps/web から D1 直アクセス禁止） | 影響なし | 本 workflow は CI 上で analytics API を読むのみ |
| 不変条件 #1（実フォーム schema 固定回避） | 影響なし | フォーム schema 不参照 |
| ブランチ戦略 | OK | feature → dev → main の通常 PR フロー。本仕様書は docs ブランチで作る |
| `wrangler` 直接実行禁止 | OK | analytics は `curl` + `bash scripts/cf.sh api-post` で実行。wrangler 不要 |
| secret 取り扱い | OK | `echo`/`cat`/`-v` 禁止、token を path / log に出さない（NFR-7） |
| free-tier 圧迫 | OK | schedule 1 日 1 回・timeout 5 分・GraphQL 5 query/run（NFR-3 / NFR-4） |

## 2. 戦略・価値系レビュー

| 論点 | 評価 |
| --- | --- |
| 価値（Why） | release 後の metrics 取り忘れ・属人化の解消。比較可能な証跡を 90 日保持 |
| 代替案: 有料監視 (Datadog 等) | scope-out（NFR と Issue #351 の意図に反する） |
| 代替案: Logpush + R2 集約 | 別 wave（U-4）。本タスクは GH Actions artifact に閉じる方が responsibility 単一 |
| 代替案: Workers Analytics Engine | 有料化要件 + データ転送設計が必要。本仕様 scope 外 |
| MVP 適合性 | OK。read-only / 1 日 1 回 / 90 日保持で free-tier に収まる |
| 撤退容易性 | workflow 1 ファイル + scripts/post-release-dashboard/ 配下のみで完結。削除コスト低 |

## 3. 問題解決系レビュー（Pre-mortem）

想定される失敗・対策を一覧化（詳細は phase-06）。

| リスク | 影響 | 対策 |
| --- | --- | --- |
| Cloudflare GraphQL API のスキーマ変更 | metric 取得失敗 | dataset discover を Phase 11 dry-run の事前 step に組み込み、結果を evidence に保存。失敗時は `value: null` + `judgment: UNKNOWN` で degrade |
| `CLOUDFLARE_API_TOKEN_ANALYTICS_READONLY` 未配置 | workflow 起動即 fail | step `Verify token presence` で early fail。README に新規セットアップ手順を記載 |
| schedule 起動が dependabot 等の自動 PR と並行し runner 枯渇 | run 待ち | `concurrency.cancel-in-progress: false` で連続走行を許容、`group` 名で衝突回避 |
| token の write scope 誤付与 | 権限事故 | secret 名に `_READONLY` 接尾語を強制。1Password Item field `scope` を運用ルール化（phase-05 §6） |
| artifact に token 混入 | 機密漏洩 | step `Redaction grep gate` を必須化、検出時 fail（FR-8） |
| GitHub Actions free-tier 月間枠超過 | course 停止 | 1 run < 2 min × 31 run/month ≒ 62 min/month。free-tier 2,000 min/month に対し 3% 程度 |
| `dashboard.json` schema drift | 後続自動化が破綻 | `schema_version` を JSON に固定。変更時は version bump + skill feedback で記録 |
| cron timezone 誤解 | 取り違え | `cron: '0 0 * * *'` UTC である旨を workflow file 冒頭コメントと aiworkflow-requirements 章に明記 |
| GH-issue #351 が CLOSED のまま | reopen 不可運用 | PR description は `Refs #351`。`Closes #351` を使わない（CLAUDE.md / lessons L-355-CLOSE-003 同等） |

## 4. レビュー指摘の反映ポイント

| 指摘 | 反映箇所 |
| --- | --- |
| dataset 名のドリフト対策が必要 | phase-04 / phase-11 に dataset discover step を追加 |
| `workers_errors` を 09c に存在しない metric として導入する場合は出典を明記 | phase-12 で aiworkflow-requirements に出典章を追記 |
| token 名の接尾辞ルール | phase-05 §6 に「`_READONLY` 接尾辞ルール」を明文化 |
| schema_version の bump 手順 | phase-12 skill feedback に「schema 変更時の bump ルール」を記録 |

## 5. 4 条件評価（要件レビュー思考法に従う）

| 条件 | 判定 |
| --- | --- |
| 矛盾なし | OK（FR と NFR の競合なし） |
| 漏れなし | OK（cron_status / workers_errors を追加で網羅） |
| 整合性 | OK（metric naming 一致表 / token 分離 / artifact path 固定） |
| 依存関係整合 | OK（親 09c CLOSED / cf.sh 稼働前提を明記） |

## 6. レビュー結果

GO（Phase 04 へ進む）。dataset discover の事前 step 追加、`workers_errors` の出典明記、`_READONLY` 接尾辞ルールを後続 Phase で吸収する。

## outputs

- `outputs/phase-03/design-review.md`
