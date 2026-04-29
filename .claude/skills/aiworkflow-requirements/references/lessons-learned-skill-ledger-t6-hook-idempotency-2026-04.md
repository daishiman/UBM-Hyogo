# Lessons Learned — skill-ledger T-6 hook 冪等化と 4 worktree 並列 smoke（2026-04-29）

> `skill-ledger-t6-hook-idempotency`（docs-only / NON_VISUAL / Issue #161）の Phase 1〜13 仕様確定に伴う苦戦箇所と再発防止知見。
> A-1（`skill-ledger-a1-gitignore`）で確立した「派生物 / 正本」境界を、hook 冪等化と 4 worktree 並列 smoke 運用に拡張する文脈で発生した 5 件を記録する。
> 関連正本: `references/technology-devops-core.md`（§Git hook 運用正本 / §CI job 表）/ `references/skill-ledger-gitignore-policy.md`（gitignore 連動の正本境界）/ `references/lessons-learned-verify-indexes-ci-2026-04.md`（CI gate 側の決定論性）
> Wave 同期: `indexes/resource-map.md` / `indexes/quick-reference.md` / `LOGS.md` / `indexes/topic-map.md` / `indexes/keywords.json`

## 概要

T-6 は post-commit / post-merge hook を「再生成戻し」ではなく「副作用ゼロ化と検査」に振る方針を Phase 1〜13 の仕様書として固定するワークフローである。A-1 が確立した派生物 / 正本境界（`indexes/*` は派生物、`LOGS.md` / `references/*` は canonical）は、hook が `git add` 系を一切呼ばず、`pnpm indexes:rebuild` を明示コマンドと CI gate `verify-indexes-up-to-date` に閉じることで初めて成立する。並列開発（4 worktree 同時 wave 進行）下では、hook の副作用 1 行と部分失敗 1 件が即座に PR 混入や破損 JSON として顕在化するため、本タスクで以下の 5 件を仕様レベルで明文化した。

## L-T6-001: hook ガード未追加で `git rm --cached` 直後に hook が再 add する循環

- **症状**: `git rm --cached .claude/skills/aiworkflow-requirements/indexes/keywords.json` を実行した直後、別の作業で `git commit` を打つと post-commit / pre-commit から派生する `pnpm indexes:rebuild` 系処理が新たな `keywords.json` を生成し、続く lefthook の暗黙 stage / `git update-index --add` 経路で再び index 入りしてしまった。
- **影響**: A-1 で gitignore 化したはずの派生物が PR 差分に再混入し、`verify-indexes-up-to-date` の前段で人間レビューが汚染される。最悪のケースでは「gitignore 化の effective 化」自体が PR 内で巻き戻る。
- **緩和策（仕様化）**: AC-1 で post-commit / post-merge hook 内の `git add` / `git stage` / `git update-index --add` 系コマンド全面禁止を明文化し、Phase 5 の hook 検査スクリプトで `grep -nE 'git (add|stage|update-index --add)' scripts/hooks/` が 0 件であることを CI 相当の局所 smoke として固定。`pnpm indexes:rebuild` の副産物は worktree-local に閉じ、stage 化は人間の明示操作のみに限定する。
- **関連 AC**: AC-1（hook 副作用禁止） / AC-3（gitignore 連動の不可逆性）
- **参照**: `docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/index.md` / `references/technology-devops-core.md` §Git hook 運用正本 / `references/skill-ledger-gitignore-policy.md`

## L-T6-002: `pnpm indexes:rebuild` 部分失敗で破損 JSON 残留

- **症状**: indexes:rebuild 実行中に scanner 段で 1 ファイルだけ parse error → 中断した結果、`indexes/keywords.json` が途中まで書き出された半端な JSON として残り、続く `git diff --exit-code` も `jq` 系 lint も誤判定（false PASS / false FAIL の両方）を起こした。
- **影響**: Phase 11 のローカル smoke で「PASS だが実際は壊れている」状態が成立し得る。CI gate `verify-indexes-up-to-date` 側の drift 検出も、入力 JSON が破損していると意味のある diff にならない。
- **緩和策（仕様化）**: 部分失敗時の明示リカバリループを `jq -e . <file> >/dev/null || rm <file>` → `pnpm indexes:rebuild` 再実行 として手順固定。Phase 6 の hook 検査スクリプトおよび Phase 11 の manual-smoke-log 双方に同一手順を記述し、「破損残留 → 手動消去 → 再 rebuild」の 3 ステップを runbook 化。
- **関連 AC**: AC-2（rebuild リカバリ手順）/ AC-7（並列 smoke 健全性）
- **参照**: `docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/outputs/phase-06/` / `references/lessons-learned-verify-indexes-ci-2026-04.md` L-VIDX-001

## L-T6-003: 4 worktree smoke の `wait` 戻り値喪失

