# 実装ガイド: 自動生成 skill ledger の gitignore 化（A-1）

## Part 1: 中学生にもわかる説明（日常の例え話）

### なぜ必要か

同じプロジェクトを何人もが別々の作業場で進めると、自動で作られるメモが少しずつ違う内容になり、あとで合わせるときにぶつかります。必要なのは、みんなで共有すべき大事な紙と、その場で作り直せる計算用紙を分けることです。

### 何をするか

学校の連絡袋には「先生にも家にも見せる手紙（連絡帳・配布プリント）」と「自分が問題を解くために書いた計算用紙」が混ざっていることがあります。
連絡帳は提出が必要だけど、計算用紙は答えが出たらもう要らないよね？

git というプログラムは「リポジトリ」というみんなが共有する袋にファイルを入れて管理します。
**`.gitignore`** は、その袋に「これは入れなくていい紙のリスト」を書いておく特別なメモです。

このタスクでやることは:

1. **「自動で作られる計算用紙」を `.gitignore` に書き足す**
   - `indexes/keywords.json` や `LOGS.rendered.md` という自動生成ファイル（計算用紙）は、必要なときに `pnpm indexes:rebuild` というコマンドで作り直せます。
   - だから袋に毎回入れる必要はない。

2. **すでに袋に入ってしまった計算用紙を取り出す**
   - 過去に間違って入れちゃったものを `git rm --cached` というコマンドで取り出します。
   - 中身（ファイル）はそのまま、「袋に入れる印」だけを外すイメージ。

3. **自動配り係（hook）が新しい計算用紙を勝手に袋に戻さないようにする**
   - post-commit hook という「自動配り係」がいて、commit のたびに動きます。
   - この子が「あ、計算用紙無いから新しく作って袋に入れちゃおう」と暴走すると元の木阿弥。
   - だから「もし計算用紙が既にあるなら何もしない（存在チェックでスキップ）」というルールを徹底します。

### 今回作ったもの

- Phase 1〜13 のタスク仕様書
- Phase 11 の NON_VISUAL 代替 evidence
- Phase 12 の実装ガイド、仕様更新サマリー、更新履歴、未タスク検出、スキルフィードバック
- T-6 hook 実装用の未タスク `docs/30-workflows/unassigned-task/task-skill-ledger-hooks.md`

### なぜ A-2 が先に終わってないとダメなの？

`LOGS.md` という「履歴ノート」は連絡帳と一緒で、消したら困る大事な紙です。
A-2 タスクは「履歴ノートを `_legacy.md` という別の保管庫に書き写す」作業で、これが終わる前に A-1（本タスク）でうっかり履歴ノートも `.gitignore` に書いてしまうと、ワークツリーを片付けたときに **本物の履歴が永遠に消えてしまう事故** が起きます。

だから本タスクの仕様書では Phase 1 / 2 / 3 の **3 か所で「A-2 完了が必須」と何度も書いて** 、絶対に順番を間違えないようにしています。

### 4 つのワークツリーで一斉にビルドしても喧嘩しない

ワークツリーというのは「同じプロジェクトの別の作業場」で、4 つ作って同時に作業できる仕組みです。
今までは 4 つの作業場で同時に「計算用紙」を作り直すと、袋に入れた瞬間にお互いがバッティングして「どっちが正しいか分からない！」というエラー（merge conflict）が出ていました。

このタスクで「計算用紙は最初から袋に入れない」ルールを敷くと、4 作業場で同時にビルドしても **conflict が 0 件** になります。これがゴールです。

---

## Part 2: 開発者向け技術詳細

### TypeScript 型定義

```ts
type SkillLedgerGeneratedArtifact =
  | "indexes/keywords.json"
  | "indexes/index-meta.json"
  | "indexes/*.cache.json"
  | "LOGS.rendered.md";

interface SkillLedgerGitignoreSpec {
  taskId: "skill-ledger-a1-gitignore";
  taskType: "docs-only";
  visualEvidence: "NON_VISUAL";
  targetGlobs: SkillLedgerGeneratedArtifact[];
  requiresA2Completed: true;
}
```

### CLIシグネチャ

