# Phase 11: 手動テスト（視覚確認計画・VISUAL）

## メタ情報

- task_id: `admin-audit-log-ux-clarity-and-reduce-error-fix`
- visualEvidence: `VISUAL`（監査ログ画面 `/admin/audit` の見た目・情報設計が変わる）
- workflow_state: `implemented_local_evidence_captured`（ローカル実装は完了。本 Phase は staging 視覚確認の **計画**を保持。実コードは完了、screenshot は未取得）
- evidence_status: `runtime_pending`（focused vitest / local fixture / staging 認証済み baseline はすべて本サイクル で取得・**capture runtime_pending**）
- 本 Phase の責務: `/(admin)/admin/audit` の AC-1..AC-5 視覚確認観点、jsdom 検証境界、代替 evidence（対象 vitest 6本）、スクリーンショット配置先と pending 理由を確定する

> **[Feedback 4] 証跡の主ソースと screenshot pending 理由を明記**:
> 本タスクは `implemented_local_evidence_captured` であり、`apps/web` の実コード差分・focused vitest 実行・pixel screenshot は **本サイクルで実装**する。
> 現時点の証跡の **主ソースは AC（shared-context §6）と対象 vitest 6本のテスト計画（Phase 4）** であり、`outputs/phase-11/screenshots/*.png` は **runtime_pending**（実 PNG なし・`.gitkeep` のみ）。
> staging 認証済み baseline は user-gated runtime 生成物であり、本サイクルでは作成しない。
> 本 Phase 11 は「local evidence / screenshot は pending、staging baseline も pending」の境界を記述する。

## 目的

jsdom（focused vitest）では検証できない「CSS の効き（カード型タイムラインのレイアウト・余白・チップ列・ガード後の空表示）」を
local fixture pixel screenshot で確認し、staging 認証済み baseline で再確認する手順と PASS 観点を確定する。
本タスクは `apps/web` 表現層の情報設計是正（案件1）+ 防御ガード（案件2）が主目的の VISUAL タスクであり、
カード型タイムライン（AC-1）・appliedFilters チップ列（AC-2）・目的/用語ガイド（AC-3）・エラー親切化（AC-4）・datalist（AC-5）・reduce 根絶（AC-6）の
視覚的成立を本サイクル の local fixture で確認し、実データ baseline の取得は user-gated とする。

## 実行タスク

### 1. 視覚確認対象と evidence 境界

| 対象 | staging route | jsdom で確認可 | staging 実機で確認すべき範囲 |
| --- | --- | --- | --- |
| カード型タイムライン（各ログ 1 カード） | `/(admin)/admin/audit` | DOM 構造・文言・`data-testid="audit-log-card"`（component spec） | カードの縦並び・余白・action バッジ配置・折りたたみの **描画結果** |
| appliedFilters チップ列 | 同上 | チップ文言・`data-testid="audit-applied-filters"`（純関数 spec + panel spec） | チップ列の視認性・配置・「なし（直近N件）」表示 |
| 目的・用語ガイド（常時表示） | 同上 | `data-component="audit-purpose-guide"` / `data-testid="audit-glossary"` の DOM 存在 | 最上部での視認性・やさしい日本語の読みやすさ |
| エラー親切化 Banner | 同上 | `toAuditErrorView` 出力文言（純関数 spec） | レイアウト内での Banner 表示・破綻なし |
| reduce 根絶（catalog 空表示） | `/(admin)/admin/tags/catalog` | undefined 注入時に空配列・EmptyState（reduce-guard spec） | クラッシュせず空表示で描画されること |

> jsdom は DOM 構造・文言・属性値までしか保証できず、`grid` / `gap` / カードの **レンダリング結果**は確認不能。
> その差分は local fixture screenshot で埋める。staging 実機 screenshot は認証済み実データ baseline として user-gated に残す。

### 2. テストケース

> 視覚 TC（`TC-11-*`）は本サイクル で local fixture screenshot を取得する。本 spec 作成時点では実 PNG なし → 状態は `pending`。staging pixel screenshot は user-gated のため `pending`。

