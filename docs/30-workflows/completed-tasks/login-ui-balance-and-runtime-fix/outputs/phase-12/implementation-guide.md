# 実装ガイド — login UI バランス & runtime 修正

## Part 1 — 初学者向け（中学生レベル）

### 何が問題だったか

1. **入力欄が太く見える**: ログイン画面のメール入力ボックスが、その下のボタンより縦に大きく見えてバランスが悪かった。
2. **Google アイコンが茶色いかたまりになる**: 公式の 4 色（赤・青・緑・黄）の G ロゴが、別の見た目に上書きされていた。
3. **「ログイン用リンクを送る」が動かない**: ボタンを押しても 404 エラーで進まなかった。
4. **デザイン見本が開けない**: 設計用の `index.html` を開くと 404 で表示できなかった。

### なぜ起きたか（例え話）

- 1 は「同じ大きさのお皿に同じ料理を盛ったのに、お皿の縁の太さが違って違うサイズに見える」状態。CSS（見た目の指定）で余白の取り方が違っていた。
- 2 は「クラス全員にユニフォームを配ったら、絵を描き換えた特注 T シャツの子にも上書きしてしまった」状態。古い見た目ルールが新しいアイコンまで巻き込んでいた。
- 3 は「学校の住所をメモするのに、テスト用の家の住所をいつも書いていた」状態。本番のサーバーアドレスを取り出す箱（`env`）に手を入れず、いきなり生のメモを見ていた。
- 4 は「インターネット上の本を読みに行ったら、本の場所が引っ越して 404 が返った」状態。それと「本のページが JS という形式でないとブラウザが読まない」事情が重なっていた。

### 何をしたか

- 1: 入力欄の高さと余白をボタンと完全に揃えた。
- 2: 「Google ブランドアイコンには古い見た目ルールを当てない」と明示する例外を CSS に書いた。
- 3: 本番アドレスは用途別の取り出し口（`getAuthEnv()` / `getPublicFetchEnv()`）からだけ取るように修正した。直接覗くやり方は禁止する見張り（grep gate）も置いた。
- 4: 引っ越し先の図書館（`jsdelivr` の CDN）に切り替えた。読めない形式を直す小さな配達員スクリプト（`scripts/serve-prototype.sh`）も用意した。

---

## Part 2 — 開発者向け

### 変更ファイル

| 種別 | パス | 概要 |
| ---- | ---- | ---- |
| 編集 | `apps/web/src/styles/auth.css` | `.ui-input[data-size="lg"]` を fixed height 44px + space-4 padding + line-height 1.25 + focus ring 統一 + brand-icon 保護層 |
| 編集 | `apps/web/src/styles/legacy-public.css` | `[data-size]` ワイルドカードを `:not([data-component="google-brand-icon"]):not(.ui-input):not(.ui-button)` で限定 |
| 編集 | `apps/web/app/api/auth/magic-link/route.ts` | `process.env["INTERNAL_API_BASE_URL"]` → `getAuthEnv().INTERNAL_API_BASE_URL` |
| 編集 | `apps/web/app/api/auth/magic-link/verify/route.ts` | 同上 |
| 編集 | `apps/web/app/api/auth/gate-state/route.ts`, `apps/web/app/api/admin/[...path]/route.ts`, `apps/web/app/api/me/[...path]/route.ts`, `apps/web/src/lib/auth/verify-magic-link.ts`, `apps/web/src/lib/fetch/authed.ts` | 同型の internal API base 解決を既存 env accessor へ統一 |
| 追加 | `scripts/verify-no-process-env-internal-api.sh` | regression grep gate |
| 編集 | `docs/00-getting-started-manual/claude-design-prototype/index.html` | unpkg → jsdelivr 固定 + SRI 撤去 + serve コメント |
| 追加 | `scripts/serve-prototype.sh` | `.jsx` MIME 補正 simple HTTP server |
| 確認 | `apps/web/src/lib/env.ts` | 既存 `getAuthEnv()` / `getPublicFetchEnv()` accessor を利用。schema 追加なし |

### 主要 API

```ts
// apps/web/app/api/auth/magic-link/route.ts
import { getAuthEnv } from "@/lib/env";

const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787";

const resolveApiBase = (): string => {
  const v = getAuthEnv().INTERNAL_API_BASE_URL;
  return v && v.length > 0 ? v.replace(/\/$/, "") : FALLBACK_INTERNAL_API;
};
```

### validator checklist

| 検証文字列 | 本ガイドでの対応 |
| ---------- | ---------------- |
| Part 1 に今回作ったものがある | Part 1「何をしたか」で UI / runtime / prototype の実変更を列挙 |
| Part 2 に TypeScript の型定義がある | 既存 `getAuthEnv()` / `getPublicFetchEnv()` の型付き accessor を利用し、新規型追加なし |
| Part 2 に API/CLI シグネチャがある | `resolveApiBase()` と `scripts/serve-prototype.sh <port>` / `scripts/verify-no-process-env-internal-api.sh` を記載 |
| Part 2 に使用例がある | magic-link route の `getAuthEnv()` 利用例をコードで提示 |
| Part 2 に設定項目または定数一覧がある | `INTERNAL_API_BASE_URL` / `FALLBACK_INTERNAL_API` / prototype server port を記載 |
| Part 2 にテスト構成がある | focused route specs、grep gate、prototype MIME smoke を検証コマンドとして記載 |

### 不変条件（再掲）

- `apps/web` の env 参照は `apps/web/src/lib/env.ts` 公開アクセサ経由のみ（CLAUDE.md invariant #11）
- 色は OKLch token のみ、HEX 直書き禁止
- 新規 API endpoint / D1 直接アクセス追加禁止
- Google ブランドアイコンは公式 4 色 SVG を image として配信、CSS で改変しない

### 視覚証跡

| AC | 証跡 |
| -- | ---- |
| AC-1 input/button balance | `outputs/phase-11/screenshots/login-balanced.png` |
| AC-2 Google brand icon | `outputs/phase-11/screenshots/google-brand-icon.png` |
| AC-10 prototype rendered | `outputs/phase-11/screenshots/prototype-rendered.png` |

### エラーハンドリング

- `getAuthEnv()` は auth/internal env subset を safeParse し、未設定時は local fallback に落とす
- `getEnv()` が必要な full schema path は変更しない
- `INTERNAL_API_BASE_URL` が unset の場合のみ `FALLBACK_INTERNAL_API` を返す（dev 互換）

### エッジケース

| ケース | 挙動 |
| ------ | ---- |
| `INTERNAL_API_BASE_URL` 末尾 `/` あり | `.replace(/\/$/, "")` で正規化 |
| `INTERNAL_API_BASE_URL` 空文字 | fallback URL を使用 |
| Workers binding 未設定 | `getAuthEnv()` / `getPublicFetchEnv()` の optional subset 解決後、unset と同じ fallback |

### 設定可能パラメータ

| 名前 | 既定 | 説明 |
| ---- | ---- | ---- |
| `INTERNAL_API_BASE_URL` (wrangler vars) | staging URL | web → api proxy の base |
| `FALLBACK_INTERNAL_API` (const) | `http://127.0.0.1:8787` | dev/未設定時の fallback |
| `serve-prototype.sh` port | `5180` | `bash scripts/serve-prototype.sh <port>` で指定可 |
