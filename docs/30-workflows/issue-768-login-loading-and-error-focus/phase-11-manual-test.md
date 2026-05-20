# Phase 11: 手動テスト

## 1. 起動

```bash
mise exec -- pnpm --filter @ubm/web dev
```

`http://localhost:3000/login` を開く。

## 2. テストシナリオ

### S-1: loading boundary 確認

1. DevTools Network タブで Throttling を `Slow 3G` に設定
2. アドレスバーに `http://localhost:3000/login` を入力して Enter
3. **期待**: skeleton（3 ブロック）が一瞬表示され、その後 LoginPanel が render される
4. **a11y**: VoiceOver / NVDA で "ログイン画面を読み込み中" がアナウンスされる

### S-2: error boundary 確認

1. 一時的に `apps/web/app/login/page.tsx` の関数本体 1 行目に `throw new Error("forced for manual qa");` を追加
2. `/login` をリロード
3. **期待**:
   - "ログイン画面でエラーが発生しました" h1 が Card 内に表示
   - h1 に focus が当たっており、Tab 1 回で "再読み込み" button に到達
   - VoiceOver / NVDA が assertive で h1 アナウンス
   - DevTools Console に `[login] route error` log
4. "再読み込み" ボタンを click → boundary が再 try
5. **確認後、追加した `throw` は必ず削除**

### S-3: digest 表示確認

1. `apps/web/app/login/page.tsx` で `const err = new Error("forced"); (err as any).digest = "manual-qa-001"; throw err;` を一時的に追加
2. `/login` リロード
3. **期待**: `error id: manual-qa-001` が code 要素で表示
4. **確認後、追加コードは必ず削除**

### S-4: 視覚整合確認

- `bg-surface-2` skeleton が `Card` 内で OKLch token カラーで描画されている（HEX 直書き感のない柔らかい背景）
- Card 角丸 / shadow が公開系 error と同じ
- ダーク / ライトモード切替で skeleton 色も追従（OKLch token 経由）

## 3. ロールバック

すべての一時 `throw` を削除し、`git status` でクリーン状態を確認。

## 4. evidence

任意で screenshot を `outputs/phase-11/` に保存:
- `login-loading-throttle.png`
- `login-error-focus.png`
- `login-error-digest.png`
