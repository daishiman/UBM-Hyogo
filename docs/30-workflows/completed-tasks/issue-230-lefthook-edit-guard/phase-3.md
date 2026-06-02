# Phase 3: 設計レビュー（ゲート） — issue-230-lefthook-edit-guard

> Phase 1-2 設計を 3 系統（システム / 価値 / 問題解決）で検証し、Phase 4 着手可否を判定する。

## 3.1 システム系レビュー

| 論点 | 検証 | 判定 |
|------|------|------|
| guard の副作用 | read-only（stage/file 変更なし）。`pre-commit.parallel: true` でも安全 | OK |
| `.git/hooks` 検知の正確性 | `git rev-parse --git-dir` で worktree でも正しい hooks dir を解決（worktree は `.git/worktrees/<wt>` を返すが、hooks は共有 `commondir/hooks`。実装時 `git rev-parse --git-common-dir` を採用し worktree 差異を吸収する） | 要補正（下記 3.4-1） |
| CI で `.git/hooks` を見ない | integrity script は `.git/hooks` を参照せず lefthook.yml ↔ scripts 整合のみ検証。CI checkout 制約と整合 | OK |
| 既存 guard との重複 | `staged-task-dir-guard` 等とスコープ重複なし。新規責務 | OK |

## 3.2 価値・コスト系レビュー

| 論点 | 検証 | 判定 |
|------|------|------|
| 価値 | hook 正本逸脱 drift の早期検知。CLAUDE.md 方針の機械強制 | 妥当 |
| コスト | guard は read-only で commit 時 < 数十 ms。CI job 1 本追加（軽量） | 許容 |
| 優先度 | issue 通り低。だが実装コスト小で 1 サイクル完了 | 妥当 |

## 3.3 問題解決系レビュー

| 論点 | 検証 | 判定 |
|------|------|------|
| 真の論点 | 「hook 正本逸脱の検知不在」。AC-1 の CI literal は手段の誤りで、目的は SSOT 整合維持 | 最適化済（§0 / R-1） |
| AC 充足 | R-1..R-4 が AC-1..AC-4 を観測可能面で 1:1 充足 | OK |
| スコープ境界 | CI での local hook 検知 / 必須 review は技術・運用理由で除外、ack + integrity で代替 | 妥当（CONST_007 例外明記済） |

## 3.4 レビュー指摘と補正（Phase 4 以降へ反映）

1. **worktree の hooks dir 解決**: `git rev-parse --git-dir` は worktree で `.git/worktrees/<name>` を返すため、hooks 共有ディレクトリを正しく指すには **`git rev-parse --git-common-dir`** を使う。Phase 2 疑似コードの `git_dir` 取得を `git rev-parse --git-common-dir` に補正して実装する。
2. **`while read` サブシェル変数**: `offenders` 累積は `process substitution`（`done < <(find ...)`）で親シェル変数を保つ設計（Phase 2 で採用済）。`set -e` 下で `grep` の非ゼロ終了が落とさないよう `|| true` / `continue` を徹底する。
3. **integrity の参照抽出**: `lefthook.yml` の `run:` 行は複数トークン（`bash scripts/x.sh --flag`）を持つため、`awk '{print $NF}'` ではなく **第2トークン（スクリプトパス）抽出**へ補正（`--changed` 等の引数を誤検出しない）。Phase 4/5 で正規表現を精緻化する。

## 3.5 ゲート判定

| 条件 | 判定 |
|------|------|
| 設計が AC-1..AC-4 を充足 | PASS |
| 変更対象ファイル・シグネチャが確定 | PASS |
| 補正事項を Phase 4+ へ明文化 | PASS（3.4） |
| 不変条件と矛盾なし | PASS |

→ **Phase 4（テスト作成仕様）へ進行可**。
