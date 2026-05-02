# ut-07b-fu-03-production-migration-apply-runbook - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-07B-FU-03 |
| タスク名 | UT-07B production migration apply runbook |
| ディレクトリ | docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook |
| Wave | 2026-05-01 起票 / 2026-05-02 spec 作成 |
| 実行種別 | sequential（UT-07B の post-merge operational execution として直列） |
| 作成日 | 2026-05-02 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | requirements / operations / runbook |
| サブタイプ | production-migration-runbook（D1 production への migration apply 運用手順） |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| priority | high |
| 規模 | small |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| GitHub Issue | #363（CLOSED） |
| 補足 | GitHub Issue #363 は CLOSED 状態だが、本タスク仕様書は seed である `unassigned-task-detection.md` から再構築するため `spec_created` として作成する。Phase 12 の evidence で Issue 再オープン or 新規 Issue 起票の要否を判断する |

## 目的

UT-07B（schema alias hardening）の実装 commit `apps/api/migrations/0008_schema_alias_hardening.sql` を本番 D1 (`ubm-hyogo-db-prod`) に適用するための **承認ゲート付き runbook** を作成する。

migration 適用前後の確認コマンド、期待結果、証跡保存先、失敗時の停止条件を明文化し、本番適用作業が「ユーザー承認後の運用」であり、実装タスク内の自動実行・push・PR 作成とは分離されることを固定する。

> 本タスクは runbook **正式化** タスクであり、本番 D1 への変更作業そのものではない。実際の production apply は対象 commit / PR が確定し、ユーザー承認を得た後に runbook に従って別途実施する。

## スコープ

### 含む

- `apps/api/migrations/0008_schema_alias_hardening.sql` の production apply runbook 作成
- commit / PR / merge 後、かつユーザー承認後にのみ本番適用する運用境界の明記
- production D1 migration 適用前の preflight checklist（migration list 確認、未適用 migration 抽出、対象 DB 確認）
- migration apply コマンド、適用後確認コマンド、証跡保存項目の定義
- 失敗時に中断して追加判断へ戻す条件（rollback または判断待ち）の明記
- `bash scripts/cf.sh` 経由の Cloudflare / Wrangler 操作のみを許可する運用境界

### 含まない

- 本タスク内での production migration 実行（runbook 作成のみ）
- commit / push / PR 作成 / PR merge（Phase 13 のユーザー承認を待つ）
- `0008_schema_alias_hardening.sql` の内容変更（既に UT-07B で完了済み）
- queue / cron split for large back-fill の実装（別タスクで扱う）
- admin UI retry label の実装（別タスクで扱う）
- Token / Account ID / OAuth 認証情報の値そのものの記録

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-07B-schema-alias-hardening-001 | 適用対象 SQL の実装元 |
| 上流 | U-FIX-CF-ACCT-01 | production Token のスコープ最小化が完了していること（CI/CD と手動 cf.sh の双方で同 Token を利用） |
| 並列 | なし | production runbook 単独タスクとして直列実行 |
| 下流 | 本番 D1 へ実 migration を適用する operational 実行（別タスク or 別 PR） | runbook が確定してから運用実行する |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| seed | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md | 起票元（production migration apply runbook が post-merge operational execution として検出された根拠） |
| 根拠 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md | 実装済み migration と検証済み内容 |
| 対象 SQL | apps/api/migrations/0008_schema_alias_hardening.sql | production 適用対象 |
| 関連 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md | UT-07B 内の migration runbook 文脈 |
| 関連 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md | 失敗時判断と rollback 方針の参照 |
| 必須 | scripts/cf.sh | wrangler 実行ラッパ（op + esbuild + mise） |
| 必須 | apps/api/wrangler.toml | production environment 定義（DB binding） |
| 参考 | https://developers.cloudflare.com/d1/reference/migrations/ | D1 migration 仕様 |
| 参考 | https://developers.cloudflare.com/workers/wrangler/commands/#d1 | wrangler d1 migrations コマンド |
| 参考 | GitHub Issue | https://github.com/daishiman/UBM-Hyogo/issues/363 |

## 受入条件 (AC)

