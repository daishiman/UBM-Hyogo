# 他 OAuth provider (GitHub / X / Apple 等) brand-icon 拡張 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | issue-872-followup-001-additional-oauth-provider-brand-icons                                     |
| タスク名     | Google 以外の OAuth provider (GitHub / X / Apple 等) brand-icon を `brand-icons/` 配下へ追加     |
| 分類         | 改善 / brand-asset 拡張                                                                          |
| 対象機能     | `/login` ページの OAuth ボタン群 (現状 Google のみ)、`apps/web/src/components/ui/brand-icons/` |
| 優先度       | 低 (post-MVP candidate)                                                                          |
| 見積もり規模 | 小規模 (provider 1 件あたり SVG + Component 追加のみ)                                            |
| ステータス   | pending (OAuth provider 採用判断待ち)                                                            |
| 発見元       | issue-872 Phase 12 unassigned-task-detection (FU-872-001)                                        |
| 発見日       | 2026-05-24                                                                                       |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/completed-tasks/issue-872-google-brand-4tone-icon-and-tokens-exempt/`
- 親タスク状態: `implemented_local_visual_evidence_captured`
- 検知元 outputs: `docs/30-workflows/completed-tasks/issue-872-google-brand-4tone-icon-and-tokens-exempt/outputs/phase-12/unassigned-task-detection.md` FU-872-001
- 関連実装:
  - `apps/web/src/components/ui/brand-icons/google.svg` — Google 4-tone 既存実装 (本タスクの拡張テンプレート)
  - `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` — Component 既存実装
  - `apps/web/src/components/ui/icons.ts` — icon registry
  - `scripts/verify-design-tokens.ts` — HEX gate (brand-icons exempt path)
- 前提条件: 各 OAuth provider (GitHub / X / Apple 等) の **採用判断**が確定していること (auth strategy 議論)

---

## 1. なぜこのタスクが必要か (Why)

### 1.1 背景

issue #872 (FU-LOGIN-001) で `/login` の Google OAuth ボタンに Google brand guideline 準拠の 4-tone "G" アイコンを導入した。同時に `apps/web/src/components/ui/brand-icons/` を brand-asset 専用ディレクトリとして整備し、`scripts/verify-design-tokens.ts` の HEX gate に exempt path を追加した。

本タスクの設計上、他 OAuth provider (GitHub / X / Apple 等) の brand-icon も同じ exempt path に乗せて追加できる構造になっている。Google 以外の provider 採用判断が確定した時点で、本タスクで brand-icon を最小差分で追加する。

### 1.2 問題点・課題

- 現状 OAuth provider は Google のみ active。他 provider 採用判断が未確定なため、brand-icon を先行追加すると未使用 asset として残る
- 各 provider の brand guideline (色・形・最小サイズ・clearspace) は public guideline 準拠が必須 (Google guideline 同様の制約)
- provider 採用時に brand-icon が未整備だと `/login` ボタン群の視覚整合性が崩れる (1-tone `currentColor` 暫定とブランド規定混在)

### 1.3 放置した場合の影響

- 他 provider 採用が確定した際に brand-icon 追加タスクが auth-strategy タスクのクリティカルパスに乗り遅延要因になる
- brand-icon 不在で 1-tone `currentColor` 暫定を許容すると、各 provider の brand guideline 違反の可能性が残る

---

## 2. 何を達成するか (What)

### 2.1 目的

採用判断確定後の OAuth provider (GitHub / X / Apple 等) について、各社 brand guideline 準拠の brand-icon を `apps/web/src/components/ui/brand-icons/` 配下に追加し、`/login` の OAuth ボタン群の視覚整合性を保つ。

### 2.2 最終ゴール

- 採用確定した provider ごとに以下が追加済み
  - `apps/web/src/components/ui/brand-icons/<provider>.svg` (各社 brand guideline 準拠)
  - `apps/web/src/components/ui/brand-icons/<Provider>BrandIcon.tsx` (Component)
  - `apps/web/src/components/ui/icons.ts` に registry エントリ追加
- 各 provider の OAuth ボタンが対応 brand-icon を表示
- `scripts/verify-design-tokens.ts` の brand-icons exempt path で各 SVG の HEX が exempt 扱い (新規 exempt rule 追加なし、既存 path で完結)
- Playwright visual snapshot で各 provider ボタンの baseline 取得済み

### 2.3 スコープ

#### 含むもの

- 採用確定した provider ごとの brand-icon SVG / Component / registry 追加
- `verify-design-tokens` の既存 exempt path での HEX gate 確認
- 対象 provider OAuth ボタンの brand-icon 配線
- Playwright visual baseline 取得

#### 含まないもの

- **OAuth provider 採用判断** (auth strategy 別議論・本タスクの前提条件)
- 各 provider の Auth.js adapter 設定 / Cloudflare Secrets 追加 (auth strategy 側で実施)
- brand-icon ディレクトリ構造の再設計 (issue-872 で確定済み)
- 新規 exempt rule 追加 (issue-872 の exempt path で完結する設計)

### 2.4 成果物

- provider ごとの SVG / Component / registry 差分
- 既存 exempt path での HEX gate green evidence
- 各 provider ボタン Playwright visual snapshot

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 各社 brand guideline 準拠の SVG 最適化

issue-872 (Google) で確定した最適化方針を踏襲する:

- public brand guideline asset を出典として `<svg>` を最小化 (xmlns 必須、不要な metadata / id 削除)
- `viewBox` を正方化 (24x24 等) し、`width` / `height` 属性は Component 側 props で制御
- `fill` HEX は brand guideline 準拠の固定値 (`currentColor` への置換禁止)
- aspect ratio・最小サイズ・clearspace は各 provider の guideline 数値を Component の default props に反映

### 3.2 verify-design-tokens の exempt path 流用

`scripts/verify-design-tokens.ts` の brand-icons exempt path (issue-872 で追加) は `apps/web/src/components/ui/brand-icons/*.svg` を glob で exempt するため、新規 provider SVG を追加するだけで自動的に exempt 対象になる。**新規 exempt rule を追加してはならない** (exempt path の肥大化を防ぐため)。

### 3.3 OAuth ボタンの brand-icon 配線

各 provider OAuth ボタンは `apps/web/app/login/_components/` 配下に新規 Component (例: `GitHubOAuthButton.client.tsx`) として配置し、`GoogleOAuthButton.client.tsx` のパターンを踏襲する。

- brand-icon は Button label の左に絶対配置 (Google ボタンと同じレイアウト rhythm)
- a11y 上、icon は `aria-hidden="true"` または `role="presentation"` を付与し、Button の accessible name と二重化しない
- brand-icon の size token は `auth.css` の既存 `--brand-icon-size` を流用

### 3.4 Playwright visual baseline 取得

provider ごとに以下を取得:

- `/login` 全体 (desktop / mobile) — 全 OAuth ボタンが visible な状態
- 各 OAuth ボタン単独 (focused / hover state 含む)

baseline 更新は `apps/web` の Playwright config に従い、CI 上で chromium-desktop / chromium-mobile を required check として運用する。

### 3.5 横展開メモ

- 他 provider 採用判断が複数同時に確定した場合は、provider ごとに小規模 PR を分離し、Playwright visual baseline 更新の影響範囲を縮小する
- Apple Sign In はボタン UI の guideline (枠線・角丸・タイポ) が他 provider より厳格なため、採用時は guideline 確認を慎重に実施

---

## 4. 受入条件 (AC)

- **AC-1**: 採用確定した provider ごとに `apps/web/src/components/ui/brand-icons/<provider>.svg` が brand guideline 準拠で配置済み
- **AC-2**: 各 provider の `<Provider>BrandIcon.tsx` Component が `GoogleBrandIcon.tsx` のパターンに従い実装済み
- **AC-3**: `apps/web/src/components/ui/icons.ts` の registry に各 provider の brand-icon エントリ追加済み
- **AC-4**: `/login` の各 provider OAuth ボタンが対応 brand-icon を表示し、accessible name の二重化なし
- **AC-5**: `pnpm tsx scripts/verify-design-tokens.ts` が exit 0 で完走 (既存 exempt path で HEX gate green、**新規 exempt rule 追加なし**)
- **AC-6**: Playwright visual snapshot baseline が各 provider ボタンを含む状態で更新済み
- **AC-7**: CLAUDE.md 不変条件2 (OKLch トークン正本化) / 不変条件3 (プロトタイプ正本順位) に違反しない (brand-icon SVG の HEX は exempt path 内のみ)
- **AC-8**: 親 workflow Phase 12 `unassigned-task-detection.md` の FU-872-001 が consumed に更新済み

---

## 5. 参照資料

- `docs/30-workflows/completed-tasks/issue-872-google-brand-4tone-icon-and-tokens-exempt/outputs/phase-12/unassigned-task-detection.md` — FU-872-001 検知元
- `docs/30-workflows/completed-tasks/issue-872-google-brand-4tone-icon-and-tokens-exempt/` — 親 workflow (Google brand-icon + exempt path 確立)
- `apps/web/src/components/ui/brand-icons/google.svg` — 既存実装 (テンプレート)
- `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` — Component テンプレート
- `apps/web/src/components/ui/icons.ts` — icon registry
- `scripts/verify-design-tokens.ts` — HEX gate (brand-icons exempt path)
- `apps/web/app/login/_components/GoogleOAuthButton.client.tsx` — OAuth ボタンの brand-icon 配線パターン
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション — 不変条件2 / 不変条件3
