# 2026-06-01 task-d-admin-google-form-responses-link

`task-d-admin-google-form-responses-link` を `implemented_local_evidence_captured / implementation / VISUAL` として同期。

- Task D は親 PR #1064 / commit `745c95115` で landed 済みの admin sidebar external nav link 実装の正本検証 workflow。
- Admin role nav は PUBLIC 3 + MEMBERS 1 + ADMIN 10 = 14 item。`Form回答` は `FORM_RESPONSES_EDIT_URL` を href とし、`ShellNavItem.external?` で `<a target="_blank" rel="noopener noreferrer">` に分岐する。
- 外部 nav 項目は `↗` + sr-only「（外部リンク）」で告知し、`aria-current` / `data-active` は付けない。
- `09h-shell-and-fixtures.md` / `09g-screen-blueprints-admin.md` / artifact inventory / quick-reference / resource-map を同一 wave で反映。
- task-specification-creator へ認証必須 VISUAL の two-tier evidence と external nav item pattern を同期。
- staging admin screenshot、external tab runtime observation、commit、push、PR は user-gated。
