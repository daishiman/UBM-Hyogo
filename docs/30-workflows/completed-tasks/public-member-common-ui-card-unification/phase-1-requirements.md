---
spec_classification: implementation_spec
state: spec_created
phase: 1
phase_name: 要件定義
task_id: public-member-common-ui-card-unification
---

# Phase 1: 要件定義

## メタ情報

| キー | 値 |
|------|----|
| task_id | `public-member-common-ui-card-unification` |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| implementation_mode | `new`（新規プリミティブ層の追加が主、各画面移行は edit を含む） |
| spec_classification | `implementation_spec` |
| workflow_state | `spec_created` |

---


## 目的

公開層＋会員層＋login の8画面を共通レイアウト層へ統一するための要件・受入条件（AC-1..12）・「全情報のカード化」マッピングを確定し、後続 Phase が実装可能な粒度の入力を得る。

## 実装区分の判定根拠（CONST_004）

**判定: `[実装区分: 実装仕様書]`（コード変更必須）。**

根拠:
- 依頼の目的は「カード・背景・ボタンを共通化」「全情報をカード化」「今後の改善の土台」であり、**新規 React コンポーネント追加・既存ページの JSX 置換・CSS クラス再編という具体的なコード変更なしには達成不可能**。
- 「動作させる／改善する／反映させる」を含む UI 統合タスクであり、CONST_004 の判定基準（ファイル変更・関数追加が含意される）に明確に該当する。
- よって docs-only ではなく実装仕様書として作成し、CONST_005 必須項目（変更対象ファイル・関数シグネチャ・入出力・テスト・実行コマンド・DoD）を全 Phase に展開する。

---

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|---------|------|------|
| current branch に実装が存在するか | No | 通常の実装 Phase とする（`implementation_mode: new`） |
| upstream（dev）にマージ済みか | No（新規） | 未マージとして扱う |
| 前提タスク（依存タスク）が完了済みか | Yes（OKLch トークン正本化＝ `ui-prototype-alignment-mvp-recovery` 完了済 / 既存 `ui/` プリミティブ存在） | 既存トークン・プリミティブを土台に新層を構築。依存解消タスク不要 |
| 全件テストが SIGKILL リスクか | 低（apps/web の targeted run で対応） | Phase 4 で対象 spec ファイルを事前列挙 |

---

## 背景（コード調査で確認した現象）

1. ボタン実装が3経路に分裂: `<a data-variant="primary">`（`app/(public)/page.tsx`）/ `.ui-button ui-button-primary`（`LoginCard.tsx`）/ `.ui-button ui-button-ghost`（`EditCta.tsx`）。
2. カード装飾が画面ごとに漂流: padding（Home Stats `18px` hardcoded / Profile `card-pad-lg` / MemberCard implicit）、radius（`--ubm-radius-sm` 8px / `--ubm-radius-2xl` 28px / `--ubm-radius-md` 12px）。
3. カード化漏れ: `page-head`（Home/Members/Register/Profile）・`LegalProse`（`components/legal/LegalProse.tsx`、privacy/terms）・`MemberDetailSections` の `dl`（`components/public/MemberDetailSections.tsx:21-51`）がベタ書き div で、カード枠に収まっていない。
4. 背景・最大幅・余白の指定が各画面に分散（共通の「ページ枠」が無い）。
5. `globals.css` 2715行に feature クラスが直書きで、改善の起点が散逸。

---

## 根本原因（コード調査で確定）

| 現象 | 根本原因 | 該当箇所 |
|------|---------|---------|
| ボタン命名混在 | アンカー型ボタンの正本コンポーネントが無く、各画面が `<a data-variant>` / `.ui-button-*` を直書き | `app/(public)/page.tsx`, `app/(auth)/login/_components/LoginCard.tsx`, `app/(member)/profile/_components/EditCta.tsx` |
| カード装飾漂流 | 「カード枠の正本」コンポーネントが無く、`Card.tsx` は `className` のみ受ける薄いラッパで padding/radius を強制しない | `components/ui/Card.tsx` |
| カード化漏れ | 「情報グループ＝カード」を強制する SectionCard/ContentCard が無い | `components/legal/LegalProse.tsx`, `components/public/MemberDetailSections.tsx` |
| 背景/余白分散 | 「ページ枠（背景・最大幅・縦リズム）の正本」PageShell が無い | 各 `page.tsx` / `layout.tsx` |
| タイポ分散 | 本文タイポの正本 Prose が無く、長文は LegalProse 固有実装 | `components/legal/LegalProse.tsx` |

