# Phase 9 — 品質保証

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| 名前 | 品質保証 |
| 状態 | spec_created |
| 依存 | Phase 8 |
| 入力 | Phase 5-8 成果物 |
| 出力 | outputs/phase-09/qa-report.md |

## 目的

typecheck / lint / coverage / 既存テスト regression / test ファイル命名規約 を一括検証し、
Gate-B (implementation_review) 通過の最終 evidence を作る。

## タスク

- [ ] `mise exec -- pnpm typecheck` を実行
- [ ] `mise exec -- pnpm lint` を実行
- [ ] `mise exec -- pnpm test -- --coverage` を全 workspace で実行
- [ ] verify-test-suffix CI gate ローカル相当を実行（`*.spec.ts` のみであることを確認）
- [ ] 既存テスト regression がないことを確認
- [ ] `bash scripts/verify-pr-ready.sh` を実行

## 検証コマンド一覧

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/api test -- --coverage
mise exec -- pnpm --filter @ubm/web test -- --coverage
bash scripts/verify-pr-ready.sh
# *.test.ts が混入していないこと
git ls-files 'apps/**/*.test.ts' 'apps/**/*.test.tsx'  # 結果 0 件
```

## 成果物

- `outputs/phase-09/qa-report.md`
  - 各コマンドの PASS/FAIL とログ要約
  - coverage summary
  - regression 検証結果
  - verify-test-suffix 結果

## 完了条件

- すべての検証コマンドが PASS
- `*.test.ts` が 0 件
- coverage 後退なし

## 注意点 / リスク

- `verify-pr-ready.sh` 失敗時は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` を参照する
- `pnpm install --force` で lockfile drift を検出した場合は commit に含める
