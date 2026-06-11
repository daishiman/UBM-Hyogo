# Phase 7: カバレッジ確認 — admin-schema-diff-review-resolve-ux

`[実装区分: 実装仕様書]` / `[状態: implemented_local_evidence_captured]`

本 Phase は**変更したファイル/ブロックに限定した**カバレッジ目標を計画として記述する（FB Before-Quit-002 / Feedback 5：全体一律のカバレッジ指定はしない）。実測・証跡取得は本 wave で行う。

---

## 1. 方針（変更スコープ限定）

本タスクは表現層の最小差分（新規 2 ファイル + 既存 1 ファイルの変更ブロック）。カバレッジ目標は **本タスクで追加/変更した行・分岐に限定**する。既存の bulk/rollback/recompute/undo/202 ロジックは**変更しない**ため、カバレッジ目標の対象外とする（変更行のみを責任範囲とする原則）。

> 反パターン回避: リポジトリ全体や `SchemaDiffPanel.tsx` ファイル全体への一律 100% 指定はしない。既存の未変更ブロックまで巻き込むと、本タスクと無関係な負債を抱える。

---

## 2. ファイル別カバレッジ目標

| ファイル | 区分 | 対象 | line 目標 | branch 目標 | 根拠 |
|---------|------|------|----------|-------------|------|
| `apps/web/src/components/admin/schemaReviewTerms.ts` | 新規・純データ + 2 ヘルパ | ファイル全体 | **100%** | **100%** | 純データ + `plainLabel`/`termDescription` のみ。分岐は「登録 fallback（未登録キー → 原文/空文字）」のみで、Phase 6 の T6-DEF-01..04 + T6-FMT-01..02 が登録/未登録の両分岐を踏む |
| `apps/web/src/components/admin/SchemaReviewGuide.tsx` | 新規・描画専用（props なし） | 描画 line | **描画 line を component test で網羅** | 分岐ほぼ無し（静的描画）。あれば 100% | 3 ステップ・用語ミニ集・`data-component` を render する line を `SchemaReviewGuide.spec.tsx` で踏む。条件分岐を持たない設計のため line 網羅で足りる |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 既存・変更ブロックのみ | **変更ブロック限定**（下記 §3） | 変更行 100% を目標 | 変更ブロックの新規分岐 100% | 既存 bulk/rollback/recompute は**変更しないため対象外**と明記 |

---

## 3. `SchemaDiffPanel.tsx` の対象ブロック（変更分のみ）

カバレッジ責任を負う**変更ブロック**:

| 変更ブロック | 内容 | カバーするテスト |
|-------------|------|-----------------|
| インラインフォーム条件描画分岐 | `active?.diffId === it.diffId && active.questionId && (<form ... data-component="schema-assign-inline-form">...)` のカード直下描画 | Phase 4 happy path + T6-ALERT-03 |
| `questionId` 無し alert のインライン描画分岐 | `active?.diffId === it.diffId && !active.questionId && (<p role="alert">...)` | T6-ALERT-01 / T6-ALERT-02 |
| 文脈ヘルプ描画 | `data-role="assign-help"` の `<p>`・bulk 補助 `<p>`・HistoryPane 補助文 | Phase 4 help ケース + T6-BULK-02 |
| ペイン平易化描画 | 各ペイン見出し直下 `termDescription(t)` の `<p className="muted">` | Phase 4 ペイン説明ケース |

### 対象外（変更しないため）

- bulk resolve（`SchemaDiffBulkResolveModal` 呼び出しロジック・選択数カウント・limit 判定）
- rollback / undo（`UndoToast`）/ recompute（`postRollbackRecompute`）
- HTTP 202 retryable continuation 分岐（**ロジック**は不変。表示が消えない回帰のみ Phase 6 T6-202 で固定するが、これは既存ブロックのカバレッジ目標には含めない）
- `HistoryPane` のデータ取得・描画ロジック（補助**文言**追加のみが変更点で、ロジックは不変）

> 明記: これら未変更ブロックは本タスクのカバレッジ目標から除外する。回帰テスト（Phase 6）は通すが、新規 line/branch を要求しない。

---

## 4. カバレッジ取得コマンド（本 wave で実行）

```bash
# 変更/新規 3 ファイルに限定してカバレッジ取得
mise exec -- pnpm exec vitest run \
  apps/web/src/components/admin/__tests__/schemaReviewTerms.spec.ts \
  apps/web/src/components/admin/__tests__/SchemaReviewGuide.spec.tsx \
  apps/web/src/components/admin/__tests__/SchemaDiffPanel.component.spec.tsx \
  --coverage \
  --coverage.include='apps/web/src/components/admin/schemaReviewTerms.ts' \
  --coverage.include='apps/web/src/components/admin/SchemaReviewGuide.tsx' \
  --coverage.include='apps/web/src/components/admin/SchemaDiffPanel.tsx'
```

> `--coverage.include` で 3 ファイルに絞る。`SchemaDiffPanel.tsx` はファイル全体が計上されるため、レポートから**変更ブロックの行範囲**を抜き出して証跡に残す（§5）。

---

## 5. 証跡（本 wave で残す方針）

| 証跡 | 内容 | 残し方 |
|------|------|--------|
| `schemaReviewTerms.ts` 実測 | line/branch 100% を coverage レポートで確認 | レポート該当行を `manual-test-result.md` / Phase 9 に転記 |
| `SchemaReviewGuide.tsx` 実測 | 描画 line がカバーされていること | 同上 |
| `SchemaDiffPanel.tsx` 変更行実測 | §3 の変更ブロックの line/branch が踏まれていること | coverage レポートから**変更行番号の line/branch 値**を抜き出して証跡化（ファイル全体% は参考値・判定は変更行ベース） |

> 判定原則: `SchemaDiffPanel.tsx` のファイル全体カバレッジ% は既存未変更コードに引きずられるため**判定基準にしない**。本タスクが追加/変更した行の line/branch が踏まれているかで判定する。

---

## 完了条件

- 変更/新規した 3 ファイルに**限定**したカバレッジ目標が、ファイルごとに line/branch 値（または「描画 line 網羅」）つきで記述済み。
- `SchemaDiffPanel.tsx` は**変更ブロックのみ**を対象とし、既存 bulk/rollback/recompute は対象外であると明記済み。
- カバレッジ取得コマンド（`--coverage.include` 限定）と、変更行 line/branch を証跡に残す方針が記述済み。
- カバレッジは focused assertions で代替し Phase 11 に証跡集約（`implemented_local_evidence_captured`）。実測は本 wave。
