# Phase 8 — リファクタリング

[実装区分: implementation]

Phase 4〜7 で実装した apps/og Worker・apps/web 統合・CI を、重複排除と責務明確化の観点で整理する。
**機能変更は行わず**、構造のみを改善する。navigation drift（画面遷移・導線の変更）は発生しない。

## 1. リファクタリング対象一覧

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| OG render テンプレート | named / default で JSX とスタイルが重複 | 共通レイアウト関数 `renderOgImage({ title, subtitle })` に集約し、named/default は引数違いで呼び分け | DRY。1200×630 レイアウト・フォント・ブランドフッターの単一定義化 |
| BRAND_COLORS | 各 .tsx に hex リテラル散在 | `brand-colors.ts` の `BRAND_COLORS` 定数へ集約（OKLch→sRGB 変換済み hex を 1 箇所定義） | 不変条件「色は tokens.css 由来 / HEX 直書き禁止」。色定義の単一正本化 |
| member-source 取得経路 | index.ts 内に binding/fetch 分岐が混在 | `member-source.ts` の `fetchMemberOgSource(env, id)` に抽象化し、`API_SERVICE` 優先・`PUBLIC_API_BASE_URL` fetch fallback を内部で切替 | AC-4。取得経路の切替ロジックをルータから分離し index.ts を薄く保つ |
| default 画像生成 | 失敗時・不明時で別々に default を組み立て | `renderDefaultOgImage(env)` に共通化し、404 / network error / id 不正の全分岐から同一関数を呼ぶ | AC-2。フォールバック挙動の一貫性確保 |
| フォントロード | リクエストごとに subset を読み込む実装余地 | `fonts.ts` の `loadNotoSansJp()` を module スコープで一度ロードしキャッシュ参照 | 性能。Worker 実行ごとの再ロード回避（日本語 subset） |
| env アクセサ | env を直参照する箇所が点在 | `env.ts` の zod 検証アクセサ（`getOgEnv()`）経由に統一。`API_SERVICE` / `PUBLIC_API_BASE_URL` の refine（いずれか必須）を一元化 | 不変条件「env アクセサ経由」。検証の単一化 |
| image/png レスポンス整形 | 各分岐で Response を個別生成 | `pngResponse(buffer)`（`Content-Type: image/png` + cache header）に集約 | レスポンスヘッダの一貫性。named/default/fallback で同一ヘッダ |

## 2. apps/web 統合側の整理

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| OG URL 組立 | page.tsx で URL を文字列連結する余地 | `site-metadata.ts` の `buildMemberOgImageUrl(id)` に集約し、page.tsx は呼ぶだけ | URL 組立の単一正本化。`OG_IMAGE_BASE_URL` 未設定時の default フォールバックも本関数に閉じる |
| env 参照 | — | `OG_IMAGE_BASE_URL` は `getPublicEnv()`（public schema optional）経由のみ | 不変条件「`process.env` 直接参照禁止」 |

## 3. リファクタリング非対象（意図的に触らない）

| 対象 | 理由 |
|------|------|
| 既存 API surface | 不変条件: 既存 endpoint のみ利用・変更禁止 |
| apps/web の OpenNext bundle 構成 | next/og 回帰ガードを GREEN 維持するため触らない |
| D1 / Google Form schema | スコープ外 |

## 4. リファクタリング完了基準

- [ ] OG render テンプレートが named/default で重複していない
- [ ] hex リテラルが `brand-colors.ts` 以外に存在しない
- [ ] member 取得経路の切替が `member-source.ts` に閉じている
- [ ] default 画像生成が単一関数経由
- [ ] env 参照が全てアクセサ経由（apps/og / apps/web 双方）
- [ ] リファクタリング前後で全テスト GREEN（機能不変）
- [ ] navigation drift なし（導線・遷移の変更なし）

> 詳細結果は `outputs/phase-8/refactoring.md` 参照。implemented_local_runtime_pending 時点では確定済み。
