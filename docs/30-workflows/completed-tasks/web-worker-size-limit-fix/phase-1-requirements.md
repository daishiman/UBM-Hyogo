# Phase 1: 要件定義

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
|------|-----|
| workflow 名 | `web-worker-size-limit-fix` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL`（OG 画像はメタ出力契約であり UI 画面変更を伴わない。bundle サイズ・SEO メタ・CI gate が対象） |
| implementation_mode | `"new"`（新規実装。RED/GREEN サイクルで進める。ただし Task B の regression spec は既存 `opennext-config-regression.spec.ts` 拡張） |
| 対象アプリ | `apps/web`（Cloudflare Workers + Next.js via `@opennextjs/cloudflare`） |
| 想定本実装サイクル | feature ブランチ → `dev`（staging）→ `main`（production） |
| 状態 | `implemented_local_evidence_captured`（ローカル実装済み。external ops は user-gated）。commit / push / PR / staging deploy は user-gated |

### Phase 4 進行ゲート（必須）

> **Phase 1〜3 の設計レビューが完了するまで Phase 4（テスト作成）へ進まない。**
> 本タスクは bundle サイズ・transport 仕様・CI gate に跨る並列 2 lane 設計のため、
> Phase 3 の PASS 判定（Task A=OG 撤去 / Task B=production minify 維持 + size gate の責務境界確定）を
> 待たずに実装着手するとファイル編集の競合・size gate の偽陰性を誘発する。

## 目的

`apps/web` の Cloudflare Workers bundle が **gzip 後 3316KiB** に達し、無料プラン
（Workers free: 圧縮後 3MiB = 3072KiB 上限）の制限を超過して staging/production deploy が
size 超過で失敗するリスクがある。本タスクは **gzip 3316KiB → 3072KiB 未満**（試算 ~2.5MiB）へ
削減し、無料構成（`docs/00-getting-started-manual/specs/08-free-database.md`）を維持したまま
deploy を成功させ、超過を CI で事前検知できる状態にする。

### 根本原因（共有コンテキスト）

`next/og`（`@vercel/og`）の `ImageResponse` が以下の wasm/font binary を worker bundle に焼き込む:

| binary | サイズ |
|--------|--------|
| `resvg.wasm` | 1346KB |
| `yoga.wasm` | 70KB |
| `Geist-Regular.ttf.bin` | 123KB |
| 合計 | **~1539KB** |

使用箇所は **2 箇所のみ**（root OG / member 動的 OG）。`next/og` を撤去して静的 PNG +
metadata フォールバックへ切り替えることで gzip 後 **700KB+ 削減**が見込め、3MiB 以下に収まる。

## 実行タスク

本 workflow は単一責務原則で 2 つの concern（lane）に分割する。

### Task A: OG 撤去（`next/og` 依存除去 + 静的 OG フォールバック）

`next/og` の `ImageResponse` 使用 2 箇所を削除し、静的 PNG（`/og-default.png`）を
metadata の `og:image` として配信する形へ切り替える。member 動的 OG（氏名・職業の焼き込み）は
汎用 OG へフォールバックする（MVP では SEO 上の汎用 OG で十分）。

### Task B: production minify 維持 + CI size gate

OpenNext production minify の既定を維持し、`scripts/check-worker-size.sh` で
gzip サイズを計測する gate を新設、`.github/workflows/web-cd.yml` の deploy 前段に組み込む。
regression spec に production minify 維持・`next/og` 参照 0 件の assert を追加する。

## 参照資料

### 正本参照

| 種別 | パス |
|------|------|
| 無料構成正本 | `docs/00-getting-started-manual/specs/08-free-database.md` |
| Worker bundle size ガード | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md` |
| env アクセス不変条件 | `CLAUDE.md`「`apps/web` env アクセス不変条件」 |
| Cloudflare CLI ルール | `CLAUDE.md`「Cloudflare 系 CLI 実行ルール」（`scripts/cf.sh` 経由のみ） |

### Step0 P50: 対象ファイル実在確認（git/grep 検証済み）

> 検証コマンド: `ls -la <path>` / `grep -rn "next/og|ImageResponse" apps/web/app apps/web/src` / `grep -n "@opennextjs/cloudflare" apps/web/package.json`

#### Task A 対象（実在検証済み）

