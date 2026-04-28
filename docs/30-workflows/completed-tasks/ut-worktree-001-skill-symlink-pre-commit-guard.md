# skill symlink を pre-commit で検出する lefthook hook - タスク指示書

## メタ情報

```yaml
issue_number: 133
```


## メタ情報

| 項目         | 内容                                                                 |
| ------------ | -------------------------------------------------------------------- |
| タスクID     | ut-worktree-001-skill-symlink-pre-commit-guard                       |
| タスク名     | skill symlink を pre-commit で検出する lefthook hook                 |
| 分類         | バグ予防（守り）                                                     |
| 対象機能     | `.claude/skills` 配下の worktree 境界保全                            |
| 優先度       | 中                                                                   |
| 見積もり規模 | 小規模                                                               |
| ステータス   | 未実施                                                               |
| 発見元       | task-worktree-environment-isolation Phase 2 §7 / Phase 3 §6          |
| 発見日       | 2026-04-28                                                           |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-worktree-environment-isolation` の Phase 2 設計および Phase 3 レビューにて、`.claude/skills` 配下に残存する symbolic link が worktree 間で skill 定義を共有させてしまい、ある worktree での skill 変更が別 worktree の作業に暗黙的に反映される事故が確認された。本タスク（環境隔離）は「方針の docs 化」までを責務とし、実際の pre-commit hook 実装は `task-git-hooks-lefthook-and-post-merge` に申し送られている。

### 1.2 問題点・課題

- `.claude/skills/*` に symlink が混入すると、worktree 境界が破られ別 worktree の編集が混入する
- 現状 `lefthook.yml` には skill symlink 検出ルールが存在しない
- CI でも同等の検査が無く、PR レビュー時点での検知も困難
- 既存 worktree に対しての遡及検証手順が docs 化されていない

### 1.3 放置した場合の影響

- worktree 並列開発時に skill 定義が他タスクへ漏洩し、レビュー対象差分が不正に膨らむ
- skill 変更が意図しない PR に紛れ込み、ロールバック範囲が曖昧化する
- 同事象が再発した際、原因特定が `find -type l` の手動実行頼みとなり MTTR が伸びる

---

## 2. 何を達成するか（What）

### 2.1 目的

`.claude/skills` 配下の symbolic link を pre-commit と CI の二重ガードで継続的に 0 件に保ち、worktree 境界の不変条件を機械的に保証する。

### 2.2 最終ゴール

- `lefthook.yml` の `pre-commit` に skill symlink 検出ジョブが存在し、検出時は exit 1 で commit を失敗させる
- 同等チェックが GitHub Actions 上の CI でも実行され、PR を fail させる
- 既存 worktree への遡及検証コマンドが docs に記載されている

### 2.3 スコープ

#### 含むもの

- `lefthook.yml` への pre-commit ジョブ追加（`find .claude/skills -maxdepth 3 -type l`）
- CI ワークフローへの同等チェック組み込み
- 既存 worktree 遡及検証コマンドの docs 化（`docs/30-workflows/` 配下または CLAUDE.md からのリンク）

#### 含まないもの

- skill 配布手段そのものの再設計（`cp` への切替方針の docs 化のみが本タスク責務、配布スクリプト改修は別タスク）
- `.claude/skills` 以外のディレクトリの symlink 検査
- post-merge / post-checkout hook の実装

### 2.4 成果物

- `lefthook.yml` の差分
- CI ワークフロー（`.github/workflows/*.yml`）の差分
- 遡及検証手順を含む docs 差分
- 検出ルールの動作確認ログ

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-worktree-environment-isolation` Phase 12〜13 が完了し、docs 化された方針が main に取り込まれている
- `lefthook` がリポジトリでセットアップ済みである

### 3.2 依存タスク

- task-worktree-environment-isolation（方針 docs の正本）
- task-git-hooks-lefthook-and-post-merge（hook 実装の担当先候補）

### 3.3 必要な知識

- lefthook の pre-commit ジョブ記述
- `find -type l` による symlink 検出
- GitHub Actions の job step 追加
- worktree と `.claude/skills` の関係（aiworkflow-requirements skill の lessons-learned 参照）

### 3.4 推奨アプローチ

`lefthook.yml` の `pre-commit` に skill-symlink-guard ジョブを追加し、`find .claude/skills -maxdepth 3 -type l -print -quit | grep -q .` で symlink 1 件以上ヒット時 exit 1 とする。CI では同等のシェル断片を共通 step として `.github/workflows/ci.yml` に組み込む。遡及検証は `find .claude/skills -maxdepth 3 -type l` を全 worktree で実行する手順を CLAUDE.md または `docs/30-workflows/` に記す。

---

## 4. 実行手順

### Phase構成

1. 検出ルール仕様の確定
2. lefthook hook 実装
3. CI 連携
4. 遡及検証手順の docs 化
5. 動作確認

### Phase 1: 検出ルール仕様の確定

#### 目的

検出対象パスと exit コード、エラーメッセージを確定する。

#### 手順

1. `task-worktree-environment-isolation` Phase 2 §7 の方針を再読
2. 検出対象を `.claude/skills` 配下の `-maxdepth 3` に限定する根拠を整理
3. 検出時のメッセージ文言を確定（運用者が即座に対処できる文面）

#### 成果物

検出ルール仕様メモ

#### 完了条件

検出パターン・終了コード・メッセージが明文化されている

### Phase 2: lefthook hook 実装

#### 目的

`lefthook.yml` の pre-commit に skill symlink 検出ジョブを追加する。

#### 手順

1. `lefthook.yml` を編集し pre-commit に `skill-symlink-guard` ジョブを追加
2. `find .claude/skills -maxdepth 3 -type l` ヒット時 exit 1 とする
3. ローカルで `lefthook run pre-commit` を実行して動作を確認

#### 成果物

`lefthook.yml` の差分

#### 完了条件

意図的に作成した dummy symlink で commit が失敗することを確認

### Phase 3: CI 連携

#### 目的

CI でも同等の検査を実行し PR を fail させる。

#### 手順

1. GitHub Actions ワークフロー（`.github/workflows/ci.yml` 等）に skill-symlink-guard step を追加
2. 検出時は CI を fail させる
3. PR で動作確認

#### 成果物

CI ワークフロー差分

#### 完了条件

dummy symlink を含む PR で CI が fail する

### Phase 4: 遡及検証手順の docs 化

#### 目的

既存の全 worktree に対して symlink 残存を検査する手順を docs に固定する。

#### 手順

1. `find .claude/skills -maxdepth 3 -type l` を全 worktree で実行する手順を docs に記載
2. `CLAUDE.md` から該当 docs へのリンクを追加（必要に応じて）
3. aiworkflow-requirements skill の lessons-learned に整合確認

#### 成果物

docs 差分

#### 完了条件

オペレーターが docs のみで遡及検証を完遂できる

### Phase 5: 動作確認

#### 目的

pre-commit と CI の双方でガードが機能していることを実機で確認する。

#### 手順

1. ローカル: dummy symlink 作成 → commit 失敗を確認 → 削除 → commit 成功を確認
2. CI: 同条件の PR を作成し fail / pass を確認
3. 全 worktree で symlink 0 件を確認

#### 成果物

動作確認ログ

#### 完了条件

pre-commit / CI / 遡及検証の三系統すべてで期待動作を確認

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `lefthook.yml` の pre-commit に skill symlink 検出ジョブが存在する
- [ ] 検出時 exit 1 で commit が失敗する
- [ ] CI でも同等チェックが実行され、検出時 PR が fail する
- [ ] 既存 worktree への遡及検証コマンドが docs 化されている

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] lefthook ローカル動作確認済み
- [ ] CI 緑

### ドキュメント要件

- [ ] 遡及検証手順が docs に記載されている
- [ ] aiworkflow-requirements skill の lessons-learned との整合が取れている

---

## 6. 検証方法

### テストケース

- `.claude/skills/<skill>/dummy` を symlink として作成 → `git commit` が exit 1 で失敗
- 同 symlink を削除 → `git commit` が成功
- dummy symlink を含む PR で CI が fail
- 全 worktree で `find .claude/skills -maxdepth 3 -type l` が 0 件

### 検証手順

```bash
# ローカル pre-commit ガード確認
ln -s ../../README.md .claude/skills/dummy-link
git add .claude/skills/dummy-link
git commit -m "test" # 失敗することを確認
rm .claude/skills/dummy-link

# 遡及検証
for wt in $(git worktree list --porcelain | awk '/^worktree /{print $2}'); do
  echo "== $wt =="
  find "$wt/.claude/skills" -maxdepth 3 -type l 2>/dev/null
done
```

---

## 7. リスクと対策

| リスク                                                                 | 影響度 | 発生確率 | 対策                                                                 |
| ---------------------------------------------------------------------- | ------ | -------- | -------------------------------------------------------------------- |
| 開発者が独自に skill symlink を再導入                                  | 中     | 中       | pre-commit と CI の二重ガードで commit / merge を双方向にブロック    |
| `.claude/skills` 以外の symlink が後日問題化                           | 低     | 中       | 本タスクスコープ外。再発時に検出パスを拡張する別タスクを起票        |
| lefthook 未インストール環境での commit                                 | 中     | 低       | CI 側ガードで最終的に fail させる二重化を維持                        |
| `find -maxdepth 3` で深い階層の symlink を取りこぼす                   | 低     | 低       | 必要に応じて maxdepth を見直す。当面は skill 配置慣習に整合          |
| 日本語パス（`個人開発`）で find が破綻                                 | 低     | 低       | symlink 検出は path 出力のみで完結し、UTF-8 ロケールで動作確認      |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-12/unassigned-task-detection.md`（§1.1 UT-A）
- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-2/design.md`（§7 リスク表）
- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-3/review.md`（§6 申し送り）
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-health-policy-worktree-2026-04.md`
- `lefthook.yml`
- `.github/workflows/`（CI 実装先）

### 参考資料

- task-git-hooks-lefthook-and-post-merge（担当先候補）
- CLAUDE.md「ワークツリー作成」セクション

---

## 9. 備考

### 苦戦箇所【記入必須】

> task-worktree-environment-isolation 実装時に観測した具体的困難点を記録する。

| 項目     | 内容                                                                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | worktree 間で `.claude/skills` 配下の symlink が残存し、別 worktree の skill 変更が暗黙的に現 worktree に混入した                               |
| 原因     | skill 配布が `cp` ではなく `ln -s` で行われていた／`lefthook.yml` に symlink 検出ルールが無く、CI でも同等チェックが無かった                    |
| 対応     | 本タスク（task-worktree-environment-isolation）では方針の docs 化に留め、pre-commit hook 実装と CI 組込みは本未タスクで行う方針に切り出した     |
| 再発防止 | pre-commit と CI の二重ガードにより `.claude/skills` 配下の symlink 0 件を不変条件として機械的に保証する                                        |

### レビュー指摘の原文（該当する場合）

```
Phase 2 §7: 開発者が独自に skill symlink を再導入 → `.gitignore` ではなく `lefthook` の pre-commit で `find -type l` を検出する案を `task-git-hooks-lefthook-and-post-merge` に申し送る
Phase 3 §6: 横断 / `task-git-hooks-lefthook-and-post-merge` → 「`.claude/skills` 配下の symlink を pre-commit で検出する」を正式申し送り
```

### 補足事項

本タスクは「守り」のバグ予防であり、機能追加ではない。pre-commit と CI の二重化により単一障害点を排除する。skill 配布手段の `cp` への切替は別タスクで扱い、本タスクは検出と失敗化に責務を限定する。
