# Phase 12 Implementation Guide

## Part 1: Concept

なぜ必要か: GitHub Actions workflow token は、明示しないと repository settings や GitHub 側の default に依存します。default が変わったとき、checkout に必要な read 権限が足りず CI が落ちたり、逆に不要な write 権限を広く渡したりする余地が残ります。

何をしたか: workflow ごとに最小 baseline を明示し、必要な job だけが既存の job-level permissions で追加権限を持つ構造にしました。

Each GitHub Actions workflow receives a token. `permissions:` tells GitHub what that token can do. If the workflow only needs to read repository files, the safest baseline is `contents: read`.

たとえば教室の鍵を全員に渡すのではなく、通常の生徒には教室に入る鍵だけを渡し、備品庫を開ける必要がある係だけに追加の鍵を渡すイメージです。top-level `permissions: contents: read` が通常の鍵で、job-level write permissions が係だけの追加鍵です。

This task sets that baseline at the workflow top level. Jobs that already need more power keep their existing job-level permissions, so deploy and baseline-update jobs still work without giving every job write access.

### 今回作ったもの

- 12 workflows に top-level `permissions: contents: read` を追加。
- 既存 job-level write permissions を維持。
- `scripts/verify-workflow-top-level-permissions.sh` を追加。
- `.github/workflows/ci.yml` に verifier step を追加。
- Phase 11 evidence と Phase 12 strict outputs を同期。

## Part 2: Technical Details

Changed workflow files:

- `.github/workflows/backend-ci.yml`
- `.github/workflows/d1-migration-verify.yml`
- `.github/workflows/e2e-tests.yml`
- `.github/workflows/lighthouse.yml`
- `.github/workflows/playwright-smoke.yml`
- `.github/workflows/playwright-visual-baseline-update.yml`
- `.github/workflows/playwright-visual-full.yml`
- `.github/workflows/validate-build.yml`
- `.github/workflows/verify-design-tokens.yml`
- `.github/workflows/verify-esbuild.yml`
- `.github/workflows/verify-primitive-adoption.yml`
- `.github/workflows/web-cd.yml`

Each file adds:

```yaml
permissions:
  contents: read
```

The shell verifier uses the following contract:

```ts
type WorkflowPermissionAuditResult =
  | { ok: true; message: "All workflows declare top-level permissions" }
  | { ok: false; missing: string[]; message: "Missing top-level permissions" };
```

Additional guard:

- `scripts/verify-workflow-top-level-permissions.sh` checks every `.github/workflows/*.yml` before `jobs:`.
- `.github/workflows/ci.yml` runs the verifier immediately after actionlint.

### CLIシグネチャ

```bash
bash scripts/verify-workflow-top-level-permissions.sh
```

Exit code:

- `0`: every `.github/workflows/*.yml` has top-level `permissions:` before `jobs:`.
- `1`: at least one workflow is missing the top-level block.

### 使用例

```bash
bash scripts/verify-workflow-top-level-permissions.sh
./actionlint -color .github/workflows/*.yml
```

Expected verifier output:

```text
All workflows declare top-level permissions
```

### エラーハンドリング

When a workflow is missing the block, the script prints `Missing top-level permissions:` followed by each missing path and exits `1`. CI stops at the verifier step, so the failure points directly to workflow-token baseline drift.

### エッジケース

- Job-level write permissions are allowed and must remain when a deploy, baseline update, or issue/PR operation needs them.
- The verifier only accepts `permissions:` before the first top-level `jobs:` line.
- The repository currently uses `.yml` workflow files only; `.yaml` is outside the current inventory.
- `pull_request_target` safety and secret-scope workflows keep their stricter job/workflow-specific permissions.

### 設定項目と定数一覧

| Item | Value |
| --- | --- |
| Workflow glob | `.github/workflows/*.yml` |
| Baseline permission | `contents: read` |
| Required insertion point | before top-level `jobs:` |
| CI step name | `Verify top-level workflow permissions` |
| User-gated operations | commit, push, PR, remote CI observation |

### テスト構成

| Gate | Command | Expected |
| --- | --- | --- |
| Bash syntax | `bash -n scripts/verify-workflow-top-level-permissions.sh` | exit 0 |
| Permissions inventory | `bash scripts/verify-workflow-top-level-permissions.sh` | `All workflows declare top-level permissions` |
| Workflow syntax | `./actionlint -color .github/workflows/*.yml` | exit 0 |
| Group-B retention | `git diff -- group-B workflows \| grep '^-' \| grep -v '^---'` | no output |

## Verification

Local gates passed:

- `bash scripts/verify-workflow-top-level-permissions.sh`
- required context diff grep
- group-B deletion grep
- `./actionlint -color .github/workflows/*.yml`