```bash
git ls-files .claude/skills | rg '(indexes/keywords\.json|indexes/index-meta\.json|indexes/.*\.cache\.json|LOGS\.rendered\.md)$'
git check-ignore -v .claude/skills/<skill>/indexes/keywords.json
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/skill-ledger-a1-gitignore
```

### 使用例

```bash
# docs-only 成果物検証
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/skill-ledger-a1-gitignore

# Phase 12 実装ガイド検証
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/skill-ledger-a1-gitignore
```

### target glob spec（`.gitignore` 追記対象）

| パターン | 意味 | 由来 |
| --- | --- | --- |
| `/.claude/skills/*/indexes/keywords.json` | skill ごとのキーワード抽出索引（自動生成） | task-conflict-prevention-skill-state-redesign Phase 5 runbook §Step 1 |
| `/.claude/skills/*/indexes/index-meta.json` | skill 索引メタ（生成日時・hash） | 同上 |
| `/.claude/skills/*/indexes/*.cache.json` | skill 索引キャッシュ（hash 別） | 同上 |
| `/.claude/skills/*/LOGS.rendered.md` | LOGS から生成される render 済 markdown | 同上 |

> **git glob 文法注意**: 先頭 `/` は repository root 起点を意味する。`*` は `/` を跨がない。`**/` を使うと再帰になるが、本タスクでは skill 配下の固定パス構造を信頼して `*/indexes/` の 1 階層 wildcard で十分。

### `git rm --cached` 実行手順

```bash
# 1. dry-run: 対象ファイルの確認
git ls-files .claude/skills \
  | rg '(indexes/keywords\.json|indexes/index-meta\.json|indexes/.*\.cache\.json|LOGS\.rendered\.md)$'

# 2. 本実行（実 PR で行う）
git ls-files .claude/skills \
  | rg '(indexes/keywords\.json|indexes/index-meta\.json|indexes/.*\.cache\.json|LOGS\.rendered\.md)$' \
  | xargs -I{} git rm --cached -- {}

# 3. .gitignore 追加とまとめてコミット
git add .gitignore
git commit -m "chore(skill): untrack auto-generated ledger artifacts (A-1)"
```

> **重要**: `git rm --cached` は **index からのみ削除**でファイル実体は残る。worktree 上の派生物は次回の `pnpm indexes:rebuild` で再生成される（hook が冪等であれば）。

### hook guard コード例（lefthook.yml）

```yaml
# lefthook.yml に追加する post-commit / post-merge guard の擬似コード
post-commit:
  commands:
    skill-ledger-rebuild:
      run: |
        for skill_dir in .claude/skills/*/; do
          canonical="${skill_dir}indexes/keywords.json"
          # 「存在 → スキップ」の冪等パターン
          if [ -e "$canonical" ]; then
            continue
          fi
          # 未存在のときだけ再生成（canonical を「書く」のは hook の責務外）
          # 派生物のみ生成、git index に add は絶対にしない
          mise exec -- pnpm --filter "$skill_dir" indexes:rebuild || true
        done
      # 重要: git add / git stage を呼ばない（canonical を tracked に戻さない）
```

> **state ownership 境界**:
> - hook は「派生物の存在を保証する」のみ。
> - hook は「canonical を tracked にする」「git index に派生物を add する」を **絶対に行わない**。
> - これにより `git rm --cached` 後の untrack 状態が永続化する。

### 4 worktree 並列再生成 smoke（Phase 11 manual-smoke-log.md と同コマンド系列）

```bash
# §1 worktree 作成
bash scripts/new-worktree.sh feat/skill-ledger-smoke-1
bash scripts/new-worktree.sh feat/skill-ledger-smoke-2

# §2 並列再生成（return code 集約必須）
( cd .worktrees/<smoke-1> && mise exec -- pnpm indexes:rebuild ) & PID1=$!
( cd .worktrees/<smoke-2> && mise exec -- pnpm indexes:rebuild ) & PID2=$!
wait $PID1; RC1=$?
wait $PID2; RC2=$?
[ "$RC1" -eq 0 ] && [ "$RC2" -eq 0 ] || echo "FAIL: parallel rebuild rc=$RC1,$RC2"

# §3 main へ no-ff merge
git -C .worktrees/<smoke-1> checkout main && git merge --no-ff feat/skill-ledger-smoke-1
git -C .worktrees/<smoke-2> checkout main && git merge --no-ff feat/skill-ledger-smoke-2

# §4 conflict 0 件確認
[ "$(git ls-files --unmerged | wc -l)" -eq 0 ] && echo "PASS: conflict 0"
```

