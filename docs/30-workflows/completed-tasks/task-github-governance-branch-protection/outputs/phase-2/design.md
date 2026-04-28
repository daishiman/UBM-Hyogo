# Phase 2 — 設計（design）

## Status
done

> 本書は **草案** であり、ここに掲載する JSON / YAML はリポジトリへ投入しない。実装は別タスクで行う（Phase 1 §1 参照）。

## 0. 真の論点（Phase 1 §2 の再掲）

複数 worktree × squash-only マージ運用の下で、`feature/* → dev → main` の rebase 戦略統一・`pull_request_target` の権限昇格遮断・dev=1名/main=2名の非対称レビューを Branch Protection と GHA 設計のみで一意に強制する方法を文書化する。

---

## 1. 必須 status check の命名

monorepo 構造（`apps/web` / `apps/api` / 共通）に合わせ、CI ジョブ名の **target context** を以下に固定する。これは後続 CI 実装タスクで実在 job 名へ同期した後に branch protection の `required_status_checks.contexts` へ投入する値であり、現行 `.github/workflows` の job 名とは未同期である。

| context（ジョブ名） | 目的 | 対象 |
| --- | --- | --- |
| `ci / typecheck (web)` | TS 型検査 | apps/web |
| `ci / typecheck (api)` | TS 型検査 | apps/api |
| `ci / lint` | ESLint / format | monorepo 全体 |
| `ci / test (web)` | unit/component | apps/web |
| `ci / test (api)` | unit/integration（D1 mock） | apps/api |
| `ci / build (web)` | `@opennextjs/cloudflare` build | apps/web |
| `ci / build (api)` | wrangler bundle | apps/api |
| `ci / docs-link-check` | docs/ 内リンク健全性 | docs-only PR でも必ず |

> ローカル lefthook（横断: task-git-hooks-lefthook-and-post-merge）と **同名** にすることで、開発者の手元で失敗したものは CI でも必ず失敗する二重防壁を成立させる。

現行との差分:

| 種別 | context |
| --- | --- |
| 現行 workflow 実績 | `ci / ci`, `Validate Build / Validate Build`, `backend-ci` 系, `web-cd` 系 |
| 本草案 target | 上記 8 contexts |
| 適用条件 | 後続 CI 実装タスクで target context を実在 job として一度成功させてから branch protection に設定する |

---

## 2. branch protection 草案（main）

```jsonc
// branch-protection.main.json.draft
{
  "required_status_checks": {
    "strict": true,                      // 最新 base へ rebase 済みを要求（auto-rebase と組み合わせ）
    "contexts": [
      "ci / typecheck (web)",
      "ci / typecheck (api)",
      "ci / lint",
      "ci / test (web)",
      "ci / test (api)",
      "ci / build (web)",
      "ci / build (api)",
      "ci / docs-link-check"
    ]
  },
  "enforce_admins": true,                 // 管理者にも適用（事故防止）
  "required_pull_request_reviews": {
    "required_approving_review_count": 2, // CLAUDE.md: main=2名
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "require_last_push_approval": true    // 最新 push に対する承認必須
  },
  "required_linear_history": true,        // squash-only と整合
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "lock_branch": false,                   // 凍結時のみ true（緊急運用ケースのスイッチ）
  "restrictions": null                    // user/team push 制限なし（PR 経由のみ強制）
}
```

## 3. branch protection 草案（dev）

main との差分を **赤字相当** で示す。

```jsonc
// branch-protection.dev.json.draft
{
  "required_status_checks": { "strict": true, "contexts": [ /* main と同一の 8 contexts */ ] },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,   // ★ dev=1名
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,    // ★ dev は CODEOWNERS 必須にしない
    "require_last_push_approval": false     // ★ dev は緩める
  },
  "required_linear_history": true,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "lock_branch": false,
  "restrictions": null
}
```

差分まとめ:

| 項目 | dev | main |
| --- | --- | --- |
| approving review 数 | 1 | 2 |
| CODEOWNERS 必須 | × | ◯ |
| last push 承認必須 | × | ◯ |
| status checks | 同一 | 同一 |
| linear history / squash | 同一 | 同一 |

---

## 4. squash-only マージポリシー

GitHub の repository setting と branch protection の **二層** で強制する。

| レイヤ | 設定 | 値 |
| --- | --- | --- |
| repository setting | `allow_squash_merge` | `true` |
| repository setting | `allow_merge_commit` | `false` |
| repository setting | `allow_rebase_merge` | `false` |
| repository setting | `delete_branch_on_merge` | `true` |
| repository setting | `squash_merge_commit_title` | `PR_TITLE` |
| repository setting | `squash_merge_commit_message` | `PR_BODY` |
| branch protection | `required_linear_history` | `true`（main / dev とも） |

> linear history と squash-only の組み合わせにより、merge commit が物理的に作れない状態を保証する。

---

## 5. auto-rebase workflow 草案

base 更新時に PR を最新 main/dev に追従させる軽量ワークフロー。**ラベル起点** とし、暴走を防ぐ。初期草案では `pull_request` の `labeled` / `synchronize` のみに限定し、`push` 起点で対象 PR を列挙する処理は後続実装タスクへ分離する。

