# implementation-guide — T-6 hook 冪等化 実装ガイド

> 本ワークフロー（仕様書整備 PR）は実 hook を編集しない。本ガイドは Phase 5 以降の **別 PR** で hook 実装と smoke 実走を担当する人向けの操作仕様。

## Part 1 — 中学生レベルの説明

### なぜ必要か？

このプロジェクトでは、**Git の hook（フック）** という仕組みで、コミットや merge のときに自動で実行されるスクリプトを使っています。これまでは hook が「派生ファイル（自動で作られる JSON など）」を勝手に書き換えてしまい、4 つの作業フォルダ（worktree）を並行で動かしたときにファイルが衝突してしまう問題がありました。

たとえば、同じクラスの名簿を4人が同時にコピーして書き換えると、どれが正しい名簿かわからなくなります。先生が管理する元の名簿（正本）と、コピーして配る名簿（派生物）を分け、コピーは必要なときだけ作り直す、というルールが必要です。

何をするかは、このルールを Git hook と smoke test の手順として固定し、実装 PR で迷わず確認できる形にすることです。

### 何をするタスク？

このタスクは、**hook が「自分から `git add` しない」「すでに派生ファイルがあれば作り直さない」というルールを守れているかを確かめる**作業です。さらに、4 つの作業フォルダで同時に再生成しても **衝突が 0 件**になることを実機で確認します。

### 今回作ったもの

| 成果物 | 内容 |
| --- | --- |
| Phase 1〜13 仕様書 | T-6 の要件、設計、テスト、実装ランブック、Phase 11/12/13 の証跡テンプレ |
| Phase 11 NON_VISUAL evidence | 実 smoke で埋める `manual-smoke-log.md` / `manual-test-result.md` と placeholder |
| Phase 12 文書 | 本ガイド、仕様更新サマリー、更新履歴、未タスク、skill feedback、準拠チェック |

### 派生ファイル / 正本ファイルってなに？

- **正本（canonical）**: 人間が書く・編集する元のファイル。例: skill の Markdown。
- **派生（derived）**: コマンドが正本から自動で作るファイル。例: `indexes/*.json`。

派生ファイルは Git 管理から外し、必要なときだけ `pnpm indexes:rebuild` で作り直すことになっています（A-1 タスクで決定済み）。hook が勝手に派生ファイルをコミットすると、この約束が壊れてしまいます。

### なぜ「冪等（べきとう）」が大事？

冪等とは「**何回やっても同じ結果になる**」性質のこと。hook を何度実行しても、派生ファイルが余計に増えたり消えたりしないことが必要です。

### 何を確認するか（5 行サマリー）

1. hook が `git add` を呼んでいないこと
2. 派生ファイルが既にあれば再生成をスキップすること
3. 失敗で壊れた JSON があれば消して作り直す手順があること
4. 4 つの作業フォルダで同時に動かしても衝突が 0 件であること
5. もし問題が起きても 1 回の `git revert` で元に戻せること

---

## Part 2 — 技術者レベルの実装手順

### 2.1 前提（gate）

