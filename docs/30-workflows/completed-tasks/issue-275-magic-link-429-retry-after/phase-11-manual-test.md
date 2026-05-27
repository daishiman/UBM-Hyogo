# Phase 11: 手動テスト

> 実装区分: **実装完了仕様書**（NON_VISUAL — 視覚証跡は任意）

## 1. 事前準備

```bash
mise exec -- pnpm install
mise exec -- bash scripts/with-env.sh pnpm --filter @ubm-hyogo/web dev
# 別 terminal で API
mise exec -- bash scripts/with-env.sh pnpm --filter @ubm-hyogo/api dev
```

`POST_MAGIC_LINK_EMAIL_LIMIT = 5` / `POST_MAGIC_LINK_IP_LIMIT = 30`（`apps/api/src/middleware/rate-limit-magic-link.ts`）を踏まえ、同一 email で 5 回以上連打して 429 を強制発生させる。

## 2. 手動テストケース

### TC-1: 429 + Retry-After ヘッダーで countdown 起動（必須）

1. ブラウザで `http://localhost:3000/login` を開く
2. 同じ email を 5 回以上送信して 429 を踏ませる
3. **期待**:
   - 6 回目以降の送信で button が disabled、ラベルが `<N>s 後に再送可能` 表示
   - DevTools Network タブで API response の `Retry-After` ヘッダー値と UI countdown 値が一致（±1s 許容）
   - URL が `/login` のまま（`?state=error` / `?state=sent` 付与なし）

### TC-2: countdown 0 で再 enable（必須）

1. TC-1 の状態で countdown が 0 に達するまで待つ
2. **期待**: button が再 enable、再 submit 可能

### TC-3: 既存 200 OK 経路の regression なし（必須）

1. 別 email（未送信）で 1 回送信
2. **期待**:
   - URL が `/login?state=sent&redirect=/profile` に置換
   - button が disabled、ラベル `60s 後に再送可能`
   - mail 送信ログが API 側に出力

### TC-4: 非 429 error の既存挙動（regression）

1. API を一時停止 or 不正 body を送る等で 500 を踏ませる
2. **期待**: URL が `?state=error&error=...`、cooldown は起動しない（既存挙動）

### TC-5: typed error の継承確認（任意 / DevTools）

DevTools Console で:

```js
import("./src/lib/auth/magic-link-client").then((m) => {
  const e = new m.MagicLinkRateLimitedError(45, "app");
  console.log(e instanceof m.MagicLinkRequestError); // true
  console.log(e.status, e.retryAfterSec, e.reason);  // 429 45 'app'
});
```

## 3. 証跡保存

`outputs/phase-11/` 配下に以下を保存（spec のみ作成段階では n/a 行のみ）:

```
outputs/phase-11/
  └─ manual-test-result.md          # TC-1〜TC-4 の結果 / spec のみ段階は n/a
```

NON_VISUAL のため screenshot は任意。撮るなら DevTools Network パネルの 429 response + UI cooldown 表示を 1 枚で十分。

## 4. NG 時の対応

| 症状 | 切り分け |
|---|---|
| 429 後も countdown が出ない | `MagicLinkForm.client.tsx` の catch で `instanceof MagicLinkRateLimitedError` を判別できているか確認。typed error が `MagicLinkRequestError` 経由でしか catch されていない可能性 |
| countdown が常に 60s（server 値を無視） | `magic-link-client.ts` の `parseRetryAfterFromHeader` が header 名で `"Retry-After"` を引いているか確認（ヘッダー名は大小無視だが case 不一致は環境依存） |
| 429 受信時 URL が `?state=error` に遷移 | catch 早期 return が効いていない / typed error 判別失敗。`err.name === "MagicLinkRateLimitedError"` でも fallback できるか検討 |
| reload 後 cooldown が消える | scope 外（AC-3）。期待挙動 |
