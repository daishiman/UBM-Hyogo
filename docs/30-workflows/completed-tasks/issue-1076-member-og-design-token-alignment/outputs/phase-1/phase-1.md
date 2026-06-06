# Phase 1 — 要件定義

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## 1.1 タスク分類

| 項目 | 値 |
| --- | --- |
| タスク種別 | implementation task（UI / VISUAL_ON_EXECUTION） |
| docs-only か | いいえ。配色・レイアウト・タイポグラフィのコード変更を伴う（CONST_004 で実装仕様書と判定） |
| 対象アプリ | `apps/og`（OG 専用 Cloudflare Worker） |
| 対象外 | `apps/web` / `apps/api` / D1 / Google Form / `og-cd.yml` |

## 1.2 真の論点（要件レビュー思考法）

1. **真の論点**: OG 画像のブランド意匠が「動的 OG 機能の復活（#1027/#1084）」時に **暫定の青系 ad-hoc 配色** のまま導入され、プロダクトのデザイン正本（暖色 stone/amber の OKLch トークン）と乖離している。これを正本と整合させ、再乖離を機械的に防ぐのが主問題。
2. **依存関係・責務境界**: `apps/og` は独立デプロイの Worker で、`apps/web` の `tokens.css` を実行時に import できない（Satori は CSS custom property も `oklch()` も解決しない）。色の正本は `tokens.css`、OG はその**確定 hex のコピー**を持つ責務分担。コピーの一致は test が担保。
3. **価値とコストの不均衡**: 価値 = SNS 共有時のブランド一貫性（OG はサイト外露出の主要面）。最大コスト部品 = ランタイム A/B テスト基盤（KV/計測）。これは body AC 外なのでスコープ外に置き、価値の高い「正本整合 + 視認性 + デグレ防止」に集中。
4. **改善優先順位**: ①配色整合（正本 hex 化）→ ②レイアウト/タイポgrafィ磨き込み → ③視認性（名あり/なし）→ ④回帰ガード（ドリフト防止）→ ⑤bundle/size 不変確認。
5. **4 条件評価**: 価値性=ブランド一貫性、実現性=`apps/og` 4〜5 ファイルで 1 サイクル完結、整合性=正本 1 本化 + test ガードで責務境界が閉じる、運用性=`og-cd.yml` size gate と新規回帰 test で継続検証。

## 1.3 既存コードベースの命名規則分析（FB-01）

| 対象 | 現状の命名 | 方針 |
| --- | --- | --- |
| 色定数 | `render.tsx` の `BRAND`（オブジェクト・SCREAMING の `BRAND`） | 新規 `OG_BRAND`（`og-tokens.ts` へ移設）。役割名 key は camelCase（`surface` / `panel` / `ink` / `body` / `muted` / `line` / `accent` / `accentInk` / `accentSoft`） |
| 関数 | `buildHtml` / `tagLine` / `escapeHtml` / `renderMemberOg` / `renderDefaultOg`（camelCase） | 命名規則維持。新規 helper は `titleFontSize` / `eyebrowStyle` 等 camelCase |
| 定数 | `OG_SIZE` / `FONT_FAMILY` / `STATIC_TEXT`（SCREAMING_SNAKE） | 維持。新規 `OG_LAYOUT` / `OG_TYPO` を SCREAMING_SNAKE で追加 |
| テストファイル | `*.spec.ts`（不変条件 #8） | 新規も `*.spec.ts`。`*.test.ts` 禁止 |

## 1.4 受け入れ条件（issue body のドラフト AC を現コードへ最適化）

