**[実装区分: 実装仕様書]**

# Phase 1: 要件定義 / スコープ確定 / 既存実装インベントリ

## 0. メタ情報

| key | value |
|---|---|
| workflow root | `docs/30-workflows/issue-872-google-brand-4tone-icon-and-tokens-exempt/` |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| implementation_mode | `new`（新規 SVG asset + 新規 React component + verify gate 拡張） |
| source issue | https://github.com/daishiman/UBM-Hyogo/issues/872 |
| source followup id | FU-LOGIN-001 |
| parent workflow | `docs/30-workflows/completed-tasks/login-page-prototype-alignment/` |
| 状態 | `spec_created` |

## 1. 背景

親 workflow `login-page-prototype-alignment` 完了時の Phase 12 `unassigned-task-detection.md` で **FU-LOGIN-001: Google brand 4-tone 正規アイコン導入** が検出された。現行 `<Icon name="google" size="md" />` は `apps/web/src/components/ui/Icon.tsx` の `iconGlyph(name)` switch 内で SVG path を返すが、全アイコンに `fill="none" stroke="currentColor" strokeWidth=2` を強制する `common` プロパティを spread しているため、Google 公式 4-tone（青・赤・黄・緑）の per-path fill を表現できず、Google Identity Guidelines に違反する単色 stroke 描画となっている。

同時に `scripts/verify-design-tokens.ts` は HEX 直書きと `bg-[#xxx]` / `text-[#xxx]` を CI gate `verify-design-tokens` で fail 判定する。Google 公式色（`#4285F4` / `#EA4335` / `#FBBC05` / `#34A853`）は OKLch token に格納する性質のものではなく、**外部 brand owner が指定する公式アセット**としてプロジェクト color system から分離するのが正しい設計である。よって brand-asset exempt path 機構を追加し、`apps/web/src/components/ui/brand-icons/*.svg` のみ HEX を許容する二層 exempt を導入する。

## 2. 現状コードインベントリ（実測）

| path | 役割 | 改修方針 |
|---|---|---|
| `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` | Auth.js `signInWithGoogle` を invoke する Client Component。現在は `<Icon name="google" size="md" />` を leftIcon に渡す | **`<GoogleBrandIcon />` 経由に差し替え**。signIn 連携は無改変 |
| `apps/web/src/components/ui/icons.ts` | `IconName` の type union 12 件（L1-12） | **`"google"` を union から削除**（orphan 化防止） |
| `apps/web/src/components/ui/Icon.tsx` | `iconGlyph(name)` switch（L113-121 に `case "google":`）。`common` で fill/stroke を強制 | **`case "google":` を switch から削除**（`common` 経路を Google アイコンに通さない） |
| `apps/web/src/styles/tokens.css` | OKLch token 正本（`--ubm-color-*`） | **無改変**（brand 色は外部アセットのため token 化しない方針を確定） |
| `scripts/verify-design-tokens.ts` | `DEFAULTS.colorLiteralExcludes` (L71-83) に Next.js metadata file pattern のみ。`scanForbiddenColorLiterals()` (L503-) が HEX / `bg-[#xxx]` / `text-[#xxx]` を grep | **`DEFAULTS` に `brandIconExemptPaths: readonly RegExp[]` を追加**し、`/\/components\/ui\/brand-icons\/[^/]+\.svg$/` を初期値とする。`scanForbiddenColorLiterals()` の filter に追加 |
| `scripts/verify-design-tokens.spec.ts` | verify script の vitest unit test | **exempt path 配下 = drift 0 件 PASS / 通常配下 = HEX で fail 維持** の 2 ケース追加 |
| `.github/workflows/verify-design-tokens.yml` | CI gate workflow（paths: 09b spec / verify script / spec / workflow yml） | **無改変**（paths trigger に script と spec が既に含まれる） |
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | design tokens 正本仕様 | **「brand-asset exempt path」章を追加**。対象ディレクトリ・追加基準（「外部 brand owner が指定する公式アセット」のみ）・レビュー基準を明記 |
| `apps/web/playwright/tests/visual/login.spec.ts-snapshots/` | login route の visual baseline PNG | **4-tone 化により diff が出るため baseline 更新が必須** |
| `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` | 親 workflow の Phase 12 detection レポート | **FU-LOGIN-001 行を `consumed` に更新し、本 workflow path を back-reference** |
| `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md` | unassigned-task spec | **status を `pending` → `consumed` / canonical_workflow を本 workflow path に更新** |

新規作成対象:

| path | 役割 |
|---|---|
| `apps/web/src/components/ui/brand-icons/google.svg` | Google 公式 4-tone "G" SVG asset（外部 brand owner 指定） |
| `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` | SVG asset wrapper として export。`size` prop を持ち、色値は持たない |

## 3. 機能要件

