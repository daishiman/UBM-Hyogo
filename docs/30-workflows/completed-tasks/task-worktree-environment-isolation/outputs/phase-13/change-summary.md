# Change Summary — task-worktree-environment-isolation

> 状態: **ユーザー承認待ち（user_approval_required: true）** — commit / push / PR 作成は未実施。

## Approval Gate

- blocked理由: ユーザーの明示承認が未取得のため、commit / push / PR 作成は禁止。
- local check: docs-only / NON_VISUAL として Phase 11 代替証跡テンプレートとリンク整合を確認済み。EV-1〜EV-7 の実行は後続実装タスクで行う。
- PR template準備状態: `pr-template.md` は READY。PR 作成は未実行。

---

## 1. 変更概要（What changed）

本タスクは **docs-only** であり、コード変更・スクリプト変更は含まない。`docs/30-workflows/task-worktree-environment-isolation/` 配下に以下の仕様書群を新規作成・確定した。

| 区分 | パス | 内容 |
| --- | --- | --- |
| メタ | `index.md` / `artifacts.json` | タスク定義・Phase 構成・横断依存・受け入れ条件 |
| Phase 1 | `phase-01.md`, `outputs/phase-1/main.md` | 要件定義（背景・スコープ・AC-1〜AC-4・リスク） |
| Phase 2 | `phase-02.md`, `outputs/phase-2/main.md`, `outputs/phase-2/design.md` | skill symlink 撤去 / tmux session-scoped state / gwt-auto lock / shell 分離 / NON_VISUAL evidence の設計 |
| Phase 3 | `phase-03.md`, `outputs/phase-3/main.md`, `outputs/phase-3/review.md` | 設計レビュー（AC 整合 / CLAUDE.md 不変条件 / 横断依存） |
| Phase 4 | `phase-04.md`, `outputs/phase-4/...` | テスト設計（境界値・flock/mkdir 二系統・日本語パス） |
| Phase 5 | `phase-05.md`, `outputs/phase-5/runbook.md` | 実装ランブック（`scripts/new-worktree.sh` 改修方針の指示書） |
| Phase 6-9 | `phase-06.md`〜`phase-09.md` | 失敗ケース / カバレッジ / リファクタ / 品質保証 |
| Phase 10 | `phase-10.md`, `outputs/phase-10/go-no-go.md` | 最終レビュー（Go/No-Go） |
| Phase 11 | `phase-11.md`, `outputs/phase-11/manual-smoke-log.md`, `outputs/phase-11/link-checklist.md` | 手動 smoke / リンク整合 |
| Phase 12 | `phase-12.md`, `outputs/phase-12/...` | 実装ガイド / system spec 反映 / changelog / 派生未タスク検出 / skill フィードバック |
| Phase 13 | `phase-13.md`, `outputs/phase-13/main.md`, `change-summary.md`, `pr-template.md` | 完了確認（本ファイル群） |

> **実装変更は含まれない**。`scripts/new-worktree.sh` への lock 機構追加・tmux 設定変更・symlink 撤去操作は、本タスクの設計を入力として **後続実装タスク** で行う。

---

## 2. acceptance_criteria 達成状況（docs 確定 / 実行未実施）

`artifacts.json.acceptance_criteria` の 4 項目について、設計（Phase 2）／レビュー（Phase 3）／検証手順（Phase 6 EV-1〜EV-7）への対応を整理する。

| AC | 受け入れ条件 | 設計対応 | 検証手段（NON_VISUAL evidence） | 状態 |
| --- | --- | --- | --- | --- |
| AC-1 | skill symlink 撤去方針 | `outputs/phase-2/design.md` §1（インベントリ → 撤去 → 検証 → Rollback） | EV-1: `find .claude/skills -type l \| wc -l` = 0 | docs 確定（実行は後続） |
| AC-2 | tmux session-scoped state | `outputs/phase-2/design.md` §2（`update-environment` 最小化 + `-e` 注入 + 命名規約） | EV-2: global に `UBM_WT_*` 無し / EV-3: session に 3 件 | docs 確定（実行は後続） |
| AC-3 | gwt-auto lock | `outputs/phase-2/design.md` §3, §5（mkdir lockdir 正本、hash suffix slug、即時失敗、owner記録） | EV-4: 同一ブランチ二重起動で exit 75 / EV-5: owner メタ 4 行 | docs 確定（実行は後続） |
| AC-4 | NON_VISUAL evidence | `outputs/phase-2/design.md` §6（EV-1〜EV-7） | コマンド列・期待値が表形式で再現可能 | docs 確定（実行は後続） |

