# Implementation guide

## Part 1: 中学生レベル

このタスクは、以前は「テストが2つ落ちているから直す」と考えていた。
しかし、今のワークツリーで同じテストをもう一度動かすと、7個すべて成功した。

たとえるなら、昨日「鍵が壊れている」とメモを残したけれど、今日同じ鍵を同じ扉に差したら普通に開いた状態。
この場合に鍵を削ったり扉を交換したりすると、逆に壊してしまうかもしれない。

そのため、いま無理にコードを変えると、動いているものに不要な変更を入れることになる。
今回の正しい対応は「もう壊れていない」と証拠を残し、古い修正案を撤回すること。

### 用語セルフチェック

| 用語 | 中学生向けの意味 |
| --- | --- |
| stale | 古くなって、今の状態と合わないこと |
| focused test | たくさんではなく、関係するテストだけを動かすこと |
| fakeD1 | 本物のD1の代わりにテストで使う小さな偽物 |
| coverage | コードのどの部分をテストで通ったかの記録 |
| no-code verification | コードを変えず、今の状態が正しいか証拠で確かめること |

## Part 2: 技術者向け

### Classification

- workflow state: `verified_current_no_code_change_pending_pr`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
- parent Issue: #379 CLOSED 維持
- implementation subtype: `stale-current-verification`（元実装タスクを current evidence で no-code close-out）

### Evidence

- `outputs/phase-1/baseline.txt`: `schemaDiffQueue.test.ts` 7/7 PASS
- `outputs/phase-11/after.txt`: `schemaDiffQueue.test.ts` 7/7 PASS
- `outputs/phase-7/coverage-summary-snapshot.json`: focused coverage snapshot
- `outputs/phase-9/typecheck.txt`: `@ubm-hyogo/api` typecheck PASS
- `outputs/phase-9/lint.txt`: `@ubm-hyogo/api` lint PASS

### Code decision

No code files were changed.

TypeScript / API / error / parameter changes are N/A for this cycle because the current repository contract already passes and no public interface or implementation was modified.

Withdrawn implementation candidates:

- `apps/api/src/repository/_shared/__fakes__/fakeD1.ts` AND/OR/IN parser extension
- `apps/api/src/repository/schemaDiffQueue.test.ts` seed parity edit
- `apps/api/src/repository/schemaDiffQueue.ts` SQL rewrite

Reason: the current focused contract test already passes. Adding parser logic without a failing or new contract would increase regression risk.

### Boundary

Invariant #5 is preserved: D1 access remains inside `apps/api`; no app boundary changed.
