# Phase 9: indexes 再生成 + drift 検証 + typecheck/lint/test 実行

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-195-sync-jobs-contract-schema-consolidation-001 |
| Phase 番号 | 9 / 13 |
| Phase 名称 | indexes 再生成 + drift 検証 + typecheck/lint/test 実行 |
| Wave | 5 |
| Mode | parallel（実装仕様書） |
| 作成日 | 2026-05-04 |
| 前 Phase | 8 (unassigned-task ステータス更新 + 03a/03b spec への 1-hop 参照確認) |
| 次 Phase | 10 (レビュー + 整合確認) |
| 状態 | created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | REQUIRED |

## 第 0 セクション: 実装区分の宣言

本 Phase は実装変更の最終検証フェーズ。`mise exec -- pnpm indexes:rebuild` を実行し drift を解消、`typecheck` / `lint` / `vitest` を実行して AC-7 / AC-8 を満たす。

## 目的

Phase 6〜8 の編集後に indexes drift がないことを保証し、typecheck / lint / 全体 vitest が PASS することを確認する。

## 実行タスク

1. `mise exec -- pnpm indexes:rebuild` 実行
2. `git status --porcelain .claude/skills/aiworkflow-requirements/indexes` で drift 0 行を確認
3. drift があれば本 PR に含めて再実行（CONST_007）
4. `mise exec -- pnpm typecheck` 実行
5. `mise exec -- pnpm lint` 実行
6. `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test` 実行
7. 既存テスト回帰: `mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-forms-responses` / `sync-sheets-to-d1`
8. 失敗時は CLAUDE.md PR 自律フローに従い最大 3 回まで自動修復、修復差分をコミット
9. drift があれば `chore(skills): rebuild aiworkflow-requirements indexes` でコミット C5

## ローカル実行コマンド

```bash
# 1. indexes rebuild
mise exec -- pnpm indexes:rebuild | tee outputs/phase-09/indexes-rebuild.log

# 2. drift 確認
git status --porcelain .claude/skills/aiworkflow-requirements/indexes \
  | tee outputs/phase-09/indexes-drift.log

# 3. typecheck
mise exec -- pnpm typecheck | tee outputs/phase-09/typecheck.log

# 4. lint
mise exec -- pnpm lint | tee outputs/phase-09/lint.log

# 5. vitest
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-jobs-schema.test \
  | tee outputs/phase-09/vitest-sync-jobs-schema.log

# 6. 既存テスト回帰
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-forms-responses \
  | tee outputs/phase-09/vitest-sync-forms-responses.log
mise exec -- pnpm --filter @ubm-hyogo/api test -- sync-sheets-to-d1 \
  | tee outputs/phase-09/vitest-sync-sheets-to-d1.log
```

## 期待結果

| ログ | 期待 | 紐づく AC |
| --- | --- | --- |
| indexes-rebuild.log | 正常終了 | AC-7 |
| indexes-drift.log | 0 行 | AC-7 |
| typecheck.log | exit 0 | AC-8 |
| lint.log | exit 0 | AC-8 |
| vitest-sync-jobs-schema.log | 全件 PASS | AC-4 / AC-8 |
| vitest-sync-forms-responses.log | 全件 PASS（回帰なし） | AC-8 |
| vitest-sync-sheets-to-d1.log | 全件 PASS（回帰なし） | AC-8 |

## 失敗時の分岐

| 失敗 | 対応 |
| --- | --- |
| indexes-drift.log に diff | drift をコミット C5 に含める |
| typecheck.log exit !=0 | unused import / 型不整合を最小差分で修正、最大 3 回 |
| lint.log exit !=0 | `mise exec -- pnpm lint --fix` 後、残違反を手修正 |
| vitest fail（新規） | Phase 7 追加テストを再確認 |
| vitest fail（既存回帰） | Phase 6〜8 の変更を確認し、原因が本タスク差分なら revert |

## DoD

- [ ] indexes drift 0 行
- [ ] typecheck PASS
- [ ] lint PASS
- [ ] sync-jobs-schema.test 全件 PASS
- [ ] sync-forms-responses / sync-sheets-to-d1 回帰なし
- [ ] 自動修復が必要だった場合の修復ログが `outputs/phase-09/main.md` に記録

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| evidence | outputs/phase-09/*.log | 実行ログ一式 |
| ドキュメント | outputs/phase-09/main.md | サマリ / 自動修復ログ（あれば） |
| メタ | artifacts.json | Phase 9 を completed に更新（実行時） |

## 統合テスト連携

- 本 Phase が NON_VISUAL タスクの実行検証ゲート
- Phase 11 で evidence ファイルとして再利用

## 完了条件

- [ ] AC-7 / AC-8 verify suite が全 PASS
- [ ] 自動修復が完了している（必要な場合）

## 次 Phase

- 次: 10（レビュー + 整合確認）
- 引き継ぎ事項: 実行ログ一式 / 自動修復差分
- ブロック条件: AC-7 / AC-8 が PASS しない

## 参照資料

- `package.json`
- `.claude/skills/aiworkflow-requirements/scripts/generate-index.js`
- `docs/30-workflows/issue-195-sync-jobs-contract-schema-consolidation-001/phase-04.md`

## 依存 Phase 参照

- Phase 5: `outputs/phase-05/main.md`
