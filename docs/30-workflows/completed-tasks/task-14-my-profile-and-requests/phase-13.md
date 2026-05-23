# Phase 13: クローズアウト（PR 本文・受け入れ checklist）

[実装区分: 実装仕様書]

実装完了後の PR 本文テンプレート、最終受け入れ checklist、ドキュメント整理。

---

## 1. PR タイトル（推奨）

```
feat(profile): rebuild /profile to 4-region layout (task-14)
```

---

## 2. PR 本文テンプレート

```markdown
## Summary
- prototype 準拠の 4 領域構成（公開状態バナー / 公開範囲サマリ / 申請パネル / 削除申請）に `/profile` をリビルド
- pending request 連動で対応する申請ボタンを disabled 化、`<RequestPendingBanner>` で可視化
- `VisibilityRequestDialog` / `DeleteRequestDialog` を ui-primitive `<Dialog>` に移行（focus trap / aria-modal / IME safe）
- API surface（`apps/api/src/routes/me/*`, `apps/web/app/api/me/*`）変更 0 件
- HEX 直書き 0 件 / OKLch tokens のみ

## Scope
- 新規: `_components/PublicVisibilityBanner.tsx`
- rebuild: `_components/StatusSummary.tsx`
- minor: `RequestActionPanel`, `VisibilityRequestDialog`, `DeleteRequestDialog`,
         `RequestPendingBanner`, `RequestErrorMessage`, `page.tsx`
- e2e: `e2e/profile-smoke.spec.ts` に 8 ケース append

## Out of scope（不変条件）
- 新規 API endpoint 追加 / D1 schema 変更
- プロフィール本文の inline 編集 UI（更新は Form 再回答）
- 退会の即時反映（管理 queue 経由のまま）

## DoD（Definition of Done）
- [ ] G-14-1: 4 領域 prototype 準拠で描画
- [ ] G-14-2: profile token grep gate pass
- [ ] G-14-3: `RequestPendingBanner` で二重申請抑止
- [ ] G-14-4: `POST /api/me/visibility-request` 1 回呼出
- [ ] G-14-5: `POST /api/me/delete-request` 1 回呼出
- [ ] G-14-6: `apps/api/src/routes/me/*` 追加・変更 0
- [ ] G-14-7: `apps/web` から D1 直接アクセス無し
- [ ] G-14-8: a11y critical violation 0
- [ ] G-14-9: 未ログイン → `/login?redirect=/profile` redirect
- [ ] G-14-10: staging / dev 起動で 4 領域 + 2 Dialog を一巡して Sentry 新規 issue 0

## Test plan
- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` green
- [ ] `pnpm --filter web test -- profile` green
- [ ] `pnpm --filter web test:e2e -- profile-smoke` green
- [ ] `rg -n '#[0-9a-fA-F]{6,8}\b|bg-\[#|text-\[#' apps/web/app/profile` green
- [ ] staging で 4 領域 + 2 Dialog の手動 smoke 完了

## Screenshots
（`outputs/phase-11/` 配下に画像がある場合のみ参照を添付。無ければセクション削除）

## 参照
- `docs/30-workflows/task-14-my-profile-and-requests/` Phase 1-13 仕様書
- 起票元: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/06-screens-member/task-14-w5-par-my-profile-and-requests.md`
```

---

## 3. 最終受け入れ checklist（実装完了時に逐次 check）

Phase 13 status: `pending_user_approval`。commit、push、PR 作成、dev merge、main merge、staging deploy、production deploy、runtime smoke、24h Sentry observation はユーザー明示承認後にのみ実施する。

### 3.1 ファイル系

- [ ] `apps/web/app/profile/_components/PublicVisibilityBanner.tsx` 新規作成
- [ ] `apps/web/app/profile/_components/StatusSummary.tsx` Card + Badge + tokens で書き直し
- [ ] `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` ui-primitive `<Dialog>` 移行
- [ ] `apps/web/app/profile/_components/DeleteRequestDialog.tsx` ui-primitive `<Dialog>` 移行 + IME safe
- [ ] `apps/web/app/profile/_components/RequestPendingBanner.tsx` tokens 適用
- [ ] `apps/web/app/profile/_components/RequestErrorMessage.tsx` `role="alert"` + tokens
- [ ] `apps/web/app/profile/_components/RequestActionPanel.tsx` Card 化 + pending 連動
- [ ] `apps/web/app/profile/page.tsx` 4 領域配置 + Promise.all + `<PublicVisibilityBanner>` 最上部
- [ ] `_components/__tests__/*` 7 spec が更新 / 新規

### 3.2 品質 gate

- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` green
- [ ] `pnpm --filter web test -- profile` green
- [ ] `pnpm --filter web test:e2e -- profile-smoke` green（task-18 規約に従う）
- [ ] `rg -n '#[0-9a-fA-F]{6,8}\b|bg-\[#|text-\[#' apps/web/app/profile` green
- [ ] jest-axe critical violation 0

### 3.3 不変条件

- [ ] HEX 直書き / `bg-[#…]` / `text-[#…]` 0 件
- [ ] `apps/api/src/routes/me/*` git diff 0
- [ ] `apps/web/app/api/me/*` git diff 0（追加 handler 無し）
- [ ] `apps/web` から `env.DB` / `D1Database` 直参照 0
- [ ] プロフィール本文の inline 編集 UI 無し（不変条件 #4）

### 3.4 動作確認

- [ ] dev サーバ → `/profile` で 4 領域すべて描画
- [ ] 未ログインで `/profile` → `/login?redirect=/profile` redirect
- [ ] 公開状態 3 値 × authGateState の Banner tone が正しい
- [ ] pending visibility / delete で対応 button disabled
- [ ] Dialog open 時 focus trap 機能（Tab で外に出ない）
- [ ] 削除確認入力で IME 確定前は submit disabled
- [ ] 申請成功後 `router.refresh()` で pending Banner 表示
- [ ] staging deploy 後 24h Sentry 無エラー

### 3.5 ドキュメント

- [ ] PR 本文に Phase 12 の説明から関連項目を反映
- [ ] `outputs/phase-11/` にスクリーンショットがあれば PR に添付（無ければセクション省略）
- [ ] `docs/30-workflows/task-14-my-profile-and-requests/` Phase 1-13 が最終確定状態で commit 済

---

## 4. 完了後のアーカイブ

PR merge 後、`SCOPE.md §6 diff scope 規律 / archive rule` に従う場合:

```bash
git mv docs/30-workflows/task-14-my-profile-and-requests \
       docs/30-workflows/completed-tasks/task-14-my-profile-and-requests
```

`git rm -r` 純削除は禁止。

---

## 5. 残課題 / 持ち越し

CONST_007 に従い、本パッケージ内には**先送り項目を含めない**。
仮に実装中に「分離が必要」と判断した case が出た場合は、ユーザーへエスカレーションして判断を仰ぐ。

現時点で想定される後続タスク（既に別 task として登録済 / 本 task 範囲外）:
- task-18: Playwright smoke + profile token grep の CI gate 化（task-14 で append した spec を取り込む）

---

## 6. 完了条件

- §3 checklist の全項目が check 済
- PR が `dev` に merge され、staging smoke 8 項目 pass
- `dev → main` PR 経由で production deploy 完了、24h Sentry 無エラー
- task-14 のすべての DoD（G-14-1..10）が満たされる
