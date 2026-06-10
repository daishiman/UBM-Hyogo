# Phase 11: UI サニティ / 3層ビジュアルレビュー（spec）— VISUAL

> **宣言**: 本タスクは **VISUAL かつ `workflow_state=implemented_local_runtime_pending`**。認証済み runtime capture は user-gated のため
> Phase 11 screenshot は **0 PNG（status=pending_runtime_visual）**。本ファイルはuser-gated 撮影の
> レビュー観点（Apple HIG / 3 層評価）を計画として記録する。主証跡は focused vitest（`manual-test-result.md`）。

## VISUAL 宣言

本タスクは **VISUAL タスク**である（`NON_VISUAL` ではない）。ただし VISUAL なのは **Lane D のみ**。

- **タスク種別**: VISUAL（Lane D = admin member field editor + 公開/会員 merged 表示。Lane A/B/C/E は NON_VISUAL backend）
- **視覚変化の内容**:
  - admin 会員詳細にプロフィールフィールド編集 UI（`MemberFieldEditor`）が新設され、L1 override を編集・保存できる。
  - 公開一覧 `/members`・公開詳細 `/members/[id]`・マイページ `/profile` が L1>L2/L3 の **merged projection** を表示する（外形 shape 不変・中身の解決規則のみ変化）。
  - `/profile` の会員未登録ユーザー（管理者等）が汎用「セッション取得不能」ではなく**会員専用案内**へ倒れる。
- **capture 対象 route**: `/(admin)/admin/members/[id]`, `/(public)/members`, `/(public)/members/[id]`, `/profile`
- **対象 component**: `apps/web/src/components/admin/MemberFieldEditor.tsx`（新規・`FormField` + `useAdminMutation` 経由）, profile page, 公開一覧/詳細
- **証跡**: tier1 = local jsdom render + focused vitest、tier2 = local Playwright screenshot（user-gated・**本サイクル未取得**）。

## Apple HIG / motion 観点（計画）

| HIG 観点 | 内容 | 対応 |
|----------|------|------|
| 一貫性 | field editor は既存 `FormField` primitive のみで構成し新規 primitive を生やさない（不変条件 #3/#9）。色は OKLch トークン・HEX 直書き 0 | editor #1/#2 |
| 予測可能性 | 「編集→保存→確定（再同期で消えない）」「同期値に戻す（value=null）」が直感的に理解できる | editor #2 |
| フィードバックの明確さ | 保存成功で `source=override` が反映され、effective 値が即更新される（`useAdminMutation` invalidate） | editor #2 |
| 詰まらせない | /profile の会員未登録ユーザーに公開導線付き案内を出し、汎用エラーや redirect ループで詰まらせない | profile #6 |

## 3 層評価観点（計画）

### 1. Semantic（意味・構造）

| 観点 | 内容 | 対応 screenshot（計画） |
|------|------|------------------------|
| override の意味 | 編集値が「確定編集（L1）」として保存され `source=override` で表示。`FormField` の label/role が正しい | #1・#2 |
| merged projection の構造 | 公開/会員表示が override>response の merged 値を表示し、レスポンス外形 shape（item keys）は不変 | #3・#4・#5 |
| /profile 分岐の意味 | 会員未登録（管理者等）が「会員専用ページ」案内へ倒れ、401→login ループに陥らない | #6 |

### 2. Visual（視覚）

| 観点 | 内容 | 対応 screenshot（計画） |
|------|------|------------------------|
| OKLch トークン整合 | `var(--ubm-color-*)` のみ使用・HEX 直書き / `bg-[#xxx]` / inline style 無し（`verify-design-tokens` gate 準拠） | 全 |
| レイアウト崩れなし | field editor の `FormField` 群が既存 admin 詳細レイアウトに収まり崩れない | #1・#2 |
| 表示一貫性 | 公開一覧カード/詳細/profile が merged 値でも既存レイアウトを維持 | #3・#4・#5 |

### 3. AI-UX（操作体感）

| 観点 | 内容 | 対応 screenshot（計画） |
|------|------|------------------------|
| 編集→確定の体感 | 上書き保存後「同期で消えない」安心感。「同期値に戻す」で復帰できる | #2 |
| データ反映の体感 | スプレッドシート/Form の会員が公開一覧に出る（取込回復）+ override で確定表示 | #3 |
| /profile 体感 | 会員は自分の merged プロフィールが見え、未登録ユーザーは詰まらず案内される | #5・#6 |

## capture 計画（status=pending_runtime_visual・user-gated）

| # | route | canonical 名（`<component>-<state>.png`） | state |
|---|-------|--------------------------------------------|-------|
| 1 | `/(admin)/admin/members/[id]` | `member-field-editor-edit.png` | フィールド編集中（dirty） |
| 2 | `/(admin)/admin/members/[id]` | `member-field-editor-saved.png` | override 保存後（source=override） |
| 3 | `/(public)/members` | `public-members-list-merged.png` | merged 値で一覧表示・外形不変 |
| 4 | `/(public)/members/[id]` | `public-member-detail-merged.png` | merged 値で詳細表示 |
| 5 | `/profile` | `profile-merged-self-view.png` | 本人の merged プロフィール |
| 6 | `/profile` | `profile-unregistered-guidance.png` | 会員未登録ユーザーへの案内（詰まらない） |

## レビュー判定枠（user-gated に記入）

| 層 | 判定 | 所見 |
|----|------|------|
| Semantic | （実装後記入） | override / merged / 分岐の意味整合 |
| Visual | （実装後記入） | OKLch トークンのみ・layout 不崩れ |
| AI-UX | （実装後記入） | 編集確定の体感・取込回復・/profile 詰まらない |

## 判定（spec）

**GATE: ビジュアルレビュー観点 PASS（spec）** — VISUAL タスクとして Apple HIG 観点と 3 層評価観点を
capture 計画（6 PNG）と対応付けて確認した。実 PNG は **0 枚（pending_runtime_visual）**・実体化はuser-gated。
