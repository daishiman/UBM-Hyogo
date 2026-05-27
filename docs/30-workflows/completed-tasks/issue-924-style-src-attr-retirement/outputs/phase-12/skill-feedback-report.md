# Phase 12 Skill Feedback Report

## テンプレ改善

No task-specification-creator template change is required. The existing rule already covers CLOSED implementation issues: code/config/tests must be implemented in the same cycle, while commit/push/PR and external runtime evidence remain user-gated.

## ワークフロー改善

The initial spec incorrectly treated local implementation as user-gated. The corrected workflow state is `local_static_pass_browser_pending`, which separates local implementation evidence from browser/staging evidence.

Review-cycle correction: a grep gate that only searches `style={{` misses prop-forwarding cases like `style={style}` and conditional objects like `style={condition ? ... : undefined}`. The invariant gate has been promoted to search `style={` across CSP-relevant TSX files, with ImageResponse routes as the only explicit exclusion.

## ドキュメント改善

The aiworkflow security header spec now records `style-src-attr` as retired, with `scripts/verify-no-inline-style.sh` as the local invariant gate and `ImageResponse` routes as the explicit CSP-exempt boundary.

For VISUAL tasks where the local app server starts but route HTML does not respond, Phase 11 should distinguish a saved static visual sanity screenshot from full route visual regression. The former can close local CSS/DOM sanity; the latter remains user-gated and must not be marked PASS.
