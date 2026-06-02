# Phase 12 — system spec 反映サマリ（Task D: admin サイドバー外部リンク）

## 結論

本タスクは **API endpoint / D1 schema / Google Form schema を一切変更しない**。よって
aiworkflow-requirements の API 契約・DB 契約に対する**変更はない**。反映は「UI shell の nav 外部リンクパターン」を
**参照情報（現契約の記録）**として同一 wave で正本へ反映した。

## 反映対象の判定

| 区分 | 反映の有無 | 理由 |
| --- | --- | --- |
| API endpoint 契約 | なし | 新 endpoint 追加なし。`FORM_RESPONSES_EDIT_URL` は外部 Google Form の固定 URL であり API surface ではない |
| D1 schema | なし | テーブル / カラム変更なし |
| Google Form schema | なし | フォーム構造・consent キー・質問数に変更なし（不変条件 #1〜#4 を維持） |
| UI component / shell primitive | 反映済み | `ShellNavItem.external?` による外部リンクパターンを現契約として記録 |

## UI nav 外部リンクパターン（参照情報）

aiworkflow-requirements の UI/shell 参照に、以下を現契約パターンとして記録済み:

- **`ShellNavItem.external?`**: nav 項目に `external?: boolean` を持たせ、`true` のときのみ外部リンク描画に分岐する。
  未指定（falsy）は内部リンク（後方互換）。
- **外部リンク描画契約**: external 項目は `<a target="_blank" rel="noopener noreferrer">` で描画し
  （不変条件 #7・タブナビング防止）、`↗` + `sr-only`「（外部リンク）」で判別、active 判定（`aria-current`）対象外。
- **URL 定数化契約**: 外部リンク href はハードコードせず、`apps/web/src/lib/constants/` 配下の定数
  （本件 `FORM_RESPONSES_EDIT_URL`）を単一正本として参照する。
- **網羅型 icon Record**: nav icon は `Record<ShellNavIcon, ...>` の網羅型で管理し、icon key 追加忘れを型で強制する。

## 不変条件との整合

| 不変条件 | 整合 |
| --- | --- |
| #5 D1 直接アクセスは `apps/api` に閉じる | 維持（`apps/web` shell のみ変更・D1 非接触） |
| #7 外部リンクは `target=_blank` + `rel=noopener noreferrer` | 本実装で担保 |
| #9 admin の form input は `FormField` 経由 | 非該当（input 追加なし・nav 項目のみ） |
| OKLch トークン正本化（task-09） | HEX 直書きなし・`verify-design-tokens` green |

## 反映先（同一 wave 反映済み）

| 反映先 | 内容 | 種別 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` | admin nav item 数を 14 へ同期し、`ShellNavItem.external?` 外部リンク契約を追記 | system spec |
| `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | AdminSidebar nav に `Form回答` を追加し active 除外を明記 | system spec |
| `.claude/skills/aiworkflow-requirements/references/workflow-task-d-admin-google-form-responses-link-artifact-inventory.md` | Task D artifact inventory / lessons / contract を登録 | aiworkflow reference |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `resource-map.md` / `task-workflow-active.md` | Progressive Disclosure 入口へ登録 | aiworkflow indexes |
| `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | 認証必須 VISUAL の two-tier evidence を正本化 | task-specification-creator |
| `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` | external nav 項目パターンを追加 | task-specification-creator |

> API/DB 契約変更がないため、aiworkflow-requirements の `api-endpoints` / `database-implementation-core` への
> 追記は不要。UI/shell 正本・workflow inventory・indexes のみ同期した。

## 完了条件

- API endpoint / D1 schema / Google Form schema に変更がないことが明記されていること。
- UI nav 外部リンクパターンが参照情報（現契約の記録）として正本へ反映されていること。
- 不変条件 #5 / #7 / OKLch トークンとの整合が記録されていること。
