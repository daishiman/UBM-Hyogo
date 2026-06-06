# Phase 11: Manual Test（VISUAL）

> issue #1078「BulkActionBar tag picker 大規模 catalog UX 改善 + tag master read contract 修正」
> タスク種別: **VISUAL_ON_EXECUTION**（BulkActionBar の UI を変えるため screenshot 対象）
> 段階: **implemented_local_evidence_captured** — local deterministic evidence は取得済み。実 screenshot 取得は staging 認証必須・user-gated。

---

## 1. VISUAL 宣言

| 項目 | 値 |
| --- | --- |
| タスク種別 | `VISUAL_ON_EXECUTION` |
| 視覚的理由 | BulkActionBar の tag picker に検索ボックス / 折りたたみ / max-height スクロール / 選択中固定行 / pagination を追加し、見た目と DOM 構造を変更する。さらに root-cause（contract バグ）修正により、これまで空だった picker に tag が描画されるようになる（描画結果そのものが回帰対象）。 |
| 影響範囲 | `apps/web` のみ（`apps/api` 非変更）。`/admin/members` 画面の BulkActionBar コンポーネント。 |
| screenshot 配置 | `outputs/phase-11/screenshots/` 配下 |

> root-cause: `fetchTagMaster` が `/api/admin/tags` の `{ total, items }` レスポンスを `{ available }` として誤読していた（`apps/web/src/features/admin/api/members.ts`）。実コードでは `r.available` が常に `undefined` となり、picker が無言で空になっていた。AC-0 はこの contract を `{ total, items }` 正本へ修正する。

---

## 2. canonical screenshot 名（固定）

`<component>-<state>.png` 形。本書 / `outputs/phase-11/manual-test-result.md` / `outputs/phase-12/implementation-guide.md` の3箇所で完全一致させる（FB-LLM-MOD-05-001）。

| # | canonical 名 | 状態 | 検証する AC |
| --- | --- | --- | --- |
| S-1 | `bulk-tag-picker-large-catalog-collapsed.png` | 大規模 catalog（60 tag）読み込み後の初期表示。COLLAPSE_THRESHOLD 超過で折りたたみ状態、max-height スクロール領域が見える。 | AC-0 / AC-2 / AC-3 |
| S-2 | `bulk-tag-picker-search-filtered.png` | 検索ボックスにキーワードを入力し、debounce 後に該当 tag のみ絞り込まれた状態。 | AC-1 |
| S-3 | `bulk-tag-picker-selected-pinned.png` | スクロール領域外にある tag を複数選択し、選択中行がリスト先頭に固定（pinned）表示された状態。 | AC-4 |
| S-4 | `bulk-tag-picker-mobile-sticky.png` | モバイル幅（375px 相当）で BulkActionBar が sticky 表示され、picker が縦スクロール内に収まる状態。 | AC-2 / AC-3 / AC-5 |

> 注: 追加 state（pagination「もっと読み込む」操作後）の screenshot を増やす場合も、必ず本表へ canonical 名を追記し、3箇所同期を維持すること。

---

## 3. 3層評価の観点表

| 層 | 観点 | 合格条件 |
| --- | --- | --- |
| **Semantic（意味）** | DOM / アクセシビリティ構造が正しいか | 検索入力に `aria-label`、picker scroll 領域が `role` / ラベル付き、選択中固定行が視覚順だけでなく DOM 順でも先頭にあること。`bulk-tag-result` 系 testid（既存）が回帰していないこと。 |
| **Visual（視覚）** | OKLch トークン整合・余白リズム・崩れの有無 | 色は `apps/web/src/styles/tokens.css` 由来の `var(--ubm-*)` のみ（HEX 直書き / `bg-[#xxx]` 禁止、`verify-design-tokens` gate 準拠）。max-height 超過時にスクロールバーが出て BulkActionBar 自体が画面外へ伸びないこと。モバイルで sticky bottom が機能すること。 |
| **AI UX（体験）** | 60 tag でも目的の tag に到達できるか | 検索で即座に絞り込める／折りたたみで初期スクロール量が抑えられる／選択した tag が固定行で常に見えるため「選んだはずが見失う」が起きないこと。 |

---

## 4. large fixture（60 tag）検証手順

local 実装サイクルで以下の contract / DOM 検証を実行済み。staging screenshot は user-gated として残る。

