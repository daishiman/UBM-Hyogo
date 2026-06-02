# Phase 6 — テスト拡充（fail path / 回帰 guard / 補助コマンド）

[実装区分: implementation]

> Phase 4/5 のコアテストに対し、失敗系・境界系・回帰ガードを拡充する。
> 正本アーキテクチャは `index.md` / `phase-1.md`〜`phase-3.md` で確定済み。

---

## 6.1 OG worker 追加 fail path

ファイル: `apps/og/src/__tests__/router.spec.ts`（拡充）/ `apps/og/src/__tests__/member-source.spec.ts`（拡充）

| ケースID | シナリオ | 期待 |
|----------|----------|------|
| OG-X-1 | フォント資産が読めない（import 失敗を mock） | `renderMemberOg` が throw → router が catch して `renderDefaultOg`。default 自体も font に依存する場合はビルド時に必ず同梱されることを前提に、最終手段として「空でない PNG を返す」ことを保証（5xx を返さない） |
| OG-X-2 | API タイムアウト（fetch が AbortError / 長時間 hang を mock） | `fetchMemberSummary` が `null` 化 → default OG 200。worker はタイムアウト境界を持つ（`AbortSignal.timeout` 等、Phase 5 で配線）ことを spy で検証 |
| OG-X-3 | 不正 id（極端に長い / 記号 / パストラバーサル風 `../../etc`） | `encodeURIComponent` でエスケープされ、API へ安全に渡る。worker は 200 default（不明 member）を返す。crash しない |
| OG-X-4 | `fetchMemberSummary` が成功だが `fullName` が空文字 | `null` 相当として default OG（描画できない member 名を出さない） |
| OG-X-5 | API が `200` だが body が非 JSON / 壊れた JSON | parse 失敗を握り潰し `null` → default OG 200 |
| OG-X-6 | `occupation` のみ存在し `fullName` 欠落 | `null` → default OG（fullName 必須） |

---

## 6.2 Cache-Control / ヘッダ検証

ファイル: `apps/og/src/__tests__/router.spec.ts`（拡充）

| ケースID | 検証 | 期待 |
|----------|------|------|
| OG-H-1 | `GET /members/:id` 成功時の `Cache-Control` | `public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800` |
| OG-H-2 | default フォールバック時の `Cache-Control` | 成功時と同じ cache contract を返し、crawler preview を fail-open する |
| OG-H-3 | `Content-Type` | 常に `image/png`（成功・default 双方） |
| OG-H-4 | `/health` の `Content-Type` | `application/json` |

> キャッシュ戦略の正本値は Phase 5 §5.3 のヘッダ定義。本ケースはその回帰固定。

---

## 6.3 size gate 超過時の挙動（CI ガード）

| ケースID | 検証 | 期待 |
|----------|------|------|
| SIZE-1 | `bash scripts/check-worker-size.sh apps/og/dist` を予算 3MiB(gzip) で実行（index.js + wasm 合算） | bundle が予算内なら exit 0、超過なら **non-zero exit で CI を fail** させる（`og-cd.yml` の size gate ステップ）。実測 717KiB / 3072KiB PASS |
| SIZE-2 | web 側 size gate（既存）も #1027 後に維持 | `apps/web` bundle が next/og を含まないことで膨張しない。既存 web size gate が GREEN 継続（AC: web/og 双方 size gate） |

検証手段: CI 上の振る舞いはスクリプトの exit code に依存するため、ユニットテストではなく `og-cd.yml` のステップ設計＋ローカル実測（Phase 7）で担保する。`check-worker-size.sh` は位置引数 `$1` にディレクトリを渡すと配下 `*.js`/`*.wasm` を合算する（後方互換拡張・shellcheck PASS）。

---

## 6.4 web 回帰ガードの拡充

ファイル: `apps/web/__tests__/opennext-config-regression.spec.ts`（拡充）または `apps/web/__tests__/no-next-og.spec.ts`

| ケースID | 検証 | 期待 |
|----------|------|------|
| WEB-REG-3 | `apps/web/src` 全走査で `from "next/og"` / `import { ImageResponse }` が 0 件 | 0 件（OG は別 worker。web に動的画像生成を入れない INV-3） |
| WEB-REG-4 | `apps/web/package.json` に `@vercel/og` / OG 生成系依存が無い | 0 件 |
| WEB-REG-5 | `buildMemberOgImageUrl` は `getPublicEnv()` 経由のみで env 参照（`process.env` 直参照なし） | `apps/web/src/lib/seo/site-metadata.ts` に `process.env` 直参照が無い（env アクセサ不変条件 #11） |

---

## 6.5 env アクセサ不変条件テスト

| ケースID | 検証 | 期待 |
|----------|------|------|
| ENV-1 | `OG_IMAGE_BASE_URL` が `publicEnvSchema` に存在し optional | schema parse で未設定でも throw しない |
| ENV-2 | 不正 URL（`"not-a-url"`）を与えた場合 | `getPublicEnv()` が parse error（`.url()` 検証）。認証境界ではないので fail-closed 例外は error boundary が補足 |

---

## 6.6 補助コマンド

```bash
# OG worker fail path 含む全テスト
mise exec -- pnpm --filter @ubm-hyogo/og test

# web 回帰 + env
mise exec -- pnpm --filter web test -- opennext-config-regression site-metadata

# next/og 混入 grep（CI と同条件）
rg "next/og|ImageResponse" apps/web/src ; echo "matches above must be empty"

# size gate 手動（Phase 7 と同じ）
mise exec -- pnpm --filter @ubm-hyogo/og build
bash scripts/check-worker-size.sh apps/og/dist   # index.js + wasm 合算
```

## 6.7 DoD（Phase 6）

- fail path（フォント欠落 / タイムアウト / 不正 id / 壊れ JSON / 部分欠落）が全て default 200 へ収束することをテストで固定。
- Cache-Control / Content-Type が成功・default 双方で回帰固定されている。
- size gate が og / web 双方で機能し、超過時 CI fail することが `og-cd.yml` 設計で担保されている。
- web 回帰ガード（next/og 0 件・process.env 直参照 0 件）が GREEN。