---

## 要件（スコープ）

### R-1: 共通レイアウトプリミティブ層の新設（Lane A）

`apps/web/src/components/ui/layout/` に以下を新設し、`index.ts` で barrel export（import 経路 `@/components/ui/layout`）:

| プリミティブ | 役割 |
|------------|------|
| `PageShell` | 背景（`data-bg`）・最大幅（`data-max-width`）・縦リズム余白の正本 |
| `PageHeader` | eyebrow + h1（serif）+ lead + actions slot の正本。既存 `page-head` を置換 |
| `SectionCard` | 見出し付きカード枠の正本（title/description/actions/tone/padding） |
| `ContentCard` | 情報1かたまり=1カードの最小単位（heading/media/footer/interactive/href） |
| `Prose` | 本文タイポの正本（privacy/terms/長文の文字統一） |

加えて `apps/web/src/components/ui/ButtonLink.tsx`（アンカー型ボタンの正本、`Button.tsx` と同一の variant/size 体系）を新設。

### R-2: 背景・ボタン・タイポトークンの一本化（Lane A）

- 背景・最大幅・余白の指定を PageShell に集約し、各画面の個別指定を撤去。
- ボタンを `Button`（button要素）/ `ButtonLink`（anchor）の2正本に統一。`data-variant` 直書きと `.ui-button-*` 直書きを撤去。
- 本文タイポを Prose に集約。

### R-3: 全8画面の新層への移行＋全情報のカード化（Lane B / Lane C）

§カード化マッピング表に従い、各画面の情報のかたまりを SectionCard / ContentCard に割当てる。

---

## カード化マッピング表（「全情報を漏れなくカード化」の担保）

> 各画面の情報のかたまりを 1:1 で SectionCard / ContentCard / PageHeader へ割当てる。これが「漏れなくカード」の検証基盤（Phase 10 で全行 traced を確認）。

### `/`（Home, Lane B）

| 情報のかたまり | 現状コンポーネント | 割当先 |
|--------------|------------------|--------|
| ヒーロー | `Hero.tsx`（variant=card） | `SectionCard`（tone=accent, hero 表現） |
| 統計4項目 | `Stats.tsx` | `SectionCard` + `ContentCard`×4（Stat を内包） |
| About UBM | `AboutUbm.tsx`（grid-2） | `SectionCard` + `ContentCard`×2 |
| 注目メンバー | `MemberGrid` + `MemberCard` | `SectionCard` + `MemberCard`（`ContentCard` 基盤に再構成） |
| タイムライン | `Timeline.tsx` | `SectionCard` + `ContentCard` rows |
| CTA | `CallToActionCTA.tsx` | `SectionCard`（tone=accent dark） |

### `/members`（Lane B）

| かたまり | 現状 | 割当先 |
|---------|------|--------|
| ページ見出し+density | `page-head` + DensityToggle | `PageHeader`（actions slot に DensityToggle） |
| 絞り込み | `MemberFilters` | `SectionCard`（subtle） |
| 一覧 | `MemberGrid` / `MemberCard` | `MemberCard`（`ContentCard` 基盤・interactive） |

### `/members/[id]`（Lane B）

| かたまり | 現状 | 割当先 |
|---------|------|--------|
| 戻る導線+見出し | back link | `PageHeader`（lead に戻る導線） |
| プロフィールヒーロー | `ProfileHero` | `SectionCard`（hero） |
| 事業概要 / タグ / リンク | `BusinessOverviewSection` / `MemberTags` / `MemberLinks` | 各 `SectionCard`（grid-2 レイアウト） |
| 自己紹介 / メッセージ | `PersonalSection` / `MessageCard` | 各 `ContentCard` |
| 詳細項目（dl） | `MemberDetailSections`（dl/dt/dd ベタ書き） | `SectionCard` + 既存 `KVList` |
| 活動 | `MemberActivity` | `SectionCard` |