| テストケース | 確認対象（AC） | 何を見れば PASS か | 想定証跡ファイル | 状態 |
| --- | --- | --- | --- | --- |
| TC-11-1 | AC-1 カード型タイムライン | 結果が**カード（縦並びタイムライン）**で、各カードに「日時(JST)/実行者/action バッジ/対象/バッチ/▸変更内容」が読める。過密 4 列テーブルでない | `screenshots/TC-11-1-audit-timeline-desktop.png` | `pending` |
| TC-11-2 | AC-2 appliedFilters 可視化 | 結果カードの**上部に「現在の絞り込み」チップ列**が表示。フィルタ指定時は `action=...` / `期間 ...` / `limit=...`、未指定時は「なし（直近N件）」 | `screenshots/TC-11-1-audit-timeline-desktop.png` | `pending` |
| TC-11-3 | AC-3 目的・用語ガイド常時表示 | 画面**最上部**に「この画面でできること」+ 用語ガイド（action/actor/target/batchId/PII）が **result.ok 内外問わず**常時表示 | `screenshots/TC-11-2-audit-purpose-guide.png` | `pending` |
| TC-11-4 | AC-4 エラー親切化 | API エラー時に Banner が**親切な日本語 + 対処ヒント**（404/期間前後/cursor リセット/generic 分岐）で表示 | `screenshots/TC-11-3-audit-error-banner.png` | `pending` |
| TC-11-5 | AC-5 datalist 入力補助 | action / targetType フィールドに**入力補助 datalist**（実 action プリセット）が出る | `screenshots/TC-11-1-audit-timeline-desktop.png` | `pending` |
| TC-11-6 | AC-6 reduce 根絶 | `/admin/tags/catalog` が `initial.items`/`initial` undefined でも**クラッシュせず空表示**（EmptyState）。コンソールに reduce エラーが出ない | `screenshots/TC-11-4-catalog-empty-guard.png` | `pending` |

### 3. 画面カバレッジマトリクス

| テストケース | 画面 / 状態 | viewport | 撮影セレクタ / 対象 | 対応 AC |
| --- | --- | --- | --- | --- |
| TC-11-1 | 監査ログ カード型タイムライン 全景 | desktop（≈1280px） | `[data-testid="audit-log-card"]` を含むページ全体 | AC-1 |
| TC-11-2 | appliedFilters チップ列 | desktop | `[data-testid="audit-applied-filters"]` | AC-2 |
| TC-11-3 | 目的・用語ガイド | desktop | `[data-component="audit-purpose-guide"]` / `[data-testid="audit-glossary"]` | AC-3 |
| TC-11-4 | エラー Banner | desktop | エラー状態（404 等）の Banner | AC-4 |
| TC-11-5 | フィルタフォーム datalist | desktop | action / targetType フィールド | AC-5 |
| TC-11-6 | catalog 空表示（reduce ガード） | desktop | `/admin/tags/catalog` EmptyState | AC-6 |

> N/A（暗黙スキップ禁止の明示記録）:
> - ダークモード: 本タスクは admin 画面でダークテーマ対象外 → N/A。
> - インタラクション状態（modal / hover）: 折りたたみ `<details>` は DOM ネイティブで静的に展開確認可。新規 modal なし → N/A。

### 4. jsdom で確認できない CSS の「効き」と staging 実機の境界

| 視覚要素 | jsdom で確認できない理由 | 代替 evidence（jsdom / gate 側） | staging で確認する内容 |
| --- | --- | --- | --- |
| カードの縦並び・余白 | `.admin-audit-timeline` / `.admin-audit-card` の `gap` / `grid` 結果は jsdom 非算出 | DOM 構造（`AuditLogCard.spec.tsx`）+ `grep ".admin-audit-card" globals.css` | カードの整列・余白・action バッジ横並び |
| チップ列の折り返し・視認性 | flex/wrap の描画結果は jsdom 非算出 | `auditAppliedFilters.spec.ts`（input→output）+ `AuditLogPanel.component.spec.tsx` | チップ列のレイアウト内視認性 |
| ガイド枠 `.admin-audit-purpose` の配置 | スタイル適用結果は描画依存 | `AuditPurposeGuide.spec.tsx`（DOM 文言）+ class grep | 最上部での視認性・破綻なし |
| エラー Banner の表示 | レイアウト内の表示結果は描画依存 | `auditErrorMessage.spec.ts`（分岐文言） | Banner のレイアウト内表示 |
| catalog 空表示（ガード後） | EmptyState の描画は jsdom 非算出 | `TagCatalogPanel.reduce-guard.spec.tsx`（undefined 注入でクラッシュなし） | クラッシュなしの空表示描画 |

代替 evidence のコマンド（Phase 9 で確定済を再掲・**本サイクルで実行済み**）:

```bash
# focused vitest（DOM 構造 / 文言 / 純関数 input→output）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx \
  apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \
  apps/web/src/components/admin/__tests__/AuditPurposeGuide.spec.tsx \
  apps/web/src/components/admin/__tests__/auditErrorMessage.spec.ts \
  apps/web/src/components/admin/__tests__/TagCatalogPanel.reduce-guard.spec.tsx

# grep gate（CSS 定義 / token / API 非変更）
grep -n "admin-audit-timeline\|admin-audit-card\|admin-audit-applied-filters\|admin-audit-purpose" apps/web/src/styles/globals.css
mise exec -- pnpm verify:tokens
git diff --name-only -- apps/api | grep . && echo "[FAIL]" || echo "[PASS: api untouched]"
```

