# Phase 11: 手動 smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-28 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク分類 | docs-only / runbook-spec |
| visualEvidence | **NON_VISUAL** |

## NON_VISUAL 方針（冒頭明示）

本タスクは `taskType: docs-only / runbook-spec`、`visualEvidence: NON_VISUAL` である。
従って **screenshot は一切作成しない**。`screenshots/` ディレクトリも作らず、`.gitkeep` も配置しない。
`task-specification-creator` skill の Phase 11 NON_VISUAL ルールに従い、代替 evidence として
以下 2 種の Markdown 証跡のみを出力する。

| 代替 evidence | パス | 役割 |
| --- | --- | --- |
| 実行ログ表 | `outputs/phase-11/manual-smoke-log.md` | runbook の dry-run 実行結果（Phase 2 で定義した Markdown 表書式） |
| リンク検証 | `outputs/phase-11/link-checklist.md` | 仕様書群の内部リンクの dead link 検証結果 |

## 実機実行ポリシー（重要）

本タスクは **docs-only**（仕様書のみを生成するタスク）である。
従って **runbook の実機 dry-run は本タスクの Phase 11 では実施しない**。
実機での実行は次の Wave（`scripts/reinstall-lefthook-all-worktrees.sh` 実装タスク）で行い、
その時点で本 Phase 11 の手順とログ書式が再利用される。

本 Phase 11 で出力する `manual-smoke-log.md` は、**書式テンプレートとしての見本行**を 1〜2 行
ダミー値で埋めたものであり、実 worktree への install を伴わない。Phase 6 で定義した
失敗ケース（FAIL / SKIP_NOT_FOUND / OK_AFTER_REBUILD / STALE）が表上に並びうることを
書式として例示することが目的である。

## 目的

- runbook 運用時に使用する `manual-smoke-log.md` の Markdown 表書式を確定する。
- M-01（Phase 3 MINOR 指摘: 実行日時を ISO8601 で記録する習慣の固定）を本 Phase で吸収する。
- 内部リンクの dead link 検査結果を `link-checklist.md` に固定する。
- 実機 smoke test を行う将来 Wave がそのまま使える「テンプレート」を残す。

## 評価観点

| 観点 | 期待 |
| --- | --- |
| 書式の再現性 | テンプレートをコピペすれば誰が実行しても同じカラム構造で記録できる |
| 監査可能性 | 実行日時・worktree path・各種 status が必ず 1 行 1 worktree で残る |
| ISO8601 遵守 | 実行日時は `YYYY-MM-DDThh:mmZ`（UTC）で固定 |
| docs-only 整合 | 実機実行を本タスクで強制しない記述になっている |
| dead link ゼロ | `link-checklist.md` 上で `phase-*.md` / `index.md` / `lefthook-operations.md` 参照が全て生きている |

## Task 一覧

### Task 1: `manual-smoke-log.md` 書式テンプレートの確定

- 目的: 将来の実機 dry-run で同一書式が継続使用されるよう、見出しと表ヘッダを固定する。
- 出力: `outputs/phase-11/manual-smoke-log.md`
- 必須セクション:
  1. 冒頭注記（NON_VISUAL / docs-only / 実機実行は別 Wave である旨）
  2. 表ヘッダ（Phase 2 で定義したカラム + ISO8601 例）
  3. ダミー見本行 2 行（PASS / FAIL の例を 1 行ずつ）

#### 表ヘッダ（固定）

```markdown
| 実行日時 (ISO8601 UTC) | worktree path | install result | lefthook version | hook hygiene | 備考 |
| --- | --- | --- | --- | --- | --- |
```

#### ダミー見本行（書式テンプレート）

```markdown
| 2026-04-28T10:00Z | /Users/dm/dev/dev/個人開発/UBM-Hyogo | PASS | 1.x.x | OK | 見本行（実機未実行） |
| 2026-04-28T10:01Z | /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/legacy-wt | FAIL | - | STALE | 見本行（pnpm rebuild lefthook 二度目失敗・STALE post-merge 検出） |
```

