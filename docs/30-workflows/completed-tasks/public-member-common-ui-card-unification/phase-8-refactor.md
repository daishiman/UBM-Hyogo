---
spec_classification: implementation_spec
state: spec_created
phase: 8
phase_name: リファクタリング
task_id: public-member-common-ui-card-unification
---

# Phase 8: リファクタリング

## メタ情報

| キー | 値 |
|------|----|
| task_id | `public-member-common-ui-card-unification` |
| 対象 | `globals.css` の重複クラス削減 / `LegalProse` の `Prose` 縮退 / 廃止クラス・コンポーネントの整理 / navigation drift 削減 |
| 紐づく AC | AC-4（ベタ書き div 0）/ AC-5（背景 PageShell 集約）/ AC-6（Prose 統一）/ AC-3（ボタン直書き 0） |
| 方針 | 全変更を `対象 / Before / After / 理由` テーブルで記録する [Feedback RT-03] |

---


## 目的

globals.css の重複クラス削減・LegalProse→Prose 縮退・廃止物整理により duplicate と navigation drift を削る。

## リファクタリング記録テーブル（対象 / Before / After / 理由）[Feedback RT-03]

### RT-1: globals.css の重複クラス削減（feature 固有装飾 → `.ui-*` へ寄せる）

| # | 対象 | Before | After | 理由 |
|---|------|--------|-------|------|
| RT-1a | `apps/web/src/styles/globals.css` `.page-head` | `.page-head` で eyebrow/h1/lead/actions の余白・色を feature クラスとして定義 | `.ui-page-header`（`layout-primitives.css`）へ責務移動。`.page-head` は live 参照 0 を grep 確認後に削除 | PageHeader が見出しの正本になり、`.page-head` は重複装飾になる |
| RT-1b | `globals.css` Hero 固有装飾（hero padding/radius） | Home `Hero.tsx` 専用の padding（18px 等）・radius を feature クラスで直書き | `.ui-section-card[data-tone=accent]` + `data-padding` のトークン解決へ寄せる | カード装飾漂流（padding/radius 不統一）の解消（Phase 1 §背景） |
| RT-1c | `globals.css` Stats 固有装飾（`18px` hardcoded padding） | Stats カードの padding が `18px` 直書き | `ContentCard` の `data-padding=md`（`var(--ubm-space-6)`）に寄せる | hardcoded 値の撤去・トークン正本化（I-2） |
| RT-1d | `globals.css` 背景/最大幅指定（各 feature scope） | 各画面 scope で背景・max-width を個別定義 | `.ui-page-shell[data-bg]` / `[data-max-width]` へ集約（AC-5） | 背景・最大幅の正本を PageShell に一本化 |
| RT-1e | `globals.css` `.ui-button-*` の重複定義 | Button 用と各 feature 用に `.ui-button-*` 装飾が分散 | ButtonLink が同一 className（`.ui-button` + `.ui-button-{variant}`）を共有し、定義は1箇所に集約 | ボタン3経路分裂の解消（AC-3） |

> 段階適用ルール: globals.css のクラスは**一度に全削除しない**。新 `.ui-*` クラスを追加 → 各画面を移行（Lane B/C）→ live 参照 0 を grep 確認 → 旧クラス削除、の順で段階適用する。各削除は live import/参照 0 を確認した行のみ実施（[FB-UI-02-1]）。

### RT-2: LegalProse の Prose 縮退

| # | 対象 | Before | After | 理由 |
|---|------|--------|-------|------|
| RT-2a | `apps/web/src/components/legal/LegalProse.tsx` | privacy/terms 本文タイポを独自に実装（h2/h3/p/ul/li 装飾を固有 class で持つ） | `Prose`（`components/ui/layout/Prose.tsx`）を呼ぶ薄いラッパへ縮退、または呼び出し側を直接 `Prose` へ置換 | 本文タイポの正本を Prose に一本化（AC-6） |
| RT-2b | privacy/terms `page.tsx` | `<LegalProse>` を直接利用 | `SectionCard` + `Prose` へ移行（カード化マッピング表 privacy/terms 行） | 本文のカード化（AC-4）+ タイポ統一（AC-6） |

> 縮退方式の選択: (a) `LegalProse` を `Prose` の薄いラッパとして残す（後方互換・既存 import 温存）、または (b) 呼び出し側を `Prose` へ全置換し `LegalProse` を削除。**(b) を既定**とし、`LegalProse` の live import が 0 になったら削除する。spec が `LegalProse` を直接参照する場合は (a) を選び spec 互換を保つ（I-7）。

### RT-3: 廃止クラス / コンポーネントの扱い

| # | 対象 | 扱い | live 参照 0 確認方法 |
|---|------|------|---------------------|
| RT-3a | `LegalProse.tsx` | RT-2 の (b) 採用時は削除 | `grep -rn "import.*LegalProse" apps/web/src` がヒット 0 |
| RT-3b | `.page-head`（CSS クラス） | 全画面が `.ui-page-header` へ移行後に削除 | `grep -rn "page-head" apps/web/app apps/web/src --include='*.tsx'` がヒット 0（CSS 定義ファイル自身は除外） |
| RT-3c | `.ui-button-*` を直書きしていた箇所 | クラス直書きを `Button`/`ButtonLink` 経由へ置換 | `grep -rn "ui-button-" apps/web/app apps/web/src --include='*.tsx'` がコンポーネント外で 0 |
| RT-3d | `data-variant=` 直書き（`<a data-variant>`） | `ButtonLink` 経由へ置換 | Phase 9 のボタン直書き grep（AC-3）で 0 |

