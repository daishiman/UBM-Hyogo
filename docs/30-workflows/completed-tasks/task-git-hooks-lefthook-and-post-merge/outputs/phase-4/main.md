# Phase 4 — テスト設計

## Status

completed

## 設計サマリ

implementation / NON_VISUAL タスクのため、本 Phase ではテストコードを書かない。本タスクが遵守するテスト仕様（command suite と expected result）を定義する。

検証戦略は次の 3 系統に分ける。

| 系統 | 目的 | 主手段 |
| --- | --- | --- |
| L1: lefthook lane の dry-run | 各 lane が登録され、対象ファイルで起動するか | `lefthook run <hook> --files <list>` |
| L2: 副作用ゼロ確認 | post-merge が `indexes/*` を変更しないか | `git status --porcelain` の差分 grep |
| L3: 通知出力 grep | stale worktree 通知 / origin 進行通知が想定文言を出すか | stdout/stderr の `grep -F` |

> private method テスト方針 [Feedback P0-09-U1]: 本タスクは shell スクリプト + yaml 設定のため private method なし。N/A。
>
> Props vs internal state [VSCPKR-03]: UI コンポーネント無し。N/A。

## 前提環境チェック [FB-MSO-002]

実装タスクが Phase 4 着手前に確認すべき項目。

```bash
# 1. lefthook バイナリ確認（pnpm install 後）
mise exec -- pnpm exec lefthook version

# 2. 旧 .git/hooks/* が残っていない（lefthook install 後）
head -1 .git/hooks/pre-commit | grep -q lefthook
head -1 .git/hooks/post-merge | grep -q lefthook

# 3. scripts/hooks/*.sh に実行権限
test -x scripts/hooks/staged-task-dir-guard.sh
test -x scripts/hooks/stale-worktree-notice.sh
```

## テストマトリクス概要

詳細は `outputs/phase-4/test-matrix.md`。各ケースは「ケース ID／lane／前提／実行コマンド／期待出力／検証コマンド」で構成する。

主要カテゴリ:

- TC-PRE-* : pre-commit lane（staged-task-dir-guard）
- TC-PMG-* : post-merge lane（stale-worktree-notice / **再生成しないことの確認**）
- TC-INST-* : `lefthook install` の冪等性・worktree 配布
- TC-BYP-* : `--no-verify` バイパス挙動（後続 Phase 6 で詳細化）

## カバレッジ目標 [Feedback BEFORE-QUIT-002]

対象範囲は次の変更行のみに限定する。

| ファイル | 変更箇所 | 目標 |
| --- | --- | --- |
| `lefthook.yml` | 全行 | lane × commands を 100% 起動 |
| `scripts/hooks/staged-task-dir-guard.sh` | guard 判定分岐 | branch一致 / 不一致 / `--no-verify` の 3 経路 |
| `scripts/hooks/stale-worktree-notice.sh` | post-merge 引数分岐 | 2 経路 |
| `package.json` `prepare` script | 単一行 | `pnpm install` で発火することを 1 回確認 |

`generate-index.js` 本体は変更しないためカバレッジ対象外。

## 完了条件チェック

- [x] L1/L2/L3 戦略を明文化
- [x] 主要ケース ID 体系を定義
- [x] 前提環境チェックを記載
- [x] カバレッジ範囲を変更行に限定
- [x] test-matrix.md を作成（次セクション）
