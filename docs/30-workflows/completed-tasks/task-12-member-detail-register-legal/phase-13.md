# Phase 13: PR 作成

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 13 |
| task | task-12-member-detail-register-legal |
| state | implemented-local / implementation / runtime evidence pending_user_approval |
| 区分 | 実装仕様書 |
| PR base 既定 | `dev`（CLAUDE.md / userメモリ準拠。`main` は production リリース時の `dev → main` のみ） |

## 目的

Phase 11 evidence + Phase 12 の 6 必須出力（最低 7 ファイル）が揃った状態で、`gh pr create --base dev` により PR を作成する。本 Phase はユーザーから明示の PR 作成許可を得た後にのみ実行する（task-specification-creator skill 重要ルール）。実コミット / push / PR 作成は本仕様書の生成段階では行わない。

## 実行タスク

- [ ] 前提（Phase 11 evidence / Phase 12 出力 / ユーザー明示承認）を確認
- [ ] G1〜G4 multi-stage approval gate を 1 段階ずつ user 承認で進行
- [ ] PR 作成手順（既定 base = `dev`）を順序通り実行
- [ ] PR 本文に `outputs/phase-12/implementation-guide.md` の主要見出しを反映
- [ ] `outputs/phase-11/screenshots/` 配下の画像 5 枚を PR 本文の Screenshot セクションに参照
- [ ] runtime evidence が必要な項目は user-gated として false-green にしない

## 参照資料

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md`
- `docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/`
- `docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-12/implementation-guide.md`
- `.claude/commands/ai/diff-to-pr.md`（PR 本文 Phase 13 仕様）
- `CLAUDE.md`（PR 作成の完全自律フロー / 既定 base = dev）
- `.claude/skills/task-specification-creator/references/quality-gates.md`

## 成果物

- `outputs/phase-13/main.md`（PR URL / 採用ブランチ / 自動修復 / 解消したコンフリクト / 残課題を 1 回だけ記録）

## 前提

- Phase 11 evidence 一式（screenshots 5 枚 + runtime log 5 種 + grep-gate / stable-key-audit / d1-isolation / axe-report）が canonical path に揃っている。runtime 未取得時は `IMPLEMENTED_LOCAL_RUNTIME_PENDING` を本 Phase でも維持する
- Phase 12 の strict 7 必須出力ファイルが揃っている
- **ユーザーから明示の PR 作成許可を得ている**（task-specification-creator skill 重要ルール）。許可なき commit / push / PR 作成は禁止

## G1-G4 multi-stage approval gate（VISUAL_ON_EXECUTION 規約準拠）

| gate | 内容 | 承認必要 |
| --- | --- | --- |
| G1 | runtime deploy（staging）— `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` | yes |
| G2 | Forms / D1 系の同期（本 task では該当なし、no-op で記録） | no-op |
| G3 | smoke 実行（4 画面 + 404 page）+ axe critical=0 + grep gate 0 件 + stable-key audit 検証 | yes |
| G4 | commit + push + PR 作成（`gh pr create --base dev`） | yes |

合算承認禁止。各 gate 個別に user 承認を得る。

## PR 作成手順（既定 base = `dev`）

```bash
# 1. dev 同期
git fetch origin dev
git switch dev
git pull --ff-only origin dev

# 2. 作業ブランチへ戻り dev をマージ（コンフリクトは CLAUDE.md §コンフリクト解消の既定方針に従う）
git switch <feature-branch>
git merge dev

# 3. 品質検証（CLAUDE.md PR 作成フローの 3 コマンド + 本 task 固有）
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# 本 task 固有 evidence は Phase 11 で取得済み（再実行は user 承認の上で実施）

# 4. 未コミット変更を空に
git status --porcelain   # 空であること
git add -A
git commit -m "..."      # 必要時のみ。Phase 11 / 12 で確定した差分が含まれること

# 5. PR 差分確認（Phase 10 §Diff scope 規律と一致するか）
git diff dev...HEAD --name-only

