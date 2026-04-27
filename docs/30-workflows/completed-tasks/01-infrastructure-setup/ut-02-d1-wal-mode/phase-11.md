# Phase 11: 手動 smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 WAL mode 設定 (UT-02) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-26 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | pending |

## 目的

docs-only タスクとして、自動テストや実環境デプロイが対象外であることを明示しつつ、設定確認コマンドの動作確認手順を文書化する。manual evidence として N/A 理由を記録する。

## 実行タスク

- docs-only タスクの範囲で実施可能な確認項目を特定する
- 実施不可能な smoke test 項目について N/A 理由を明記する
- 設定確認コマンドの動作確認手順を文書化する
- manual evidence テーブルを作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler d1 execute コマンド確認 |
| 必須 | docs/01-infrastructure-setup/ut-02-d1-wal-mode/outputs/phase-10/go-nogo.md | GO 判定確認 |
| 必須 | docs/01-infrastructure-setup/ut-02-d1-wal-mode/outputs/phase-05/foundation-bootstrap-runbook-wal-section.md | 設定確認コマンドの参照 |
| 参考 | docs/01-infrastructure-setup/ut-02-d1-wal-mode/index.md | タスク種別（docs-only）確認 |

## 実行手順

### ステップ 1: docs-only 範囲の確認

- タスク種別（docs-only）を再確認し、実施対象と非対象を明確にする
- 実施可能な確認項目（コマンド手順の文書確認等）を列挙する
- 実施不可能な項目（実環境への PRAGMA 実行等）の N/A 理由を記録する

### ステップ 2: manual evidence テーブルの作成

- 各 smoke test 項目について実施可否・N/A 理由・代替手段を記録する
- docs-only タスクとして代替証跡（設計ドキュメント・runbook）が十分かを確認する

### ステップ 3: 設定確認コマンドの文書確認

- runbook に記載されたコマンドが正確であることをドキュメントレベルで確認する
- Phase 12 へのブロック条件がないことを確認する

## manual evidence（docs-only タスク向け N/A 理由テーブル）【必須】

| smoke test 項目 | 実施区分 | N/A 理由 / 代替手段 | 代替証跡パス |
| --- | --- | --- | --- |
| staging D1 に PRAGMA journal_mode=WAL を実行する | N/A | docs-only タスクのため実環境操作は対象外。手順は runbook に記録済み | outputs/phase-05/foundation-bootstrap-runbook-wal-section.md |
| production D1 に PRAGMA journal_mode=WAL を実行する | N/A | 同上。本番操作は 02-serial Phase 5 実行時に実施する | outputs/phase-05/foundation-bootstrap-runbook-wal-section.md |
| wrangler d1 execute の結果で journal_mode=wal を確認する | N/A | docs-only タスクのため CLI 実行結果は対象外。確認コマンドは runbook に記載済み | outputs/phase-05/foundation-bootstrap-runbook-wal-section.md |
| ローカル wrangler dev で WAL 非対応の動作確認 | N/A | ローカル環境差異は env-diff-matrix.md に文書化済み。実行確認は 02-serial で実施 | outputs/phase-02/env-diff-matrix.md |
| 同時読み書きのロック競合が WAL mode で解消されることを確認 | N/A | 本タスクはドキュメント記録のみ。動作検証は UT-09 (Sheets→D1 同期実装) で実施 | docs/01-infrastructure-setup/ut-02-d1-wal-mode/index.md (スコープ外明記) |
| wrangler.toml の D1 バインディング定義をコードレビューで確認 | 実施可 | docs-only の範囲内で設計ドキュメントとの整合をレビューする | outputs/phase-08/dry-config-policy.md |
| AC-1〜AC-5 の証跡ドキュメントが揃っているか確認 | 実施可 | Phase 7 の AC matrix と証跡パスを照合する | outputs/phase-07/ac-matrix.md |

## docs-only タスク smoke test 方針

本タスクはタスク種別が **docs-only** であるため、以下の方針を適用する。

1. **実環境操作（PRAGMA 実行・wrangler deploy）はすべて N/A** とし、手順を runbook に記録することをもって証跡とする
2. **ドキュメントレビュー（設計整合・コマンド正確性・AC 証跡）は実施対象** とし、Phase 11 内で完了させる
3. **実動作確認は 02-serial-monorepo-runtime-foundation の Phase 5 実行時** に委譲する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | smoke test N/A 項目の実施を委譲 |
| Phase 12 | smoke test 結果（N/A テーブル）を close-out ドキュメントに記録 |

## 多角的チェック観点（AIが判断）

- 価値性: N/A 理由が明確で後続タスクへの委譲が適切か。
- 実現性: docs-only 範囲の確認項目が漏れなく実施されているか。
- 整合性: N/A の代替証跡が Phase 1〜10 の成果物と一致しているか。
- 運用性: 実際の smoke test を 02-serial Phase 5 で再現できる手順が runbook に残っているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | manual evidence テーブル作成 | 11 | pending | N/A 理由と代替証跡を記録 |
| 2 | ドキュメントレビュー（整合確認） | 11 | pending | AC matrix・runbook の照合 |
| 3 | smoke test 結果記録 | 11 | pending | outputs/phase-11/smoke-test-result.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/smoke-test-result.md | manual evidence テーブルと N/A 理由一覧 |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- manual evidence テーブルの全項目に実施区分・N/A 理由・代替証跡が記録されている
- docs-only 範囲の確認項目（ドキュメントレビュー）が完了している
- 実施不可項目の委譲先（02-serial Phase 5 / UT-09）が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: smoke test 結果（manual evidence テーブル）と N/A 委譲先情報を Phase 12 に引き継ぐ。
- ブロック条件: docs-only 範囲の確認項目が未完了の場合は Phase 12 に進まない。
