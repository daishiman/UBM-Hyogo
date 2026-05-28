# Phase 13: PR 作成・ドキュメント更新仕様

**[実装区分: 実装仕様書]**

実装完了後の PR 作成手順を固定する。CLAUDE.md「PR 作成の完全自律フロー」と整合。**commit / push / PR 作成 / staging deploy / visual baseline regenerate はすべて user-gated**。

## 1. 前提

- base ブランチ: **`dev`** (CLAUDE.md 既定)
- 作業ブランチ: `feat/admin-identity-conflicts-prototype-alignment`
- 全 Phase 4-11 の DoD クリア
- Phase 11 evidence (local validation summary + screenshot 8 枚 + grep log) tracked-commit 済
- (B) staging 404 修復の真因が H1〜H5 のいずれかに確定済 (Phase 4 §B 表へ実測ログ追記済)

## 2. PR 作成前検証 (CLAUDE.md PR 自律フロー §実行順序)

```bash
git fetch origin dev
git checkout dev
git merge --ff-only origin/dev || git pull --ff-only origin dev
git checkout feat/admin-identity-conflicts-prototype-alignment
git merge dev   # コンフリクト発生時は dev 側採用 + 必要差分再適用 (CLAUDE.md 既定方針)

mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
```

全コマンド exit 0 で push 可。`verify-pr-ready.sh` が fail した場合は skill `references/pr-pre-flight-ci-gate-checklist.md` §1〜§5 に従い解消。

> **user-gated**: 上記コマンドの実行および push は user 明示承認後にのみ行う。

## 3. 正本仕様への反映

本サイクルは `docs/00-getting-started-manual/specs/` の正本更新を伴わない (`system-spec-update-summary.md` 参照、N/A 確定)。

ただし `docs/30-workflows/LOGS.md` への 1 行追加と aiworkflow-requirements 5 surface 同期は必須:

```bash
# same-wave skill sync
mise exec -- pnpm indexes:rebuild   # idempotent 確認
git diff --stat .claude/skills/aiworkflow-requirements docs/30-workflows/LOGS.md
```

## 4. PR 本文テンプレート (`.claude/commands/ai/diff-to-pr.md` 準拠)

```markdown
## Summary

- (A) `/admin/identity-conflicts` を AdminPageHeader + primitive 構造へ整合 (他 admin route と同型)
- (B) staging `ADMIN_FETCH_404` を H<X> (実測真因) 修復で解消 / `safe-server-fetch.ts` に `admin_fetch_404` Sentry warn を追加
- 既存 API endpoint surface / D1 schema / Auth.js 経路は不変 (CLAUDE.md 不変条件 #5 / #10 / #11 遵守)
- OKLch tokens 経由 (HEX 直書き 0 件) / PII redaction (responseEmail raw 0 件) / D1 直接アクセス 0 件

## 変更スコープ

- A 系: `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`, `IdentityConflictRow.tsx` (必要時), `admin-identity-conflicts.spec.ts`, visual baseline 3 枚
- B 系: H<X> 真因に対応する最小修復 (`wrangler.toml` or `safe-server-fetch.ts` or `cf.sh d1 migrations apply` evidence), `safe-server-fetch.spec.ts` 新規
- docs: `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/**` (Phase 1-13 + evidence)
- skill: aiworkflow-requirements 5 surface + indexes:rebuild

## Screenshots

`docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/outputs/phase-11/screenshots/` の 8 PNG を本文中に参照:

- `identity-conflicts-empty-desktop.png`
- `identity-conflicts-empty-mobile.png`
- `identity-conflicts-list-desktop.png`
- `identity-conflicts-list-tablet.png`
- `identity-conflicts-merge-confirm-1.png`
- `identity-conflicts-merge-confirm-2.png`
- `identity-conflicts-dismiss-modal.png`
- `identity-conflicts-error-500.png`

## Test plan

- [x] `pnpm typecheck` exit 0
- [x] `pnpm lint` exit 0
- [x] `pnpm --filter @ubm-hyogo/web test` exit 0
- [x] `pnpm --filter @ubm-hyogo/api test ...identity-conflicts.contract.spec.ts` exit 0
- [x] `pnpm --filter @ubm-hyogo/web build` exit 0
- [x] Playwright `admin-identity-conflicts.spec.ts` (local) exit 0
- [x] PII / D1 / legacy hook grep gate すべて 0 件
- [x] `safe-server-fetch.spec.ts` で 404 warn 発火確認
- [ ] visual regression baseline diff = 0 (Linux CI)
- [ ] staging curl `/admin/identity-conflicts` → 200 / 302 (404 禁止) — user-gated
- [ ] Sentry `area:admin.identity-conflicts event:admin_fetch_404` 24h で 0 件 — user-gated
- [ ] `bash scripts/verify-pr-ready.sh` exit 0

## Follow-ups

- FU-AIDC-002: merge / dismiss 監査ログの admin UI 表示
- FU-AIDC-003: staging 認証後 visual smoke
- FU-AIDC-004: merge confirm optimistic update
- FU-AIDC-005: identity-conflicts schema 拡張
- FU-AIDC-006: deploy pipeline 改善 (H1 真因時のみ)
- FU-AIDC-007: `admin_fetch_404` Sentry alert policy IaC 化

## Phase 11 evidence

`docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/outputs/phase-11/` 配下に inventory 19 件 (screenshot 8 + log 10 + local validation summary 1)。staging curl は user-gated で pending。
```

## 5. PR 作成コマンド (user-gated)

```bash
gh pr create --base dev \
  --title "feat(admin-identity-conflicts): align prototype + fix staging ADMIN_FETCH_404 (H<X>)" \
  --body "$(cat <<'EOF'
…上記テンプレート…
EOF
)"
```

## 6. PR 後の追加対応 (user-gated)

- visual baseline 3 枚を Linux CI bot で regenerate し空コミットを自分のトークンで push (feedback_visual_baseline_github_token_retrigger)
- `docs/30-workflows/LOGS.md` に本ワークフロー root の 1 行を追加 (本 PR に含める)
- merge 後、FU-AIDC-006 が該当する場合は GitHub Issue を起票

## 7. リリース後検証 (staging) — user-gated

merge → dev → staging deploy 後:

```bash
# 1. (B) 修復確認
curl -i https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/identity-conflicts
#    -> 200 (admin cookie) / 302 (cookie 無し)。404 が出れば rollback (Phase 10 §5.1)

# 2. 認証後 screenshot (FU-AIDC-003 で扱う)
#    - empty / non-empty / merge confirm 1-2 / dismiss / error

# 3. Sentry tag 検索 (24h)
#    area:admin.identity-conflicts event:admin_fetch_404 -> 0 件
```

production 反映は `dev → main` リリースサイクルで実施 (Phase 10 §2)。

## 8. DoD

- [ ] §2 PR 作成前検証コマンドすべて exit 0
- [ ] §3 skill sync + indexes:rebuild idempotent
- [ ] §4 PR 本文が全項目埋まっている (H<X> を実測真因に置換)
- [ ] §5 PR 作成は user 明示承認後
- [ ] §6 visual baseline regenerate + LOGS.md 追記が同 PR に含まれる
- [ ] §7 staging 検証 3 項目すべて user 承認済み
- [ ] PR URL が user に共有される

## 9. 参照

- CLAUDE.md「PR 作成の完全自律フロー」
- `outputs/phase-10/phase-10.md` (リリース計画 / rollback)
- `outputs/phase-11/phase-11.md` (evidence inventory)
- `outputs/phase-12/implementation-guide.md` (実装ハンドブック)
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
