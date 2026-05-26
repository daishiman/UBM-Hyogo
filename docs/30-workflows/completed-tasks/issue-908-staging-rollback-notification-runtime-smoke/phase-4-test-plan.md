---
task_id: issue-908-staging-rollback-notification-runtime-smoke
governance_mutation_user_gate: true
---

# Phase 4: テスト計画 — タスク仕様書

## メタ情報

| Phase | 4 |
| --- | --- |
| Phase名 | テスト計画 |
| 機能名 | issue-908-staging-rollback-notification-runtime-smoke |

---

## 検証戦略

本タスクは bash helper script の追加と evidence MD 生成を主体とするため、vitest spec は追加しない。代替検証として以下を使用する:

| Level | Subject | Command | 期待 |
| --- | --- | --- | --- |
| L0: syntax | helper script の bash syntax | `bash -n scripts/runtime-smoke/schema-alias-rollback.sh` | exit 0 |
| L1: dry-run | helper の副作用ゼロ実行 | `bash scripts/runtime-smoke/schema-alias-rollback.sh --env staging --alias dummy-alias-id --dry-run` | exit 0 / `[DRY-RUN]` プレフィクス付き plan 出力 / D1 mutation 0件 / curl POST 発火なし |
| L2: redact | secret 非転記 | dry-run 出力を `grep -E 'hooks\.slack\.com/services/[A-Z0-9]{8}'` で grep | 0 hit（実値なし） |
| L3: runtime | 3 ケース staging smoke | helper を本実行（user-gated） | 各 scenario の rollback HTTP 200 + audit entry が期待通り |
| L4: parent mutation | 親 manual-test-result.md / artifacts.json 整合 | `node scripts/gate-metadata/validate.ts` | OK ≥ 既存数 / ERROR 0 |
| L5: workflow gate | 仕様書 Phase 12 compliance | `node scripts/verify-phase12-compliance.ts` | status=pass |
| L6: indexes | 自動生成 index drift | `mise exec -- pnpm indexes:rebuild` 後 `git status` | clean（idempotent） |

---

## RED → GREEN シナリオ

### L0/L1（仕様書段階で実行可能）

helper script 未作成時は L0/L1 が fail。Phase 5 で helper を作成し PASS させる。

### L3（staging runtime・user-gated）

helper 未実行時は evidence MD の各 scenario が `<NOT_YET_EXECUTED>` placeholder。実行後に operator が転記して GREEN 化する。

### L4

evidence_path 不在時 ERROR。Phase 5 で evidence MD の placeholder を先行作成して PASS させる。

---

## 完了条件

- [x] L0〜L6 の command suite を確定
- [x] RED → GREEN 経路を確定
- [x] runtime smoke は user-gated であることを明示

---

## 次Phase

`phase-5-implementation.md` へ進む。
