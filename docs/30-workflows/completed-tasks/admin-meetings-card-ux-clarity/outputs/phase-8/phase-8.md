# Phase 8: リファクタリング

**[実装区分: 実装仕様書]**（VISUAL UI task）

## メタ情報

| key | value |
|---|---|
| workflow_id | `admin-meetings-card-ux-clarity` |
| phase | 8 / 13 |
| created_at | 2026-06-10 |
| taskType | implementation |
| 対象 branch | `feat/admin-meetings-card-ux-clarity` |
| 関連 AC | AC-1 / AC-2 / AC-3 / AC-4 / AC-7 |
| 関連 Feedback | RT-03（リファクタリング対象/Before/After/理由 のテーブル化） |
| SSOT | `../../shared-context.md` §5 / §6 / §7 |

## 目的

Phase 5 で実装した表現層改修（F1 globals.css / F2 MeetingAttendanceDrawer.tsx / F3 MeetingTimeline.tsx）に対し、**機能を変えずに重複・未整理を解消**する。本タスクは純粋な表現層（CSS 実体化 + wrapper 付与）改修であり、真因は apps/web 表現層の視覚情報設計欠如である。API / D1 / Google Form は不変（shared-context §4 CONST-1/2）。

リファクタリングの主眼は 2 点:

1. **未定義 BEM の CSS 実体化による inline Tailwind ユーティリティ重複の解消** — マークアップにのみ存在し CSS 実体のなかった `.admin-timeline*` / `.ui-card--flat` / `.admin-meeting-drawer` を実体化し、TSX 側に散在する `flex flex-col gap-*` 等の inline ユーティリティを BEM クラスへ集約する。
2. **既存 `.bulk-attendance*` との余白リズム整合** — 新設 `.admin-detail-section*` / `.admin-attendee-row*` の padding / gap を既存 `.bulk-attendance`（globals.css 198-250）の余白スケールに揃え、`var(--ubm-space-*)` 経由で重複した余白宣言を増やさない。

## 実行タスク

| ID | 内容 | 対象ファイル |
|---|---|---|
| R8-1 | 未定義 BEM の CSS 実体化で inline Tailwind 重複を解消 | F1 globals.css / F2 / F3 |
| R8-2 | `.admin-detail-section` の余白を `.bulk-attendance` のリズムと整合 | F1 globals.css |
| R8-3 | `.admin-attendee-row` 行 chrome を既存 surface token で統一し重複宣言を排除 | F1 globals.css |
| R8-4 | F2/F3 の wrapper 追加が data-testid / aria / role を一切変更しないことを差分確認 | F2 / F3 |

## [RT-03] リファクタリング対象 / Before / After / 理由

| 対象 | Before | After | 理由 |
|---|---|---|---|
| カード列の間隔 | `MeetingTimeline.tsx:31` の `<div class="admin-timeline flex flex-col gap-2">`（inline ユーティリティ・8px・CSS 実体なし） | `.admin-timeline { display:flex; flex-direction:column; gap:var(--ubm-space-3) }`（12px）を globals.css に実体化。TSX は `class="admin-timeline"` のみ | inline ユーティリティと未定義 BEM の二重管理を解消。間隔を 8→12px に強化しカード分離（AC-1）を CSS 正本に集約 |
| フラットカード修飾 | `.ui-card--flat` が CSS 未定義で無効（ブラウザ既定の影/枠なし） | `.ui-card--flat { box-shadow:none; border:1px solid var(--ubm-color-border-default) }` を実体化 | 「くっついている」の直接原因（影なし・境界線なし）を境界線で解消（AC-1）。token 経由で HEX 直書きを増やさない（AC-7） |
| 展開コンテナ | `.admin-meeting-drawer` が CSS 実体なし、TSX に inline `flex flex-col gap-3` | `.admin-meeting-drawer { display:flex; flex-direction:column; gap:var(--ubm-space-3); padding:var(--ubm-space-4); border-top; background:var(--ubm-color-surface-panel-2) }` を実体化、TSX は class のみ | ヘッダと展開部の視覚分離（AC-3）を CSS に集約。inline gap 重複を排除 |
| 展開内 4 セクションの境界 | `MeetingAttendanceDrawer.tsx:51-169` で弱い gap のみ・見出し/境界なし | `.admin-detail-section`（border + radius + `var(--ubm-color-surface-panel)`）でサブカード化。padding は `.bulk-attendance` と同一スケール（`var(--ubm-space-3)`） | セクション境界の欠如（AC-3）を共通 primitive で解消。`.bulk-attendance` と余白リズムを統一し二重定義を回避 |
| 出席者行 | `MeetingAttendanceDrawer.tsx:143-164` の `flex items-center gap-2`（行 chrome なし） | `.admin-attendee-row`（`justify-content:space-between` + padding + radius + `var(--ubm-color-surface-bg)`）へ集約 | 行区切りの欠如（AC-4）を解消。inline ユーティリティを BEM へ集約し可読性を上げる |
| 出席者氏名ラッパー | 氏名が裸テキスト（min-width 制御なし） | `.admin-attendee-row__name`（`min-width:0` で省略安全） | 長い氏名のレイアウト崩れを防ぐ小さな構造改善。data-testid 不変 |

> Before/After とも **data-testid / aria-label / role / `<select>` / `<button>` / `<input>` は不変**。変更は wrapper 追加・className 付与・見出し追加・表示テキストの軽微調整に限定する（shared-context §4 CONST-5）。

