# System spec update summary — UT-GOV-003 CODEOWNERS

> Step 1-A / 1-B / 1-C / Step 2 全項目を個別記述。N/A 区分も理由明記必須。

## Step 1-A: aiworkflow-requirements 関連 reference 更新有無

### 確認手順

```bash
rg -l "CODEOWNERS|code owner|governance" .claude/skills/aiworkflow-requirements/references/
```

### 判定（確定）

| ケース | 判定 | 対応 |
| --- | --- | --- |
| 該当 section が既に存在 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` に GitHub governance 草案が存在 | `.github/CODEOWNERS` の current applied ownership 文書化を同ファイルへ追記 |
| 該当 section が存在しない | N/A | 既存 section があるため新規 `governance.md` 作成は不要 |

### 本タスクで反映した追記

```markdown
## Governance / Code owners

`.github/CODEOWNERS` で以下 5 path に対し owner を明示する（ownership 文書化のみ。
solo 運用のため `require_code_owner_reviews=true` は有効化しない）:

- `docs/30-workflows/**`
- `.claude/skills/**/references/**`
- `.github/workflows/**`
- `apps/api/**`
- `apps/web/**`

詳細: `docs/30-workflows/ut-gov-003-codeowners-governance-paths/`
```

> Step 1-A の確定判定: aiworkflow-requirements 正本には既に GitHub governance 草案があるため、`.github/CODEOWNERS` の current applied ownership 文書化を `deployment-branch-strategy.md` へ同一 wave で反映した。`require_code_owner_reviews=false` は維持する。

---

## Step 1-B: CLAUDE.md の owner 表との関係明示

### CLAUDE.md と CODEOWNERS の対応関係

| CLAUDE.md「主要ディレクトリ」エントリ | CODEOWNERS path | 役割 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/` | global fallback (`* @daishiman`) で被覆。本タスクの 5 governance path には含めない | 設計仕様正本 |
| `docs/30-workflows/` | `docs/30-workflows/** @daishiman` | ワークフロータスク仕様 |
| `apps/web/` | `apps/web/** @daishiman` | Cloudflare Workers (Next.js) |
| `apps/api/` | `apps/api/** @daishiman` | Cloudflare Workers (Hono) |
| `.claude/skills/**/references/` | `.claude/skills/**/references/** @daishiman` | skill 正本 |

### `doc/` `docs/` 表記揺れ実態と方針

実フォルダ名:

- `docs/00-getting-started-manual/`（実在）
- `docs/30-workflows/`（実在）
- → **両者は `docs/` 配下の別役割で並存しており、過去文書や履歴内の `doc/` 文字列は一括置換せず分類が必要**

CLAUDE.md / 正本仕様内の参照表記揺れ棚卸しは `documentation-changelog.md` の入力として残す。本タスクで決定する方針:

- 実フォルダ名 `docs/00-getting-started-manual/` は維持
- 実フォルダ名 `docs/30-workflows/` は維持
- CLAUDE.md / 正本仕様内で「この 2 系統は別役割」を明示する
- CODEOWNERS には 5 governance path のみ書き、`doc/` 系は本タスクでは対象外（UT-GOV-005 へ委譲）

### CLAUDE.md への追記

```markdown
## Governance / CODEOWNERS

solo 運用ポリシーに従い `require_code_owner_reviews` は有効化しない（`required_pull_request_reviews=null`）。
`.github/CODEOWNERS` は ownership 文書化のみとして 5 governance path に owner を明示する:

- `docs/30-workflows/**` / `.claude/skills/**/references/**` / `.github/workflows/**` / `apps/api/**` / `apps/web/**`

詳細: `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/implementation-guide.md`
```

---

## Step 1-C: README 等への CODEOWNERS 言及追加

### リポジトリ root README.md 確認

```bash
test -f README.md && echo "exists" || echo "absent"
```

### 判定

| ケース | 対応 |
| --- | --- |
| README.md 存在 | 「Governance / Code owners」節に 1 段落追加（5 governance path + `require_code_owner_reviews` 非有効化 + 移行手順への参照） |
| README.md 不在 | N/A 記録。UT-GOV-005（docs-only nonvisual template skill sync）へ申し送り |

### 追記 diff（README.md 存在時）

```markdown
## Governance / Code owners

This repository uses `.github/CODEOWNERS` for ownership documentation only.
`require_code_owner_reviews` is NOT enabled because the project is in solo-maintenance mode.

Five governance paths are owned by `@daishiman`:

- `docs/30-workflows/**`
- `.claude/skills/**/references/**`
- `.github/workflows/**`
- `apps/api/**`
- `apps/web/**`

See `docs/30-workflows/ut-gov-003-codeowners-governance-paths/` for the migration plan
to `require_code_owner_reviews=true` once contributors join the project.
```

---

## Step 2: aiworkflow-requirements 仕様更新（条件付き）

### 判定: **部分適用**

### N/A 理由

本タスク（UT-GOV-003）は `.github/CODEOWNERS` および `doc/` `docs/` 表記揺れ棚卸しという **GitHub リポジトリ管理境界（governance）の変更** であり、UBM-Hyogo Web アプリのドメイン仕様（API schema / D1 schema / IPC 契約 / UI 仕様 / 認証仕様）には**一切影響しない**。

そのため domain spec / data flow / IPC contract 等の更新は **不要**。ただし GitHub governance の current applied 値として `.github/CODEOWNERS` が追加されたため、Step 1-A の範疇で `deployment-branch-strategy.md` に反映済み。

### Step 2 を将来適用すべき条件

以下のいずれかが満たされた場合、本タスクとは別の Step 2 適用タスクを起票する:

1. CODEOWNERS の owner spec が「ドメイン責務単位（feature 領域）」と紐付く粒度に拡張される（例: `apps/api/src/forms/** @forms-team`）
2. governance workflow が IPC 契約の検証を担う形に進化（例: schema drift gate を `.github/workflows/` に追加）
3. `require_code_owner_reviews=true` 有効化に伴い owner 解決が CI gate を通過する不変条件として正本仕様化される
