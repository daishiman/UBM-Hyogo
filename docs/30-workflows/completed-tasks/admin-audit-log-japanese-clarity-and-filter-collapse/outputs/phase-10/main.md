# Phase 10 — 最終レビュー（AC 最終確認 + OOS 確認）

> ステータス: `completed`。AC-1〜AC-12 の spec-level 確認観点と、`_shared-context.md` §8 OOS の扱いを固定する。本ワークフローは `implemented_local_evidence_captured`。focused vitest は PASS、typecheck / lint / token gate と 6 canonical PNG は user-gated final verification。

---

## 1. AC 最終確認表（AC-1〜AC-12）

各 AC に「確認手段」「blocker 判定基準（これを満たさなければ Phase 13 blocked）」「VISUAL screenshot マッピング（該当時）」を割り当てる。本ワークフローは `implemented_local_evidence_captured` のため、確認手段欄は local focused evidence と user-gated final verification を分離して読む。

| AC | 受入条件（要旨） | 確認手段 | blocker 判定基準 | screenshot canonical 名 |
| --- | --- | --- | --- | --- |
| AC-1 | フィルタフォームの全ラベル日本語化・`<input name>`（query param キー）は英語不変 | `AuditLogPanel.component.spec.tsx`（label テキスト + name 属性アサート）+ 視覚証跡 | 英語キー名ラベルが 1 件でも残存 / name 属性が変化 | `audit-filter-collapsed.png` / `audit-page-full.png` |
| AC-2 | フィルタ 2 層（常時 5 項目 / `<details>` 詳細 3 項目）・詳細に値ありで `open` | `AuditLogPanel.component.spec.tsx`（details 段階開示 + open 既定）+ 視覚証跡 | 8 項目フラットのまま / 値ありでも `open` しない | `audit-filter-collapsed.png`（閉）/ `audit-filter-expanded.png`（開） |
| AC-3 | カードの action / targetType 日本語表示・未登録のみ raw fallback | `AuditLogCard.spec.tsx`（describe helper 経由表示 + fallback）+ 視覚証跡 | 生コードが常用表示される / 未登録時に情報欠落する | `audit-timeline-cards-ja.png` |
| AC-4 | 適用チップの label / value 日本語化・英語キー名露出 0 | `auditAppliedFilters.spec.ts`（チップ日本語 + 英語キー名 0）+ 視覚証跡 | チップに英語キー名が 1 件でも残存 | `audit-applied-filters-chips.png` |
| AC-5 | datalist placeholder / `auditId` ラベル等の英語キー名解消 | `AuditLogPanel.component.spec.tsx` / `AuditLogCard.spec.tsx` + 視覚証跡 | placeholder / auditId ラベルに英語キー名が残存 | `audit-timeline-cards-ja.png` |
| AC-6 | glossary SSOT に 3 ラベルマップ + 3 describe helper + raw fallback 追加 | `auditGlossary.spec.ts`（ラベルマップ / helper / fallback） | helper が未登録時に throw / fallback なし | （構造確認・screenshot 非対象） |
| AC-7 | カードブロック整列（chip-row wrap / glossary グリッド / card meta グリッド） | globals.css 構造 + 視覚証跡（desktop / mobile） | チップ行が改行はみ出し / グリッドが画面幅で破綻 | `audit-page-full.png` / `audit-applied-filters-chips.png` / `audit-page-mobile.png` |
| AC-8 | 全色 OKLch トークン経由・HEX/`bg-[#xxx]`/`text-[#xxx]` 0 件 | `verify:tokens` gate + grep | HEX 直書きが 1 件でも検出 | （token gate・screenshot 非対象） |
| AC-9 | API / D1 / Form / shared 型の変更 0 件・query param キー不変 | `git diff --name-only -- apps/api packages/shared`（空）+ name 属性アサート | `apps/api` / `packages/shared` の diff が 1 件でも発生 | （構造確認・screenshot 非対象） |
| AC-10 | 新規 primitive 追加 0 件（既存 + ネイティブ `<details>`） | `components/ui/` diff 確認 | `components/ui/` に新規 primitive 追加 | （構造確認・screenshot 非対象） |
| AC-11 | a11y 維持（label 関連付け / `<details>` キーボード / `aria-label` / WCAG AA） | component spec（aria / role）+ コントラスト確認 | label 関連付け欠落 / `aria-label` 消失 / コントラスト不足 | （a11y 確認・screenshot 補助） |
| AC-12 | 既存挙動温存（検索 / リセット / cursor / PII / JSON / エラー親切化） | 既存 component spec 温存 + 回帰確認 | いずれかの既存機能が回帰 | `audit-page-full.png`（全体回帰確認） |

---

## 2. OOS 確認表（スコープ外 — §8）

`_shared-context.md` §8 の OOS を Phase 12 `unassigned-task-detection.md` の baseline へ申し送る。いずれも本サイクル対象外で、新規 Issue 起票はしない（仕様書作成のみ）。

| # | 内容 | スコープ外の理由 | 扱い |
| --- | --- | --- | --- |
| OOS-1 | CSV エクスポート / total 件数表示 | 先行タスクの Future scope 踏襲・本サイクル対象外 | Phase 12 baseline 候補（未起票） |
| OOS-2 | query param キー名の日本語化 | API 契約のため不可（UI ラベルのみ日本語化） | 対応不能・baseline には恒久制約として記録 |
| OOS-3 | 監査ログ以外の admin 画面の同種改善 | 別タスク | Phase 12 baseline 候補（未起票） |
| OOS-4 | 未登録 action コードの SSOT 網羅 | DB 実データ調査が必要・出現時に未タスク化候補 | Phase 12 baseline 候補（raw fallback で情報欠落は防止済） |

---

## 3. blocker サマリ（Phase 10 時点の判定）

| 区分 | 件数 | 内訳 |
| --- | --- | --- |
| MAJOR blocker | 0 | 設計レビュー（Phase 3）で MAJOR 0 件確定。本 Phase でも新規 MAJOR なし |
| MINOR（非 blocker） | 0 | 表現層 1 サイクルで完結。命名混同なし（`describeAuditField` の name 属性英語維持で API 契約保持） |
| AC 未充足 | 0（spec-level） | spec-level AC は全 PASS 観点。実装・focused test・6 PNG は後続サイクル |

総合: **MAJOR 0 件 / spec-level Go / 実装・visual capture pending（user-gated）**。Phase 13 は commit / PR 承認待ち、かつ screenshot 参照は PNG 取得後に反映する。

---

## 4. Phase 11 への引き継ぎ（AC↔screenshot マッピング）

VISUAL タスクであるため、視覚で確認すべき AC を Phase 11 の screenshot canonical 名へマップ済み（上表「screenshot canonical 名」列）。Phase 11 の `screenshot-plan.json` / `phase11-capture-metadata.json` はこのマッピングと canonical 名（`audit-page-full` / `audit-filter-collapsed` / `audit-filter-expanded` / `audit-timeline-cards-ja` / `audit-applied-filters-chips` / `audit-page-mobile`）を一致させる。