| ID | 要件 |
|---|---|
| FR-1 | `apps/web/src/components/ui/brand-icons/google.svg` は Google 公式 4-tone "G"（青 `#4285F4` / 赤 `#EA4335` / 黄 `#FBBC05` / 緑 `#34A853`）の path を持つ |
| FR-2 | `GoogleBrandIcon` は `size?: "sm" \| "md" \| "lg"`（default `md`）を受け取り、`google.svg` を装飾画像として描画する |
| FR-3 | `GoogleOAuthButton.client.tsx` は `<GoogleBrandIcon />` を Button の `leftIcon` に渡し、`<Icon name="google" />` への参照を削除する |
| FR-4 | `IconName` union から `"google"` を削除し、`Icon.tsx` の switch case も削除する |
| FR-5 | `scripts/verify-design-tokens.ts` の `DEFAULTS` に `brandIconExemptPaths: readonly RegExp[]` を追加する |
| FR-6 | exempt 判定は `/\/components\/ui\/brand-icons\/[^/]+\.svg$/` の path 配下のみとする（再帰させない / `.ts` / `.tsx` / `.css` は対象外） |
| FR-7 | 既存の `colorLiteralExcludes`（Next.js metadata file）と独立した第 2 層 exempt として実装し、grep filter で OR 結合する |
| FR-8 | `09b-design-tokens.md` に「brand-asset exempt path」章を追加し、対象ディレクトリ・追加基準・レビュー基準を明記する |
| FR-9 | 親 workflow の `unassigned-task-detection.md` の FU-LOGIN-001 行と `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md` の status を `consumed` に更新し、本 workflow への back-reference を残す |

## 4. 非機能要件

| ID | 要件 |
|---|---|
| NFR-1 | HEX 直書き禁止の原則は維持。`brand-icons/*.svg` のみ「外部 brand owner 指定アセット」として例外扱いとする |
| NFR-2 | `scanForbiddenColorLiterals` の scan 対象拡張子は **現状の `.ts` / `.tsx` / `.css` を維持**。`.svg` を scan 対象に追加しない（SVG asset は元から検査対象外） |
| NFR-3 | `apps/web` からの D1 直接アクセス禁止 / 新規 API endpoint 追加禁止の原則を維持 |
| NFR-4 | `Icon.tsx` の `common` 強制（`fill="none" stroke="currentColor"`）は他アイコンに対しては維持する（regression なし） |
| NFR-5 | a11y: Google ボタン全体に `aria-label="Googleでログイン"` がある前提なので `GoogleBrandIcon` は `aria-hidden="true"` default。`role="img"` は不要 |
| NFR-6 | 1 サイクル内完了（CONST_007）。SVG asset 配置から visual baseline 更新まで本 workflow で完結する |
| NFR-7 | Cloudflare Workers OpenNext bundle で動作する範囲のみ。SVG asset wrapper は静的 import 相当のため問題なし |

## 5. 受け入れ基準（AC）

- AC-1: `apps/web/src/components/ui/brand-icons/google.svg` および `GoogleBrandIcon.tsx` が存在し、4-tone（青 / 赤 / 黄 / 緑）で描画される
- AC-2: `/login` の Google OAuth ボタン左に 4-tone "G" が表示される（Playwright visual snapshot で確認）
- AC-3: `pnpm tsx scripts/verify-design-tokens.ts` が drift 0 件で exit 0（brand-icons 配下 HEX は exempt、通常 src 配下 HEX は fail を維持）
- AC-4: `pnpm vitest run scripts/verify-design-tokens.spec.ts` が PASS（exempt + 非 exempt 両ケース）
- AC-5: `apps/web/src/components/ui/icons.ts` の IconName union から `"google"` が削除され、`Icon.tsx` の switch case も削除される。`grep -rn 'Icon name="google"' apps/web` が 0 件
- AC-6: `09b-design-tokens.md` に brand-asset exempt 章が追加される
- AC-7: 親 workflow の FU-LOGIN-001 行 / unassigned-task spec が `consumed` 表記に更新される
- AC-8: `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/web build` PASS
- AC-9: login visual baseline が更新され、Playwright `visual/login.spec.ts` が PASS

## 6. スコープ確定

### 含む

- `apps/web/src/components/ui/brand-icons/google.svg` 新規作成（Google 公式 4-tone "G"）
- `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` 新規作成
- `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` の icon 差し替え
- `apps/web/src/components/ui/icons.ts` から `"google"` 削除
- `apps/web/src/components/ui/Icon.tsx` から `case "google":` 削除
- `scripts/verify-design-tokens.ts` に `brandIconExemptPaths` 追加
- `scripts/verify-design-tokens.spec.ts` に exempt / 非 exempt 2 ケース追加
- `docs/00-getting-started-manual/specs/09b-design-tokens.md` に brand-asset exempt 章追加
- `apps/web/playwright/tests/visual/login.spec.ts-snapshots/` の baseline 更新
- 親 workflow `unassigned-task-detection.md` の FU-LOGIN-001 行 consumed 化
- `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md` の status を `consumed` に更新

