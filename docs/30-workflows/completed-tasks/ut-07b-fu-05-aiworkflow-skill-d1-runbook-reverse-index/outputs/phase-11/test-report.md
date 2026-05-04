# Phase 11 test report

判定: PASS

## 実測ログ（2026-05-04 review fix）

| ID | Command | Exit | 実測 |
| --- | --- | --- | --- |
| TC-01〜03 | `rg -n "ut-07b-fu-03-production-migration-apply-runbook\|scripts/d1/\|d1-migration-verify\\.yml" .claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 0 | 1 hit。line 73 に current FU-03 stub / `scripts/d1/{preflight,postcheck,evidence,apply-prod}.sh` / `.github/workflows/d1-migration-verify.yml` が同一行で存在 |
| TC-04 | `rg -n "bash scripts/cf\\.sh d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 0 | 1 hit。line 13 の実行コマンド行のみ |
| TC-05 | `mise exec -- pnpm indexes:rebuild` | 0 | `indexes/topic-map.md` と `indexes/keywords.json` 生成完了。481 files classified / 3797 keywords |
| TC-06 | `mise exec -- pnpm indexes:rebuild` 2 回目 | 0 | 冪等再実行 exit 0。同じ 481 files / 3797 keywords |
| TC-07 | temp copy から UT-07B-FU-03 resource-map 行を削除して同じ `rg` を実行 | 1 | 0 hit。追記行が消えると検出が red になることを確認。本物の resource-map は変更していない |
| TC-08 | `for p in $(seq -w 1 12); do test -e .../outputs/phase-$p/main.md; done` | 0 | `phase_1_12_main:PASS` |

## 出力抜粋

```text
resource-map.md:73:| UT-07B-FU-03 Production Migration Apply Runbook ... | `docs/30-workflows/unassigned-task/task-ut-07b-fu-03-production-migration-apply-runbook.md`, `scripts/d1/{preflight,postcheck,evidence,apply-prod}.sh`, `scripts/cf.sh`, `.github/workflows/d1-migration-verify.yml`, ...
quick-reference.md:13:| 実行コマンド | `bash scripts/cf.sh d1:apply-prod`（production 実適用はユーザー明示承認後のみ） |
phase_1_12_main:PASS
l4_removed_rg_exit:1
```

`mise` と Node の warning は既存環境警告であり、command exit は 0。production D1 apply は実行していない。