| AC | 内容 | 検証方法 | spec 対応 |
| --- | --- | --- | --- |
| AC-1 | OG 画像の配色を OKLch トークン正本（`tokens.css`）と整合 | `og-tokens.spec.ts` が tokens.css 正本 hex と OG 色定数の一致を assert。`render-html.spec.ts` が青系 hex 不在を assert | Phase 2 §2.2 / §2.3 |
| AC-2 | レイアウトをトークン整合（spacing / radius / 階層） | `buildHtml` 構造を `OG_LAYOUT` 由来へ。`render-html.spec.ts` が主要構造を assert | Phase 2 §2.4 |
| AC-3 | member 名あり／なし両ケースで視認性担保 | default OG / member（occupation あり）/ member（フィールド欠落でフォールバック）を `render-html.spec.ts` で網羅。`titleFontSize()` 適応サイズ | Phase 2 §2.5 / Phase 4 |
| AC-4 | `apps/og` render smoke test を更新しデグレ防止 | `render-smoke.spec.ts` が default / member 両 OG の PNG 応答を維持。`render-html.spec.ts` 拡充 | Phase 4 / Phase 6 |
| AC-5 | 意匠改善後も OG Worker bundle が Free 3MiB 上限内 | `pnpm --filter @ubm-hyogo/og build` 後 `bash scripts/check-worker-size.sh apps/og/dist`。font は runtime fetch のまま bundle しない | Phase 5 / Phase 9 / Phase 10 |
| AC-6 | 既存機能（fallback PNG / member fetch / router）非回帰 | 既存 `router.spec.ts` / `member-source.spec.ts` / `render-smoke.spec.ts` 全 PASS 維持 | Phase 6 / Phase 7 |
| AC-7 | typecheck / lint 緑 | `pnpm typecheck` / `pnpm lint` | Phase 9 |

## 1.5 スコープ（CONST_007: 1 サイクル完了）

### 含む（今サイクル）
- `apps/og/src/og-tokens.ts` 新規（色 / レイアウト / タイポグラフィ定数 + `titleFontSize`）
- `apps/og/src/render.tsx` 編集（`BRAND` 置換・`buildHtml` 磨き込み）
- `apps/og/src/__tests__/og-tokens.spec.ts` 新規（正本一致回帰ガード）
- `apps/og/src/__tests__/render-html.spec.ts` 編集（整合・視認性 assert）
- `apps/og/src/__tests__/render-smoke.spec.ts` 編集（デグレ防止）

### 含まない（スコープ外・理由明記）
| 項目 | 理由 | 実施時期/場所 |
| --- | --- | --- |
| ランタイム A/B テスト基盤（2 意匠出し分け + 計測） | body AC 外。KV/計測追加は Free 枠コスト増・独立大規模スコープ。ユーザー確認済みで「単一意匠磨き込み」に確定 | 必要時に別 Issue |
| serif 見出しフォント（Noto Serif JP）の追加 bundle/fetch | font 追加は OG レイテンシ/複雑性増。今回は Noto Sans JP 400/700 の weight/size/tracking で階層表現 | 必要時に別 Issue（未タスク候補） |
| `apps/web` の OG メタタグ参照側変更 | OG 画像 URL surface は #1084 で確立済・本タスクは画像意匠のみ | 不要 |

> 分割は行わない（単一 PR・単一サイクルで完結）。上記スコープ外は「先送り」ではなく本タスクの目的（意匠整合）に不要なため除外。

## 1.6 carry-over 確認（直前タスク棚卸し）

`git log --oneline -5` の直近は #1100/#1082/#1095/#1086/#1073。いずれも本タスク（`apps/og` 意匠）と独立。`apps/og` の唯一の先行は #1084（OG Worker 分離・本タスクが整合対象とする実装本体）。

## 1.7 前提条件・依存

| 前提 | 状態 |
| --- | --- |
| `apps/og` Worker が存在し OG を生成する | 充足（#1084 landed） |
| `tokens.css` に確定 hex（`:root` + `@supports` フォールバック）が存在 | 充足（`apps/web/src/styles/tokens.css:6-167`） |
| `workers-og` の `ImageResponse` / `loadGoogleFont` が利用可能 | 充足（既存 `render.tsx` 利用中） |
| Satori の色解釈制約（`oklch()` 非対応 → hex 必須） | 設計前提として固定（§Phase 2 で根拠） |
