# Phase 11: 手動検証（NON_VISUAL 縮約）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Pages vs Workers deploy target decision (UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動検証（NON_VISUAL 縮約） |
| 作成日 | 2026-05-01 |
| 前 Phase | 10（最終レビューゲート） |
| 次 Phase | 12（ドキュメント更新） |
| 状態 | spec_created |
| タスク分類 | docs-only |
| visualEvidence | NON_VISUAL |

## NON_VISUAL 宣言（必須冒頭記載）

| 項目 | 値 |
| --- | --- |
| タスク種別 | docs-only / ADR 起票 |
| 非視覚的理由 | 成果物は ADR 本文と判定表更新差分の Markdown のみ。UI スクリーンショット・実装画面なし。Cloudflare deploy 実行も対象外（実 cutover は別タスク） |
| 代替証跡 | (1) Phase 4 検証コマンド 5 種の再実行結果、(2) ADR レビューチェックリスト 7 項目走査結果、(3) 不変条件 #5 抵触ゼロ grep 結果、(4) 同 wave 更新 8 ファイルのリンク死活確認 |

> **WEEKGRD-03 対応**: `ui-sanity-visual-review.md` 冒頭にも同等の NON_VISUAL 宣言（タスク種別・非視覚的理由・代替証跡）を必ず記載する。

## 目的

実地 UI 操作不可（**[Feedback BEFORE-QUIT-001]** 対応）の本タスクで、自動テスト結果 + 文書整合性チェック + リンク死活確認を代替証跡として残す。`manual-test-result.md` のメタ情報には「証跡の主ソース」と「スクリーンショット不要理由」を必須記載し、reviewer が NON_VISUAL 判断の根拠を読み取れる状態を作る。

## 実行手順

### Step 1: NON_VISUAL 宣言の固定

`outputs/phase-11/main.md` と `outputs/phase-11/manual-test-result.md` と `outputs/phase-11/ui-sanity-visual-review.md` の **3 ファイルすべて**冒頭に NON_VISUAL 宣言（タスク種別 / 非視覚的理由 / 代替証跡）を記載。

### Step 2: 代替証跡の収集

| 証跡カテゴリ | 取得手段 | 出力先 |
| --- | --- | --- |
| Phase 4 検証コマンド #1（deploy target 抽出） | 再実行 | manual-test-result.md §証跡-1 |
| Phase 4 検証コマンド #2（ADR ⇔ 判定表照合） | 再実行 | manual-test-result.md §証跡-2 |
| Phase 4 検証コマンド #3（不変条件 #5 抵触ガード） | 再実行 | manual-test-result.md §証跡-3（独立扱い） |
| Phase 4 検証コマンド #4（CLAUDE.md 整合） | 再実行 | manual-test-result.md §証跡-4 |
| Phase 4 検証コマンド #5（関連タスク重複） | 再実行 | manual-test-result.md §証跡-5 |
| ADR レビューチェックリスト 7 項目 | Phase 4 doc-consistency-checks.md 走査 | manual-test-result.md §証跡-6 |
| 同 wave 8 ファイル リンク死活 | `link-checklist.md` で個別確認 | link-checklist.md |
| 既知制限リスト | (a) 実 cutover は別タスク, (b) Cloudflare 側切替は手動 runbook, (c) `@opennextjs/cloudflare` 将来バージョン互換は再評価対象 | manual-test-result.md §既知制限 |

### Step 3: manual-test-result.md メタ情報必須記載

**[Feedback 4] 対応**: NON_VISUAL のとき manual-test-result.md の証跡メタを薄くしない。以下を冒頭メタ情報として **必須**：

```markdown
## メタ情報

| 項目 | 値 |
| --- | --- |
| visualEvidence | NON_VISUAL |
| 証跡の主ソース | Phase 4 検証コマンド 5 種（doc-only grep × N 件）+ ADR レビューチェックリスト 7 項目 |
| スクリーンショットを作らない理由 | docs-only / ADR 起票タスク。UI 変更ゼロ。実 deploy 操作も別タスク委譲のため画面遷移なし |
| 代替証跡の総数 | grep 結果 5 件 + チェックリスト 7 項目 + リンク死活 8 件 = 計 20 証跡 |
| 環境ブロッカーと製品レベル PASS の分離 | WEEKGRD-01 対応として §証跡-X 内で別カテゴリ表示 |
```

### Step 4: link-checklist.md 作成

同 wave 更新 8 ファイル（Phase 8 リスト）について、本タスク仕様書からの相対リンクが正しく解決されることを確認：