> **CSS dead-code grep の鉄則**: dead CSS の参照確認 grep は**定義ファイル自身（`.css`）を必ず除外**する。`--include='*.tsx' --include='*.ts'` で TSX/TS のみに絞らないと、CSS 定義行が自己ヒットして「参照あり」と誤カウントし永久に削除できない（MEMORY 既知教訓）。

### RT-4: 廃止コンポーネントの削除 vs stub 化 PASS 基準 [FB-UI-02-1]

| 判定 | 条件 | 対応 |
|------|------|------|
| **削除** | live import が grep で 0 件、かつ spec も参照しない | ファイルを git delete |
| **stub 化** | spec が直接参照する／後方互換が必要 | 中身を `Prose` 等への薄いラッパに置換（live import は許容するが装飾は持たない） |

> PASS 基準: 「git delete」または「stub 化 + live import 0（装飾の重複 0）」のいずれか。どちらでも「重複装飾が残っていない」ことを最終 PASS とする。

---

## navigation / duplicate drift 削減の対象一覧

| 種別 | 対象 | drift 内容 | 解消 |
|------|------|-----------|------|
| ボタン経路 drift | `app/(public)/page.tsx`（`<a data-variant>`）/ `LoginCard.tsx`（`.ui-button-primary`）/ `EditCta.tsx`（`.ui-button-ghost`） | アンカー型ボタンが3経路で実装分裂 | `ButtonLink` の1経路に統一（AC-3） |
| カード padding drift | Home Stats(`18px`) / Profile(`card-pad-lg`) / MemberCard(implicit) | padding が画面ごと不統一 | `SectionCard`/`ContentCard` の `data-padding` に統一（RT-1b/1c） |
| カード radius drift | sm 8px / md 12px / 2xl 28px が混在 | radius が画面ごと不統一 | 新層が `--ubm-radius-md` を既定で強制 |
| 見出し drift | `.page-head`（Home/Members/Register/Profile で個別） | 見出し構造・余白が画面ごと再実装 | `PageHeader` に統一（RT-1a） |
| 本文タイポ drift | `LegalProse` 固有実装 | privacy/terms のみ独自タイポ | `Prose` に統一（RT-2） |
| 背景/最大幅 drift | 各 page/layout の個別背景指定 | 背景・max-width が分散 | `PageShell` に集約（RT-1d / AC-5） |

---

## リファクタリングの安全弁（既存 spec を壊さない）

- 全リファクタは**機械可読 ID（`data-testid`/`aria-label`/`role`/`data-component`）を保持**する（I-7）。クラス名・装飾の移動に留める。
- globals.css の旧クラス削除は **Lane B/C の画面移行完了後**に行う（移行前に削除すると未移行画面が崩れる）。
- 各 RT 適用後に `mise exec -- pnpm --filter @ubm/web test` を再実行し既存 spec の GREEN を確認する（AC-7）。

---

## 実行タスク

1. RT-1（globals.css 重複クラス削減）を段階適用し、各削除前に CSS dead-code grep（`.css` 除外）で live 参照 0 を確認する。
2. RT-2（LegalProse → Prose 縮退）を (b) 全置換で実施し、`grep -rn "import.*LegalProse" apps/web/src` が 0 になったら `LegalProse.tsx` を削除する。spec 互換が必要なら (a) stub 化に切替える。
3. RT-3/RT-4 の廃止クラス・コンポーネントを「削除 or stub 化 + live import 0」の PASS 基準で整理する。
4. navigation/duplicate drift 一覧を全行解消し、Phase 9（QA grep）へ申し送る。
5. 各 RT 適用後に apps/web vitest を再実行し既存 spec GREEN（AC-7）を確認する。

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| 要件 | `phase-1-requirements.md` | カード化マッピング・AC-3/4/5/6 |
| 設計 | `phase-2-design.md` | CSS 設計・新 `.ui-*` クラス定義 |
| 対象 CSS | `apps/web/src/styles/globals.css` / `apps/web/src/styles/layout-primitives.css` | 重複削減・段階適用先 |
| 対象 component | `apps/web/src/components/legal/LegalProse.tsx` | Prose 縮退対象 |

---


## 成果物

- `phase-8-refactor.md`（対象/Before/After/理由 表 / 廃止物の「削除 OR stub化＋live import 0」基準）

## 統合テスト連携

本タスクは apps/web 表現層の UI 共通化であり、統合観点の検証は apps/web vitest（component spec）と Phase 11 の Playwright screenshot 回帰で行う。apps/api との統合 contract は変更しない（I-1: 既存 endpoint surface のみ・D1 / Form 不変）。各 Phase の成果物は次 Phase の入力へ連結する（AC trace: Phase 1 → 4 → 5 → 9/10 → 11）。

## 完了条件

- [ ] RT-1..RT-4 が `対象/Before/After/理由` テーブルとして記録され、全行が適用済み。
- [ ] `grep -rn "import.*LegalProse" apps/web/src` が 0 件（削除採用時）、または stub 化 + 装飾 0。
- [ ] `.page-head` / `.ui-button-*` 直書き / `data-variant` 直書きが TSX/TS で 0 件（CSS 定義ファイル除外 grep で確認）。
- [ ] navigation/duplicate drift 一覧が全行解消され、各 RT 適用後の既存 spec が GREEN。
