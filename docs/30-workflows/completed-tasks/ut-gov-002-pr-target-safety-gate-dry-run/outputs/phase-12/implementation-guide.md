# Phase 12: 実装ガイド (implementation-guide)

> 本ファイルは UT-GOV-002 タスクの **PR メッセージ本文の元**として使われる構造化文書。後続実装タスク担当者が dry-run / security review を実走する際の入口でもある。

## Part 1: 中学生レベルの概念説明

### 1. なぜ必要か

学校の文化祭で、外から来た人に受付の手伝いを頼む場面を考える。受付では名札を渡したり、入場者数を数えたりするだけなら安全だが、金庫の鍵を渡したり、放送室の機械を自由に触らせたりすると危ない。

このタスクで守りたいことも同じである。外から届いた変更案は、まず「受付の仕事」だけをできる場所で扱う。大事な鍵や秘密のメモがある場所では、その変更案の中身を動かさない。

### 2. 何をするか

- 外から届いた変更案を、強い権限を持つ場所で動かさない。
- ラベル付けや確認だけを強い権限側に残す。
- 中身を組み立てたり試したりする作業は、秘密を持たない場所で行う。
- 今回のタスクでは実際の設定変更はせず、後続タスクが安全に作業できる説明書と確認表を作る。

### 3. 専門用語の言い換え

| 用語 | 日常語での説明 |
| --- | --- |
| `pull_request_target` | 強い権限を持つ受付のような実行場所 |
| `pull_request` | 外から届いた変更案を、秘密なしで試す場所 |
| token / secret | 鍵や秘密のメモ |
| checkout | 変更案の中身を取り出すこと |
| dry-run | 本番で動かす前の安全確認 |

## Part 2: 技術者レベルの実装ガイド

### 4. タスク概要

- **タスク ID**: UT-GOV-002
- **タスク名**: pull_request_target safety gate dry-run / security review 仕様書整備
- **種別**: `docs-only` / `spec_created` / `visualEvidence: NON_VISUAL`
- **親タスク**: `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/`（U-2 として検出された派生タスクを正式仕様化したもの）
- **目的**: `pull_request_target` を triage（label / auto-merge 判定）に限定し、PR head の checkout / install / build を `pull_request` workflow に分離する設計を Phase 1-13 で固定する。GitHub Security Lab の "pwn request" パターンに非該当であることをレビュー記録として残す。

### 5. インターフェース / 型定義

本タスクは docs-only のため TypeScript 実装は追加しない。後続実装タスクが扱う設定契約を以下の型で固定する。

```ts
export type WorkflowContext = "pull_request_target" | "pull_request";

export interface PrTargetSafetyGatePolicy {
  workflowContext: WorkflowContext;
  allowedOperations: Array<"label" | "metadata_read" | "comment">;
  forbiddenOperations: Array<"checkout_pr_head" | "install" | "build" | "test" | "eval">;
  rootPermissions: Record<string, never>;
  checkoutPersistCredentials: false;
  visualEvidence: "NON_VISUAL" | "VISUAL";
}

export interface DryRunScenario {
  id: "same-repo" | "fork" | "labeled" | "scheduled" | "rerun";
  expectedSecretExposure: "none";
  evidenceKind: "design_evidence" | "runtime_evidence";
}
```

### 6. API シグネチャと使用例

後続タスクで検証スクリプト化する場合の最小 API は次の形にする。

```ts
export function validatePrTargetSafetyGate(policy: PrTargetSafetyGatePolicy): {
  ok: boolean;
  findings: Array<{ code: string; severity: "major" | "minor"; message: string }>;
};
```

使用例:

```ts
const result = validatePrTargetSafetyGate({
  workflowContext: "pull_request_target",
  allowedOperations: ["label", "metadata_read"],
  forbiddenOperations: ["checkout_pr_head", "install", "build", "test", "eval"],
  rootPermissions: {},
  checkoutPersistCredentials: false,
  visualEvidence: "NON_VISUAL",
});
```

### 7. エラーハンドリングとエッジケース

| ケース | 扱い |
| --- | --- |
| `pull_request_target` 内で PR head checkout を検出 | `major`。後続実装タスクでは merge 不可 |
| root `permissions` が `{}` でない | `major`。job 単位昇格へ修正 |
| `persist-credentials: false` 欠落 | `major`。全 checkout step に明示 |
| `workflow_run` 採用 | `major` 再判定。UT-GOV-002-EVAL の対象 |
| 実走証跡がない | 本タスクでは許容。後続 UT-GOV-002-IMPL で `VISUAL` 証跡必須 |

