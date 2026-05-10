# Phase 10: 品質検証

[実装区分: 実装仕様書]

PR 提出前に通すべき gate を一覧化。Phase 7 のテスト計画と紐付け。

---

## 1. 静的検証

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck         # workspace 全体
mise exec -- pnpm lint              # workspace 全体
```

期待: いずれも exit 0。失敗時は最大 3 回まで自動修復（CLAUDE.md「PR 作成の完全自律フロー」§7 準拠）。

---

## 2. ユニットテスト

```bash
mise exec -- pnpm --filter web test -- profile
```

| spec | 期待 |
|------|------|
| PublicVisibilityBanner.test.tsx | 5 マトリクス + axe 0 |
| StatusSummary.test.tsx | empty / all-public / mixed / declined / rules_declined |
| RequestActionPanel.test.tsx | pending visibility / delete / none / status≠pending |
| VisibilityRequestDialog.test.tsx | submit payload / 500 字超 disabled / cancel / ESC |
| DeleteRequestDialog.test.tsx | confirmText 不一致 / 一致 / IME 中 disabled / submit fail |
| RequestPendingBanner.test.tsx | type 文言切替 / 日本ロケール |
| RequestErrorMessage.test.tsx | role=alert / aria-live |

全 green、coverage 既存閾値を下回らないこと。

---

## 3. a11y（jest-axe）

各 component の test に `expect(await axe(container)).toHaveNoViolations()` を含める。
特に:
- Dialog open 時の `role="dialog"` `aria-modal` `aria-labelledby` 検証
- Banner danger の `role="alert"` + `aria-live`

---

## 4. design tokens gate

```bash
rg -n '#[0-9a-fA-F]{6,8}\b|bg-\[#|text-\[#' apps/web/app/profile
```

`apps/web/app/profile/**` 内に HEX / `bg-[#…]` / `text-[#…]` が **0 件**であること。
失敗時は grep で発見し tokens 変数に置換、修正 commit。

---

## 5. e2e smoke（Playwright）

```bash
mise exec -- pnpm --filter web test:e2e -- profile-smoke
```

8 ケース全 pass（Phase 7 §4）。
fixture 不足で fail する場合は `apps/web/playwright/fixtures/profile.ts` に必要 stub を追加。

---

## 6. API surface 不変検証

```bash
git diff dev...HEAD --name-only | grep -E '^(apps/api/src/routes/me/|apps/web/app/api/me/)' && \
  echo "ERROR: api surface changed" && exit 1 || echo "OK"
```

これが OK 出力で終わること（DoD G-14-6）。

---

## 7. D1 直接アクセス禁止検証

```bash
# apps/web 配下に D1 binding 直参照が無いこと
grep -rE "env\.DB|env\.D1|D1Database" apps/web/app apps/web/src && \
  echo "ERROR: direct D1 access detected" && exit 1 || echo "OK"
```

`fetchAuthed` 経由のみであることを保証（不変条件 #5 / DoD G-14-7）。

---

## 8. 手動 smoke

```bash
mise exec -- pnpm --filter web dev
# → http://localhost:3000/profile
```

| シナリオ | 期待 |
|----------|------|
| 未ログインアクセス | `/login?redirect=/profile` redirect |
| 公開中アカウント（manju.manju.03.28@gmail.com） | success Banner / 4 領域すべて表示 |
| pending visibility（手動 D1 insert で作る or mock） | RequestPendingBanner visible / 申請 button disabled |
| Visibility Dialog 起動 | radio 操作 → submit → router.refresh() で pending 表示 |
| Delete Dialog 起動 | 確認文字列入力 → IME 確定 → submit 有効化 |
| 削除 dialog で IME 変換中 | submit disabled のまま |

---

## 9. Sentry 無エラー確認

dev / staging で 4 領域 + 各 Dialog 起動を一巡し、Sentry に新規 issue が発生しないこと（DoD G-14-10）。

---

## 10. PR 直前 checklist

- [ ] `git status --porcelain` 空
- [ ] `git diff dev...HEAD --name-only` が Phase 8 §2 table 内のみ
- [ ] typecheck / lint / 全テスト / profile token grep green
- [ ] Playwright smoke pass
- [ ] api surface 不変検証 OK
- [ ] D1 直接アクセス検証 OK
- [ ] 手動 smoke で 4 領域 + 2 Dialog の golden path 確認済

---

## 11. 完了条件

§1-10 すべて pass し、Phase 13（クローズアウト）に渡せる状態であること。
