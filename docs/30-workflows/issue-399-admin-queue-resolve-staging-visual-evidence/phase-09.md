# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-399-admin-queue-resolve-staging-visual-evidence |
| phase | 09 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implementation-prepared |

## 品質ゲート

| Gate | コマンド | 期待 |
| --- | --- | --- |
| focused Vitest | `pnpm exec vitest run scripts/staging/__tests__/seed-issue-399.test.ts scripts/staging/__tests__/cleanup-issue-399.test.ts apps/api/migrations/seed/__tests__/issue-399-seed-syntax.test.ts` | 3 files / 9 tests PASS |
| typecheck | `pnpm -r typecheck` | 今回未実行。広域検証は PR 前 gate |
| lint | `pnpm run lint` | 今回未実行。広域検証は PR 前 gate |
| seed SQL remote run | `CLOUDFLARE_ENV=staging bash scripts/staging/seed-issue-399.sh` | 今回未実行。user 承認付き staging cycle で実施 |
| cleanup SQL remote run | `CLOUDFLARE_ENV=staging bash scripts/staging/cleanup-issue-399.sh` | 今回未実行。user 承認付き staging cycle で実施 |
| shell script syntax | `shellcheck scripts/staging/seed-issue-399.sh scripts/staging/cleanup-issue-399.sh` | 今回未実行。shellcheck ローカル導入有無未確認 |

## カバレッジ方針

新規 shell script + migration seed のテストカバレッジは「env guard 全分岐 + cleanup 冪等性」の logical coverage を 100% 保つこと（line coverage 数値ではなく分岐網羅）。

## redaction / secret 検証

- `git grep -n "op://"` 結果が `.env` のみであること（docs / scripts に op:// 参照を直書きしない）
- `git grep -nE "ya29\\.|sk_live_|AKIA[0-9A-Z]{16}"` 結果が空であること

## 完了条件

- [ ] focused Vitest が PASS していること
- [ ] 未実行の広域 / staging gate を runtime evidence pending として記録していること

## 目的

Phase 09 の判断と成果物境界を明確にする。

## 実行タスク

- Phase 09 の入力、実装状態、runtime pending 境界を確認する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)

## 成果物

- `outputs/phase-09/main.md`

## 統合テスト連携

- Focused Vitest は Phase 09 の品質 gate に集約する。
