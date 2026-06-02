# Phase 13: PR 作成

> 親フェーズ: タスク仕様書（implemented_local_evidence_captured）
> 対象: admin サイドバー nav への Google Form 回答編集 外部リンク追加（タスク D）
> 親ワークフロー: member-publish-recovery-form-ops-and-admin-link

## 目的

タスク仕様書（Phase 1-12）の正本記述を踏まえ、dev ブランチへ PR を作成する。
**本フェーズは status=blocked（ユーザー承認待ち）**。commit / push / PR / staging deploy /
external issue mutation はユーザーの明示承認後にのみ実行する。

## ステータス

`blocked` — user-gated。

## landed 実装と本フェーズの関係（重要）

本タスク D の apps 実装（`apps/web/src` の 4 ファイル + 3 spec）は、**親 PR #1064 / commit `745c95115`**
（親ワークフロー `member-publish-recovery-form-ops-and-admin-link`）で **既に dev へ landed 済み**である。
`git diff origin/dev...HEAD -- apps/web` は空であり、本サイクルは landed 実装の正本記述（verify_existing）で
apps 差分を新規発生させない。

したがって本 Phase 13 の PR は次のいずれかとして扱う:

1. **apps 実装は親 PR #1064 に内包済み** — 別途 apps コードの PR は不要。
2. **本 workflow から PR を出す場合は docs 専用** — `docs/30-workflows/completed-tasks/task-d-admin-google-form-responses-link/`
   配下の仕様書（Phase 1-13）のみを base=dev へ。apps 差分は含まない。

PR を出すか否か・docs のみ PR とするかは、ユーザー承認時に確定する（既定は「親 PR #1064 に内包済みのため
追加 PR は仕様書 docs があれば docs-only」）。

## PR 仕様

| 項目 | 値 |
| --- | --- |
| base ブランチ | `dev` |
| タイトル例 | `docs(workflow): admin サイドバーの Google Form 回答編集リンク タスク D 仕様書（実装は #1064 で landed 済み）` |
| 代替タイトル例（apps 同梱が必要な場合のみ） | `feat(admin): admin サイドバーに Google Form 回答編集リンクを追加 (refs #1064)` |
| 親 PR | #1064（commit `745c95115`・apps 実装 landed 元） |
| 含まれる差分 | 本サイクルは docs（仕様書）のみ。apps は landed 済みで差分なし |

## PR 本文骨子

- **背景**: admin が会員の Google Form 回答を編集する導線がサイドバーに無く、別途 URL を手控えていた。
  不変条件 #7（MVP では Google Form 再回答を本人更新の正式経路とする）に沿い、admin から Form 回答編集画面へ
  ワンクリックで遷移できる導線が必要。
- **変更**: admin サイドバー nav に外部リンク項目「Form回答」を 1 つ追加。`ShellNavItem.external?` を追加し、
  external 時のみ `<a target="_blank" rel="noopener noreferrer">` を描画。href は `FORM_RESPONSES_EDIT_URL`
  定数経由（formId は CLAUDE.md 固定値）。`↗` + sr-only「（外部リンク）」で外部遷移を告知し、active 判定対象外とする。
- **後方互換**: `external?` は optional。既存内部 nav 項目は従来どおり `<Link>` + active 判定で回帰なし。
  D1 / API / Google Form schema は不変。新規 primitive ゼロ。
- **検証**: typecheck（網羅型 `PATHS` / `external?` 互換）/ lint（boundaries / inline style なし）/
  vitest 3 spec green（定数 / 描画 / nav config）/ `verify-design-tokens`（OKLch のみ・HEX 禁止）。
  screenshot は staging 認証必須で user-gated（未取得が正・jsdom render unit を主証跡とする）。
- **スコープ外**: Form 回答の取り込み・反映運用（Task B 系）/ 公開状態 backfill（Task A 系）/
  Form 権限・OAuth スコープ設計 / D1 schema 変更。

## 含まれる変更ファイル

### apps（landed 済み・本サイクルで差分なし）

- `apps/web/src/lib/constants/form.ts`（`FORM_RESPONSES_EDIT_URL` 定数）
- `apps/web/src/components/shell/shell-config.ts`（`ShellNavItemId` union + `ShellNavItem.external?` + `buildAdminGroup` 末尾項目）
- `apps/web/src/components/shell/icons.tsx`（`PATHS` に `form-responses` path・網羅型）
- `apps/web/src/components/shell/SidebarNavItem.tsx`（`item.external` 分岐 / `<a target="_blank" rel="noopener noreferrer">` / `↗`+sr-only / active 除外）
- `apps/web/src/lib/constants/__tests__/form-responses.spec.ts`（spec）
- `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx`（spec）
- `apps/web/src/components/shell/__tests__/shell-config.spec.ts`（spec・external 検証追加）

> 上記 apps ファイルは親 PR #1064 / commit `745c95115` で dev に landed 済み。
> `git diff origin/dev...HEAD -- apps/web` は空であり、本 PR では再変更しない。

### docs（本サイクルの対象）

- `docs/30-workflows/completed-tasks/task-d-admin-google-form-responses-link/`（Phase 1-13 仕様書 + `outputs/`）

## DoD（Definition of Done）

- [ ] PR base = dev
- [ ] タイトルが規約に沿う（docs-only or `feat(admin): ... (refs #1064)`）
- [ ] 本文に背景 / 変更 / 後方互換 / 検証 / スコープ外が含まれる
- [ ] 変更ファイル一覧に「apps は #1064 landed 済み・本サイクル差分なし」を明記
- [ ] screenshot 未取得（staging 認証 user-gated）を本文に明示
- [ ] commit / push / PR はユーザー承認後にのみ実行

## 完了条件

完了条件は、ユーザー承認後に base=dev の PR が作成され（または親 PR #1064 内包で追加 PR 不要と確定し）、
PR URL または「親 PR 内包で追加 PR 不要」の結論が記録され、apps 差分を新規発生させていないことが
確認できた状態とする。