### 4.1 fixture
- 60 件の tag を持つ catalog を用意する。`/api/admin/tags` のレスポンス形（`{ total: 60, items: [{ tagId, code, label, category, active }, ...] }`）に一致させる。
- category は複数（例: 3〜5 種）に分散させ、グルーピングと折りたたみ閾値（COLLAPSE_THRESHOLD）の両方が発火する分布にする。
- pagination 確認用に `pageSize`（TAG_PAGE_SIZE_MAX）を跨ぐ件数（>50）を含める。

### 4.2 desktop（幅 1280px 相当）
1. `/admin/members` を開き、会員を 1 件以上選択して BulkActionBar を表示。
2. tag picker が空でないこと（contract 修正の回帰確認）を目視 → **S-1** 撮影（折りたたみ + max-height）。
3. 検索ボックスにキーワードを入力 → debounce 後に絞り込み → **S-2** 撮影。
4. スクロール下方の tag を複数選択 → 選択中行が先頭固定されることを確認 → **S-3** 撮影。
5. pagination がある場合「もっと読み込む」を操作し、`fetchAllTagMaster` による全件取得（cap 到達時の打ち切り含む）を確認。

### 4.3 mobile（幅 375px 相当）
1. 同 fixture でモバイル幅に切替。
2. BulkActionBar が sticky で画面下に固定、picker が max-height 内スクロールに収まることを確認 → **S-4** 撮影。

---

## 5. capture script 方針

screenshot 取得スクリプトは必ずリソース解放を保証する構造にする（FB-MSO-003）:

```js
const browser = await chromium.launch();
const server = await startStaticServer();
try {
  // ページ遷移・操作・page.screenshot({ path: "outputs/phase-11/screenshots/<canonical>.png" })
} finally {
  await browser.close();
  await server.close();
}
```

`try { ... } finally { browser.close(); server.close(); }` を逸脱しない（途中失敗時のプロセスリーク防止）。

---

## 6. 実 screenshot の取得境界（user-gated）

- 実 screenshot 取得は **staging 認証が必須**（`/admin/*` は admin セッション境界）であり、**user の明示承認後にのみ実行**する。
- local deterministic evidence は取得済み。`outputs/phase-11/screenshots/` 配下の staging 実画像は **未取得**。
- したがって本書の screenshot 列は「user 承認後に撮影する canonical 名」であり、撮影済みではない。

### 代替の自動テスト証跡（local 実測済み）

| 証跡 | パス | 主目的 |
| --- | --- | --- |
| `BulkActionBar.spec.tsx` | `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | contract 修正（`{ total, items }` を正しく読む）後に picker が tag を描画すること、検索 / 折りたたみ / 選択中固定 / pagination の振る舞いを DOM 単位で検証。**従来の mock が `{ available }` を返して contract バグを隠蔽していた点を是正**し、実 API 形（`{ total, items }`）の mock へ更新する。 |
| `members.spec.ts`（新規） | `apps/web/src/features/admin/api/members.spec.ts` | `fetchTagMaster` / `fetchAllTagMaster` の contract（`{ total, items }` パース・`FetchTagMasterOptions` の `q`/`page`/`pageSize` 反映・cap での打ち切り・エラー時 throw）を fetch mock で検証。 |

> 自動テストが「mock の形」を実 API 形に合わせることが、本 issue の P0 隠蔽（mock が `{ available }` を返していたために空 picker がテストで検出されなかった）の再発防止の本丸である。


## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| workflow | issue-1078-bulk-tag-picker-large-catalog-ux |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |
| verdict | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |

## 目的

本 Phase の既存本文で定義した目的に従い、issue #1078 の tag master contract 修正と BulkActionBar large catalog UX を検証可能な単位で扱う。

## 実行タスク

- [x] Phase 本文の設計・実装・検証項目を issue #1078 の実装結果に同期する。
- [x] 実コード差分、focused tests、typecheck、lint の local evidence と矛盾しない状態語彙へ更新する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/index.md`
- `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/artifacts.json`
- `.claude/skills/task-specification-creator/references/workflow-state-vocabulary.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル
- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- [x] 必須見出しが揃っている。
- [x] 状態語彙が `implemented_local_evidence_captured` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` と整合している。


## 統合テスト連携

- [x] API client contract は `apps/web/src/features/admin/api/__tests__/members.spec.ts`（11 tests PASS）で検証済み。
- [x] BulkActionBar UI / a11y / regression は `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx`（20 tests PASS）で検証済み。
- [x] broader web Vitest run は 216 files / 1587 tests PASS / 1 skipped。
