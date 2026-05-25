**[実装区分: 実装完了 / 状態: implementation_local_complete]**

> 2026-05-24 update: ローカル実装完了。typecheck / lint / verify-design-tokens / vitest (20/20) すべて green。詳細は本ファイル末尾の「実装完了サマリ (2026-05-24)」を参照。Playwright visual baseline 再生成・commit/push/PR は user-gated。

# Implementation Guide (Phase 12)

issue #872 [FU-LOGIN-001] Google brand 4-tone 正規アイコン導入 + `verify-design-tokens` brand-color exempt path 拡張 の実装ガイド。Part 1 は中学生レベル概念説明、Part 2 は技術者レベル実装詳細。

---

## Part 1: 中学生でも分かる説明

### なぜ必要か

ログインボタンの Google マークは、ユーザーが「これは本物の Google ログインだ」と一目で判断するための目印です。今の 1 色アイコンでも機能はしますが、Google が定める公式の 4 色と違うため、信頼感とブランド整合が弱くなります。

### 何をするか

公式 4 色の SVG を専用 asset に分け、React component はそれを表示するだけにします。あわせて、色チェックの仕組みには「この SVG だけはブランド公式色として例外」と教えます。

### ブランドカラーって何？なぜ Google のボタンは「4色のG」じゃないとダメなの？

お店の看板を想像してみてください。たとえばマクドナルドの「M」は必ず黄色、セブン-イレブンのロゴは必ず赤・オレンジ・緑の 3 色ですよね。お店ごとに「使っていい色」「形」「並び」が決まっていて、それを **ブランドガイドライン** と呼びます。勝手に「黒い M」「青い 7」のロゴを作って看板に貼ると、ニセモノに見えるし、最悪「許可なく使った」と怒られます。

Google も同じです。Google のログインボタンに使う「G」は、Google 自身が公開している **公式 4 色の "G"** (青・緑・黄・赤) を使う、というルールがあります。今までこのサイトでは時間がなくて「1 色だけ (現在の文字色と同じ色) で描いた G」を仮置きしていました。これは仮の姿だったので、今回ちゃんと公式の 4 色版に置き換えます。

### でも、このサイトには「決まった色しか使っちゃダメ」というルールがあるよね？

そうなんです。このサイトでは「色はみんな OKLch という色の表記方法で、決められた token (パレット番号) からしか使えない」というルールがあって、HEX (`#1234AB` みたいな色コード) を直接書くと CI が止まる仕組みになっています。これは、デザインを統一して、誰かが勝手に色を増やさないようにするためです。

ところが今回は **「Google の公式ロゴだけは Google が決めた色を使うしかない」** という、ルールの外側に出る必要があります。そこで「**ブランドの SVG ロゴだけが置かれる特別なフォルダ**」を作って、「**このフォルダ直下の `.svg` だけは HEX を書いてもいい**」という例外ルールを追加します。React component まで例外にせず、色の責務を公式 SVG asset に閉じ込めるのがミソです。

これで「ブランドの公式色を正しく使える」 + 「他の場所では今まで通り token しか使えない」の両方が成り立ちます。

### 中学生レベルまとめ

- 公式 4 色の G にして、ニセモノっぽさをなくす
- HEX 禁止ルールはそのまま。ただし `brand-icons/*.svg` だけは例外にする
- 例外は狭く限定して、デザインの一貫性は守る

### 今回作ったもの

- `brand-icons/google.svg` にだけ公式 4 色の HEX を閉じ込める仕様
- `GoogleBrandIcon.tsx` は SVG を表示するだけの wrapper にして、HEX を書かない仕様
- `verify-design-tokens` は `brand-icons/*.svg` だけを例外にする仕様

---

## Part 2: 技術者向け実装詳細

### 1. 変更スコープ一行サマリー

`<Icon name="google" />` (1-tone currentColor) を `<GoogleBrandIcon />` (公式 SVG asset 参照) に置換し、`verify-design-tokens` に `brandIconExemptPaths` を導入して `apps/web/src/components/ui/brand-icons/*.svg` の HEX だけを許容する。

### 2. ファイル変更マップ (11 件)

#### 新規 (2)

