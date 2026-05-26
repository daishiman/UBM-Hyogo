---
phase: 13
title: Commit / PR Draft
workflow_id: issue-901-authenticated-profile-admin-staging-visual
status: spec_created
---

# Phase 13 — Commit / PR Draft

[実装区分: 実装仕様書]

## 1. commit 分割案（推奨）

| commit | scope | 含むもの |
|---|---|---|
| C-01 | spec | 本 workflow root の Phase 1-13 + outputs/phase-11..12 全ファイル |
| C-02 | feat(web) | mint CLI + unit test + Playwright setup/teardown/projects/config 差分 + 2 spec + `.gitignore` |
| C-03 | docs | proto-spec consumed pointer + 親 workflow cross-ref |
| C-04 | ci | `.github/workflows/playwright-staging-visual-authenticated.yml` + `scripts/lib/grep-no-auth-leak.sh` |
| C-05 | feat(web) | baseline PNG 2 件 + outputs/phase-11/screenshots/ 2 件（Gate-C 後） |
| C-06 | docs | aiworkflow-requirements 同 wave 更新（indexes / inventory / changelog） |

> 本 workflow は VISUAL 実装タスクのため docs-only 完了扱いにしない。Gate-A では仕様・正本同期のみをレビュー可能だが、目的達成には Gate-B/C の実コード・CI・authenticated PNG evidence が必要。

## 2. PR draft

```
title: feat(issue-901): authenticated /profile and /admin staging-visual baseline via storageState
base: dev
labels: visual, ci, security, refs-only
```

PR body:

```markdown
## Summary

UT-DSF-07 で「未認証 guard 画面」までしか担保できていない staging visual runtime coverage を、認証後 `/profile`（member session）/ `/admin`（admin session）まで拡張する。`@ubm-hyogo/shared` の `signSessionJwt` を再利用した storageState 事前生成方式（TTL=600s）で `authjs.session-token` cookie を Playwright に注入し、`staging-visual-authenticated` project で baseline PNG `*-authenticated-staging-visual-chromium-linux.png` を取得する。

Refs #901

> 注: #901 は CLOSED のまま運用する（closed-issue-canonical-workflow-recovery）。`Closes #901` は使わない。

## 変更内容

- 新規: `apps/web/playwright/scripts/mint-staging-storage-state.ts` + unit test
- 新規: Playwright `setup-authenticated-staging` / `staging-visual-authenticated` / `teardown-authenticated-staging` の 3 project
- 新規: `profile-authenticated.spec.ts` / `admin-dashboard-authenticated.spec.ts`
- 新規: `.github/workflows/playwright-staging-visual-authenticated.yml` + `scripts/lib/grep-no-auth-leak.sh`
- 編集: `apps/web/playwright.config.ts` / `apps/web/.gitignore` / 既存 `visual-staging/{profile,admin-dashboard}.spec.ts` への cross-ref コメント
- 編集: 親 `ut-dsf-07-staging-visual-runtime-evidence/phase-09-risks.md` §5 と `phase-13-commit-pr-draft.md` §7 に R-03 解消 cross-ref
- 編集: proto-spec に `status: consumed` + `canonical_workflow` pointer
- evidence: `docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual/outputs/phase-11/screenshots/{profile,admin-dashboard}-authenticated.png`

## セキュリティ

- storageState JSON は git 非コミット（`.gitignore` + grep gate）
- cookie 値 / JWT / `STAGING_AUTH_SECRET` 値は log / screenshot / spec / docs に 0 hit（`verify-no-auth-secret-leak`）
- production deploy / 新規 API endpoint / D1 schema 変更 0 件

## Test plan

- [x] `pnpm typecheck` / `pnpm lint` / mint CLI unit test 10 case
- [x] Playwright `staging-visual-authenticated` 2 spec で visibility assert + baseline 取得
- [x] `verify-no-auth-secret-leak` 0 hit
- [x] `gate-metadata:validate` / `verify:phase12-compliance` / `verify-pr-ready.sh`
- [x] storageState 削除確認（`rm -rf apps/web/playwright/.auth`）
```

## 3. required status check 候補

| context | workflow | 必須化候補 |
|---|---|---|
| `web-unit / unit` | `web-ci.yml` | ✅（既存） |
| `playwright-staging-visual-authenticated / authenticated (chromium)` | 新設 | dev required 追加候補 |
| `verify-no-auth-secret-leak / grep` | 新設 | dev required 追加候補 |
| `verify-phase12-compliance / verify` | 既存 | ✅（既存） |
| `verify-gate-metadata / verify` | 既存 | ✅（既存） |
| `verify-indexes-up-to-date / verify` | 既存 | ✅（既存） |

`dev` / `main` branch protection への required 追加は **user 明示承認後のみ** `gh api -X PUT` で適用。本タスク Phase 13 では候補列挙に留め、PUT 実行はしない（governance mutation）。

## 4. rollback 手順

```bash
# spec PR が merge された後で問題発覚した場合
gh pr revert <pr-number>    # 単一 revert PR で 7 新規 + 7 編集ファイルを巻き戻し

# baseline PNG drift で flake 連発した場合
gh workflow run playwright-staging-visual-authenticated.yml -f update_snapshots=true
git commit --allow-empty -m "ci: re-trigger required checks after baseline update" && git push
```

## 5. issue / 親 workflow 操作（governance）

| 操作 | 実行可否 | 備考 |
|---|---|---|
| issue #901 reopen | ❌ 禁止 | CLOSED 維持 |
| `Closes #901` 出力 | ❌ 禁止 | `Refs #901` のみ |
| 親 `artifacts.json.metadata.parent_gate` を `VISUAL_RUNTIME_AUTHENTICATED_OK` に更新 | user 承認後のみ | Gate-C 配下 |
| branch protection PUT | user 承認後のみ | §3 required 追加 |

## 6. Gate

| Gate | 通過条件 |
|---|---|
| Gate-A (spec_review) | 本 spec 全 14 ファイル + outputs 揃い + canonical 9 headings + strict 7 + recovery §3 適合 → user `Approve Gate A` |
| Gate-B (implementation_review) | C-02..C-04 commit + L-01..L-07 + grep gate → user `Approve Gate B` |
| Gate-C (external_ops) | CI authenticated job green + C-05 baseline 配置 + 親 cross-ref + parent gate 更新 → user `Approve Gate C` |

## 7. 後続アクション（out-of-scope follow-up 候補・本 PR では発行しない）

- FU-901-001 候補: 認証後 admin の members-list / member-detail / tags / meetings / audit など他 admin 画面 baseline 取得
- FU-901-002 候補: KV ベース session revocation 導入時の storageState 再生成戦略
