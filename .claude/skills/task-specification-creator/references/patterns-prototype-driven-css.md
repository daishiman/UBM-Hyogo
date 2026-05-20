# パターン集: prototype-driven CSS / tokens.css と globals.css の責務分離

> 読み込み条件: `docs/00-getting-started-manual/claude-design-prototype/` のような
> プロトタイプ HTML/CSS を SSOT として実 `apps/web` 側に CSS 移植するタスクの仕様書を作るとき。
> 第一適用例: `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/`
> 関連: [patterns-parallel-sub-workflow.md](patterns-parallel-sub-workflow.md)（sub-workflow 二重構造）/
> CLAUDE.md「UI prototype alignment / MVP recovery」セクション（OKLch 不変条件）。

## 1. プロトタイプを SSOT とした CSS 移植の Phase-05 設計

### 1-1. SSOT 順位（衝突時の優先度）

1. `docs/00-getting-started-manual/claude-design-prototype/`（プロトタイプ HTML/CSS）
2. `docs/00-getting-started-manual/specs/design-tokens.md`（token 仕様）
3. `apps/web/src/styles/tokens.css`（OKLch 実値）
4. `apps/web/src/styles/globals.css`（rhythm / typography selector 規則）

「プロトタイプ未掲載画面」（管理画面群 / register / privacy / terms）も同じ primitives 群で
構成し、新規 primitive を生やさない（CLAUDE.md 不変条件 3）。

### 1-2. Phase 5 実装ガイドの必須要素

prototype → `apps/web/src/styles/globals.css` 移植系タスクの Phase 5
（[phase-template-execution.md](phase-template-execution.md) 該当箇所）では下記を **逐語明示**する。

| 必須項目 | 内容 |
| --- | --- |
| 対象ファイル（絶対パス） | `/<repo>/apps/web/src/styles/globals.css`（リポジトリ相対パスも併記） |
| 補助対象 | layout / shell の grid column / data-attr 追加のみ。構造変更禁止 |
| 既存ファイル構造の行番号スナップショット | `@import` / `@theme inline` / `@layer base` / `@layer components` の行範囲を表で記録 |
| 挿入位置 | `@layer components` 末尾追加 を基本とし、既存 selector hooks の **直後** に新 sub-workflow 用 selector を継ぎ足す |
| selector グルーピング ID | `=== <sub-workflow> <group-id> <name> ===` の cssコメント区切りで sub_workflow ごとに block 分離 |
| 出典コメント | 各 selector ブロック先頭に「プロトタイプ styles.css L<開始>-L<終了> の翻訳」を必須記載 |
| 指示的サンプル | 最終調整（空行 / コメント文面）は実装者裁量。完全コピペ可能な CSS block を Phase 5 本文に同梱 |

### 1-3. `@layer components` 末尾追加の根拠

- `@layer base` は body / html / typography 既定値を持つので、prototype 由来 rhythm 規則は
  base に書かず components に書く（cascade 優先順位とユーザ override を両立）。
- 既存 `@layer components` の末尾 `focus-visible / reduced-motion` block の **前** に
  新 sub の selector を挿入する。focus / motion は最後に評価されるべきグローバル横断 utility。
- Tailwind v4 `@source` ディレクティブで JIT が走るため、selector 名は data-attribute 形式
  （`[data-route]` / `[data-section]` / `[data-card]` / `[data-shell]`）で書くと
  arbitrary class `bg-[#xxx]` 禁則と衝突せず、かつ TS / TSX 側からは型なし string で割り当てられる。

### 1-4. selector 命名の不変条件