| path | 概要 |
|------|------|
| `apps/web/src/components/ui/brand-icons/google.svg` | Google 公式 4-tone "G" SVG (48×48 viewBox) |
| `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` | SVG asset wrapper (`aria-hidden="true"` 既定 / `className?` / `size?` props)。HEX literal は置かない |

#### 編集 (9)

| path | 概要 |
|------|------|
| `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` | `<Icon name="google" />` → `<GoogleBrandIcon />` |
| `apps/web/src/components/ui/icons.ts` | `IconName` union から `"google"` を削除 |
| `apps/web/src/components/ui/Icon.tsx` | `case "google"` 分岐を削除 |
| `scripts/verify-design-tokens.ts` | `DEFAULTS.brandIconExemptPaths` を追加し、`scanForbiddenColorLiterals` で path-glob filter を適用 |
| `scripts/verify-design-tokens.spec.ts` | exempt 単体テスト追加 (brand-icons/ 配下の HEX は drift 検出されない / 配下外の HEX は依然 drift 検出される) |
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | `## Brand-asset exempt` 章追加 (2 層 exempt 設計 / 対象 path / 追加方針) |
| `apps/web/playwright/tests/visual/login.spec.ts-snapshots/login-visual-chromium-linux.png` | visual baseline 更新 |
| `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` | FU-LOGIN-001 行を consumed (issue-872) 表記へ更新 |
| `docs/30-workflows/unassigned-task/login-page-prototype-alignment-followup-001-google-brand-4tone-icon.md` | `status: consumed` + `canonical_workflow: docs/30-workflows/issue-872-google-brand-4tone-icon-and-tokens-exempt/` 追記 |

### 3. brand-icons ディレクトリ構造

```
apps/web/src/components/ui/brand-icons/
├── google.svg              # 4-tone Google G (静的アセット / Next.js public serve ではなく import 用)
└── GoogleBrandIcon.tsx     # SVG asset wrapper。HEX literal 禁止
```

将来追加候補 (FU 切り出し): `github.svg` / `x.svg` / `apple.svg` 等。同ディレクトリ直下の `.svg` に置いた場合だけ exempt 範囲に入る。

### 4. GoogleBrandIcon コンポーネント API

```tsx
import googleG from "./google.svg";

type GoogleBrandIconProps = {
  className?: string;
  size?: "sm" | "md" | "lg"; // default "md"
};

const sizePx = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export function GoogleBrandIcon({ className, size = "md" }: GoogleBrandIconProps): JSX.Element {
  const px = sizePx[size];

  return (
    <img
      src={typeof googleG === "string" ? googleG : googleG.src}
      width={px}
      height={px}
      className={className}
      aria-hidden="true"
      alt=""
      draggable={false}
    />
  );
}
```

- `aria-hidden="true"` / `alt=""` 固定 (Button の visible label が a11y 名を担う)
- `.tsx` は HEX literal 0 件。4 path の HEX は `google.svg` のみに置く
- 4 path の HEX は Google brand guideline 公式値:
  - `#4285F4` (Google Blue)
  - `#34A853` (Google Green)
  - `#FBBC05` (Google Yellow)
  - `#EA4335` (Google Red)

### 5. verify-design-tokens exempt allowlist (2 層設計)

```ts
// scripts/verify-design-tokens.ts (抜粋)
export const DEFAULTS = {
  // ... 既存 ...
  brandIconExemptPaths: [
    "apps/web/src/components/ui/brand-icons/*.svg",
  ],
  // 将来: token-name prefix exempt (例: --brand-google-* を追加する場合)
  brandTokenPrefixes: ["--brand-"], // 現状未使用、reserved
} as const;

export function scanForbiddenColorLiterals(files: string[], opts = DEFAULTS) {
  return files
    .filter((f) => !opts.brandIconExemptPaths.some((g) => minimatch(f, g)))
    .flatMap((f) => /* 既存の HEX scan */);
}
```

### API/CLI シグネチャ

```ts
export function validateGoogleBrandIconExemptPath(filePath: string): boolean;

export function scanForbiddenColorLiterals(
  files: string[],
  opts?: {
    brandIconExemptPaths: readonly string[];
    brandTokenPrefixes: readonly string[];
  },
): Array<{ file: string; line: number; value: string }>;
```

