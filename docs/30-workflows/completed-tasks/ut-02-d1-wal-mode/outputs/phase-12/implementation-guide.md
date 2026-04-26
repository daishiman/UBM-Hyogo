# Implementation Guide

## Part 1: Beginner Explanation

なぜ必要か: many people may read the same database while a sync job writes to it. If we assume a special database mode works without proof, the real service can fail later when traffic arrives.

たとえば教室の連絡ノートを考える。先生が書いている間に生徒が読むと待ち時間が出る。WAL は待ち時間を減らす方法の一つだが、Cloudflare D1 でその方法をずっと有効にできるかは、Cloudflare の公式ルールを確認してから決める必要がある。

何をしたか: UT-02 は本物の D1 に変更を加えない。代わりに、`wrangler.toml` には D1 binding と安全コメントだけを置き、`PRAGMA journal_mode=WAL` は公式永続サポートが確認できた場合だけ後続の runtime execution で検証する、というルールを作った。

### 今回作ったもの

| Artifact | Purpose |
| --- | --- |
| `apps/api/wrangler.toml` comment | D1 binding owner and contention policy are visible near the binding. |
| `outputs/phase-05/foundation-bootstrap-runbook-wal-section.md` | Runtime executor starts with official support check, not production mutation. |
| `outputs/phase-12/system-spec-update-summary.md` | Records that canonical specs were updated for D1 PRAGMA constraints. |
| `outputs/phase-11/main.md` | Records NON_VISUAL Phase 11 evidence and screenshot N/A reason. |

## Part 2: Developer Notes

### APIシグネチャ

No application API was added by UT-02. The contract is a runtime policy for D1 contention handling:

```ts
type D1ContentionPolicy =
  | {
      mode: "official-wal-supported";
      action: "verify-in-staging-before-production";
      requiresApproval: true;
    }
  | {
      mode: "wal-unsupported-or-ambiguous";
      action: "use-runtime-mitigations";
      mitigations: Array<"retry-backoff" | "queue-serialization" | "short-transactions" | "batch-size-limit">;
    };
```

### CLIシグネチャ

```bash
wrangler d1 execute <database-name> --env <environment> --command "PRAGMA journal_mode;"
```

This command is read-only evidence gathering. `PRAGMA journal_mode=WAL` is not part of the UT-02 docs-only execution path.

### 使用例

```bash
# Read-only staging evidence
wrangler d1 execute ubm-hyogo-db-staging --env staging --command "PRAGMA journal_mode;"

# If official persistent support is not confirmed, implement runtime mitigation in UT-09 instead of mutating journal mode.
```

```ts
const policy: D1ContentionPolicy = {
  mode: "wal-unsupported-or-ambiguous",
  action: "use-runtime-mitigations",
  mitigations: ["retry-backoff", "queue-serialization", "short-transactions", "batch-size-limit"],
};
```

### エラーハンドリング

| Error / Signal | Handling |
| --- | --- |
| `journal_mode` is not listed as an official compatible D1 PRAGMA | Do not run mutation; keep UT-09 runtime mitigations mandatory. |
| `wrangler d1 execute` cannot access the DB | Fix D1 binding / account / environment before any journal-mode decision. |
| `SQLITE_BUSY` appears during sync | Retry with backoff, serialize writes, reduce transaction length, and reduce batch size. |
| A mutation command was run accidentally | Stop further environments, record evidence, and create a rollback plan in the runtime execution task. |

### エッジケース

| Case | Expected Policy |
| --- | --- |
| Local D1 returns a different journal mode from remote D1 | Treat local as non-authoritative and verify in staging. |
| Staging appears to accept WAL but docs do not guarantee persistence | Do not promote to production without official confirmation and approval. |
| Production needs high write throughput before UT-09 mitigation exists | Use queue serialization and smaller batches first; do not rely on undocumented PRAGMA behavior. |

### 設定項目と定数一覧

| Item | Value / Rule |
| --- | --- |
| D1 binding | `DB` |
| Staging DB name | `ubm-hyogo-db-staging` |
| Production DB name | `ubm-hyogo-db-prod` |
| PRAGMA mutation default | Prohibited in UT-02 |
| Runtime owner | UT-09 Sheets to D1 sync job |
| Screenshot evidence | N/A for UT-02 because this is NON_VISUAL docs-only work |

### テスト構成

| Check | Command / Evidence |
| --- | --- |
| Phase output structure | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/ut-02-d1-wal-mode` |
| Phase 12 guide contract | `node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/ut-02-d1-wal-mode` |
| Spec consistency | `node .claude/skills/task-specification-creator/scripts/verify-all-specs.js --workflow docs/ut-02-d1-wal-mode --json` |
| Manual smoke | `outputs/phase-11/manual-smoke-log.md` |