| 区分 | パターン | 例 |
| --- | --- | --- |
| route surface | `[data-route]` / `[data-route="<slug>"]` | `[data-route]`, `[data-route="admin"]` |
| section rhythm | `[data-section]` / `[data-section-rhythm="<token>"]` | `compact` / `comfortable` / `loose` |
| card chrome | `[data-card]` / `[data-card-variant="<token>"]` | プロトタイプ card 規則の翻訳 |
| shell | `[data-shell]` / `[data-shell-width="<token>"]` | admin grid column と整合 |
| typography | `[data-text-scale="<token>"]` | `display` / `title` / `body` / `caption` |

class 名で書くと Tailwind utility と衝突するため **必ず data-attribute** を使う。

---

## 2. tokens.css（OKLch）と globals.css（rhythm / typography selector）の責務分離 SRP

### 2-1. 責務マトリクス

| ファイル | 責務 | 含めるもの | 含めないもの |
| --- | --- | --- | --- |
| `apps/web/src/styles/tokens.css` | **色** の SSOT（OKLch 実値） | `--ubm-color-*` / dark mode override / surface / text / border / accent | rhythm / spacing / typography / selector 規則 |
| `apps/web/src/styles/globals.css` | **rhythm / typography / data-attr selector** | `@theme inline` token bridge / `@layer base` html-body / `@layer components` data-attr selector | OKLch 値（必ず var(--ubm-color-*) 経由で参照） |
| `docs/00-getting-started-manual/specs/design-tokens.md` | **token 仕様**の人間可読 SSOT | token 一覧 / 命名規約 / WCAG コントラスト根拠 / dark mode 表 | 実 CSS（参照のみ） |

### 2-2. 単一責務の境界

- 色を `globals.css` に直書きしない（HEX も OKLch 実値も禁止）。必ず `var(--ubm-color-*)` 経由。
- `tokens.css` に rhythm / spacing selector を書かない。spacing は `--ubm-space-*` token として
  `tokens.css` に置き、selector 側で `padding-block: var(--ubm-space-8)` のように **token 参照**で書く。
- dark mode の色切替は `tokens.css` の `[data-theme="dark"]` で `--ubm-color-*` を再代入する 1 か所のみ。
  selector 規則を dark mode で分岐させない（cascade 経由で自動切替）。

### 2-3. 例（責務違反 vs 正しい配置）

**違反**:
```css
/* globals.css - NG: OKLch 直書き */
[data-card] { background: oklch(0.98 0.005 240); }

/* tokens.css - NG: spacing rhythm を tokens に */
:root { --ubm-card-padding: 24px; }
[data-card] { padding: var(--ubm-card-padding); }
```

**正しい配置**:
```css
/* tokens.css: 色と spacing primitive */
:root {
  --ubm-color-card-bg: oklch(0.98 0.005 240);
  --ubm-space-6: 1.5rem;
}

/* globals.css: selector 規則 (token 参照のみ) */
@layer components {
  [data-card] {
    background: var(--ubm-color-card-bg);
    padding: var(--ubm-space-6);
  }
}
```

### 2-4. Phase 2 設計時の検証コマンド（責務分離 grep gate）

```bash
# globals.css に OKLch 直書きが無いこと
grep -nE '(oklch|#[0-9a-fA-F]{3,8})' apps/web/src/styles/globals.css \
  | grep -v '^\s*/\*' \
  | grep -v -- '--ubm-color-' && echo "[FAIL] direct color" || echo "[PASS]"

# tokens.css に data-attribute selector が無いこと（dark theme スイッチ以外）
grep -nE '^\[data-' apps/web/src/styles/tokens.css \
  | grep -v 'data-theme="dark"' && echo "[FAIL] selector in tokens" || echo "[PASS]"
```

---

## 3. HEX 直書き / `bg-[#xxx]` 禁止と CI gate `verify-design-tokens` 連携

### 3-1. 禁止表記

