# Phase 11: 手動 smoke test（CLI 回帰検証）

> **NON_VISUAL 宣言**
> - **タスク種別**: tooling（CLI スクリプト hardening + 回帰 spec test）
> - **非視覚的理由**: `pnpm indexes:rebuild`（= `generate-index.js`）は CLI スクリプトであり、画面・UI・UX を持たない。スクリーンショットで観測できる挙動が存在しない。
> - **代替証跡**: 回帰 spec test（`scripts/__tests__/generate-index-fail-fast.spec.ts` の TC-01〜TC-07）+ CLI 回帰（`pnpm indexes:rebuild` の exit code と `git diff`）。
> - **実走状態**: 本ワークフローは仕様書整備と実コード hardening。CLI smoke の実走は今回の実装サイクルで行う（completed）。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `pnpm indexes:rebuild` の fail-fast / atomic write / decisive log 保証 (issue-229-indexes-rebuild-fail-fast) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test（CLI 回帰検証） |
| 作成日 | 2026-05-31 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed |
| 実装区分 | 実装仕様書 |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |

## 目的

NON_VISUAL タスクの代替 evidence として、CLI 回帰 smoke の実走手順・記録テンプレを固定する。本ワークフローでは実走せず、実値証跡（exit code・`git diff` 結果・decisive stderr）は今回の実装サイクルで採取する。

## 実走基準（実装サイクルで実走）

| # | 観点 | コマンド | 期待結果 | 対応 AC |
| --- | --- | --- | --- | --- |
| S-1 | 正常系 byte-identical | `mise exec -- pnpm indexes:rebuild; echo "exit=$?"` → `git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes` | `exit=0` かつ `git diff` 差分 0 件 | AC-1（成功 exit 0）/ AC-4（byte-identical） |
| S-2 | 失敗注入 fail-fast | 書き込み不可化（例: 出力 dir を一時的に read-only）して `mise exec -- pnpm indexes:rebuild; echo "exit=$?"` | `exit=1` かつ stderr に `[generate-index] <skill> / <index-file> (<step>) 失敗:` | AC-1（非ゼロ exit）/ AC-3（decisive log） |
| S-3 | atomic（部分書き込みなし） | S-2 後に本ファイル群が変更前のまま / `.tmp` 残存 0 を確認 | 本ファイル不変 + `find ... -name '*.tmp'` が 0 件 | AC-2 |
| S-4 | 回帰 spec test | `mise exec -- pnpm vitest run scripts/__tests__/generate-index-fail-fast.spec.ts` | TC-01〜TC-07 全 PASS | AC-7 |
| S-5 | hook / CI 回帰 | pre-push `indexes-drift-guard.sh` 相当をローカル実行 | グリーン（drift 0 で push 可） | AC-4 |

## 実行タスク

1. CLI 回帰 smoke の実走手順（S-1〜S-5）を定義する（完了条件: 実走基準表が存在）。
2. 正常系 exit 0 + git diff 0、失敗注入で exit 1 + decisive stderr の記録欄を作成する（完了条件: manual-smoke-log.md に記入欄）。
3. 回帰 spec test（TC-01〜07）の結果記録欄を作成する（完了条件: manual-test-result.md に AC マトリクス）。
4. リンク・成果物チェックリストと screenshot-plan.json（NON_VISUAL）を作成する（完了条件: 全 7 outputs 配置）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | （本ワークフロー）phase-02.md | ローカル実行・検証コマンド / TC-01〜TC-07 |
| 必須 | （本ワークフロー）phase-09.md | 7 品質ゲート |
| 必須 | （本ワークフロー）phase-10.md | GO 判定 / 実走基準 |
| 必須 | scripts/hooks/indexes-drift-guard.sh | pre-push 回帰確認 |

## スコープ

### 含む

- CLI 回帰 smoke 実走手順（S-1〜S-5）のテンプレ定義
- exit code / git diff / decisive stderr / 回帰 spec test の記録欄
- NON_VISUAL 代替証跡の明示（screenshot-plan.json）

### 含まない

- 実 smoke の実走（今回の実装サイクル）
- スクリーンショット採取（NON_VISUAL のため不要）
- CI / hook の編集

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | CLI smoke 証跡とリンクチェック結果 |

## 多角的チェック観点

- 正常系と失敗注入を分離して観測できているか（原因分離可能か）。
- byte-identical（git diff 0）が drift を確実に拾えるか。
- NON_VISUAL の代替証跡（spec test + CLI 回帰）がレビューで検証可能か。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | CLI 回帰 smoke 手順定義 | completed | S-1〜S-5 |
| 2 | exit/diff/stderr 記録欄作成 | completed | manual-smoke-log.md |
| 3 | 回帰 spec test 結果欄作成 | completed | manual-test-result.md |
| 4 | link-checklist / screenshot-plan 作成 | completed | NON_VISUAL |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| smoke サマリー | outputs/phase-11/main.md | CLI 回帰 smoke サマリー（NON_VISUAL 宣言 + 代替証跡） |
| smoke ログ | outputs/phase-11/manual-smoke-log.md | コマンド・exit code・git diff・decisive stderr 記入欄 |
| 手動 checklist | outputs/phase-11/manual-test-checklist.md | S-1〜S-5 の実走 checklist |
| 結果テンプレ | outputs/phase-11/manual-test-result.md | AC マトリクス + 証跡メタ |
| リンク確認 | outputs/phase-11/link-checklist.md | 成果物リンク健全性 |
| 発見事項 | outputs/phase-11/discovered-issues.md | 仕様書整備時点の懸念 |
| 視覚判定 | outputs/phase-11/screenshot-plan.json | NON_VISUAL / スクリーンショット不要判定 |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] NON_VISUAL 宣言（タスク種別 / 非視覚的理由 / 代替証跡）が冒頭に明記されている
- [x] CLI 回帰 smoke 実走基準（正常系 exit 0 + git diff 0、失敗注入で exit 1 + decisive stderr）が定義されている
- [x] 回帰 spec test（TC-01〜07）の記録欄がある
- [x] link-checklist / screenshot-plan.json が作成済み

## タスク100%実行確認【必須】

- [x] 本ワークフロー範囲のテンプレ作成タスク（4 件）が完了
- [x] Phase 11 代替 evidence 成果物 7 件が `outputs/phase-11/` に配置済み

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項: CLI smoke 証跡（PASS テンプレ）/ link-checklist / 発見事項
- ブロック条件: なし（実走は実装サイクル。本ワークフローは completed でクローズ）
