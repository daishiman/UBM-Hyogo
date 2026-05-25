# login-page Google brand 4-tone アイコン + design tokens exempt path - タスク指示書

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | login-page-prototype-alignment-followup-001-google-brand-4tone-icon                             |
| タスク名     | Google brand 4-tone 正規アイコンの導入 + design tokens への brand-color exempt path 追加        |
| 分類         | 改善 / brand-asset alignment                                                                    |
| 対象機能     | `/login` の Google OAuth ボタン左に表示する Google "G" マーク (`apps/web/app/login/_components/GoogleOAuthButton.client.tsx`) |
| 優先度       | 低                                                                                              |
| 見積もり規模 | 小規模                                                                                          |
| ステータス   | consumed by `docs/30-workflows/completed-tasks/issue-872-google-brand-4tone-icon-and-tokens-exempt/`            |
| 発見元       | login-page-prototype-alignment Phase 12 unassigned-task-detection (FU-LOGIN-001)                |
| 発見日       | 2026-05-23                                                                                      |

## Canonical Workflow Status

- canonical_workflow: `docs/30-workflows/completed-tasks/issue-872-google-brand-4tone-icon-and-tokens-exempt/`
- 親 workflow: `docs/30-workflows/completed-tasks/login-page-prototype-alignment/`
- 親タスク状態: `implemented_local_visual_evidence_captured`
- Phase 12 検知元: `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` FU-LOGIN-001
- 関連実装:
  - `apps/web/app/login/_components/GoogleOAuthButton.client.tsx`（現状: 1-tone `currentColor` の "G" マーク描画）
  - `apps/web/src/components/ui/icons.ts`（icon registry。新規 brand-icon 追加候補）
  - `apps/web/src/styles/tokens.css`（OKLch design tokens 正本。brand-color exempt path 追加候補）
  - `.github/workflows/verify-design-tokens.yml` (task-18 由来の HEX gate。exempt rule 追加対象)

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

login-page-prototype-alignment では `/login` に Google OAuth ボタンを実装し、左端に Google "G" アイコンを配置した。MVP では design tokens の OKLch 単色原則（CLAUDE.md「UI prototype alignment / MVP recovery」不変条件2「OKLch トークン正本化」）に従い、`currentColor` ベースの **1-tone モノクロ "G"** を採用して visual evidence 取得まで完了している。

