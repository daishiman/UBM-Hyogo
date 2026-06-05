# task-C: Playwright visual evidence（member drawer tag inline-create）

[実装区分: 実装仕様書]

## メタ情報

- workflow_state: `implemented_local_visual_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`

## 目的

member drawer の tag inline-create UI（task-B 実装）に対する Playwright visual baseline spec を追加し、AC-6（desktop/mobile で操作部品と pill が重ならない）を主担当として担保する。AC-1（form 展開）は visual spec、AC-2（作成後 pill 反映）と AC-3（409 conflict 回収）は focused component test を主証跡にする。

## 依存

- **task-B（inline-create UI 実装）に依存**。`MemberTagInlineCreate.tsx` + `MemberDrawer.tsx` 配線後に capture する。
- 既存類似 spec `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-edit.spec.ts` と同ディレクトリの `_helpers.ts` の構成を踏襲する（drawer open / admin 認証 / viewport 設定）。

## 変更対象ファイル

| パス | 種別 | 内容 |
| --- | --- | --- |
| `apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-inline-create.spec.ts` | 新規 | inline-create の desktop form / mobile overlap の visual baseline |

- **apps/api 変更なし**。本タスクは visual spec の追加のみ。

## Playwright visual baseline

既存 `member-drawer-tag-edit.spec.ts` / `_helpers.ts` を参照し、`/admin/members` で先頭 member の drawer を開き TAGS セクションの inline-create UI を表示する。

| 状態 | viewport | canonical 名 | 主担当 AC |
| --- | --- | --- | --- |
| inline-create form 展開 | desktop | `member-tag-inline-create-form-desktop.png` | AC-1 / AC-2 |
| inline-create form 展開（overlap 確認） | mobile | `member-tag-inline-create-form-mobile.png` | AC-6 |

- 実行は staging 認証が必要なため **user-gated**。spec は追加し、baseline 取得は Phase 11 で user 承認後。
- canonical 名は spec / implementation-guide / manual-test-result の 3 か所で一致させる。409 conflict 回収は `MemberDrawer.tagInlineCreate.spec.tsx` C-T5 を主証跡にする。

```ts
// 擬似構造（_helpers.ts の drawer open / 認証ヘルパを再利用）
test('member drawer tag inline-create form (desktop)', async ({ page }) => {
  await openFirstMemberDrawer(page);                 // _helpers.ts 由来
  await page.getByRole('button', { name: /タグを新規作成|新規タグ/ }).click();
  await expect(drawerTagsSection(page))
    .toHaveScreenshot('member-tag-inline-create-form-desktop.png');
});

test('member drawer tag inline-create form (mobile, AC-6 overlap)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); // mobile drawer 幅
  await openFirstMemberDrawer(page);
  // form 入力欄と既存 tag pill が重ならないことを visual で確認
  await expect(drawerTagsSection(page))
    .toHaveScreenshot('member-tag-inline-create-form-mobile.png');
});
```

## AC-6 overlap の確認方針

- mobile viewport（drawer が画面幅に近い狭幅）で inline-create form の入力欄・送信ボタンと、既存 tag pill 群が重ならないことを baseline screenshot で確認する。
- inline-create UI は既存 pill 領域の外側（下部 / 別行）に配置し、pill の折り返しと干渉しないレイアウトであることを visual で担保する。

## ローカル実行コマンド

```bash
# visual spec の存在 / 構文確認（baseline 取得は user-gated）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-shell/member-drawer-tag-inline-create --list
# baseline 取得（user 承認後のみ）
mise exec -- pnpm --filter @ubm-hyogo/web playwright test admin-shell/member-drawer-tag-inline-create
# API 不変の確認
git diff --stat apps/api   # 0 件
```

## DoD（task-C）

- `member-drawer-tag-inline-create.spec.ts` が追加され `--list` で desktop/mobile form baseline tests が検出される
- 既存 `member-drawer-tag-edit.spec.ts` / `_helpers.ts` の構成（認証 / drawer open / viewport）を踏襲している
- canonical 名 2 件が Phase 11 / implementation-guide と一致
- AC-6 overlap が mobile baseline で確認可能な構造になっている
- `git diff --stat apps/api` が 0 件（API surface 不変）
- baseline PNG 取得は Phase 11（user-gated）

## 参照資料

- docs/30-workflows/completed-tasks/issue-1068-admin-tag-inline-create-ui/index.md
- apps/web/playwright/tests/visual/admin-shell/member-drawer-tag-edit.spec.ts
- apps/web/playwright/tests/visual/admin-shell/_helpers.ts
- .claude/skills/task-specification-creator/SKILL.md

## 完了条件

- visual spec 2 件追加（desktop form / mobile overlap）
- AC-6 を主担当として overlap 確認計画が明記
- baseline 取得は user-gated 保留として記録
