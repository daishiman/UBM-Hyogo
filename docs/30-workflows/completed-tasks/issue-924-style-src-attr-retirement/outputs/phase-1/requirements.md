# Phase 1: 要件定義 — issue-924 style-src-attr 'unsafe-inline' 撤去

`[実装区分: 実装仕様書 / taskType=implementation / visualEvidence=VISUAL]`

> 本サイクルは仕様書作成後、ユーザー承認を経て実装に進む。実装・staging/production 検証・commit/push/PR は user-gated とする。

---

## 1. 背景

### 1.1 過渡境界の解消

親 cycle `issue-871-csp-nonce-migration`（AWSHH-FU-002）で `script-src` / `style-src` から `'unsafe-inline'` を削除し nonce 化した際、既存 React コードの `style={{...}}` 51 箇所を同時撤去するスコープ膨張を避けるため、属性 style 互換を `style-src-attr 'unsafe-inline'` に明示分離して維持した。これは過渡境界であり、followup #924 として独立サイクル化されていた。

`style-src-attr 'unsafe-inline'` が残存している限り、攻撃者が DOM 注入する `<element style="background:url(javascript:...)">` 等の属性 style 経路をブラウザが許可してしまうため、nonce 化の防御効果が部分的にしか成立していない。本サイクルでこれを撤去し CSP の inline 防御を完全成立させる。

### 1.2 現状調査結果（2026-05-25）

| 観点 | 事実 |
|------|------|
| `style-src-attr` 出現箇所 | `apps/web/src/lib/security-headers.ts:76` の 1 行（`["style-src-attr ", "'unsafe", "-inline'"].join("")`） |
| `style={{` 出現箇所 | `apps/web/src` / `apps/web/app` 配下で 51 箇所・17 ファイル |
| production files | 14 ファイル（admin / public / ui / features） |
| smoke/harness files | 3 ファイル（visual-harness 2 + __smoke__ 1） |
| 除外 (CSP 対象外) | `ImageResponse` 利用の 2 ファイル（OG 画像 PNG 出力） |
| 動的 style ケース | Avatar の `hsl(${hue})`、Icon の size px、ZoneDistribution の percentage gradient の 3 種 |

### 1.3 対象ファイル一覧

**production files (14)**:

- `apps/web/app/global-error.tsx`
- `apps/web/app/(admin)/admin/meetings/[id]/AttendanceCsvImportPanel.tsx`
- `apps/web/src/components/admin/TagsQueueResolveDrawer.tsx`
- `apps/web/src/components/admin/TagQueuePanel.tsx`
- `apps/web/src/components/admin/RequestQueuePanel.tsx`
- `apps/web/src/components/admin/SchemaDiffPanel.tsx`
- `apps/web/src/components/admin/AuditLogPanel.tsx`
- `apps/web/src/components/public/ZoneIntro.tsx`
- `apps/web/src/components/public/Hero.tsx`
- `apps/web/src/components/ui/Avatar.tsx`（動的 hue）
- `apps/web/src/components/ui/Icon.tsx`（動的 size px）
- `apps/web/src/components/ui/ConfirmDialog.tsx`
- `apps/web/src/features/admin/components/_dashboard/SchemaAlertCard.tsx`
- `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx`（動的 percentage）

**smoke/harness files (3)**:

- `apps/web/app/visual-harness/[name]/page.tsx`
- `apps/web/app/visual-harness/[name]/VisualScenarios.client.tsx`
- `apps/web/app/__smoke__/ui-primitives/page.tsx`

**除外**:

- `apps/web/app/opengraph-image.tsx`（`ImageResponse`）
- `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx`（`ImageResponse`）

---

## 2. 目的

`apps/web` の CSP から `style-src-attr 'unsafe-inline'` を撤去し、HTML element の `style="..."` 属性経路を全廃する。これにより CSP の inline 防御を完全成立させ、XSS 注入される `<element style="...">` を CSP3 対応ブラウザに評価無効化させる。

---

## 3. スコープ

| 含む | 含まない |
|------|---------|
| `apps/web` 14 production files の `style={{...}}` 撤去 | `apps/api` 側のヘッダ追加 |
| `apps/web` 3 smoke/harness files の `style={{...}}` 撤去 | D1 schema 変更 / API endpoint 追加 / Google Form 仕様変更 |
| `security-headers.ts:76` の `style-src-attr 'unsafe-inline'` 行削除 | `Reporting-Endpoints` / `report-to` 仕様変更（別 followup） |
| 動的 style（Avatar hue / Icon size / ZoneDistribution percentage）の data-attribute + CSS rule への置換 | CSP report-only / enforce mode 切替 |
| 単体テスト `security-headers.spec.ts` への `not.toContain('style-src-attr')` 追加 | nonce 仕様の変更（issue #871 不変） |
| Playwright smoke `tests/security-headers.smoke.spec.ts` への `style-src-attr` 不在 assert 追加 | OG 画像生成パス（`ImageResponse`）の変更 |
| 新規 grep gate `scripts/verify-no-inline-style.sh`（pre-push + CI） | 19 routes 全 baseline 全更新（既存 baseline を退行確認に使用） |

---

## 4. 機能要件

