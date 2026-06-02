# Phase 7 実行結果サマリ — coverage-report

対応: `phase-7.md`（カバレッジ確認 / bundle サイズ実測）

## カバレッジ対象（限定スコープ・全体一律ではない）

| ファイル | 目標 | 重点 |
|----------|------|------|
| `apps/og/src/member-source.ts`（新規） | 行/分岐 ≥ 90% | falsy ガード全分岐・404/500/例外・部分欠落 |
| `apps/og/src/index.ts`（新規） | 行 ≥ 90% / 分岐 100% | success/default/catch 3 経路・/health・404 |
| `apps/og/src/render.tsx`（新規） | 行 ≥ 80% | 正常系。wasm ロード部は smoke 代替担保（数値目標から除外明記） |
| `apps/web/.../site-metadata.ts`（差分） | `buildMemberOgImageUrl` 全分岐 | 既存関数の網羅率は不問 |
| `apps/web/.../env.ts`（差分） | 追加 schema parse | optional / 不正 URL |
| `apps/web/.../members/[id]/page.tsx`（差分） | generateMetadata og/twitter 分岐 | twitterCard / フォールバック |

## bundle サイズ実測手順（3 MiB gzip 予算）

```
pnpm --filter @ubm-hyogo/og build
bash scripts/check-worker-size.sh apps/og/dist   # index.js + wasm 合算・超過で CI fail
find apps/og/dist -type f \( -name '*.js' -o -name '*.wasm' \) -exec gzip -c {} \; | wc -c  # 参考実測（合算）
```

## 超過時のフォント subset 調整方針

1. Noto Sans JP subset 縮小（会員名で使われる文字種に限定・weight 400 単独）
2. weight 統合（bold 廃止）
3. wasm 外部資産化（Workers 制約内）
4. default OG をビルド時静的 PNG 化

> subset 縮小は豆腐化トレードオフ。Phase 6 OG-X（フォント欠落）で default fallback を検証。

## web 非膨張確認

web bundle に next/og 非混入で既存 web size gate GREEN 維持（AC: size gate web/og 双方）。

## DoD

対象限定カバレッジ達成 / OG bundle ≤ 3MiB(gzip) で size gate exit 0 / web size gate GREEN / AC-1〜9（phase-1.md）を Phase 4〜7 でカバー。
