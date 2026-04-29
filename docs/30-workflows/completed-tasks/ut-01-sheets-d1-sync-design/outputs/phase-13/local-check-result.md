# local-check-result.md（実行時に記入）

> Phase 13 ローカル確認 1〜9 の生コマンド出力を保存する。

## 1. branch 状態

```bash
git status --porcelain
git log --oneline main..HEAD
```

実行結果（実行時に記入）:

```
（実行時に記入）
```

## 2. typecheck / lint

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

実行結果（実行時に記入）:

```
（実行時に記入）
```

## 3. verify-indexes-up-to-date 相当

```bash
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes
echo $?
```

実行結果（実行時に記入）: 期待 exit 0

```
（実行時に記入）
```

## 4. Phase 12 計画系 wording 残存確認

```bash
rg -n "仕様策定のみ|実行対象|保留として記録" \
  docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' \
  || echo "計画系 wording なし"
```

実行結果（実行時に記入）: 期待「計画系 wording なし」

```
（実行時に記入）
```

## 5. Phase 11 縮約 3 点固定確認

```bash
ls docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-11/
```

実行結果（実行時に記入）: 期待 main.md / manual-smoke-log.md / link-checklist.md の 3 行のみ

```
（実行時に記入）
```

## 6. workflow_state 据え置き確認

```bash
rg -n '状態.*spec_created' docs/30-workflows/ut-01-sheets-d1-sync-design/index.md
jq -r '.metadata.workflow_state' docs/30-workflows/ut-01-sheets-d1-sync-design/artifacts.json
```

実行結果（実行時に記入）: 期待どちらも `spec_created`

```
（実行時に記入）
```

## 7. AC マトリクス全件 PASS

```bash
rg -n 'AC-[0-9]+.*PASS|AC-[0-9]+.*GREEN' \
  docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-07/ac-matrix.md
```

実行結果（実行時に記入）: 期待 AC-1〜AC-10 全件 HIT

```
（実行時に記入）
```

## 8. コード変更なし確認

```bash
git diff --stat main..HEAD -- apps/ packages/ .claude/skills/ .agents/skills/
```

実行結果（実行時に記入）: 期待 出力 0 行（コード / skill 変更なし）

```
（実行時に記入）
```

## 9. mirror parity（skill 編集なしの形式確認）

```bash
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
echo $?
```

実行結果（実行時に記入）: 期待 出力 0 行 / exit 0

```
（実行時に記入）
```

## サマリ

| # | 項目 | 結果 |
| - | --- | --- |
| 1 | branch 状態 | （実行時に記入） |
| 2 | typecheck / lint | （実行時に記入） |
| 3 | indexes drift なし | （実行時に記入） |
| 4 | 計画系 wording 残存 0 件 | （実行時に記入） |
| 5 | Phase 11 縮約 3 点固定 | （実行時に記入） |
| 6 | workflow_state spec_created 据え置き | （実行時に記入） |
| 7 | AC 全件 PASS | （実行時に記入） |
| 8 | コード変更 0 行 | （実行時に記入） |
| 9 | mirror diff 0 行 | （実行時に記入） |

1 件でも FAIL があれば PR 作成を保留する。
