# Phase 13: commit / PR 承認ゲート

## 多段承認ゲート

| Gate | 内容 | 承認形態 |
| --- | --- | --- |
| G1 | local PASS 5 点 + runtime smoke PASS 取得 | Phase 11 完了 |
| G2 | Phase 12 7 ファイル実体確認 + 親タスク state 境界確認（runtime PASS 後のみ state 同期） | Phase 12 完了 |
| G3 | commit 実行（本タスクのファイルのみ stage） | **user 明示承認必須** |
| G4 | PR 作成（dev ブランチ向け） | **user 明示承認必須** |

G3 / G4 は CONST_002（コミット・PR・push はユーザー指示があるまで実行禁止）により本仕様書実行エージェントは自走しない。

## commit 対象（G3 承認後）

```
docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/
scripts/smoke/runtime-attendance-provider.sh
scripts/smoke/redact.sh
```

evidence ログ（`outputs/phase-11/evidence/*.log`）の commit 可否は `.gitignore` ポリシーに従う:

- secret / PII 混入が grep-gate で 0 と確認された summary-only ログのみ commit 可能
- 不安が残る場合は commit せず PR description に summary のみ記載

## commit message 例（G3 承認後に提案）

```
test(api): staging runtime smoke for attendanceProvider middleware (#531)

- Add scripts/smoke/runtime-attendance-provider.sh for /admin/members* and /me* curl smoke
- Add scripts/smoke/redact.sh for secret hygiene filter
- Capture local PASS 5 + pending staging runtime smoke runner under outputs/phase-11/evidence
- Keep parent task issue-371 in runtime-pending state until live smoke PASS

Refs #531
Refs #371
```

## PR target

- base: `dev`（staging 環境向け、その後 main へ昇格）
- head: `feat/issue-531-runtime-smoke-attendance-provider`
- 本文には `outputs/phase-12/implementation-guide.md` の Part 2 を embed
- スクリーンショットは NON_VISUAL のため添付しない

## 禁止事項（再確認）

- `--no-verify` 使用禁止
- production への deploy / smoke 実行禁止
- force push / amend 禁止（user 明示指示なし）

## 完了条件

- G1 / G2 完了済み
- user から G3 / G4 の明示承認を取得後にのみ commit / PR 実行
