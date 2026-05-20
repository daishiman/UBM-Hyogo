# Phase 13: PR 作成

## メタ情報

- phase: 13 / pr
- prev: phase-12-documentation
- next: なし（本ワークフローの最終 phase）
- 実装区分: 実装仕様書
- status: blocked
- user_approval_required: true（commit / push / PR 作成すべて）

## 目的

本ワークフローの全成果物を `dev` ブランチへ向けた PR にまとめる。**ユーザー明示承認後にのみ commit / push / `gh pr create` を実行する。**

## 実行タスク

1. user approval marker を取得してから pre-flight command を実行する
2. commit / push / PR 作成を user approval scope と一致させる
3. PR body に runtime pending / Gate B / Gate B' 境界を明記する

## PR 構成方針

### 単一 PR 構成（推奨）

本タスクは 1Password vault の構造整理 + docs / `.env.example` / `scripts/verify-onepassword-op-uri-canonical.sh` の文字列変更が中心で、Cloudflare 上のランタイム動作変更は伴わない。`bash scripts/cf.sh whoami` の canonical path 検証と 1Password archive は Phase 11 の user gate 後に実行するため、現時点の PR 本文は pending 事実だけを記録する。

- title: `feat(issue-765): 1password vault op:// path consolidation for OIDC cutover`
- base: `dev`（CLAUDE.md 既定）
- 変更ファイル想定:
  - `.env.example`（deploy token canonical 2 path に統一）
  - `apps/web/.dev.vars.example` / `scripts/cf.sh`（Cloudflare deploy token op:// direct reference なしの baseline 確認のみ）
  - `scripts/verify-onepassword-op-uri-canonical.sh`（新規 grep gate）
  - `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`（inventory + changelog 更新）
  - `docs/30-workflows/unassigned-task/issue-717-followup-003-1password-restructure.md`（status 更新）
  - `docs/30-workflows/issue-765-1p-vault-restructure-oidc-cutover/**`（Phase 1-13 spec + outputs）

## PR 本文構造（`outputs/phase-13/pr-body.md` テンプレ）

```markdown
## 概要

Issue #765 [issue-717-followup-003] に基づき、1Password vault `UBM-Hyogo/Cloudflare` の API token 参照を canonical 2 path（`api_token_staging` / `api_token_production`）へ統合する仕様と実装差分を準備する。1Password archive / `cf.sh whoami` runtime evidence / commit / push / PR は user approval 後にのみ実行する。物理 delete は別 sub-gate。

## 変更ファイル一覧

| 種別 | ファイル |
|------|--------|
| .env | `.env.example`（編集）, `apps/web/.dev.vars.example`（baseline 確認のみ） |
| scripts | `scripts/verify-onepassword-op-uri-canonical.sh`（新規）, `scripts/cf.sh`（baseline 確認のみ） |
| docs (spec) | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` |
| docs (workflow) | `docs/30-workflows/issue-765-1p-vault-restructure-oidc-cutover/**` |
| docs (status) | `docs/30-workflows/unassigned-task/issue-717-followup-003-1password-restructure.md` |

## user-gated mutation evidence 参照

- 1Password item status: `outputs/phase-11/onepassword-item-status-{before,after}.md`（pending until user approval）
- canonical path health check: `outputs/phase-11/cf-whoami-after.log`（pending until user approval）
- grep gate green: `outputs/phase-11/grep-gate-after.log`（pending until implementation）
- evidence ledger: `outputs/phase-11/evidence-ledger.md`
- operator approval record: `outputs/phase-11/operator-approval-record.md`（pending until user approval）

## DoD checklist

- [ ] canonical 2 path に統一（`.env.example` / docs。`.dev.vars.example` / `scripts/cf.sh` は direct deploy-token op:// 参照なしを確認）
- [ ] legacy 6 path に deprecated marker
- [ ] `verify-onepassword-op-uri-canonical.sh` grep gate 追加 + green
- [ ] `bash scripts/cf.sh whoami` canonical 経由 exit 0（user-gated）
- [ ] 1Password legacy 6 item archived（user-gated）
- [ ] redaction check exit 0
- [x] 中学生レベル概念説明セクション記載（Phase 12）
- [ ] 物理 delete は Gate B'（別 sub-gate）で実施

## rollback 手順