- AC-1: production migration apply runbook が `outputs/phase-05/main.md`（または同等の運用手順書）として作成されている
- AC-2: commit / PR / merge 後、かつユーザー承認後にのみ実行する境界が runbook 内で明記されている
- AC-3: `apps/api/migrations/0008_schema_alias_hardening.sql` の対象オブジェクト（`schema_aliases` table、`idx_schema_aliases_revision_stablekey_unique`、`idx_schema_aliases_revision_question_unique`、`schema_diff_queue.backfill_cursor`、`schema_diff_queue.backfill_status`）が runbook 内で特定されている
- AC-4: preflight（migration list 確認・既適用判定）の手順とコマンドが具体化されている
- AC-5: apply 手順（`bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production`）と期待 exit code / 出力が記載されている
- AC-6: post-check（`schema_aliases` table と UNIQUE index の存在確認、`schema_diff_queue` の追加カラム確認）のコマンドと期待結果が記載されている
- AC-7: evidence（実行コマンド・出力・時刻・承認者・対象 DB・migration hash または commit SHA）の保存項目と保存先が定義されている
- AC-8: failure handling（二重適用検知、UNIQUE 衝突、対象 DB 取り違え、ALTER TABLE 失敗）と停止判断条件が runbook 内で明記されている
- AC-9: production apply を本タスク内では実行しないことが index と Phase 5 の双方で明記されている
- AC-10: post-check の smoke は read / dryRun 系に限定し、destructive な apply smoke は別承認に分離することが記載されている
- AC-11: skill 検証 4 条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）が PASS
- AC-12: Phase 11 evidence に Token 値・Cloudflare API Key・Account ID 等の機密情報が含まれていない

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | outputs/phase-01/main.md |
| 2 | 設計（runbook 構造・承認ゲート設計） | phase-02.md | spec_created | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | spec_created | outputs/phase-03/main.md |
| 4 | テスト戦略 / 検証戦略 | phase-04.md | spec_created | outputs/phase-04/main.md |
| 5 | runbook 本体作成 | phase-05.md | spec_created | outputs/phase-05/main.md |
| 6 | 異常系・失敗ハンドリング | phase-06.md | spec_created | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | spec_created | outputs/phase-07/main.md |
| 8 | DRY 化 / 重複検出 | phase-08.md | spec_created | outputs/phase-08/main.md |
| 9 | 品質保証 / 4 条件評価 | phase-09.md | spec_created | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | spec_created | outputs/phase-10/main.md |
| 11 | 手動 smoke evidence（runbook dry-run） | phase-11.md | spec_created | outputs/phase-11/main.md |
| 12 | ドキュメント更新 / 正本仕様同期 | phase-12.md | spec_created | outputs/phase-12/main.md |
| 13 | PR 作成 | phase-13.md | blocked_until_user_approval | outputs/phase-13/main.md |

> Phase 1〜12 の `spec_created` は仕様成果物 container の作成完了を意味する。runbook の実 production apply、GitHub Issue 再オープン判断、PR 作成は未実行であり、root workflow は `spec_created` のまま据え置く。Phase 13 はユーザー明示承認後にのみ実行する。

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（4 条件評価・真の論点・runbook 適用境界） |
| 設計 | outputs/phase-02/main.md | runbook 構造・承認ゲート・preflight / apply / post-check / evidence / failure handling の章立て |
| レビュー | outputs/phase-03/main.md | 代替案（自動化 / 手動全工程 / runbook 化）と PASS/MINOR/MAJOR 判定 |
| テスト | outputs/phase-04/main.md | runbook 検証戦略（grep / dry-run / staging 模擬適用） |
| 実装 | outputs/phase-05/main.md | production migration apply runbook 本体 |
| 異常系 | outputs/phase-06/main.md | 二重適用 / UNIQUE 衝突 / DB 取り違え / ALTER TABLE 失敗時の対応 |
| AC | outputs/phase-07/main.md | AC × 検証 × 成果物トレース |
| DRY | outputs/phase-08/main.md | UT-07B Phase 5 migration-runbook / rollback-runbook との差分・参照 |
| 品質 | outputs/phase-09/main.md | 4 条件評価 / skill 検証 |
| 最終 | outputs/phase-10/main.md | 最終レビュー / blocking 判定 |
| 証跡 | outputs/phase-11/main.md | NON_VISUAL evidence（runbook dry-run・staging 模擬実行ログのみ。production 値は含まない） |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生向け）+ Part 2（運用者向け） |
| メタ | artifacts.json | 機械可読サマリー |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare D1 | production database | 無料枠 (5GB / 25M reads/day) |
| `scripts/cf.sh` | wrangler 実行ラッパ（op + esbuild + mise） | リポジトリ内 |
| `wrangler d1 migrations` | migration list / apply | OSS |
| `gh` CLI | Issue / PR 管理 | OSS |

