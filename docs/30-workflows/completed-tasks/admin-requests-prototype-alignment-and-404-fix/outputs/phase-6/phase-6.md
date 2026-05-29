# Phase 6 — テスト拡充

> Phase 5 の GREEN を維持しつつ fail path / 回帰 guard / 補助 command を追加する。

---

## 1. Task A 拡充 test

| # | 名称 | 期待 |
|---|------|------|
| TC-A-07 | cursor 経由でページングが動く | 2 件 fixture / `?cursor=...` で次ページ取得、`nextCursor` 連鎖 OK |
| TC-A-08 | limit=1 で 1 件返却 + nextCursor 設定 | `items.length === 1`, `nextCursor !== null` |
| TC-A-09 | 不正 cursor（base64url 復号失敗）→ 400 | `?cursor=__invalid__` |
| TC-A-10 | resolved / rejected フィルタも 200 | `?status=resolved&type=visibility_request` |
| TC-A-11 | route mount drift gate（多 route 並存下で） | `app.fetch("/admin/members")` も 200/401 系を返し続けることを確認（admin-requests 追加で破壊していない） |

---

## 2. Task B 拡充 test

| # | 名称 | 期待 |
|---|------|------|
| TC-B-04 | フィルター切替で aria-pressed が切り替わる | click → `aria-pressed="true"` |
| TC-B-05 | 空状態で EmptyState 表示 | items=0 fixture で `.card-flat` 内に "未処理の依頼はありません" |
| TC-B-06 | confirm dialog の destructive スタイル | `delete_request` 承認時 dialog に warning 文言 |

---

## 3. 補助 command

```bash
# A11y check（既存）
mise exec -- pnpm --filter web test -- --grep="admin requests a11y"

# Playwright structure-only（snapshot 無し）
mise exec -- pnpm --filter web exec playwright test \
  --project=admin-staging-visual --grep="primitive structure"
```

---

## 4. DoD

- [ ] TC-A-07〜11 全 green。
- [ ] TC-B-04〜06 green。
- [ ] 既存 admin route spec（members / meetings / schema）は全 green を維持。