| # | ファイル | リンク元 | 死活 |
| --- | --- | --- | --- |
| 1 | ADR 本文 | ADR runbook (Phase 5) | （実起票時に確認） |
| 2 | deployment-cloudflare.md | doc-update-procedure.md | 確認 |
| 3 | CLAUDE.md | doc-update-procedure.md | 確認 |
| 4 | index.md | 各 phase-N.md | 確認 |
| 5 | artifacts.json | （実体ファイル） | 確認 |
| 6 | outputs/artifacts.json | （Phase 12 で生成） | 確認 |
| 7 | aiworkflow-requirements/LOGS.md | doc-update-procedure.md | 確認 |
| 8 | task-specification-creator/LOGS.md | doc-update-procedure.md | 確認 |

### Step 5: ui-sanity-visual-review.md（NON_VISUAL 宣言ファイル）

冒頭に WEEKGRD-03 準拠の NON_VISUAL 宣言ブロックを記載し、それ以降のセクションは「N/A」と明示。空欄や略記を避ける。

## 完了条件チェックリスト

- [ ] main.md / manual-test-result.md / ui-sanity-visual-review.md の 3 ファイル冒頭に NON_VISUAL 宣言
- [ ] manual-test-result.md メタ情報に 5 項目（visualEvidence / 主ソース / スクリーンショット不要理由 / 代替証跡総数 / WEEKGRD-01 対応）すべて記載
- [ ] Phase 4 検証コマンド 5 種の再実行結果が証跡として記録
- [ ] ADR レビューチェックリスト 7 項目の走査結果が記録
- [ ] 不変条件 #5 抵触ゼロ grep 結果が独立節で強調
- [ ] link-checklist.md に 8 ファイル分の死活確認
- [ ] 既知制限リストが 3 件以上記載

## 実行タスク

1. `outputs/phase-11/main.md`: NON_VISUAL 宣言 + 代替証跡サマリー + Phase 12 への引き継ぎ事項。
2. `outputs/phase-11/manual-test-result.md`: メタ情報 + Phase 4 検証 5 種証跡 + ADR レビューチェック + 既知制限 + WEEKGRD-01 区分。
3. `outputs/phase-11/link-checklist.md`: 同 wave 8 ファイル死活確認表。
4. `outputs/phase-11/ui-sanity-visual-review.md`: NON_VISUAL 宣言 + 各セクション N/A 明記。

## 多角的チェック観点

- **NON_VISUAL 宣言の冗長性**: 3 ファイルすべて記載は意図的（reviewer が任意のファイルから入っても理由を読み取れる）。
- **証跡の数値化**: 「20 証跡」のように総数を明示することで証跡の薄さを可視化（[Feedback 4] 対応）。
- **環境ブロッカー分離**: grep ツール不在 / 検索パス誤り等の環境問題は製品 PASS と別カテゴリ（WEEKGRD-01）。
- **実 cutover との混同回避**: 「ADR 採択完了 = 実 cutover 完了」ではない旨を既知制限に明記。
- **screenshots/.gitkeep 削除**: NON_VISUAL のため `outputs/phase-11/screenshots/` ディレクトリは作らない。仮に作成済みなら `.gitkeep` ごと削除。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | NON_VISUAL 宣言 3 ファイル冒頭固定 | 11 | pending |
| 2 | manual-test-result.md メタ 5 項目記載 | 11 | pending |
| 3 | Phase 4 検証 5 種再実行結果記録 | 11 | pending |
| 4 | ADR レビューチェックリスト走査結果記録 | 11 | pending |
| 5 | 不変条件 #5 ガード独立節 | 11 | pending |
| 6 | link-checklist.md 8 ファイル死活 | 11 | pending |
| 7 | 既知制限リスト 3 件以上 | 11 | pending |
| 8 | ui-sanity-visual-review.md N/A 明示 | 11 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | NON_VISUAL 宣言 + 証跡サマリー |
| ドキュメント | outputs/phase-11/manual-test-result.md | メタ情報 + 証跡 + 既知制限 |
| ドキュメント | outputs/phase-11/link-checklist.md | 同 wave 8 ファイル死活 |
| ドキュメント | outputs/phase-11/ui-sanity-visual-review.md | NON_VISUAL 宣言（WEEKGRD-03） |
| メタ | artifacts.json | Phase 11 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（8 件）が `spec_created` へ遷移
- 3 ファイルに NON_VISUAL 宣言
- メタ 5 項目記載
- 証跡 20 件の数値が明示
- artifacts.json の `phases[10].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 12（ドキュメント更新）
- 引き継ぎ事項:
  - 代替証跡パス（implementation-guide.md の視覚証跡セクションから参照）
  - 既知制限リスト（unassigned-task-detection.md の baseline 候補入力）
  - 不変条件 #5 抵触ゼロ確認結果
- ブロック条件:
  - NON_VISUAL 宣言が 3 ファイルのいずれかで欠落
  - manual-test-result.md メタ情報項目欠落
  - 不変条件 #5 抵触検出

## 参照資料

- `outputs/phase-11/main.md`
- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`

## 統合テスト連携

docs-only / NON_VISUAL のためスクリーンショットと実 deploy 統合テストは不要。代替証跡は manual smoke と link checklist に固定する。
