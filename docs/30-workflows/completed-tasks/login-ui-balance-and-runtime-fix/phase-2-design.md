# Phase 2 — 設計

## 全体方針

UI と runtime を別 lane として並列実装可能。検証 lane（grep gate / playwright）は直列で締める。

```
lane-1 (UI):       A-1 input balance ─ B-1 GoogleBrandIcon 隔離 ─ B-2 legacy-public.css 限定
lane-2 (runtime):  C-1 magic-link route env ─ C-2 verify route env
lane-3 (gate):     C-3 grep gate + playwright baseline 更新（lane-1/2 完了後）
```

## A-1: メール入力フィールドの太さ・バランス調整

### 現状

`apps/web/src/styles/auth.css:94-106`:

```css
.auth-card .ui-input {
  width: 100%;
  border: 1px solid var(--ubm-color-border-default);
  border-radius: var(--ubm-radius-md);
  background: var(--ubm-color-surface-panel);
  color: var(--ubm-color-text-primary);
}
.auth-card .ui-input[data-size="lg"] {
  min-height: 44px;
  padding: 0 var(--ubm-space-3);
  font-size: var(--ubm-text-base);
}
```

button は `min-height: 44px` / `padding: 0 var(--ubm-space-4)`。input は `space-3`（細め）+ デフォルト inline 表示 + デフォルト font line-height 比率により縦に主張する。

### 改修

- `.auth-card .ui-input[data-size="lg"]` を以下に変更:
  - `height: 44px;`（min-height ではなく固定）
  - `padding: 0 var(--ubm-space-4);`（button と同じ左右 padding）
  - `line-height: 1.25;` を明示
  - `font-size: var(--ubm-text-base);` 維持
- `.auth-card .ui-input:focus-visible` を追加して focus ring を button と統一（既存 token `--ubm-color-focus` 使用、なければ `--ubm-color-accent` を `outline` で）

### Decision

- height を `height` で固定する理由: Flex/Stack 配下で min-height が auto-grow せず button と完全に揃うことを保証
- `--ubm-space-4` 採用根拠: button と同 token を共有することで responsive token 変更耐性

## B-1 / B-2: Google ブランドアイコンの隔離

### 現状

`legacy-public.css:195-220`（推定）の `[data-size]`/`[data-size]::after`/`[data-size="lg"]` 系がワイルドカードで全 element に当たり、`<GoogleBrandIcon>` の `<img data-size="md">` まで巻き込んでいる。

### 改修方針（責務テーブル）

| レイヤ | Before | After | 責務 |
| ------ | ------ | ----- | ---- |
| `GoogleBrandIcon.tsx` | `data-size` 属性のみ | `data-size` を `data-icon-size` にリネーム（または `data-component="google-brand-icon"` のままだが style 直指定で legacy セレクタに勝つ） | brand-icon は legacy セレクタの対象外であることを宣言する |
| `legacy-public.css` | `[data-size]`（全要素対象） | `:where(.legacy-public) [data-size]`（scope を legacy-public ルート配下に限定）or `[data-size]:not([data-component="google-brand-icon"]):not(.ui-input):not(.ui-button)` | legacy 領域内のみに作用させる |
| `auth.css` | brand-icon scope なし | `.auth-card [data-component="google-brand-icon"] { background: transparent !important; }` の防御層を追加（last resort） | 何かのカスケードで color が変わっても brand 4 色 SVG が維持される |

### Decision（A vs B 選択）

採用案: **legacy-public.css 側を `:where(.legacy-public) [data-size]` で scope 化する**。理由:

1. legacy-public 系統は public ルート（`/`/`/members` 等）でのみ使われる前提（CLAUDE.md「UI prototype alignment / MVP recovery」スコープ）。`/login` は `auth-card` 配下のため legacy-public scope に含まれない。
2. `GoogleBrandIcon.tsx` 側の属性リネームは renderer 全体への影響範囲が広く、回帰リスクが大きい。
3. `:where()` は specificity 0 で副作用最小。

### `.legacy-public` クラスの付与方針

