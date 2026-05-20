# Phase 13: PR 作成

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Parent spec: docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md
> Related workflow: docs/30-workflows/issue-717-oidc-cf-full-migration/
> implementation_mode: `conditional_implementation_with_peripheral_hardening`
> 実装区分: **条件付き実装仕様書** (CONST_005 / CONST_007)
> status: **blocked_user_approval**（PR 作成はユーザー明示承認後のみ実行）

---

## 1. 前提

- Phase 1-12 完了（本仕様書群 + `outputs/phase-{11,12}/` 実体化済み）。
- `.github/workflows/web-cd.yml` の deploy 挙動が不変（コメント追加のみ）。
- `scripts/oidc/verify-claim-pin.sh` 新規 / `scripts/redaction-check.sh` 拡張 / `.github/workflows/oidc-observation-window.yml` 新規 / `deployment-secrets-management.md` 編集 がコミット済み。
- `actionlint` / `pnpm typecheck` / `pnpm lint` / 追加 shell test 全 PASS。
- Cloudflare 公式 OIDC deploy support 状態が 2026-05-17 時点で再検証済み（`outputs/phase-11/cloudflare-oidc-support-revalidation-2026-05-17.md`）。
- **ユーザーから明示的な PR 作成許可が出ていること**。

## 2. ブランチ / base

| 項目 | 値 |
|---|---|
| base | `dev` |
| head | `feat/issue-762-cf-oidc-staging-proof-prod-cutover-spec` |
| merge 方針 | squash / rebase いずれもユーザー判断（既定 PR フローに従う） |

## 3. PR タイトル案

```text
feat(issue-762): CF OIDC staging proof readiness + peripheral hardening (conditional, no actual cutover)
```

## 4. PR 本文テンプレート

```markdown
## Summary

- Issue #717 で formalize された Cloudflare GitHub Actions OIDC 完全移行のうち、**今サイクルで安全に実装可能な周辺強化 5 件** を 1 PR で完了する条件付き実装。
- Cloudflare 公式 OIDC deploy support / `cloudflare/wrangler-action#402` が 2026-05-17 時点で依然 unsupported / OPEN のため、`.github/workflows/web-cd.yml` 本体の `id-token: write` 切替・OIDC exchange step 追加・実 staging proof / 実 production cutover・legacy long-lived token 物理失効は **後続サイクル送り**（CONST_007 例外として正当化）。
- 後続実切替時のリードタイムを最小化するため、subject claim pin dry-run helper / OIDC token redaction / observation window 雛形 / 正本 reference 同期 / `web-cd.yml` 根拠コメントを先行整備。

Refs #762, #717, #640

## 変更ファイル一覧

| パス | 種別 | 概要 |
|---|---|---|
| `scripts/oidc/verify-claim-pin.sh` | 新規 | subject claim 4 軸（repository / ref / environment / event_name）の dry-run 検証 helper |
| `scripts/oidc/__tests__/verify-claim-pin.spec.sh` | 新規 | 上記 helper の 9 ケーステスト |
| `scripts/redaction-check.sh` | 編集 | JWT パターン + `cloudflare-aud` claim 検出を追加（既存 exit semantics 不変） |
| `.github/workflows/oidc-observation-window.yml` | 新規 | manual dispatch only / no-op verifier 雛形 |
| `.github/workflows/web-cd.yml` | 編集 | step-scoped `secrets.CLOUDFLARE_API_TOKEN` が current safe baseline である根拠コメント追加（deploy 挙動不変） |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | future supported path gate G1-G4 + current safe baseline セクション追記 |
| `docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/**` | 新規 | Phase 1-13 仕様書 + artifacts.json + outputs/phase-{11,12,13}/ |
| `docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md` | 編集 | 本サイクルで周辺強化を実装した旨を追記 |

## Test plan

