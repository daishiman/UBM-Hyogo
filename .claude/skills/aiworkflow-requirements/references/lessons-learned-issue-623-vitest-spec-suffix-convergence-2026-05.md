# Lessons Learned: Issue #623 Vitest Spec Suffix Convergence (2026-05)

| Meta | Value |
| --- | --- |
| Workflow root | `docs/30-workflows/completed-tasks/issue-623-vitest-spec-suffix-convergence/` |
| Predecessor | Issue #325（apps/api 132 ファイル先行 rename）/ UT-issue-325-followup-003（apps/web + packages + .claude/skills 残件） |
| Date | 2026-05-12 |
| State | implementation_completed / NON_VISUAL / Phase 11 evidence partial（runtime parity pending CI）/ Phase 13 pending_user_approval |
| Scope | `apps/web/**` + `packages/**` + `.claude/skills/**` + `apps/api/migrations/seed/**` 全 159 ファイル `*.test.{ts,tsx}` → `*.spec.{ts,tsx}`（git mv R100）。`vitest.config.ts` の include を `*.spec.{ts,tsx}` 単一に収斂、`coverage.exclude` の `**/*.test.{ts,tsx}` 削除。`scripts/hooks/block-test-suffix.sh` + `lefthook.yml` pre-commit gate、`.github/workflows/verify-test-suffix.yml` CI gate、CLAUDE.md §重要な不変条件 第8項、ADR 末尾「二段階対応終了 2026-05-12」追記。 |

## L-623-001: ENOSPC で full test parity 未取得

- **苦戦**: 実装機 disk full で `pnpm test --run` を実行できず、Issue #325 と同等の `numTotalTests` parity 測定が Phase 11 evidence に取れなかった。
- **原因**: rename 同 wave で `node_modules` / `.vitest-cache` を抱えた状態の worktree 数が多く、disk が枯渇していた。
- **解決パターン**: AC-7（parity 測定）は **runtime-pending** として Phase 11 evidence main.md に明示し、CI 側の `verify-test-suffix` + 既存 vitest workflow で gate を取得する設計判断に切り替えた。実装機での再測定は user approval 後の cleanup 実行に分離。
- **適用条件**: 大量 rename + worktree 並列開発下では、Phase 11 evidence の一部 AC を「runtime-pending（CI で取得）」として明示することを許容する。本判断は実装完了 (`implementation_completed`) を否定しない。

## L-623-002: 二段階移行の終了タイミング判断

- **苦戦**: Issue #325 期間中は `vitest.config.ts` の `test.include` を `*.{test,spec}.{ts,tsx}` 双方 include の暫定 config にしていたが、`*.test.{ts,tsx}` 残存 0 確認後の縮退（`*.spec.{ts,tsx}` 単一化）タイミング判断は Issue #325 の scope-out で別タスク（本 Issue #623）に分離した経緯。
- **解決パターン**: 縮退タスクの起点は「scope out した時点で followup の Issue を切る」「followup から実 rename + config 縮退を 1 PR で実行する」の 2 段化に統一。両 pattern include の期間を最短化するため、Issue #325 close 後に followup-003 で残 159 ファイルを一括 rename → config 縮退を同一 PR にまとめた。
- **適用条件**: vitest include の two-suffix 移行は「rename wave 完了」と「config 縮退」を別 PR にしない。同一 PR で行わない場合は CI 取りこぼし窓が空くため、必ず一括化する。

## L-623-003: import path drift 修正の事前 grep

- **苦戦**: rename 中、被 import 側の path 参照に `.test` 拡張子（例: `import x from './foo.test'`）で参照しているものが残っていないか確認が必要。
- **解決パターン**: rename 実行前に `grep -rn "from ['\"].*\\.test['\"]" apps packages .claude/skills` 等で `.test` 拡張子参照を検出する手順を必須化。本ワークフローでは実際の drift は 0 件だったが、手順としては必須。
- **適用条件**: suffix rename を伴う migration では、被 import side の拡張子参照を grep で事前検証し、検出 0 を Phase 11 evidence に含める。

## L-623-004: lefthook + GitHub Action 二重 gate 設計

- **苦戦**: local 段階で `*.test.{ts,tsx}` 新規追加を block する hook と、CI で block する workflow を両方持たないと、`--no-verify` 突破や手動直接 push（mirror, bot push 等）を防げない。
- **解決パターン**: `scripts/hooks/block-test-suffix.sh`（lefthook `pre-commit.commands.block-test-suffix` から発火）と `.github/workflows/verify-test-suffix.yml`（push / PR で main/dev gate）の二層 gate を採用。前者は速いフィードバック、後者は強制力。CLAUDE.md §重要な不変条件 第8項にも明文化し、人間運用側も担保する。
- **適用条件**: convention enforcement が必要な「拡張子 / 命名 / placement」系 invariant は local hook + CI gate + CLAUDE.md 明文化の三層で防御する。一層だけでは突破可能。

## 引用関係

- 前段: `lessons-learned-issue-325-test-suffix-rename-migration-2026-05.md`（apps/api 132 ファイル先行 rename）。本 Issue #623 はその scope-out 棚卸し（L-325-005）の正式 follow-up。
- inventory: `workflow-issue-623-vitest-spec-suffix-convergence-artifact-inventory.md`
- legacy lifecycle: `legacy-ordinal-family-register.md` の 2026-05-12 NOTE を参照（issue-NNN namespace は ordinal family 外のため Current Alias Overrides 行は追加しない）。
- ADR: `docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md`（末尾「二段階対応終了 2026-05-12」を本 Issue で追記）
