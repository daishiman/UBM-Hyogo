# Phase 13: PR 作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-399-admin-queue-resolve-staging-visual-evidence |
| phase | 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implementation-prepared |

## 状態

`blocked_pending_user_approval`

implementation-prepared 段階の Phase 13 は **commit / push / PR を作成しない**。本 Phase の declared output は placeholder のみ。

## declared outputs（実体は user 承認後）

| ファイル | 状態 |
| --- | --- |
| `outputs/phase-13/main.md` | placeholder（"blocked: pending user approval to commit/push/PR"） |

## PR 作成承認後のフロー

user から明示的承認を得たら、以下を CLAUDE.md `## PR作成の完全自律フロー` に従い実行:

1. `git fetch origin main` → ローカル `main` を fast-forward 同期
2. 作業ブランチに main をマージ、コンフリクト解消
3. `mise exec -- pnpm install --force && pnpm typecheck && pnpm lint`
4. 失敗時は最大 3 回まで自動修復（typecheck / lint / install のいずれも）
5. `git status --porcelain` 空 / `git diff main...HEAD --name-only` で PR 同梱ファイル確定
6. PR 本文は `outputs/phase-12/implementation-guide.md` の Part 1 / Part 2 を反映
7. `outputs/phase-11/screenshots/` の image 数と PR 本文 image 参照の整合
8. `gh pr create --base main`

## PR タイトル（案）

```
docs(issue-399): admin queue resolve staging visual evidence task spec
```

または実装サイクル後:

```
feat(issue-399): admin queue resolve staging visual evidence (seed + runbook + capture)
```

## 禁止事項

- `--no-verify` 使用禁止
- `force push` 禁止
- staging seed 投入 / 実 screenshot 取得を本 PR ブランチ上の作業として混在させない（spec PR と実行 PR を分離する判断を user に提示）

## 完了条件

- [ ] - user 承認後に PR URL が `outputs/phase-13/main.md` に記録されること
- CI（typecheck / lint / verify-indexes 等）すべて green

## 目的

Phase 13 の判断と成果物境界を明確にする。

## 実行タスク

- Phase 13 の入力、実装状態、runtime pending 境界を確認する。

## 参照資料

- [index.md](index.md)
- [artifacts.json](artifacts.json)
- [runbook.md](runbook.md)

## 成果物

- `outputs/phase-13/main.md`

## 統合テスト連携

- Focused Vitest は Phase 09 の品質 gate に集約する。
