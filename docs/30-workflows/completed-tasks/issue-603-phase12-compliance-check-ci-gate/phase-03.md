# Phase 3: アーキテクチャ / interface 設計

## 目的

verification script と workflow の interface・データフロー・型・エラーモードを確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## モジュール構成

```
scripts/
├── verify-phase12-compliance.ts          # entrypoint
├── lib/
│   └── phase12-compliance/
│       ├── collect-changed-roots.ts      # git diff から workflow root を列挙
│       ├── load-canonical-headings.ts    # skill reference を parse して Required Sections を取得
│       ├── verify-compliance-file.ts     # 1 root に対する compliance-check.md の検査
│       └── types.ts                      # 型定義
└── __tests__/
    ├── verify-phase12-compliance.test.ts
    └── fixtures/phase12-compliance/{pass,fail-missing-file,fail-missing-heading}/...
```

## 型定義

```ts
// scripts/lib/phase12-compliance/types.ts
export type WorkflowRoot = {
  rootPath: string;            // 例: 'docs/30-workflows/issue-603-phase12-compliance-check-ci-gate'
  workflowState: 'spec_created' | 'implemented-local' | 'implemented_local_runtime_pending' | 'IMPLEMENTED_LOCAL_RUNTIME_PENDING' | 'PASS_BOUNDARY_SYNCED_RUNTIME_PENDING' | 'completed' | 'unknown';
  hasCompletedTasksAncestor: boolean;   // completed-tasks 配下なら true
};

export type CanonicalHeading = {
  index: number;               // 1..9
  heading: string;             // 例: 'Summary verdict'
  optionalForSpecOnly: boolean;
};

export type ComplianceCheckResult =
  | { ok: true; rootPath: string }
  | { ok: false; rootPath: string; reason: 'missing-file' | 'missing-heading' | 'parse-error'; details: string };
```

## 主要関数シグネチャ

```ts
// scripts/lib/phase12-compliance/collect-changed-roots.ts
export async function collectChangedWorkflowRoots(opts: {
  baseRef: string;             // 例: 'origin/dev'
  headRef: string;             // 例: 'HEAD'
  repoRoot: string;
}): Promise<WorkflowRoot[]>;

// scripts/lib/phase12-compliance/load-canonical-headings.ts
export function loadCanonicalHeadings(templatePath: string): CanonicalHeading[];

// scripts/lib/phase12-compliance/verify-compliance-file.ts
export function verifyComplianceFile(opts: {
  root: WorkflowRoot;
  canonicalHeadings: CanonicalHeading[];
  repoRoot: string;
}): ComplianceCheckResult;

// scripts/verify-phase12-compliance.ts (entrypoint)
export async function main(): Promise<number>; // 0 = pass, 1 = fail, 2 = drift
```

## 入出力 / 副作用

- 入力: 環境変数 `GITHUB_BASE_REF` / `GITHUB_HEAD_REF`、git working tree、`artifacts.json.workflow_state`
- 出力: stdout に JSON サマリ、exit code 0/1/2
- 副作用: なし（read-only）

## エラーモード

| code | 意味 | 例 |
| --- | --- | --- |
| 0 | PASS | 全 root 合格、または検査対象 0 件 |
| 1 | FAIL | missing-file / missing-heading いずれか発生 |
| 2 | DRIFT | skill reference parse 失敗、または Required Sections が想定数（9）と一致しない |

## spec-only 例外

- `workflow_state=spec_created` の root では、runtime evidence 本文・列挙が空でも fail としない（canonical heading 9 項目の存在は常に必須）。
- 検査対象 heading は「heading 存在」レベル。本文内の subsection の中身までは検査しない。

## 完了条件

- [ ] 型定義 / 関数シグネチャを `outputs/phase-03/main.md` に転記
- [ ] エラーモード表を完成
- [ ] spec-only 例外規則を明記

## Next Phase

- [Phase 4](phase-04.md): 前提整備
