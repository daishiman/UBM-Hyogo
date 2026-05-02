# Phase 4: テスト戦略 / 検証戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 4 |
| 状態 | spec_created |
| taskType | requirements / operations / runbook |
| subtype | production-migration-runbook |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. Phase 1〜3 で確定した「runbook 構造（preflight / apply / post-check / evidence / failure handling）」「承認ゲート」「Token 値非記録ガード」に対し、文書品質と手順実行性の双方を検証する戦略を組み立てる。
2. runbook 文書自体の検証（章立て・必須キーワード grep・整合性チェック）と、runbook 手順の検証（staging 環境での dry-run / 模擬 apply）の 2 軸で網羅する。
3. evidence redaction の検証（Token 値・Account ID が記録されないことを grep で確認）を gate として組み込む。
4. 本タスクは production migration を実行しないため、runtime 検証は staging 環境のみで完結し、production 検証は AC マトリクスでの「文書整合性確認」のみに限定する。

## 目的

production migration apply runbook が「実運用で迷わず使える粒度」「機密情報を成果物に残さない」「失敗時の停止判断が一意に決まる」の 3 観点を満たすことを、文書静的検証 / staging 模擬実行 / redaction grep の三段で保証する。runbook 適用そのものは本タスクの検証範囲外であり、Phase 13 ユーザー承認後の別運用として扱う。

## 参照資料

- `index.md`（AC-1〜AC-12）
- `artifacts.json`
- `phase-02.md`（runbook 構造設計）
- `phase-03.md`（PASS 判定）
- `apps/api/migrations/0008_schema_alias_hardening.sql`
- `apps/api/wrangler.toml`（`[env.production]` / `[env.staging]` binding）
- `scripts/cf.sh`
- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md`
- `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md`

## 入力

- Phase 2 成果物（runbook 章立て・承認ゲート・evidence 保存項目）
- Phase 3 成果物（PASS 判定）
- 既存 staging D1（`ubm-hyogo-db-staging`）— 模擬 apply 検証の対象
- 既存 GitHub Environment Secret `CLOUDFLARE_API_TOKEN`（staging）

## テストカテゴリ

### 1. 文書静的検証（runbook 文書品質ゲート）

| TC ID | 種別 | コマンド | 期待結果 |
| --- | --- | --- | --- |
| TC-D01 | 必須セクション存在 | `grep -E '^## (Overview\|承認ゲート\|Preflight\|Apply\|Post-check\|Evidence\|Failure handling\|Smoke 制限)' outputs/phase-05/main.md` | 8 セクション全てヒット |
| TC-D02 | 対象 SQL 明記 | `grep -n 'apps/api/migrations/0008_schema_alias_hardening\.sql' outputs/phase-05/main.md` | 1 件以上ヒット |
| TC-D03 | 対象 DB 明記 | `grep -nE 'ubm-hyogo-db-prod' outputs/phase-05/main.md` | 1 件以上ヒット（staging DB と取り違える記述がない） |
| TC-D04 | `--env production` 明記 | `grep -nE -- '--env production' outputs/phase-05/main.md` | apply / migrations list / post-check の各コマンドにヒット |
| TC-D05 | 対象オブジェクト網羅 | `grep -nE '(schema_aliases\|idx_schema_aliases_revision_stablekey_unique\|idx_schema_aliases_revision_question_unique\|backfill_cursor\|backfill_status)' outputs/phase-05/main.md` | 5 オブジェクト全てヒット |
| TC-D06 | wrangler 直接呼び禁止 | `grep -nE '^[^#]*\bwrangler\b' outputs/phase-05/main.md \| grep -v 'scripts/cf.sh'` | 0 件（コードブロック内の wrangler 直叩き禁止） |
| TC-D07 | 承認ゲート文言 | `grep -nE '(commit \\\| PR \\\| merge\|ユーザー承認\|本タスクでは実行しない)' outputs/phase-05/main.md` | 3 観点とも 1 件以上ヒット |
| TC-D08 | smoke 分離記述 | `grep -nE '(destructive な apply smoke\|別承認)' outputs/phase-05/main.md` | ヒット |

### 2. 整合性検証（仕様書 / 関連 runbook 間のクロスチェック）

| TC ID | 種別 | コマンド | 期待結果 |
| --- | --- | --- | --- |
| TC-X01 | index ↔ Phase 5 章立て整合 | `index.md` の AC-1〜AC-10 の章名が Phase 5 セクション名にマッチすること（目視＋grep） | 全 AC が Phase 5 のいずれかセクションに対応 |
| TC-X02 | UT-07B Phase 5 と差分整合 | `diff` ではなく内容包含: UT-07B の `migration-runbook.md` の手順が production 文脈で再現されている | preflight / index 確認 / collision 検出の意図が継承されている |
| TC-X03 | rollback 方針整合 | UT-07B `rollback-runbook.md` の 4 シナリオ（index blocks / collision / back-fill fail / CPU 枯渇）が Phase 6 にマッピング | 4/4 マッピング |
| TC-X04 | 不変条件 #5 整合 | `grep -nE '(apps/api/migrations\|D1 への直接アクセス)' outputs/phase-05/main.md` | apply 対象 SQL が `apps/api/migrations/` 配下であることが明記 |

### 3. Runtime 検証（staging 環境での dry-run / 模擬 apply）

> production への apply は本タスクで実行しない。staging 模擬は runbook 手順の再現性確認に限定する。

| TC ID | 種別 | コマンド | 期待結果 |
| --- | --- | --- | --- |
| TC-R01 | 認証疎通 | `bash scripts/cf.sh whoami` | exit=0、Token 値は出力されない |
| TC-R02 | staging migrations list | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` | exit=0、未適用 migration が機械的に判定可能 |
| TC-R03 | staging 模擬 apply（必要な場合のみ） | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` | exit=0、`0008_schema_alias_hardening.sql` 由来の table / index / column が staging に作成される |
| TC-R04 | post-check SQL（schema_aliases 存在） | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_aliases';"` | `schema_aliases` 1 行 |
| TC-R05 | post-check SQL（UNIQUE index 存在） | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT name FROM sqlite_master WHERE type='index' AND name IN ('idx_schema_aliases_revision_stablekey_unique','idx_schema_aliases_revision_question_unique');"` | 2 行 |
| TC-R06 | post-check SQL（backfill カラム存在） | `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "PRAGMA table_info(schema_diff_queue);"` | `backfill_cursor` / `backfill_status` の 2 行を含む |

