# Phase 9: QA

## メタ情報

- phase: 9 / qa
- prev: phase-8-refactor
- next: phase-10-final-review
- 実装区分: 実装仕様書
- user_approval_required: true（mutation 実施前 gate）

## 目的

Phase 5-8 で完成した `.env.example` の op:// path canonical 化差分、`apps/web/.dev.vars.example` / `scripts/cf.sh` の baseline 確認、`deployment-secrets-management.md` inventory 更新差分、および `verify-onepassword-op-uri-canonical.sh` grep gate の振る舞いを統合的に検証し、Phase 10 GO 判定および Phase 11 user-gated mutation に進める品質に達していることを確認する。

## 実行タスク

1. grep gate / redaction / lint / typecheck の QA checklist を確認する
2. user-gated runtime smoke と mutation evidence の pending 境界を確認する
3. rollback 手順と Gate B / Gate B' 分離を点検する

## QA チェックリスト

### CI gate（自動）

| gate | 実行 | 期待 |
|------|------|------|
| `pnpm typecheck` | `mise exec -- pnpm typecheck` | exit 0 |
| `pnpm lint` | `mise exec -- pnpm lint` | exit 0 |
| `verify-onepassword-op-uri-canonical.sh` | `bash scripts/verify-onepassword-op-uri-canonical.sh` | exit 0（canonical path のみ検出） |
| `verify:phase12-compliance` | `mise exec -- pnpm verify:phase12-compliance` | exit 0 |
| `gate-metadata:validate` | `mise exec -- pnpm gate-metadata:validate` | exit 0 |
| `indexes:rebuild` drift | `mise exec -- pnpm indexes:rebuild && git diff --quiet` | exit 0 |
| `redaction-check`（docs 配下） | `bash scripts/redaction-check.sh docs/30-workflows/issue-765-1p-vault-restructure-oidc-cutover/` | exit 0（token 値・URI 値 0 件） |

### 文書差分の静的検査

| gate | 確認内容 |
|------|---------|
| op:// path 列挙 | `.env.example` / `deployment-secrets-management.md` の deploy token op:// path が canonical 2 種（`op://UBM-Hyogo/Cloudflare/api_token_staging` / `api_token_production`）に統一され、WAF / audit / historical references と混同されていない |
| legacy path marker | `deployment-secrets-management.md` inventory 表で legacy 6 path に `deprecated` marker と廃止予定 deprecation window 明記 |
| changelog 追記 | `deployment-secrets-management.md` changelog 節に Issue #765 エントリが追記 |
| 値の非記録 | 文書内に token 値・URI 値・vault item secret reference の中身が含まれていないこと（path 識別子のみ） |

### Pre-mutation 前提確認

| gate | 確認内容 |
|------|---------|
| 親タスク closed | Issue #762 / #763 / #718 が GitHub UI 上で `closed` 状態 |
| token rotation 完了 | Issue #718 Phase 11 revocation evidence 取得済み（legacy token は revoked、新 token のみ active） |
| operator approval | 1Password vault item の archive / delete 実施について operator 承認取得済み |

### Post-merge 検証

本タスクは docs / script 文字列変更のみで Cloudflare 上の動作変更を伴わないため、**post-merge deploy evidence は N/A**。代わりに Phase 11 で `bash scripts/cf.sh whoami` が canonical path 経由で exit 0 になることを確認する。

## 異常時の rollback

- mutation 前（Phase 11 実施前）: spec / script の rename PR を revert すれば legacy path 参照に戻せる
- mutation 後 archive 段階: 1Password 上で archived item を unarchive することで即時 rollback 可能
- mutation 後 物理 delete 段階（別 sub-gate）: rollback には新規 token rotation が必要

## 参照資料

- `phase-5-implementation.md`
- `phase-6-test-additions.md`
- `phase-8-refactor.md`

## 統合テスト連携

- QA は `bash scripts/verify-onepassword-op-uri-canonical.sh` と `bash scripts/cf.sh whoami` の境界を確認する
- `cf.sh whoami` は user-gated のため、未実行を failure ではなく runtime pending として記録する

## 成果物

- `outputs/phase-9/qa-checklist.md`
- `outputs/phase-9/ci-gate-results.md`

## 完了条件

- [ ] CI gate 全 green
- [ ] 文書差分の静的検査全 pass
- [ ] Pre-mutation 前提確認すべて green
- [ ] mutation 実施の operator approval 取得準備完了

## タスク100%実行確認【必須】

- [ ] 成果物 2 ファイル作成
- [ ] evidence に token 値・URI 値が混入していない（path 識別子のみ）

## 次Phase

phase-10-final-review.md