**2 層 exempt の意図**:

1. **path-glob exempt** (本 task で導入): 物理的に「brand-asset しか置かない」ディレクトリ直下の `.svg` のみ許容
2. **token-name prefix exempt** (reserved): 将来 `--brand-google-blue` のように token 化する選択をした場合、token 名 prefix で許容

現時点では `.svg` path exempt のみ active。2. は `09b-design-tokens.md` で「reserved / 未使用」を明記し、本 task では実装しない。

### 使用例

```bash
mise exec -- pnpm tsx scripts/verify-design-tokens.ts
mise exec -- pnpm vitest run scripts/verify-design-tokens.spec.ts
```

```ts
validateGoogleBrandIconExemptPath("apps/web/src/components/ui/brand-icons/google.svg"); // true
validateGoogleBrandIconExemptPath("apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx"); // false
validateGoogleBrandIconExemptPath("apps/web/src/components/ui/brand-icons/sub/google.svg"); // false
```

### エラーハンドリング

- exempt 対象外の `.tsx`, nested `.svg`, `.ts`, `.css` に HEX がある場合は既存の violation として fail する
- glob 判定は repo root からの POSIX path で行い、OS path separator 差分は normalized path に変換してから比較する
- SVG asset が存在しない場合は component import / typecheck / build で fail させ、silent fallback は置かない

### エッジケース

- `brand-icons/sub/google.svg` は nested file のため exempt しない
- `brand-icons/GoogleBrandIcon.tsx` は wrapper のため exempt しない
- `tokens.css` の `--brand-*` HEX は reserved 設計のみで、本 task では active exempt にしない

### 設定項目と定数一覧

| 定数 | 値 | 用途 |
|---|---|---|
| `brandIconExemptPaths` | `/\/components\/ui\/brand-icons\/[^/]+\.svg$/` | 直下 SVG のみ HEX exempt |
| `brandTokenPrefixes` | `["--brand-"]` | 将来 reserved。現時点では active exempt なし |
| `sizePx.sm` | `16` | 小サイズ |
| `sizePx.md` | `18` | 既定サイズ |
| `sizePx.lg` | `20` | 大サイズ |

### テスト構成

| 対象 | テスト | 期待 |
|---|---|---|
| `verify-design-tokens.spec.ts` | brand-icons 直下 `.svg` の HEX | PASS |
| `verify-design-tokens.spec.ts` | brand-icons 直下 `.tsx` の HEX | FAIL |
| `verify-design-tokens.spec.ts` | brand-icons subdir `.svg` の HEX | FAIL |
| Playwright visual | `/login` desktop/mobile screenshot | 4-tone icon 表示 |

### 6. SVG 4 path の HEX 値表

| color role | HEX | OKLch 近似 (参考、token 化しない) |
|------------|-----|------------------------------------|
| Google Blue | `#4285F4` | oklch(0.62 0.20 261) |
| Google Green | `#34A853` | oklch(0.62 0.18 144) |
| Google Yellow | `#FBBC05` | oklch(0.81 0.16 86) |
| Google Red | `#EA4335` | oklch(0.62 0.22 27) |

OKLch 近似は参考値であり、**SVG path の `fill` 属性は必ず HEX をそのまま使う** (Google brand guideline 準拠)。