### `/register`（Lane B）

| かたまり | 現状 | 割当先 |
|---------|------|--------|
| 見出し | `page-head`（div） | `PageHeader` |
| 登録案内 | `RegisterCallout`（Card） | `SectionCard` |
| フォームプレビュー | `FormPreviewSections` | `SectionCard` 群（section ごと） |

### `/privacy`・`/terms`（Lane B）

| かたまり | 現状 | 割当先 |
|---------|------|--------|
| 見出し | h1（LegalProse 内） | `PageHeader` |
| 本文 | `LegalProse`（ベタ書き HTML） | `SectionCard` + `Prose` |

### `/profile`（Lane C）

| かたまり | 現状 | 割当先 |
|---------|------|--------|
| 見出し+操作 | `ProfileHeader`（page-head div） | `PageHeader`（actions に EditCta） |
| 写真アップロード | `PhotoUpload` | `SectionCard` |
| ステータス | `StatusBanner` | 既存 `Banner`（カード内 alert として維持） |
| 公開プレビュー | `ProfilePreview`（ui-card hero-split） | `SectionCard`（hero-split） |
| 公開設定/可視性 | `PublicConsentCallout` / `VisibilitySummary` | 各 `SectionCard` |
| 反映タイミング注記 | `ReflectionTimingNote` | `ContentCard`（subtle） |
| プロフィール項目 | `ProfileFields`（Card + KVList） | `SectionCard` + `KVList` |
| 申請操作 | `RequestActionPanel` | `SectionCard`（dialog は維持） |
| 出席履歴 | `AttendanceList` | `SectionCard` |

### `/login`（Lane C）

| かたまり | 現状 | 割当先 |
|---------|------|--------|
| ページ枠 | `LoginShell`（auth-shell） | `PageShell`（bare variant・max-width=narrow） |
| ログインカード | `LoginCard`（Card auth-card） | `SectionCard`（auth）に LoginPanel を内包 |

---

## Acceptance Criteria

| ID | 条件 | 検証 Phase |
|----|------|-----------|
| AC-1 | `components/ui/layout/` に PageShell / PageHeader / SectionCard / ContentCard / Prose / index.ts が新設され、`@/components/ui/layout` から import 可能 | 4,5,7 |
| AC-2 | `components/ui/ButtonLink.tsx` が新設され、`Button.tsx` と同一の variant(`primary`/`accent`/`ghost`/`soft`/`danger`)・size(`sm`/`md`/`lg`) 体系を持つ | 4,5 |
| AC-3 | 対象8画面の `<a data-variant=...>` / `.ui-button-*` 直書きが `Button`/`ButtonLink` 経由に統一され、ボタン直書きが grep で 0 件 | 5,9 |
| AC-4 | カード化マッピング表の全行が SectionCard/ContentCard/PageHeader/既存プリミティブへ移行済み（ベタ書き div の情報グループが 0） | 5,10 |
| AC-5 | 背景・最大幅・余白が PageShell に集約され、各 page/layout の個別背景指定が撤去される | 5,9 |
| AC-6 | privacy/terms 本文が Prose 経由に統一される | 5 |
| AC-7 | 既存 `data-testid` / `aria-label` / `role` が全て保持され、既存 component spec が GREEN（I-7） | 5,6,9 |
| AC-8 | HEX 直書き 0・inline style 0（`pnpm verify:tokens` / `pnpm verify:no-inline-style` PASS） | 9 |
| AC-9 | `apps/api/src/**` への変更が 0 件（`git diff --name-only` で確認） | 9,10 |
| AC-10 | typecheck / lint / build / apps/web vitest が全て GREEN | 9,10 |
| AC-11 | 新プリミティブ5種＋ButtonLink それぞれに component spec（`*.spec.tsx`）が存在し GREEN | 6,7 |
| AC-12 | 8画面の視覚証跡（screenshot）取得計画が Phase 11 に定義される（spec_created では pending） | 11 |

---

## スコープ境界（CONST_007）

