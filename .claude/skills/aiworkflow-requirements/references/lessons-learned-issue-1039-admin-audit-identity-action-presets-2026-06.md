# lessons-learned-issue-1039-admin-audit-identity-action-presets-2026-06

## L-I1039-001 Native datalist preserves query and free-text contracts

- Situation: `/admin/audit` needed common action suggestions for `identity.merge` and `identity.dismiss`, but the existing `action` query key and arbitrary action input had to remain valid.
- Resolution: Use `<Input list="audit-action-presets">` plus a native `<datalist>` beside the existing field. Do not replace the input with a select.
- Verification: Component tests assert `name="action"`, the datalist options, and arbitrary values such as `member.delete`; page tests assert `?action=identity.dismiss` restores and submits the same API path.

## L-I1039-002 Primitive passthrough before primitive expansion

- Situation: A new UI affordance looked like it might require a component primitive change.
- Resolution: Check whether the existing primitive already forwards native props. `Input` forwards `InputHTMLAttributes`, so `list` required no new component API.
- Verification: No `Input.tsx` edit and no new shared type were needed; the behavior is covered by `AuditLogPanel` render tests.

## L-I1039-003 VISUAL local evidence must not be left as pending when a local contract can be captured

- Situation: Staging screenshots are user-gated, but Phase 11 still required local visual evidence for a VISUAL task.
- Resolution: Capture local screenshots for the datalist-open and restored-query states, then keep only staging authenticated screenshots in the user-gated boundary.
- Verification: `validate-phase11-screenshot-coverage.js` passes with `manual-test-result.md` and the two canonical PNG files present.

## 関連パターン

これらの knowledge は task-specification-creator 側の汎用パターンへ昇格済み。逆方向参照として固定する。

- 参照: [[patterns-lessons-and-pitfalls]] の **SP-I1039** セクション
  - SP-I1039-A: native `<datalist>` による候補提示と自由入力・URL query 契約の両立（L-I1039-001 由来）
  - SP-I1039-B: primitive expansion 前に native prop passthrough を確認（L-I1039-002 由来）
  - SP-I1039-C: VISUAL は local screenshot を `present`、staging authenticated screenshot のみ user-gated に分離（L-I1039-003 由来）
