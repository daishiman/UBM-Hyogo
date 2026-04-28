# Phase 7 — coverage.md

## Status

completed

## 手動 trace カバレッジ表

JS/TS カバレッジツールではなく、shell スクリプト行 × トリガー条件 × 検証ケース の対応表で line / branch を保証する。

## 1. lane × shell スクリプト × トリガー × ケース

| lane | スクリプト | トリガー条件 | 主要分岐 | カバーするケース | line | branch |
| --- | --- | --- | --- | --- | --- | --- |
| `pre-commit` | `staged-task-dir-guard.sh` | `git commit` 実行時、staged !=空 | (a) staged 全てが branch と一致 / (b) 不一致あり / (c) staged 空 | TC-PRE-01 / TC-PRE-02 / TC-PRE-03 | 100% | 100%（3/3） |
| `pre-commit` | `staged-task-dir-guard.sh` | `lefthook.yml` 自体を staged | (d) yaml 自身は guard 対象外 | TC-PRE-04 | 100% | — |
| `pre-commit` | `staged-task-dir-guard.sh` | symlink を staged | (e) パス解決後判定 | TC-PRE-05 | 100% | — |
| `post-merge` | `stale-worktree-notice.sh post-merge` | `git merge` 完了直後 | (a) current==main で stale あり / (b) stale なし | TC-PMG-03 / TC-PMG-04 | 100% | 100%（2/2） |
| `post-merge` | （`generate-index.js` 呼び出し**なし**を保証） | merge 完了 | — | TC-PMG-01 / TC-PMG-02 / F4-01〜03 | N/A（不在の保証） | — |
| install | `lefthook install` (binary) | `pnpm install` の `prepare` 経由 | (a) 初回 / (b) 再実行（冪等） | TC-INST-01 / TC-INST-03 | — | 100%（2/2） |
| install | `lefthook install` × 全 worktree | Phase 5 Step 6 ループ | (a) 各 worktree への配置 | TC-INST-02 | — | 100% |
| local override | `lefthook-local.yml` 解釈 | 個別 override 存在時 | (a) skip / (b) 追加コマンド | TC-INST-04 / F3-01〜03 | — | 100%（2/2） |

## 2. 失敗パス（F系統）coverage

| 系統 | 分岐 | カバーするケース | 担保 |
| --- | --- | --- | --- |
| F1: bypass | `--no-verify` / `LEFTHOOK=0` / branch protection | F1-01〜04 | 4/4 |
| F2: 環境欠落 | install 未実行 / バイナリ不在 / arch 不一致 / perm 不正 | F2-01〜04 | 4/4 |
| F3: local override | skip / 追加コマンド / `.gitignore` 確認 | F3-01〜04 | 4/4 |
| F4: 回帰ガード | merge 副作用 / PR diff / 直接 run / 明示再生成許可 | F4-01〜04 | 4/4 |

## 3. 不変条件のカバレッジ（最重要 = F4）

旧 post-merge の `generate-index.js` 自動呼び出しが **二度と復活しない** ことを以下 3 経路で同時に担保する。

| 経路 | 検証手段 | 担当ケース |
| --- | --- | --- |
| 設計層 | `lefthook.yml` の `post-merge` lane に `generate-index` を含めない（review で確認） | Phase 3 review.md GO 判定 |
| ローカル層 | `git merge` 実行後 `git status --porcelain \| grep -F 'indexes/'` が空 | TC-PMG-02 / F4-01 |
| CI 層 | `verify-no-indexes-drift` job が PR 単位で fail させる | F4-02（派生タスク） |

## 4. カバレッジ範囲外（明示）

| 対象 | 対象外の理由 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/scripts/generate-index.js` | 本タスクは呼び出し経路のみ変更し、本体は無変更 |
| GitHub Actions の既存 workflow | 責務分離（authoritative ゲート）であり本タスクで再設計しない |
| husky / pre-commit framework | 採用しない方針が Phase 1 で確定済 |
| Renderer / UI | implementation タスクのため UI なし |

## 5. 集計

| 指標 | 値 |
| --- | --- |
| 変更ファイル数 | 6（新規 3 + 修正 3） |
| 変更行（想定上限） | ~125 行 |
| line coverage（変更行ベース） | 100%（19 ケース × 検証コマンド束で全行発火） |
| branch coverage | 100%（上記表で各分岐に対応ケースあり） |
| 不変条件 F4 の多重防御層数 | 3（design / local / CI） |

## 完了条件チェック

- [x] lane × スクリプト × トリガー × ケース対応表を作成
- [x] F1〜F4 の coverage を 4/4 で網羅
- [x] F4（最重要不変条件）を 3 経路で多重防御
- [x] 対象外を明示
- [x] 集計値を提示
