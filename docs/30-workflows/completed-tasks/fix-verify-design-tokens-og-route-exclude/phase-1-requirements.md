[実装区分: 実装仕様書]

# Phase 1 — 要件定義

## 1.1 背景

- PR [#175](https://github.com/daishiman/UBM-Hyogo/pull/175)（`feat(issue-277): Next.js proxy migration`）で `verify-design-tokens / verify-design-tokens` GitHub Actions job が fail している。
- 直近の親コミット `c10e0e39a feat(issue-806): dynamic member OG image route (#848)`（2026-05-20 merge）で追加された `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` の 41-42 行に HEX literal が含まれることが直接原因。
- 該当ファイルは `next/og` の `ImageResponse` で 1200×630 PNG を生成する route handler。satori レンダラは CSS variable (`var(--ubm-color-*)`) を解決しないため、color 値は HEX/RGB literal で記述する必要がある。

## 1.2 ゴール

| # | ゴール | 検証方法 |
|---|--------|---------|
| G1 | `mise exec -- pnpm verify:tokens` が exit 0 で完了する | ローカル CLI |
| G2 | PR #175 の `verify-design-tokens` job が success に転じる | GitHub Actions |
| G3 | 他の HEX literal drift（汎用 component / route）は引き続き検出される | exclude pattern が route handler convention にのみ限定されていることを Phase 3 review で確認 |
| G4 | OKLch token 正本化方針（CLAUDE.md 不変条件 §2）は維持される | `tokens.css` / `design-tokens.md` に変更なし |

## 1.3 非ゴール

- `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` のリファクタ / 色変更。
- design token 仕様の改訂・追加。
- 他 verify gate（`verify:phase12-compliance` / `verify-indexes-up-to-date` 等）の変更。
- HEX → OKLch literal 置換による回避（Phase 3 で代替案として却下根拠を記述）。

## 1.4 スコープ in / out

| 区分 | 対象 |
|------|------|
| in | `scripts/verify-design-tokens.ts` の `colorLiteralExcludes` 配列拡張 |
| in | `scripts/verify-design-tokens.spec.ts` への unit test 追加（既存ファイルに追記） |
| out | `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` 本体 |
| out | `apps/web/src/styles/tokens.css` / `apps/web/src/styles/globals.css` |
| out | `docs/00-getting-started-manual/specs/09b-design-tokens.md` |

## 1.5 不変条件

1. **OKLch token 正本化**（CLAUDE.md 不変条件 §2）: HEX 直書き / `bg-[#xxx]` 形式は汎用コードでは引き続き禁止。今回の例外は **next/og satori 配下のみ** に限定する。
2. **既存 exclude 設計意図との整合**: `colorLiteralExcludes` に既存登録されている `opengraph-image.tsx` / `twitter-image.tsx` / `icon.tsx` / `apple-icon.tsx`（Next.js App Router の file convention）と同一の satori 制約を、route handler convention (`*/route.tsx`) にも対称適用する。
3. **false positive のみを除去**: drift script の本来の検出力（汎用コードの HEX 直書き検知）は維持する。

## 1.6 参照

- PR: [#175](https://github.com/daishiman/UBM-Hyogo/pull/175)
- Issue: [#806](https://github.com/daishiman/UBM-Hyogo/issues/806)
- 親仕様書: `docs/30-workflows/issue-806-dynamic-member-og-image/index.md`（不変条件 §2 で satori が CSS variable を解決しないことを明記）
- CLAUDE.md「不変条件 §2 OKLch トークン正本化」「task-09 / task-08 / task-18」セクション
- 既存 script: `scripts/verify-design-tokens.ts` line 61-66, 486-500
- Next.js App Router file conventions: <https://nextjs.org/docs/app/api-reference/file-conventions/metadata>
