# Phase 12 skill feedback report

- status: PASS（same-wave routing 済み）
- skill feedback items: 1（task-specification-creator 側へ反映済み、aiworkflow 側は no-op）

## Notes

- 学び: 03b sync (`processResponse`) は 07a hook (`enqueueTagCandidate`) を末尾で呼ぶため、`FakeD1` のような job 単位 fake を使うとき、関連テーブル (`tag_assignment_queue`, `member_tags`) の最低限の SELECT/INSERT 経路を追加しないと、本流 (`runResponseSync`) が `failed` を返してしまう。
- 教訓: hook が後段で増えた場合、上流テストの fake 拡張が必要かを実装前に走査する。具体的には、新規 hook 追加時に「production 側で hook を呼ぶ箇所の test (`grep -l "<hook>" apps/api/src/**/*.test.ts`)」と「対象 hook が触る repository 関数の DB クエリ」を突き合わせる。
- promotion target: `.claude/skills/task-specification-creator/references/coverage-standards.md` と `.claude/skills/task-specification-creator/references/phase-template-core.md` に coverage AC 必須記載と coverage guard 経路を same-wave 反映済み。
- aiworkflow no-op reason: `database-implementation-core.md` は runtime D1 実装正本であり、今回の差分は test fixture drift の回復に限定されるため、アプリ仕様としての新規 D1 契約は追加しない。
- evidence path: `outputs/phase-12/system-spec-update-summary.md`、`outputs/phase-12/implementation-guide.md`。
