# Phase 6: テスト拡充・実行

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 6 / 13 |
| 目的 | Phase 4 計画した TC を全件 GREEN にし、エッジケースを追加する |
| 依存 | Phase 5 |

## 目的

本 Phase の目的は本ファイル冒頭メタ情報「目的」欄を参照。

## 実行タスク

以下のセクションで定義する設計・チェックリスト・コマンド・成果物リストを順に実行する。

## 追加 TC（エッジケース）

| ID | ファイル | ケース | 期待 |
|----|----------|--------|------|
| TC-RED-08 | `redact.spec.ts` | 多言語住所文字列（例: `〒650-0001 神戸市中央区...`）に対する unknown_pii 識別 | `[REDACTED:address]` |
| TC-REP-08 | `auditLog-export.spec.ts` | 100k row insert + listForExport limit=50_000 で pagination 境界 | 2 batch で全件取得 |
| TC-EXP-09 | `export-to-r2.spec.ts` | gzip 圧縮率 > 50%（実 audit_log JSONL 想定） | `compressed_bytes < uncompressed_bytes / 2` |
| TC-EXP-10 | `export-to-r2.spec.ts` | `--target-date` で過去日指定 + 既存 completed manifest が存在 → idempotent skip | exit code 0, manifest 重複なし |
| TC-EXP-11 | `export-to-r2.spec.ts` | concurrent run（手動 dispatch 2 連）で `UNIQUE(yyyy,mm,dd)` violation の 2 個目が graceful fail | exit code 0 (skip) または 1 (clear error) |

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm test scripts/audit-log
mise exec -- pnpm lint
```

## 既存 test suffix gate 確認

```bash
# *.test.ts が混入していないか確認（lefthook block-test-suffix と同等）
find apps/api/src/lib/audit scripts/audit-log apps/api/src/repository -name '*.test.ts' | wc -l
# 期待: 0
```

## 成果物

- `outputs/phase-6/test-results.md`（全 TC pass/fail 一覧 + 実行ログ抜粋）

## 完了条件

- [ ] Phase 4 TC + Phase 6 追加 TC すべて GREEN
- [ ] `*.test.ts` 0 件
- [ ] CI grep gate（redact-grep-gate.spec.ts）GREEN

## 参照資料

- Phase 4 test-plan
- Phase 5 implementation