- [ ] `bash scripts/oidc/__tests__/verify-claim-pin.spec.sh` 全 9 ケース PASS
- [ ] `printf 'auth: Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ4In0.signature_part\n' | bash scripts/redaction-check.sh` → 非ゼロ exit + `::error::JWT-like token detected in log`
- [ ] `printf 'claim: cloudflare-aud=foo\n' | bash scripts/redaction-check.sh` → 非ゼロ exit + `::error::cloudflare-aud claim detected in log`
- [ ] `printf 'integrity sha512-abc...\n' | bash scripts/redaction-check.sh` → exit 0（false positive 回避確認）
- [ ] `actionlint .github/workflows/oidc-observation-window.yml .github/workflows/web-cd.yml` → exit 0
- [ ] `grep -c "NOTE(issue-762)" .github/workflows/web-cd.yml` → `2`
- [ ] `git diff origin/dev -- .github/workflows/web-cd.yml` の差分がコメント行のみ
- [ ] `grep -E 'id-token' .github/workflows/web-cd.yml .github/workflows/oidc-observation-window.yml` → match なし
- [ ] `cmp -s docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/artifacts.json docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/outputs/artifacts.json`（parity mirror を作成する場合）
- [ ] `pnpm typecheck` / `pnpm lint` PASS
- [ ] `pnpm indexes:rebuild` 実行済（`verify-indexes-up-to-date` gate 担保）

## CONST_007 例外明示（本 PR で実施しないこと）

- `.github/workflows/web-cd.yml` への `permissions: id-token: write` 付与（公式 support 未確認 → speculative 実装回避）
- OIDC exchange step 追加 / `wrangler-action` の OIDC 切替
- 実 staging OIDC proof run（公式 support 前提）
- 実 production OIDC cutover（staging proof + observation 完了待ち）
- legacy `CLOUDFLARE_API_TOKEN` 物理失効（`docs/30-workflows/issue-718-legacy-cf-token-revocation` 所有、observation 完了待ち）
- 1Password 構造変更（`issue-717-followup-003` 所有）
- `apps/api` D1 token cutover（`issue-717-followup-002` 所有）

## 後続タスク（unassigned-task-detection.md より）

| ID | 実施先 | enable 条件 |
|---|---|---|
| 1 実 OIDC 切替 | issue-717-followup-001 後続 | G1 完了後 |
| 2 staging proof | issue-717-followup-001 後続 | 1 完了後 |
| 3 production cutover | issue-717-followup-001 後続 | 2 完了 + observation 通過 |
| 4 legacy token 物理失効 | `docs/30-workflows/issue-718-legacy-cf-token-revocation` | observation 完了 |
| 5 `apps/api` D1 token cutover | `issue-717-followup-002` | 並行可 |
| 6 1Password 構造変更 | `issue-717-followup-003` | 4 完了 |

## Risk

- Cloudflare 側 support が本 PR merge 後に変化した場合、後続実切替着手前に `outputs/phase-11/cloudflare-oidc-support-revalidation-*.md` を再生成すること。
- `verify-claim-pin.sh` の `EXPECTED_REPOSITORY` 固定値は repo 移管時に破綻するため、reference doc / script / `claim-pin-verifier-spec.md` を同時更新する運用を維持する。

## Not included

- runtime OIDC token / JWT 実値 / Cloudflare Account ID / Secret 値の出力・コミット
- Cloudflare trust policy mutation
- GitHub Secret / 1Password mutation
- production deploy
```

## 5. 自動実行禁止事項

- `git push` および `gh pr create` は **ユーザーが明示承認した時のみ** 実行。
- Cloudflare trust policy / GitHub Secret / 1Password の mutation は本 PR で一切実行しない。
- `permissions: id-token: write` 付与・OIDC exchange step 追加は本 PR では実施しない（後続サイクル）。

## 6. ユーザー承認後の実行手順

```bash
# (1) 事前状態確認
git status --porcelain
git log --oneline origin/dev..HEAD

# (2) 品質ゲート（PR 作成フロー §5 準拠）
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
actionlint .github/workflows/oidc-observation-window.yml .github/workflows/web-cd.yml
bash scripts/oidc/__tests__/verify-claim-pin.spec.sh

# (3) push & PR 作成（base=dev 既定）
git push -u origin feat/issue-762-cf-oidc-staging-proof-prod-cutover-spec
gh pr create --base dev --title "feat(issue-762): CF OIDC staging proof readiness + peripheral hardening (conditional, no actual cutover)" --body "$(cat outputs/phase-13/pr-body-draft.md)"
```

## 7. DoD

- [ ] ユーザー明示承認取得
- [ ] PR タイトルが §3 のテンプレートに従っている
- [ ] PR 本文に Summary / 変更ファイル一覧 / Test plan / CONST_007 例外明示 / 後続タスク / Risk / Not included が含まれる
- [ ] base=`dev` で作成されている
- [ ] PR URL を最終レポートに記載
- [ ] OIDC token / JWT 実値 / Account ID / Secret 値が PR diff・コミット message に含まれない
