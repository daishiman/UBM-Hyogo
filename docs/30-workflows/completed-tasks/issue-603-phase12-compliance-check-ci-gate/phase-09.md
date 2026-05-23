# Phase 9: テスト戦略

## 目的

verification script の focused unit test を 10 ケース実装し、CI gate の動作を fixture と temporary git repository で検証する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## テストファイル

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `scripts/__tests__/verify-phase12-compliance.test.ts` | 新規 | vitest で 10 ケース |

## テストケース

| # | 名前 | fixture | 期待結果 |
| --- | --- | --- | --- |
| T1 | pass | `fixtures/phase12-compliance/pass/` | `verifyComplianceFile` が `{ ok: true }` を返す |
| T2 | fail-missing-file | `fixtures/phase12-compliance/fail-missing-file/` | `{ ok: false, reason: 'missing-file' }` |
| T3 | fail-missing-heading | `fixtures/phase12-compliance/fail-missing-heading/` | `{ ok: false, reason: 'missing-heading' }` |
| T4 | drift-detection | `loadCanonicalHeadings` に short template を渡す | length !== 9 を検知 |
| T5 | spec-only allows missing runtime evidence details | pass fixture | heading 存在のみで PASS |
| T6 | canonical headings count | skill reference | 9 項目を 1..9 として parse |
| T7 | tracked changed workflow root collection | temporary git repo | `git diff base...head` から current root を 1 件検出 |
| T8 | untracked root + unassigned-task exclusion | temporary git repo | untracked workflow root を検出し `unassigned-task/` は除外 |
| T9 | completed-tasks ancestor marking | temporary git repo | 変更された `completed-tasks/` root のみ `hasCompletedTasksAncestor=true` |
| T10 | moved-root deleted old path skip | temporary git repo | `git mv` の削除元 root を検査対象にせず移動先 root のみ検出 |

## テスト方針

- `collectChangedWorkflowRoots` は temporary git repository で base/head diff と untracked file behavior を検証する
- fixture を repo に配置し、相対 path で読み込む
- mock を最小化（fs は実 fixture を読む）

## 実行コマンド

```bash
pnpm test:phase12-compliance
```

## 完了条件

- [ ] 10 テストケース全 PASS
- [ ] `pnpm typecheck` / `pnpm lint` PASS

## Next Phase

- [Phase 10](phase-10.md): 品質基準
