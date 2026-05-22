# Phase 10: 単体テスト実装仕様

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| Source | `outputs/phase-10/phase-10.md` |
| 親 Issue | #555 |
| 親タスク | issue-516 (FU-01 親) |

## 目的

`AUDIT_CORRELATION_SALT` rotation 自動化と dual-hash 機構（fingerprintVersion=2 移行）の単体テストを vitest で決定論的に検証する。`AUDIT_CORRELATION_SALT_PREVIOUS` 併存期 / 単一期 / rollback / cross-version correlate の 4 経路に対し、最低 4 ケースを `apps/api/src/audit-correlation/__tests__/` に追加する。加えて `scripts/audit-correlation/rotate-salt.sh` の `shellcheck` を local CI gate として整備する。

## 実行タスク

詳細仕様は `outputs/phase-10/phase-10.md` を正本とする。

## 統合テスト連携

本 Phase の vitest PASS と shellcheck PASS を Phase 11 staging runtime evidence 取得の前提とする。Phase 11 は親 FU-01 (issue-516) の live wiring 完了が前提のため、本 Phase 完了後も `blocked_upstream_pending` を維持する。

## 参照資料

- `outputs/phase-10/phase-10.md`
- `apps/api/src/audit-correlation/redact.ts`（fingerprintVersion=2 dual-hash 実装対象）
- `apps/api/src/audit-correlation/correlate.ts`（cross-version merge 実装対象）
- `scripts/audit-correlation/rotate-salt.sh`
- 起票元: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-FU-04-FU-03-salt-rotation-automation.md`

## 成果物

- `outputs/phase-10/phase-10.md`
- `outputs/phase-10/local-evidence/typecheck.log`
- `outputs/phase-10/local-evidence/lint.log`
- `outputs/phase-10/local-evidence/test.log`
- `outputs/phase-10/local-evidence/shellcheck.log`

## 完了条件

- vitest 4 ケース以上の追加仕様確定。
- 実行コマンド `mise exec -- pnpm --filter @ubm-hyogo/api test` が記述。
- `shellcheck scripts/audit-correlation/rotate-salt.sh` が exit 0 になる前提を明記。
- typecheck / lint / test / shellcheck 4 ログの保存先確定。
