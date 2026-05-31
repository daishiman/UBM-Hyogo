# Phase 2: 設計

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
|------|-----|
| workflow 名 | `web-worker-size-limit-fix` |
| 入力 | `phase-1-requirements.md`（AC-1〜AC-6 / Task A・B 分割 / Step0 P50 実在確認） |
| 出力 | target topology・lane 設計・validation matrix・解決アプローチ評価・dependency matrix |
| lane 数 | **2**（lane-A=OG 撤去 / lane-B=minify + CI size gate） |
| taskType | `implementation` / `NON_VISUAL` |
| 状態 | `implemented_local_evidence_captured` |

## 目的

Phase 1 で確定した「gzip 3316KiB → 3072KiB 未満」要件を、編集ファイルが競合しない
並列 2 lane へ落とし込み、各 lane の target topology・検証コマンド・依存順序を確定する。
size gate（lane-B）の green 判定は wasm 撤去（lane-A）完了後に行う依存関係を明示する。

## 実行タスク

### concern 別 target topology

#### Task A（lane-A）: OG 撤去 + 静的 OG フォールバック

| target パス | 操作 | 設計内容 |
|------------|------|---------|
| `apps/web/app/opengraph-image.tsx` | 削除 | root OG dynamic route を削除。OG メタは static PNG に委譲 |
| `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` | 削除 | member 動的 OG route を削除。member メタも汎用 OG へフォールバック |
| `apps/web/public/og-default.png` | 新規 | 1200×630 静的 PNG。`public/` ディレクトリ新設。OKLch ブランドカラー基調（HEX 直書き禁止のため画像生成側で色決定。コード上に HEX を書かない） |
| `apps/web/src/lib/seo/site-metadata.ts` | 編集 | `SITE.ogImagePath`（L10）を `"/opengraph-image"` → `"/og-default.png"`。`buildBaseMetadata` / `buildPageMetadata` / `PageMetaInput` の **契約は不変**（`ogImagePath` を 1 箇所変更するだけで両 helper に波及） |
| `apps/web/app/(public)/members/[id]/page.tsx` | 編集 | `generateMetadata`（L68）内の `ogImage: \`/members/${...}/opengraph-image\``（L100）オーバーライドを削除 → `buildPageMetadata` の汎用 OG（`SITE.ogImagePath`）にフォールバック |
| `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx` | 削除 | 対象 route 削除に伴う spec 削除（`vi.mock("next/og")` 含む） |
| `apps/web/playwright/tests/public-metadata.spec.ts` | 編集 | `og:image` 期待値を `/og-default.png` を含む絶対 URL へ更新 |

#### Task B（lane-B）: minify + CI size gate

| target パス | 操作 | 設計内容 |
|------------|------|---------|
| `apps/web/open-next.config.ts` | 確認のみ | OpenNext v1.19.4 に `minify` config key がないことを型定義で確認済み。無効な設定を追加せず、`buildCommand` は維持 |
| `scripts/check-worker-size.sh` | 新規 | gzip 計測 gate。閾値 3072KiB 超過 = exit1 / warn 2800KiB（exit0 で警告）。計測ソースは OpenNext 出力の worker/handler 群合算。`WORKER_SIZE_OVERRIDE_KIB` で閾値分岐を再現 |
| `.github/workflows/web-cd.yml` | 編集 | staging（`deploy-staging`）/ production（`deploy-production`）両 job の **Build step と Deploy step の間**に size gate step を挿入 |
| `apps/web/__tests__/opennext-config-regression.spec.ts` | 編集 | (1) `open-next.config.ts` の production minify 維持 assert、(2) `apps/web/app` / `apps/web/src` に `next/og` 参照 0 件 assert を追加 |

#### `check-worker-size.sh` 計測ソース設計

1. **第一候補**: `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env <env> --dry-run` の出力から gzip サイズ行をパースする。
2. **フォールバック**: dry-run 出力が取得できない場合、`.open-next` 配下の worker bundle を `gzip -c | wc -c` で合算計測する。

> いずれも `wrangler` 直接呼び出しは禁止（不変条件）。dry-run は `scripts/cf.sh` 経由。

### lane 数: 2

