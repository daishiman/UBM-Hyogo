# ut-07b-fu-03-production-migration-apply-runbook - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-07B-FU-03 |
| タスク名 | UT-07B production migration apply runbook + verification scripts |
| ディレクトリ | docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook |
| Wave | 2026-05-01 起票 / 2026-05-02 spec 作成 / 2026-05-03 実装仕様書化 |
| 実行種別 | sequential |
| 作成日 | 2026-05-02 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | implementation / operations / runbook + scripts |
| 実装区分 | **[実装仕様書]**（CONST_004 例外: 後述判定根拠参照） |
| サブタイプ | production-migration-runbook + verification-scripts |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| priority | high |
| 規模 | small-medium |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| GitHub Issue | #363（CLOSED） |
| 補足 | seed `unassigned-task-detection.md` から再構築。Phase 12 で Issue 再オープン or 新規 Issue 起票判断 |

## 実装区分判定根拠

ユーザー指定タスク種別は「runbook ドキュメント」だが、目的（production D1 への安全な migration apply + 機械検証可能性 + CI gate での staging 検証強制）の達成にはコード変更（bash scripts + CI workflow + bats テスト）が必要と判断し、**実装仕様書** に格上げする。production への実 apply は本タスクで実行しない（AC-9 維持）。

## 目的

UT-07B（schema alias hardening）の `apps/api/migrations/0008_schema_alias_hardening.sql` を本番 D1 (`ubm-hyogo-db-prod`) に適用するための **承認ゲート付き runbook + 検証スクリプト群 + CI gate** を実装する。

production apply は commit / PR / CI gate / merge / ユーザー明示承認 / runbook 実走 の 6 段階を経た後に別タスクで運用実行する。本タスクは scripts と CI gate と runbook 文書を整備するが、production への実 apply は行わない。

## スコープ

### 含む

- `apps/api/migrations/0008_schema_alias_hardening.sql` の production apply runbook 作成（F8）
- 検証スクリプト F1 `scripts/d1/preflight.sh`、F2 `scripts/d1/postcheck.sh`、F3 `scripts/d1/evidence.sh`、F4 `scripts/d1/apply-prod.sh` の新規実装
- `scripts/cf.sh` への `d1:apply-prod` サブコマンド追加（F5）
- `.github/workflows/d1-migration-verify.yml` CI gate 新規追加（F6）
- bats-core によるスクリプト単体テスト（F7）
- `package.json` に `test:scripts` script 追加（F9）
- evidence 保存スキーマ（`.evidence/d1/<ts>/`）と redaction grep 仕様
- 6 段階承認ゲート（G1〜G6）と scripts/CI の対応定義
- failure handling 4 ケース（二重適用 / UNIQUE 衝突 / DB 取り違え / ALTER TABLE 失敗）の exit code 規約
- `bash scripts/cf.sh` 経由のみを許可する運用境界の維持

### 含まない

- 本タスク内での production への実 migration apply 実行（AC-9）
- `apps/api/migrations/0008_schema_alias_hardening.sql` の SQL 内容変更
- queue / cron split for large back-fill の実装
- admin UI retry label の実装
- Token / Account ID 値の記録
- 直 `wrangler` 呼び出し
- production secret を CI gate で参照すること（staging のみ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-07B-schema-alias-hardening-001 | 適用対象 SQL の実装元 |
| 上流 | U-FIX-CF-ACCT-01 | production Token のスコープ最小化が完了 |
| 並列 | なし | 単独タスク |
| 下流 | production migration apply 実行（別タスク） | runbook + scripts 確定後 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| seed | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md | 起票元 |
| 根拠 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/implementation-guide.md | 実装済み migration |
| 対象 SQL | apps/api/migrations/0008_schema_alias_hardening.sql | 適用対象 |
| 上流 runbook | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md | runbook 構造の継承元 |
| 上流 rollback | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md | failure handling 参照 |
| 必須 | scripts/cf.sh | wrangler ラッパ（拡張対象） |
| 必須 | apps/api/wrangler.toml | env binding |
| 参考 | https://developers.cloudflare.com/d1/reference/migrations/ | D1 migrations |
| 参考 | https://github.com/bats-core/bats-core | bats テストランナー |

## 実装する成果物（F1〜F9）

