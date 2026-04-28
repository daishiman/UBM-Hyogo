# Lessons Learned — Git Hook 統一 / post-merge indexes 再生成廃止（2026-04-28）

> task-git-hooks-lefthook-and-post-merge（implementation / NON_VISUAL）の Phase 1〜12 完了に伴う苦戦箇所と再発防止知見。
> 関連正本: `references/technology-devops-core.md`（§Git hook 運用正本 L351-365）
> Wave 同期: `indexes/resource-map.md` / `indexes/quick-reference.md` / `LOGS.md` / `indexes/topic-map.md` / `indexes/keywords.json`

## 教訓一覧

### L-LH-001: post-merge での自動 indexes 再生成は「無関係 diff の発生源」となる

- **状況**: 旧 `.git/hooks/post-merge` で `aiworkflow-requirements/indexes/*.json` / `topic-map.md` を毎回再生成していたため、merge 直後に開発者の作業と無関係な generated diff が PR に混入し、レビュー混乱・誤 approve の温床となっていた。
- **原因**: 「自動化＝善」と捉え、副作用ありの再生成を hook に置いた。worktree 横断で他ブランチ作業が反映され、自分の差分と判別できなくなる。
- **教訓 / How to apply**:
  1. **副作用のある再生成は hook に乗せず、明示コマンドへ昇格**する（`pnpm indexes:rebuild` 等）。
  2. `post-merge` lane は read-only 通知のみ（例: stale worktree notice）に限定する。
  3. 「忘れて古いまま PR」リスクは CI 側の drift 検証 job で塞ぐ（`task-verify-indexes-up-to-date-ci.md`）。

### L-LH-002: lefthook を採用するなら「単一正本化」を仕様で明示する

- **状況**: Phase 2 design.md で lefthook 採用判定は行ったものの、`.git/hooks/*` の手書きを禁ずる旨と、`generate-index.js` 呼び出しを post-merge から削除する旨の仕様化が不十分で、Phase 3 design review で MINOR 指摘 M-04 として顕在化。
- **教訓 / How to apply**:
  - hook 関連の仕様書では「正本 = lefthook.yml」「派生物 = `.git/hooks/*`」を冒頭で宣言する。
  - 仕様文に「禁止事項（`.git/hooks/*` の手書きを正本化しない）」を 1 行で明記する。
  - 「自動 → 明示」への転換は、必ず痛み事例（例: 過去の無関係 diff 混入）を併記して動機を残す。

### L-LH-003: lefthook の supported hook schema を version で事前確認する

- **状況**: `post-fetch` lane を定義しようとしたが、lefthook `min_version: 1.6.0` 制約で `post-fetch` は supported hook schema 外（Phase 11 discovered-issue P0-01）。実装段階で発覚し、設計を修正。
- **教訓 / How to apply**:
  - Phase 2 設計時点で lefthook docs（https://lefthook.dev/configuration/）の supported hook 一覧を版指定（`min_version`）と突合する。
  - サポート外の hook が必要な場合は GitHub Actions / 別の明示コマンドへ責務を逃がす設計に切り替える。

### L-LH-004: branch slug と staged task-dir の整合は token overlap で動的判定する

- **状況**: `staged-task-dir-guard.sh` で「ブランチと無関係なタスクディレクトリの混入」を検出する際、固定ホワイトリスト方式だとブランチ名の揺れ（`feat/` / `feature/` / hyphen vs underscore）で誤判定が頻発した。
- **教訓 / How to apply**:
  - branch slug を「`/` 以降を hyphen 区切り token 化」して、staged path の token と overlap 判定するアルゴリズムを採る。
  - 1 token でも overlap すれば pass、0 token なら fail（意図的混入は `git commit --no-verify`）。
  - hook 失敗時の `fail_text` には bypass 手順 (`--no-verify`) と除外手順 (`git restore --staged`) を併記する。

### L-LH-005: 運用ガイドは「集約場所」と「優先順位」を仕様化する

- **状況**: post-merge 廃止に伴う周知が `CLAUDE.md` / `doc/00-getting-started-manual/lefthook-operations.md` / skill `LOGS.md` / `references/technology-devops-core.md` に分散し、開発者が「どこを見ればよいか」迷う状態を残した（skill-feedback-report.md 観点）。
- **教訓 / How to apply**:
  - 集約場所の優先順位を仕様で固定する: (1) `CLAUDE.md`（最初に開く） → (2) `doc/00-getting-started-manual/lefthook-operations.md`（運用詳細） → (3) `references/technology-devops-core.md`（システム仕様正本）。
  - skill `LOGS.md` は履歴台帳。検索性は `indexes/quick-reference.md` の早見表で担保する（本ドキュメント wave 同期の根拠）。

