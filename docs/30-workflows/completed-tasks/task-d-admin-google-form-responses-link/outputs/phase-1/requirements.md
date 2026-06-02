# Phase 1: 要件定義

## 目的

管理者画面（admin）のサイドバー nav に、Google Form の回答一覧/編集画面を**別タブで開く外部リンク**を
1 項目追加する。D1 同期前の生回答・同意状態を直接確認したいとき、admin 画面からワンクリックで
Google Form の編集画面へ遷移できるようにし、「メンバー非表示の原因が回答側か同期側か」を切り分ける
オペレーションを高速化する。

## 実装区分

**実装仕様書（コード変更を伴う / VISUAL）**。判定根拠は index.md「実装区分の判定根拠」を参照。
本タスクは `apps/web` の shell コンポーネント（サイドバー）と定数・icon・型を変更する。docs-only ではない。

> 本 workflow は **既に dev へ landed 済みの実装の正本記述（verify_existing）** である。
> 親 PR `member-publish-recovery-form-ops-and-admin-link`（PR #1064 / commit `745c95115`）で
> apps コードは dev にマージ済み。`git diff origin/dev...HEAD -- apps/web` は空。
> 本サイクルでは実装差分を新規に発生させず、landed 実装に整合するタスク仕様書 Phase 1-13 を整備する。

## 受け入れ条件（AC）

| ID    | 条件 |
| ----- | ---- |
| AC-D1 | admin サイドバーの項目をクリックすると、Google Form の編集/回答一覧 URL が**別タブ（新規ウィンドウ）**で開く。元の admin 画面は遷移・リロードしない。 |
| AC-D2 | 外部リンクは `target="_blank"` かつ `rel="noopener noreferrer"` を持つ（不変条件 #7 準拠・タブナビング防止）。 |
| AC-D3 | リンク先 URL は `apps/web/src/lib/constants/form.ts` の定数 `FORM_RESPONSES_EDIT_URL` を経由して参照する。コンポーネント/設定への URL ハードコードを禁止する。 |
| AC-D4 | この項目が「外部サイトへ遷移するリンク」であると視覚的・支援技術的に判別できる（`↗` マーカー + sr-only「（外部リンク）」）。かつ内部 nav 項目（`<Link>`）の active ハイライト判定の対象にならない。 |

## 現状コード anchor（実コード verbatim 確認済み 2026-06-01・dev landed）

| 種別 | パス | 現状の事実 |
| --- | --- | --- |
| 定数 | `apps/web/src/lib/constants/form.ts:5-7` | `FORM_RESPONSES_EDIT_URL = "https://docs.google.com/forms/d/119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg/edit" as const`。既存 `FORM_RESPONDER_URL` と同パターン。formId は CLAUDE.md「フォーム固定値」と一致 |
| nav 型 | `apps/web/src/components/shell/shell-config.ts:9-23` | `ShellNavItemId` union に `"form-responses"` を含む（末尾）。網羅型 |
| nav item 型 | `apps/web/src/components/shell/shell-config.ts:26-34` | `ShellNavItem` interface に `readonly external?: boolean` を持つ |
| admin group | `apps/web/src/components/shell/shell-config.ts:62-110` `buildAdminGroup` | `audit` の後に `{ id: "form-responses", href: FORM_RESPONSES_EDIT_URL, label: "Form回答", icon: "form-responses", external: true }` を持つ |
| import | `apps/web/src/components/shell/shell-config.ts:5` | `import { FORM_RESPONSES_EDIT_URL } from "../../lib/constants/form";` |
| icon | `apps/web/src/components/shell/icons.tsx:43` | `PATHS: Record<ShellNavItemId, string>` に `"form-responses"` の外部リンク系 SVG path を持つ（網羅型のため id 追加と同時に必須） |
| 描画 | `apps/web/src/components/shell/SidebarNavItem.tsx:24-86` | `item.external` のとき `<a target="_blank" rel="noopener noreferrer">` を描画する分岐を持つ。`↗` マーカー（非 collapsed 時）と sr-only「（外部リンク）」を付与。external は `isNavItemActive` の `data-active`/`aria-current` を出さない |
| active 判定 | `apps/web/src/components/shell/shell-config.ts` `isNavItemActive` | 内部 pathname 前方一致用。外部項目は `<a>` 分岐で描画し本関数を呼ばない |
| 既存外部リンク参考 | `apps/web/src/components/public/RegisterCallout.tsx` | `<a href target="_blank" rel="noopener noreferrer">` の既存パターン（同形） |

## 命名規則（既存分析）

- TypeScript identifier: camelCase（`buildNavForRole` / `buildAdminGroup` / `isNavItemActive`）
- nav item id: kebab-case の union literal（`tag-queue` / `form-responses`）
- 定数: SCREAMING_SNAKE_CASE + `as const`（`FORM_RESPONDER_URL` / `FORM_RESPONSES_EDIT_URL`）
- icon path: `PATHS` の Record key は `ShellNavItemId` と 1:1（網羅型）

## 外部リンク仕様

- 形式: `<a href={FORM_RESPONSES_EDIT_URL} target="_blank" rel="noopener noreferrer">`。href は定数経由のみ（ハードコード禁止）。
- 配置: admin group の `items` 末尾（`audit` の後）。viewer / member role には含めない。
- 視覚判別: 非 collapsed 時は label の右に `↗`（`aria-hidden`）。常に sr-only「（外部リンク）」を label span 内へ付与。
- active 判定: external 項目は `<a>` 分岐で描画し `data-active` / `aria-current` を**一切出さない**（どの admin pathname でも非 active）。

## 不変条件

- 不変条件 #7: 外部 link 遷移（`target="_blank"` + `rel="noopener noreferrer"`）。iframe 埋め込みは採用しない。
- 不変条件 #9: admin の form input は対象外（本タスクは nav リンクのみ・`<input>` を増やさない）。
- OKLch トークン正本化: 色は `var(--shell-active-bg)` / `var(--ubm-color-accent)` 等のトークン変数のみ。HEX 直書き・`bg-[#xxx]`・inline style を新規追加しない。
- 既存 API のみ接続: 外部静的 URL への遷移のみ。D1 schema / API endpoint / Google Form schema は不変。
- 不変条件 #8: 新規 test は `*.spec.{ts,tsx}` のみ。

## leak / セキュリティ整合

- `rel="noopener"` により遷移先からの `window.opener` 参照を遮断（タブナビング防止）。
- 外部 URL は公開済みの Google Form 編集画面（認可は Google 側で実施）。本リンク自体は admin role の nav にのみ出現する。

## スコープ（CONST_007）

- 含む: 定数 / nav config / icon / 描画分岐 / 2 つの spec の正本記述（landed 実装に整合）。
- 含まない（別レーン・別 issue）: Google Form 側の権限設計、回答データの D1 取り込み（親ワークフローの Task A/B/C 射程）。これらは本タスクの単一責務（外部リンク 1 項目追加）から外れるため先送りではなく責務分離。

## 参照

- `.claude/skills/aiworkflow-requirements/references/ui-component-architecture.md`（存在時。shell primitive の責務境界）
- `docs/00-getting-started-manual/google-form/02-result.md`（Form 編集 URL の正本）
- 親ワークフロー: `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/tasks/D-admin-google-form-responses-link.md`