4 項目すべて、docs 上で設計・検証手段が一意に決まっている。実装系の最終確定と EV-1〜EV-7 の実測取得は、formalize 済みの `task-new-worktree-script-hardening` で実施する。

---

## 3. 横断依存タスクとの関係

`artifacts.json.cross_task_order` に基づく:

| 順序 | タスク | 本タスクとの関係 |
| --- | --- | --- |
| 1 | `task-conflict-prevention-skill-state-redesign` | **上位（依存元）**。skill 内部 state の持ち方が確定済み前提。本タスクは worktree 側 symlink のみを扱い責務分離 |
| 2 | `task-git-hooks-lefthook-and-post-merge` | **前段**。`.claude/skills/` 配下 symlink を pre-commit で検出する案を正式申し送り（Phase 3 §4） |
| 3 | **task-worktree-environment-isolation（本タスク）** | — |
| 4 | `task-github-governance-branch-protection` | 後段。lock の意味論は branch protection と独立で衝突なし |
| 5 | `task-claude-code-permissions-decisive-mode` | 後段。shell の `OP_SERVICE_ACCOUNT_TOKEN` unset ガイダンス（Phase 2 §4.2）が permissions タスクと連携 |

横断依存への申し送りは Phase 3 レビューおよび Phase 12 派生未タスク検出ドキュメントに記録済み。

---

## 4. 影響範囲

| 領域 | 影響 |
| --- | --- |
| worktree 運用 | docs として `scripts/new-worktree.sh` の lock 化方針・命名規約が確定。**実装は後続タスク**。既存 worktree の互換性は維持（lock 追加のみ） |
| tmux | session-scoped state 設計を docs 化。**opt-in（`--with-tmux` フラグ）**で既存運用に破壊的変更なし。tmux を使わないユーザーには無影響 |
| shell | per-worktree の `mise install` / `hash -r` / `direnv allow` 手順を docs 化。`OP_SERVICE_ACCOUNT_TOKEN` unset を推奨。`CLAUDE.md` の `mise exec --` 運用と整合 |
| skill 構成（`.claude/skills/`） | 撤去方針 docs 化。実ディレクトリでコミット済みのスキル（aiworkflow-requirements, task-specification-creator 等）には影響なし。個別の symlink のみ撤去対象 |
| CLAUDE.md 不変条件 | 衝突なし（Phase 3 §3 で全 10 項目確認済み）|
| 1Password / Cloudflare 連携 | 設計サンプルに `wrangler` 直叩き・`.env` 実値読み取りを含めない。`scripts/cf.sh` / `scripts/with-env.sh` 経路を維持 |
| ランタイム / D1 / API スキーマ | 影響なし（インフラ・DX 領域に閉じる）|

---

## 5. 残課題（後続タスクへ）

- C-1: `flock(1)` vs `mkdir` フォールバックの最終選択 → Phase 5 ランブックで mkdir 方式を推奨、後続実装タスクで確定。
- C-2: `.worktrees/.locks/` の `.gitignore` 確認 → 後続実装タスクで対応。
- C-3: 既存 tmux セッションの汚染 baseline → Phase 11 に取得手順を準備済み。後続実装時に実行する。
- C-4: skill symlink の継続検出 → `task-git-hooks-lefthook-and-post-merge` へ申し送り済み。
- C-5: `BRANCH_SLUG` 境界値（64 文字超）→ Phase 4 テスト設計で境界値テスト規定済み。
- C-6: 既存 worktree への遡及適用手順 → Phase 5 ランブックに記載済み。

---

## 6. 検証ログ（docs-only）

- `artifacts.json` ↔ 各 `phase-XX.md` ↔ `outputs/phase-N/*.md` の outputs 定義と一致（Phase 11 link-checklist 済）。
- CLAUDE.md 不変条件 10 項目に違反なし（Phase 3 §3）。
- ユーザー承認なしの commit / push / PR 作成は **未実施**。