| 禁止 | 例 | 是正 |
| --- | --- | --- |
| HEX 直書き | `color: #1a73e8;` / `background: #fff;` | `tokens.css` に `--ubm-color-*` を追加し `var(...)` 参照 |
| Tailwind arbitrary color | `className="bg-[#1a73e8] text-[#fff]"` | `bg-[var(--ubm-color-accent)]` または `@theme inline` で token を Tailwind utility 経由に bridge |
| RGB / RGBA 直書き | `rgba(0,0,0,0.04)` | `tokens.css` に shadow / overlay 用 token を追加 |
| named color | `red` / `black` / `white` | 全て token 経由 |
| inline `style={{ color: "#..." }}` | TSX の inline style | token を CSS custom property 経由で渡す |

### 3-2. Phase 仕様書での明文化

- **Phase 1 不変条件**: CLAUDE.md「OKLch トークン正本化」不変条件を逐語引用し、本タスクが
  この不変条件を破らないことを宣言する。
- **Phase 2 設計**: 新規 token を増やす場合、`docs/00-getting-started-manual/specs/design-tokens.md`
  と `apps/web/src/styles/tokens.css` の同一 wave 更新を Phase 2 依存関係表に書く。
- **Phase 6 test plan**: grep gate を test step として明示し、`grep -nE '#[0-9a-fA-F]{3,8}'`
  と `grep -nE 'bg-\[#'` `text-\[#` `border-\[#` を全 PASS にする。
- **Phase 7 quality gates**: CI `verify-design-tokens` を required status check として依存させる。
- **Phase 11 evidence**: `outputs/phase-11/verify-design-tokens.log` を canonical evidence path で
  取得し、`outputs/phase-11/grep-hex.txt` / `grep-arbitrary-tailwind.txt` を 0 hit で tracked 配置。

### 3-3. `verify-design-tokens` CI gate との連携

```bash
# local 検証（Phase 11 evidence 取得時に逐語実行）
mise exec -- pnpm verify:design-tokens > outputs/phase-11/verify-design-tokens.log 2>&1

# grep gate evidence（tracked .txt として保存）
grep -rnE '#[0-9a-fA-F]{3,8}' apps/web/src apps/web/app \
  --include='*.ts' --include='*.tsx' --include='*.css' \
  > outputs/phase-11/grep-hex.txt || true
grep -rnE '(bg|text|border|ring|from|to|via)-\[#' apps/web/src apps/web/app \
  --include='*.ts' --include='*.tsx' \
  > outputs/phase-11/grep-arbitrary-tailwind.txt || true

# 0 hit が PASS（grep の exit 1 を || true で吸収）
test ! -s outputs/phase-11/grep-hex.txt \
  && test ! -s outputs/phase-11/grep-arbitrary-tailwind.txt \
  && echo "[PASS] design-tokens grep gate"
```

### 3-4. branch protection / required status check

- `verify-design-tokens / verify-design-tokens` を `dev` / `main` の required status check 候補に
  含める（CLAUDE.md task-18 該当）。
- selector 追加タスクで `verify-design-tokens` が fail した場合、`spec_created` のまま close-out せず
  `implemented_local_runtime_pending` へ再分類する（SKILL-changelog v2026.05.09 該当ルール）。

### 3-5. 例外（許容される直書き）

- `tokens.css` 内の OKLch リテラル（token 定義そのもの。これだけが直書き許容）。
- CSS コメント内の例示（`/* prototype L77: #fafafa → --ubm-color-surface-bg */`）。
- markdown / docs 内の例示コードブロック（実コードではない）。

---

## 関連

- CLAUDE.md「UI prototype alignment / MVP recovery」: OKLch 不変条件 / プロトタイプ正本順位
- [patterns-parallel-sub-workflow.md](patterns-parallel-sub-workflow.md): sub-workflow の `outputs/phase-11/` 構成
- [phase-11-non-visual-alternative-evidence.md](phase-11-non-visual-alternative-evidence.md): grep gate / log evidence canonical path
- [phase-template-execution.md](phase-template-execution.md): Phase 5 実装ガイド構造
- [quality-gates.md](quality-gates.md): required status check 連携
