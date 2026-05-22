# Phase 7: 静的解析・型チェック

skill markdown のみの変更のため `apps/api` / `apps/web` のコードに影響はない想定。ただし、indexes 再生成や CI gate 整合のため最低限の検査を実施する。

## 7.1 typecheck

```bash
mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-11/evidence/typecheck.log
```

期待: 既存ベースラインからの差分なし（PASS）。

## 7.2 lint

```bash
mise exec -- pnpm lint 2>&1 | tee outputs/phase-11/evidence/lint.log
```

期待: 既存ベースラインからの差分なし（PASS）。skill markdown は lint 対象外だが念のため通す。

## 7.3 indexes 検査

```bash
mise exec -- pnpm indexes:rebuild 2>&1 | tee outputs/phase-11/evidence/indexes-rebuild.log
git status .claude/skills/aiworkflow-requirements/indexes
git diff --stat .claude/skills/aiworkflow-requirements/indexes | tee outputs/phase-11/evidence/indexes-diff.log
```

期待: indexes:rebuild が exit 0。diff が発生した場合は同一コミットに含める。

## 7.4 markdown link 検査（手動）

`.claude/skills/task-specification-creator/SKILL.md` および新 reference 2 件、編集した既存 3 reference の markdown リンクを手動でクリック検査（reviewer の責務）。

## 7.5 失敗時のフォールバック

- typecheck / lint が失敗した場合: 本タスクの skill markdown 変更が原因でないこと（既存 ベースラインで再現するか）を確認
- indexes:rebuild が失敗した場合: `pnpm install` 後に再実行
- indexes diff が想定外（aiworkflow-requirements 以外）の場合: ユーザーに報告し、含めるか除くかの判断を仰ぐ

## DoD

- [ ] typecheck.log / lint.log / indexes-rebuild.log / indexes-diff.log の 4 ログが `outputs/phase-11/evidence/` に配置
- [ ] 全コマンドが exit 0
- [ ] indexes diff は aiworkflow-requirements 配下のみ（あるいは差分なし）

## 次フェーズへの引き渡し

Phase 8 では Phase 4 で定義した grep gate / link 到達性検査を実行する。
