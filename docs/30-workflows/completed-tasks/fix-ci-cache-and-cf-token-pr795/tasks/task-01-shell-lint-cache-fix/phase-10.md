# Phase 10 — 最終レビュー (task-01)

## レビューチェックリスト

| 観点 | チェック | 判定根拠 |
| ---- | -------- | -------- |
| DoD AC-1 (shell-lint green) | 実装後 CI run で確認 | Phase 4 T3 |
| DoD AC-2 (annotation 0) | `gh run view` grep | Phase 4 T3-(2) |
| DoD AC-3 (他 caller 不影響) | 9 caller の green | Phase 6 |
| DoD AC-4 (actionlint clean) | exit 0 | Phase 4 T1 |
| 不変条件 1 (SHA pin) | 未変更 | Phase 5 diff |
| 不変条件 2 (`pnpm/action-setup` SHA pin) | 未変更 | Phase 5 diff |
| 不変条件 3 (composite outputs) | 未変更 | Phase 7 grep |
| 不変条件 4 (他 job 破壊なし) | 全 job green | Phase 6 |
| 不変条件 5 (secret 非転記) | 該当なし | 本タスクは secret 非関与 |
| 後方互換 | default `'pnpm'` | Phase 2 / Phase 6 |
| ロールバック容易性 | revert で復元 | Phase 5 |

## 残課題

| ID | 内容 | 対応 |
| -- | ---- | ---- |
| (なし) | — | — |

## 判定基準

下記すべて満たした時点で Phase 11 (手動テスト) へ移行可能:

1. Phase 5 の編集差分が `git diff` で確認可能
2. Phase 4 T1 (actionlint) が local で exit 0
3. Phase 7 grep gate がすべて期待値

## レビュー後の作業

- Phase 11 evidence (CI run URL / `gh run view` 抜粋) を Phase 11 ファイルに追記
- Phase 12 implementation-guide の Part 1 / Part 2 を埋める
- Phase 13 で PR 作成 (ユーザー明示承認後)
