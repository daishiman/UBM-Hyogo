# Lessons Learned — Issue #762 CF OIDC Staging Proof / Production Cutover Pre-support Hardening（2026-05-17）

> task: `issue-762-cf-oidc-staging-proof-prod-cutover-spec`
> 関連 spec: `docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/phase-{1..13}.md`、`docs/30-workflows/issue-762-cf-oidc-staging-proof-prod-cutover/outputs/phase-{11,12,13}/`
> 関連 source: `scripts/oidc/verify-claim-pin.sh`、`scripts/oidc/__tests__/verify-claim-pin.spec.sh`、`scripts/redaction-check.sh`、`scripts/__tests__/redaction-check.test.sh`、`.github/workflows/oidc-observation-window.yml`、`.github/workflows/web-cd.yml`、`docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md`
> 関連 reference: `references/deployment-secrets-management.md`、`references/workflow-issue-762-cf-oidc-staging-proof-prod-cutover-artifact-inventory.md`、`references/task-workflow-active.md`、`indexes/quick-reference.md`、`indexes/resource-map.md`、`SKILL-changelog.md`

## 教訓一覧

### L-I762-001: Cloudflare 公式 OIDC deploy support 未確認下では `id-token: write` を投入しない

- **背景**: Cloudflare Workers の GitHub Actions deploy 公式手順は `CLOUDFLARE_API_TOKEN` を current supported path として明示しており（Issue #717 で primary source 再検証済み）、`cloudflare/wrangler-action` も OIDC exchange step を提供していない。先行して `web-cd.yml` に `id-token: write` と仮想 OIDC exchange step を入れると、support 入った瞬間の `aud` / token endpoint と衝突して二重切替が必要になる。
- **教訓**: OIDC 切替系の workflow は G1（official support 文書化）/ G2（staging proof）/ G3（production cutover）/ G4（fallback count = 0）の4段ゲートを `deployment-secrets-management.md` に固定し、G1 未到達のサイクルでは **pre-support hardening のみ**（claim-pin contract、redaction-check 拡張、observation window placeholder、current safe baseline comment）に限定する。`id-token: write` permission も exchange step も入れない。
- **将来アクション**: 新規 OIDC 関連 workflow を起票するときは index.md 冒頭に「G1-G4 gate 表」を必ず置き、現在到達ゲートを明記する。`grep -n "id-token" .github/workflows/web-cd.yml` が 0 件であることを Phase 11 evidence に固定する。

### L-I762-002: Phase 12 custom domain outputs は strict 7 canonical names を置換しない

- **背景**: 本 workflow では `secrets-boundary-current.md` / `future-oidc-supported-path.md` / `claim-pin-verifier-spec.md` / `redaction-pattern-update.md` / `observation-window-runbook.md` の domain-specific outputs が必要だったが、これらに引きずられて canonical strict 7（`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`）が欠落する drift が起きやすい。
- **教訓**: Phase 12 outputs は **strict 7 = 必須骨格 / domain outputs = 補助 supplemental** の二層として扱い、`phase12-task-spec-compliance-check.md` で「Canonical Phase 12 strict 7 present」を独立 check 行に明示する。`verify-phase12-compliance` CI gate もこの strict 7 を最低条件として固定する。
- **将来アクション**: task-specification-creator 側の Phase 12 テンプレート確認時、domain outputs を追加するときは strict 7 と同一 directory に並列配置し、strict 7 のいずれも削除/rename しない契約を `task-specification-creator/SKILL.md` Phase 12 行で再確認する。

### L-I762-003: `implementation_status` は実ファイル着地後に `spec_created_pending_implementation` から昇格させる

- **背景**: 初期 Phase 12 outputs では `artifacts.json.metadata.implementation_status=spec_created_pending_implementation` のまま残ったが、`scripts/oidc/verify-claim-pin.sh`、redaction-check 拡張、`oidc-observation-window.yml`、web-cd.yml の current safe baseline comment、`deployment-secrets-management.md` 同期がすべて実ファイルとして着地している段階では `implemented_local_evidence_captured` に昇格しないと artifacts.json と実 diff が乖離する。
- **教訓**: implementation workflow では Phase 6/7/11 evidence が揃った直後に **root と outputs 両方の `artifacts.json.metadata.implementation_status`** を `implemented_local_evidence_captured` 系へ昇格させ、Phase 12 close-out 前に必ず diff parity を再確認する。spec-only workflow（`verified_current_no_code_change_pending_pr` 等）と implementation workflow の verdict 語彙を取り違えない。
- **将来アクション**: artifacts.json の `implementation_status` 値は `references/task-workflow-active.md` の state vocabulary 表に enum として固定し、CI gate（`verify-artifacts-parity` 相当）で root/output parity と enum 一致を grep gate する。

