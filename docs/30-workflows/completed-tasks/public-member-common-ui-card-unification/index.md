---
task_id: public-member-common-ui-card-unification
spec_classification: implementation_spec
state: spec_created
created_at: 2026-06-10
task_type: implementation
visual_category: VISUAL
implementation_mode: new
parent_workflow: null
source_request: ユーザー直接依頼
branch: docs/public-member-common-ui-card-unification-spec
---

# 公開層・会員層 共通UIカード化／共通レイアウト層 新設 タスク仕様書

- **実装区分: `[実装区分: 実装仕様書]`**（CONST_004: コード変更が目的達成に必須。判定根拠は `phase-1-requirements.md` §実装区分の判定根拠）
- taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `new`
- workflow_state: `spec_created`（仕様書作成のみ。実装・commit・PR はユーザー明示承認後）

---

## 1. 背景 / 元依頼

ユーザー依頼（原文要約）:

> 一般ユーザーが見れる画面・ログインした一般ユーザーが見れる画面で、**全ての内容を共通化**しておいてほしい。カード・背景・ボタンなど、この辺りを全て共通点として満たせる仕様にする。**全ての内容を漏れなくカード**にしておく。共通化しておくことで、今後改善する際にそれを元に改善ができる。**文字・UI・UX を反映させるものは全て共通化**しておく。

### 現状の問題（コード調査で確定）

| 観点 | 現状 | 問題 |
|------|------|------|
| UIプリミティブ | `apps/web/src/components/ui/`（Card/Button/Badge/Avatar/Icon/Banner/KVList/Stat）は高度に共通化済み | プリミティブ単体は揃うが、**ページ・セクション・背景・余白の「組み立ての正本」が無い** |
| ボタン | `<a data-variant="primary">`（Home）と `.ui-button-primary` class（Login）と `.ui-button-ghost`（Profile）が混在 | 命名・実装経路がバラバラで横断改善ができない |
| カード | padding（hardcoded 18px / `card-pad-lg` / implicit）・radius（sm 8px / md 12px / 2xl 28px）が画面ごと不統一 | 「カードの正本」が無く、画面ごとに装飾が漂流 |
| カード化漏れ | `page-head`・`LegalProse`（privacy/terms）・`MemberDetailSections` の `dl` 等が**ベタ書き div** | 「全情報をカードで」を満たせていない |
| 背景 | 各画面が個別に背景・最大幅・余白を指定 | 背景／レイアウトの正本が分散 |
| CSS凝集 | `globals.css` 2715行に feature クラス直書き | 改善の起点が散逸 |

### 真の論点

公開層＋会員層＋login の **8画面**が、カード／ボタン／背景／タイポを**共通の正本プリミティブ層を経由せず**画面ごとに実装している。今後の横断的改善（デザイン刷新・トークン調整・a11y向上）の**単一の土台（single source of truth）が存在しない**ことが主問題。

---

## 2. ゴール

`apps/web/src/components/ui/layout/` に**共通レイアウトプリミティブ層**を新設し、対象8画面の「ページ枠・見出し・情報のかたまり・背景・余白・ボタン」を全てこの層へ載せ替える。全情報のかたまりを**カード（SectionCard / ContentCard）**で表現し、今後の改善が必ずこの層を起点に行えるようにする。

新設プリミティブ（正本）:

| プリミティブ | 責務 | 新規ファイル |
|------------|------|------------|
| `PageShell` | 背景・最大幅・縦リズム余白の正本 | `apps/web/src/components/ui/layout/PageShell.tsx` |
| `PageHeader` | eyebrow + h1(serif) + lead + actions の正本（既存 `page-head` を置換） | `apps/web/src/components/ui/layout/PageHeader.tsx` |
| `SectionCard` | 見出し付きカード枠の正本（情報グループ単位） | `apps/web/src/components/ui/layout/SectionCard.tsx` |
| `ContentCard` | 情報1かたまり = 1カードの最小単位（MemberCard 等の基盤） | `apps/web/src/components/ui/layout/ContentCard.tsx` |
| `Prose` | 本文タイポの正本（privacy/terms/長文の文字統一） | `apps/web/src/components/ui/layout/Prose.tsx` |
| `ButtonLink` | アンカー型ボタンの正本（`<a data-variant>` を一本化） | `apps/web/src/components/ui/ButtonLink.tsx` |

---

## 3. 3レーン構成（並列実行・関心分離 / CONST_007: 全レーンを1サイクルで完了）

| レーン | 責務 | 主担当ファイル | Phase 5 依存 |
|--------|------|--------------|-------------|
| **Lane A（基盤）** | 共通レイアウト層の新設 + Button 一本化（ButtonLink）+ globals.css/tokens 整理 | `components/ui/layout/*`, `components/ui/ButtonLink.tsx`, `styles/globals.css` | 先行（B/C の前提） |
| **Lane B（公開層適用）** | `/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms` を新層へ移行 | `app/(public)/**` | Lane A 完了後 |
| **Lane C（会員＋認証適用）** | `/profile`, `/login` を新層へ移行 | `app/(member)/profile/**`, `app/(auth)/login/**` | Lane A 完了後（B と並列可） |

> Phase 5 実装順序: **Lane A → (Lane B ‖ Lane C)**。Lane A の公開 API（props 型・data 属性・CSS クラス）が確定するまで B/C は着手しない。

---

