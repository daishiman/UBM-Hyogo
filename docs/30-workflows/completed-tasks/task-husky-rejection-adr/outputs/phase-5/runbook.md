# Phase 5: runbook.md

日付: 2026-04-28

## 0. 前提

- worktree: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170828-wt-7`
- branch: 本タスク専用 feature ブランチ
- docs-only タスク。`pnpm install` 等の依存変更なし。

## 1. 実装手順

### Step 1: ADR ディレクトリ新設

```bash
mkdir -p doc/decisions
```

### Step 2: ADR-0001 本文の作成

ファイル: `doc/decisions/0001-git-hook-tool-selection.md`

必須セクション:

1. Status（Accepted, 2026-04-28）
2. Context
3. Decision（lane 表を含む）
4. Consequences（Positive / Negative）
5. Alternatives Considered（A. husky / B. pre-commit / C. native git hooks）
6. References
7. 派生元 outputs 抜粋（ADR 単独可読性のためのインライン転記）

### Step 3: ADR README（index）作成

ファイル: `doc/decisions/README.md`

- 命名規約 `NNNN-<slug>.md` を明記
- ADR 一覧表に ADR-0001 行を記載
- 命名規約・必須セクションをガイドとして整理

### Step 4: 派生元 outputs への backlink 追記

| 対象 | 追記箇所 | 内容 |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md` | 第8節 ADR ライト表の直後 | `> 本判断 (ADR-01) は ADR-0001 として独立化されました: [doc/decisions/0001-git-hook-tool-selection.md](../../../../../../doc/decisions/0001-git-hook-tool-selection.md)（2026-04-28, task-husky-rejection-adr）。` |
| `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md` | 第5節末尾（「## 6. 結論」の直前） | `> 本節（husky / lefthook の採否レビュー）は ADR-0001 として独立化されました: [doc/decisions/0001-git-hook-tool-selection.md](../../../../../../doc/decisions/0001-git-hook-tool-selection.md)（2026-04-28, task-husky-rejection-adr）。` |

> 既存記述は書き換えない。Edit ツールで「追記のみ」を実行する。

### Step 5: 整合性チェック

```bash
# ADR ファイル存在確認
ls doc/decisions/0001-git-hook-tool-selection.md doc/decisions/README.md

# backlink 解決確認
( cd docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2 && \
  test -f ../../../../../../doc/decisions/0001-git-hook-tool-selection.md && echo phase-2 OK )
( cd docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3 && \
  test -f ../../../../../../doc/decisions/0001-git-hook-tool-selection.md && echo phase-3 OK )

# 必須セクション存在確認
grep -E '^## (Status|Context|Decision|Consequences|Alternatives Considered|References)' doc/decisions/0001-git-hook-tool-selection.md
```

## 2. ロールバック手順

```bash
# ADR と README を削除
rm -rf doc/decisions

# backlink を派生元から除去
# Edit ツールで Step 4 の追記行を削除する（git restore は使わない: 他の変更を巻き戻す危険）
```

## 3. 影響範囲

| 区分 | ファイル | 変更内容 |
| --- | --- | --- |
| 新規 | `doc/decisions/0001-git-hook-tool-selection.md` | ADR 本文 |
| 新規 | `doc/decisions/README.md` | ADR index |
| 追記 | `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md` | backlink 1 行 |
| 追記 | `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md` | backlink 1 行 |

コードへの影響: なし（docs-only）。CI 影響: なし（既存 doc lint があれば追加 ADR を対象に通す程度）。
