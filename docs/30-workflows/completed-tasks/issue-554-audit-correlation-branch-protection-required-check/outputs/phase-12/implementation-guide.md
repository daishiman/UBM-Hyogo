# Implementation Guide: Issue #554 audit-correlation required status check

## Part 1: 中学生レベルの説明

たとえば学校の提出箱に「先生が確認済みのハンコがある宿題だけ入れてよい」という決まりを追加するようなものです。ハンコがない宿題を受け付けてしまうと、あとで間違いが見つかっても気づきにくくなります。

このタスクでは、GitHub の `dev` と `main` に「`audit-correlation-verify / verify` という確認が通ったものだけ合流できる」という決まりを追加します。実際に決まりを変える操作は外のサービス設定を書き換えるため、ユーザーの明示承認後にだけ行います。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| branch protection | 大事な箱に入れる前の受付ルール |
| required status check | 必ず必要な確認ハンコ |
| context | ハンコに書かれた名前 |
| PUT | 外の設定表を書き換える操作 |
| evidence | あとで確認できる記録 |

## Part 2: 技術者向け current contract

### 対象

| 項目 | 値 |
| --- | --- |
| repository | `daishiman/UBM-Hyogo` |
| branches | `dev`, `main` |
| required context | `audit-correlation-verify / verify` |
| upstream workflow | `.github/workflows/audit-correlation-verify.yml` |
| upstream issue | `Refs #516` |
| target issue | `Refs #554` |

### API operation

```bash
gh api repos/daishiman/UBM-Hyogo/branches/{branch}/protection > outputs/phase-11/before-{branch}-protection.json
jq '
  def enabled_bool($fallback):
    if . == null then $fallback
    elif type == "object" then .enabled
    elif type == "boolean" then .
    else error("unsupported branch protection bool shape")
    end;

  {
    required_status_checks: {
      strict: .required_status_checks.strict,
      contexts: ((.required_status_checks.contexts // []) + ["audit-correlation-verify / verify"] | unique)
    },
    enforce_admins: (.enforce_admins | enabled_bool(false)),
    required_pull_request_reviews: (
      if .required_pull_request_reviews == null then null
      else {
        dismiss_stale_reviews: .required_pull_request_reviews.dismiss_stale_reviews,
        require_code_owner_reviews: .required_pull_request_reviews.require_code_owner_reviews,
        require_last_push_approval: .required_pull_request_reviews.require_last_push_approval,
        required_approving_review_count: .required_pull_request_reviews.required_approving_review_count
      }
      end
    ),
    restrictions: null,
    required_linear_history: (.required_linear_history | enabled_bool(false)),
    allow_force_pushes: (.allow_force_pushes | enabled_bool(false)),
    allow_deletions: (.allow_deletions | enabled_bool(false)),
    required_conversation_resolution: (.required_conversation_resolution | enabled_bool(false)),
    lock_branch: (.lock_branch | enabled_bool(false)),
    block_creations: (.block_creations | enabled_bool(false))
  }
' outputs/phase-11/before-{branch}-protection.json > outputs/phase-11/payload-{branch}-protection.json
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/{branch}/protection \
  --input outputs/phase-11/payload-{branch}-protection.json
gh api repos/daishiman/UBM-Hyogo/branches/{branch}/protection > outputs/phase-11/after-{branch}-protection.json
```

GET response と PUT payload は形状が異なるため、GET JSON をそのまま PUT しない。既定は contexts-only で、既存 drift の修正は Phase 13 user gate で明示承認された場合だけ行う。

### Invariants

| Invariant | Expected |
| --- | --- |
| `required_pull_request_reviews` | `null` |
| `lock_branch` | `false` |
| `enforce_admins` | `true` |
| `required_linear_history` | `true` |
| `required_conversation_resolution` | `true` |

### Evidence paths

| Path | Timing |
| --- | --- |
| `outputs/phase-11/before-dev-protection.json` | captured before Phase 13 (read-only GET) |
| `outputs/phase-11/before-main-protection.json` | captured before Phase 13 (read-only GET) |
| `outputs/phase-11/after-dev-protection.json` | Phase 13 user approval after |
| `outputs/phase-11/after-main-protection.json` | Phase 13 user approval after |
| `outputs/phase-11/diff-summary.md` | Phase 13 user approval after |

### Edge cases

| Edge case | Handling |
| --- | --- |
| context has never reported green on `main` | stop before PUT; keep workflow `spec_created` |
| PUT would remove existing contexts | fail diff check; do not apply payload |
| GitHub API shape differs between GET and PUT | use normalized payload and preserve invariant table |
| `dev` succeeds but `main` fails | keep both before/after snapshots and document rollback path |

## DoD status

Phase 12 DoD is complete for spec readiness. Runtime/application DoD remains gated by explicit user approval.
