# Phase 13: PR 作成 — 06b-C-profile-logged-in-visual-evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-C-profile-logged-in-visual-evidence |
| phase | 13 / 13 |
| wave | 6b-fu |
| 作成日 | 2026-05-03 |
| taskType | implementation-spec |
| user_approval_required | **true**（commit / push / PR 作成 / production への影響有無確認） |

## 目的

`outputs/phase-12/implementation-guide.md` を素材に、main 同期 → commit → push → PR 作成を完遂する。本仕様書作成段階では実行しない。

## ブランチ命名

- 仕様書作成: `docs/issue-06b-C-profile-logged-in-visual-evidence-task-spec`（既存）
- 実装本体: `feat/06b-C-profile-logged-in-visual-evidence`（実装時に新規作成）

## PR タイトル候補

- `feat(profile): 06b-C profile logged-in visual evidence (Playwright + capture)`
- 70 文字以内

## PR 本文構成

```md
## Summary
- logged-in `/profile` の visual evidence を Playwright spec + capture script で取得
- M-08 / M-09 / M-10 / M-14 / M-15 / M-16 を実測し read-only 境界（invariant #4 / #5 / #11）を実画面で確認
- アプリ本体（apps/web/app/profile, apps/api）への変更なし

## Changes
- apps/web/playwright/tests/profile-readonly.spec.ts (new)
- apps/web/playwright.config.ts (edit: staging project)
- apps/web/playwright/.auth/.gitkeep (new)
- .gitignore (edit: state.json 除外)
- scripts/capture-profile-evidence.sh (new)
- docs/30-workflows/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/* (evidence)
- docs/30-workflows/06b-C-profile-logged-in-visual-evidence/outputs/phase-12/* (reports)

## Evidence
- screenshots: outputs/phase-11/screenshots/M-08..M-16-*.png
- DOM dump: outputs/phase-11/dom/M-09-no-form-{desktop,mobile}.json, M-10-edit-query-ignored-{desktop,mobile}.json
- smoke: outputs/phase-11/manual-smoke-evidence.md（6 行 captured）

## Test plan
- [x] mise exec -- pnpm --filter @ubm-hyogo/web typecheck
- [x] mise exec -- pnpm --filter @ubm-hyogo/web lint
- [x] mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --list --project=staging
- [x] bash scripts/capture-profile-evidence.sh ... (staging 実測)
- [x] redaction 目視確認

## Invariants
- #4 本文更新は Google Form 再回答のみ — M-09 form/input/textarea/submit count = 0 で実測
- #5 public/member/admin boundary — M-16 logout redirect 実測
- #8 GAS prototype を正本にしない — 該当なし
- #11 管理者も他人本文を直接編集しない — 本タスクは self profile のみ確認

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 実行手順（実装時、本仕様書作成時には実行しない）

1. `git fetch origin main && git checkout main && git pull --ff-only`
2. `git checkout feat/06b-C-profile-logged-in-visual-evidence`（無ければ新規）
3. `git merge main`（コンフリクト解消は CLAUDE.md の方針）
4. `mise exec -- pnpm install --force && pnpm typecheck && pnpm lint`
5. `git add` 関連ファイル → `git commit`（複数 commit 可）
6. `git push -u origin feat/06b-C-profile-logged-in-visual-evidence`
7. `gh pr create --title "..." --body "$(cat <<'EOF' ... EOF)"`
8. `gh pr view --json url` で URL 確認

## user approval gate

- main → feature への merge 実行
- staging に対する実測（Phase 11）
- PR 作成後の自動 merge は行わない（user 確認まで）

## サブタスク管理

- [ ] PR タイトル / 本文の確定
- [ ] main 同期完了
- [ ] CI（typecheck / lint / verify-indexes）GREEN
- [ ] PR URL 取得
- [ ] outputs/phase-13/main.md に PR 情報を記載

## 成果物

| 成果物 | パス |
| --- | --- |
| PR 情報 | `outputs/phase-13/main.md`（PR URL / branch / merge 状態） |

## 完了条件

- [ ] PR が作成され URL が記録されている
- [ ] CI GREEN
- [ ] PR 本文に Summary / Changes / Evidence / Test plan / Invariants が含まれている
- [ ] storageState がリモートに push されていない

## タスク100%実行確認

- [ ] user approval なしに自動 merge していない
- [ ] `--no-verify` を使用していない
- [ ] force push を main / dev に行っていない

## 次 Phase への引き渡し

完了。後続: 09a staging visual smoke が本 spec を参照する。
