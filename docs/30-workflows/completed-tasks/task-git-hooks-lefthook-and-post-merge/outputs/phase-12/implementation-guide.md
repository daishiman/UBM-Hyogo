# Phase 12 — implementation-guide

## Status

completed

---

## Part 1 — 中学生レベルの説明（日常の例え話）

### この変更は何をするの？

Git というのは「コードの変更履歴を記録する道具」です。Git には「何かしたら自動で動く小さな手順書」をつけることができます。たとえば「保存ボタンを押す前に必ずスペルチェックする」みたいなものです。これを **Git フック** と呼びます。

#### 今までの困りごと（2 つ）

##### 困りごと 1: 手順書がバラバラに置かれていた

今まで、この自動で動く小さな手順書は、ノート（リポジトリ）の **隠しポケット**（`.git/hooks/` フォルダ）に直接書かれていました。けれども、このポケットは **チームで共有できない** という性質を持っています。だから、新しいメンバーが来たり、新しい作業場所（worktree）を作ったりするたびに、毎回手作業でポケットに手順書を入れ直さないといけませんでした。

→ これからは **lefthook** という「手順書を 1 冊にまとめる本」を使います。本（`lefthook.yml`）はチーム全員で共有できるので、誰でも同じルールで動きます。本の中身を変えれば、`pnpm install` を実行するだけで全員のポケットに最新の手順書が自動で配られます。

##### 困りごと 2: 「合流」のあとに勝手に書類が書き換わっていた

今までは、別のブランチ（作業の枝分かれ）を main に **合流** させた直後に、自動で「索引ファイル（indexes）」が書き換えられる仕組みになっていました。これが **本人の作業と全然関係ないファイルの差分** を毎回出してしまい、レビューする人が混乱する原因になっていました。

たとえるなら「友達と一緒に給食当番を交代した瞬間に、勝手に教室の時間割表まで書き換わっていた」という状態です。時間割表は当番交代と関係ないですよね。

→ これからは「合流のあとに自動で書き換える」をやめます。索引ファイルを更新したいときは、自分で **`pnpm indexes:rebuild`** という呪文（コマンド）を唱える、というルールに変えます。これで「気づかないうちに書類が書き換わる事故」は起きません。

### 「接続口（バインディング）」の話

Git には「合流したとき」「コミットする直前」など、いくつかの **接続口** があり、ここに手順書をつなげると自動で動きます。lefthook は、この接続口に手順書をつなぐ作業を全部自動でやってくれる「配線係」のような存在です。

### まとめると何が嬉しいの？

1. 手順書が 1 冊の本にまとまるので、レビューしやすい
2. 新しい作業場所を作っても自動で配線される
3. 関係ないファイルの差分が PR に混ざらなくなる

---

## Part 2 — 技術詳細

### 2.1 `lefthook.yml` schema 抜粋

正本は `outputs/phase-2/design.md` 第 1 節。最小要素のみ再掲する。

```yaml
min_version: 1.6.0
output:
  - meta
  - summary
  - failure

pre-commit:
  parallel: true
  commands:
    staged-task-dir-guard:
      run: bash scripts/hooks/staged-task-dir-guard.sh
      stage_fixed: false
      fail_text: |
        ブランチと無関係なタスクディレクトリが含まれています。
        意図的に含める場合: git commit --no-verify

post-merge:
  parallel: false
  commands:
    stale-worktree-notice:
      run: bash scripts/hooks/stale-worktree-notice.sh post-merge
```

| キー | 役割 | 備考 |
| --- | --- | --- |
| `min_version` | lefthook 最小バージョン要件 | `1.6.0` 以上で `parallel`/`stage_fixed` 安定 |
| `output` | サマリ出力フィルタ | `meta`/`summary`/`failure` の三点セット |
| `<hook>.parallel` | コマンド並列化 | pre-commit のみ true、副作用 lane は false |
| `commands.<key>.run` | 実行コマンド | 必ず `bash scripts/hooks/*.sh` ラッパーを呼ぶ |
| `commands.<key>.stage_fixed` | 自動 stage | guard 系は false（誤った再 stage を防ぐ） |
| `commands.<key>.fail_text` | 失敗時メッセージ | bypass 手順を必ず記載 |

