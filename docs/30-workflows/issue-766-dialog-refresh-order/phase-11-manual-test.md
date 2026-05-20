# Phase 11: 手動テスト

## 1. 前提

- ローカル dev 環境で `apps/web` / `apps/api` が起動済み
- 一般会員アカウント (`manju.manju.03.28@gmail.com`) でログイン済み
- 公開状態 `public` のメンバーレコードが存在

## 2. 手動テストシナリオ

### MT-1: 公開停止申請 (router.refresh 順序)

1. `/profile` を開く
2. DevTools console を開く (warning 監視)
3. 「公開を停止する」ボタンを押下 → dialog 表示
4. 任意理由を入力 → 「申請を送信」を押下
5. dialog が閉じる
6. **期待**: pending banner が即時表示される / console に `unmounted component` 関連の warning が出ない / stale UI (旧 publishState の表示) が一瞬残らない

### MT-2: 再公開申請

1. メンバーを `hidden` 状態にしておく
2. `/profile` を開き「再公開を申請する」を押下
3. dialog で送信
4. **期待**: MT-1 と同じ挙動

### MT-3: 退会申請

1. `/profile` で「退会を申請する」を押下
2. 不可逆同意 checkbox を check → 「退会申請を送信」を押下
3. **期待**: MT-1 と同じ挙動 / delete pending banner が即時表示

### MT-4: エラー時の挙動

1. API を一時的に 500 エラーを返すよう mock (devtools 経由)
2. `/profile` から申請を試行
3. **期待**: dialog は閉じない / error message が dialog 内に表示 / router.refresh は発火しない (Network タブで再 fetch が起きないこと)

## 3. evidence 取得

`outputs/phase-11/` 配下に以下を残す:

- `manual-smoke-log.md` — 各シナリオの実行結果
- `console-warning-check.md` — DevTools console の warning 有無

## 4. DoD

- [ ] MT-1..MT-4 すべて期待通り
- [ ] console warning なし
- [ ] stale UI が一瞬も見えない
- [ ] evidence ファイル作成済み
