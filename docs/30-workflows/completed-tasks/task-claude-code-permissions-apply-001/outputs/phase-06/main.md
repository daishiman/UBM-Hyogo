# Phase 6 main: テスト拡充サマリ

## 前提（Phase 5 Green 状態）

- `outputs/phase-05/main.md` で TC-01〜TC-04 / TC-R-01 が PASS、TC-05 のみ BLOCKED
- backup 4 件（TS=20260428-192736）取得済（`outputs/phase-05/backup-manifest.md`）

## 拡充 TC 結果

| TC ID | 概要 | 結果 |
| --- | --- | --- |
| TC-F-01 | `defaultMode` typo 注入（dry path / jq pipe で検証） | **PASS**（typo 値 `bypassPermisson` が読み出される、実機編集なし） |
| TC-F-02 | `cc` alias 重複定義注入（実機注入→即 rollback） | **PASS**（後勝ちで `claude` のみとなり CC_ALIAS_EXPECTED と差分、rollback で 1 件復帰） |
| TC-R-01 | guard スクリプト（backup 除外版）手動実行 | **PASS**（`[PASS] alias cc 定義は 1 件です（backup 除外）`） |

## Green 復帰確認（注入後）

| TC | 注入後再 PASS |
| --- | --- |
| TC-01 | PASS（global 触らず） |
| TC-02 | PASS（不在維持） |
| TC-03 | PASS（project 触らず） |
| TC-04 | PASS（rollback で正本復帰、`zsh -i -c 'type cc'` が `CC_ALIAS_EXPECTED` 由来文字列と一致） |
| TC-R-01 | PASS（grep 1 件） |

## 未タスク候補（Phase 12 unassigned-task-detection で formalize）

| 候補 | 内容 |
| --- | --- |
| guard スクリプトの CI 化 | TC-R-01 guard を GitHub Actions の zsh job に組み込む案。本タスク範囲外 |
| `type cc` が `/usr/bin/cc` を返す問題の根本原因調査 | Phase 1 inventory で観測済（`zsh -i` 経由では正常）。非対話 shell での source 経路調査は別タスク |
| `Edit` / `Write` の whitelist 化 | 元タスク Phase 10 MINOR 保留 |
| `permissions.deny` 実効性追跡 | 前提タスク `deny-bypass-verification-001` の継続運用 |
| MCP / hook permission 検証 | 本タスクスコープ外 |

## 完了条件チェック

- [x] Phase 5 Green 転記
- [x] TC-F-01 注入 + 観測 + rollback（dry path）
- [x] TC-F-02 注入 + 観測 + rollback（実機・即時）
- [x] TC-R-01 guard 手動実行 PASS 転記
- [x] CI 化案を未タスク候補に記録
- [x] 注入後 TC-01〜04 再 PASS
- [x] artifacts.json `phases[5].outputs` 2 ファイル一致