- **症状**: 並列 smoke を `pnpm indexes:rebuild & pnpm indexes:rebuild & ... ; wait` で書いた初版で、`wait`（引数なし）の戻り値が「最後にバックグラウンド化したジョブの exit code」のみを返し、途中で fail した子プロセスを smoke 全体が PASS と誤判定するケースが発生。
- **影響**: 4 worktree 並列 smoke の AC-7 が「全 worktree 緑」を保証できず、wave 全体の信頼性が崩れる。
- **緩和策（仕様化）**: `pids=("$!" ...); rc=0; for pid in "${pids[@]}"; do wait "$pid" || rc=$?; done; exit "$rc"` パターンを Phase 7 の smoke スクリプト雛形として固定。bash 配列で PID を捕捉し、各 `wait <pid>` の戻り値を OR 集約することで「1 つでも fail なら smoke 全体 fail」を保証する。
- **関連 AC**: AC-6（並列 smoke の決定論性）/ AC-7（4 worktree full smoke）
- **参照**: `docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/outputs/phase-07/`

## L-T6-004: 4 並列 `pnpm indexes:rebuild` の I/O 飽和

- **症状**: いきなり 4 worktree で `pnpm indexes:rebuild` を並列実行すると、APFS の同時 write / Node の v8 起動コスト / pnpm store の lock 競合が重なり、ローカル MacBook で 1 worktree あたりの実行時間が単独実行比 5〜8 倍に膨張、tail で timeout 寸前まで到達した。原因切り分けも困難（true negative なのか I/O 飽和なのかが見えにくい）。
- **影響**: smoke の wall-clock 信頼性が落ち、開発者が「並列 smoke は重すぎる」と判断して skip する経路ができてしまう。
- **緩和策（仕様化）**: 二段構えとして AC-7 を **2 worktree 事前 smoke → 4 worktree full smoke** に分離。事前 smoke で I/O 飽和有無と単独 fail を切り分けてから full smoke に進む。Phase 7 雛形にもこの順序を埋め込み、事前 smoke 失敗時は full smoke を skip して原因究明を先に行うフローを明記。
- **関連 AC**: AC-7（4 worktree full smoke の二段構え）
- **参照**: `docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/outputs/phase-07/` / `outputs/phase-11/manual-smoke-log.md`

## L-T6-005: A-2（#130）未完了状態で T-6 着手すると `LOGS.md` を gitignore 連動で誤って ignore 化する経路

- **症状**: A-1 の派生物 / 正本境界は確立済みだが、A-2（`LOGS.md` の正本化と例外化）が未完了の段階で T-6 の hook 検査を先行させると、gitignore パターンが広めに効いた状態で `LOGS.md` を「派生物」と誤認し、hook 検査スクリプトが ignore 推奨を出してしまう経路が残る。
- **影響**: canonical の `LOGS.md` が ignore 化されると、A-1 の境界そのものが PR 内で破壊される（lessons-learned の追記が track されない事故）。
- **緩和策（仕様化）**: A-2（Issue #130）完了を T-6 着手の依存 gate として **Phase 1（前提整理）/ Phase 2（依存タスク確認）/ Phase 3（着手判定）の 3 箇所で重複明記**。冗長だが「読み飛ばし耐性」を優先し、いずれか 1 Phase だけ参照しても A-2 未完了を検知できる構造とする。Phase 3 の着手判定では `gh issue view 130 --json state` で OPEN なら HALT する手順まで降ろす。
- **関連 AC**: AC-3（gitignore 連動の境界保全）/ AC-8（依存タスク gate）
- **参照**: `references/skill-ledger-gitignore-policy.md` / `docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/outputs/phase-01/` `outputs/phase-02/` `outputs/phase-03/`

## 関連リンク

- T-6 ワークフロー: `docs/30-workflows/completed-tasks/skill-ledger-t6-hook-idempotency/index.md`
- 派生物 / 正本境界の正本: `.claude/skills/aiworkflow-requirements/references/skill-ledger-gitignore-policy.md`
- hook 運用方針 / CI gate: `.claude/skills/aiworkflow-requirements/references/technology-devops-core.md` §Git hook 運用正本 / §CI job 表
- CI gate 側の決定論性知見: `.claude/skills/aiworkflow-requirements/references/lessons-learned-verify-indexes-ci-2026-04.md`
- lefthook MWR runbook: `.claude/skills/aiworkflow-requirements/references/lessons-learned-lefthook-mwr-runbook-2026-04.md`
- プロジェクト hook 方針: `CLAUDE.md` §Git hook の方針

## 申し送り（open / baseline 未タスク）

- **T6-FU-1**（open）: hook 検査スクリプト本体の implementation タスク（本ワークフローは仕様書整備のみ。`grep -nE 'git (add|stage|update-index --add)'` を CI 化するかは別 ADR）
- **T6-FU-2**（baseline）: 4 worktree full smoke の wall-clock 計測を CI 環境（GitHub Actions runner）でも取得し、ローカル / CI の I/O 特性差を quantify
- **T6-FU-3**（baseline）: A-2（#130）完了後、Phase 1/2/3 の重複明記を 1 箇所に集約できるかの再評価
