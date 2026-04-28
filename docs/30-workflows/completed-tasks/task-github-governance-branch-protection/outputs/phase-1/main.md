# Phase 1 — 要件定義

## Status
done

## 1. タスク分類

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| 実行種別 | spec_created |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| 既存リポ命名規則確認 | `docs/30-workflows/task-*` 配下に index.md / phase-NN.md / outputs/phase-N/ を持つ既存タスク（例: task-conflict-prevention-skill-state-redesign）と同一の構造を踏襲することを確認 |

> 本タスクは「実装は別タスクで行う」前提の **草案仕様化** に閉じる。GitHub API 呼び出し・YAML/JSON ファイル投入は範囲外。

## 2. 真の論点（Root Question）

> 複数 worktree × squash-only マージという運用前提の下で、
> - `feature/* → dev → main` の rebase 戦略をどう一意に統一し、
> - `pull_request_target` 経由の権限昇格 / secrets 漏えいを構造的に遮断し、
> - dev=1名・main=2名という非対称レビュー要件を Branch Protection で機械的に強制するか
>
> を、実装者が翻訳ロスなく着手できる粒度で文書化する。

## 3. スコープ

### 含む（In Scope）

| # | 項目 | アーティファクト名（canonical） |
| - | --- | --- |
| 1 | branch protection 設定の JSON 草案（main / dev 両方） | `branch-protection.main.json.draft`, `branch-protection.dev.json.draft` |
| 2 | squash-only 強制方針（merge commit / rebase merge を禁止） | `merge-policy.draft.md` |
| 3 | auto-rebase ワークフロー草案（label 起点） | `auto-rebase.workflow.yml.draft` |
| 4 | `pull_request_target` safety gate 草案 | `pr-target-safety-gate.workflow.yml.draft` |
| 5 | 必須ステータスチェック一覧と命名 | `required-status-checks.draft.md` |
| 6 | Phase 13 のユーザー承認ゲート維持の明文化 | 各 Phase ドキュメントに記載 |

### 含まない（Out of Scope）

- 上記 JSON / YAML の **GitHub への適用** （別実装タスク）
- `gh api` / Terraform / `tfsec` 等の IaC 採用判断（Phase 2 で参考案として触れるのみ）
- branch protection 以外の repository setting（webhooks, secrets scanning 等）
- 既存 PR の遡及書き換え

## 4. 受入条件（Acceptance Criteria）

- [ ] AC-1: main / dev それぞれの branch protection 設定の必須項目（required reviewers 数・status checks・linear history・lock 等）が JSON 抜粋付きで定義されている。
- [ ] AC-2: squash-only を強制する設定キー（`allow_squash_merge=true`, `allow_merge_commit=false`, `allow_rebase_merge=false`）が明示されている。
- [ ] AC-3: auto-rebase workflow が、トリガー / 必要な permissions / concurrency キー / 失敗時挙動まで記述されている。
- [ ] AC-4: `pull_request_target` safety gate が「fork PR で secrets を露出させない」要件を満たす設計（checkout ref 固定・job 分離・最小 permissions）になっている。
- [ ] AC-5: 横断依存タスクとの責務境界が表で明示されている。
- [ ] AC-6: Phase 13 のユーザー承認ゲート維持が明記されている。
- [ ] AC-7: 草案であり実装は別タスクであることが各文書冒頭で宣言されている。

## 5. 制約（Constraints）

| # | 制約 | 出典 |
| - | --- | --- |
| C-1 | monorepo（pnpm workspace, apps/web=Workers+Next.js, apps/api=Hono）を前提に status check 名を設計する | CLAUDE.md |
| C-2 | dev=1名・main=2名のレビュー数 | CLAUDE.md ブランチ戦略表 |
| C-3 | secrets は Cloudflare Secrets / GitHub Secrets / 1Password 多層管理。GHA からは GitHub Secrets のみ参照 | CLAUDE.md |
| C-4 | D1 直接アクセスは apps/api 限定（status check 設計では apps/api / apps/web を別ジョブとして区別） | CLAUDE.md |
| C-5 | `wrangler` 直接実行禁止・`scripts/cf.sh` 経由（CI で deploy job を扱う場合の前提） | MEMORY |
| C-6 | 平文 `.env` / トークン値の文書転記禁止 | MEMORY |

## 6. 横断依存（責務境界の予告）

| 依存タスク | 本タスクとの境界 |
| --- | --- |
| task-conflict-prevention-skill-state-redesign | コンフリクト検出は **skill 側**、merge 戦略の最終ゲートは **本タスクの branch protection** |
| task-git-hooks-lefthook-and-post-merge | ローカル hook で typecheck/lint を担保 → CI でも同名チェックを **必須化** することで二重防壁にする |
| task-worktree-environment-isolation | worktree ごとの env 隔離は環境構築側、CI 上では `pull_request` イベントが repo 単位で発火するため本タスクは worktree 不可知 |
| task-claude-code-permissions-decisive-mode | Claude Code 側の決断モードは GHA 権限とは別レイヤ。**両者の最小権限ポリシーは独立に成立** することを Phase 3 で確認 |

## 7. アーティファクト命名 canonical 一覧

```
outputs/phase-1/main.md                      … 本書
outputs/phase-2/main.md                      … Phase 2 サマリ
outputs/phase-2/design.md                    … 設計本体（草案 JSON/YAML 抜粋を含む）
outputs/phase-3/main.md                      … Phase 3 サマリ
outputs/phase-3/review.md                    … 4 条件レビューと GO/NO-GO
```

draft 識別子（design.md 内のコードブロックに付与）:

- `branch-protection.main.json.draft`
- `branch-protection.dev.json.draft`
- `auto-rebase.workflow.yml.draft`
- `pr-target-safety-gate.workflow.yml.draft`

## 8. 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | ◎ | 2 名運用でも main を確実にロックでき、squash-only により履歴の線形性を機械的に保証 |
| 実現性 | ◎ | GitHub Branch Protection / GHA の標準機能のみで構成。追加 SaaS 不要 |
| 整合性 | ○ | 横断 4 タスクと責務分離可。Phase 3 で最終確認 |
| 運用性 | ○ | 設定変更は JSON/YAML diff としてレビュー可能。ロールバックは旧 JSON 再適用 |

## 9. 完了判定

- AC-1〜AC-7 をすべて満たす Phase 2 / Phase 3 が産出されること。
- 本書が Phase 2 / Phase 3 の前提として引用可能であること。
