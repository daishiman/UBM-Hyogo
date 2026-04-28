# ADR-0001: Git hook ツールに lefthook を採用、husky を不採用

## Status

Accepted — 2026-04-28

本 ADR は `task-git-hooks-lefthook-and-post-merge` の Phase 2 design ADR-01 および
Phase 3 review 第5節に分散していた判断を、リポジトリ全体の ADR 集約場所に独立化したものである。

## Context

UBM 兵庫支部会のメンバーサイトは pnpm workspace + Cloudflare Workers + Next.js (`@opennextjs/cloudflare`) +
Hono の monorepo として構成され、Node 24 / pnpm 10 を `mise` で固定し、`.worktrees/*` 配下に多数（30+ 件）の
git worktree を並列展開する開発スタイルを採る。Git hook には以下の役割が求められていた。

- pre-commit でブランチ名と無関係なタスクディレクトリ（`docs/30-workflows/task-*`）の混入を阻止する。
- pre-commit で main / dev ブランチへの直接 commit を阻止する（solo 開発の安全網）。
- post-merge で遅延 worktree を通知する（read-only）。
- 旧 `.git/hooks/post-merge` で行っていた skill indexes 自動再生成は無関係 PR への diff 混入の原因となるため
  廃止し、明示コマンド `pnpm indexes:rebuild` に分離する。
- 30+ の worktree それぞれに hook を配布する必要があり、`.git/hooks/*` の手書きでは同期が破綻する。

これらを満たす hook 配布・管理の仕組みとして、Git hook ツールの採否を決める必要があった。

## Decision

1. Git hook の管理ツールとして **lefthook** を採用する。`lefthook.yml` を hook 定義の単一正本とし、
   `pnpm install` の `prepare` script から `lefthook install` を実行して `.git/hooks/*` を自動配置する。
2. **husky を不採用** とする。Node ランタイム必須・shell スクリプトをファイル単位で管理する設計が
   Cloudflare Workers / mise / pnpm workspace の運用と整合しないため。
3. **`.git/hooks/*` の手書き禁止**。`.git/hooks/*` は lefthook によって生成・上書きされる派生物であり、
   開発者が直接編集してはならない。個別の override が必要な場合は `.gitignore` 済みの `lefthook-local.yml`
   を使う。
4. hook 本体ロジックは `scripts/hooks/*.sh` に shell として実装し、`lefthook.yml` からは `run:` で呼び出す。
   YAML inline ではなくファイル化することで diff レビュー粒度を行レベルに保つ。
5. ローカル lefthook は authoritative ではない。`--no-verify` / `LEFTHOOK=0` でバイパス可能であることを
   許容する代わりに、同等の検査を GitHub Actions の `required_status_checks` 側でも実行し、CI を
   authoritative gate とする責務分離を取る。

### 適用境界（lane）

| lane | コマンド | 役割 |
| --- | --- | --- |
| `pre-commit :: main-branch-guard` | `bash scripts/hooks/main-branch-guard.sh` | main / dev への直接 commit を拒否 |
| `pre-commit :: staged-task-dir-guard` | `bash scripts/hooks/staged-task-dir-guard.sh` | ブランチと無関係なタスクディレクトリを拒否 |
| `post-merge :: stale-worktree-notice` | `bash scripts/hooks/stale-worktree-notice.sh post-merge` | 遅延 worktree を read-only で通知 |

## Consequences

### Positive

- hook 設定が `lefthook.yml` 1 ファイルに集約され、worktree 30+ 件への配布が `pnpm install` 1 回で完結する。
- 並列実行（`parallel: true`）により pre-commit lane の実行時間が短縮される。
- 宣言的 YAML + 別ファイル shell の構成により、hook 改修時の diff レビュー性が向上する。
- post-merge での無関係 indexes 再生成を廃止できるため、PR diff のノイズ（毎回 ~600 行の indexes 更新）が消える。
- Go バイナリのため Node のメジャーアップデート（mise 経由の Node 24 等）に追従しやすい。
- ローカル / CI の責務分離が明示でき、CI が authoritative である運用が崩れにくい。

### Negative / Trade-off

- lefthook バイナリ（Go 製）のダウンロード成否がオフライン環境やプロキシ環境に依存する。
  → `pnpm config get registry` 等のトラブルシュートを `doc/00-getting-started-manual/lefthook-operations.md` に集約。
- `pnpm install` を実行しない開発者には hook が配置されない。
  → `scripts/new-worktree.sh` で `pnpm install` を必須化し、CLAUDE.md の開発手順にも明記済み。
- 既存 worktree への一括再インストールは初回 1 回必要（`git worktree list` を回す）。
  → `doc/00-getting-started-manual/lefthook-operations.md` の「初回セットアップ / 既存 worktree への適用」節に runbook 化済み。
- post-merge での自動再生成廃止により、開発者が `pnpm indexes:rebuild` を忘れたまま PR を作るリスクが残る。
  → 別タスク `task-verify-indexes-up-to-date-ci` で GitHub Actions 側の verify job を追加し、CI を authoritative gate にする計画として補完する。

