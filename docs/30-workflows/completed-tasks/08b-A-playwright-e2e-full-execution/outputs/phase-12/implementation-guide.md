# Implementation Guide: 08b-A-playwright-e2e-full-execution

## Part 1: 中学生レベル

学校の文化祭で、出し物のリハーサルを「やったことにする」だけでは、本番で入口が開かない、案内係がいない、危ない場所がある、といった問題に気づけません。このタスクは、Webアプリでも同じことが起きないように、実際に画面を開いて、ログインの役を用意して、記録写真と点検表を残すための手順を決めます。

必要なのは、ただ「テストの箱がある」と言うことではありません。どの画面を開いたか、失敗してはいけない場所が本当に守られているか、証拠の写真や結果表がどこにあるかを、あとから誰でも確認できるようにします。

| 専門用語 | 日常語での言い換え |
| --- | --- |
| Playwright | 画面を自動で操作する係 |
| fixture | テスト用に用意した安全な登場人物 |
| D1 seed | 試し用の名簿を入れる作業 |
| axe report | 画面の見やすさ点検表 |
| CI gate | 合格しないと先へ進めない関所 |

## Part 2: 技術者レベル

### Execution Contract

```typescript
type RuntimeEvidenceStatus = "PENDING_RUNTIME_EVIDENCE" | "PASS" | "BLOCKED";

interface PlaywrightFullExecutionEvidence {
  status: RuntimeEvidenceStatus;
  baseUrl: string;
  skippedSpecCount: number;
  reports: {
    html: string;
    json: string;
    axe: string;
  };
  screenshots: {
    desktopGlob: string;
    mobileGlob: string;
  };
  adminGate: {
    uiGateEvidence: string;
    directApiEvidence: string;
    foreignContentEditEvidence: string;
  };
}
```

### Evidence Manifest

The canonical manifest is `outputs/phase-11/evidence-manifest.md`. Runtime evidence must be written under `outputs/phase-11/evidence/` and must not reuse placeholder files from the scaffolding-only 08b task.

### Error Handling

| Case | Required handling |
| --- | --- |
| `test.describe.skip` remains | CI gate promotion is forbidden |
| Auth fixture cannot create admin/member/non-admin sessions | Runtime status becomes `BLOCKED`, not `PASS` |
| D1 seed/reset is nondeterministic | Runtime execution is blocked until seed/reset is isolated |
| Screenshot/report contains token or real personal data | Evidence is invalid and must be regenerated with synthetic data |
| Direct `/api/admin/*` non-admin fetch is not 403 | Admin API gate AC fails even if UI redirect works |
| Admin session can edit another member's protected content endpoint | Admin ownership gate AC fails even if the user is an active admin |

### Constants

| Name | Value |
| --- | --- |
| Workflow root | `docs/30-workflows/08b-A-playwright-e2e-full-execution/` |
| Visual evidence | `VISUAL_ON_EXECUTION` |
| Phase 11 runtime status before execution | `PENDING_RUNTIME_EVIDENCE` |
| Phase 12 close-out status | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` |
| Minimum screenshots | `30` across desktop and mobile |