### L-I762-004: source unassigned task は `partially_consumed` を `consumed` と分けて status 表現する

- **背景**: `issue-717-followup-001-production-oidc-cutover.md` は OIDC full migration を内包する unassigned task だが、本サイクルでは pre-support hardening 部分のみを Issue #762 が消化し、real runtime cutover（`id-token: write` / supported exchange / staging proof / production cutover）は G1 未到達で blocked のまま残る。これを `consumed` にすると未消化の cutover scope が見えなくなる。
- **教訓**: 部分消化の unassigned task は `status: partially_consumed` を採用し、`canonical_workflow:` pointer に消化先を明示しつつ「consumed items」「remaining blocked items」を箇条書きで分離する。`consumed`（全消化）と `blocked`（未着手）の二択では partial 消化が表現できないので、3-state を SSOT 化する。
- **将来アクション**: `unassigned-task/*.md` の status 語彙は `pending / blocked / partially_consumed / consumed / superseded` の 5 値を canonical とし、`docs/30-workflows/unassigned-task/README.md` 相当の運用 doc または task-specification-creator skill 側で明示する。

### L-I762-005: redaction-check の JWT-like regex は integrity hash の false positive を回避する fixture を必ず固定する

- **背景**: `scripts/redaction-check.sh` に `eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+` JWT 形式の token regex を追加したところ、SHA256 integrity hash や Base64 ペイロードを含む既存ログが false positive を起こす可能性があった。`cloudflare-aud` literal check も deployment-secrets-management.md 内の参照説明文と衝突しうる。
- **教訓**: redaction-check の新規パターン追加時は、**(a) 期待 PASS ケース（実 JWT-like token）/ (b) 期待 PASS ケース（`cloudflare-aud` 出現）/ (c) 期待 FAIL（integrity hash / Base64 説明文）** の 3 系列を必ず `scripts/__tests__/redaction-check.test.sh` に固定し、誤検知での false alarm を構造的に防ぐ。
- **将来アクション**: 今後 redaction-check に regex を追加する PR は false-positive 回避 fixture の追加を必須条件にし、Phase 11 evidence にも `redaction-check-extension.log` を tracked `.txt` として残す（本サイクル踏襲）。

## 同期した正本

- `references/deployment-secrets-management.md`: Issue #762 G1-G4 gate 表、pre-support hardening 範囲、`id-token: write` 投入禁止条件を追加。
- `references/workflow-issue-762-cf-oidc-staging-proof-prod-cutover-artifact-inventory.md`: implementation targets / user-gated 操作 / canonical workflow pointer。
- `references/task-workflow-active.md`: Issue #762 行を追加し pre-support hardening の implementation_status と G1-G4 ゲートを併記。
- `indexes/quick-reference.md` / `indexes/resource-map.md` / `indexes/topic-map.md` / `indexes/keywords.json`: Issue #762 行と cross-link。
- `docs/30-workflows/unassigned-task/issue-717-followup-001-production-oidc-cutover.md`: `status: partially_consumed`、`canonical_workflow:` Issue #762 pointer、consumed/remaining 箇条書き分離。
- `SKILL-changelog.md`: `v2026.05.17-issue762-cf-oidc-pre-support-hardening` を最新版に追加。

## 後続候補（未着手・依存順）

1. G1: Cloudflare Workers GitHub Actions OIDC official support 文書化の primary source 検出。
2. G2: real OIDC cutover を `web-cd.yml` staging path に投入し staging proof 実行。
3. G3: production cutover。
4. G4: `oidc-observation-window.yml` no-op を real fallback-count verifier に置換し、fallback count = 0 を確認後 legacy `CLOUDFLARE_API_TOKEN` 物理失効。
