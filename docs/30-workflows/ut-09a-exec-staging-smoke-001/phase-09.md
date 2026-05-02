# Phase 9: 品質保証 — ut-09a-exec-staging-smoke-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-exec-staging-smoke-001 |
| phase | 9 / 13 |
| wave | Wave 9 |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 11 実 staging 実行を行う前提として、ローカル品質ゲート（typecheck / lint /
artifacts validator）が通ることを確認する。

## 実行タスク

1. `mise exec -- pnpm typecheck` を実行（spec 作成のみで実装変更がない場合は影響範囲なしを確認）
2. `mise exec -- pnpm lint` を実行
3. `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-09a-exec-staging-smoke-001` を実行
4. evidence path の不存在で validator が想定通り動くことを確認（spec_created 段階では一部 placeholder 扱い）

## 参照資料

- CLAUDE.md「よく使うコマンド」セクション
- .claude/skills/task-specification-creator/scripts/validate-phase-output.js

## 統合テスト連携

- validator は Phase 11 runtime evidence の実測 PASS ではなく、仕様書構造の gate として扱う
- 実 staging smoke は Phase 11 で explicit user instruction 後に実行する

## 実行手順

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  docs/30-workflows/ut-09a-exec-staging-smoke-001
```

## 多角的チェック観点

- spec_created 段階では evidence 実体不足は許容、artifacts parity だけは PASS であること
- typecheck / lint failure は仕様書外要因（未関連 import 等）でないか切り分ける

## サブタスク管理

- [ ] typecheck / lint 結果を outputs/phase-09 に保存
- [ ] validator 出力を outputs/phase-09 に保存
- [ ] outputs/phase-09/main.md を作成する

## 成果物

- outputs/phase-09/main.md
- outputs/phase-09/typecheck.log
- outputs/phase-09/lint.log
- outputs/phase-09/validator.log

## 完了条件

- typecheck / lint が exit 0
- artifacts parity が PASS
- spec_created 状態を逸脱した「Phase 11 PASS 化」が起きていない

## タスク100%実行確認

- [ ] ローカル gate が通っている
- [ ] artifacts parity が PASS

## 次 Phase への引き渡し

Phase 10 へ、ローカル QA 結果を渡す。
