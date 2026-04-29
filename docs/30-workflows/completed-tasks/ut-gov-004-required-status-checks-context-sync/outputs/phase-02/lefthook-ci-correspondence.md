# lefthook-ci-correspondence.md — lefthook hook ↔ CI job 対応表

> Phase 2 設計成果物 / 入力: lefthook.yml, package.json, .github/workflows/*.yml

## 1. hook → pnpm script → CI job 対応表

| lefthook hook / command | 実行スクリプト | 対応 CI workflow / job (context) | 同一 script 共有 | 備考 |
| --- | --- | --- | --- | --- |
| pre-commit / main-branch-guard | `bash scripts/hooks/main-branch-guard.sh` | （CI 対応なし — ローカル専用ガード） | n/a | main / dev への直接 commit を防止するローカルガード |
| pre-commit / staged-task-dir-guard | `bash scripts/hooks/staged-task-dir-guard.sh` | （CI 対応なし — ローカル専用ガード） | n/a | branch と無関係なタスク dir の混入防止 |
| post-merge / stale-worktree-notice | `bash scripts/hooks/stale-worktree-notice.sh post-merge` | （CI 対応なし — ローカル通知） | n/a | 他 worktree 同期通知 |
| （未設定）pre-push 推奨 | `pnpm typecheck` | `ci` (workflow `ci` / job `ci` の `Type check` ステップ) | YES（`pnpm typecheck`） | hook 未配置でも CI 側で必ず検証 |
| （未設定）pre-push 推奨 | `pnpm lint` | `ci` (workflow `ci` / job `ci` の `Lint` ステップ) | YES（`pnpm lint`） | 同上 |
| （未設定）pre-push 推奨 | `pnpm build` | `Validate Build` (workflow / job 同名) の `Build` ステップ | YES（`pnpm build`） | 同上 |
| （未設定）pre-push 推奨 | `pnpm indexes:rebuild` && `git diff` | `verify-indexes-up-to-date` の `Rebuild indexes` + `Verify indexes are up to date` ステップ | YES（`pnpm indexes:rebuild`） | drift 検出を pre-push で先行確認可 |

## 2. 同一 pnpm script 共有規約

**規約**: `lefthook.yml` の `run:` と `.github/workflows/*.yml` の `run:` は、コマンド実体を直接インライン記述せず、必ず `package.json` の `scripts` に定義された pnpm script（または共通 shell script）を呼び出す形に揃える。

| 禁止 | 許可 |
| --- | --- |
| `run: tsc --noEmit` | `run: pnpm typecheck` |
| `run: eslint .` | `run: pnpm lint` |
| `run: vitest run` | `run: pnpm test` |

例外:
- `actions/checkout@v4` 等の uses ステップ
- `actions/setup-node@v4` 等のセットアップ系
- 認証系 / wrangler 系（`bash scripts/cf.sh` 経由は許可）

## 3. strict mode 採否（dev / main）

| 観点 | dev | main | 根拠 |
| --- | --- | --- | --- |
| merge 摩擦 | 低 (`strict: false`) | 高 (`strict: true`) | dev は実験的 merge 許容、main は up-to-date 必須で壊れリスク最小化 |
| 壊れリスク | 中 | 低 | main は本番デプロイトリガのため壊れた場合の影響大 |
| solo 運用 | OK | OK | rebase コストは個人開発で許容範囲 |
| ロールバック容易性 | 容易 | 容易 | 永続停止時は `gh api -X PATCH` で即時解除 |

**最終決定**: `dev = strict:false` / `main = strict:true`。Phase 3 代替案レビューで再評価し、Phase 9 `strict-decision.md` で正本化する。

## 4. ドリフト検出運用

### 4-a. 検出メカニズム

- ローカル `pnpm lint` / `pnpm typecheck` が PASS しているのに CI で FAIL する場合、それは「lefthook と CI が異なる script / version を呼んでいる」サイン。
- 検出 trigger: PR check-run の失敗ログを月 1 回サンプリングし、`pnpm install --frozen-lockfile` 後の version 差分を確認。

### 4-b. 是正フロー

1. 該当 script を `package.json` 中央定義に集約
2. `lefthook.yml` と workflow 双方を当該 pnpm script 呼び出しに置換
3. 同一 PR で適用しドリフト発生窓を最小化

### 4-c. 監査記録

- ドリフト是正 PR のタイトルに `[ci-hook-drift-fix]` を付与し履歴追跡可能にする
- 直近の lefthook 設定: `lefthook.yml` (min_version: 1.6.0)
- 直近の Node / pnpm バージョン: `package.json engines` (Node 24.x / pnpm 10.x) と CI `pnpm/action-setup@v4 with version: 10.33.2` / `actions/setup-node@v4 with node-version: '24'` を一致確認済み

## AC 充足

- AC-5: hook ↔ pnpm script ↔ CI job 対応表を §1 に作成、`task-git-hooks-lefthook-and-post-merge` 設計と整合 ✅
- AC-7: strict 採否を dev / main 別に判定軸付きで決定 ✅