### 4. Negative 検証（runbook 停止条件の再現）

| TC ID | 種別 | 想定操作 | 期待結果 |
| --- | --- | --- | --- |
| TC-N01 | 二重適用検知 | TC-R03 後に再度 `cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` | 「既適用 migration」として skip もしくは exit≠0 で停止することが runbook に記載通り再現 |
| TC-N02 | 対象 DB 取り違え検知 | preflight で `--env staging` を `--env production` に置換した時の `migrations list` 出力差 | runbook 記載通り、対象 DB 名（`ubm-hyogo-db-prod`）と `--env production` の組のみが許容される |
| TC-N03 | UNIQUE 衝突再現 | staging に重複 `(revision_id, stable_key)` を投入後 apply | UNIQUE index 作成 fail。runbook の「停止して判断待ち」が一意に決まること |
| TC-N04 | ALTER TABLE 二重列検知 | 既に `backfill_cursor` を持つ staging DB に再 apply | duplicate column エラーで停止。runbook の preflight で検知できる |

### 5. Evidence Redaction 検証（gate）

| TC ID | 種別 | コマンド | 期待結果 |
| --- | --- | --- | --- |
| TC-E01 | Token 値混入なし | `grep -rEn '[A-Za-z0-9_-]{40,}' docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/` | 該当ヒットなし（Token らしき長 token が evidence に無い） |
| TC-E02 | Account ID 混入なし | `grep -rEn '[a-f0-9]{32}' docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/` | 該当ヒットなし（Account ID らしき 32 桁 hex が無い） |
| TC-E03 | `set -x` 由来出力なし | `grep -rnE '\+ (bash\|wrangler\|cf\.sh) ' docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/` | 該当ヒットなし |
| TC-E04 | wrangler 直叩きログなし | `grep -rnE '^[^#]*\bwrangler\b' docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/ \| grep -v 'scripts/cf.sh'` | 0 件 |

## 検証スクリプト案（コマンドラインベース）

runbook 文書品質ゲートを CI で再現可能にするため、以下のチェックスクリプトを Phase 11 evidence で実行する想定（実装は本タスクのスコープ外、実行コマンドのみ列挙）。

