# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-399-admin-queue-resolve-staging-visual-evidence |
| phase | 04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implementation-prepared |

## テスト方針

本タスクは VISUAL_ON_EXECUTION の staging evidence capture が主目的のため、自動テストは「seed SQL の構文 / cleanup の冪等性 / script の env guard」に限定する。

## 追加テスト

| ID | 種別 | 対象 | 期待値 |
| --- | --- | --- | --- |
| T-01 | unit (vitest) | `scripts/staging/seed-issue-399.sh` の env guard | `CLOUDFLARE_ENV=production` で実行すると exit 1 |
| T-02 | unit (vitest) | `scripts/staging/cleanup-issue-399.sh` の env guard | 同上 |
| T-03 | integration | seed SQL の構文 | `wrangler d1 execute --local --file <seed.sql>` が成功 |
| T-04 | integration | cleanup SQL の冪等性 | 2 回連続実行しても exit 0 / count=0 |
| T-05 | manual / staging | 7 状態の UI 再現 | runbook に従い全 screenshot 取得（Phase 11） |
| T-06 | manual / redaction | 全 screenshot の PII redaction | redaction-check.md で全件 PASS |

## テストファイル

| パス | 種別 |
| --- | --- |
| `scripts/staging/__tests__/seed-issue-399.test.ts` | 新規 |
| `scripts/staging/__tests__/cleanup-issue-399.test.ts` | 新規 |
| `apps/api/migrations/seed/__tests__/issue-399-seed-syntax.test.ts` | 新規 |

## 実行コマンド

```bash
mise exec -- pnpm vitest run scripts/staging/__tests__/seed-issue-399.test.ts
mise exec -- pnpm vitest run scripts/staging/__tests__/cleanup-issue-399.test.ts
mise exec -- pnpm vitest run apps/api/migrations/seed/__tests__/issue-399-seed-syntax.test.ts
```

## 完了条件

- [ ] - 全 unit / integration テストが green
- T-05 / T-06 は Phase 11 で実施（VISUAL_ON_EXECUTION）

## 目的

Phase 04 の判断と成果物境界を明確にする。

## 実行タスク

- Phase 04 の入力、実装状態、runtime pending 境界を確認する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)

## 成果物

- `outputs/phase-04/main.md`

## 統合テスト連携

- Focused Vitest は Phase 09 の品質 gate に集約する。
