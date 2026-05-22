# Phase 11: 手動テスト

## 1. 事前準備

```bash
mise exec -- pnpm install
mise exec -- bash scripts/with-env.sh pnpm --filter @ubm-hyogo/web dev
```

API（`apps/api`）も並走起動する。seed member は `playwright-public-member` を使用（既存 fixture）。

## 2. 手動テストケース

### TC-1: member 固有 OG 画像が PNG で返る

```bash
curl -sI http://localhost:3000/members/playwright-public-member/opengraph-image
```

期待:
- `HTTP/1.1 200 OK`
- `Content-Type: image/png`
- `Content-Length` ≥ 5000（画像が空でない目安）

### TC-2: meta tag が member-specific path を指す

```bash
curl -s http://localhost:3000/members/playwright-public-member | grep -E 'og:image|twitter:image'
```

期待:
- `og:image` content に `/members/playwright-public-member/opengraph-image` を含む
- `twitter:image` content も同様

### TC-3: 存在しない id は 404

```bash
curl -sI http://localhost:3000/members/__never_exists__/opengraph-image
```

期待: `HTTP/1.1 404 Not Found`

### TC-4: 画像内容の目視

```bash
curl -s http://localhost:3000/members/playwright-public-member/opengraph-image > /tmp/og.png
open /tmp/og.png
```

期待（目視）:
- 1200×630 / 青グラデーション背景
- 中段大文字で member の fullName
- 副見出しに occupation（存在時）
- 下端に "Hyogo Branch Members"
- email / phone / address 等の PII が **含まれない**

### TC-5: regression — root OG 画像

```bash
curl -sI http://localhost:3000/opengraph-image
curl -s http://localhost:3000/ | grep 'og:image'
```

期待: `/opengraph-image` が 200 PNG / top page の og:image は `/opengraph-image`（変更なし）

### TC-6: regression — members list

```bash
curl -s http://localhost:3000/members | grep 'og:image'
```

期待: `/opengraph-image`（root）のまま

### TC-7: Twitter Card Validator（deploy 後の任意確認）

`https://cards-dev.twitter.com/validator` で staging URL を投入し、画像 preview が member 名で表示されることを確認（ローカル不可・staging deploy 後のオプション）。

## 3. 証跡保存

`outputs/phase-11/` 配下に以下を保存:

```
outputs/phase-11/
  ├─ manual-test-result.md          # TC-1〜TC-6 の結果
  ├─ screenshots/
  │   ├─ og-image-seeded.png         # TC-4 の画像をそのまま保存
  │   └─ og-image-meta-grep.txt      # TC-2 の curl 出力
  └─ manual-smoke-log.md             # 日付・実行者・コマンドログ
```

## 4. NG 時の対応

| 症状 | 切り分け |
|---|---|
| 200 だが Content-Type が image/png ではない | `contentType` export / next/og バージョン確認 |
| 画像生成が遅い（>3s） | profile fetch の revalidate を再確認 |
| 日本語が tofu になる | 同一実装サイクル内でフォント埋め込みを修正。runtime / bundle 制約で破綻する場合のみエスカレーション |
| meta tag が member-specific にならない | page.tsx の `ogImage` 引数指定漏れ |
