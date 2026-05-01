# implementation-guide — Part 1 / Part 2

## Part 1: 中学生レベルの解説

なぜ必要かを先に言うと、mock だけでは本番の D1 や Cloudflare Workers で起きる失敗を見つけられないからです。何をするかというと、本物の API と D1 を通した smoke を local と staging で確認します。

### なぜ「mock のままで OK」ではダメなのか

たとえば、学校の文化祭で売る焼きそばを想像してください。

- **mock**（偽データ）でやる練習: 厨房で「焼きそば 3 つできた」と紙に書いて先生に渡す練習。誰も本物の麺は使わない。
- **本物の binding でやる練習**: 厨房から本物の焼きそばを 1 皿、レジを通して、お客さん役の友達に渡してみる練習。

mock の練習だけで本番を迎えると、当日になって「コンロが古くて点かない」「冷蔵庫の鍵を持っている先生が休み」「皿の数が足りない」など、紙の練習では絶対に出ない問題が発生します。

UBM 兵庫支部会のサイトも同じで、

- 公開ページ（`apps/web` という看板役）
- API（`apps/api` という調理場）
- D1（`Cloudflare D1` という冷蔵庫＝会員データの倉庫）

の 3 つが本物として連携できるかを確認しないと、本番公開の日に「サイトは表示できるけど会員一覧だけ真っ白」という状態になりかねません。本タスクは「本物の倉庫 (D1) から本物の調理場 (apps/api) を通して、看板 (apps/web) に料理が出てくるか」を、自分の PC（local）と本番手前の環境（staging）で 1 回ずつ確認します。

### なぜ `scripts/cf.sh` を使うのか

調理場で使う道具のうち、`esbuild` という包丁が「グローバル用」と「プロジェクト用」でバージョンが違うと、調理開始 5 秒で「この包丁、刃の形が違うよ」と機械が止まります。`scripts/cf.sh` は「正しい包丁の場所を毎回ちゃんと教える」自動セットアップスクリプトで、これを通すと包丁問題が起きません。直接 `wrangler` を呼ぶのは、自分でいちいち包丁を選び直すことになり、忘れた瞬間に止まるので禁止しています。

### 今回作ったもの

- real Workers + D1 smoke を実行するための Phase 1-13 仕様書
- local / staging の 4 route family / 5 smoke cases を確認する curl matrix
- Phase 11 で保存する `local-curl.log` / `staging-curl.log` / `staging-screenshot.png` の evidence contract

---

## Part 2: 技術者レベルの解説

### `scripts/cf.sh` の役割（3 層）

1. **secret 動的注入**: `op run --env-file=.env` 経由で `CLOUDFLARE_API_TOKEN` 等を 1Password から揮発的に注入する。`.env` 自身に実値を書かないため AI コンテキストへの混入を防げる。
2. **esbuild path resolution**: pnpm workspace 配下の `node_modules/esbuild` と、グローバル `wrangler` 同梱の esbuild のバージョンが乖離した際に発生する `Host version "0.27.3" does not match binary version "0.21.5"` を、`ESBUILD_BINARY_PATH` で project-local バイナリを指す形で恒久解決する。
3. **mise exec ラップ**: Node 24 / pnpm 10 を `.mise.toml` に従って強制的に通すことで、CI ローカル間の Node バージョン drift を排除する。

### `PUBLIC_API_BASE_URL` 経路

```
[Browser]
  ↓ HTML/RSC
[apps/web (Next.js on Workers via @opennextjs/cloudflare)]
  ↓ fetch(`${PUBLIC_API_BASE_URL}/members`)
[apps/api (Hono on Workers)]
  ↓ env.DB.prepare("SELECT ... FROM members ...").all()
[Cloudflare D1 (binding: DB)]
```

- local: `PUBLIC_API_BASE_URL=http://localhost:8787` を `apps/web` 起動時に export し、`apps/api` を 8787 で `bash scripts/cf.sh dev --config apps/api/wrangler.toml --local` 起動する。
- staging: Cloudflare deployed vars で staging API host を指す。現状 `apps/web/wrangler.toml` には `PUBLIC_API_BASE_URL` が未定義のため補助確認に留め、`bash scripts/cf.sh` 経由で deployed vars を確認して localhost fallback していないことを確認する（AC-5）。未設定なら Phase 11 は NO-GO。

### 型定義 / evidence contract

```ts
type SmokeEnv = "local" | "staging";

interface PublicWebSmokeCase {
  env: SmokeEnv;
  route: "/" | "/members" | "/members/[id]" | "/register";
  variant?: "seeded-detail" | "unknown-detail";
  expectedStatus: 200 | 404;
  evidenceFile: "local-curl.log" | "staging-curl.log";
}

interface MembersListResponse {
  items: Array<{
    id: string;
    displayName: string;
  }>;
}
```

