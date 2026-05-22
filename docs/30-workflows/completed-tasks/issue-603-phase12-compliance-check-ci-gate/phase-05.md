# Phase 5: 中核実装（verification script）

## 目的

`scripts/verify-phase12-compliance.ts` と `scripts/lib/phase12-compliance/` 配下を実装する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 変更対象ファイル

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `scripts/verify-phase12-compliance.ts` | 新規 | entrypoint。`main()` で changed root 列挙 → canonical heading load → root 毎検査 → exit code |
| `scripts/lib/phase12-compliance/types.ts` | 新規 | Phase 3 で定義した型を実体化 |
| `scripts/lib/phase12-compliance/collect-changed-roots.ts` | 新規 | `git diff --name-only` を `docs/30-workflows/<root>/**` 単位に集約。`<root>/metadata` 系から workflow_state を読み取り `WorkflowRoot` を返す |
| `scripts/lib/phase12-compliance/load-canonical-headings.ts` | 新規 | `phase12-compliance-check-template.md` を parse し `Required Sections` の番号付きリストを抽出。9 項目以外なら exit 2 |
| `scripts/lib/phase12-compliance/verify-compliance-file.ts` | 新規 | `<root>/outputs/phase-12/phase12-task-spec-compliance-check.md` の存在と canonical heading 9 項目存在を検査。spec-only root では runtime evidence 本文・列挙の不在を許容 |
| `package.json` | 編集 | `scripts.verify:phase12-compliance` を追加 |

## 関数シグネチャ（再掲 / 実装版）

```ts
// scripts/verify-phase12-compliance.ts
async function main(): Promise<number> {
  const baseRef = process.env.GITHUB_BASE_REF ?? 'origin/dev';
  const repoRoot = process.cwd();
  const canonical = loadCanonicalHeadings(
    '.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md'
  );
  if (canonical.length !== 9) return 2;
  const roots = await collectChangedWorkflowRoots({ baseRef, headRef: 'HEAD', repoRoot });
  if (roots.length === 0) {
    console.log(JSON.stringify({ status: 'noop', reason: 'no workflow root changed', canonicalHeadingCount: canonical.length }));
    return 0;
  }
  const results = roots
    .filter(r => !r.hasCompletedTasksAncestor || /* changed despite ancestor */ true)
    .map(r => verifyComplianceFile({ root: r, canonicalHeadings: canonical, repoRoot }));
  const fails = results.filter(r => !r.ok);
  console.log(JSON.stringify({ status: fails.length === 0 ? 'pass' : 'fail', roots: results }, null, 2));
  return fails.length === 0 ? 0 : 1;
}

main().then(c => process.exit(c)).catch(e => { console.error(e); process.exit(2); });
```

## canonical heading リスト

skill reference `Required Sections` 9 項目（同値維持必須）:

1. Summary verdict
2. Changed-files classification
3. `workflow_state` and phase status consistency
4. Phase 11 evidence file inventory
5. Phase 12 strict 7 file inventory
6. Skill/reference/system spec same-wave sync
7. Runtime or user-gated boundary
8. Archive/delete stale-reference gate
9. Four-condition verdict

> heading 検査は文字列正規化（前後空白除去 / バッククォート保持）で行う。

## spec-only 判定ロジック

- `<root>/artifacts.json` を読み、`workflow_state === 'spec_created'` なら spec-only
- spec-only の場合、heading `Phase 11 evidence file inventory` 配下の runtime path 列挙不在を許容（canonical heading 9 項目の存在は必須）

## ローカル実行コマンド

```bash
GITHUB_BASE_REF=origin/dev mise exec -- pnpm verify:phase12-compliance
```

## 完了条件

- [ ] 上記 6 ファイルを実装
- [ ] `mise exec -- pnpm typecheck` PASS
- [ ] `mise exec -- pnpm lint` PASS
- [ ] ローカル実行で本 root に対し PASS

## Next Phase

- [Phase 6](phase-06.md): 周辺実装
