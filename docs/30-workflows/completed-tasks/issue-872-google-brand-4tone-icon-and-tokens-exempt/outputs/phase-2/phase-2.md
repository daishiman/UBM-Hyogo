**[実装区分: 実装仕様書]**

# Phase 2: 設計 / 設計判断 / 実装順序

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `spec_created` |
| 入力 | Phase 1 (`outputs/phase-1/phase-1.md`) |
| 出力 | 本ファイル + Phase 3 への入力 |

## 1. 設計判断 1: `Icon.tsx` 拡張ではなく `brand-icons/` 新規ディレクトリ + 専用 component に分離する

### 判断

`apps/web/src/components/ui/Icon.tsx` の `iconGlyph(name)` switch に `case "google":` を残す案を **棄却** し、`apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` を独立 React component として新設する。

### 根拠

| 観点 | Icon.tsx 拡張案 | brand-icons 新規案（採用） |
|---|---|---|
| `common` の fill/stroke 強制 | 強制が効くため per-path fill が反映されない（**実装不能**） | common 経路を通らないため per-path fill が反映される |
| 責務境界 | semantic icon と brand asset を同一 surface で混在 | semantic icon = OKLch token + currentColor、brand asset = 外部 owner 指定 HEX で分離 |
| 例外管理 | switch 内で 1 case だけ `common` を spread しない分岐が必要（保守性低） | 物理ディレクトリで分離するため自動的に exempt path 機構と整合 |
| verify-design-tokens 連携 | `apps/web/src/components/ui/Icon.tsx` 全体を exempt にする必要が出る | `brand-icons/` 配下だけを exempt にできる |

### 棄却した代替案

- **案 A**: `Icon.tsx` の switch を「common を spread する case」と「spread しない case」に二分する → semantic icon 数 11 件に対して brand icon 1 件のため、switch 構造を歪める価値がない。将来 brand icon が増えるたびに同じ歪みが拡大する
- **案 B**: SVG を `public/` 配下に置き `<img src="/icons/google.svg">` で読み込む → bundle サイズは減るが Cloudflare Workers の static asset 経路が増え、Playwright visual snapshot の安定性が下がる。SSR で alt / aria が制御しにくい

## 2. 設計判断 2: verify-design-tokens の二層 exempt 構造

### 判断

`scripts/verify-design-tokens.ts` の `DEFAULTS` に `colorLiteralExcludes`（既存・file-level exclude）と並行して `brandIconExemptPaths`（新設・path-pattern level exempt）を独立 readonly 配列として配置する。

### 根拠

| 観点 | 既存 `colorLiteralExcludes` 拡張案 | 独立 `brandIconExemptPaths` 案（採用） |
|---|---|---|
| 意味の分離 | metadata file（Next.js 規約由来）と brand asset（外部 owner 指定）が同列扱いになり、後から「なぜ exempt なのか」を読み解きにくい | exempt 理由ごとに変数名が分かれ、レビュー時の判定が容易 |
| filter 適用範囲 | 全 scan に対して 1 つの exclude として効く | brand asset として明示的に「ここだけは外部 brand owner 指定」と表現できる |
| 将来拡張 | 他 brand を追加するたびに metadata と混在する配列が膨れる | brand 追加時は `brandIconExemptPaths` のみに追記 |

### exempt 判定の罠と固定方針

- **罠**: glob を `**/brand-icons/**` のように再帰許可すると、`brand-icons/<vendor>/internal/` のような subdir に未審査 HEX が紛れ込んでも検出できなくなる
- **固定方針**: 正規表現を `/\/components\/ui\/brand-icons\/[^/]+\.svg$/` とし、`brand-icons/` 直下の SVG ファイルのみ exempt。subdirectory は exempt 対象外（subdir に置きたい場合は 09b spec の改訂と本 workflow の後継 task が必要）

### scan 対象拡張子

- 現状: `.ts` / `.tsx` / `.css`（`scripts/verify-design-tokens.ts` の既存実装）
- 本 workflow: **`.svg` のみを exempt 対象にする**。`brand-icons/google.svg` の HEX は公式 brand asset として許可し、`GoogleBrandIcon.tsx` 内の HEX は許可しない。component は SVG asset を参照する wrapper に限定する。

## 3. 設計判断 3: SVG inline 化 vs Next.js Image

### 判断

`GoogleBrandIcon.tsx` は `google.svg` を参照する wrapper にする。色値は `google.svg` のみを正本とし、TSX へ path / HEX を複製しない。

### 根拠

- `Icon.tsx` の既存実装は汎用 stroke icon 用であり、外部 brand asset は同じ構造に寄せない方が token gate の例外範囲を狭くできる
- `google.svg` ファイルを Google ブランドガイドライン由来の正本 asset として `brand-icons/google.svg` に固定する
- `GoogleBrandIcon.tsx` は `img` wrapper にとどめるため、`verify-design-tokens` の HEX 例外を `.tsx` へ広げる必要がない

## 4. 設計判断 4: 実装順序

### 順序