## Alternatives Considered

### A. husky（不採用）

| 項目 | 評価 |
| --- | --- |
| 配布形態 | npm パッケージ（Node ランタイム必須） |
| hook 定義 | `.husky/<hook-name>` に shell ファイルを 1 ファイルずつ配置 |
| 並列実行 | 標準では非対応（自前で `&` / `wait` を書く必要がある） |
| 宣言性 | 低い（ファイル分散・YAML 等の単一正本がない） |

不採用理由:
- hook 1 つにつき 1 ファイル配置のため、hook が増えると diff レビューが分散する。
- Node ランタイム前提のため、`mise` / pnpm の Node バージョン切替時に副作用を受けやすい。
- 並列実行・skip 条件・stage_fixed 等の宣言的記述ができず、運用ルールがファイル名規約に埋もれる。
- 「広く使われている」点は採用根拠としては弱く、本プロジェクトの monorepo + worktree 並列運用に対する
  fit が lefthook の方が高い（派生元 review.md 第5節「反対意見への応答」参照）。

### B. pre-commit（Python 製、pre-commit.com）（不採用）

| 項目 | 評価 |
| --- | --- |
| 配布形態 | Python パッケージ |
| hook 定義 | `.pre-commit-config.yaml`（宣言的 YAML） |
| エコシステム | linter プラグインが豊富（Python 文化圏） |
| 並列実行 | 対応 |

不採用理由:
- Python ランタイム / pip / pipx 等の追加依存が `mise` での Node 24 + pnpm 10 固定方針に対して過剰。
- 本リポジトリの主要 hook は「ブランチ命名と staged path の整合チェック」「main 直 commit ブロック」等の
  プロジェクト固有 shell ロジックであり、pre-commit のプラグインエコシステム（black / isort / eslint 等）の
  恩恵を受けない。
- Python 依存を Cloudflare Workers / Next.js / Hono のスタックに混入させる積極的理由がない。

### C. native git hooks（`.git/hooks/*` 直書き）（不採用）

| 項目 | 評価 |
| --- | --- |
| 配布形態 | 各リポジトリ・各 worktree の `.git/hooks/*` |
| バージョン管理 | 不可（`.git` は git 管理外） |
| 配布 | 開発者ごとに手動 install 必要 |

不採用理由:
- `.git/hooks/*` は git 管理外のため、リポジトリで hook 定義を共有・履歴管理できない。
- worktree が 30+ 件あるため手動 install では同期が破綻する。実際に旧運用では worktree ごとに
  hook の有無・バージョンがずれていた。
- 「`core.hooksPath` を `scripts/hooks/` に向ける」自前運用も検討候補だが、stage_fixed / parallel /
  fail_text 等の lefthook 機能を再実装する必要があり、メンテコストが釣り合わない。

## References

- 派生元判断（workflow outputs）
  - [task-git-hooks-lefthook-and-post-merge Phase 2 design ADR-01](../../docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md)
  - [task-git-hooks-lefthook-and-post-merge Phase 3 review 第5節](../../docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md)
  - [task-git-hooks-lefthook-and-post-merge Phase 12 unassigned-task-detection B-2](../../docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md)
- 現行の正本構成
  - [lefthook.yml](../../lefthook.yml)
  - [doc/00-getting-started-manual/lefthook-operations.md](../00-getting-started-manual/lefthook-operations.md)
  - [CLAUDE.md（「Git hook の方針」節）](../../CLAUDE.md)
- 関連タスク
  - [task-verify-indexes-up-to-date-ci](../../docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci.md)（post-merge 廃止に伴う CI 補完タスク。本文ステータスは未実施）

## 派生元 outputs 抜粋（ADR 単独可読性確保のためのインライン転記）

### Phase 2 design.md「8. 設計上の決定（ADR ライト）」より

> | ID | 決定 | 理由 |
> | --- | --- | --- |
> | ADR-01 | lefthook を採用（husky 不採用） | Node 非依存・Go バイナリで安定・宣言的 yaml |
> | ADR-02 | post-merge 自動再生成を廃止 | 無関係 PR diff の根本原因 |
> | ADR-03 | hook 本体は `scripts/hooks/*.sh` に移植 | yaml に長文 inline するより diff レビュー性が高い |
> | ADR-04 | `lefthook-local.yml` を `.gitignore` 対象に追加 | 開発者個別 override を許容 |

### Phase 3 review.md 第5節「反対意見への応答」より

> | 反対意見 | 応答 |
> | --- | --- |
> | 「husky の方が広く使われている」 | husky は Node 必須。Go バイナリの lefthook の方が CI/Worker 環境で安定。 |
> | 「post-merge 再生成は便利だった」 | 便利さより無関係 diff のコストが大きい。明示実行 + CI 検証で代替する。 |
> | 「shell 化せず yaml inline でよい」 | inline は diff レビュー時に行レベル粒度が粗くなる。スクリプト化を維持。 |
