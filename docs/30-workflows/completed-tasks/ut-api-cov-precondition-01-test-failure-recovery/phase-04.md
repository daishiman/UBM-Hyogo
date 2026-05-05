# Phase 4: テスト戦略 — ut-api-cov-precondition-01-test-failure-recovery

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-api-cov-precondition-01-test-failure-recovery |
| phase | 4 / 13 |
| wave | ut-coverage |
| mode | serial |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| workflow_state | implemented-local |
| visualEvidence | NON_VISUAL |

## 目的

F01-F13 を AC、test command、coverage metric、evidence path に接続し、後続実装が「何を走らせれば回復したと言えるか」を固定する。

## 参照資料

- phase-01.md
- phase-02.md
- phase-03.md
- .claude/skills/task-specification-creator/references/coverage-standards.md
- .claude/skills/task-specification-creator/references/phase-template-core.md

## Test Command 戦略

| 段階 | command | 目的 | PASS 判定 |
| --- | --- | --- | --- |
| focused | `pnpm --filter @repo/api test:run -- <target test file>` | F01-F13 を個別に回復確認する | 対象 failure が green。未実行なら PASS 禁止 |
| package coverage | `pnpm --filter @repo/api test:coverage` | apps/api coverage summary 生成を確認する | exit 0 かつ `apps/api/coverage/coverage-summary.json` 生成 |
| repository guard | `bash scripts/coverage-guard.sh --no-run --package apps/api` | apps/api precondition coverage AC を確認する | exit 0 かつ apps/api summary が 80% gate 以上 |

## AC / Evidence 対応

| AC | 対象 | evidence path | Phase 4 での状態 |
| --- | --- | --- | --- |
| AC-1 | F01-F13 all green | `outputs/phase-11/regression-check.md` | planned / 未実測 |
| AC-2 | coverage guard exit 0 | `outputs/phase-11/coverage-result.md` | planned / 未実測 |
| AC-3 | apps/api coverage summary generated | `outputs/phase-11/coverage-result.md` | planned / 未実測 |
| AC-4 | apps/api Stmts/Branches/Funcs/Lines >=80% precondition gate | `outputs/phase-11/coverage-result.md` | planned / 未実測 |
| AC-4b | Statements/Functions/Lines >=85%, Branches >=80% upgrade gate | UT-08A-01 evidence | delegated / 本タスク PASS 条件外 |
| AC-5 | 510 existing pass tests no regression | `outputs/phase-11/regression-check.md` | planned / 未実測 |
| AC-6 | root cause summary | `outputs/phase-06/main.md` | Phase 6 で作成 |

## Coverage 境界

- precondition 閾値: apps/api Statements/Branches/Functions/Lines >=80%。
- upgrade 閾値: Statements/Functions/Lines >=85%, Branches >=80% は UT-08A-01 に委譲。
- 対象: 本タスクは apps/api precondition recovery。apps/web、packages/* の上振れ補強は後続 coverage hardening wave で扱う。
- 禁止: threshold 緩和、対象 package 除外、failing test の skip/todo 化、coverage exclude による数値合わせ。
- 許可: 型定義のみ等、既存 coverage standards が許す除外。ただし decision log と根拠が必要。

## 実行タスク

1. focused / package coverage / repository guard の 3 段階 command を固定する。
2. AC と evidence path の対応を上表で固定する。
3. coverage 除外境界を記録する。
4. Phase 11 で実測するまで PASS にしない文言を明示する。

## 成果物

- Phase 4: `outputs/phase-04/main.md`

## 依存成果物参照

- Phase 2: `outputs/phase-02/main.md`
- Phase 3: `outputs/phase-03/main.md`

## 統合テスト連携

focused test、apps/api package test、coverage generation、coverage guard の順に検証する。Phase 11 では precondition gate（80% + summary 生成 + guard exit 0）を記録し、85% upgrade gate は UT-08A-01 へ委譲する。

## 完了条件

- [ ] F01-F13 の確認 command が focused test から coverage guard までつながっている。
- [ ] coverage AC と evidence path が対応している。
- [ ] 未実行 command は planned / pending と扱われ、PASS と記載されていない。
- [ ] 実装、deploy、commit、push、PR を実行していない。
## 次 Phase への引き渡し

Phase 5 へ、test command 階層、coverage AC、evidence path、coverage 禁止事項を渡す。
