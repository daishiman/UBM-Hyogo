# Phase 8: リファクタ

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 8 / 13 |
| 目的 | コードの重複除去・命名整理・redaction grep gate の最終確認 |
| 依存 | Phase 7 |

## 目的

本 Phase の目的は本ファイル冒頭メタ情報「目的」欄を参照。

## 実行タスク

以下のセクションで定義する設計・チェックリスト・コマンド・成果物リストを順に実行する。

## リファクタ観点

| ID | 対象 | アクション |
|----|------|-----------|
| RF-1 | `apps/api/src/routes/admin/audit.ts` 既存 masking 実装 | `redact.ts` の `redactAuditPayload` へ集約。重複 regex 削除 |
| RF-2 | `scripts/audit-log/export-to-r2.ts` と `scripts/cf-audit-log/export-to-r2.ts` 共通処理 | 重複が ≥ 20 行になる場合のみ `scripts/lib/audit-export/` へ抽出。本サイクル時点では duplicate を許容（2 系統で要件分離） |
| RF-3 | error message 一貫性 | `manifest_insert_failed` / `r2_put_failed` / `redact_policy_mismatch` の code-style エラー名統一 |
| RF-4 | log redaction 確認 | `console.log` / `console.error` の引数に raw row を渡している箇所がない（grep 確認） |

## redaction grep gate（最終確認）

```bash
# 1. ソース内 raw audit value の log 出力検出
rg -n 'console\.(log|error|warn).*\b(beforeJson|afterJson|actorEmail)\b' \
   scripts/audit-log apps/api/src/lib/audit
# 期待: 0 件

# 2. 出力経路 (stdout / .log artifact) への raw email/phone 不混入
rg -nE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' \
   scripts/audit-log apps/api/src/lib/audit \
   --glob '!**/__tests__/**' --glob '!**/*.spec.ts'
# 期待: 0 件（fixture 以外）
```

## 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
```

## 成果物

- `outputs/phase-8/refactor-checklist.md`（RF-1..RF-4 実施結果）
- `outputs/phase-8/redaction-grep-gate-result.md`（2 grep 結果 + exit code）

## 完了条件

- [ ] RF-1..RF-4 完了
- [ ] redaction grep gate 0 件
- [ ] テスト全件 GREEN を維持

## 参照資料

- Phase 7 coverage
- Phase 2 §2.2 redact module