#### 値の語彙（固定）

| カラム | 取り得る値 |
| --- | --- |
| install result | `PASS` / `FAIL` / `SKIP_NOT_FOUND` |
| lefthook version | semver 文字列 / `-`（取得失敗時） |
| hook hygiene | `OK` / `STALE` / `ABSENT` |
| 備考 | 自由記述（例: `OK_AFTER_REBUILD`、`detached HEAD`、`prunable skipped` 等） |

### Task 2: M-01 吸収（ISO8601 表記固定）

- Phase 3 MINOR M-01「実行日時を ISO8601 で書く運用が習慣化していない」を本 Phase で吸収。
- 対応: `manual-smoke-log.md` の冒頭注記に下記文面を必ず含める。

> 「実行日時」カラムは UTC の ISO8601（`YYYY-MM-DDThh:mmZ`）で記録する。`date -u +%Y-%m-%dT%H:%MZ` の出力をそのまま貼ること。ローカルタイム表記・秒精度の追加は禁止。

### Task 3: dry-run 手順（手順記述のみ・本タスクでは実行しない）

将来 Wave で実機実行する際の手順を仕様化する。本 Phase 11 では **実行せず手順のみ記述**。

```bash
# 前提: メイン clone のルートで実行
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo

# 1. 有効 worktree 抽出（prunable 除外）
git worktree list --porcelain

# 2. 単一 worktree で smoke（任意の 1 件を選んで先に検証）
cd <選んだ worktree path>
mise exec -- pnpm install --prefer-offline
mise exec -- pnpm exec lefthook version

# 3. 旧 hook 残存点検
head -n1 .git/hooks/post-merge 2>/dev/null || echo "ABSENT"

# 4. 全件 smoke は scripts/reinstall-lefthook-all-worktrees.sh を実装する Wave で実施
#    本タスク（docs-only）では実行しない
```

> 上記コマンドは **仕様書上の手順**。本 Phase 11 では一切実行せず、
> `manual-smoke-log.md` には書式テンプレートのみ残す。

### Task 4: 内部リンク検証 `link-checklist.md`

- 目的: 仕様書群（`index.md` / `phase-01.md`〜`phase-13.md` / `outputs/**`）が参照する
  内部パスが全て存在することをチェックリスト形式で記録する。
- 出力: `outputs/phase-11/link-checklist.md`
- 必須カラム:

```markdown
| 参照元 | 参照先 | 種別 | 存在確認 |
| --- | --- | --- | --- |
```

- 検査対象（最小セット）:
  - `index.md` → `phase-*.md` の 13 本
  - `phase-12.md` → `doc/00-getting-started-manual/lefthook-operations.md`
  - `phase-12.md` → `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/...`
  - `index.md` → 派生元タスクの `unassigned-task-detection.md`
- 判定: `存在確認 = OK / MISSING`。MISSING が 1 件でもあれば Phase 11 を fail とし、
  該当箇所を修正してから次 Phase に進む。

### Task 5: `screenshots/` を作らないことの明示

- `outputs/phase-11/` 配下に `screenshots/` ディレクトリを作成しない。
- `.gitkeep` も配置しない。
- `manual-smoke-log.md` 冒頭に「NON_VISUAL のため screenshot は無し」と一文を残す。

## 完了条件

- `outputs/phase-11/manual-smoke-log.md` が書式テンプレート + 見本 2 行 + ISO8601 注記を含んで存在する
- `outputs/phase-11/link-checklist.md` が全リンク `OK` 判定で存在する
- `screenshots/` ディレクトリ・`.gitkeep` が **存在しない**
- M-01 が冒頭注記として吸収されている
- 実機 smoke 実行が「別 Wave で行う」と明記されている

## Phase 12 への引き渡し

- `manual-smoke-log.md` の書式テンプレートを `implementation-guide.md` Part 2 から参照する
- ISO8601 注記文面を `lefthook-operations.md` 差分追記時にも転載する
- `link-checklist.md` の検査結果を `system-spec-update-summary.md` の証跡として参照する
