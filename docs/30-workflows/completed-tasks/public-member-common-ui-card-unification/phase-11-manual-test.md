---
spec_classification: implementation_spec
state: spec_created
phase: 11
phase_name: 手動テスト/視覚証跡
task_id: public-member-common-ui-card-unification
---

# Phase 11: 手動テスト / 視覚証跡（VISUAL）

## メタ情報

| キー | 値 |
|------|----|
| task_id | `public-member-common-ui-card-unification` |
| タスク種別 | **VISUAL**（UI 共通化により8画面に視覚差分が発生する） |
| workflow_state | `spec_created`（screenshot は実装後に取得＝**pending**） |
| 視覚証跡格納先 | `outputs/phase-11/screenshots/`（spec_created 段階は `.gitkeep` のみ。実体は実装後に追加） |
| staging 取得 | **user-gated**（staging 実機 screenshot はユーザー明示承認後のみ） |

> **VISUAL 宣言**: 本タスクは共通レイアウト層（PageShell / PageHeader / SectionCard / ContentCard / Prose / ButtonLink）への載せ替えにより、対象8画面のカード枠・ボタン外観・背景・余白・タイポが視覚的に変化する。よって視覚証跡（screenshot）取得を必須とする VISUAL カテゴリとして扱う。

---


## 目的

8画面の視覚証跡（screenshot）取得計画と jsdom／staging 実機の検証境界を定義する（spec_created では screenshot は pending）。

## screenshot 計画

### ビューポート

| 名称 | 幅 | 用途 |
|------|----|----|
| desktop | 1280px | 主レイアウト（max-width・grid・余白の正本確認） |
| mobile | 390px | カード縦積み・@media 折返し・ボタン block 化の確認 |

### canonical screenshot 名（`<screen>-<viewport>.png`）

| 画面 | route | desktop | mobile |
|------|-------|---------|--------|
| Home | `/` | `home-desktop.png` | `home-mobile.png` |
| Members | `/members` | `members-desktop.png` | `members-mobile.png` |
| MemberDetail | `/members/[id]` | `member-detail-desktop.png` | `member-detail-mobile.png` |
| Register | `/register` | `register-desktop.png` | `register-mobile.png` |
| Privacy | `/privacy` | `privacy-desktop.png` | `privacy-mobile.png` |
| Terms | `/terms` | `terms-desktop.png` | `terms-mobile.png` |
| Profile | `/profile` | `profile-desktop.png` | `profile-mobile.png` |
| Login | `/login` | `login-desktop.png` | `login-mobile.png` |

> desktop は全8画面必須。mobile は折返し・縦積みが意味を持つ画面（特に Home / Members / MemberDetail / Profile）を優先。残り（Register / Privacy / Terms / Login）も `<screen>-mobile.png` を取得して 8×2 = 16 枚を完全カバレッジとする。
> **TC-11-N 番号は metadata（後述テストケース表）の `tc` フィールドにのみ付与し、screenshot ファイル名には含めない**（ファイル名は canonical `<screen>-<viewport>.png` で固定）。

### spec_created 段階での扱い

- `outputs/phase-11/screenshots/` は **`.gitkeep` のみ**を配置し、screenshot 実体は **pending**（実装完了後の Phase で取得）。
- ローカル取得は fixture/dev サーバ起動後に実施。staging 実機 baseline はユーザー明示承認後のみ（user-gated）。

---

## テストケース表（TC-11-N）

各画面で「カード化・ボタン統一・背景統一」が視覚反映されることを確認する。

| tc | 画面 | 確認内容（カード化／ボタン／背景） | desktop | mobile | status |
|----|------|----------------------------------|---------|--------|--------|
| TC-11-1 | `/` | ヒーロー・統計4・About・注目メンバー・タイムライン・CTA が全て SectionCard/ContentCard 枠に収まる。CTA/案内ボタンが `ButtonLink` で統一外観 | `home-desktop.png` | `home-mobile.png` | pending |
| TC-11-2 | `/members` | PageHeader（actions に DensityToggle）＋ 絞り込み SectionCard ＋ MemberCard（ContentCard 基盤）。背景が PageShell 集約 | `members-desktop.png` | `members-mobile.png` | pending |
| TC-11-3 | `/members/[id]` | PageHeader（戻る導線）＋ プロフィールヒーロー/事業概要/タグ/リンク/詳細(dl→KVList)/活動 が全て SectionCard 化。ベタ書き div 0 | `member-detail-desktop.png` | `member-detail-mobile.png` | pending |
| TC-11-4 | `/register` | PageHeader ＋ 登録案内 SectionCard ＋ フォームプレビュー section 群が SectionCard 化 | `register-desktop.png` | `register-mobile.png` | pending |
| TC-11-5 | `/privacy` | PageHeader ＋ 本文が SectionCard + Prose に統一（LegalProse ベタ書き解消） | `privacy-desktop.png` | `privacy-mobile.png` | pending |
| TC-11-6 | `/terms` | PageHeader ＋ 本文が SectionCard + Prose に統一 | `terms-desktop.png` | `terms-mobile.png` | pending |
| TC-11-7 | `/profile` | PageHeader（actions に EditCta=ButtonLink）＋ 写真/ステータス/公開プレビュー/可視性/反映注記/項目/申請/出席履歴 が全て SectionCard/ContentCard 化 | `profile-desktop.png` | `profile-mobile.png` | pending |
| TC-11-8 | `/login` | PageShell（bare・narrow）＋ ログインカードが SectionCard(auth) 化。ログインボタンが `.ui-button-*` 直書きから ButtonLink/Button 統一 | `login-desktop.png` | `login-mobile.png` | pending |

