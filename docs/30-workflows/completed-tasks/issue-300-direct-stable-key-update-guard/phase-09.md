[実装区分: 実装仕様書]

# Phase 9: 品質検証 / grep gate / coverage-guard

## メタ情報

| 項目 | 値 |
| --- | --- |
| 作成日 | 2026-05-15 |
| Phase 状態 | completed |
| 出力 | `outputs/phase-09/main.md` |

## 検証コマンド一覧

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck                                          # → outputs/phase-11/evidence/typecheck.log
mise exec -- pnpm lint                                               # → outputs/phase-11/evidence/lint.log
mise exec -- pnpm test -- scripts/lint-stable-key-update.spec.ts     # → outputs/phase-11/evidence/test.log
mise exec -- pnpm build                                              # → outputs/phase-11/evidence/build.log
mise exec -- node scripts/lint-stable-key-update.mjs --strict        # → outputs/phase-11/evidence/grep-gate.log
mise exec -- bash scripts/coverage-guard.sh
```

## grep gate（手動 violation 注入で fail 確認）

1. `apps/api/src/repository/schemaQuestions.ts` に一時的に `UPDATE schema_questions SET stable_key = '?'` リテラルを追加
2. `mise exec -- node scripts/lint-stable-key-update.mjs --strict` が **exit 1** を返すこと
3. 差分を `git restore` で取り消し、再実行が **exit 0** に戻ること
4. 上記手順を `outputs/phase-09/main.md` に記録

## coverage-guard

`bash scripts/coverage-guard.sh --no-run` を実行し、coverage summary が無い場合は PASS とせず boundary evidence として Phase 11 に保存する。full workspace coverage は PR/CI runtime boundary に分離する。

## DoD

- [ ] typecheck / lint / test / grep-gate / wrapper-free build PASS と `mise` build boundary の分離記録
- [ ] coverage-guard exit 0
- [ ] 手動 violation 注入で `--strict` が fail することを確認

## 次Phase

Phase 10（最終レビュー）
