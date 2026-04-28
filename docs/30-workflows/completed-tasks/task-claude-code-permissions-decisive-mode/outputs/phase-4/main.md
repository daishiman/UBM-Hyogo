# Phase 4: テスト設計 — main

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 3（設計レビュー / impact-analysis.md） |
| 下流 | Phase 5（実装ランブック） |
| 種別 | docs-only / NON_VISUAL / spec_created |
| 採用案 | 案 A（全層 `defaultMode: bypassPermissions` 統一） |

## 目的

Phase 2 で設計した「settings 3 層統一 + cc alias 強化 + whitelist 整備」の効果を、別タスクの実装後に検証するための **手動テストシナリオ** を確定する。本タスクは設定ファイル変更タスクであり、claude プロセスの再起動を伴うため automated test 対象外。

## テスト戦略

| 観点 | 戦略 |
| --- | --- |
| 種別 | 手動テストのみ（NON_VISUAL） |
| 自動化 | 不可（claude プロセス再起動が必要） |
| 証跡 | `outputs/phase-11/manual-smoke-log.md` にチェックリスト形式で記録 |
| 環境 | macOS / zsh / Claude Code CLI / mise 配下の Node 24 |
| 実施タイミング | Phase 5 ランブック完了後、Phase 11 で本実施 |

## カバレッジ方針

- 要件 F-1〜F-4 をすべて手動 TC でカバー
- 主シナリオ TC-01〜TC-05、補助シナリオは Phase 6 で TC-F-01 / TC-F-02 / TC-R-01 を追加
- AC-5 / AC-7 は本 Phase の成果物で達成

## テストシナリオ概要

| TC | 名称 | 紐付け要件 | 紐付け AC |
| --- | --- | --- | --- |
| TC-01 | cc 起動直後のモード表示確認 | F-1, F-2 | AC-1, AC-2, AC-5 |
| TC-02 | reload / session 切替後のモード維持 | F-1 | AC-1, AC-5 |
| TC-03 | 別プロジェクトでの cc 起動影響 | F-2, F-4 | AC-4, AC-5, AC-6 |
| TC-04 | whitelist allow 効果（保険） | F-3 | AC-3, AC-5 |
| TC-05 | whitelist deny 効果 | F-3 | AC-3, AC-5 |

詳細は `test-scenarios.md` を参照。

## エッジケース

| EC | シナリオ | 期待 |
| --- | --- | --- |
| EC-01 | グローバル `defaultMode` キーを誤って削除 | local 値が効く（案 A の fallback 挙動） |
| EC-02 | `--dangerously-skip-permissions` を alias 末尾以外に置く | 同等動作（順序非依存） |
| EC-03 | プロジェクト外（CLAUDE.md 不在）で cc 実行 | グローバル alias とグローバル settings のみ効く |

## スコープ外

- 自動 unit / integration test（プロセス再起動が必要なため CI 化困難）
- Anthropic SDK のバージョン差異テスト（current 環境で固定）
- Claude Code 内部実装の挙動検証（公式仕様に準拠）

## 証跡フォーマット（Phase 11 引き継ぎ）

各 TC について以下を `manual-smoke-log.md` に記録する。

- 実施日時（ISO8601）
- 実行コマンド（API token 等を含めない）
- 期待結果 / 実観測結果
- 判定: PASS / FAIL / BLOCKED
- 環境ブロッカーがある場合は別カテゴリで記録（`[WEEKGRD-01]` 準拠）

## 重要制約（再掲）

- `.env` 実値・API token・OAuth トークンを証跡に残さない
- 実 settings ファイル / `.zshrc` を本タスクで書き換えない
- TC-05 は本番 `main` へ実 push しない（`--dry-run` または dummy ref で）

## 主成果物

- `outputs/phase-4/main.md`（本ファイル）
- `outputs/phase-4/test-scenarios.md`（TC-01〜TC-05 詳細）

## 完了条件

- [x] TC-01〜TC-05 が `test-scenarios.md` に表形式で定義されている
- [x] 各 TC が要件 F-1〜F-4 と AC-1〜AC-8 にトレース可能
- [x] 証跡フォーマットが Phase 11 で再利用可能な粒度
- [x] エッジケース EC-01〜EC-03 が記載されている

## 参照

- Phase 1: `outputs/phase-1/main.md`
- Phase 2: `outputs/phase-2/{main,settings-diff,alias-diff,whitelist-design}.md`
- Phase 3: `outputs/phase-3/{main,impact-analysis}.md`
- 仕様: `phase-04.md`