1. 軽度（spec / script のみ revert したい）: 本 PR を revert PR で打ち消し、legacy path 参照へ戻す
2. 中度（archive 直後）: 1Password dashboard で archived item を unarchive
3. 重度（物理 delete 後・Gate B' 以後）: 新規 token rotation + canonical item へ再投入

## 関連

- Issue #765（本タスク）
- Issue #717（親）/ #762 / #763 / #718（前提・closed 済）
```

## 実行手順（ユーザー明示承認後のみ）

### Step 13.1: pre-flight 検証

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh
bash scripts/verify-onepassword-op-uri-canonical.sh
```

すべて exit 0 を確認。

### Step 13.2: ブランチ作成と commit

```bash
git fetch origin dev
git checkout -b feat/issue-765-1password-vault-restructure
git add .env.example apps/web/.dev.vars.example \
        scripts/cf.sh scripts/verify-onepassword-op-uri-canonical.sh \
        .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md \
        docs/30-workflows/issue-765-1p-vault-restructure-oidc-cutover/ \
        docs/30-workflows/unassigned-task/issue-717-followup-003-1password-restructure.md
git commit -m "feat(issue-765): 1password vault op:// path consolidation for OIDC cutover"
```

### Step 13.3: push + PR 作成

```bash
git push -u origin feat/issue-765-1password-vault-restructure
gh pr create --base dev \
  --title "feat(issue-765): 1password vault op:// path consolidation for OIDC cutover" \
  --body-file docs/30-workflows/issue-765-1p-vault-restructure-oidc-cutover/outputs/phase-13/pr-body.md
```

### Step 13.4: user approval marker 保存

`outputs/phase-13/user-approval-issue-765-<timestamp>.md` に以下を記録:

- 承認 timestamp
- 承認者識別
- 承認対象 mutation（commit / push / PR 作成 / 1Password archive 実施可否）
- approval 取得経路（対話履歴 ID 等）

token 値・URI 値・vault item secret reference 中身は記録しない。

### Step 13.5: completed-tasks 移動（PR マージ後）

```bash
git mv docs/30-workflows/issue-765-1p-vault-restructure-oidc-cutover \
       docs/30-workflows/completed-tasks/issue-765-1p-vault-restructure-oidc-cutover
```

別 PR で commit、または本 PR のマージ後に別の小さな follow-up PR で実施する。

## Gate 構造（再掲）

| Gate | Scope | 承認 |
|------|------|------|
| Gate A | spec / artifacts / Phase 12 strict 7 close-out 整合 | docs merge approval |
| Gate B | Phase 11 manual mutation（1Password archive + canonical verify + grep gate） | user 明示承認（marker: `outputs/phase-13/user-approval-issue-765-<timestamp>.md`） |
| Gate B' | legacy 6 item の物理 delete（deprecation window 経過後） | 別 sub-gate user 明示承認 |
| Gate C | commit / push / PR 作成 | user 明示承認（Gate B とは別に記録） |

## 参照資料

- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-13/pr-body.md`
- `scripts/verify-pr-ready.sh`

## 成果物

- `outputs/phase-13/pr-body.md`
- `outputs/phase-13/user-approval-issue-765-<timestamp>.md`

## 完了条件

- [ ] PR が `dev` 向けに作成され、CI gate 全 green
- [ ] PR 本文が `outputs/phase-12/implementation-guide.md` の主要見出しを反映
- [ ] user approval marker が保存されている
- [ ] PR マージ後、`completed-tasks/` 移動が完了
- [ ] Issue #765 が close（GitHub UI）

## タスク100%実行確認【必須】

- [ ] 成果物 2 ファイル作成
- [ ] PR base が `dev` であることを確認（`main` への直接 PR は禁止）
- [ ] commit / push / PR / 1Password archive すべてが user 明示承認後に実行されたことを marker で証跡化

## 備考

- 本 Phase の commit / push / PR 作成および 1Password vault mutation はユーザー明示承認後にのみ実行する（CONST_002）
- PR 本文は `outputs/phase-12/implementation-guide.md` を基に `outputs/phase-13/pr-body.md` を生成し、`gh pr create --body-file` で投入する
- 物理 delete（Gate B'）は本ワークフローのスコープ外。deprecation window 経過後に別 sub-gate workflow として起票する
