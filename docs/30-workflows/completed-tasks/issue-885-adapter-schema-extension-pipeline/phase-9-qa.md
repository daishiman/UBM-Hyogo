# Phase 9: QA

## 1. QA チェックリスト

| ID | 項目 | コマンド / 確認手順 | 期待 |
|---|---|---|---|
| Q-1 | README 存在 | `test -f apps/web/src/lib/adapters/README.md` | exit 0 |
| Q-2 | README 主要章存在 | Phase 6 §2 の grep バンドル | "README presence OK" |
| Q-3 | EXTENSION TEMPLATE マーカー 2 件 | Phase 6 §3 grep | "EXTENSION TEMPLATE OK" |
| Q-4 | 既存 spec 8 ケース PASS | `pnpm --filter @ubm-hyogo/web test -- member-detail.spec.ts` | PASS |
| Q-5 | typecheck | `pnpm typecheck` | PASS |
| Q-6 | lint | `pnpm lint` | PASS |
| Q-7 | unassigned-task one-pager 削除 | `test ! -f docs/30-workflows/unassigned-task/serial-06-followup-004-adapter-schema-extension-pipeline.md` | exit 0 |
| Q-8 | stale 参照 0 件 | `rg -n "serial-06-followup-004-adapter-schema-extension-pipeline" docs/ .claude/ apps/ packages/ --glob '!docs/30-workflows/completed-tasks/issue-885-adapter-schema-extension-pipeline/**'` | 外部参照 0 件 |
| Q-9 | `member-detail.ts` 本体未変更 | `git diff apps/web/src/lib/adapters/member-detail.ts` | empty |
| Q-10 | PR ready | `bash scripts/verify-pr-ready.sh` | PASS |

## 2. QA 失敗時の対応

- Q-1〜Q-3 失敗: Phase 5 §2 / §3 のテンプレを再適用する
- Q-4 失敗: spec の括弧位置を再確認（template コメントは `});` の外に置く）
- Q-5 / Q-6 失敗: README markdown lint / spec コメント末尾改行を確認
- Q-7 失敗: `rm` を実行
- Q-8 失敗: 参照箇所を本仕様 index に向け直す
- Q-9 失敗: コード本体に意図せず変更が入っているため revert する
- Q-10 失敗: `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` を参照

## 3. 不変条件 spot check

- 出力 field に `visibility` / `source` キーが含まれないこと（既存 spec ケース 8 で担保）
- 入力 mutate がないこと（既存 spec ケース 6 で担保）

本タスクではコード変更がないため、これらは既存テストで自動担保される。
