# Phase 5: 永続化 migration 実装（必要時のみ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-5/phase-5.md` |
| 実装区分 | 実装仕様書（D1 migration / 条件付き） |

## 目的

Phase 2 の永続化 schema 影響判定に従い、`fingerprintVersion` カラム追加が必要なら新規 D1 migration を 1 ファイル追加する。不要と判定された場合は本 Phase をスキップ記録のみで完了とし、後続 Phase（6/7）の実装には影響しない。

## 実行タスク

詳細は `outputs/phase-5/phase-5.md` を正本とする。Phase 2 の判定結果を最初に確認し、以下のいずれかに分岐する。

- **migration 必要時**: `apps/api/migrations/0017_audit_correlation_fingerprint_version.sql`（既存最新は 0016。番号は Phase 2 で実態確認後に確定し、衝突時は次の空き番号にずらす）に up / down を記述。`fingerprintVersion INTEGER NOT NULL DEFAULT 1` を対象テーブルに追加する。
- **migration 不要時**: 本 Phase の DoD として「スキップ理由（永続化されていない / 既存スキーマで吸収可能）」を `outputs/phase-5/phase-5.md` 冒頭に記録し、ファイルは追加しない。

## 統合テスト連携

- `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` で staging に適用する。
- `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` で 0016 → 新番号の順序整合を確認する。
- `wrangler` 直接実行は禁止。必ず `scripts/cf.sh` 経由とする（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）。

## 参照資料

- `outputs/phase-5/phase-5.md`
- `outputs/phase-2/phase-2.md`（永続化判定の根拠）
- `apps/api/migrations/0016_cf_audit_log_classification.sql`（直前 migration）
- index.md「想定変更ファイル一覧」`apps/api/migrations/0016_*.sql`（番号は実態に合わせて再採番）

## 成果物

- `outputs/phase-5/phase-5.md`
- （必要時のみ）`apps/api/migrations/00XX_audit_correlation_fingerprint_version.sql`（仕様確定。実装は Phase 13 まで保留）

## 完了条件

- Phase 2 判定に沿った「実施 / スキップ」のいずれかが明示記録されている。
- 実施時は up / down SQL が確定し、既存 migration（最新 0016）と番号競合がない。
- 適用 / verify コマンドが `scripts/cf.sh` 経由で記載されている。
