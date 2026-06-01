# Lessons Learned: Issue #230 lefthook-edit-guard / verify-hook-integrity（2026-05）

> task: `issue-230-lefthook-edit-guard`
> workflow root: `docs/30-workflows/completed-tasks/issue-230-lefthook-edit-guard/`
> state: `implemented_local_runtime_pending / implementation / NON_VISUAL`
> parent: `docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/` U-6
> 関連正本: `references/technology-devops-core.md`（§Git hook 運用正本 / Issue #230 guard）/ `references/workflow-issue-230-lefthook-edit-guard-artifact-inventory.md`
> 対 task-spec-creator: `references/patterns-validation-and-audit.md` パターン9（観測不能 AC の enforcement 面写像）
> Wave 同期: `indexes/resource-map.md` / `indexes/quick-reference.md` / `references/task-workflow-active.md` / `indexes/topic-map.md` / `indexes/keywords.json`

## 概要

Issue #230 は「lefthook.yml を Git hook の唯一の正本とし、手書き `.git/hooks/*` と無 ack の `lefthook.yml` 直編集を機械検知する」task。
最新コードでは guard / CI integrity gate / CODEOWNERS いずれも未実装だったため、local pre-commit `lefthook-edit-guard.sh` + CI `verify-hook-integrity.sh`（`.github/workflows/verify-hook-integrity.yml`）を新規実装した。
実装段階で 4 件の非自明な苦戦箇所が出たため記録する。最大は L-I230-001（AC literal が物理的に観測不能）と L-I230-002（real-repo の `.old` バックアップ false positive で除外条件を一般化）。

## 苦戦箇所

### L-I230-001: AC-1「`.git/hooks/*` 手書きで CI fail」が構造的に観測不能

- 症状: AC-1 を literal 解釈すると「`.git/hooks/` の手書きを CI で fail させる」になるが、`.git/` は Git 管理対象外でリポジトリに含まれず、CI runner の checkout には local `.git/hooks/*` のカスタムファイルが一切現れない。CI では物理的に観測できない。
- 原因: AC の literal（CI 観測）と、AC の目的（hook 正本逸脱の検知）を同一視していた。
- 解決: 目的を保持したまま観測可能な 2 面へ 1:1 写像した。(a) `.git/hooks` を見られる唯一の地点 = **local pre-commit guard**（R-1）、(b) CI で観測可能な SSOT 整合 = `lefthook.yml` 参照スクリプト実在 + tracked stray hook 不在 + `min_version` 健全性の **CI integrity gate**（R-4）。これは scope split / 先送りではなく CONST_007 準拠の enforcement 面写像。
- 再発防止: AC literal が物理的・構造的に観測不能なときは、Phase 1 に「元 AC / 観測不能理由 / 写像後 enforcement 面」表、Phase 10 に AC→R 1:1 trace、Phase 12 compliance に 4 条件 verdict を必須証跡化する（task-spec-creator パターン9 に汎化）。

### L-I230-002: real-repo の `.old`/`.bak` バックアップによる false positive → 除外を `*.sample` 限定から `*.*`（ドット付き全般）へ一般化

- 症状: 設計初版は手書き hook 除外を「`*.sample` のみ」としていたが、real-repo の `.git/hooks/` に存在する `pre-commit.old` 等のバックアップファイルを offender として誤検知し、無関係な commit が block された。
- 原因: 「git が実行する hook 名は拡張子を持たない」という Git の挙動を、除外条件が `*.sample` という一例に過小一般化していた。git は名前にドットを含む hook（`.sample` / `.old` / `.bak` 等）を実行対象にしない。
- 解決: 除外条件を `case "$(basename "$f")" in *.*) continue;; esac`（ドットを含むファイル名は offender にしない）へ一般化（`scripts/hooks/lefthook-edit-guard.sh:65-67`）。Phase 2 設計を修正し、回帰 test LG-h（dotted ファイルを block しない）を focused vitest に追加。
- 再発防止: 「ツールが無視する入力集合」を除外条件にするときは、観測した一例（`.sample`）ではなく**ツールの判定規則そのもの（ドット有無）**で条件化する。具体例 allowlist は脆い。

### L-I230-003: worktree では marker と hooks のディレクトリ解決が異なる（`--git-dir` vs `--git-common-dir`）

- 症状: 本リポジトリは `.worktrees/` で並列開発するため、`git rev-parse --git-dir` で hooks を解決すると worktree 配下を指し、共有 `hooks/` の手書きを検知漏れ／誤検知する。
- 原因: merge/rebase の marker（`MERGE_HEAD` 等）は **per-worktree の git-dir** に置かれるが、hooks は **共有 common-dir** 配下にある。両者を同一 dir 前提で扱っていた。
- 解決: marker skip は `git rev-parse --git-dir`（per-worktree、`scripts/hooks/lefthook-edit-guard.sh:45-46`）、hooks 走査は `git rev-parse --git-common-dir`（共有、`:59-60`）と使い分けた。
- 再発防止: `.git` 構造を扱う guard は worktree を前提に、per-worktree 状態（marker / index）と共有状態（hooks / config）でディレクトリ解決を分ける。設計レビュー観点として `technology-devops-core.md` §Git hook 運用正本 / Issue #230 guard に明文化。

### L-I230-004: lefthook が注入する managed hook を offender にしない署名除外

- 症状: lefthook install が `.git/hooks/` に配置する managed hook（pre-commit 等）まで「手書き」として誤検知すると、正規運用そのものが block される。
- 原因: 「手書き」と「lefthook 管理下」の区別が走査条件に無かった。
- 解決: hook 本文に `LEFTHOOK`/`lefthook` 署名を含むものは除外（`grep -qiE 'LEFTHOOK|lefthook' "$f" && continue`、`scripts/hooks/lefthook-edit-guard.sh:68-69`）。`.sample` 除外（L-I230-002）+ marker skip（L-I230-003）+ 署名除外の 3 層で false positive を抑制し、AC-4 を充足。
- 再発防止: tool-managed なファイルを走査するガードは「tool 署名 allowlist + residual 検出」で設計する（denylist 単独にしない）。task-spec-creator パターン9 の CI enforcement 行と対。

## 同一 wave で正本化した派生・参照

- system spec: `CLAUDE.md`「Git hook の方針」節 / `docs/00-getting-started-manual/lefthook-operations.md`（guard 運用節）
- skill 正本: `technology-devops-core.md`（pre-commit 表 + Issue #230 guard 注記）/ artifact inventory（`## Lessons`）/ task-spec-creator `patterns-validation-and-audit.md` パターン9
- 派生 index（`pnpm indexes:rebuild` 自動生成）: `topic-map.md` / `keywords.json`