- 既存の legacy public 領域の root（おそらく `apps/web/app/(public)/` の root layout / page）に `<div className="legacy-public">` でラップするのが理想だが、Phase 1 inventory にない場合は採用しない。
- 代替: `legacy-public.css` の `[data-size]` を `[data-size]:not([data-component="google-brand-icon"])` でセレクタ単位に防御する（具体的なネガティブセレクタ）。

最終採用: **後者（negative selector）**。理由 = 影響範囲が CSS 1 ファイル内に閉じる。

### Decision まとめ

```css
/* legacy-public.css */
[data-size]:not([data-component="google-brand-icon"]):not(.ui-input):not(.ui-button) {
  /* 既存定義をここに移行 */
}
[data-size="lg"]:not([data-component="google-brand-icon"]):not(.ui-input):not(.ui-button) {
  /* 既存定義をここに移行 */
}
/* :not(.ui-input) :not(.ui-button) は念のためのカスケード防御 */
```

## C-1 / C-2: web → api proxy の env アクセス

### 現状

`apps/web/app/api/auth/magic-link/route.ts`:

```ts
const resolveApiBase = (): string => {
  const v = process.env["INTERNAL_API_BASE_URL"];
  if (v && v.length > 0) return v.replace(/\/$/, "");
  return "http://127.0.0.1:8787";
};
```

### env.ts 公開アクセサとの整合

`apps/web/src/lib/env.ts` に既存の `getAuthEnv()` / `getPublicFetchEnv()` が存在する前提。`INTERNAL_API_BASE_URL` を auth/proxy path では `getAuthEnv()` から取得する:

1. full `EnvSchema` では `INTERNAL_API_BASE_URL` は required
2. auth/proxy path の `AuthEnvSchema.partial()` では unset を許容し、local fallback `http://127.0.0.1:8787` を維持する
3. public fallback が必要な server helper は既存 `getPublicFetchEnv()` を併用する

実装時に既存 accessor を確認し、schema 追加は行わない。

### 改修後の resolveApiBase

```ts
// apps/web/app/api/auth/magic-link/route.ts
import { getAuthEnv } from "@/lib/env";

const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787";

const resolveApiBase = (): string => {
  const v = getAuthEnv().INTERNAL_API_BASE_URL;
  if (v && v.length > 0) return v.replace(/\/$/, "");
  return FALLBACK_INTERNAL_API;
};
```

`verify/route.ts` も同パターン。

### Decision

- `getAuthEnv()` は auth/internal subset を `safeParse` し、unset 時は既存 fallback `http://127.0.0.1:8787` を維持する
- full schema を必要とする path の `getEnv()` fail-closed 契約は変更しない
- production code は `process.env.INTERNAL_API_BASE_URL` を直接読まない

## D-1: プロトタイプ index.html の 404 解消

### 現状

- `docs/00-getting-started-manual/claude-design-prototype/index.html:1025-1027` で unpkg CDN に SRI integrity 付き script を 3 本ロード
- `index.html:1031-1037` で相対パス `.jsx` を 7 本 `<script type="text/babel" src="...">` でロード
- `.jsx` 7 本は同 dir に実在（`data.jsx` / `icons.jsx` / `primitives.jsx` / `pages-public.jsx` / `pages-member.jsx` / `pages-admin.jsx` / `app.jsx`）

### 404 の原因候補（優先度順）

1. `file://` で開いた場合: `fetch('data.jsx')` 等の同一オリジン制約で CORS / `net::ERR_FAILED`。本タスクでは supported path から外す
2. 簡易 HTTP server で開いた場合: `.jsx` を `application/javascript` で配信しないと `<script type="text/babel">` の babel transform 前に MIME refusal で 404 相当
3. unpkg CDN: バージョン retired / hash 更新で SRI 失敗 → 一切ロードされず白画面

### 改修

**(D-1-a) CDN 戦略の安定化**

- `unpkg.com` を `esm.sh` または `cdn.jsdelivr.net` のバージョン固定 URL に置換
- prototype は dev 専用ゆえ SRI integrity を撤去（毎回 hash メンテのコストが回らない）
- 例:

