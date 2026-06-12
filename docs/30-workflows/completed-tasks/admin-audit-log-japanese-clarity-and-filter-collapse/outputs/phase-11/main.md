# Phase 11 — 手動テスト / 視覚証跡 総括（VISUAL）

> ステータス: `runtime_pending`（capture user-gated） / visualScope=`VISUAL` / visualEvidence=`VISUAL`。apps/web 実装と focused Vitest は完了。6 canonical PNG は staging authenticated capture として user-gated。

---

## 1. VISUAL 宣言

- 対象 route: `/admin/audit`（admin 認証必須）。
- UI 変更（フォームラベル日本語化・2 層段階開示・カード整列）を含むため **VISUAL**。screenshot 必須。
- capture runtime: staging 認証済み admin 画面の Playwright。**user-gated**（実装完了 + staging deploy + admin bearer mint が前提）。
- **[Feedback BEFORE-QUIT-001]**: staging authenticated capture は deploy / bearer mint を伴うため user-gated。実画像・runtime artifact を擬似生成しない（FB-MSO-003）。

## 2. 3 層評価構造

| 層 | 観点 | 確認内容 |
| --- | --- | --- |
| Semantic | 構造・機能 | `<input name>`（query param キー）が英語維持（API 契約）、`<details>`/`<summary>` キーボード操作、`FormField` label-input 関連付け、適用フィルタ `aria-label="現在の絞り込み条件"` 維持、cursor ページネーション / PII マスク / JSON 開示の温存 |
| Visual | 見た目・token | フォームラベル・カード・チップが日本語（英語キー名露出 0）、`.chip-row` の `flex-wrap` 整列、`.admin-audit-glossary` グリッド整列、`.admin-audit-card__meta` truncate 安全、`.admin-audit-filter-advanced`（details）スタイル、OKLch トークンのみ、mobile 1 カラム成立 |
| AI UX | ユーザー体験 | 非エンジニアが「いつ・誰が・何を操作したか」を日本語で一目把握、よく使う絞り込みが前面で初見負荷が下がる、詳細条件が引き出しに格納され必要時のみ展開 |

## 3. capture 対象 6 screenshot（canonical 名）

| # | canonical 名 | tc | viewport | 検証 AC |
| --- | --- | --- | --- | --- |
| ① | `audit-page-full.png` | TC-11-1 | desktop | AC-1 / AC-4 / AC-7 |
| ② | `audit-filter-collapsed.png` | TC-11-2 | desktop | AC-1 / AC-2 |
| ③ | `audit-filter-expanded.png` | TC-11-3 | desktop | AC-2 |
| ④ | `audit-timeline-cards-ja.png` | TC-11-4 | desktop | AC-3 / AC-5 / AC-7 |
| ⑤ | `audit-applied-filters-chips.png` | TC-11-5 | desktop | AC-4 / AC-7 |
| ⑥ | `audit-page-mobile.png` | TC-11-6 | mobile | AC-7 |

> canonical 名は `screenshot-plan.json` と `phase11-capture-metadata.json` で完全一致（命名一貫性厳守）。

## 4. capture script 契約（FB-MSO-003）

実 capture script は `try { ... } finally { browser.close(); server.close(); }` を厳守する。finally ブロックを省略しない。詳細は phase-11.md §11.3。

## 5. 証跡の主ソース

| ソース | 内容 |
| --- | --- |
| VISUAL screenshot | 上記 6 枚（未取得。`outputs/phase-11/screenshots/` に PNG 0 件） |
| 自動テスト（実装サイクル） | `auditGlossary.spec.ts` / `auditAppliedFilters.spec.ts` / `AuditLogPanel.component.spec.tsx` / `AuditLogCard.spec.tsx`（_shared-context §9 のコマンドで実行予定） |

## 6. user-gated 境界

- コード実装 / staging deploy / admin bearer mint / 実 capture（6 枚）は user 承認後のみ。
- local focused evidence は present。認証済み runtime capture が未取得のため visual evidence は pending。

## 7. discovered-issues サマリ

- current（本サイクル発見）: 0 件（local focused evidence で新規 blocker なし。staging visual 起因の発見は capture 後に判定）。
- baseline（既知 OOS）: §8 OOS-1〜OOS-4 を `discovered-issues.md` §2 に再掲。
