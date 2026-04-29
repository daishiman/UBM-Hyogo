# Phase 8 before-after

## 対象 / Before / After / 理由 テーブル

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `~/.config/zsh/conf.d/79-aliases-tools.zsh:7` の重複検出 | 1 件（Phase 5 で正準化済） | 1 件 | **no-op**: 既に正準化済で重複なし |
| settings hierarchy 冗長 key (`permissions.defaultMode`) | global / project ともに `bypassPermissions` | global / project ともに `bypassPermissions` | **no-op**: ユーザー方針 (b) で明示性優先のため両層維持。AC-1 の「統一」要件に整合 |
| `~/.claude/settings.json` の JSON フォーマット | 4711 bytes（trailing newline / インデント混在の可能性） | 4700 bytes（`jq --indent 2 .` 整形済） | 整形統一（`jq` で順序保持・インデント 2 統一） |
| `<project>/.claude/settings.json` の JSON フォーマット | 6411 bytes（既に整形済） | 6411 bytes | **no-op**: 既に `jq --indent 2` 互換の整形 |
| `~/.claude/settings.local.json` の JSON フォーマット | 不在 | 不在 | **N/A**: 不在維持の設計方針 |
| `<project>/.claude/settings.local.json` の JSON フォーマット | 不在 | 不在 | **N/A**: 不在維持の設計方針 |
| navigation drift / dead link | (N/A) | (N/A) | 本タスクは host 環境変更タスクのため navigation 構造に変更なし。Phase 9 Q-5 で再確認 |

## サマリ

- 実質的な書き換え: 1 件（global JSON 整形のみ・11 bytes 差分）
- 重複削除: 0 件
- defaultMode 維持: PASS
