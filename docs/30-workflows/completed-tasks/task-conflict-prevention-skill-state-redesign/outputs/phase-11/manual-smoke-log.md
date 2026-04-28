# Phase 11 Manual Smoke Log — 4 worktree 並列マージ衝突 0 件検証

## NON_VISUAL 理由

本タスクは仕様書・`.gitignore`・`.gitattributes`・hook の設計のみを扱う。
UI ルートも視覚コンポーネントも導入されないため screenshot は生成しない。
primary evidence は **git コマンドの stdout テキストログ**で代替する。

## 証跡保存先

```
outputs/phase-11/evidence/<run-id>/
  ├── wt1.log              # wt1 の git status / commit / push 出力
  ├── wt2.log
  ├── wt3.log
  ├── wt4.log
  ├── merge-wt1.log        # main へ merge した際の git merge 出力
  ├── merge-wt2.log
  ├── merge-wt3.log
  ├── merge-wt4.log
  └── summary.md           # 衝突 0 件の最終結論と env 情報
```

`<run-id>` は `YYYYMMDD-HHMMSS-<git-sha>` 形式。

## 4 worktree 並列検証手順（A-1〜B-1 実装後に実行）

### Step 1: main から 4 worktree 作成

```bash
cd <repo-root>
git checkout main && git pull --ff-only
bash scripts/new-worktree.sh feat/skill-test-wt1
bash scripts/new-worktree.sh feat/skill-test-wt2
bash scripts/new-worktree.sh feat/skill-test-wt3
bash scripts/new-worktree.sh feat/skill-test-wt4
```

### Step 2: 各 worktree で異なる ledger 操作

| WT | 作業内容 | 触るファイル種別 |
| --- | --- | --- |
| wt1 | aiworkflow-requirements の hook 自動再生成（`keywords.json` 等） | gitignore 対象（A-1） |
| wt2 | LOGS への新 fragment 追記（`LOGS/<ts>-<branch>-<nonce>.md`） | fragment 新規（A-2） |
| wt3 | SKILL.md（Progressive Disclosure 後）の独立 section 編集 | skill 本体（A-3） |
| wt4 | lessons-learned に新 fragment 追記 | fragment 新規（A-2） |

各 worktree で:

```bash
# 例: wt2
cd .worktrees/<wt2-dir>
# fragment を作成（実装タスクで scripts が用意される想定）
pnpm skill:logs:append --skill aiworkflow-requirements --kind log --message "wt2 test"
git add -A
git commit -m "test(skill-ledger): wt2 fragment add"
git push origin feat/skill-test-wt2
# stdout 一式を evidence/<run-id>/wt2.log へ保存
```

### Step 3: 順次 main に merge し衝突を観測

```bash
cd <repo-root>
for wt in wt1 wt2 wt3 wt4; do
  git checkout main && git pull --ff-only
  git merge --no-ff origin/feat/skill-test-${wt} \
    2>&1 | tee outputs/phase-11/evidence/<run-id>/merge-${wt}.log
  # 衝突確認
  unmerged=$(git diff --name-only --diff-filter=U)
  if [[ -n "$unmerged" ]]; then
    echo "CONFLICT in $wt: $unmerged"
    break
  fi
done
```

### Step 4: 期待される結果

- すべての `git diff --name-only --diff-filter=U` が空（衝突 0 件）
- ledger fragment が wt1〜wt4 すべてから main に統合されている
- `keywords.json` 等の自動生成物は git tree に出ない（A-1 効果）
- `merge=union` 適用ファイルでは両方の追記が保存される（B-1 効果）

## TC マッピング（Phase 4 検証ケースとの対応）

| TC-ID | ケース | setup | 観測コマンド | 期待 |
| --- | --- | --- | --- | --- |
| TC-1 | 同一 fragment 名衝突（負例） | wt2/wt4 で同名 fragment を強制生成 | fragment validator + `git diff --diff-filter=U` | validator が pre-commit で fail |
| TC-2 | 異なる fragment 並列生成 | 上記 Step 2 wt2/wt4 | `git diff --name-only --diff-filter=U` | 空 |
| TC-3 | gitignore 対象並列再生成 | 上記 Step 2 wt1 | `git status --short -- .claude/skills/*/indexes` | 追跡なし |
| TC-4 | merge=union 並列追記 | 暫定 legacy ledger に行追記 | `git check-attr merge -- <path>` + merge | 両行保存 |
| TC-5 | SKILL.md 別 section 並列編集 | 上記 Step 2 wt3 + 別 wt | `git diff --diff-filter=U` | 通常 merge 成功 |
| TC-6 | render script 時系列 | `pnpm skill:logs:render` | stdout | timestamp 降順 |
| TC-7 | 異常 front matter | 不正 fragment 投入 | render stdout / exit code | 仕様通りエラー |

## 衝突発生時のトリアージ手順

1. `merge-<wt>.log` から衝突ファイルパス一覧を抽出
2. 該当ファイルが A-1（gitignore） / A-2（fragment） / B-1（union）の **どの設計に属するか**を判定
3. 想定外の場合:
   - `outputs/phase-11/main.md` の「未タスク候補」へ追記
   - Phase 12 `unassigned-task-detection.md` へ昇格
4. `git merge --abort` で復旧、env 情報（git version / OS / shell）を `summary.md` に追記

## Issue 記録テンプレート

| TC-ID | 現象 | 期待 | 影響 | 対応 Phase |
| --- | --- | --- | --- | --- |
| (none) | — | — | — | — |

## placeholder-only PASS 禁止方針

- `evidence/<run-id>/` 配下に空ファイル / テンプレ複製のみが存在する状態は **PASS としない**
- 必ず実 stdout を含むこと。実行前は `pending` 状態として記録する。
