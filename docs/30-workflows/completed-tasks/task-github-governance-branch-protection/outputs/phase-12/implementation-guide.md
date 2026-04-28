# Phase 12 — 実装ガイド（Implementation Guide）

> 本書は **草案** であり、ここに掲載する JSON / YAML はリポジトリへ投入しない。実装は Phase 13 ユーザー承認後の別タスクで行う。

## 視覚証跡

**UI/UX変更なしのため Phase 11 スクリーンショット不要。**

代替証跡:

- `outputs/phase-10/go-no-go.md` — 最終 GO/NO-GO 判定
- `outputs/phase-11/manual-smoke-log.md` — 手動スモーク（リンク健全性 / Phase 整合）

---

## Part 1 — 中学生向け解説（専門用語なし）

### なぜ「ブランチを守る設定」が必要なのか

学校で配るプリントを思い浮かべてみてください。先生が一人だけで作って、誰のチェックも受けずに印刷室に持って行ってしまうと、誤字や古い情報がそのまま全校に配られてしまいます。普通は「**配る前に必ずもう一人が読んで OK と言うこと**」というルールがあるとミスがぐっと減るのですが、このプロジェクトは **メンテナーが一人だけ（個人開発）** なので、もう一人の人間に頼ることができません。

そこで私たちは、人間のレビュアーの代わりに **機械（CI = 自動テスト）に厳しく見張ってもらう** ことにします。`main` という「印刷室にあたる場所」に変更を入れるとき、

1. 個人開発なのでレビュアーは置かない（人間の二重チェックは諦める）
2. その代わり、機械の自動チェック（**CI / テスト**）が全部 OK でないと絶対に入れない
3. ふざけて消したり書き換えたりできない（force-push 禁止・branch 削除禁止）

この 3 つを **人の善意ではなく仕組みで** 強制したいのです。一人開発では CI が唯一の防波堤なので、CI 系のルールはむしろ普通より強めにかけます。これが「ブランチ保護」です。

### 「自動で追いつく」って何のこと？

たとえば友達 A くんが宿題ノートに 1 ページ追記した直後に、友達 B くんも別の場所に追記したとします。後から提出する B くんは、A くんの最新ノートを見てから自分の追記をくっつけ直さないと、A くんの分が消えてしまいます。

これと同じことがコードでも起きます。「最新の本物に追いつき直す」作業を、ボタン一つで自動でやってもらう仕組みが **auto-rebase**（自動追いつき）です。ただし、ぶつかったとき（コンフリクト）は機械は無理せず止まり、人間が手で直します。

### 「外から来た知らない人のコード」をどう扱う？

クラスの掲示板に、知らない人が「これ貼って」と紙を持ってきたら、先生は内容を確認せずに鍵付きの職員室に通したりしませんよね。同じく、外部の人が送ってくる修正提案には、私たちの **大事な鍵（パスワードや API キー）に触らせない** 設計にしておく必要があります。これを「権限の入口を分ける」と言い、`pull_request_target` の安全装置と呼ばれる仕組みです。

### まとめ（Part 1）

- ブランチ保護は「印刷前に CI（機械）が必ずチェックする校則」。一人開発なので人間レビューは置かず、CI を唯一の防波堤として強めにかける
- auto-rebase は「最新ノートに自動で追いつく便利機能、ぶつかったら止まる」
- 安全装置は「外からの紙を職員室の鍵に触れさせないルール」

---

## Part 2 — 技術者向け仕様（草案抜粋）

### §1. branch protection JSON 抜粋（main / dev 差分）

main 側 keys（抜粋。完全版は Phase 2 design.md §2）:

```jsonc
// branch-protection.main.json.draft
// solo 運用（メンテナー1名）のため required_pull_request_reviews は null。
// 人間レビュー要件は撤廃し、required_status_checks (CI) を唯一の必須ゲートとする。
// dev 側 draft も同じ方針で required_pull_request_reviews: null とする。
{
  "required_status_checks": { "strict": true, "contexts": [ /* 8 contexts */ ] },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "required_linear_history": true,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

TypeScript 型定義:

```ts
type BranchName = "dev" | "main";

interface RequiredStatusChecksDraft {
  strict: true;
  contexts: string[];
}