### 8. 設定可能なパラメータと定数

| 名前 | 値 | 用途 |
| --- | --- | --- |
| `taskType` | `docs-only` | 本タスクは仕様作成のみ |
| `visualEvidence` | `NON_VISUAL` | UI / GitHub Actions 実走画面を伴わない |
| `rootPermissions` | `{}` | workflow-level の最小権限 |
| `checkoutPersistCredentials` | `false` | token を作業ツリーに残さない |
| `runtimeEvidenceOwner` | `UT-GOV-002-IMPL` | 実走とスクリーンショット収集の後続タスク |

### 9. スコープ

#### 含む

- Phase 1-13 の仕様書 (`phase-NN.md`) と `index.md` / `artifacts.json`
- trusted / untrusted 境界の設計、fork PR 5 シナリオのテストマトリクス
- `permissions: {}` デフォルト + job 単位昇格、`persist-credentials: false` 全 checkout 固定の方針
- pwn request パターン非該当の review 観点と quality gate
- ロールバック設計（safety gate の単一コミット粒度 revert）

#### 含まない

- 実 `.github/workflows/pr-target-safety-gate.yml` の編集（後続実装タスクで別 PR）
- 実 dry-run の実走（fork PR / labeled trigger 等を用いた smoke）
- secrets / token の rotate
- branch protection JSON の本適用（UT-GOV-001 で完了済み）
- action pin policy の本適用（UT-GOV-007 で完了済み）

### 10. 成果物一覧（13 ファイル群）

| 領域 | ファイル | 行数目安 | 概要 |
| --- | --- | --- | --- |
| 索引 | `index.md` | 120 | メタ情報・AC-1〜AC-9・Phase 一覧・依存関係 |
| 索引 | `artifacts.json` | 161 | Phase status / outputs パス（機械可読） |
| 仕様 | `phase-01.md` 〜 `phase-13.md` | 各 30-80 | 各 Phase の目的・実行タスク・完了条件 |
| 出力 | `outputs/phase-1/main.md` | 111 | 要件定義 |
| 出力 | `outputs/phase-2/{main,design}.md` | 209 | safety gate 草案・trusted/untrusted 境界 |
| 出力 | `outputs/phase-3/{main,review}.md` | 143 | 設計レビュー（pwn request 観点含む） |
| 出力 | `outputs/phase-4/{main,test-matrix}.md` | 195 | fork PR 5 シナリオ |
| 出力 | `outputs/phase-5/{main,runbook}.md` | 266 | actionlint / yq / gh runbook |
| 出力 | `outputs/phase-6/{main,failure-cases}.md` | 167 | actor / cache / artifact / workflow_dispatch 脅威 |
| 出力 | `outputs/phase-7/{main,coverage}.md` | 179 | AC-1〜AC-9 カバレッジ表 |
| 出力 | `outputs/phase-8/{main,before-after}.md` | 229 | リファクタ Before/After |
| 出力 | `outputs/phase-9/{main,quality-gate}.md` | 175 | 品質ゲート（pwn request 非該当根拠） |
| 出力 | `outputs/phase-10/{main,go-no-go}.md` | 152 | Go/No-Go 条件・ロールバック粒度 |
| 出力 | `outputs/phase-11/*` | 約 250 | 整合性検査ログ・リンクチェック |
| 出力 | `outputs/phase-12/*` | 本 Phase 全 7 ファイル | ドキュメント更新一式 |
| 出力 | `outputs/phase-13/*` | 約 50 | 完了確認 (pending) |

### 11. AC 充足サマリー

| AC | 内容 | 充足箇所 |
| --- | --- | --- |
| AC-1 | `pull_request_target` 内に PR head の checkout / code execution が無い | phase-2/design.md, phase-4/test-matrix.md |
| AC-2 | untrusted build を `pull_request` に分離、`contents: read` のみ | phase-2/design.md, phase-5/runbook.md |
| AC-3 | fork PR 5 シナリオで token / secret 露出なしの設計証跡を記録 | phase-4/test-matrix.md, phase-9/quality-gate.md |
| AC-4 | "pwn request" 非該当根拠（PR head 分離・persist-credentials false・最小 permissions） | phase-3/review.md, phase-9/quality-gate.md |
| AC-5 | デフォルト `permissions: {}` + job 単位昇格 + `persist-credentials: false` の 3 点を 3 箇所に重複明記 | phase-2/design.md, phase-5/runbook.md, phase-9/quality-gate.md |
| AC-6 | 親タスク Phase 2 §6 を input 継承 | phase-1/main.md, phase-2/main.md, phase-3/review.md |
| AC-7 | `docs-only` / `NON_VISUAL` / `infrastructure_governance + security` を Phase 1 と artifacts.json metadata で固定 | phase-1/main.md, artifacts.json |
| AC-8 | dry-run 実走と workflow 編集は本タスク非対象、後続 PR で実施 | phase-1/main.md, phase-13/main.md |
| AC-9 | ロールバック設計（単一コミット粒度の revert） | phase-2/design.md, phase-5/runbook.md, phase-10/go-no-go.md |

