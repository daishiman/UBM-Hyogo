# Implementation Guide - 05a observability-and-cost-guardrails

Phase 12 required artifact. This file is the source material for the Phase 13 PR message after user approval.

## Part 1 - 初学者向け説明

### なぜ必要か

無料で使える道具には、毎月や毎日に使える量の上限がある。上限に近づいていることに気づかないまま作業を続けると、公開や確認が止まる。

たとえば、学校の印刷機で「今月は500枚まで」と決まっているのに、残り枚数を見ないまま何度も印刷すると、大事な資料を刷る日に使えなくなる。このタスクは、残り枚数を見る表と、少なくなった時の行動表を作る作業に近い。

### 何をするか

Cloudflare と GitHub Actions の画面で見る数字を決め、危ない数字に近づいた時の行動を文書にまとめた。新しい鍵や有料サービスは増やしていない。

### 今回作ったもの

| 作ったもの | 何に使うか | 場所 |
| --- | --- | --- |
| 観測表 | どの数字を見るかを確認する | `outputs/phase-02/observability-matrix.md` |
| 対処表 | 危ない数字になった時に何を止めるか決める | `outputs/phase-05/cost-guardrail-runbook.md` |
| 手動確認表 | 週次・月次で人が確認する項目を固定する | `outputs/phase-11/manual-ops-checklist.md` |
| 運用ガイド | 下流タスクへ渡す運用ルールをまとめる | `outputs/phase-12/operations-guide.md` |

UI変更はないため、画面スクリーンショットは不要と判定した。Phase 11 の証跡は `main.md`、`manual-smoke-log.md`、`link-checklist.md`、`manual-ops-checklist.md` に集約している。

## Part 2 - 開発者向け詳細

### Current Contract

この workflow は `spec_created` / `docs_only` であり、アプリコード、DB schema、public API、secret は変更しない。契約は「Cloudflare / GitHub Actions の手動観測点と判断基準を文書化し、05b の readiness gate へ渡す」ことである。

```typescript
interface CostGuardrailTaskMetadata {
  taskName: "observability-and-cost-guardrails";
  taskType: "spec_created";
  docsOnly: true;
  canonicalRoot: "docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails";
  phase13Status: "pending";
  userApprovalRequired: true;
}

type GuardrailService =
  | "pages_builds"
  | "workers_requests"
  | "d1_reads"
  | "d1_storage"
  | "github_actions_minutes";

interface GuardrailThreshold {
  service: GuardrailService;
  warningThreshold: string;
  actionThreshold: string;
  owner: "ops";
  evidencePath: string;
  actionDocument: string;
}

interface Phase11Evidence {
  visualChange: false;
  screenshotRequired: false;
  evidenceFiles: [
    "outputs/phase-11/main.md",
    "outputs/phase-11/manual-smoke-log.md",
    "outputs/phase-11/link-checklist.md",
    "outputs/phase-11/manual-ops-checklist.md",
  ];
}
```

### Target Delta

| 領域 | Before | After |
| --- | --- | --- |
| task root | 移設前パス表記が混在 | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails` に統一 |
| status ledger | `index.md` / `phase-*.md` が `pending` | Phase 1-12 は `completed`、Phase 13 は user approval 待ち |
| artifacts parity | root 側のみ | root と `outputs/artifacts.json` を同期 |
| UI evidence | 画像要否が暗黙 | NON_VISUAL と明記し、ログ証跡を採用 |

### CLIシグネチャ

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails

node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js \
  --workflow docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails

node .claude/skills/task-specification-creator/scripts/verify-all-specs.js \
  --workflow docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails
```

### APIシグネチャ

公開アプリ API はない。運用上の読み取り契約は次のファイルパスで固定する。

```typescript
type GuardrailDocumentPath =
  | "outputs/phase-02/observability-matrix.md"
  | "outputs/phase-05/cost-guardrail-runbook.md"
  | "outputs/phase-11/manual-ops-checklist.md"
  | "outputs/phase-12/operations-guide.md";

function readGuardrailDocument(path: GuardrailDocumentPath): string;
```

### 使用例

```bash
rg -n "Pages builds|Workers requests|D1|GitHub Actions" \
  docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs
```

```typescript
const phase11: Phase11Evidence = {
  visualChange: false,
  screenshotRequired: false,
  evidenceFiles: [
    "outputs/phase-11/main.md",
    "outputs/phase-11/manual-smoke-log.md",
    "outputs/phase-11/link-checklist.md",
    "outputs/phase-11/manual-ops-checklist.md",
  ],
};
```

### エラーハンドリング

| エラー | 対処 |
| --- | --- |
| `outputs/artifacts.json` がない | root `artifacts.json` を同期コピーする |
| Phase status がずれる | `index.md`、`phase-*.md`、root/output artifacts を同時に直す |
| Cloudflare Dashboard の数値が正本仕様と違う | `deployment-cloudflare.md` を確認し、差分が仕様変更なら Phase 12 sync に含める |
| screenshot validator が `manual-test-result.md` を要求する | NON_VISUAL docs-only evidence として Phase 11 の4ファイルを根拠にする |

### エッジケース

| ケース | 判断 |
| --- | --- |
| Public repo の GitHub Actions | 分数上限は実質なし。private repo 化時だけ 2,000 min/月を監視する |
| dev / main の観測分離 | 画面上の対象は分けるが、アカウント単位の消費量は合算確認する |
| KV / R2 | 無料枠と操作種別は runbook に記録済み。現行 binding 未整備の実行可能性は `task-imp-05a-kv-r2-guardrail-detail-001` で扱う |
| Phase 13 | ユーザー承認なしで PR 作成、push、commit をしない |
| Pages / Workers deploy target | 現行 `apps/web/wrangler.toml` は Pages build output を持つため Pages builds を監視する。OpenNext Workers 方針との差分は `task-ref-cicd-workflow-topology-drift-001` で扱う |

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| canonical root | `docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails` |
| Pages warning/action | 400 / 480 builds per month |
| Workers warning/action | 80,000 / 95,000 requests per day |
| D1 reads warning/action | 4,000,000 / 4,750,000 rows per day |
| D1 storage warning/action | 4GB / 4.75GB |
| GitHub Actions private warning/action | 1,600 / 2,000 minutes per month |
| new secrets | none |

### テスト構成

| 種別 | 実行内容 |
| --- | --- |
| Phase output validation | `validate-phase-output.js docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails` |
| Phase 12 guide validation | `validate-phase12-implementation-guide.js --workflow docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails` |
| Spec validation | `verify-all-specs.js --workflow docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails` |
| Manual evidence | `outputs/phase-11/main.md`、`manual-smoke-log.md`、`link-checklist.md`、`manual-ops-checklist.md` |