# 6. PR 作成（base=dev 既定。production リリース時のみ --base main）
gh pr create --base dev --title "<title>" --body "$(cat <<'EOF'
... PR body ...
EOF
)"
```

## PR title 案

```
feat(web): public member detail / register / privacy / terms 4 画面再構成 (task-12)
```

70 文字以内。短すぎる場合は `feat(web): task-12 公開 4 画面（member detail / register / privacy / terms）再構成` を採用。

## PR body テンプレ

`outputs/phase-12/implementation-guide.md` の Part 2 主要見出しを Summary に反映する。スクリーンショットは `outputs/phase-11/screenshots/` に画像があるときのみ Screenshot セクションを作る（無ければセクション自体を作らない）。

```markdown
## Summary
- `/(public)/members/[id]` を ProfileHero + MemberDetailSections（KVList）+ MemberTags + MemberLinks + MemberActivity で再構成
- `/(public)/register` を RegisterCallout（responderUrl 外部 link CTA）+ FormPreviewSections で再構成、preview 取得失敗時は `FALLBACK_RESPONDER_URL` で fallback
- `/privacy` / `/terms` を `LegalProse` primitive（`<article className="prose">`）で typography 統一
- 不変条件遵守: 全 KV row に `data-stable-key` 焼き / consent キーは `publicConsent` `rulesConsent` のみ / `apps/web` から D1 直接アクセスなし / OKLch tokens 経由のみ（HEX 直書き 0 件）

## Test plan
- [ ] `pnpm typecheck` / `pnpm lint`
- [ ] `pnpm --filter @ubm-hyogo/web test -- src/components/public src/components/legal`
- [ ] `pnpm --filter @ubm-hyogo/web build`
- [ ] `pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-detail-register-legal.spec.ts`（4 画面 + 404 page / axe critical=0）
- [ ] grep gate（HEX 直書き 0 件）/ stable-key audit / D1 isolation 監査

## Evidence
- `docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/evidence/`
- `docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-11/screenshots/`

## Screenshots
※ `outputs/phase-11/screenshots/` に画像が存在する場合のみ列挙
- member-detail: `outputs/phase-11/screenshots/member-detail.png`
- register: `outputs/phase-11/screenshots/register.png`
- privacy: `outputs/phase-11/screenshots/privacy.png`
- terms: `outputs/phase-11/screenshots/terms.png`
- not-found: `outputs/phase-11/screenshots/not-found.png`

## Refs
- 一次原典: docs/30-workflows/ui-prototype-alignment-mvp-recovery/05-screens-public/task-12-w5-par-member-detail-register-legal.md
- 仕様書: docs/30-workflows/task-12-member-detail-register-legal/
- 実装ガイド: docs/30-workflows/task-12-member-detail-register-legal/outputs/phase-12/implementation-guide.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## PR 作成前チェック（CLAUDE.md PR 作成フロー §PR 作成前チェック 準拠）

- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` が Phase 10 §Diff scope 規律 と一致
- [ ] `outputs/phase-12/implementation-guide.md` の主要見出しが PR 本文に反映
- [ ] `outputs/phase-11/screenshots/` 配下の画像数（5 枚 = member-detail / register / privacy / terms / not-found）と PR 本文の参照が整合
- [ ] スクリーンショットがない場合、PR 本文に Screenshot 専用セクションを残さない
- [ ] base ブランチが `dev`（production リリース時のみ `main`）
- [ ] ユーザーから G4（PR 作成）の明示承認を得ている

## completed-tasks 移動

PR merge 後（次サイクル）、本 spec dir を `docs/30-workflows/completed-tasks/task-12-member-detail-register-legal/` に `git mv` で移動する。`git rm -r` 純削除は禁止（completed-tasks-policy）。

## 最終レポート（`outputs/phase-13/main.md` 1 回限定）

PR 作成完了後、以下を 1 回だけ報告する:

- PR URL
- 採用ブランチ（`<feature-branch>` → `dev`）
- 実行した自動修復（lint --fix / 型修正 / 依存解決等）
- 解消したコンフリクト（ファイル単位）
- 残課題（Task 12-4 で起票候補とした未タスクのうち、本 PR で扱わなかったもの）

## 完了条件

- [ ] PR URL が `outputs/phase-13/main.md` に記載
- [ ] 採用ブランチ / 自動修復内容 / 解消したコンフリクト / 残課題が最終レポートに 1 回だけ記載
- [ ] ユーザー承認なく commit / push / PR 作成を行っていない（task-specification-creator skill 重要ルール）
- [ ] base ブランチが `dev`（production リリース時のみ `main`）
- [ ] runtime evidence が user-gated 規律で false-green を作っていない