| ID | 要件 |
|----|------|
| FR-01 | `apps/web/src/lib/security-headers.ts` の `buildCspDirective` が出力する CSP に `style-src-attr` directive を含まないこと。 |
| FR-02 | 14 production files の `style={{...}}` を全て撤去し、Tailwind utility / className / `data-*` 属性 + CSS rule に置換する。 |
| FR-03 | 3 smoke/harness files の `style={{...}}` も同様に撤去し、CSP 評価が production と等価に行えるようにする。 |
| FR-04 | 静的色値は `apps/web/src/styles/tokens.css` の CSS variable を参照する（Tailwind の `bg-[var(--ubm-color-X)]` または直接 className）。 |
| FR-05 | Avatar の動的 hue は `data-hue="0..11"` 属性に変換し、12 段階 bucket を `tokens.css`（または専用 CSS Module）の `[data-hue="N"]` rule で吸収する。 |
| FR-06 | Icon の動的 size px は `data-size` 属性に変換し、CSS rule で対応する（既に類似パターンが存在）。 |
| FR-07 | ZoneDistribution の percentage gradient は SVG `<rect width={...}>` ベースに置換し、`<style>` 注入を回避する。SVG 属性は CSP `style-src-attr` の対象外。 |
| FR-08 | `ImageResponse` 利用の OG 画像（PNG 出力）は対象外として除外する（CSP 評価対象外）。 |
| FR-09 | `style={{` の新規追加を禁止する不変条件を `scripts/verify-no-inline-style.sh` で grep gate 化し、pre-push と CI で fail させる。 |

---

## 5. 非機能要件

| ID | 要件 |
|----|------|
| NFR-01 | 既存 OKLch トークン正本（`tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md`）を逸脱しない。HEX 直書き禁止。`bg-[#xxx]` 禁止。 |
| NFR-02 | `apps/web` env 参照は `getEnv()` / `getPublicEnv()` 経由のみ（task-02 不変条件）。 |
| NFR-03 | `apps/web` から D1 binding 直接アクセスを行わない（不変条件 #5）。 |
| NFR-04 | `127.0.0.1:8888` 等のローカル限定エンドポイントを `apps/web/src` に焼き込まない（task-18 grep gate）。 |
| NFR-05 | production build は `next build --webpack` を正本（OpenNext Workers 互換）。 |
| NFR-06 | 19 routes すべてで visual regression が発生しないこと（既存 baseline を退行確認に使用）。 |
| NFR-07 | nonce 仕様（issue #871）は不変。`script-src` / `style-src` / `style-src-elem` の出力は変更しない。 |

---

## 6. 受け入れ基準（AC）

| ID | 受け入れ基準 | 検証方法 |
|----|------------|---------|
| AC-1 | `buildCspDirective` の出力に `style-src-attr` 文字列が含まれない | unit: `apps/web/src/lib/__tests__/security-headers.spec.ts` で `expect(csp).not.toContain('style-src-attr')` |
| AC-2 | Playwright smoke で 実 response の `Content-Security-Policy[-Report-Only]` ヘッダに `style-src-attr` を含まない | `apps/web/tests/security-headers.smoke.spec.ts` で正規表現 assert |
| AC-3 | `rg "style={{" apps/web/src apps/web/app --include="*.tsx" -l` が **0 件** | `scripts/verify-no-inline-style.sh` の grep gate |
| AC-4 | 17 ファイル全てで `style={{...}}` が撤去され、Tailwind / className / data-attr + CSS rule に置換されている | code review |
| AC-5 | Avatar / Icon / ZoneDistribution の動的バリエーション（hue 12 種、size 複数、percentage 連続値）が描画レベルで等価 | 既存 visual baseline との diff が pixel-tolerance 内 |
| AC-6 | 19 routes の visual regression が pixel-tolerance 内（既存 baseline 維持） | Playwright `tests/visual/**` 既存 spec |
| AC-7 | `cspMode`（`report-only`）と nonce 仕様（`script-src` / `style-src` / `style-src-elem`）が不変 | 既存 unit / smoke の既存 assert がそのまま green |

> 19 routes: 公開6（`/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms`）/ 会員2（`/login`, `/profile`）/ 管理8（`/(admin)/admin`, `members`, `tags`, `meetings`, `schema`, `requests`, `identity-conflicts`, `audit`）/ 共通3（`error.tsx`, `not-found.tsx`, `loading.tsx`）。

---

## 7. 前提条件

| 前提 | 必須/推奨 | 理由 |
|------|----------|------|
| issue #871（nonce 化）マージ済み | **必須** | `style-src-attr 'unsafe-inline'` は #871 が分離した directive。マージ済み前提でその撤去を行う。 |
| task-08 design-tokens / task-09 tokens.css | 必須 | 静的色置換時の参照正本 |
| `next build --webpack` | 必須 | NFR-05。OpenNext bundle 互換 |

---

## 8. 用語（ユビキタス言語）

| 用語 | 定義 |
|------|------|
| `style-src-attr` | CSP Level 3 の directive。HTML element の `style="..."` 属性を許可するかを制御する。`style-src` とは独立に評価される。`'unsafe-inline'` を指定すると属性 style を許可するが、攻撃者注入の `style="..."` も評価されてしまう。 |
| inline style | React の `style={{...}}` JSX prop は DOM の `style="..."` 属性として書き出されるため、CSP 上は `style-src-attr` の対象。 |
| hue bucket | 連続値 hue（0-360 deg）を有限段階（12 段階）に量子化し、CSS の `[data-hue="N"]` rule で吸収する手法。 |
| `ImageResponse` | Next.js が PNG として直接配信する OG 画像生成 API。HTML DOM を経由しないため CSP 評価対象外。 |