// solo 運用のため null 固定。サブフィールド（required_approving_review_count /
// require_code_owner_reviews / require_last_push_approval / dismissal_restrictions 等）は持たない。
interface BranchProtectionDraft {
  required_status_checks: RequiredStatusChecksDraft;
  enforce_admins: true;
  required_pull_request_reviews: null;
  required_linear_history: true;
  required_conversation_resolution: true;
  allow_force_pushes: false;
  allow_deletions: false;
  lock_branch?: boolean;
  restrictions: null;
}
```

API シグネチャ（後続実装タスク向け）:

```ts
function buildBranchProtectionDraft(branch: BranchName): BranchProtectionDraft;
async function applyBranchProtectionDraft(params: {
  owner: string;
  repo: string;
  branch: BranchName;
  dryRun: boolean;
}): Promise<{ applied: boolean; payload: BranchProtectionDraft }>;
```

使用例:

```ts
const payload = buildBranchProtectionDraft("main");
await applyBranchProtectionDraft({
  owner: "your-org",
  repo: "ubm-hyogo",
  branch: "main",
  dryRun: true,
});
```

エラー処理とエッジケース:

| ケース | 扱い |
| --- | --- |
| required status check が GitHub 上に未出現 | 適用停止。CI job を一度成功させてから再実行 |
| `main` / `dev` 以外の branch | payload 生成時に拒否 |
| GitHub API の GET 応答を rollback に使う場合 | PUT 用 payload へ正規化してから適用 |
| `lock_branch=true` | 緊急凍結時だけ手動承認付きで使用 |

dev / main 差分表:

| 項目 | dev | main |
| --- | :-: | :-: |
| approving review | なし（solo） | なし（solo） |
| CODEOWNERS 必須化 | × | ×（CODEOWNERS は ownership 文書化のみ・必須化しない） |
| last push 承認必須 | × | ×（solo のため不適用） |
| status checks（8件） | 同一 | 同一 |
| `required_linear_history` | true | true |
| `required_conversation_resolution` | true | true |
| `allow_force_pushes` | false | false |
| `allow_deletions` | false | false |
| `enforce_admins` | true | true |

> solo 運用での主防波堤は `required_status_checks`（CI）。dev/main の差分は実質「同一」になり、CI gate・線形履歴・会話解決必須化・force-push 禁止・branch 削除禁止を両ブランチで維持する。

### §2. squash-only マージポリシー

| レイヤ | キー | 値 |
| --- | --- | --- |
| repository setting | `allow_squash_merge` | `true` |
| repository setting | `allow_merge_commit` | `false` |
| repository setting | `allow_rebase_merge` | `false` |
| repository setting | `delete_branch_on_merge` | `true` |
| branch protection | `required_linear_history` | `true` |

### §3. auto-rebase workflow YAML 抜粋

```yaml
# auto-rebase.workflow.yml.draft
on:
  pull_request: { types: [labeled, synchronize] }
concurrency:
  group: auto-rebase-${{ github.event.pull_request.number }}
  cancel-in-progress: true
permissions:
  contents: write
  pull-requests: write
jobs:
  rebase:
    if: contains(github.event.pull_request.labels.*.name, 'auto-rebase')
    # rebase 失敗 → bot は停止、人手判断へ委譲
```

設定可能パラメータ:

| パラメータ | 値 |
| --- | --- |
| auto rebase label | `auto-rebase` |
| target events | `pull_request.labeled`, `pull_request.synchronize` |
| conflict behavior | fail fast。bot は解決しない |
| push strategy | `--force-with-lease` |
| base push follow-up | 対象 PR 列挙が必要なため後続実装タスク |

### §4. pull_request_target safety gate YAML 抜粋

```yaml
# pr-target-safety-gate.workflow.yml.draft
on: { pull_request_target: { types: [opened, synchronize, reopened, labeled] } }
permissions: {}   # workflow 全体は no-permissions
jobs:
  triage:                       # 権限を昇格する側：PR コードを checkout / 実行しない
    permissions: { pull-requests: write }
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.repository.default_branch }}
          persist-credentials: false
```

PR コードの build / test は通常の `pull_request` workflow に分離する。

```yaml
# pr-untrusted-build.workflow.yml.draft
on: { pull_request: { types: [opened, synchronize, reopened] } }
permissions: { contents: read }
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          persist-credentials: false
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env: {}
```

設計不変条件:

- `permissions: {}` をワークフロー全体のデフォルトに置き、job 単位で必要分のみ昇格
- `pull_request_target` 内で PR head を checkout / install / build しない
- `actions/checkout` の `ref` は SHA か default branch のどちらかに固定（branch 名の動的解決禁止）
- `persist-credentials: false` を全 checkout で徹底

設定可能パラメータと定数:

| 名前 | 値 | 備考 |
| --- | --- | --- |
| `MAIN_REQUIRED_APPROVALS` | `0`（solo / `required_pull_request_reviews: null`） | main branch protection |
| `DEV_REQUIRED_APPROVALS` | `0`（solo / `required_pull_request_reviews: null`） | dev branch protection |
| `REQUIRED_STATUS_CONTEXTS` | 8 contexts | 実在 job 名へ同期後に適用。solo 運用では唯一の必須ゲート |
| `AUTO_REBASE_LABEL` | `auto-rebase` | rebase 対象 PR の明示 opt-in |
| `PR_TARGET_DEFAULT_PERMISSIONS` | `{}` | job 単位でのみ昇格 |
| `CHECKOUT_PERSIST_CREDENTIALS` | `false` | 全 checkout で固定 |

### §5. 後続実装タスクへの引き渡し事項

| # | 申し送り | 引受先候補 |
| - | --- | --- |
| H-1 | 8 contexts の job 名は lefthook 側と一致させる | task-git-hooks-lefthook-and-post-merge |
| H-2 | rebase conflict 時の通知経路（Slack/PR コメント） | task-conflict-prevention-skill-state-redesign |
| H-3 | `lock_branch=true` 切替の運用条件文書化 | 後続 implementation runbook タスク |
| H-4 | `gh api` / Terraform の選定と適用順序 | 別実装タスク（本 Phase は範囲外） |
| H-5 | OSS 化した場合の triage job 権限再評価 | 将来 repo public 化タスク |

### §6. Phase 13 承認ゲート

- 本草案は **commit / push / PR 作成を行わない**。
- Phase 13 で `change-summary.md` / `pr-template.md` を作成し、ユーザー承認後に別タスクで GitHub への投入を行う。
