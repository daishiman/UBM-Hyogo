# Implementation Guide

state: DOC_PASS
workflow_state: spec_created

## Part 1: 中学生レベル

古い建物から新しい建物へ引っこした直後は、しばらく古い建物を残しておくと安心です。新しい建物で水道や電気が止まったとき、すぐ古い建物へ戻れるからです。

今回の Pages は、その「古い建物」です。Workers という新しい公開場所へ切り替えたあとも、すぐに Pages を消すと、問題が起きたときに戻る場所がなくなります。だから最低 2 週間は様子を見ます。

2 週間のあいだに問題がなく、だれも古い場所を使っていないことを確認します。そのあと、ユーザーがはっきり「消してよい」と承認した場合だけ、Pages を消します。一度消すと元には戻せないため、記録を残してから進めます。

| 専門用語 | 日常語の言い換え |
| --- | --- |
| Cloudflare Pages | 古い公開場所 |
| Workers | 新しい公開場所 |
| dormant | 使われていない休止状態 |
| rollback | うまくいかない時に前の状態へ戻すこと |
| evidence | あとで確認できる記録 |
| redaction | 見せてはいけない文字を隠すこと |

## Part 2: 技術者レベル

### Runtime Evidence Schema

```ts
type RuntimeEvidenceState = "PENDING_RUNTIME_EXECUTION" | "PASS" | "FAIL" | "BLOCKED";

interface PagesDeletionEvidenceHeader {
  state: RuntimeEvidenceState;
  date: string;
  operator: string;
  redaction: "PASS" | "FAIL" | "-";
  runtime_pass: "PENDING" | "PASS" | "FAIL" | "BLOCKED";
  ac_link: "AC-1" | "AC-2" | "AC-3" | "AC-4" | "AC-5" | "AC-6" | string;
}
```

### Command Contract

All Cloudflare commands go through `bash scripts/cf.sh`. Direct `wrangler` invocation is forbidden because the wrapper centralizes 1Password env injection, local wrangler selection, and esbuild path stabilization.

```bash
bash scripts/cf.sh whoami
bash scripts/cf.sh pages project list
bash scripts/cf.sh pages project delete <PROJECT_NAME> --yes
```

### Rollback Boundary

| Layer | Before deletion | After deletion |
| --- | --- | --- |
| Workers VERSION_ID rollback | Available | Available |
| Pages dormant DNS retreat | Available | Removed |

Deletion is allowed only after the Pages retreat path is no longer needed.

### Error Handling

| Failure | Action |
| --- | --- |
| Cloudflare auth fails | Stop. Do not delete. Refresh `CLOUDFLARE_API_TOKEN` through approved secret flow. |
| Pages still has custom domain attachment | Stop. Domain cutover is incomplete. |
| Dormant window is shorter than 14 days | Stop. Continue observation. |
| User approval missing | Stop. Approval is mandatory. |
| Redaction grep finds matches | Redact evidence, re-run grep, then continue. |
| Post-deletion smoke fails | Trigger Workers VERSION_ID rollback investigation. Do not rely on deleted Pages. |

### AC Mapping

| AC | Runtime path | Evidence file |
| --- | --- | --- |
| AC-1 | Workers cutover and smoke preflight | `outputs/phase-11/preflight-ac1-ac2.md`, `workers-pre-version-id.md` |
| AC-2 | Pages dormant and domain detached | `outputs/phase-11/preflight-ac1-ac2.md` |
| AC-3 | Minimum two-week observation | `outputs/phase-11/dormant-period-log.md` |
| AC-4 | Explicit approval | `outputs/phase-11/user-approval-record.md` |
| AC-5 | Redaction gate | `outputs/phase-11/redaction-check.md` |
| AC-6 | Post-delete spec cleanup | `outputs/phase-12/system-spec-update-summary.md` |