| lane | concern | 責務境界 |
|------|---------|---------|
| lane-A | OG 撤去 | dynamic OG route 削除 + metadata helper の `og:image` 切替。bundle から wasm/font を消す主因 |
| lane-B | production minify 維持 + size gate | OpenNext debug 有効化禁止 guard + 計測 gate 新設 + workflow 配線 + regression assert。再発防止の安全網 |

## 参照資料

| 種別 | パス |
|------|------|
| 入力仕様 | `phase-1-requirements.md` |
| 無料構成正本 | `docs/00-getting-started-manual/specs/08-free-database.md` |
| Worker bundle size ガード | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` |

## 実行手順

1. target topology 表（Task A / Task B）を確定する。
2. validation matrix を実在コマンドのみで定義する。
3. 解決アプローチ評価表で採用（A/B/C）・却下（D/E/F）を確定する。
4. dependency matrix で owner・編集ファイル重複・依存順序を確定する。
5. Phase 3（設計レビュー）で PASS 判定を得てから Phase 4 へ進む。

## validation matrix（実在コマンドのみ）

| ID | 検証コマンド | 対応 AC | lane |
|----|-------------|---------|------|
| V-1 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | AC-3,5 | A/B |
| V-2 | `mise exec -- pnpm lint` | 全 | A/B |
| V-3 | `mise exec -- pnpm --filter @ubm-hyogo/web test` | AC-3,5 | A/B |
| V-4 | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | AC-1,6 | A/B |
| V-5 | `bash scripts/check-worker-size.sh` | AC-1,4 | B |
| V-6 | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | AC-1,4 | B |
| V-7 | `rg -n "next/og\|ImageResponse" apps/web/app apps/web/src` → 0 件 | AC-5 | A |
| V-8 | `find apps/web/.open-next -name 'resvg.wasm' -o -name 'yoga.wasm'` → 0 件 | AC-6 | A |
| V-9 | `bash scripts/coverage-guard.sh` exit0 | 全 | A/B |

## 解決アプローチ評価表

### 採用

| 案 | 内容 | 役割 | 採用理由 |
|----|------|------|---------|
| **A** | `next/og` 撤去（静的 PNG + metadata フォールバック） | **主軸** | wasm/font ~1539KB を bundle から消す最大効果。使用 2 箇所のみで影響局所。gzip 700KB+ 削減で 3MiB 以下到達 |
| **B** | production 既定 minify の維持 + debug 有効化禁止 | 補助 | OpenNext v1.19.4 では `minify` config key がないため、無効な設定追加を避けつつ `OPEN_NEXT_DEBUG` / `debug:true` の回帰を防ぐ |
| **C** | `check-worker-size.sh` + `web-cd.yml` size gate | 安全網 | サイズ超過を deploy 前に CI で検知（AC-4）。再発防止 |

### 却下

| 案 | 内容 | 却下理由 |
|----|------|---------|
| **D** | wasm を external 化（worker bundle から除外し外部ロード） | `next/og` 内部の compiled module に wasm が埋め込まれており external 化が困難・脆い。Next.js 内部実装変更で容易に壊れる |
| **E** | Sentry 全撤去 | A だけで 3MiB 以下に到達するため不要。観測性が低下するデメリットが大きい。**条件付き contingency のみ**（A+B 後も超過する場合の最終手段の一歩手前） |
| **F** | Cloudflare Workers Paid プラン移行 | 無料構成方針（`08-free-database.md`）に明確に反する。**最終手段**として位置づけ、本タスクでは採らない |

## dependency matrix

| 項目 | lane-A（Task A） | lane-B（Task B） |
|------|-----------------|-----------------|
| owner（編集ファイル） | `app/opengraph-image.tsx`（削除）/ `app/(public)/members/[id]/opengraph-image/route.tsx`（削除）/ `public/og-default.png`（新規）/ `src/lib/seo/site-metadata.ts` / `app/(public)/members/[id]/page.tsx` / member opengraph spec（削除）/ `playwright/tests/public-metadata.spec.ts` | `scripts/check-worker-size.sh`（新規）/ `.github/workflows/web-cd.yml` / `apps/web/__tests__/opennext-config-regression.spec.ts` |
| 担当領域 | app / OG / metadata / test | size gate / web-cd.yml / regression spec |
| 編集ファイル重複 | **なし**（lane-A と lane-B は disjoint） | **なし** |
| 並列可否 | **並列可**（重複ファイルなし） | **並列可** |
| 依存順序 | 独立着手可 | コード編集は独立だが、**size gate の green 判定（V-5/V-6）は Task A 完了後**（wasm 撤去後の bundle を計測してはじめて 3072KiB 以下を確認できる） |

### ステップ間 state 引き渡し（lane 間）

| from | to | 引き渡し項目 | タイミング |
|------|----|-----------|-----------|
| lane-A | lane-B | wasm 撤去後の `.open-next` bundle（size gate 計測対象） | lane-A の `build:cloudflare` 成功後に lane-B の `check-worker-size.sh` を green 判定 |
| lane-B | lane-A | （なし。lane-B の minify は lane-A 出力に依存しない・追加削減のみ） | — |

## 統合テスト連携

本実装サイクル で以下が走る（本 Phase は設計のみ）:

- vitest: regression spec（minify assert + `next/og` 0 件 assert）= V-3 の一部
- Playwright: `public-metadata.spec.ts`（`og:image` 検証）= AC-3
- regression grep/find: V-7 / V-8
- size gate: V-5 / V-6（CI 統合は `web-cd.yml`）
- `coverage-guard.sh`: V-9

## 多角的チェック観点（AIが判断）

| 系統 | 観点 |
|------|------|
| システム系 | バランスループ: bundle 増 → size gate fail → deploy block（再発防止の負帰還）。強化ループ: 機能追加で依存増 → bundle 増。size gate は強化ループに対する抑制弁。状態所有権: 計測閾値は `check-worker-size.sh` に単一所有、CI 配線は `web-cd.yml` に閉じる |
| 戦略・価値系 | 初回価値=deploy 成功 + 無料維持。最大コスト部品=静的 PNG 設計（A）だが影響局所。E/F は将来層として分離（初回は採らない） |
| 問題解決系 | KJ 法クラスタ: {削減=A,B} / {検知=C} / {却下=D,E,F}。優先順位 A > C > B。dry-run 計測の透過性は Phase 4 で実測確認 |

## サブタスク管理

| サブタスク | lane | 並列 | green 判定依存 |
|-----------|------|------|---------------|
| OG 撤去 + metadata 切替 | lane-A | ✅ | — |
| 静的 PNG 作成 | lane-A | ✅ | — |
| production minify debug 禁止 guard + regression assert | lane-B | ✅ | — |
| size gate 新設 + workflow 配線 | lane-B | ✅ | size gate green は lane-A 完了後 |

## 成果物

- 本 Phase: `phase-2-design.md`（本ファイル）

## 完了条件

- [ ] Task A / Task B の target topology 表を実在パスで確定した
- [ ] lane 数=2、編集ファイル重複なし（disjoint）を確認した
- [ ] validation matrix を実在コマンドのみ（V-1〜V-9）で定義した
- [ ] 解決アプローチ評価表で採用（A/B/C）・却下（D/E/F）を確定した
- [ ] dependency matrix で owner 列・並列可否・size gate green 判定の依存順序を明記した
- [ ] `check-worker-size.sh` の 2 段フォールバック計測ソースを設計した
- [ ] OpenNext v1.19.4 に `minify` config key がないため無効な設定を追加しない旨を記した

## タスク100%実行確認【必須】

- [ ] lane-A の 7 target・lane-B の 4 target を topology 表に列挙した
- [ ] `site-metadata.ts` の `ogImagePath` 1 箇所変更で両 helper 契約不変であることを設計した
- [ ] member `page.tsx` L100 の `ogImage` オーバーライド削除 → 汎用 OG フォールバックを設計した
- [ ] size gate を `web-cd.yml` の Build step と Deploy step の間に挿入する設計を明記した
- [ ] wrangler 直接呼び出し禁止（`cf.sh` 経由 dry-run）を計測設計に反映した
- [ ] 全完了条件チェックリストを満たした

## 次Phase

[phase-3-design-review.md](phase-3-design-review.md) — 本設計の PASS/MINOR/MAJOR 判定、simpler alternative 検討、Phase 4 開始条件と Phase 13 blocked 条件を固定する。
