# Phase 5: 永続化 migration 実装（必要時のみ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 作成日 | 2026-05-08 |
| 状態 | spec-confirmed |
| 対象 | `apps/api/migrations/00XX_audit_correlation_fingerprint_version.sql`（番号は Phase 2 確定後） |
| 実装区分 | 実装仕様書（条件付き） |

## 目的

`fingerprintVersion=2` 移行に伴う永続化スキーマ変更を、Phase 2 の判定結果に応じて最小差分で導入する。Issue #516 系の `cf_audit_log` / `audit_correlation_*` テーブルが `fingerprintVersion` 値を永続化していない場合、本 Phase はスキップとする。永続化していない場合でも redact.ts / correlate.ts は in-memory で v1/v2 を扱えるため、機能要件には影響しない。

## Phase 2 判定との連動（最初に必ず実施）

`outputs/phase-2/phase-2.md` の「永続化 schema 影響判定」を読み、以下のいずれかに分岐する。

| 判定 | 本 Phase の挙動 |
| --- | --- |
| migration 不要（in-memory のみで完結 / 既存 JSON 列に格納可能） | 本 Phase は SKIP。冒頭に「skip 理由」を明記し、後続成果物は作らない。Phase 13 PR では migration 追加が無いことを記録 |
| migration 必要（新規列追加が必要） | 以降の節に従い 1 ファイル追加。番号は `apps/api/migrations/` 直下を `ls` した結果の最大値 + 1（既存最新は `0016_*`、本 Phase では仮置き `0017`）|

## 変更対象ファイル（migration 必要時のみ）

| パス | 変更種別 |
| --- | --- |
| `apps/api/migrations/0017_audit_correlation_fingerprint_version.sql` | 新規 |

> 番号は Phase 2 → Phase 13 直前で `apps/api/migrations/` を再 `ls` し、衝突する場合のみ次の空き番号にずらす。merge 競合時は再採番を許可する（CLAUDE.md sync-merge ポリシー）。

## up SQL（仕様）

対象テーブルは Phase 2 で確定。仮に `cf_audit_log` または `audit_correlation_records`（永続化テーブル名は Phase 2 で確定）に追加する場合のテンプレート:

```sql
-- 0017_audit_correlation_fingerprint_version.sql (up)
ALTER TABLE <target_table>
  ADD COLUMN fingerprint_version INTEGER NOT NULL DEFAULT 1;

-- 既存行は v1 と扱う。新規 INSERT 行は redact.ts が 2 を明示する想定。
CREATE INDEX IF NOT EXISTS idx_<target_table>_fp_version
  ON <target_table>(fingerprint_version);
```

## down SQL（仕様）

```sql
-- 0017_audit_correlation_fingerprint_version.sql (down)
DROP INDEX IF EXISTS idx_<target_table>_fp_version;
ALTER TABLE <target_table> DROP COLUMN fingerprint_version;
```

> SQLite の `ALTER TABLE DROP COLUMN` は 3.35 以上で利用可能。Cloudflare D1 が同一以上であることを Phase 2 で確認した上で採用する。

## ローカル / staging 適用コマンド

```bash
# local（D1 sandbox）
mise exec -- pnpm --filter @ubm-hyogo/api d1:migrations:apply:local

# staging
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
bash scripts/cf.sh d1 migrations list  ubm-hyogo-db-staging --env staging \
  | tee outputs/phase-5/staging-migrations.log
```

`wrangler` 直接実行は禁止（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）。

## テスト方針（Phase 10 と連携）

- migration 適用後 vitest で `SELECT fingerprint_version FROM <target_table> LIMIT 1` が動作すること。
- 既存 row が `1` で埋められることを assert する fixture を Phase 4 の test plan に追加。
- down migration 適用 → 再 up が冪等であることを local D1 で確認。

## 副作用 / 入出力

| 項目 | 内容 |
| --- | --- |
| 入力 | D1 binding（`scripts/cf.sh` 経由） |
| 出力 | `<target_table>` への列追加 / index 追加 |
| 副作用 | スキーマ変更のみ。データ変換は行わない（DEFAULT 1 で既存 row を埋める） |

## 完了条件（DoD）

- [ ] Phase 2 判定の引用と「実施 / スキップ」分岐が冒頭に明記。
- [ ] 実施時: up / down SQL が確定し、衝突しない番号で命名されている。
- [ ] 実施時: 適用 / verify コマンドが `scripts/cf.sh` 経由で記載。
- [ ] 実施時: vitest で migration 適用後の SELECT が成功する test 観点が記載。
- [ ] スキップ時: 理由（永続化なし / 既存 JSON 列で吸収可能 等）が記録されている。

## 次 Phase 連携

- Phase 6（redact.ts）は本 Phase の判定を読み、永続化が無い場合でも in-memory で `fingerprintVersion=2` を返却する。
- Phase 11 staging evidence では本 migration が適用済みであることを前提に dual-hash の連続性を観察する。
