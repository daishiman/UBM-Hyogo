# Phase 09: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-skill-ledger-a2-fragment |
| Phase | 9 |
| タスク種別 | implementation（refactoring） |
| visualEvidence | NON_VISUAL |
| workflow | implementation |

## 目的

line budget / link 整合 / mirror parity を一括判定し、Phase 10 最終レビュー前の最後の自動 gate を通過させる。

## 品質ゲート項目

| ID | 項目 | 判定基準 |
| -- | ---- | -------- |
| Q-1 | typecheck | `mise exec -- pnpm typecheck` exit 0 |
| Q-2 | lint | `mise exec -- pnpm lint` exit 0 |
| Q-3 | test 全件 | `mise exec -- pnpm vitest run` exit 0 |
| Q-4 | render script 単体テスト | Phase 4 C-4〜C-12 + Phase 6 F-1〜F-11 全件 Green |
| Q-5 | append helper 単体テスト | Phase 4 C-1〜C-3 全件 Green |
| Q-6 | writer 残存 grep 0 件 | `rg -n "appendFileSync|writeFileSync\([^\n]*(LOGS\.md|logsPath|LOGS_PATH)|const LOGS_PATH|const logsPath = .*LOGS\.md" .claude/skills scripts` writer 経路 0 件 |
| Q-7 | writer 残存 grep 0 件（changelog） | `git grep -n 'SKILL-changelog\.md' .claude/skills/` 0 件 |
| Q-8 | `_legacy.md` 履歴連続性 | `git log --follow LOGS/_legacy.md` で 旧 LOGS.md 履歴が継続 |
| Q-9 | path 上限 240 byte 検証 | append helper 単体テストでカバー済 |
| Q-10 | line budget | `outputs/phase-*/main.md` が 500 行を超えない |
| Q-11 | mirror parity | `.claude/skills/<skill>/` と `.agents/skills/<skill>/` の `diff -qr` 差分 0 |
| Q-12 | link 整合 | `outputs/phase-*/*.md` 内の相対リンク先がすべて存在 |
| Q-13 | artifacts.json 同期 | 各 Phase の `outputs/` 実体と artifacts.json の `outputs[]` が 1 対 1 |

## 実行タスク

- Phase 5 `outputs/phase-5/runbook.md` の実装順序が完了していることを前提に、品質 gate の実行対象を固定する。
- Q-1 〜 Q-13 のすべてを `outputs/phase-9/quality-gate.md` の表で PASS / FAIL 記録。
- 1 件でも FAIL があれば Phase 10 着手禁止。FAIL 内容を該当 Phase（5〜8）へ差戻として明記する。
- 自動チェック実行コマンドの一覧を main.md に列挙：
  ```bash
  mise exec -- pnpm typecheck
  mise exec -- pnpm lint
  mise exec -- pnpm vitest run
  rg -n "appendFileSync|writeFileSync\([^\n]*(LOGS\.md|logsPath|LOGS_PATH)|const LOGS_PATH|const logsPath = .*LOGS\.md" .claude/skills scripts
  git grep -n 'SKILL-changelog\.md' .claude/skills/
  diff -qr .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements
  diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
  ```

## 参照資料

- Phase 4 `outputs/phase-4/test-matrix.md`
- Phase 6 `outputs/phase-6/failure-cases.md`
- Phase 7 `outputs/phase-7/coverage.md`
- Phase 8 `outputs/phase-8/before-after.md`

## 成果物

- `outputs/phase-9/main.md`（PASS / FAIL サマリー・自動チェックコマンド一覧）
- `outputs/phase-9/quality-gate.md`（Q-1〜Q-13 の判定表）

## 統合テスト連携

4 worktree smoke は Phase 11 で実施する。Phase 9 では単体・lint・mirror までを確実に通す。

## 完了条件

- [ ] Q-1 〜 Q-13 すべてが PASS。
- [ ] FAIL があれば差戻先 Phase が main.md に明記されている。
- [ ] mirror parity（`.claude` / `.agents`）の diff 0 が記録されている。
- [ ] artifacts.json の Phase 9 status と整合。