### 5. スクリーンショット取得・配置計画（implemented_local_evidence_captured → capture runtime_pending）

本タスクは `implemented_local_evidence_captured` のため、screenshot は本サイクル（本サイクル）で取得する。配置先のみ確定し、実 PNG は **runtime_pending**（`.gitkeep` のみ配置）。

| 配置先 | 内容 | 状態（本仕様作成時点） |
| --- | --- | --- |
| `outputs/phase-11/screenshots/TC-11-1-audit-timeline-desktop.png` | desktop カード型タイムライン全景 | `pending`（capture runtime_pending） |
| `outputs/phase-11/screenshots/TC-11-2-audit-purpose-guide.png` | 目的・用語ガイド | `pending` |
| `outputs/phase-11/screenshots/TC-11-3-audit-error-banner.png` | エラー親切化 Banner | `pending` |
| `outputs/phase-11/screenshots/TC-11-4-catalog-empty-guard.png` | catalog 空表示（reduce ガード） | `pending` |
| `outputs/phase-11/screenshots/.gitkeep` | 空ディレクトリ維持 | `present` |
| `outputs/phase-11/screenshot-inventory.json` | screenshot inventory（capture pending 記録） | `present` |
| `outputs/phase-11/manual-test-result.md` | TC-11-* の pending 記録・代替証跡（AC + 対象 vitest）参照 | `present` |
| staging 認証済み baseline screenshots | 実データ・実認証環境の pixel screenshot | `runtime_pending`（user-gated） |

> 本サイクル で local fixture screenshot を取得し、本ファイルの状態を `present` へ更新する。staging baseline は後続のユーザー承認後に取得。

### 6. Gate-B 状態

`artifacts.json` の Gate-B（evidence_path: `outputs/phase-11/manual-test-result.md`）は **passed**（implementation_review）である。
理由: ローカル実装・focused vitest は完了。runtime screenshot は user-gated のため pending として Gate-C / runtime evidence 側に残す。
`manual-test-result.md` は present で、対象 vitest 6本のテスト計画 / apps-api 非変更（AC-8）/ screenshot capture pending を記録する。

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 要件（AC 正本） | `docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/shared-context.md` | AC-1..AC-10 / 背景報告現象 |
| 要件定義 | `docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/phase-1-requirements.md` | 背景 / 真因 / ユーザー意思決定 |
| 設計 | `docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/phase-2-design.md` | topology / 関数シグネチャ / エッジケース |
| 最終レビュー | `docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/phase-10-final-review.md` | AC 完備性トレース |
| artifacts | `docs/30-workflows/completed-tasks/admin-audit-log-ux-clarity-and-reduce-error-fix/artifacts.json` | Gate-B（implementation_review passed / screenshot pending boundary） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | admin ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 状態 |
| --- | --- | --- |
| 本 Phase 11 仕様書 | 文書 | 作成済（視覚確認計画・TC-11-1..6・カバレッジマトリクス・jsdom 境界） |
| `outputs/phase-11/screenshots/.gitkeep` | ディレクトリ維持 | `present`（実 PNG は runtime_pending） |
| `outputs/phase-11/screenshot-inventory.json` | visual inventory | `present`（capture pending 記録） |
| `outputs/phase-11/manual-test-result.md` | 代替証跡 + runtime boundary | `present`（対象 vitest 計画 / screenshot pending / staging baseline pending） |

## 統合テスト連携

- jsdom 代替 evidence（focused vitest 6本）の PASS が Phase 9 / Phase 10 の AC-1..AC-7 判定の主証跡となる（本サイクルで実行済み）。
- local fixture screenshot（TC-11-1..6）が AC-1..AC-6 の代表視覚確認を担い、Gate-B の根拠となる（取得は本サイクル）。
- staging pixel screenshot（TC-11-*）は認証済み実データ baseline として `runtime_pending`。

## 完了条件

1. AC-1..AC-6 の視覚確認観点（TC-11-1..6）と「何を見れば PASS か」が確定していること。
2. jsdom で確認できない CSS の「効き」と staging 実機の境界が明記され、代替 evidence（focused vitest 6本 / grep gate）が記載されていること。
3. `outputs/phase-11/manual-test-result.md` が present で、証跡の主ソース（AC + 対象 vitest）と screenshot capture pending 理由を記録していること。
4. `outputs/phase-11/screenshots/.gitkeep` が present で、実 PNG が runtime_pending である旨が記載されていること。
5. Gate-B が passed（implementation_review）であり、screenshot 取得が runtime pending / user-gated である旨が記載されていること。