```bash
# 文書静的検証（TC-D01〜D08）
bash -c '
  set -e
  f=docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/phase-05/main.md
  grep -qE "^## (Overview|適用対象)" "$f"
  grep -qE "^## 承認ゲート" "$f"
  grep -qE "^## Preflight" "$f"
  grep -qE "^## Apply" "$f"
  grep -qE "^## Post-check" "$f"
  grep -qE "^## Evidence" "$f"
  grep -qE "^## Failure handling" "$f"
  grep -q "apps/api/migrations/0008_schema_alias_hardening.sql" "$f"
  grep -q "ubm-hyogo-db-prod" "$f"
  grep -q -- "--env production" "$f"
  grep -q "schema_aliases" "$f"
  grep -q "idx_schema_aliases_revision_stablekey_unique" "$f"
  grep -q "idx_schema_aliases_revision_question_unique" "$f"
  grep -q "backfill_cursor" "$f"
  grep -q "backfill_status" "$f"
'

# Evidence redaction（TC-E01〜E04）
bash -c '
  set -e
  d=docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook/outputs/
  ! grep -rEn "[A-Za-z0-9_-]{40,}" "$d"
  ! grep -rEn "[a-f0-9]{32}" "$d"
  ! grep -rnE "\+ (bash|wrangler|cf\.sh) " "$d"
'
```

## TDD 適用判定

本タスクはコード実装を伴わず、**runbook 文書を生成する仕様書タスク** である。RED/GREEN サイクルではなく、文書静的検証（TC-D / TC-X）→ staging 模擬実行（TC-R）→ Negative 再現（TC-N）→ redaction gate（TC-E）の差分テストで代替する。

## カバレッジ目標

| 観点 | カバレッジ |
| --- | --- |
| AC | 12/12 = 100%（Phase 7 マトリクスで AC-1〜AC-12 全件を TC / FC / Step に紐付け） |
| runbook 必須セクション | 8/8 = 100%（TC-D01 で機械的に確認） |
| 対象 SQL オブジェクト | 5/5 = 100%（schema_aliases / 2 UNIQUE index / 2 カラムを TC-D05 / TC-R04〜R06 で確認） |
| Failure handling シナリオ | 6/6 = 100%（二重適用 / UNIQUE 衝突 / DB 取り違え / ALTER TABLE 失敗 / ネット中断 / Token 混入を Phase 6 で網羅） |
| 環境分離 | 1/1 = 100%（staging のみで模擬。production 適用は別運用に分離） |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | runbook 検証は staging 環境のみ、production は文書整合性確認のみと明記。Phase 5 / 6 / 7 の TC / FC / AC が同じ ID 系で参照される |
| 漏れなし | PASS | AC-1〜AC-12 が TC-D / TC-X / TC-R / TC-N / TC-E のいずれかにマップ。runbook 必須 8 セクションを TC-D01 で機械的に確認 |
| 整合性あり | PASS | UT-07B Phase 5 の `migration-runbook.md` / `rollback-runbook.md` を継承し（TC-X02 / TC-X03）、本タスクは production 文脈に限定 |
| 依存関係整合 | PASS | 上流 UT-07B（対象 SQL）／U-FIX-CF-ACCT-01（Token scope）が完了済みで、staging 模擬実行に必要な前提が満たされる |

## Token 値非記録ガード

- 全 TC で `set -x` を**使用しない**。
- `cf.sh` 実行出力を `tee` / file リダイレクトする際は redaction gate（TC-E01〜E04）を後段に配置。
- 成果物 `outputs/phase-04/main.md` には「TC ID」「コマンド」「exit code」「件数」のみを記録し、出力 raw 全文の貼付は禁止。
- TC-E01〜E04 を Phase 11 完了直前に必須実行する gate にする。

## 統合テスト連携

- 本タスクは migration runbook の文書化であり、アプリケーション統合テストは追加しない。
- runtime 検証は `scripts/cf.sh` 経由の staging dry-run / 模擬 apply のみで完結する。

## 完了条件

- [ ] 全 TC（Static / Cross / Runtime / Negative / Redaction）が ID 付きで列挙されている
- [ ] runbook 必須 8 セクションが TC-D01 で機械的に検証される設計になっている
- [ ] 対象 SQL の 5 オブジェクトが TC-D05 / TC-R04〜R06 でカバーされている
- [ ] Token 値・Account ID 非記録ガード（TC-E01〜E04）が含まれている
- [ ] staging（runtime）→ production（文書整合性のみ）の段階分けが明示されている
- [ ] 4 条件評価（矛盾なし / 漏れなし / 整合性 / 依存関係）が PASS

## 成果物

- `outputs/phase-04/main.md`