## 参照資料

- `../../shared-context.md` §5（変更対象ファイル）/ §6（CSS 契約）/ §7（DOM 改修詳細）
- `../phase-2/phase-2.md`（設計確定・AC ↔ CSS 対応）
- `../phase-5/phase-5.md`（実装差分・リファクタの起点）
- `apps/web/src/styles/globals.css` 198-250（既存 `.bulk-attendance*` の余白スケール正本）
- `apps/web/src/styles/tokens.css`（`var(--ubm-space-*)` / `var(--ubm-color-surface-*)` 正本）

## 実行手順

1. globals.css の `.bulk-attendance*` 規則（198-250）を読み、padding / gap に使われている `var(--ubm-space-*)` を採取する。
2. 新設 `.admin-detail-section` / `.admin-attendee-row` の padding / gap を同一 token スケールに合わせ、リズム差異を除去する。
3. F2/F3 の TSX から inline `flex flex-col gap-*` 等のユーティリティを実体化済み BEM クラスへ置換する（DOM 構造・testid は不変）。
4. `git diff -- apps/web/src/features/admin/components/_meetings` の `data-testid` 差分を確認し、wrapper移動で出た削除IDが追加後にも存在することを確認する。
5. 重複 CSS 宣言（同一プロパティの二重宣言・未使用セレクタ）が無いか globals.css の該当ブロックを目視確認する。

```bash
# data-testid contract が保持されていること（wrapper移動で削除/追加扱いになるIDの集合を確認）
git diff -- apps/web/src/features/admin/components/_meetings \
  | grep '^[-+].*data-testid'

# inline Tailwind 余白ユーティリティが _meetings TSX から減っていること
git diff -- apps/web/src/features/admin/components/_meetings \
  | grep -E '^[-+].*(flex flex-col gap-|gap-2|gap-3)'
```

## 統合テスト連携

- リファクタリング後も `MeetingAttendanceDrawer.spec.tsx` / `MeetingTimeline.spec.tsx` / `MeetingsClientShell.spec.tsx` / `BulkAttendanceChecklist.spec.tsx` の既存 4 spec が全 PASS であること（構造検証ベースライン）。
- Phase 4 で設計した追加ケース DR-1〜DR-3 / TL-1 が GREEN を維持すること。
- jsdom は CSS/@media を評価しないため、余白整合（R8-2/R8-3）の視覚効果は Phase 11 staging screenshot（user-gated）で人手検証する。

## 多角的チェック観点（AIが判断）

- **重複排除 vs 過度な抽象化**: 共通 primitive（`.admin-detail-section` / `.admin-attendee-row`）は最小限のみ新設し、`/admin/meetings` 以外への DOM 適用は OOS-1（別タスク）に切り出す（shared-context §11）。今回スコープで primitive を増やしすぎない（invariant #3）。
- **余白リズムの単一正本**: padding/gap が `var(--ubm-space-*)` 以外のリテラル px に退化していないか。
- **contract 退化の検知**: wrapper 追加で testid/aria/role が `-` 行に出ていないか（grep gate）。
- **token 退化の検知**: リファクタで HEX / `bg-[#xxx]` / `text-[#xxx]` が混入していないか（AC-7・Phase 9 で grep）。

## サブタスク管理

| ID | 状態 | 完了条件 |
|---|---|---|
| R8-1 | 仕様確定 | inline 余白ユーティリティが実体化 BEM へ集約され diff で減少 |
| R8-2 | 仕様確定 | `.admin-detail-section` の余白が `.bulk-attendance` と同一 token スケール |
| R8-3 | 仕様確定 | `.admin-attendee-row` が surface token で統一・重複宣言 0 |
| R8-4 | 仕様確定 | testid/aria/role の `-` 行 0 件（grep） |

## 成果物

- リファクタリング適用済み `apps/web/src/styles/globals.css`（F1）
- inline ユーティリティを BEM へ集約した F2 / F3 TSX
- 本 Phase 8 仕様書（リファクタ対象/Before/After/理由テーブル）

## 完了条件

- [ ] [RT-03] テーブルの全対象が Before/After/理由付きで記述されている
- [ ] inline Tailwind 余白ユーティリティが実体化 BEM へ集約されている
- [ ] `.admin-detail-section` / `.admin-attendee-row` の余白が `.bulk-attendance` リズムと整合
- [ ] `git diff dev -- _meetings | grep '^-' | grep -c data-testid` が 0
- [ ] 既存 4 spec + 追加ケースが全 PASS（regression 0）
- [ ] HEX / `bg-[#xxx]` / `text-[#xxx]` 0 件（AC-7 維持）

## タスク100%実行確認【必須】

- [ ] RT-03 リファクタ対象テーブルが Before/After/理由 3 列で完備
- [ ] 重複 CSS 削減（余白リズム整合）の観点が記述済み
- [ ] 未定義 BEM 実体化による inline ユーティリティ重複解消の観点が記述済み
- [ ] contract 保持（testid/aria/role 不変）の検証コマンドを明記
- [ ] API/D1/Form 不変（CONST）に反するリファクタを含まない

## 次Phase

- `../phase-9/phase-9.md`（品質保証 — line budget / link / token parity / HEX 0 / apps/api diff 空 / 既存 4 spec PASS）