**AC 充足率: 9 / 9（100%）**。本タスクの PASS は設計証跡の PASS であり、実走 PASS は後続 UT-GOV-002-IMPL で判定する。

### 12. 後続実装タスクへの引き継ぎ事項

### 5.1 後続タスク候補

1. **UT-GOV-002-IMPL** : 実 `.github/workflows/pr-target-safety-gate.yml` の編集と dry-run 実走
   - 入力: 本タスク `outputs/phase-2/design.md` / `outputs/phase-5/runbook.md`
   - 視覚証跡（`visualEvidence: VISUAL`）として GitHub Actions UI 実行ログを収集
2. **UT-GOV-002-SEC** : security review 本適用と pwn request 非該当の最終署名
   - 入力: `outputs/phase-3/review.md` / `outputs/phase-9/quality-gate.md`
3. **UT-GOV-002-OBS** : secrets 棚卸し自動化、`workflow_run` 採用時の追加レビュー、OIDC 化評価

### 5.2 必須前提

- UT-GOV-001 (branch protection apply) 完了済み
- UT-GOV-007 (action pin policy) 完了済み
- 親タスク (task-github-governance-branch-protection) 完了済み

### 5.3 dry-run 実走時のコマンド出発点（本タスク runbook より転記）

```bash
actionlint .github/workflows/*.yml
yq '.permissions, .jobs[].permissions' .github/workflows/pr-target-safety-gate.yml
rg -n 'pull_request_target|persist-credentials|secrets\.|workflow_run' .github/workflows
gh workflow list
gh workflow view pr-target-safety-gate
```

### 13. ロールバック手順（要約）

`outputs/phase-5/runbook.md` および `outputs/phase-10/go-no-go.md` の詳細を要約。

| 局面 | 操作 | 復旧 RTO |
| --- | --- | --- |
| safety gate workflow が想定外挙動 | safety gate を導入したコミット 1 件を `git revert` | 数分 |
| 既存 triage workflow が break | 既存 workflow を維持したまま safety gate のみ disable（`gh workflow disable`） | 数分 |
| required status checks の名称 drift | branch protection 側で job 名を旧名へ戻す（UT-GOV-001 の admin scope で対応） | 10 分以内 |
| secrets 露出疑い | secrets rotate（別 PR / 本タスク非対象、UT-GOV-002-OBS で起票） | 別タスク |

**設計原則**: revert 単位を **単一コミット**に保つこと（AC-9）。複数 workflow を同時編集せず、safety gate の追加・削除は 1 コミットで完結させる。

### 14. NON_VISUAL の根拠

本 PR は Markdown 13 + outputs ディレクトリのみを変更する仕様策定 PR である。UI 変更・workflow 実行は伴わないためスクリーンショットは添付しない。視覚証跡が必要となるのは UT-GOV-002-IMPL（後続実装タスク）であり、その PR では `visualEvidence: VISUAL` として GitHub Actions UI のジョブ表示・branch protection と job 名の同期を撮影する。

### 15. レビュー観点（レビュアー向けチェックリスト）

- [ ] `index.md` のメタ情報と `artifacts.json` の metadata が一致している
- [ ] 13 Phase すべての status が `phase-NN.md` / `index.md` / `artifacts.json` で一致している
- [ ] AC-1〜AC-9 が `outputs/phase-7/coverage.md` で全件 PASS
- [ ] pwn request 非該当根拠が `outputs/phase-3/review.md` / `outputs/phase-9/quality-gate.md` の両方に記述されている
- [ ] `outputs/phase-12/system-spec-update-summary.md` の Step 2 が N/A 理由付きで明示されている
- [ ] 派生未タスクが `outputs/phase-12/unassigned-task-detection.md` に列挙されている
- [ ] 計画系 wording（「後追い」「先送り」）が outputs に残っていない（compliance-check 参照）