```html
<script src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.development.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.development.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.29.0/babel.min.js" crossorigin="anonymous"></script>
```

**(D-1-b) `.jsx` MIME 補正 serve スクリプト**

- `scripts/serve-prototype.sh` を新規追加（`python3 -m http.server` ベース、`.jsx → application/javascript` を `--directory` + 自前 handler で補正）
- `file://` 直接利用は unsupported とし、HTTP server 経由を唯一の受入経路にする

```bash
#!/usr/bin/env bash
# scripts/serve-prototype.sh
set -euo pipefail
PORT="${1:-5180}"
ROOT="docs/00-getting-started-manual/claude-design-prototype"
python3 - "$PORT" "$ROOT" <<'PY'
import http.server, socketserver, sys
port, root = int(sys.argv[1]), sys.argv[2]
class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".jsx": "application/javascript",
                      ".mjs": "application/javascript"}
    def __init__(self, *a, **kw): super().__init__(*a, directory=root, **kw)
print(f"prototype: http://127.0.0.1:{port}/")
with socketserver.TCPServer(("127.0.0.1", port), H) as s: s.serve_forever()
PY
```

### Decision

- SRI 撤去理由: prototype はリリース成果物ではなく開発確認用。SRI は CDN 側の hash drift で常に破綻リスクがあり、メンテコストに見合わない。
- CDN 採用順位: `jsdelivr` > `esm.sh` > `unpkg`。`jsdelivr` は UMD bundle を直接配信、`/npm/<pkg>@<ver>/<path>` で URL 構造が unpkg と同じため差し替えが最小差分。
- `.jsx` を `<script type="module">` 化しない理由: babel standalone での JSX transform を維持したい（既存 `.jsx` を書き換えない）。MIME 補正は serve スクリプト側で吸収する。

### 責務境界

| レイヤ | 責務 |
| ------ | ---- |
| `index.html` | CDN 参照（jsdelivr 固定 + SRI 撤去）+ `.jsx` ロード（変更なし） |
| `scripts/serve-prototype.sh` | `.jsx` MIME 補正 + ローカル serve |
| `.jsx` 7 本 | 既存ロジック（変更なし） |

## ステップ間 state 引き渡しテーブル（C 系）

| from | to | 引き渡し値 | 経路 |
| ---- | -- | ---------- | ---- |
| Cloudflare Workers binding | `getAuthEnv()` | `INTERNAL_API_BASE_URL` | `@opennextjs/cloudflare/getCloudflareContext()` |
| `getAuthEnv()` | `resolveApiBase()` | `string \| undefined` | direct call |
| `resolveApiBase()` | `fetch(upstream, ...)` | string URL | construct upstream URL |

## 内部型 → 公開 DTO 変換表（該当なし）

C 系は内部 helper のみ、公開 DTO 変更なし。

## ライブラリ採用

なし（全て既存依存）。

## 視覚 token 整合

A-1 で追加する `--ubm-space-4` / `--ubm-radius-md` / `--ubm-color-border-default` / `--ubm-color-text-primary` / `--ubm-color-surface-panel` / `--ubm-color-focus` または `--ubm-color-accent` は全て `apps/web/src/styles/tokens.css` 既出 token。新規追加なし。HEX 直書きなし。

## Props vs internal state（UI 系）

A-1/B-1 は純粋 CSS / 属性変更のみ。React state 変更なし。

## 既存コンポーネント再利用可否

| Component | 再利用 | 備考 |
| --------- | ------ | ---- |
| `Input` (ui/Input.tsx) | Yes | 変更不要、CSS のみ |
| `Button` (ui/Button.tsx) | Yes | 変更不要 |
| `Field` (ui/Field.tsx) | Yes | 変更不要 |
| `GoogleBrandIcon` (ui/brand-icons/GoogleBrandIcon.tsx) | Yes | 属性リネームは Decision で見送り |
| `MagicLinkForm.client.tsx` | Yes | 変更不要 |
| `GoogleOAuthButton.client.tsx` | Yes | 変更不要 |