```yaml
# .github/workflows/auto-rebase.workflow.yml.draft
name: auto-rebase
on:
  pull_request:
    types: [labeled, synchronize]

concurrency:
  group: auto-rebase-${{ github.event.pull_request.number }}
  cancel-in-progress: true

permissions:
  contents: write          # rebase push のため最小限
  pull-requests: write     # コメント/ラベル更新

jobs:
  rebase:
    if: contains(github.event.pull_request.labels.*.name, 'auto-rebase')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.ref }}
          fetch-depth: 0
          persist-credentials: true
      - name: rebase onto base
        run: |
          git fetch origin ${{ github.event.pull_request.base.ref }}
          git rebase origin/${{ github.event.pull_request.base.ref }} || {
            echo "rebase conflict — bot は手を出さない"
            exit 1
          }
          git push --force-with-lease
```

設計ポイント:

- `auto-rebase` ラベルが付いた PR のみ対象（暴走防止）
- `concurrency` で同一 PR の同時実行を抑止
- `permissions` は `contents: write` / `pull-requests: write` の最小に固定
- コンフリクト時は **bot は止まる**（人手判断に委ねる。横断 task-conflict-prevention-skill-state-redesign の責務に渡す）
- `--force-with-lease` で他者 push の上書き事故を防ぐ
- base branch push 後の一括追従は、GitHub API で対象 PR を列挙する別 job が必要なため本草案の初期 target から外す

---

## 6. pull_request_target safety gate 草案

`pull_request_target` は **base リポの secrets と write token** を持って起動するため、fork PR が悪意あるコードを混ぜた場合に直撃する。本設計では `pull_request_target` 内で PR head の checkout / install / build を行わない。PR コードの検証は `pull_request` workflow に閉じ、権限が必要なラベル・コメント操作だけを `pull_request_target` に残す。

```yaml
# .github/workflows/pr-target-safety-gate.workflow.yml.draft
name: pr-target-safety-gate
on:
  pull_request_target:
    types: [opened, synchronize, reopened, labeled]

permissions: {}   # ★ ワークフロー全体は no-permissions（job 単位で必要分のみ昇格）

jobs:
  # ラベル付与など権限が必要な job：PR コードを checkout / 実行しない
  triage:
    permissions:
      pull-requests: write
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.repository.default_branch }}  # ★ default branch から固定 ref
          persist-credentials: false
      - name: triage label
        env:
          GH_TOKEN: ${{ github.token }}
        run: gh pr edit ${{ github.event.pull_request.number }} --add-label needs-review
```

PR コード検証側は通常の `pull_request` workflow に分離する。

```yaml
# .github/workflows/pr-untrusted-build.workflow.yml.draft
name: pr-untrusted-build
on:
  pull_request:
    types: [opened, synchronize, reopened]
permissions:
  contents: read
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          persist-credentials: false
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env: {}
```

要件マッピング:

| 要件 | 実装手段 |
| --- | --- |
| fork PR で secrets を露出させない | `pull_request_target` では PR head を checkout しない。untrusted build は `pull_request` に分離 |
| `actions/checkout` の `ref` 固定 | triage job は default branch、untrusted build は head SHA |
| 権限昇格 job と PR コード実行 job の分離 | workflow を分け、それぞれ permissions を最小化 |
| `persist-credentials: false` | git credential を job 終了後に残さない |

---

## 7. 状態遷移図（feature → dev → main）

```
[ feature/* ]
   │  PR open → required checks 8件 ＋ dev=1名 approve ＋ linear history
   ▼
[ dev (staging) ]                ── auto-rebase ラベルで base 追従可
   │  PR open → required checks 8件 ＋ main=2名 approve ＋ CODEOWNERS ＋ last-push 承認
   ▼
[ main (production) ]            ── lock_branch スイッチで凍結可
```

squash-only により、各遷移で 1 commit に圧縮される。

---

## 8. 横断依存との責務境界（Phase 1 §6 の再確認）

| 横断タスク | 本タスクが扱う | 本タスクが扱わない |
| --- | --- | --- |
| task-git-hooks-lefthook-and-post-merge | CI 側の同名 status check による二重防壁化 | ローカル hook の実装 |
| task-conflict-prevention-skill-state-redesign | rebase 失敗時に「bot は止まる」という境界宣言 | コンフリクト解消手順 |
| task-worktree-environment-isolation | worktree 不可知の前提（CI は repo 単位） | worktree ごとの env 隔離 |
| task-claude-code-permissions-decisive-mode | GHA permissions の最小権限 | Claude Code 側の決断モード |

---

## 9. Phase 1 受入条件への対応

| AC | 対応箇所 |
| --- | --- |
| AC-1 | §2, §3 |
| AC-2 | §4 |
| AC-3 | §5 |
| AC-4 | §6 |
| AC-5 | §8 |
| AC-6 | 各成果物（main.md / index.md）に Phase 13 ゲートを継承 |
| AC-7 | 冒頭注記で「草案・実装は別タスク」と宣言 |