| # | パス | 種別 | 状態 |
| --- | --- | --- | --- |
| F1 | scripts/d1/preflight.sh | 新規 | spec_created |
| F2 | scripts/d1/postcheck.sh | 新規 | spec_created |
| F3 | scripts/d1/evidence.sh | 新規 | spec_created |
| F4 | scripts/d1/apply-prod.sh | 新規 | spec_created |
| F5 | scripts/cf.sh | 編集 | spec_created |
| F6 | .github/workflows/d1-migration-verify.yml | 新規 | spec_created |
| F7 | scripts/d1/__tests__/*.bats | 新規 | spec_created |
| F8 | outputs/phase-05/main.md | 編集 | spec_created |
| F9 | package.json | 編集 | spec_created |

## 受入条件 (AC)

- AC-1: `outputs/phase-05/main.md` runbook 本体（F8）が F1〜F5 を呼ぶ手順で作成されている
- AC-2: commit / PR / CI gate / merge / ユーザー承認 / 実走 の 6 段階ゲートが runbook と F4 の挙動で実装されている
- AC-3: 対象オブジェクト 5 件（`schema_aliases`、UNIQUE index 2 件、`schema_diff_queue` 追加カラム 2 件）が F2 postcheck.sh で機械検証されている
- AC-4: F1 preflight.sh が staging/production DB allow-list、Cloudflare auth、`d1 list`、`migrations list` による未適用確認を実装している
- AC-5: F4 apply-prod.sh が `bash scripts/cf.sh d1 migrations apply <db> --env <env>` を呼ぶ
- AC-6: F2 postcheck.sh が `sqlite_master` SELECT + `PRAGMA table_info(schema_diff_queue)` を実装し read-only である
- AC-7: F3 evidence.sh が evidence 10 項目（db, env, commit_sha, migration_filename, migration_sha, timestamp_utc, timestamp_jst, approver, dry_run, exit_code）を `.evidence/d1/<ts>/meta.json` + 3 ログとして保存
- AC-8: F4 apply-prod.sh が failure handling 4 ケース（exit 10/30/40/80）に対応
- AC-9: 本タスクで production への実 apply を行わない。`--env production` 実走は別タスク
- AC-10: F2 postcheck.sh は read-only クエリのみで destructive smoke を含まない
- AC-11: skill 検証 4 条件（矛盾なし / 漏れなし / 整合性 / 依存関係整合）PASS
- AC-12: F3 redaction grep（`CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|sk-*|Bearer *|eyJ*`）で機密値検知時 exit 80 + ディレクトリ削除
- AC-13: F1〜F4 の引数仕様・stdin/stdout・exit code 規約が Phase 2 の表で確定
- AC-14: F5 `bash scripts/cf.sh d1:apply-prod <db> --env <env>` サブコマンドが F4 の薄ラッパとして追加
- AC-15: F6 CI gate `d1-migration-verify` が `apps/api/migrations/**` / `scripts/d1/**` / `scripts/cf.sh` PR で staging DRY_RUN を実行し green
- AC-16: F7 bats テスト全 PASS（`pnpm test:scripts`）
- AC-17: F9 `test:scripts` script が `package.json` に追加され `bats scripts/d1/__tests__/` を実行
- AC-18: すべての script で `set -eu` 有効、`set -x` 無効
- AC-19: `apps/api/migrations/0008_schema_alias_hardening.sql` を本タスクで変更しない
- AC-20: scripts 内で直 `wrangler` を呼ばず `bash scripts/cf.sh` 経由のみ

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義（実装仕様書化） | phase-01.md | spec_created | outputs/phase-01/main.md |
| 2 | 設計（runbook + コードアーキテクチャ） | phase-02.md | spec_created | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | spec_created | outputs/phase-03/main.md |
| 4 | テスト戦略 / bats / CI gate 設計 | phase-04.md | spec_created | outputs/phase-04/main.md |
| 5 | runbook 本体 + scripts 実装 | phase-05.md | spec_created | outputs/phase-05/main.md |
| 6 | 異常系・失敗ハンドリング | phase-06.md | spec_created | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | spec_created | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | spec_created | outputs/phase-08/main.md |
| 9 | 品質保証 / 4 条件評価 | phase-09.md | spec_created | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | spec_created | outputs/phase-10/main.md |
| 11 | 手動 smoke evidence（staging DRY_RUN） | phase-11.md | spec_created | outputs/phase-11/main.md |
| 12 | ドキュメント更新 / 正本同期 | phase-12.md | spec_created | outputs/phase-12/main.md |
| 13 | PR 作成 | phase-13.md | blocked_until_user_approval | outputs/phase-13/main.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件・F1〜F9 定義・実装区分根拠 |
| 設計 | outputs/phase-02/main.md | データフロー・引数仕様・exit code・CI gate 構成 |
| レビュー | outputs/phase-03/main.md | 代替案 4 件比較・PASS 判定 |
| テスト | outputs/phase-04/main.md | bats ケース設計・CI gate ジョブ詳細 |
| 実装 | scripts/d1/preflight.sh | F1（新規） |
| 実装 | scripts/d1/postcheck.sh | F2（新規） |
| 実装 | scripts/d1/evidence.sh | F3（新規） |
| 実装 | scripts/d1/apply-prod.sh | F4（新規） |
| 実装 | scripts/cf.sh | F5（編集） |
| 実装 | .github/workflows/d1-migration-verify.yml | F6（新規） |
| テスト | scripts/d1/__tests__/*.bats | F7（新規） |
| 実装 | package.json | F9（編集、`test:scripts`） |
| runbook | outputs/phase-05/main.md | F8 runbook 本体 |
| 異常系 | outputs/phase-06/main.md | failure handling 4 ケース exit code |
| AC | outputs/phase-07/main.md | AC × 検証 × 成果物トレース |
| DRY | outputs/phase-08/main.md | 上流 runbook との差分 |
| 品質 | outputs/phase-09/main.md | 4 条件評価 |
| 最終 | outputs/phase-10/main.md | 最終レビュー |
| 証跡 | outputs/phase-11/main.md | staging DRY_RUN evidence（実値含まない） |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1 中学生向け / Part 2 運用者向け |
| メタ | artifacts.json | 機械可読サマリー |

## 関連サービス・ツール

| サービス/ツール | 用途 | コスト |
| --- | --- | --- |
| Cloudflare D1 | production database | 無料枠 |
| `scripts/cf.sh` | wrangler ラッパ | リポジトリ内 |
| `bats-core` | shell script テスト | OSS |
| GitHub Actions | CI gate | 無料枠 |

## Secrets / Variables 一覧

本タスクは新規 Secret / Variable を導入しない。既存 Secret を **値の記録なし** で参照のみ。

| 名前 | 種別 | 用途 | 本タスクでの扱い |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Secret（production env） | wrangler 認証 | runbook 実走時に op 経由で参照（記録しない） |
| `CLOUDFLARE_API_TOKEN_STAGING` | Secret（staging env） | CI gate の staging DRY_RUN 認証 | F6 で参照（値記録なし） |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | account 識別 | 参照のみ |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | F1〜F5 は運用コマンド境界、ランタイム経路を作らない。post-check は read-only。`apps/web` からの D1 直接アクセスは新設しない |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致
- AC-1〜AC-20 が Phase 7 / 10 / 12 で全件トレース
- skill 検証 4 条件 PASS
- F1〜F4 の bats テストが `pnpm test:scripts` で全 PASS
- F6 CI gate `d1-migration-verify` が PR で green
- staging で `DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging` が preflight + apply skip + skipped postcheck evidence で exit 0
- F3 redaction で機密値混入 0 件
- production 実 apply を本タスクで実行しないことが index / Phase 5 / Phase 11 で一貫明記
- Phase 13 はユーザー明示承認後にのみ実行

## 状態語彙

| 状態 | 意味 |
| --- | --- |
| `spec_created` | production 実 apply 未実行の workflow root 状態 |
| `implemented-local` | F1〜F9 のコード実装完了、ローカル検証対象 |
| `verified` | CI gate green + staging DRY_RUN PASS |
| `blocked_until_user_approval` | Phase 13 PR 作成のみ適用 |

## 苦戦想定

1. **bats と mock wrangler shim**: PATH 操作で `wrangler` を上書きしても `cf.sh` 内部の `op run` 呼び出しと噛み合わせが必要。mock 戦略を Phase 4 で詳細化
2. **CI gate の secret 取り違え**: production secret を staging job で参照しないよう、`secrets.CLOUDFLARE_API_TOKEN_STAGING` 限定とし `if` で env も明示
3. **二重適用 / 既適用 migration 衝突**: F1 preflight が exit 10 で apply 中止
4. **対象 DB 取り違え**: F4 で `--env` バリデーション + DB 名正規表現 + `d1 list` 突合
5. **redaction false-positive**: `op://` 参照記法は redaction 対象外として regex を組む
6. **set -x の事故有効化**: bats テストで `set -x` 出力混入時 fail させる guard を追加

## 関連リンク

- 上位 README: `../README.md`
- seed: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/unassigned-task-detection.md`
- 上流: `../completed-tasks/ut-07b-schema-alias-hardening/`
- 対象 SQL: `../../../apps/api/migrations/0008_schema_alias_hardening.sql`
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/363（CLOSED）
