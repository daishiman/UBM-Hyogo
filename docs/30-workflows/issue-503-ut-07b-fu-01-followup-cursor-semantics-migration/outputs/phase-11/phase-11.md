# Phase 11: 手動テスト / runtime evidence（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 作成日 | 2026-05-07 |
| 状態 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| visualEvidence | NON_VISUAL |
| 状態語彙 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（`PASS` 単独表記禁止） |
| 親 Issue | #503 |

## 目的

NON_VISUAL タスクとして、staging で 10,000 行 fixture を流し、remaining-scan vs cursor の比較 evidence を取得する。
取得指標:

1. batch あたり / 累計 CPU 時間
2. 残行数推移
3. `retry_count` の遷移
4. `EXPLAIN QUERY PLAN` の出力差分
5. DLQ 投入有無

採用判断は Phase 1 の「採用判断しきい値表」を唯一の SSOT とする。cursor 採用には E1（CPU 30% 以上削減）と E4（cursor 経路が `SEARCH ... USING INDEX`）の両方が必要で、E2 / E3 は補足指標として `decision-record.md` に記録する。

## ⚠️ user gate（必須）

本 Phase は user が **runtime apply（staging deploy + fixture 投入）を明示承認するまで** `blocked_runtime_evidence_pending` を維持する。承認解除前は spec のみ整備し、`PASS` 単独表記を使用しない（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持）。

G1-G4 multi-stage approval gate のうち、本 Phase は **G3** に該当する（runtime apply は user gate）。

## 環境制約

- staging 環境で 10,000 行以上の fixture が流せる状態
- `bash scripts/cf.sh whoami` 成功
- migration 0015 以降（cursor 列追加）が staging に apply 可能であること

## D1 schema parity verification（必須）

task-specification-creator skill のルール（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` 適用条件）に基づき、staging vs production の D1 schema parity を確認する:

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \
  | tee outputs/phase-11/migrations-staging.log
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production \
  | tee outputs/phase-11/migrations-prod.log
diff outputs/phase-11/migrations-staging.log outputs/phase-11/migrations-prod.log \
  | tee outputs/phase-11/migrations-diff.log

bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "PRAGMA table_info(schema_diff_queue);" \
  | tee outputs/phase-11/pragma-staging.log
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "PRAGMA table_info(schema_diff_queue);" \
  | tee outputs/phase-11/pragma-prod.log
```

期待: cursor 採用時は migration 0015 が staging のみ先行し、production には未 apply（採用判断確定後に別タスクで段階適用）。

## NON_VISUAL evidence 必須ファイル

| # | ファイル | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-11/main.md` | NON_VISUAL Phase 11 の主 evidence manifest |
| 2 | `outputs/phase-11/staging-evidence-remaining-scan.md` | remaining-scan 経路で 10,000 行 fixture を流した evidence |
| 3 | `outputs/phase-11/staging-evidence-cursor.md` | cursor 経路で 10,000 行 fixture を流した evidence |
| 4 | `outputs/phase-11/decision-record.md` | 採用 / 不採用 / 判定保留の確定記録 |
| 5 | `outputs/phase-11/d1-schema-parity.md` | staging vs production の `migrations list` / `PRAGMA table_info` 比較 |
| 6 | `outputs/phase-11/lint-evidence.log` | typecheck / lint / vitest 連結ログ |

## 取得手順

```bash
mkdir -p outputs/phase-11

# 0) lint / vitest evidence（user gate 不要 / 副作用なし）
{
  echo "=== typecheck ==="; mise exec -- pnpm typecheck
  echo "=== lint ==="; mise exec -- pnpm lint
  echo "=== vitest ==="; mise exec -- pnpm --filter @ubm-hyogo/api test -- --run schemaAliasBackfillBatch
} | tee outputs/phase-11/lint-evidence.log

# 1) ⚠️ user gate（必須）: 以降は user 明示承認後にのみ実行

# 2) staging migration apply
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging \
  | tee outputs/phase-11/migration-apply.log

# 3) staging deploy
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging \
  | tee outputs/phase-11/deploy.log

# 4) fixture 投入（10,000 行）
#    BACKFILL_CURSOR_MODE 切替で 2 回実行
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --file outputs/phase-11/fixture-10k.sql

# 5) remaining-scan 経路測定
#    BACKFILL_CURSOR_MODE=remaining-scan で queue 起動 → batch ごとに CPU / 残行数 / retry_count を記録
#    結果を staging-evidence-remaining-scan.md に追記

# 6) fixture リセット & cursor 経路測定
#    BACKFILL_CURSOR_MODE=cursor で同条件 fixture を流す
#    結果を staging-evidence-cursor.md に追記

# 7) EXPLAIN QUERY PLAN
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "EXPLAIN QUERY PLAN SELECT rf.id, rf.response_id, rf.stable_key FROM response_fields rf WHERE rf.stable_key = 'sample_stable_key' ORDER BY rf.id ASC LIMIT 20;" \
  | tee -a outputs/phase-11/staging-evidence-remaining-scan.md
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "EXPLAIN QUERY PLAN SELECT rf.id, rf.response_id, rf.stable_key FROM response_fields rf WHERE rf.stable_key = 'sample_stable_key' AND rf.id > 0 ORDER BY rf.id ASC LIMIT 20;" \
  | tee -a outputs/phase-11/staging-evidence-cursor.md

# 8) decision-record.md 作成
#    Phase 1 SSOT の E1 + E4 採用条件に対する判定
```

## 期待結果

| ファイル | 期待 |
| --- | --- |
| `staging-evidence-remaining-scan.md` | batch ごとの CPU 時間 / 残行数 / retry_count / DLQ 投入有無 / EXPLAIN QUERY PLAN を記録 |
| `staging-evidence-cursor.md` | 同上（cursor 経路） |
| `decision-record.md` | `decision: cursor_adopted | remaining_scan_fixed | cursor_decision_deferred` のいずれか / 累計 CPU 比 / しきい値判定根拠 |
| `d1-schema-parity.md` | migrations list の staging/production 差分 / `schema_diff_queue` 列定義の差分 |
| `lint-evidence.log` | typecheck / lint / vitest すべて exit 0 |

## DoD

- [ ] 上記 5 evidence ファイル + lint-evidence.log が実体配置（user gate 解除後に取得）
- [ ] decision-record.md に採用判断と数値根拠が記載
- [ ] d1-schema-parity.md に staging vs production 比較が記載
- [ ] lint-evidence が typecheck / lint / vitest すべて PASS

## 状態遷移

- spec 作成完了時: `blocked_runtime_evidence_pending`
- user runtime apply 承認 + evidence 取得完了時: `runtime_evidence_collected`
- それ以前は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持し PASS 単独表記しない

## G1-G4 multi-stage approval gate との関係

| Gate | 条件 | 本 Phase での扱い |
| --- | --- | --- |
| G1 | typecheck / lint PASS | 本 Phase 0) で取得 |
| G2 | vitest PASS | 本 Phase 0) で取得 |
| G3 | staging runtime evidence 取得済み（採用判断レコード存在） | **本 Phase の主目的** |
| G4 | user 明示承認後に Phase 13 `gh pr create` を実行 | Phase 13 で適用 |

## 成果物

- `outputs/phase-11/phase-11.md`（本ファイル）
- 上記 NON_VISUAL evidence ファイル群（user gate 解除後に取得）

## 次 Phase の前提条件

5 evidence ファイル + lint-evidence.log が実体配置されていること。decision-record.md の判定結果を Phase 12 implementation guide / system-spec-update-summary に反映する。