| 条件 | 確認方法 |
| --- | --- |
| A-2 (#130) が completed | `gh issue view 130 --json state` |
| A-1 (#129) が completed | `gh issue view 129 --json state` |
| 本仕様書 PR がマージ済み | `git log --oneline | grep skill-ledger-t6` |
| `mise install` / `pnpm install` 済み | `mise current` / `pnpm -v` |
| `jq` 利用可能 | `jq --version` |

不足がある場合は本タスクの実装フェーズに進まない（AC-5）。

### 2.2 コミット粒度（推奨 1〜2 commit）

| # | 範囲 | 例コミットメッセージ |
| --- | --- | --- |
| C1 | hook ガード本体（lefthook 経由 / `git add` 系全廃 / 既存派生物検出スキップ / 部分 JSON リカバリループ） | `fix(hooks): make skill ledger hooks idempotent (T-6)` |
| C2 | smoke 実走 evidence の outputs/phase-11 反映 | `chore(t6): record 4-worktree smoke evidence` |

C1 は `lefthook.yml` および `scripts/<対象スクリプト>.sh` に閉じる。`apps/web` / `apps/api` / `.gitignore` を触らない。

### 2.3 hook ガード実装ポイント

- `lefthook.yml` の対象 hook は **stale 通知のみ** を維持し、再生成は呼ばない。
- 既存補助スクリプトに以下を入れる:
  - `git add` / `git stage` / `git update-index --add` の禁止（grep 検査でも検出される表現で書かない）
  - 派生物存在時は早期 return（例: `[ -s indexes/<file>.json ] && exit 0`）
  - 部分 JSON リカバリループ:
    ```bash
    for f in $(find . -name '*.json' -path '*/indexes/*'); do
      jq -e . "$f" >/dev/null 2>&1 || rm -v "$f"
    done
    ```
- 直接 `.git/hooks/*` を書かない（CLAUDE.md の方針）。

### TypeScript の型定義

実装 PR で smoke 結果を機械処理する場合は、次の最小データ形を使う。実 hook 自体は shell / lefthook 側に置き、TypeScript は検証ログの型安全化にだけ使う。

```ts
export type WorktreeSmokeResult = {
  worktree: string;
  pid: number;
  returnCode: number;
  unmergedCount: number;
  recoveredJsons: string[];
};

export type HookIdempotencyEvidence = {
  task: "skill-ledger-t6-hook-idempotency";
  visualEvidence: "NON_VISUAL";
  nodeVersion: string;
  pnpmVersion: string;
  jqVersion: string;
  results: WorktreeSmokeResult[];
  status: "PASS" | "FAIL";
};
```

### CLIシグネチャ

本タスクで固定する CLI 境界は次の通り。hook から自動再生成を呼ばず、実装 PR の明示操作と CI gate で検証する。

```bash
pnpm indexes:rebuild
jq -e . <json-file>
git ls-files --unmerged
lefthook -V
```

### 使用例

```bash
rc=0
pids=()
for n in 1 2 3 4; do
  (cd ".worktrees/verify-t6-$n" && pnpm indexes:rebuild) &
  pids+=("$!")
done

for pid in "${pids[@]}"; do
  wait "$pid" || rc=$?
done

find . -path '*/indexes/*.json' -exec sh -c 'jq -e . "$1" >/dev/null 2>&1 || rm -v "$1"' _ {} \;
test "$(git ls-files --unmerged | wc -l | tr -d ' ')" = "0"
exit "$rc"
```

### エラーハンドリング

| エラー | 検出方法 | 対応 |
| --- | --- | --- |
| 部分 JSON | `jq -e .` が非 0 | 対象 JSON を削除し、`pnpm indexes:rebuild` を明示再実行 |
| 子プロセス失敗 | `wait "$pid"` が非 0 | PID と return code を `manual-smoke-log.md` に記録し、Phase 6 へ戻す |
| merge conflict | `git ls-files --unmerged` が 1 件以上 | 2 worktree smoke に縮約して原因分離 |
| A-2 未完了 | Issue #130 / A-2 workflow が未完了 | T-6 実装に進まない |

### エッジケース

- 派生物が存在するが 0 byte または不正 JSON の場合は、存在チェックだけでスキップしない。
- 4 worktree のうち 1 つだけ失敗した場合も、最後の `wait` 結果だけで PASS にしない。
- `lefthook.yml` と `.git/hooks/*` の実体がずれている場合は、`.git/hooks/*` を直接直さず `lefthook install` で再配置する。
- 本ワークフローは NON_VISUAL のため、画面 screenshot は不要。`screenshot-plan.json` と代替 evidence を残す。

### 設定項目と定数一覧

| 名前 | 値 | 用途 |
| --- | --- | --- |
| `visualEvidence` | `NON_VISUAL` | screenshot 必須ではないことを明示 |
| `WORKTREE_COUNT_PRECHECK` | `2` | 事前 smoke |
| `WORKTREE_COUNT_FULL` | `4` | full smoke |
| `UNMERGED_EXPECTED` | `0` | merge conflict なしの合格条件 |
| `RECOVER_JSON_GLOB` | `*/indexes/*.json` | 部分 JSON リカバリ対象 |

### テスト構成

| レイヤ | テスト | 期待 |
| --- | --- | --- |
| 静的検査 | hook script に `git add` 系がないことを grep | AC-1 PASS |
| 単体 smoke | 1 worktree で `pnpm indexes:rebuild` | status が汚れない |
| 事前 smoke | 2 worktree 並列 | `unmerged=0` |
| full smoke | 4 worktree 並列 | 全 PID rc=0 かつ `unmerged=0` |
| Phase 12 validator | `validate-phase12-implementation-guide.js` | 12/12 PASS |

### 2.4 smoke 実走手順（Phase 11 と一致）

1. `git checkout main`
2. `for n in 1 2; do bash scripts/new-worktree.sh verify/t6-$n; done`（事前 smoke）
3. `pids=()` → 並列再生成 → `for pid in "${pids[@]}"; do wait "$pid" || rc=$?; done`
4. 部分 JSON リカバリ（`jq -e . || rm -v`）
5. `git merge --no-ff verify/t6-$n` を全件実行
6. `test "$(git ls-files --unmerged | wc -l | tr -d ' ')" = "0"` を確認
7. PASS → `n` を `1 2 3 4` に拡張して 4 worktree full smoke を実行
8. `outputs/phase-11/manual-smoke-log.md` / `manual-test-result.md` を実値で更新

### 2.5 NON_VISUAL evidence の取り扱い

- 本タスクは NON_VISUAL のため、画面スクリーンショットは不要。
- `outputs/phase-11/screenshot-plan.json` で screenshot 不要を明示する（撮影不要）。
- 一次 evidence は `manual-smoke-log.md` / `manual-test-result.md` / `git ls-files --unmerged | wc -l` の標準出力。

### 2.6 ロールバック手順

```bash
# C1 / C2 のいずれが原因でも 1 コミット粒度で戻る
git revert <commit>
mise exec -- pnpm install   # prepare 経由で lefthook install を再配置
lefthook -V                 # 再配置確認

# 派生物に汚染が出た場合
find . -path '*/indexes/*.json' -exec sh -c 'jq -e . "$1" >/dev/null 2>&1 || rm -v "$1"' _ {} \;
mise exec -- pnpm indexes:rebuild
```

A-1 / A-2 状態には影響しない（state ownership 表参照）。

### 2.7 PR チェック観点（実装 PR 側）

- AC-1〜AC-11 のうち、AC-3 / AC-4 / AC-6 / AC-7 / AC-8 は **実走してから埋める**項目。
- 仕様書整備 PR との差分が衝突しないよう、`outputs/phase-11/` 配下のテンプレ追加は実装 PR 側で更新する。
- `verify-indexes-up-to-date` CI gate（`.github/workflows/verify-indexes.yml`）が通ることを確認。