### 2.2 shell I/F（移植先スクリプト）

| パス | 引数 | 戻り値 | 副作用 |
| --- | --- | --- | --- |
| `scripts/hooks/staged-task-dir-guard.sh` | （なし。`git diff --staged --name-only` で staged を取得） | exit 0 = OK / 1 = 違反 | stdout にエラー詳細 |
| `scripts/hooks/stale-worktree-notice.sh` | `$1` = `post-merge` | 常に exit 0（read-only） | stdout に通知メッセージのみ |

> **不変条件**: 通知 lane は副作用を持たない（read-only）。post-merge から `generate-index.js` 呼び出しは **完全削除** する。

### 2.3 `pnpm prepare` / `pnpm indexes:rebuild` API

```jsonc
// package.json (root)
{
  "scripts": {
    "prepare": "lefthook install",
    "indexes:rebuild": "node .claude/skills/aiworkflow-requirements/scripts/generate-index.js"
  },
  "devDependencies": {
    "lefthook": "^1.7.0"
  }
}
```

#### 使用例

```bash
# (1) 初回 / clone 直後 / worktree 作成直後
mise exec -- pnpm install
# → npm lifecycle により `prepare` が走り、`lefthook install` が
#   .git/hooks/{pre-commit,post-merge} を上書き配置する

# (2) skill 仕様（references/*）を変更し、indexes を再生成したいとき
mise exec -- pnpm indexes:rebuild
# → generate-index.js が同期的に実行され、indexes/*.json と topic-map.md を更新

# (3) ローカルで lefthook を一時的に無効化したいとき（緊急用）
LEFTHOOK=0 git commit -m "..."
# または
git commit --no-verify -m "..."
```

#### lefthook 直接実行（dry-run / debug）

```bash
# pre-commit を staged ファイルに対して試す（実 commit せず）
mise exec -- pnpm exec lefthook run pre-commit

# 特定 lane のみ実行
mise exec -- pnpm exec lefthook run post-merge
```

### 2.4 エッジケース

| ケース | 挙動 | 対処 |
| --- | --- | --- |
| `pnpm install` を実行せず clone した | `.git/hooks/*` が未配置 → どのフックも動かない | `pnpm install` を必須化（CLAUDE.md / runbook） |
| 既存 worktree 30+ 件で旧 hook が残存 | 旧 `.git/hooks/post-merge` が動き続け indexes 再生成が継続 | Phase 5 runbook の一括再インストールスクリプトで上書き |
| `lefthook-local.yml` を作って override | コミットされず開発者個別設定として動く | `.gitignore` に `lefthook-local.yml` 追記必須（M-01） |
| `merge=ours` 戦略との競合 | `.gitattributes` で indexes は ours が勝つ。post-merge 廃止により再生成も止まるため整合 | 変更不要 |
| CI 上で hook 起動 | CI は `--no-verify` 相当で hook を回避するのが慣例 | CI 側で同等チェックを別 job として実装（M-04） |
| Go バイナリが手元に無い環境 | `node_modules/.bin/lefthook` が pnpm 経由で配布されるため動作可 | 追加対応不要 |
| `pnpm prepare` 実行中に install が失敗 | hook が未配置のまま | エラー出力で検知し再実行を促す |
| post-merge 廃止後に古い indexes のまま PR | レビュー時に静的検出できない | CI `verify-indexes-up-to-date` job 新設（unassigned-task-detection 参照） |

### 2.5 周知（M-03 対応）

post-merge 廃止に伴い、以下を周知ドキュメントに追記した:

- `CLAUDE.md` の「よく使うコマンド」セクションに `pnpm indexes:rebuild` を追記
- `doc/00-getting-started-manual/` 配下に lefthook 運用 1 ページを追加
- `task-specification-creator` skill の Phase 12 ランブックで「indexes 再生成は明示実行」を明記

### 2.6 NON_VISUAL 証跡

本変更は Git hook / package script / CLI runbook の変更であり、`apps/web` / `apps/desktop` の画面 UI を変更しない。Phase 11 の screenshot は不要。代替証跡は `outputs/phase-11/manual-smoke-log.md` の CLI 出力、`lefthook validate`、`bash -n`、hook 経路 grep、Phase validator の実測結果とする。