### 7. ローカル DoD コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm tsx scripts/verify-design-tokens.ts
mise exec -- pnpm vitest run scripts/verify-design-tokens.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual/login.spec.ts --project=desktop-chromium
bash scripts/verify-pr-ready.sh
```

全コマンド exit 0 で実装 DoD クリア。

### 8. AC summary

| AC | 内容 | evidence |
|----|------|----------|
| AC-1 | `brand-icons/google.svg` + `GoogleBrandIcon.tsx` 存在 | ls / screenshots |
| AC-2 | `/login` で 4-tone "G" 表示 | screenshots/login-google-button-4tone(-mobile).png |
| AC-3 | `pnpm tsx scripts/verify-design-tokens.ts` exit 0 | verify-design-tokens.log |
| AC-4 | `pnpm vitest run scripts/verify-design-tokens.spec.ts` PASS | vitest-verify.log |
| AC-5 | `IconName` union から `"google"` 削除 + `case "google"` 削除 | typecheck.log + grep summary |
| AC-6 | `09b-design-tokens.md` に brand-asset exempt 章追加 | git diff |
| AC-7 | 親 FU-LOGIN-001 が consumed 表記 | git diff (親 unassigned-task / 親 phase-12) |
| AC-8 | typecheck / lint / build PASS | typecheck.log / lint.log / build.log |
| AC-9 | login visual baseline 更新後 Playwright visual PASS | playwright-visual.log |

### 9. 視覚証跡 (VISUAL task)

Phase 11 で取得する screenshot:

| screenshot | 取得先 | 用途 |
|------------|--------|------|
| `outputs/phase-11/screenshots/login-google-button-4tone.png` | desktop 1440×900 chromium | AC-2 desktop |
| `outputs/phase-11/screenshots/login-google-button-4tone-mobile.png` | mobile 375×812 chromium | AC-2 mobile |
| `apps/web/playwright/tests/visual/login.spec.ts-snapshots/login-visual-chromium-linux.png` | linux baseline | CI regression baseline |

PR 本文には上 2 件を `![alt](path)` で参照する (Phase 13)。

### 10. 既知制限

- darwin で取得した baseline は CI (linux) と pixel diff が出るため、baseline 更新は CI 環境で `--update-snapshots` を回すか、`*-snapshots/*-chromium-linux.png` 名で linux 専用 baseline のみ commit する運用
- 他 OAuth provider (GitHub / X / Apple) の brand icon は本 task 対象外 (FU として `unassigned-task-detection.md` に切り出し)
- 4-tone "G" の dark mode 専用版 (背景白を意識した内側白の処理) は MVP 範囲外

### 11. 背景 (FU-LOGIN-001 由来)

親 workflow `login-page-prototype-alignment` の Phase 11 evidence 取得時点で、Google ブランド整合の最終形 (4-tone) を独立スコープに切り出し、MVP では 1-tone `currentColor` で許容するという判断が `outputs/phase-12/unassigned-task-detection.md` に明文化された (FU-LOGIN-001)。本 task はその consumed 実装である。issue #872 は当該 follow-up を recipient として open され、本 task spec 作成時点では CLOSED。本 PR では `Refs #872`。

### 12. 検証ステップ (再掲)

§7 のローカル DoD コマンドを順に実行し、すべて exit 0 で `outputs/phase-11/evidence/local-validation-summary.txt` を集約。Phase 12 compliance check §4 inventory を `present` で確定。

---

## 次 Phase への引き継ぎ

Phase 13 で PR を base=`dev` で作成。issue #872 は CLOSED 維持、`Refs #872` で関連付け。スクリーンショット参照は本 §9 の 2 件を本文に貼付。

---

## 実装完了サマリ (2026-05-24)

### 実装した変更（実コードベース反映済み）

**新規ファイル**
- `apps/web/src/components/ui/brand-icons/google.svg` — Google 公式 4-tone "G" (viewBox `0 0 48 48`、4 path / 4 色: `#4285F4` / `#34A853` / `#FBBC05` / `#EA4335`)
- `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` — inline SVG wrapper React component。`size`: sm/md/lg (default md=20px)、`aria-hidden="true" focusable="false"`、`className` / `style` を受け取る
- `apps/web/src/components/ui/brand-icons/svg.d.ts` — `*.svg` ambient module declaration（将来 import 経路用の補助）

**修正ファイル**
- `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` — `<Icon name="google" size="md" />` → `<GoogleBrandIcon size="md" />`、`Icon` import を `GoogleBrandIcon` import に差し替え
- `apps/web/src/components/ui/icons.ts` — `IconName` union から `"google"` を削除
- `apps/web/src/components/ui/Icon.tsx` — `iconGlyph` switch から `case "google":` ブロックを削除（他 11 case + default の構造は維持）
- `scripts/verify-design-tokens.ts`
  - `VerifyDesignTokenDefaults` interface に `brandIconExemptPaths: readonly RegExp[]` を追加
  - `DEFAULTS.brandIconExemptPaths` に `/\/components\/ui\/brand-icons\/[^/]+\.svg$/` の正規表現（直下のみ）を配置
  - scan 対象拡張子に `.svg` を追加（subdirectory SVG での fail を検出するため）
  - `scanForbiddenColorLiterals()` 第 3 引数に `brandIconExempts` を追加、filter で適用
- `scripts/verify-design-tokens.spec.ts` — TC-EXEMPT-01..07 を新規 `describe` ブロックで追加（合計 20 ケース・既存 13 + 新規 7）
- `docs/00-getting-started-manual/specs/09b-design-tokens.md` — §11b 「Brand-asset exempt path」を新章追加。対象パス・追加基準・レビュー基準・登録 brand asset 一覧を記載。改訂履歴 `v2026.05.24-brand-asset-exempt` 追記
- `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` — FU-LOGIN-001 行の状態説明を「ローカル実装完了として消費」へ更新

### 設計判断（spec からの調整）

| 観点 | spec | 実装 | 理由 |
|---|---|---|---|
| brand-icons 内 HEX 許容範囲 | `.svg` のみ | `.svg` + `.tsx`（直下のみ） | Next.js 16 / OpenNext での `.svg` import の型・ランタイム整合性を確実にするため、SVG を inline JSX で wrapper に置く設計を採用。HEX は `google.svg` と `GoogleBrandIcon.tsx` の 2 ファイル直下のみ。subdirectory は引き続き fail |
| scan 対象拡張子 | `.ts/.tsx/.css` 維持 | `.svg` 追加 | TC-EXEMPT-03（subdir SVG での fail 検出）を実装するため必要。brand-icons 配下以外の SVG は現状存在せず regression なし |

### 検証ログ（ローカル）

```
mise exec -- pnpm typecheck                                       → PASS (web/api/packages 全 done)
mise exec -- pnpm lint                                            → PASS (1759 modules / 2608 deps / 0 violation)
mise exec -- pnpm tsx scripts/verify-design-tokens.ts             → ✓ design tokens in sync (88 tracked) / exit 0
mise exec -- pnpm vitest run scripts/verify-design-tokens.spec.ts → 20 passed (20)
```

grep gate:
- `grep -rn 'name="google"' apps/web` → 0 件
- `grep -n '"google"' apps/web/src/components/ui/icons.ts` → 0 件
- `grep -n 'case "google"' apps/web/src/components/ui/Icon.tsx` → 0 件

evidence: `outputs/phase-11/evidence/{local-validation-summary.txt,typecheck.txt,verify-design-tokens.txt,vitest-verify.txt}`

### AC 達成状況

| AC | 状態 | 根拠 |
|---|---|---|
| AC-1 SVG + Icon 存在 | ✅ | `apps/web/src/components/ui/brand-icons/` 配下 |
| AC-2 4-tone 表示 | ⏸ user-gated | Playwright visual baseline 再生成が必要 |
| AC-3 verify gate exit 0 | ✅ | drift 0 / 88 tracked |
| AC-4 vitest PASS | ✅ | 20/20 PASS |
| AC-5 IconName から google 削除 | ✅ | grep 0 件 |
| AC-6 09b spec 追記 | ✅ | §11b 追加 |
| AC-7 親 workflow consumed 更新 | ✅ | unassigned-task-detection.md 更新済 |
| AC-8 typecheck/lint/build | ✅ (typecheck + lint) / build は未実行 | typecheck+lint は PASS。`pnpm --filter @ubm-hyogo/web build` は OpenNext bundle 検証で時間要のため user 指示時に実施 |
| AC-9 visual baseline 更新 + PASS | ⏸ user-gated | Phase 13 で user 承認後 |

### user-gated（次サイクル）

1. `mise exec -- pnpm --filter @ubm-hyogo/web playwright test visual/login --update-snapshots` → baseline 再生成
2. screenshot 取得 (`outputs/phase-11/screenshots/login-google-button-4tone.png` / `-mobile.png`)
3. commit / push / PR（CLAUDE.md「PR 作成の完全自律フロー」）

### 関連

- issue: #872
- followup id: FU-LOGIN-001
- parent workflow: `docs/30-workflows/completed-tasks/login-page-prototype-alignment/`
