# Phase 8: リファクタリング判断

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `web-worker-size-limit-fix` |
| phase | 8（リファクタ） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | `implemented_local_evidence_captured`（本サイクルはローカル実装済み。コード実装は後続） |
| 作成日 | 2026-05-29 |
| 依存 | phase-5（実装手順） / phase-6（テスト追加） / phase-7（カバレッジ） |

## 目的

Task A（`next/og` 撤去 → 静的 OG）本実装で発生する metadata 配線の重複を除去し、`next/og` 撤去で OG 画像参照が **`site-metadata.ts` の `SITE.ogImagePath` 単一参照** に集約された DRY 状態を確認する。Task B は `scripts/check-worker-size.sh` と CI 配線に閉じ、OpenNext v1.19.4 に存在しない `minify` config を追加しない。新規 primitive・新規 util は増やさない（撤去がスコープのため抽象化候補は発生しない想定）。

## 実行タスク

| # | リファクタ候補 | 既定判定 | 理由 |
| --- | --- | --- | --- |
| 8-1 | OG 画像 path の単一参照化（`SITE.ogImagePath`） | **実施（必須）** | root metadata と member `generateMetadata` の双方が同一の静的 OG path を参照する。両者が `SITE.ogImagePath` を経由し、リテラル `/og-default.png` の直書きが 2 箇所以上に散らないことを担保する |
| 8-2 | `opengraph-image.tsx` / `route.tsx` の dead code 残存確認 | **実施（必須）** | `next/og`（`ImageResponse`）の import / 動的 OG generation 関数が完全に削除され、参照されない残骸（未使用 import・コメントアウト）が残らないことを確認する |
| 8-3 | member `page.tsx` の `generateMetadata` 整理 | **実施（必須）** | L100 の動的 OG 配線削除後、`openGraph.images` が `SITE.ogImagePath` 経由の静的参照に一本化され、member 固有の動的 image 生成ロジック残骸がないことを確認する |
| 8-4 | OG 用 metadata helper の新規抽出 | **見送り** | 参照箇所が root + member の 2 箇所のみ。`SITE.ogImagePath` という既存定数で DRY を満たすため、新規 helper / primitive を生やさない（CONST: 新規 primitive 抑制） |
| 8-5 | `check-worker-size.sh` の共通シェル util 化 | **見送り** | size gate スクリプトは単一用途（gzip 計測 + 閾値判定）。現時点で他スクリプトと共有しないため、抽出せず単一ファイルに閉じる |

## 参照資料

- `phase-2-design.md`（OG 撤去後の metadata 配線設計）
- `phase-5-implementation.md`（Task A / Task B 実装手順）
- `apps/web/src/lib/seo/site-metadata.ts`（`SITE.ogImagePath` 正本）
- `apps/web/open-next.config.ts`（確認のみ。変更なし）
- `docs/00-getting-started-manual/specs/08-free-database.md`（無料構成制約）

## 実行手順

1. Task A 実装完了後、`rg -n "/og-default.png" apps/web/app apps/web/src` を実行し、リテラル参照が `site-metadata.ts` の `SITE.ogImagePath` 定義 1 箇所に集約されていることを確認する。`app/` 配下の page / layout / route から直書きリテラルが消えていること。
2. `rg -n "next/og|ImageResponse" apps/web/app apps/web/src` で **0 件** を確認する（dead code / 未使用 import 残存なし）。
3. member `app/(public)/members/[id]/page.tsx` の `generateMetadata` を確認し、`openGraph.images` が `SITE.ogImagePath` 経由の静的参照のみであることを確認する（L100 動的 OG 配線が完全除去）。
4. `open-next.config.ts` に無効な `minify` config が追加されておらず、`OPEN_NEXT_DEBUG` / `debug: true` が混入していないことを確認する。
5. 重複・新規 primitive・新規 util が発生していないことを確認する（抽出候補は 8-4 / 8-5 ともに見送り）。

## 統合テスト連携

- Task A の DRY 確認は `apps/web/playwright/tests/public-metadata.spec.ts`（OG meta tag が静的 path を指す）と連動する。リファクタ後も同 spec が green であることを phase-9 の test ゲートで担保する。
- Task B の production 既定 minify 維持は `apps/web/__tests__/opennext-config-regression.spec.ts` が `OPEN_NEXT_DEBUG` / `debug: true` の不在を assert する。リファクタで無効な設定が混入しないことを同 spec で固定する。
- 統合テスト本体の実行・PASS 判定は phase-9（QA）／phase-11（手動テスト）で行う。

## 多角的チェック観点（AIが判断）

- **DRY**: OG path リテラルが `SITE.ogImagePath` 1 箇所に集約されているか。
- **dead code**: `next/og` / `ImageResponse` の import・関数・型参照が完全に消えているか（grep 0 件）。
- **YAGNI**: 参照 2 箇所のため OG metadata helper を新規抽出しない判断が妥当か。
- **単一責務**: `check-worker-size.sh` が size 計測のみに閉じ、deploy ロジックを巻き込んでいないか。
- **不変条件遵守**: 新規 primitive を生やしていないか／env は `apps/web/src/lib/env.ts` 経由か。

## サブタスク管理

| サブタスク | 対象 | 状態 |
| --- | --- | --- |
| 8-1 OG path 単一参照化確認 | `site-metadata.ts` / root metadata / member metadata | `implemented_local_evidence_captured` |
| 8-2 dead code 残存確認 | `opengraph-image.tsx`(削除) / `route.tsx`(削除) | `implemented_local_evidence_captured` |
| 8-3 member generateMetadata 整理確認 | `members/[id]/page.tsx` | `implemented_local_evidence_captured` |
| 8-4 OG metadata helper 抽出 | （見送り） | `implemented_local_evidence_captured` |
| 8-5 size gate util 化 | （見送り） | `implemented_local_evidence_captured` |

## 成果物

- 本ファイル `phase-8-refactor.md`（リファクタ判定の正本）
- リファクタ実施は本実装サイクルで適用（本サイクルは spec のみ）

## 完了条件

- [ ] OG 画像 path が `SITE.ogImagePath` 単一参照に集約されている（リテラル直書き 0 箇所）
- [ ] `rg -n "next/og|ImageResponse" apps/web/app apps/web/src` が 0 件
- [ ] member `generateMetadata` が静的 OG 参照に一本化されている
- [ ] `open-next.config.ts` に無効な `minify` config や debug 有効化が混入していない
- [ ] 新規 primitive / 新規 util を増やしていない（8-4 / 8-5 見送り判定が維持されている）

## タスク100%実行確認【必須】

- [ ] phase-8 のリファクタ判定 5 項目をすべて記録した
- [ ] 実施 3 項目（8-1/8-2/8-3）と見送り 2 項目（8-4/8-5）の判定理由を明示した
- [ ] DRY / dead code / YAGNI / 単一責務 / 不変条件の 5 観点を網羅した
- [ ] 統合テスト連携（public-metadata.spec / opennext-config-regression.spec）を残した
- [ ] 成果物・完了条件・次Phase を記載した

## 次Phase

phase-9（QA）: typecheck / lint / test / build:cloudflare の全 green と Worker size 計測・grep 検証へ進む。