| パス | 現状 | 検証結果 | 本タスクでの操作 |
|------|------|---------|-----------------|
| `apps/web/app/opengraph-image.tsx` | 存在（998B, `next/og` import L1, `ImageResponse` L12） | ✅ 実在 | 削除（root OG を静的テキスト/PNG 化） |
| `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` | 存在（2389B, `next/og` L1, `ImageResponse` L38, `fetchPublicOrNotFound` で氏名/職業反映 L24/35/36） | ✅ 実在 | 削除（member 動的 OG → 汎用 OG フォールバック） |
| `apps/web/public/og-default.png` | 不在（`apps/web/public/` ディレクトリ自体が現状なし） | ✅ 不在確認 | 新規作成（1200×630 静的 PNG） |
| `apps/web/src/lib/seo/site-metadata.ts` | 存在（2924B, `SITE.ogImagePath = "/opengraph-image"` L10） | ✅ 実在 | `ogImagePath` を `"/og-default.png"` へ変更。`buildBaseMetadata` / `buildPageMetadata` / `PageMetaInput` 契約は不変 |
| `apps/web/app/(public)/members/[id]/page.tsx` | 存在（4410B, `generateMetadata` L68, `ogImage` オーバーライド L100 `ogImage: \`/members/${...}/opengraph-image\``） | ✅ 実在 | L100 の `ogImage` オーバーライド削除 → 汎用 OG フォールバック |
| `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx` | 存在（`vi.mock("next/og")` L17） | ✅ 実在 | 削除（対象 route 削除に伴う） |
| `apps/web/playwright/tests/public-metadata.spec.ts` | 存在（OG メタ参照） | ✅ 実在 | `og:image` 期待値を `/og-default.png` 系へ更新 |

#### Task B 対象（実在検証済み）

| パス | 現状 | 検証結果 | 本タスクでの操作 |
|------|------|---------|-----------------|
| `apps/web/open-next.config.ts` | 存在（215B, 7 行。`defineCloudflareConfig()` spread + `buildCommand`） | ✅ 実在 | 変更なし。OpenNext v1.19.4 に `minify` config key がないことを型定義で確認し、無効な設定を追加しない |
| `scripts/check-worker-size.sh` | 不在 | ✅ 不在確認 | 新規作成（gzip 計測。閾値 3072KiB 超過で exit1 / warn 2800KiB） |
| `.github/workflows/web-cd.yml` | 存在（12789B, staging `deploy-staging` / production `deploy-production` 2 job。Build step L32-43 / L174-185、Deploy step L48-59 / L190-201） | ✅ 実在 | Build step と Deploy step の間に size gate step を staging/production 両 job に挿入 |
| `apps/web/__tests__/opennext-config-regression.spec.ts` | 存在（3310B, 101 行 vitest。wrangler.toml 等の regression guard） | ✅ 実在 | production minify 維持 assert + `next/og` 参照 0 件 assert を追加 |

#### 周辺事実（実在検証済み）

| 項目 | 検証結果 |
|------|---------|
| `@opennextjs/cloudflare` version | `1.19.4`（`apps/web/package.json` L34） |
| `build:cloudflare` script | `NODE_ENV=production opennextjs-cloudflare build && node ../../scripts/patch-open-next-worker.mjs`（package.json L8） |
| `scripts/cf.sh` | 存在（13331B, 実行可能） |
| `scripts/coverage-guard.sh` | 存在（12717B, 実行可能） |
| `apps/web/.assetsignore` | 存在（62B） |
| `next/og` / `ImageResponse` 参照 | 実装 2 箇所 + member spec 1 箇所 + playwright public-metadata.spec.ts |

### パストポロジ検証表（実在パス）

| topology | 対象パス | 種別 | 実在 |
|----------|---------|------|------|
| OG entry (root) | `apps/web/app/opengraph-image.tsx` | 削除 | ✅ |
| OG entry (member) | `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` | 削除 | ✅ |
| static asset | `apps/web/public/og-default.png` | 新規 | ✅（不在確認） |
| metadata helper | `apps/web/src/lib/seo/site-metadata.ts` | 編集 | ✅ |
| member metadata | `apps/web/app/(public)/members/[id]/page.tsx` | 編集 | ✅ |
| build config | `apps/web/open-next.config.ts` | 確認のみ | ✅ |
| size gate | `scripts/check-worker-size.sh` | 新規 | ✅（不在確認） |
| CD workflow | `.github/workflows/web-cd.yml` | 編集 | ✅ |
| regression spec | `apps/web/__tests__/opennext-config-regression.spec.ts` | 編集 | ✅ |

## 実行手順

1. Step0 P50（本 Phase で完了）: 上記 9 パスの実在を `ls` / `grep` で確定する。
2. Phase 2（設計）: Task A / Task B の target topology・lane・validation matrix・解決アプローチ評価・dependency matrix を確定する。
3. Phase 3（設計レビュー）: PASS/MINOR/MAJOR 判定と Phase 4 開始条件を固定する。
4. Phase 4 以降（本実装サイクル）: テスト作成 → 実装 → 計測 → CI gate 連携を行う。

## 統合テスト連携

本 Phase（1）は要件確定のみで、テスト・実装は本実装サイクル が担う。本実装サイクル では以下が走る:

- vitest: `apps/web/__tests__/opennext-config-regression.spec.ts`（production minify 維持 / `next/og` 参照 0 件 assert）
- Playwright: `apps/web/playwright/tests/public-metadata.spec.ts`（`og:image` メタが有効値を返すか）
- regression（grep/find）: `rg -n "next/og|ImageResponse" apps/web/app apps/web/src` → 0 件 / `find apps/web/.open-next -name 'resvg.wasm' -o -name 'yoga.wasm'` → 0 件
- size gate: `bash scripts/check-worker-size.sh`（gzip ≤ 3072KiB）
- `bash scripts/coverage-guard.sh` exit0

## 多角的チェック観点（AIが判断）

| 系統 | 観点 |
|------|------|
| システム系 | bundle サイズ削減の因果（`next/og` 撤去 → wasm/font 不在 → gzip 削減）と、minify による副次削減の責務分離。size gate の状態所有権は CI gate（`web-cd.yml`）に閉じる |
| 戦略・価値系 | 価値=無料プラン維持 + deploy 成功。最小コスト主軸は Task A（OG 撤去）。Task B（production minify 維持 + gate）は再発防止の安全網。Paid 移行（コスト最大）は無料構成方針に反する最終手段 |
| 問題解決系 | 真の論点=「3MiB 上限内で deploy を通すこと」。仮説=「`next/og` の wasm 焼き込みが主因」。優先順位: A（主軸）> C（gate）> B（minify）。E/F は contingency |

### 受入条件（Acceptance Criteria）

| AC | 内容 | 検証手段 |
|----|------|---------|
| **AC-1** | staging deploy が size 超過なく成功する（gzip worker bundle ≤ 3072KiB） | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`（user-gated）+ `check-worker-size.sh` |
| **AC-2** | Cloudflare Workers 無料プランを維持する（Paid 移行しない） | `08-free-database.md` 整合・wrangler.toml 差分なし |
| **AC-3** | OG メタが有効な `og:image` を出力する（root / member 両方） | Playwright `public-metadata.spec.ts` で `og:image` = `/og-default.png` 系を assert |
| **AC-4** | bundle サイズ超過が CI で事前検知される（deploy 前に fail） | `web-cd.yml` の size gate step が閾値超過で exit1 |
| **AC-5** | `next/og` 参照が 0 件（実装コードから完全撤去） | `rg -n "next/og\|ImageResponse" apps/web/app apps/web/src` → 0 件 + regression spec assert |
| **AC-6** | wasm（`resvg.wasm` / `yoga.wasm`）が bundle に不在 | `find apps/web/.open-next -name 'resvg.wasm' -o -name 'yoga.wasm'` → 0 件 |

## サブタスク管理

| サブタスク | concern | lane | 並列可否 |
|-----------|---------|------|---------|
| Task A: OG 撤去 + 静的フォールバック | 削除 + metadata 切替 | lane-A | Task B と並列可（編集ファイル重複なし） |
| Task B: production minify 維持 + CI size gate | workflow + size gate + spec | lane-B | Task A と並列可。ただし size gate の green 判定は Task A 完了後（wasm 撤去後の bundle を計測） |

## 成果物

- 本 Phase: `phase-1-requirements.md`（本ファイル）
- 後続 Phase: `phase-2-design.md` / `phase-3-design-review.md`

## 完了条件

- [ ] Step0 P50 で 9 対象パスの実在/不在を確定した
- [ ] taskType=`implementation` / visualEvidence=`NON_VISUAL` / implementation_mode=`new` を確定した
- [ ] AC-1〜AC-6 を番号付きで列挙した
- [ ] Task A / Task B の 2 concern を単一責務で分離した
- [ ] パストポロジ検証表を実在パスで埋めた
- [ ] Phase 1〜3 完了まで Phase 4 へ進まない gate を明記した
- [ ] 本実装サイクル で走る統合テスト（vitest/Playwright/regression/size gate）を記載した

## タスク100%実行確認【必須】

- [ ] 目的（gzip 3316KiB → 3072KiB 未満）を 1 文で固定した
- [ ] 根本原因（`next/og` wasm/font ~1539KB 焼き込み・使用 2 箇所）を記録した
- [ ] Task A 対象 7 ファイル・Task B 対象 4 ファイルの実在/不在を表で確定した
- [ ] 不変条件（`*.spec.{ts,tsx}` のみ / env.ts 経由 / `next build --webpack` / D1 直アクセス禁止 / `cf.sh` 経由 / HEX 直書き禁止）を本タスクが遵守する前提を確認した
- [ ] 全完了条件チェックリストを満たした

## 次Phase

[phase-2-design.md](phase-2-design.md) — Task A / Task B の topology・lane・validation matrix・解決アプローチ評価・dependency matrix を設計する。
