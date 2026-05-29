# Phase 13 — commit / PR draft

## 13.1 ブランチ

```
docs/issue-956-h1-ingest-recovery   (dev 派生)
```

## 13.2 commit 構成 (docs-only)

| commit | 内容 |
|--------|------|
| 1 | `docs(issue-956): add Phase 1-13 spec for H1 ingest recovery runtime ops` — 本 spec 一式 (Phase 1-13 + index.md) |
| 2 (実施後) | `docs(issue-956): capture production evidence (snapshot + cron tail + secret-list)` — `outputs/phase-11/*` |
| 3 (実施後) | `docs(issue-956): close-out + completed-tasks move` — `phase-12` final + `completed-tasks/` 移動 + 元 unassigned spec consume |

> commit 2/3 は production runtime ops 実施後のみ生成。docs-only spec 段階 (commit 1) は実施前に PR 化可能。

## 13.3 PR draft (commit 1 後)

- title: `docs(issue-956): H1 ingest recovery — Phase 1-13 spec (runtime ops, docs-only)`
- base: `dev`
- body 抜粋:

```markdown
## Summary
- Issue #956 (CLOSED, refs) の H1 修復 runtime ops 手順を Phase 1-13 spec として確定
- 親 workflow `google-form-reflection-diagnostics` (PR #960) で実装済の diagnostics endpoint / cron handler / sync-lock TTL / sheets-auth-classifier を前提とし、production Cloudflare Secrets 投入 + cron 観測 + stale lock check のみを担う
- 実装区分: ドキュメントのみ / runtime ops (CONST_004 例外: コード変更を含意しない)

## Out of scope
- H2/H3/H4 修復 (既存 followup-002/003/004)
- diagnostics endpoint 改修 (親 workflow Spec-A)
- sync-lock TTL チューニング (別 followup 候補)

## Test plan
- [ ] `mise exec -- pnpm typecheck` (コード差分無のため自動 pass)
- [ ] `mise exec -- pnpm lint`
- [ ] `bash scripts/verify-pr-ready.sh` (verify:phase12-compliance / gate-metadata:validate / indexes:rebuild drift)

## Runtime ops (本 PR merge 後に別途実施)
- [ ] AC-1 ~ AC-6 達成
- [ ] outputs/phase-11/* に evidence 配置
- [ ] completed-tasks/ へ移動
```

## 13.4 PR ラベル

- `type:docs`
- `area:api`
- `scope:ops`
- (任意) `refs:#956`

## 13.5 commit / push / PR 実行ポリシー

- commit / push / PR creation は **ユーザー明示指示があるまで実行禁止** (本プロンプトの責務外)
- 本フォルダ生成後に user 承認を得てから `gh pr create --base dev` を実行する
