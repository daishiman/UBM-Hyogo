# system spec update summary

| spec | 差分 | 反映 |
| --- | --- | --- |
| docs/00-getting-started-manual/specs/02-auth.md | `/no-access` 不採用が UI で実現されたことを追記 | aiworkflow-requirements index に 06b close-out として同期 |
| docs/00-getting-started-manual/specs/05-pages.md | `/login` URL contract（state / email / redirect）と `/profile` read-only 表示を fix | aiworkflow-requirements index に 06b close-out として同期 |
| docs/00-getting-started-manual/specs/06-member-auth.md | AuthGateState 5 状態の UI 表現、sent email 非表示、safe redirect を追記 | aiworkflow-requirements index に 06b close-out として同期 |
| docs/00-getting-started-manual/specs/07-edit-delete.md | `/profile` はアプリ内本文編集 UI なし、外部 Google Form CTA のみ許可と再強調 | aiworkflow-requirements index に 06b close-out として同期 |
| docs/00-getting-started-manual/specs/13-mvp-auth.md | MVP では Google Form 再回答が本人更新の正式経路（不変条件 #7）を再宣言 | aiworkflow-requirements index に 06b close-out として同期 |
| aiworkflow-requirements indexes | `resource-map.md` / `quick-reference.md` / `task-workflow-active.md` / `SKILL.md` へ 06b を登録 | 反映済み |

## 命名・契約変更

- `LoginPanel` / `MagicLinkForm` / `ProfilePage` / `StatusSummary` / `EditCta` を spec 用語として確定
- `loginQuerySchema` の fields（state / email / redirect / error / gate）を URL contract として固定。`redirect` は `normalizeRedirectPath` で single-slash internal path のみに制限
- `fetchAuthed` を apps/web 配下の認証付 fetch の唯一経路に統一