## 4. スコープ（対象8画面）

| 層 | ルート | page.tsx |
|----|--------|----------|
| 公開 | `/` | `apps/web/app/(public)/page.tsx` |
| 公開 | `/members` | `apps/web/app/(public)/members/page.tsx` |
| 公開 | `/members/[id]` | `apps/web/app/(public)/members/[id]/page.tsx` |
| 公開 | `/register` | `apps/web/app/(public)/register/page.tsx` |
| 公開 | `/privacy` | `apps/web/app/(public)/privacy/page.tsx` |
| 公開 | `/terms` | `apps/web/app/(public)/terms/page.tsx` |
| 会員 | `/profile` | `apps/web/app/(member)/profile/page.tsx` |
| 認証 | `/login` | `apps/web/app/(auth)/login/page.tsx` |

画面別「情報のかたまり → カード割当」マッピングは `phase-1-requirements.md` §カード化マッピング表に網羅（「全情報を漏れなくカード化」の担保）。

### スコープ外（明示）

- 管理画面（`/(admin)/**`）— 一般ユーザー非対象。共通レイアウト層は将来 admin にも適用可能な設計にするが、本サイクルでは適用しない。
- 新 API endpoint 追加・D1 schema 変更・Google Form 仕様変更（既存 surface のみ利用）。
- ダークモード対応（MVP 非対象）。

---

## 5. Phase 一覧

| Phase | ファイル | 状態 |
|-------|---------|------|
| 1 要件定義 | `phase-1-requirements.md` | spec_created |
| 2 設計 | `phase-2-design.md` | spec_created |
| 3 設計レビュー | `phase-3-design-review.md` | spec_created |
| 4 テスト作成 | `phase-4-test-plan.md` | spec_created |
| 5 実装 | `phase-5-implementation.md` | spec_created |
| 6 テスト拡充 | `phase-6-test-additions.md` | spec_created |
| 7 カバレッジ確認 | `phase-7-coverage.md` | spec_created |
| 8 リファクタリング | `phase-8-refactor.md` | spec_created |
| 9 品質保証 | `phase-9-qa.md` | spec_created |
| 10 最終レビュー | `phase-10-final-review.md` | spec_created |
| 11 手動テスト/視覚証跡 | `phase-11-manual-test.md` | spec_created（screenshot pending） |
| 12 ドキュメント更新 | `phase-12-documentation.md` | spec_created |
| 13 PR作成 | `phase-13-pr.md` | spec_created（user-gated） |

---

## 6. 不変条件（I-1..I-10）

1. **I-1 既存 API のみ接続**: `apps/api/src/routes/` 配下の現行 endpoint surface のみ利用。新 endpoint・D1 schema・Form 仕様変更は禁止。
2. **I-2 OKLch トークン正本化**: 色は `apps/web/src/styles/tokens.css` と `docs/00-getting-started-manual/specs/09b-design-tokens.md` が正本。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。`pnpm verify:tokens` で fail 判定。
3. **I-3 inline style 禁止**: `pnpm verify:no-inline-style` gate に通す。スタイルは CSS クラス（`.ui-*`）＋ data 属性で表現。
4. **I-4 プロトタイプ正本順位**: `docs/00-getting-started-manual/claude-design-prototype/` の primitives + tokens + rhythm をデザイン言語の正本とする。新設する layout 層は**新しいデザイン言語 primitive を生やすのではなく**、既存 `ui/` プリミティブ + tokens を束ねる「組み立ての正本」として位置づける。
4. **I-5 D1 直接アクセス禁止**: `apps/web` から D1 binding を参照しない（既存条件継続）。
5. **I-6 env アクセサ経由**: `apps/web` の env 参照は `apps/web/src/lib/env.ts` のアクセサ経由のみ。
6. **I-7 機械可読 ID 不変**: 既存の `data-testid` / `aria-label` / `role` を移行で壊さない（テスト互換維持）。表示テキスト・配置・装飾の変更に留め、テスト用 selector は保持する。
7. **I-8 FormField 経由**: フォーム入力は既存 `FormField` 経由を標準とし、`<input>` を新規に増やさない。
8. **I-9 新規テストは `*.spec.{ts,tsx}` のみ**（`*.test.*` は禁止）。
9. **I-10 1サイクル完了**: Lane A/B/C は後続実装プロンプト（03.実装.md）の1サイクルで完了させる。先送り（別PR・将来タスク）はしない（CONST_007）。

---

## 7. 検証コマンド（全 Phase 共通）

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint            # verify:no-inline-style / boundaries 含む
mise exec -- pnpm verify:tokens   # OKLch トークン正本 + HEX 直書き検査
mise exec -- pnpm --filter @ubm/web test    # apps/web vitest（新プリミティブ spec 含む）
mise exec -- pnpm build           # OpenNext Workers 互換 webpack build
```

---

## 8. 関連 / 参照

- プロトタイプ: `docs/00-getting-started-manual/claude-design-prototype/`（styles.css / primitives.jsx / pages-public.jsx / pages-member.jsx）
- デザイントークン正本: `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/09b-design-tokens.md`
- 既存 UI プリミティブ: `apps/web/src/components/ui/`（Card.tsx / Button.tsx / Badge.tsx / Avatar.tsx / KVList.tsx ほか）
- 上位ワークフロー: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/`（OKLch トークン正本化・プロトタイプ整合の親方針）
