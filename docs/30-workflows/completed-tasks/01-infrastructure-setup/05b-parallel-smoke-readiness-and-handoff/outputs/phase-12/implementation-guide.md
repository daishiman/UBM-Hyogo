# Phase 12 Implementation Guide

## Part 1: 中学生レベルの説明

なぜ必要かというと、実装担当が作業を始める前に、どの資料を見ればよいか、失敗したらどう戻すか、秘密情報をどこへ置くかで迷わないようにするためです。

たとえばイベントの前日に、受付、鍵、会場、連絡先を一枚の紙で確認するイメージです。受付ノートだけ、鍵だけ、会場だけを別々に見ていると、当日に「誰が鍵を持っているのか」「問題が起きたら誰へ連絡するのか」で迷います。

何をしたかというと、必要な確認表、引き継ぎ表、最終判定、画面変更なしの証跡、最後の確認レポートをそろえました。

このタスクでは、Web 画面、裏側の処理、記録台帳、元データ、秘密情報、戻し方を一枚で説明できる状態にします。つまり、実装担当が作業を始める前に「どこを見ればよいか」「何を触ってはいけないか」「失敗したらどう戻すか」を迷わないようにします。

画面の見た目を変える作業ではないため、スクリーンショットはありません。Phase 11 では代わりにリンクと説明の smoke log を確認しています。

### 今回作ったもの

| 作ったもの | 役割 |
| --- | --- |
| readiness definition | 作業を始めてよい条件をまとめる |
| handoff checklist | 次の担当者へ渡す確認表 |
| final readiness gate | 4条件の最終判定 |
| Phase 11 evidence | 画面変更なしの確認記録 |
| Phase 12 reports | 実装ガイド、変更履歴、未タスク確認、スキルフィードバック |

## Part 2: 技術者向け詳細

### Current Contract

```ts
export interface SmokeReadinessHandoff {
  taskRoot: "docs/05b-parallel-smoke-readiness-and-handoff";
  status: "spec_created";
  docsOnly: true;
  webRuntime: "@opennextjs/cloudflare";
  apiRuntime: "hono-workers";
  dataBoundary: {
    inputSource: "google-sheets";
    durableStore: "cloudflare-d1";
  };
  phase12Outputs: readonly string[];
}
```

### APIシグネチャ

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/05b-parallel-smoke-readiness-and-handoff --json
node .claude/skills/task-specification-creator/scripts/validate-phase11-screenshot-coverage.js --workflow docs/05b-parallel-smoke-readiness-and-handoff --json
```

No application API is added by this task. The validation CLI signature is the executable contract for this docs-only close-out.

### 使用例

No application API is added by this task. Downstream implementation should consume this handoff as documentation:

```ts
import { runtimeFoundation } from "@ubm-hyogo/shared";

const deploymentTarget = {
  web: runtimeFoundation.webRuntime,
  api: runtimeFoundation.apiRuntime,
};
```

### エラーハンドリング

| Error | Handling |
| --- | --- |
| Missing Phase 12 output | Recreate the required report and rerun validation |
| Missing Phase 11 evidence | Add NON_VISUAL `main.md`, manual smoke log, and link checklist |
| Stale task root path | Update `index.md`, `artifacts.json`, and Phase references before handoff |
| PR requested without approval | Stop at Phase 13 placeholder |

### エッジケース

| Case | Handling |
| --- | --- |
| `05a` evidence is not ready at task start | Continue; consume it at Phase 10-12 |
| Secret value is needed | Record only the secret name and owner, never the value |
| Visual evidence is requested | Mark N/A unless a UI/UX implementation changed |
| Runtime wording drifts to Pages-only | Correct to OpenNext on Cloudflare Workers for `apps/web` |
| Phase 13 PR request appears without user approval | Stop at PR preparation; do not commit, push, or open PR |

### 設定項目と定数一覧

| Name | Value | Source |
| --- | --- | --- |
| `taskRoot` | `docs/05b-parallel-smoke-readiness-and-handoff` | This workflow |
| `status` | `spec_created` | Docs-only task metadata |
| `webRuntime` | `@opennextjs/cloudflare` | `packages/shared/src/index.ts` |
| `apiRuntime` | `hono-workers` | `packages/shared/src/index.ts` |
| `phase13RequiresApproval` | `true` | `artifacts.json` |

### テスト構成

| Check | Command |
| --- | --- |
| Phase 12 guide | `validate-phase12-implementation-guide.js` |
| Phase 11 visual / non-visual evidence | `validate-phase11-screenshot-coverage.js` |
| Artifact output existence | Node filesystem check against `artifacts.json` |
| Stale task-root path | `rg` check scoped to this task root |

### Screenshot Reference

No screenshot reference is included because this task has no UI/UX implementation change. Phase 11 evidence is:

- `outputs/phase-11/manual-smoke-log.md`
- `outputs/phase-11/link-checklist.md`
