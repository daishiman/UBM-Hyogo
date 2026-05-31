# task-C — Playwright visual baseline + invariant #13 再定義の文書化

[実装区分: 実装仕様書]

drawer-tag-edit の visual baseline を追加し、本タスクの根本判断（invariant #13 = auto-suggest と admin manual の経路分離）を正本仕様へ反映する。

## 依存

task-A の endpoint / invariant #13 再定義と、task-B の編集可能 drawer に依存する。`tags-queue.ts` と `memberTags.ts` のコメント変更は task-A が所有し、task-C は `01-api-schema.md` と visual baseline を所有して、同一ファイルの二重編集を避ける。

## 変更対象ファイル

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-edit.spec.ts` | 新規 | drawer-tag-edit visual baseline |
| `apps/api/src/routes/admin/tags-queue.ts` | 編集 | invariant #13 コメント再定義（task-A と協調） |
| `apps/api/src/repository/memberTags.ts` | 編集 | ファイル冒頭コメントの「新規 caller 禁止」を admin manual 例外込みに修正（task-A と協調） |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 編集 | tag write endpoint 3 本 + invariant #13 再定義を追記 |

## Playwright visual baseline

既存 `apps/web/playwright/tests/visual/admin-shell/tags.spec.ts` の構成を踏襲。

- screen: `/admin/members` で先頭 member の drawer を開き、TAGS セクションを表示
- baseline 名: `member-drawer-tag-edit.png`（VISUAL_ON_EXECUTION）
- 状態: 編集可能 pill（selected / unselected 混在）を含む drawer
- 実行は staging 認証が必要なため **user-gated**。spec は追加し、baseline 取得は Phase 11 で user 承認後

```ts
// 擬似構造
test('member drawer tag edit baseline', async ({ page }) => {
  await page.goto('/admin/members');
  await page.getByRole('row').nth(1).click();           // 先頭 member の drawer open
  await expect(page.getByRole('heading', { name: 'タグ' })).toBeVisible();
  await expect(page.locator('[aria-labelledby="drawer-tags-heading"]'))
    .toHaveScreenshot('member-drawer-tag-edit.png');
});
```

## invariant #13 再定義（根本問題の解決）

### Before（現状コメント）

`tags-queue.ts:1-2`:
```
// 不変条件 #13: tag は queue resolve 経由のみ。直接更新 endpoint なし。
```
`memberTags.ts:3-5`: 「`assignTagsToMember` のみ tagQueueResolve 専用。新規 caller 禁止」

### After（再定義）

```
// 不変条件 #13（2026-05 再定義 / issue-982）:
//  - AI / Google Form 由来の tag「提案」は tags-queue の resolve 経由で承認する。
//  - 管理者による tag の「手動付与 / 解除」は /admin/members/:memberId/tags の
//    専用 endpoint 経由で行い、必ず audit (admin.member.tag_assigned /
//    admin.member.tag_unassigned) を記録する。
//  - member_tags への直接 write は上記 2 経路に限り許可する。
```

`memberTags.ts` 冒頭コメントも「`assignTagsToMember` は queue 専用 / `assignTagToMemberByAdmin`・`unassignTagFromMemberByAdmin` は admin manual 専用」と書き分ける。

### `01-api-schema.md` 追記内容

- admin tag write endpoint 3 本の request/response/エラーコード表
- `member_tags`（`tag_assignments` ではない）が正本テーブルである旨
- invariant #13 の 2 経路定義
- audit action 2 件（`admin.member.tag_assigned` / `admin.member.tag_unassigned`）

## ローカル実行コマンド

```bash
# visual spec の存在 / 構文確認（baseline 取得は user-gated）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test member-drawer-tag-edit --list
mise exec -- pnpm exec lhci healthcheck --config=./lighthouserc.json   # 任意
grep -n "member_tags\|tag_assignments" docs/00-getting-started-manual/specs/01-api-schema.md
```

## DoD（task-C）

- `member-drawer-tag-edit.spec.ts` が追加され `--list` で検出される
- `tags-queue.ts` / `memberTags.ts` コメントが invariant #13 再定義を反映
- `01-api-schema.md` に tag write endpoint + invariant #13 が記載
- `grep tag_assignments docs/00-getting-started-manual/specs/01-api-schema.md` が 0 件（旧テーブル名残存なし）
- baseline PNG 取得は Phase 11（user-gated）
