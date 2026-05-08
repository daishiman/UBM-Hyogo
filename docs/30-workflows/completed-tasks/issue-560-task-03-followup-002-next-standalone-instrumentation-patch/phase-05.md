# Phase 5: テスト実装（RED）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| Source | `outputs/phase-5/phase-5.md` |
| 状態 | completed |

## 目的

Phase 4 で確定した TC-01〜TC-07 を先に実装し、既存 `scripts/patch-next-standalone-instrumentation.mjs` が新 AC（`cwd` guard / `--verify-only` / trace copy regression / trace parse failure handling）を満たさないことによる RED（fail）を確認する。

## 実行タスク

- `scripts/__tests__/patch-next-standalone-instrumentation.test.mjs` を新規作成
- `scripts/__tests__/fixtures/` に必要 fixture を配置
- 実行: `node --test scripts/__tests__/patch-next-standalone-instrumentation.test.mjs`
- 少なくとも `cwd` guard / `--verify-only` / trace copy regression / trace parse failure handling の未充足ケースが fail することを log で確認（`outputs/phase-5/red-evidence.log` に保存）

## 参照資料

- `outputs/phase-4/phase-4.md`

## 成果物

- `scripts/__tests__/patch-next-standalone-instrumentation.test.mjs`
- `scripts/__tests__/fixtures/*`
- `outputs/phase-5/phase-5.md`
- `outputs/phase-5/red-evidence.log`

## 完了条件

- 新 AC に対する RED を log で確認
- 既存 patch script は存在するが、Phase 6 の改修前であることを明記