## Secrets / Variables 一覧

本タスクは新規 Secret / Variable を導入しない。既存 Secret を **値の記録なし** で参照のみ行う。

| 名前 | 種別 | 用途 | 本タスクでの扱い |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Secret（environment: production） | wrangler 認証 | runbook 実行時に scripts/cf.sh が op 経由で参照（値は記録しない） |
| `CLOUDFLARE_ACCOUNT_ID` | Variable（repository） | account 識別 | 参照のみ |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | runbook 内で実行する `scripts/cf.sh d1 migrations apply` は `apps/api/migrations/` 配下の SQL を対象とする運用コマンドであり、`apps/web` からの D1 直接アクセスは一切作らない |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する
- AC-1〜AC-12 が Phase 7 / 10 / 12 で完全トレースされる
- skill 検証 4 条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）が PASS
- runbook 内に preflight / apply / post-check / evidence / failure handling の 5 セクションが揃っている
- production apply を本タスクでは実行しないことが Phase 5 / Phase 11 / index で一貫して明記されている
- Phase 11 evidence に Token / Account ID 等の機密情報が含まれていない
- Phase 13 はユーザー明示承認後にのみ実行する

## 状態語彙

| 状態 | 意味 | 本仕様での扱い |
| --- | --- | --- |
| `spec_created` | 手順・期待結果を定義済みで、実行証跡は未作成 | Phase 1〜12 の本文は原則この状態 |
| `executed` | runbook を実 production に適用し、`outputs/` に実測ログがある | 本仕様書では到達しない（別タスクで運用実行） |
| `verified` | Phase 11 evidence と Phase 12 compliance check が PASS | runbook の文書品質として PASS |
| `blocked_until_user_approval` | ユーザー明示承認待ち | Phase 13（PR 作成）に適用 |

## 苦戦想定

**1. 二重適用 / 既適用 migration との衝突**

UT-07B branch には `0008_create_schema_aliases.sql` と `0008_schema_alias_hardening.sql` の 2 ファイルが存在する。production D1 が既にどちらか / 両方を適用済みである場合、`migrations apply` が失敗する。runbook の preflight で `migrations list` を必ず実行し、未適用 / 既適用を明示判定する必要がある。

**2. 対象 DB の取り違え**

production / staging / preview の DB binding を `wrangler.toml` の `[env.production]` / `[env.staging]` で切り替えている。`--env production` の指定漏れや `<production-db-name>` の誤入力で staging に apply してしまう事故を防ぐため、runbook の冒頭で対象 DB 名（`ubm-hyogo-db-prod`）を明文化し、preflight で `--env production` の `migrations list` を必ず実行する。

**3. UNIQUE index 作成失敗**

`idx_schema_aliases_revision_stablekey_unique` / `idx_schema_aliases_revision_question_unique` は既存 `schema_aliases` データに重複があると作成失敗する。runbook では「失敗時に追加 SQL を即興実行せず判断待ちにする」を明記し、Phase 6 異常系で対応手順を定義する。

**4. ALTER TABLE 二重適用**

`schema_diff_queue.backfill_cursor` / `schema_diff_queue.backfill_status` は ALTER TABLE 経由で追加される。既適用 DB に再 apply すると "duplicate column" で失敗する。preflight で schema introspection 確認を入れる。

**5. evidence への機密情報混入**

`scripts/cf.sh` 実行時のエラースタックトレースに API Token が混入する可能性は低いが、`set -x` 系のデバッグ出力には混入リスクがある。Phase 6 で `set -x` を使わない運用と evidence への grep verification を必須化する。

**6. CLOSED Issue #363 との関係**

Issue は CLOSED だが seed spec は未消化のため、本仕様書は `spec_created` として開始する。Phase 12 で Issue 再オープンか新規 Issue 起票かの判断根拠を残す。

## 関連リンク

- 上位 README: `../README.md`
- seed: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md`
- 上流: `../completed-tasks/ut-07b-schema-alias-hardening/`
- 対象 SQL: `../../../apps/api/migrations/0008_schema_alias_hardening.sql`
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/363（CLOSED）