一方、Google の brand guideline では OAuth サインインボタンに使用する "G" マークは **公式 4-tone (青 #4285F4 / 赤 #EA4335 / 黄 #FBBC05 / 緑 #34A853)** が原則で、モノクロは "darkmode contrast 例外" 等の限定条件でのみ許容される。post-MVP の brand alignment フェーズでは 4-tone への切替が望ましいが、これは現行 design tokens の OKLch 単色原則および `verify-design-tokens` CI gate（HEX 直書き禁止 / `bg-[#xxx]` 禁止）と衝突する。

### 1.2 問題点・課題

- 1-tone `currentColor` 採用は Google brand guideline の "推奨" 表記からは逸脱（厳密違反ではないが post-MVP では正規化したい）
- 4-tone 化には HEX 値 4 種を SVG `<path fill="#xxxxxx">` または CSS custom property に書く必要があり、`verify-design-tokens` の HEX gate に必ず引っかかる
- design tokens 側に「brand-asset 専用 exempt path」を導入するか、SVG 内 fill だけを許可する gate rule に拡張するかの設計判断が未定
- exempt path を雑に広げると HEX 直書き禁止の趣旨（OKLch 正本化）を骨抜きにする恐れがある

### 1.3 放置した場合の影響

- post-MVP brand alignment フェーズで Google OAuth ボタンが brand guideline 推奨形に収束しない
- 他の brand-asset（GitHub / X 等のソーシャル OAuth を将来追加する場合）でも同じ exempt 設計議論が再発する
- design tokens の OKLch 正本化原則と brand-asset 4-tone との間で都度 ad-hoc 判断が発生し、`verify-design-tokens` gate を local 無効化する誘惑が生じる

---

## 2. 何を達成するか（What）

### 2.1 目的

Google OAuth ボタンの "G" アイコンを公式 4-tone 仕様に正規化し、同時に design tokens 側へ "brand-asset exempt path" を設計・実装することで、`verify-design-tokens` CI gate を通したまま brand-color HEX を限定的に許容する仕組みを確立する。

### 2.2 最終ゴール

- `apps/web/src/components/ui/icons.ts` 配下に Google 公式 4-tone "G" SVG が登録されている（または専用 brand-icon ディレクトリに分離）
- `GoogleOAuthButton.client.tsx` が 4-tone アイコンを参照し、`/login` 上で公式仕様どおりに表示される
- `verify-design-tokens` CI gate が brand-asset path のみ HEX を許容するように更新され、それ以外のパスでは HEX 直書き禁止が維持される
- exempt path の対象範囲・追加ルール・レビュー基準が `docs/00-getting-started-manual/specs/design-tokens.md` か同等の正本 doc に明文化されている

### 2.3 スコープ

#### 含むもの

- Google 公式 4-tone "G" SVG の取得（Google Identity ブランドガイドラインから）と `apps/web/src/components/ui/` 配下への配置
- `icons.ts` registry または専用 `brand-icons.ts` への登録
- `GoogleOAuthButton.client.tsx` の置き換え（1-tone `currentColor` → 4-tone brand SVG）
- `verify-design-tokens` gate の exempt rule 拡張（ファイル path allowlist 方式）
- `docs/00-getting-started-manual/specs/design-tokens.md` への exempt 規定追記
- Playwright visual snapshot の baseline 更新（4-tone 化により login ボタンの diff が必ず出るため）

#### 含まないもの

- 他 OAuth provider（GitHub / X / Apple 等）の brand-icon 追加（将来別 followup）
- UBM 公式ロゴ (`brand-mark`) の差し替え（FU-LOGIN-002 で別途扱う）
- design tokens 全体の OKLch 設計見直し（不変条件2 の根幹変更は禁止）
- staging / production への deploy gate（FU-LOGIN-003 で別途扱う）

### 2.4 成果物

- 4-tone Google "G" SVG asset (`apps/web/src/components/ui/brand-icons/google.svg` 想定)
- 更新後の `GoogleOAuthButton.client.tsx`
- 更新後の `verify-design-tokens` workflow / script（exempt allowlist 追加）
- 更新後の `docs/00-getting-started-manual/specs/design-tokens.md`（brand-asset exempt 章追加）
- 更新後の `/login` Playwright visual baseline PNG

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 1-tone `currentColor` 採用で MVP 完了させた経緯

login-page-prototype-alignment のメインサイクルでは「visual evidence までを 1 サイクル内で完遂する」ことを優先したため、Google brand guideline の 4-tone 推奨と OKLch 単色原則の衝突を回避する形で **1-tone `currentColor` ベースの "G"** を採用した。これは Google brand guideline 上は "darkmode/contrast 例外" の解釈で許容範囲だが、OAuth サインインボタンとしては推奨形ではない。MVP 段階での妥協点を明示しないまま 4-tone 化に踏み込むと、design tokens 不変条件と CI gate の両方を同時に変更することになり、レビュー範囲が肥大化するため独立 followup に切り出した。

### 3.2 `verify-design-tokens` の HEX gate を brand-asset に通すための exempt rule 設計

`verify-design-tokens` CI gate は HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を grep ベースで検知する。素朴に exempt を入れると以下の罠がある:

1. **path-glob 方式の罠**: `apps/web/src/components/ui/brand-icons/**` を allowlist 化すると、誰でも "brand-icons" 配下に逃がせば HEX が通る構造になる。OKLch 正本化の趣旨を骨抜きにする恐れ。
2. **token-name allowlist 方式の罠**: `--brand-google-blue: #4285F4` のような CSS variable に逃がしても、消費側で `var(--brand-google-blue)` を使う以上 HEX は tokens.css に残る。tokens.css を gate 対象外にすると今度は OKLch 正本ファイルの diff レビューが緩む。
3. **SVG 内 `fill="#xxx"` の扱い**: SVG inline 内の fill を gate 対象にするか否か。Google "G" のように外部 brand asset としてベンダー入稿される SVG は HEX を内包するのが常態であり、別ルールが必要。

### 3.3 推奨アプローチ（議論たたき台）

- **二層 exempt**: ① `apps/web/src/components/ui/brand-icons/` 直下の **`.svg` ファイルのみ** HEX を許容（拡張子で限定）。② `tokens.css` 内に `--brand-*-*` prefix の HEX-bearing variable を許容するが、それ以外の `*.tsx` / `*.ts` / `*.css` での HEX は引き続き禁止。
- **レビュー基準明文化**: brand-icons 配下への追加は「外部 brand owner が指定する公式アセット」のみ。社内デザインの色追加は OKLch token として定義する原則を維持。
- **CI gate 更新**: `verify-design-tokens` script に allowlist 配列を追加し、検知時に "exempt path" / "exempt prefix" のいずれかに該当する場合のみ pass。

### 3.4 学んだこと / 横展開メモ

- brand-asset と design tokens の衝突は OAuth provider 追加・3rd-party SDK 連携時に再発する構造的問題
- "MVP は 1-tone `currentColor`" の判断を Phase 12 unassigned-task-detection に明示記録したことで、4-tone 化を独立サイクル化できた
- exempt rule の設計判断は CI gate 単体ではなく `docs/00-getting-started-manual/specs/design-tokens.md` に明文化することで、後続レビュー時の根拠資料として参照可能になる

---

## 4. 受入条件 (AC)

- **AC-1**: `apps/web/src/components/ui/brand-icons/google.svg`（または同等 path）に Google 公式 4-tone "G" SVG が配置され、`GoogleOAuthButton.client.tsx` から参照されている
- **AC-2**: `/login` 画面で Google OAuth ボタンが 4-tone (青/赤/黄/緑) で描画されることが Playwright visual snapshot で確認できる（baseline 更新済み）
- **AC-3**: `verify-design-tokens` CI gate が brand-icons path および `--brand-*` prefix CSS variable のみ HEX を許容し、それ以外のファイルでの HEX 直書きは引き続き fail する
- **AC-4**: `docs/00-getting-started-manual/specs/design-tokens.md` に brand-asset exempt の対象範囲・追加ルール・レビュー基準が明文化されている
- **AC-5**: `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` の FU-LOGIN-001 行が consumed 状態に更新され、本 followup への back-reference が記録されている

---

## 5. 参照資料

- `docs/30-workflows/completed-tasks/login-page-prototype-alignment/outputs/phase-12/unassigned-task-detection.md` - FU-LOGIN-001 検知元
- `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` - 現状の 1-tone 実装
- `apps/web/src/components/ui/icons.ts` - icon registry（brand-icons 分離検討先）
- `apps/web/src/styles/tokens.css` - OKLch design tokens 正本
- `docs/00-getting-started-manual/specs/design-tokens.md` - design tokens 仕様（exempt 規定の追記先）
- `.github/workflows/verify-design-tokens.yml` - HEX gate CI 実装（task-18 由来）
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション - 不変条件2「OKLch トークン正本化」
- Google Identity Branding Guidelines (外部): Google OAuth サインインボタンの公式 4-tone "G" マーク仕様
