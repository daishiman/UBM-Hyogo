# Phase 4: テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト設計 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 3 |
| 下流 | Phase 5 (実装) |
| 状態 | pending |

## 目的

設定変更の効果を検証するための **手動テストシナリオ**を設計する。本タスクは設定ファイル変更タスクのため automated unit test は対象外。手動チェックの decision 表を確定する。

## テストシナリオ

### TC-01: cc 起動直後のモード表示確認

| 項目 | 内容 |
| --- | --- |
| 前提 | Phase 5 で settings 統一 + alias 書き換え完了 |
| 操作 | 新しいターミナルタブで `cc` を実行 |
| 期待結果 | 起動 banner / 状態表示で `bypassPermissions` が確認できる、permission prompt が出ない |
| 失敗時挙動 | モードが `acceptEdits` / `default` のまま、または prompt 表示 |

### TC-02: reload / session 切替後のモード維持確認

| 項目 | 内容 |
| --- | --- |
| 前提 | TC-01 PASS |
| 操作 | claude session 内で `/reload` 相当 / 別 session への切替 |
| 期待結果 | bypassPermissions が維持される |
| 失敗時挙動 | acceptEdits に戻る |

### TC-03: 別プロジェクトでの `cc` 起動影響確認

| 項目 | 内容 |
| --- | --- |
| 前提 | TC-01 PASS、本プロジェクト外のディレクトリへ移動 |
| 操作 | 他プロジェクト（`<project>/.claude/settings.json` 未定義）で `cc` 実行 |
| 期待結果 | 想定通り bypass が適用 or 適用外（Phase 3 で決めた方針通り） |
| 失敗時挙動 | 想定外の挙動 |

### TC-04: whitelist 効果確認（保険）

| 項目 | 内容 |
| --- | --- |
| 前提 | `--dangerously-skip-permissions` を **意図的に外して** 起動 |
| 操作 | `pnpm --version` 実行 |
| 期待結果 | `Bash(pnpm *)` allow により prompt 無し |
| 失敗時挙動 | prompt 発生（whitelist 不備） |

### TC-05: deny 効果確認

| 項目 | 内容 |
| --- | --- |
| 前提 | TC-04 同条件 |
| 操作 | `git push --force origin main`（dry-run / または該当 ref を別名にして安全確認） |
| 期待結果 | deny によりブロック |
| 失敗時挙動 | 実行されてしまう |

> TC-05 は **本番 main へ実 push しない**ため、安全な dummy ref か `--dry-run` で検証する。

## エッジケース

| EC | シナリオ | 期待 |
| --- | --- | --- |
| EC-01 | `~/.claude/settings.json` の `defaultMode` キーを誤って削除 | 案 B 動作（local 値が効く） |
| EC-02 | `--dangerously-skip-permissions` を alias 末尾以外に置いた | 同等動作（順序非依存） |
| EC-03 | プロジェクト外で実行（CLAUDE.md がない） | グローバル alias のみ効く |

## 証跡フォーマット（Phase 11 で使用）

NON_VISUAL のため `manual-smoke-log.md` チェックリスト形式で記録する。各 TC について:

- 実施日時
- 実行コマンド
- 期待結果 / 実観測結果
- PASS / FAIL / BLOCKED
- 環境ブロッカーがある場合は別カテゴリで記録（[WEEKGRD-01] 準拠）

## スコープ外

- 自動テスト実装（settings 変更の effect は claude プロセス再起動が必要なため CI 化困難）
- Anthropic SDK のバージョン差異テスト（current 環境で固定）

## 主成果物

- `outputs/phase-4/main.md`
- `outputs/phase-4/test-scenarios.md`

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 参照資料

- Phase 1: `outputs/phase-1/` を参照する。
- Phase 2: `outputs/phase-2/` を参照する。
- Phase 3: `outputs/phase-3/` を参照する。
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする。

## 完了条件

- [ ] 本文と `artifacts.json` の Phase outputs が矛盾しない。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