### L-LH-006: post-merge 廃止と CI gate `verify-indexes-up-to-date` の責務分離

- **状況**: post-merge を廃止して indexes 再生成を `pnpm indexes:rebuild` の明示コマンドへ昇格させた結果、「忘れて古いまま PR」リスクが残った。一方で hook 層に副作用ある再生成を戻すと L-LH-001 で潰した「無関係 diff の発生源」問題が再発する。
- **教訓 / How to apply**:
  1. **hook = read-only 通知のみ**（lefthook stage で副作用ある generated 物を作らない）。
  2. **CI = drift authoritative gate**（`task-verify-indexes-up-to-date-ci` で `pnpm indexes:rebuild` 後の `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` を fail 条件にする）。
  3. 二者の責務境界は仕様書（`technology-devops-core.md` Git hook 運用正本 / CI job 表）で 1 行ずつ明示し、再発防止ループを「hook を弄る」ではなく「CI gate を直す」に固定する。
  4. drift 検出範囲は `.claude/skills/aiworkflow-requirements/indexes` に限定し、他 skill への横展開判定は ADR で別途決める（影響範囲の暴走防止）。

### L-LH-MW-001: multi-worktree 一括 reinstall は逐次必須（並列禁止）

- **状況**: 30+ worktree への lefthook 一括 reinstall を並列化したくなるが、各 worktree が共有する pnpm store / `~/.local/share/pnpm` への同時書き込みで store が破壊されるリスクがある。`mise exec -- pnpm exec lefthook install` 自体は軽量だが、依存解決経路が pnpm store にアクセスする以上、並列実行は store の整合性を保証できない。
- **教訓 / How to apply**:
  - `scripts/reinstall-lefthook-all-worktrees.sh` は **逐次実行のみ**（`for` / `while read` ループ、`xargs -P` や `parallel` を使わない）。
  - 30+ worktree の所要時間は許容（数分オーダ）。並列化で得る短縮より store 破壊からの復旧コストの方が大きい。
  - runbook 本文に「並列禁止」を明記し、将来の最適化提案に対するガードを置く。
  - 並列化したい場合は worktree ごとに pnpm store を分離する設計が前提となるため、本タスクスコープ外（別 ADR）。

### L-LH-MW-002: SKIP（node_modules 未生成）許容と manual-smoke-log 転記契約

- **状況**: 30+ worktree のうち一部は `node_modules` 未生成で `pnpm exec lefthook` が解決できない。これを FAIL とすると完了条件が成立せず、他方で「全件 PASS」を強制すると未使用 worktree への先行 `pnpm install` が要求され副作用が大きい。
- **教訓 / How to apply**:
  - 完了条件は **「FAIL = 0 件」のみ**とし、`node_modules` 未生成 / 対象外 path 判断は **SKIP** として理由付きで summary に残す（PASS / SKIP / FAIL の 3 値分類）。
  - script 終了コードは「FAIL≥1 → exit 1 / FAIL=0 → exit 0（SKIP のみ残っても成功）」に固定する。
  - **stdout 出力を Phase 11 `manual-smoke-log.md` へ転記する運用契約**を runbook に明文化する（PR 本文または同名タスクディレクトリの `outputs/phase-11/manual-smoke-log.md`）。これにより「いつ誰がどの worktree に install したか」の監査痕跡が残る。
  - SKIP は未達ではないが「将来の install 対象候補」として可視化することで、運用者が忘却なく次回判断できる。

## 申し送り（open / baseline 未タスク）

- **C-1**（completed）: CI `verify-indexes-up-to-date` job 新設 — `docs/30-workflows/completed-tasks/task-verify-indexes-up-to-date-ci/`（implementation_completed_pr_pending）
- **B-1**（formalize 完了 / 2026-04-28）: 既存 worktree 群への lefthook 再インストール runbook 運用化は `docs/30-workflows/completed-tasks/task-lefthook-multi-worktree-reinstall-runbook/` で formalize、`scripts/reinstall-lefthook-all-worktrees.sh` で実装。固有教訓は `references/lessons-learned-lefthook-mwr-runbook-2026-04.md` に分離（L-MWR-001〜006）。
- **B-2**（resolved 2026-04-28 / task-husky-rejection-adr）: `husky` 不採用判断は ADR-0001 として `doc/decisions/0001-git-hook-tool-selection.md` に集約済み。後続テンプレート整備は `docs/30-workflows/unassigned-task/task-adr-template-standardization.md`、運用ガイドからのバックリンク追加は `docs/30-workflows/unassigned-task/task-lefthook-ops-adr-backlink.md` に formalize。