> **Phase 11 walkthrough での発見事項**: `wait` の return code を `$RC1` / `$RC2` で個別集約しないと、並列実行のうち 1 件が失敗しても `wait` 自体は成功扱いになる。Phase 5 実装ランブックでは必ず個別 `wait $PID` パターンを採用すること。

### ロールバック手順

```bash
# 緊急時: tracked に戻す
git add -f .claude/skills/<target-skill>/indexes/keywords.json
git add -f .claude/skills/<target-skill>/indexes/index-meta.json
git add -f .claude/skills/<target-skill>/indexes/<hash>.cache.json
git add -f .claude/skills/<target-skill>/LOGS.rendered.md

# .gitignore から該当行を revert
git revert <A-1 commit hash>

git commit -m "revert(skill): re-track A-1 ledger files

Reason: <理由>
Refs #129"
```

> **粒度**: 1〜2 コミットで完全ロールバック可能。submodule 化していないため repo 構造は無傷。

### エラーハンドリング

| エラー | 検出方法 | 対応 |
| --- | --- | --- |
| A-2 未完了 | A-2 workflow / artifact 状態確認 | A-1 実適用を止める |
| hook が派生物を再 add | `git ls-files .claude/skills` に対象 glob が残る | hook から `git add` 系処理を削除 |
| 部分 JSON 書き込み | JSON parse failure / rebuild failure | T-6 で再生成または削除手順を実装 |

### エッジケース

- nested skill 配下の `indexes/*.json` は `*` では拾えない可能性があるため、Phase 6 T8 で再帰 glob 要否を確認する。
- `LOGS.md` 本体は正本なので対象外。`LOGS.rendered.md` だけを派生物として扱う。
- 4 worktree smoke は本 PR では実走しない。実測は Phase 5 実装 PR と T-6 で扱う。

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| `taskType` | `docs-only` |
| `visualEvidence` | `NON_VISUAL` |
| target glob count | 4 |
| required order | A-2 -> A-1 -> A-3 -> B-1 -> T-6 |

### テスト構成

| Layer | 内容 | 証跡 |
| --- | --- | --- |
| Docs structure | Phase 1〜13 / outputs / artifacts parity | `validate-phase-output.js` |
| Spec consistency | 依存 Phase 参照とリンク整合 | `verify-all-specs.js --strict` |
| Phase 12 guide | Part 1 / Part 2 必須構造 | `validate-phase12-implementation-guide.js` |
| Runtime smoke | 4 worktree conflict 0 | T-6 / Phase 5 実装 PR |

### やってはいけないこと

| アンチパターン | 何が起きるか |
| --- | --- |
| A-2 完了を確認せず本タスク実行 | `LOGS.md` 履歴喪失（worktree 削除 / 別 PR checkout で復旧不能） |
| `.git/info/exclude` だけに記述 | 別 worktree / 他開発者環境に共有されない |
| hook が `git add` を呼ぶ | untrack が無効化され、4 worktree conflict が再発 |
| target glob に `LOGS.md`（無印）を含める | A-2 fragment 化前の本物履歴が消える |
| `git add .` / `git add -A` で commit | 無関係ファイル（他 worktree のもの含む）が混入する |

### 設定可能パラメータ（本タスクは導入しない）

> **本タスクは Secret / 環境変数を一切導入しない**。`1Password secret URIVault/Item/Field` 形式の 1Password シークレット注入は本タスクと無関係。`.gitignore` / git index / lefthook.yml の編集のみで完結する。

### 参照

- 上流 runbook: `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md`
- 原典スペック: `docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a1-gitignore.md`
- Phase 11 NON_VISUAL 代替 evidence: `outputs/phase-11/main.md`
- git glob 仕様: https://git-scm.com/docs/gitignore
