# Implementation Guide

## Part 1: 中学生レベルの説明

なぜ必要か: 大事な作業を進めるとき、「誰がいつ確認したか」「証拠はどこにあるか」があいまいだと、あとから本当に確認済みだったのか分からなくなる。これは学校の提出物で、先生の確認印だけがノートの端に書いてあり、どの宿題を見た印なのか分からない状態に似ている。

今回の仕組みは、確認印をきれいな表にする。たとえば Gate-A は「仕様を確認した」、Gate-B は「検証コマンドが通った」のように、確認ごとに名前、状態、証拠の場所、確認した人を同じ形で書く。そうすると、人が読むだけでなく、機械も「証拠のファイルが本当にあるか」を確認できる。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| schema | 書き方のルール表 |
| validator | 書き方を点検する係 |
| artifacts.json | 作業の記録カード |
| evidence_path | 証拠ファイルの場所 |
| CI gate | 自動点検で止める門 |

## Part 2: 開発者向け詳細

### Type Contract

```ts
type GateStatus = "pending" | "passed" | "failed" | "waived";

interface GateEntry {
  gate_id: string;
  status: GateStatus;
  passed_at: string | null;
  evidence_path: string;
  approver: string;
  notes?: string;
}
```

Required invariants:

| Field | Rule |
| --- | --- |
| `gate_id` | `^Gate-[A-Z](-[A-Z0-9]+)*$` |
| `status` | one of `pending`, `passed`, `failed`, `waived` |
| `passed_at` | ISO8601 string when `status === "passed"`, otherwise nullable |
| `evidence_path` | repo-root relative POSIX path for every status; existing file required when status is `passed` |
| `approver` | GitHub username or `CODEOWNERS:<group>` |

### CLI Signature And Usage

```bash
pnpm gate-metadata:validate
node --import tsx scripts/gate-metadata/validate.ts
pnpm gate-metadata:validate --require-gates-for-changed <changed-artifacts-json...>
```

Expected behavior:

| Case | Result |
| --- | --- |
| `metadata.gates` absent | WARN and skip for historical compatibility |
| changed `artifacts.json` passed through `--require-gates-for-changed` and gates absent | ERROR |
| `metadata.gates` present but not an array | ERROR |
| gate schema parse failure | ERROR |
| `status === "passed"` with missing evidence file | ERROR |
| any status with absolute or traversal evidence path | ERROR |
| WARN only | exit 0 |
| one or more ERROR | exit 1 |

### Edge Cases

- Reject repo escape attempts such as `../secret` by resolving `evidence_path` under the repository root before existence checks.
- Keep historical artifacts without `metadata.gates` non-blocking during the initial rollout.
- Use `Refs #589` and `Refs #549`; do not use closing keywords because both Issues are already closed.

### Configuration

| Setting | Value |
| --- | --- |
| validation glob | `docs/30-workflows/**/artifacts.json` |
| CI workflow | `.github/workflows/verify-gate-metadata.yml` |
| script | `gate-metadata:validate` |
| initial backfill target | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/{artifacts.json,outputs/artifacts.json}` |