`MembersListResponse.items` が `/members` の正本 shape。seeded detail smoke では `.items[0].id` を使い、ログでは `<redacted>` に置換する。

### APIシグネチャ

| route family | API 経路 | 期待 |
| --- | --- | --- |
| `/` | web route が public stats / members summary を `PUBLIC_API_BASE_URL` 経由で取得 | 200 |
| `/members` | `GET /public/members` | 200 + `items.length >= 1` |
| `/members/[id]` seeded | `GET /public/members/:memberId` | 200 |
| `/members/[id]` unknown | `GET /public/members/:memberId` | 404 |
| `/register` | static route + external form link | 200 |

### 使用例

```bash
WEB=http://localhost:3000
API=http://localhost:8787/public
SEEDED_ID=$(curl -s "$API/members" | jq -r '.items[0].id // empty')
curl -s -o /dev/null -w "%{http_code}\n" "$WEB/members/$SEEDED_ID"
```

### エラーハンドリング

| ケース | 検出 | 対応 |
| --- | --- | --- |
| esbuild Host/Binary mismatch | `Host version ... does not match binary version ...` | `scripts/cf.sh` 経由の `ESBUILD_BINARY_PATH` 解決を確認 |
| D1 binding 未注入 | `/members` が 5xx | `apps/api/wrangler.toml` と D1 migration apply 状態を確認 |
| seed なし | `.items | length` が 0 | migration / seed apply を確認し、Phase 6 Case E に戻す |
| staging localhost fallback | deployed vars に `localhost` が含まれる | `PUBLIC_API_BASE_URL` を staging API URL に修正 |
| secret 混入 | evidence に token / database_id が含まれる | evidence を破棄して sanitize 後に再取得 |

### エッジケース

| ケース | 扱い |
| --- | --- |
| `/members/UNKNOWN` | 404 の異常系確認。mock でも再現できるため、実 D1 経由の主証跡にはしない |
| seed member なし | `items.length >= 1` を満たさないため NO-GO。migration / seed apply 状態を確認する |
| `apps/web/wrangler.toml` に `PUBLIC_API_BASE_URL` が無い | 現状どおり。Cloudflare deployed vars を正本として確認する |

### 設定項目と定数一覧

| 名前 | 値 / 例 | 用途 |
| --- | --- | --- |
| `PUBLIC_API_BASE_URL` | local: `http://localhost:8787` | apps/web から apps/api への接続先 |
| API dev port | `8787` | `apps/api` local Workers runtime |
| web dev port | `3000` | `apps/web` local smoke |
| evidence files | `local-curl.log`, `staging-curl.log`, `staging-screenshot.png` | Phase 11 planned evidence |
| route families | `/`, `/members`, `/members/[id]`, `/register` | smoke 対象 |
| issue reference | `Refs #273` | CLOSED issue の参照。`Closes` 禁止 |

### テスト構成

| レイヤ | 確認内容 | evidence |
| --- | --- | --- |
| local | `apps/web -> apps/api -> D1` の 4 route family / 5 smoke cases | `outputs/phase-11/evidence/local-curl.log` |
| staging | deployed vars と staging URL で同じ 5 cases | `outputs/phase-11/evidence/staging-curl.log` |
| UI補助 | staging `/members` の正常表示 1 枚 | `outputs/phase-11/evidence/staging-screenshot.png` |

### D1 binding lookup の流れ

1. `apps/api/wrangler.toml` の `[[d1_databases]]` で `binding = "DB"` / `database_name = "ubm-hyogo-db-..."` / `database_id = "..."` を env ごとに定義。
2. wrangler dev 起動時に runtime に `env.DB` として `D1Database` instance が注入される。
3. Hono handler 内で `c.env.DB.prepare(...).bind(...).all()` を呼ぶ経路に集約し、`apps/web` 側からは絶対に `D1Database` 型を import しない（不変条件 #5）。
4. local の `--local` flag は SQLite ファイルを使うため、AC-3（seed member 観測）は事前 migration / seed 適用が前提。staging では本物の D1 を直叩きする。

### smoke で検出できる「mock 不可能」領域

| 領域 | mock では検出不能な理由 |
| --- | --- |
| esbuild Host/Binary mismatch | wrangler 起動が走らないと再現しない |
| D1 binding 未配線 | `c.env.DB` が undefined のときの 5xx 経路 |
| `PUBLIC_API_BASE_URL` 未設定 | staging で localhost fallback して 503 になるパス |
| RSC fetch の Workers fetch 互換性 | Node fetch では出ない CF runtime 固有のエッジケース |

これら 4 領域を Phase 11 の 4 route family / 5 smoke cases × 2 環境で網羅的に観測する。
