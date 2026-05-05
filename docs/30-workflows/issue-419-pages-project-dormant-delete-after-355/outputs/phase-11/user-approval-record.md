# User Approval Record

state: PENDING_RUNTIME_EXECUTION
date: -
operator: -
redaction: -
runtime_pass: PENDING
ac_link: AC-4

## Required Approval

Deletion requires an explicit user approval comment after the dormant observation window passes.

| Field | Value |
| --- | --- |
| approval_source | PR comment / Issue comment / direct user instruction |
| approval_url | - |
| approver | - |
| approved_at | - |
| exact_approval_text | - |

## PASS Criteria

- The approval text clearly authorizes Pages project deletion.
- Spec PR approval is not reused as runtime deletion approval.
- The approval is recorded before `bash scripts/cf.sh pages project delete` is run.