> 全 TC は AC-3（ボタン統一）/ AC-4（全情報カード化）/ AC-5（背景 PageShell 集約）の視覚的裏付け。

---

## 画面カバレッジマトリクス（8画面 × viewport）

| 画面 \ viewport | desktop (1280) | mobile (390) |
|----------------|----------------|--------------|
| `/` | ✅ home-desktop | ✅ home-mobile |
| `/members` | ✅ members-desktop | ✅ members-mobile |
| `/members/[id]` | ✅ member-detail-desktop | ✅ member-detail-mobile |
| `/register` | ✅ register-desktop | ✅ register-mobile |
| `/privacy` | ✅ privacy-desktop | ✅ privacy-mobile |
| `/terms` | ✅ terms-desktop | ✅ terms-mobile |
| `/profile` | ✅ profile-desktop | ✅ profile-mobile |
| `/login` | ✅ login-desktop | ✅ login-mobile |

合計 **16 枚**（8画面 × 2 viewport）。spec_created 段階は全て pending。

---

## jsdom で確認できない CSS の「効き」と staging 実機の境界

| 観点 | jsdom（vitest）で確認可能か | 実機 screenshot で確認 |
|------|----------------------------|----------------------|
| `@media (max-width: 640px)` の縦積み・block 化 | ✕（jsdom は @media 非適用） | ✅ mobile screenshot |
| `:hover` の ContentCard `data-interactive` shadow/transform | ✕ | ✅ desktop（hover state は手動キャプチャ補足） |
| `gradient` / accent tone の背景表現 | ✕（computed style はトークン文字列までで描画なし） | ✅ desktop screenshot |
| `var(--ubm-*)` 解決後の実描画色 | ✕（変数参照の有無のみ） | ✅ screenshot |
| DOM 構造・`data-component` / `data-testid` / `aria-label` 保全 | ✅（component spec で検証） | 補助 |
| props → data 属性のマッピング（`data-tone` / `data-padding` 等） | ✅ | 補助 |

> 構造・機械可読 ID・props 解決は component spec（Phase 6/7）で担保し、**視覚的な「効き」（@media・hover・gradient・実描画色）は screenshot でのみ検証可能**という境界を明記する。

---

## 実行タスク（実装後に実施・spec_created では未実施）

1. ローカル dev / fixture サーバを起動し、対象8画面 × 2 viewport の screenshot を `outputs/phase-11/screenshots/` に canonical 名で取得する。
2. 各 TC-11-N の確認内容（カード化・ボタン統一・背景統一）を満たすことを目視確認し、`outputs/phase-11/manual-test-result.md` に結果を記録する（実装後 Phase で作成）。
3. staging 実機 baseline はユーザー明示承認後のみ取得する（user-gated）。

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| カード化マッピング | `phase-1-requirements.md` §カード化マッピング表 | 各画面の検証対象かたまり |
| props/data 属性 | `phase-2-design.md` | data 属性 → CSS 解決の確認軸 |
| プロトタイプ | `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` / `pages-member.jsx` | 期待レイアウトの参照 |
| 既存 VISUAL 証跡構造 | `docs/30-workflows/admin-attendance-dashboard-ux/outputs/phase-11/` | screenshots ディレクトリ構造の踏襲元 |

---


## 成果物

- `phase-11-manual-test.md`
- `outputs/phase-11/`（manual-test-result.md / manual-test-report.md / discovered-issues.md / ui-sanity-visual-review.md / screenshot-plan.json / phase11-capture-metadata.json）

## 統合テスト連携

本タスクは apps/web 表現層の UI 共通化であり、統合観点の検証は apps/web vitest（component spec）と Phase 11 の Playwright screenshot 回帰で行う。apps/api との統合 contract は変更しない（I-1: 既存 endpoint surface のみ・D1 / Form 不変）。各 Phase の成果物は次 Phase の入力へ連結する（AC trace: Phase 1 → 4 → 5 → 9/10 → 11）。

## 完了条件

- [ ] screenshot 計画（8画面 × 2 viewport = 16 枚・canonical 名）が定義されている。
- [ ] TC-11-1..8 が各画面のカード化・ボタン統一・背景統一を網羅している。
- [ ] jsdom と staging 実機の検証境界が明記されている。
- [ ] spec_created 段階では screenshot は **pending**（`outputs/phase-11/screenshots/.gitkeep` のみ）であることが明記されている。