1. **SVG asset 入手と配置**: Google Identity Guidelines 公式 4-tone "G" SVG を `apps/web/src/components/ui/brand-icons/google.svg` に配置（4 path × 4 色）
2. **GoogleBrandIcon component 実装**: `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` を新規作成。`size` prop を持つ SVG asset wrapper とし、HEX literal は置かない
3. **verify-design-tokens 拡張**: `scripts/verify-design-tokens.ts` の `DEFAULTS` に `brandIconExemptPaths` 追加 → `scanForbiddenColorLiterals()` の filter に組み込み
4. **verify-design-tokens.spec 拡張**: exempt 配下 PASS / 非 exempt FAIL の 2 ケース最低追加
5. **consumer 差し替え**: `GoogleOAuthButton.client.tsx` の `<Icon name="google" />` を `<GoogleBrandIcon />` に差し替え
6. **legacy icon 撤去**: `icons.ts` から `"google"` 削除 → `Icon.tsx` switch から `case "google":` 削除
7. **09b spec 追記**: `docs/00-getting-started-manual/specs/09b-design-tokens.md` に「brand-asset exempt path」章を追加
8. **visual baseline 更新**: Playwright `--update-snapshots` で `login.spec.ts-snapshots/` を再生成
9. **親 workflow 反映**: 親 `unassigned-task-detection.md` の FU-LOGIN-001 行 / unassigned-task spec の status を `consumed` 化

### 順序選定の根拠

- gate 拡張（手順 3-4）を consumer 差し替え（手順 5）より先に行う理由: 差し替え時に CI gate が即時 fail しないようにするため。HEX は `google.svg` のみで許可し、`.tsx` に広げないことを先に保証する
- legacy 撤去（手順 6）を差し替え（手順 5）より後にする理由: union から削除する前に consumer の参照を切らないと typecheck が壊れる
- visual baseline 更新（手順 8）を最後にする理由: 全変更が反映された後の最終形を baseline にするため

## 5. ライブラリ semantics と依存

| 観点 | 判定 |
|---|---|
| 新規 npm dependency | **追加しない**（SVG asset wrapper のみ） |
| SVGR / svg loader | **追加しない**（`img` wrapper で代替） |
| `next/image` | **使わない**（24px 装飾アイコンのため最小 wrapper で十分） |

## 6. component contract

### `GoogleBrandIcon`

```tsx
type GoogleBrandIconProps = {
  size?: "sm" | "md" | "lg"; // default: "md"
  className?: string;
};
```

| prop | default | 用途 |
|---|---|---|
| `size` | `"md"` | `sm`=16px / `md`=20px / `lg`=24px（既存 `Icon` の size scale と一致） |
| `className` | `undefined` | 親側で追加スタイルを当てたい場合のみ使用 |

### SVG 構造

- `google.svg` は viewBox `0 0 48 48`
- 4 path 要素を持ち、それぞれ `fill="#4285F4"` / `#EA4335"` / `#FBBC05"` / `#34A853"` を直書き
- `GoogleBrandIcon.tsx` は `aria-hidden="true"` / `alt=""` を固定し、Button の visible label に accessible name を任せる
- `fill="none"` / `stroke="currentColor"` を持たない（`Icon.tsx` の common とは独立）

## 7. verify-design-tokens.ts の差分設計

### 追加する型と定数

```ts
// DEFAULTS 内に追加
brandIconExemptPaths: [
  /\/components\/ui\/brand-icons\/[^/]+\.svg$/,
] as readonly RegExp[],
```

### filter 適用点

`scanForbiddenColorLiterals()` のファイル走査ループ内で、各 candidate file path に対し:

```ts
const isBrandIconExempt = DEFAULTS.brandIconExemptPaths.some(rx => rx.test(filePath));
if (isBrandIconExempt) continue; // brand-icons 直下のファイルは scan skip
```

既存の `colorLiteralExcludes`（file-level）判定の直後にこの判定を挟む。

## 8. テスト戦略の概要（Phase 4 で詳細化）

| ケース | 期待 |
|---|---|
| TC-EXEMPT-01 | `brand-icons/google.svg` 内の `#4285F4` → PASS |
| TC-EXEMPT-02 | `brand-icons/GoogleBrandIcon.tsx` 内の `#EA4335` → FAIL（TSX は exempt 対象外） |
| TC-EXEMPT-03 | `brand-icons/sub/google.svg`（subdir）内の `#FBBC05` → FAIL（exempt 対象外） |
| TC-EXEMPT-04 | `apps/web/src/components/ui/Card.tsx` 内の `#ff0000` → FAIL（通常配下） |

## 9. ステップ間 state 引き渡し（該当なし）

本タスクは multi-step wizard ではないため、ステップ間 state 引き渡しは存在しない。

## 10. Phase 2 完了条件

- [x] `Icon.tsx` 拡張ではなく brand-icons 新規 component を選んだ設計判断を文書化
- [x] verify-design-tokens の二層 exempt 構造と「再帰させない」固定方針を明示
- [x] SVG inline vs Next.js Image の選択を文書化
- [x] 実装順序 9 ステップを明示
- [x] `GoogleBrandIcon` の component contract を確定
- [x] verify-design-tokens.ts の差分設計（追加変数 + filter 適用点）を確定
- [x] テスト戦略の概要を提示

## 11. 次 Phase への引き継ぎ

Phase 3 では本 Phase で確定した設計判断と実装順序、テスト戦略概要を入力として、「矛盾なし / 漏れなし / 整合性あり / 依存関係整合」の 4 条件で Phase 4 進行可否を判定する。特に `brandIconExemptPaths` の正規表現境界（直下のみ許可）と consumer 差し替え順序（gate 拡張 → consumer 差し替え → legacy 撤去）の妥当性を確認する。
