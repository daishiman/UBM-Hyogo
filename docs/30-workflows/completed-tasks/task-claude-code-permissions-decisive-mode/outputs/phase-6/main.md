# Phase 6: テスト拡充 — main

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 5（実装ランブック） |
| 下流 | Phase 7（カバレッジ確認） |
| 種別 | docs-only / NON_VISUAL / spec_created |

## 目的

Phase 4 の主シナリオ（TC-01〜TC-05）に加え、**fail path / 回帰 guard** を補強する。設定変更タスクのため「補助手動シナリオの追加」を主眼とする。

## 補助シナリオ一覧

| TC | 名称 | 種別 | 紐付け要件 |
| --- | --- | --- | --- |
| TC-F-01 | 不正な `defaultMode` 値の検出 | fail path | F-1 |
| TC-F-02 | alias 書き換えミス（typo）検出 | fail path | F-2 |
| TC-R-01 | 後続タスクが alias を再書き換えた場合の検出 | 回帰 guard | F-2, F-3 |

## TC-F-01: 不正な `defaultMode` 値の検出

| 項目 | 内容 |
| --- | --- |
| ID | TC-F-01 |
| 種別 | fail path |
| 前提 | バックアップ取得済み（Phase 5 Step 1） |
| 操作 | `~/.claude/settings.json` に `"defaultMode": "invalidValue"` を一時的に設定し、`cc` 起動 |
| 期待結果 | claude 起動時に validation エラー表示 / 既知の fallback モードへ降格 / 起動拒否のいずれか観測可能 |
| 失敗時挙動 | 何のエラーも出ず、不明モードのまま継続 |
| 復旧 | Phase 5 Step 6 のロールバック |
| 判定 | PASS / FAIL / BLOCKED |
| 安全策 | 検証完了後、必ず元の値へ戻す |

## TC-F-02: alias 書き換えミス（typo）検出

| 項目 | 内容 |
| --- | --- |
| ID | TC-F-02 |
| 種別 | fail path |
| 前提 | バックアップ取得済み |
| 操作 | alias を `--dangerously-skip-permision`（typo: s 1 つ欠落）にして `source` → `cc` 実行 |
| 期待結果 | claude が unknown flag エラーを出して起動失敗、または flag 無視で起動 |
| 失敗時挙動 | typo flag を黙って受理して誤った状態で動作 |
| 復旧 | alias バックアップから即時復旧（`source` し直し） |
| 判定 | PASS / FAIL / BLOCKED |

## TC-R-01: alias 再書き換え検出（回帰 guard）

別タスク（例: dotfiles 更新、別 worktree での自動セットアップ等）が `cc` alias を上書きしていないかを定期確認するためのチェック手順。

```bash
# alias 行の grep（複数ヒットした場合は要調査）
grep -n "alias cc=" ~/.zshrc ~/.config/zsh/conf.d/*-claude.zsh 2>/dev/null

# 期待: 1 行のみヒットし、--dangerously-skip-permissions が含まれている
```

| 項目 | 内容 |
| --- | --- |
| ID | TC-R-01 |
| 種別 | 回帰 guard |
| 実施タイミング | 月次 / 他タスクで shell 設定変更後 |
| 期待結果 | (1) 1 行のみヒット / (2) `--dangerously-skip-permissions` が含まれる / (3) `--permission-mode bypassPermissions` が含まれる |
| 失敗時挙動 | 複数ヒット / フラグ欠落 |
| 連携 | Phase 12 `implementation-guide.md` にも本コマンドを記載する |

## 回帰 guard 一覧

| 項目 | 検証コマンド / 観点 |
| --- | --- |
| session ungraceful 終了後の bypass 維持 | claude を `Ctrl+C` 等で異常終了 → 再起動して TC-01 を再実施 |
| `mise install` / Node version 切替後の alias 効力 | `mise install` 後に新しいタブで `type cc` |
| グローバル settings の他プロジェクト波及 | 他プロジェクトで `cc` 起動して prompt 出現有無を確認 |
| 3 層 settings の整合 | `node -e "JSON.parse(...)"` を 3 ファイルとも実行 |

## エッジ補強

| EC | 補足観点 |
| --- | --- |
| EC-01（defaultMode 削除） | local 値 fallback の挙動を TC-F-01 で間接検証 |
| EC-02（flag 順序） | TC-01 と TC-04 の起動コマンドで順序差分を試す |
| EC-03（プロジェクト外） | TC-03 と兼務 |

## 主成果物

- `outputs/phase-6/main.md`（本ファイル）

## 完了条件

- [x] TC-F-01 / TC-F-02 / TC-R-01 が定義済み
- [x] 回帰 guard 観点が列挙済み
- [x] Phase 11 で再利用可能な記述粒度
- [x] Phase 12 implementation-guide.md への引き継ぎ項目（TC-R-01）が明記

## 参照

- Phase 4: `outputs/phase-4/{main,test-scenarios}.md`
- Phase 5: `outputs/phase-5/runbook.md`
- 仕様: `phase-06.md`