- **本サイクルで完結**: Lane A（新層6ファイル）＋ Lane B（公開6画面）＋ Lane C（profile/login 2画面）を1サイクルで完了。規模は大きいが「共通レイアウト層新設＋全画面移行」は分離不能な凝集タスク（B/C は A に依存し、A だけ landed しても価値が出ない）。3レーン分割は**並列実行・関心分離が目的**で先送りではない。
- **out-of-scope inventory（非起票）**: 管理画面（admin）への共通レイアウト層適用は、一般ユーザー非対象かつ別 information architecture を持つため本サイクル外。新層は admin 適用可能な設計にするが、今回の「一般ユーザーが見れる画面・ログインした一般ユーザーが見れる画面」の要件外であり、今回サイクルの未修正改善点としては扱わない（Phase 12 に非起票理由を記録）。
- **本サイクルでやらない**: ダークモード、新 API、D1 schema 変更。

---

## 既存コードベースの命名規則

| 対象 | 規則 | 実例 |
|------|------|------|
| コンポーネントファイル | PascalCase `.tsx` | `Card.tsx`, `MemberCard.tsx` |
| client コンポーネント | `*.client.tsx` suffix | `PhotoUpload.client.tsx` |
| CSS クラス | `.ui-*` prefix（プリミティブ）/ feature 名 prefix | `.ui-card`, `.ui-button-primary`, `.page-head` |
| data 属性 | `data-component` / `data-variant` / `data-size` / `data-density` / `data-tone` | `data-component="member-card"` |
| barrel export | `index.ts` で named export | `components/ui/index.ts` |
| テストファイル | `*.spec.{ts,tsx}`（`*.test.*` 禁止） | `tokens.runtime.spec.ts` |
| props 命名 | camelCase, variant/size/tone/padding 系 | `variant`, `size`, `tone` |

> **新プリミティブの CSS クラス命名**: `.ui-page-shell` / `.ui-page-header` / `.ui-section-card` / `.ui-content-card` / `.ui-prose` / `.ui-button-link`（既存 `.ui-*` 規則に整合）。

---

## 実行タスク

1. カード化マッピング表を正本として確定し、8画面の情報のかたまりを漏れなく列挙する。
2. AC-1..AC-12 を Phase 2 以降へ trace する（各 AC に対応する Phase を明示）。
3. 既存命名規則を新プリミティブの命名へ反映する（`.ui-*` prefix / data 属性）。

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| プロトタイプ | `docs/00-getting-started-manual/claude-design-prototype/styles.css` | トークン値・rhythm 正本 |
| プロトタイプ | `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` / `pages-member.jsx` | レイアウト参照 |
| トークン正本 | `apps/web/src/styles/tokens.css` | OKLch 色・radius・shadow・spacing 変数 |
| トークン仕様 | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | トークン正本ドキュメント |
| 既存プリミティブ | `apps/web/src/components/ui/Card.tsx` / `Button.tsx` / `KVList.tsx` | 新層が合成する土台 |
| CI gate | `apps/web/src/__tests__/tokens.runtime.spec.ts` / `scripts/verify-design-tokens.ts` | トークン検証 |

### システム仕様（aiworkflow-requirements）

| 観点 | 参照先 |
|------|--------|
| UI/UX | `ui-ux-*.md` |
| アーキテクチャ（コンポーネント境界） | `architecture-*.md` |

---


## 成果物

- `phase-1-requirements.md`（AC-1..12 表 / カード化マッピング表 / 既存命名規則 / スコープ境界 / 実装区分判定）

## 統合テスト連携

本タスクは apps/web 表現層の UI 共通化であり、統合観点の検証は apps/web vitest（component spec）と Phase 11 の Playwright screenshot 回帰で行う。apps/api との統合 contract は変更しない（I-1: 既存 endpoint surface のみ・D1 / Form 不変）。各 Phase の成果物は次 Phase の入力へ連結する（AC trace: Phase 1 → 4 → 5 → 9/10 → 11）。

## 完了条件

- [ ] カード化マッピング表が8画面全ての情報のかたまりを網羅している。
- [ ] AC-1..AC-12 が定義され、各 AC の検証 Phase が明示されている。
- [ ] 実装区分が `[実装区分: 実装仕様書]` と判定され根拠が記録されている。
