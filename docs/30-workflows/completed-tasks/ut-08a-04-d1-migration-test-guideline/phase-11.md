# Phase 11: 手動検証（NON_VISUAL）

## visualEvidence: NON_VISUAL

UI 変更を伴わないため、screenshot evidence は対象外。代替 evidence として下記を `outputs/phase-11/` に記録する。

## 代替 evidence

### 1. bats 実行ログ

```bash
bats scripts/d1/__tests__/migration-guideline-presence.bats | tee docs/30-workflows/ut-08a-04-d1-migration-test-guideline/outputs/phase-11/bats-result.log
```

期待: 5/5 ok（file presence + 3 見出し + 最低基準 3 語句）

### 2. runbook 文書 presence + 必須見出し抽出

```bash
{
  echo "=== file presence ==="
  ls -la docs/30-workflows/runbooks/d1-migration-test-guideline.md
  echo "=== required headings ==="
  grep -nE "^## (最低基準|02b suite 責任範囲|適用フロー)" docs/30-workflows/runbooks/d1-migration-test-guideline.md
} | tee docs/30-workflows/ut-08a-04-d1-migration-test-guideline/outputs/phase-11/runbook-evidence.log
```

期待: 3 headings 検出

### 3. CI workflow diff の最終形

```bash
git diff dev...HEAD -- .github/workflows/d1-migration-verify.yml | tee docs/30-workflows/ut-08a-04-d1-migration-test-guideline/outputs/phase-11/yml-diff.patch
```

期待: permissions に `pull-requests: write` 追加 + post comment step 追加のみ

### 4. CI comment 独立性の静的確認（PR 前）

```bash
{
  grep -nF "always() && github.event_name == 'pull_request'" .github/workflows/d1-migration-verify.yml
  grep -nF "continue-on-error: true" .github/workflows/d1-migration-verify.yml
  grep -nF "<!-- d1-migration-guideline-bot -->" .github/workflows/d1-migration-verify.yml
} | tee docs/30-workflows/ut-08a-04-d1-migration-test-guideline/outputs/phase-11/ci-comment-static-evidence.log
```

期待: 前段 verify fail 時でも comment step が実行対象になり、comment step failure は verify job を巻き込まない設計であること。

### 5. PR 上での CI comment 実 post 確認（Phase 13 PR 作成後）

- 対象 PR: 本タスクの PR
- 期待: PR comment に runbook link bot が **1 件** 投稿される（migration 変更が含まれるため）
- 追加 push しても comment が **重複せず update** されることを目視確認
- スクリーンショット不要（NON_VISUAL）。代わりに PR comment URL を `outputs/phase-13/ci-comment-evidence.md` に記録
- この項目は Phase 13 post-PR evidence であり、Phase 11 の完了条件には含めない

## DoD

- `outputs/phase-11/` に PR 前 evidence 4 ファイルが揃う
- PR comment 実 post は `runtime_pending (Phase 13 user-gated PR)` として分離されている

## メタ情報

| 項目 | 内容 |
| --- | --- |
| task | ut-08a-04-d1-migration-test-guideline |
| phase | 11 |
| status | implemented_local_runtime_pending |

## 目的

NON_VISUAL の代替 evidence をPR前に取得し、PR後 evidence と混同しない。

## 実行タスク

- bats result、runbook evidence、workflow diff、CI comment static evidence を保存する。
- PR comment URL は Phase 13 に分離する。

## 参照資料

- `phase-09.md`
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`

## 成果物/実行手順

`outputs/phase-11/` に PR 前 evidence を保存する。

## 完了条件

- PR 前 evidence 4 files と補助成果物が存在する。

## 統合テスト連携

Phase 9 のコマンド結果を evidence として保存する。