### 含まない（明示的に後回し / 別タスク）

- 他 OAuth provider（GitHub / Apple 等）の brand icon 対応
- UBM 自社 brand-mark の brand-icons ディレクトリ移管
- design tokens OKLch 設計全体の見直し
- staging deploy gate（FU-LOGIN-003）
- `Icon.tsx` の全 switch case 構造改修（FU-LOGIN-002 等の別タスクで扱う）

### 正本順位

1. 本仕様書および `index.md`
2. Google Identity Guidelines（4-tone "G" 公式 SVG）
3. `docs/00-getting-started-manual/specs/09b-design-tokens.md`
4. `apps/web/src/styles/tokens.css`（OKLch token 正本）
5. 親 workflow `login-page-prototype-alignment` の Phase 12 unassigned-task-detection.md

## 7. タスク分類記録

| 観点 | 判定 |
|---|---|
| UI task / docs-only task | **UI task**（`/login` の見た目が変わる + visual baseline 更新が必要） |
| Phase 11 mode | **VISUAL**（Playwright visual snapshot を更新） |
| P50 チェック | 現 branch に未実装 → `implementation_mode: "new"` |
| 命名規則 | brand-icons ディレクトリは kebab-case、React component は PascalCase（`GoogleBrandIcon`）、既存 `apps/web/src/components/ui/` 直下と整合 |
| 既存命名パターン | `Icon.tsx` の `IconName` union は kebab-case 文字列（`"chevron-down"` 等）。union から削除する `"google"` も kebab-case |

## 8. 実装モード判定の根拠

- `apps/web/src/components/ui/brand-icons/` ディレクトリは現存しない → **新規ディレクトリ + 新規 SVG + 新規 component の `new` モード**
- 既存 `Icon.tsx` への `case "google":` 追加ではなく分離した理由: `common` の `fill="none" stroke="currentColor"` 強制を回避するため。`common` 経路を通すと per-path `fill="#xxx"` が無効化される
- `verify-design-tokens.ts` への exempt 追加も「既存配列拡張ではなく独立変数追加」とする。理由は scope 分離（既存 `colorLiteralExcludes` は file-level exclude、brand-icons は path-pattern level exempt で意味が異なる）

## 9. リスクと初期対策

| リスク | 影響 | 対策 |
|---|---|---|
| brand-icons exempt path を再帰 (`/components/ui/brand-icons/.+`) にすると subdirectory の任意 HEX が許容され抜け穴になる | gate がザル化 | 正規表現を `/components/ui/brand-icons/[^/]+\.svg$` に固定し、直下 SVG のみ許可。Phase 4 で `nested-fail` ケースとして test 化 |
| `IconName` union から `"google"` を削除すると他箇所で参照していた場合 typecheck が壊れる | build fail | Phase 5 着手前に `grep -rn '"google"' apps/web/src apps/web/app` で全使用箇所を列挙し、`GoogleOAuthButton.client.tsx` の 1 箇所のみであることを確認 |
| visual baseline 更新を忘れて Playwright が diff fail | CI red | Phase 5 完了時に `pnpm --filter @ubm-hyogo/web playwright test visual/login --update-snapshots` を必須手順として明記 |
| Google 公式 SVG の viewBox / path 値が公式ガイドラインと異なる | brand guideline 違反 | Phase 5 の SVG 入手手順で「Google Identity 公式リソースから直接コピー」と明記。viewBox は `0 0 48 48` を採用 |
| `Icon.tsx` の switch から `case "google":` を削除し忘れて dead branch が残る | code smell + grep で発見されない | Phase 8 リファクタリングで「switch case 削除確認」を必須項目化 |

## 10. Phase 1 完了条件

- [x] taskType / visualEvidence / implementation_mode を確定（implementation / VISUAL / new）
- [x] 既存ファイル / 新規ファイル 13 件のインベントリと改修方針を明示
- [x] FR-1〜FR-9 / NFR-1〜NFR-7 / AC-1〜AC-9 を列挙
- [x] スコープの「含む」「含まない」を明示
- [x] 正本順位を確定
- [x] タスク分類（UI task / VISUAL / new）を記録
- [x] 実装モードを `new` と判定し根拠を記載
- [x] 初期リスク 5 件と対策を列挙

## 11. 次 Phase への引き継ぎ

Phase 2 では本 Phase で確定したインベントリと FR/NFR/AC を入力として、(a) `Icon.tsx` 拡張ではなく brand-icons 新規 component を選んだ設計判断、(b) verify-design-tokens の二層 exempt 構造、(c) SVG inline vs Next.js Image の選択、(d) 実装順序「SVG asset 配置 → wrapper component → consumer 差し替え → gate 拡張 → spec 追記 → visual baseline 更新」の設計判断を文書化する。
