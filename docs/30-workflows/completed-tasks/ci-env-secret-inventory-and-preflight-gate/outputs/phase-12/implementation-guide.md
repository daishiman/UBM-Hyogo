# Implementation Guide

## Part 1: 中学生レベル

学校の持ち物チェックで、先生が「水筒を持った人」と「お弁当を持った人」を出発前に確認する場面を考えます。出発してから忘れ物に気づくと、全員が待つことになります。今回の仕組みは、GitHub の自動確認が走り出す前に「必要な合言葉が金庫に入っているか」を名前だけで確認します。

大事なのは、合言葉そのものを見ないことです。先生が「水筒の中身」を飲んで確認しないのと同じで、ここでは名前と置き場所だけを見ます。足りないものがあれば、どの手順書のどの仕事で足りないかを表示し、人が安全に金庫へ入れます。

| 用語 | 日常語での説明 |
| --- | --- |
| workflow | 自動確認の手順書 |
| secret | 金庫に入れる合言葉 |
| environment | 練習場所や本番場所の名前 |
| preflight gate | 出発前の持ち物チェック |
| allowlist | 短い間だけ見逃す名前リスト |

## Part 2: 技術者レベル

### Implemented Files

| Path | Role |
| --- | --- |
| `scripts/ci/verify-env-secrets.sh` | Extracts `secrets.NAME` references and checks env/repo secret name lists via `gh api` |
| `scripts/ci/__tests__/verify-env-secrets.spec.sh` | Fixture-based shell tests with a stubbed `gh` binary |
| `scripts/ci/verify-env-secrets.allowlist` | Short-lived suppressions; `reason` is mandatory |
| `.github/workflows/verify-env-secrets.yml` | PR/push/workflow_dispatch preflight gate |
| `.github/workflows/d1-migration-verify.yml` | Aligned staging token reference to `secrets.CLOUDFLARE_API_TOKEN` under `environment: staging` |

### Interface

```bash
scripts/ci/verify-env-secrets.sh \
  [--workflows-dir DIR] \
  [--allow-list FILE] \
  [--json] \
  [--event-name EVENT] \
  [--owner OWNER] \
  [--repo REPO]
```

Exit codes:

| Code | Meaning |
| ---: | --- |
| 0 | all referenced secret names resolve or are allowlisted |
| 1 | unresolved secret names remain |
| 2 | usage/input/tooling error |
| 3 | GitHub API inventory error |

### Edge Cases

- `secrets.GITHUB_TOKEN` is treated as built-in.
- Jobs with literal `if: false` are skipped.
- `jobs.<id>.environment` simple scalar and `environment.name` object forms are supported.
- `--event-name` narrows scanning to workflows that can run for the current GitHub event.
- `workflow_call` callee secret requirements are validated through their triggering caller or runtime smoke boundary, not as standalone PR/push jobs.
- Complex expression-derived secret names are not inferred; use explicit references or a short-lived allowlist with removal criteria.
