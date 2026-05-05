# Phase 12 Output: Implementation Guide

## Part 1: 中学生でもわかる説明

学校の掲示板に「明日からの約束」が貼られているとします。友だちから聞いた話だけでノートを書き直すと、聞き間違いのまま広がるかもしれません。だから、掲示板をもう一度見て、そこに本当に書いてある内容だけをノートに写します。

このタスクでも同じことをします。GitHub に本当に設定されているルールを見て、説明書を同じ内容に直します。予想で書くと間違うので、GitHub から取り直した結果だけを使います。取り直した結果がまだ無い時は、「まだ確認できていない」と書き、できたことにはしません。

## Part 2: 技術者向け

Fresh `gh api` GET evidence を `branch-protection-applied-{dev,main}.json` に保存し、`required_status_checks.contexts` と6軸状態を aiworkflow-requirements に反映する。expected contexts は比較対象であり、final state の入力正本ではない。

```ts
type BranchProtectionAppliedEvidence = {
  required_status_checks?: {
    contexts?: string[];
    strict?: boolean;
  } | null;
  enforce_admins?: { enabled?: boolean } | null;
  required_pull_request_reviews?: unknown;
  restrictions?: unknown;
};
```

Validation contract:

- `required_status_checks.contexts` must be an array for both `dev` and `main`.
- `status: "blocked_until_user_approval"` is a blocker, not a final applied state.
- Missing, null, or placeholder evidence returns BLOCKED and must not update current applied references.
- `Refs #303` is allowed in PR text; `Closes #303` is forbidden.

Phase 11 / visual evidence boundary:

- This task is `docs-only / NON_VISUAL`; no UI or screenshot capture is required.
- Phase 11 evidence is recorded in `outputs/phase-11/main.md`, `outputs/phase-11/manual-smoke-log.md`, and `outputs/phase-11/link-checklist.md`.
- Screenshot artifacts under `outputs/phase-11/` would be misleading for this task because the verified surface is GitHub branch protection JSON and specification text, not a rendered screen.
