---
name: lessons-learned-u-fix-cf-acct-01-deriv-01-oidc-short-lived-credentials-2026-05
description: U-FIX-CF-ACCT-01-DERIV-01 GitHub OIDC short-lived credentials migration で発生した苦戦箇所を 5 分で再現できる解決カードに固定する。OIDC trust 設計の境界、approval gate 用語の過負荷、legacy Token の 3 段ライフサイクル、24h 並行運用観測の自動化空白、indexes 同時更新ポリシーを次回 DERIV-02/03/04 に持ち越す。
type: reference
---

# lessons-learned: U-FIX-CF-ACCT-01-DERIV-01 GitHub OIDC Short-lived Credentials Migration 苦戦箇所（2026-05-06）

> 対象タスク: `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/`
> 状態: `spec-created` / DERIV-01 / migration（GHA → Cloudflare/AWS OIDC 短命 credential 化）
> 出典: `outputs/phase-12/{implementation-guide,system-spec-update-summary,skill-feedback-report,phase12-task-spec-compliance-check,unassigned-task-detection}.md`

DERIV-01 は `CLOUDFLARE_API_TOKEN` 系の長命 PAT を GitHub OIDC + AWS STS / Cloudflare scoped Token に置換する deploy auth migration である。Cloudflare 自体が per-job OIDC subject ベース短命 Token を発行できないため「短命境界をどこに引くか」「旧 Token をいつ revoke するか」「approval gate 用語の混線をどう避けるか」が DERIV-02/03/04 にも再発する論点となる。次回類似タスクで判断境界を再現するために以下 5 件を固定する。

## L-DERIV01-001: OIDC trust 設計の境界曖昧性

**苦戦箇所**: Cloudflare API は GitHub OIDC subject claim を直接信頼する仕組みを持たず、per-job 短命 Token を発行できない。AWS STS（`AssumeRoleWithWebIdentity`）は session 最大 3600s で短命化できるが、Cloudflare 側は scoped Token（`Workers Scripts:Edit` / `D1:Edit` 等の最小権限）を「長命だが短命に限りなく近づけた既知 secret」として GitHub Secrets に保管せざるを得ない。implementation-guide.md ではこの非対称を OIDC trust contract として明文化したが、runtime cutover 時に「Cloudflare Token 自体の expiry / rotation 検証」をどの workflow（`web-cd.yml` / `backend-ci.yml` / `d1-migration-verify.yml`）が担うかが分散し、責務の重複と空白が同時発生した。

**5 分解決カード**: OIDC migration を着手する際は、まず「trust の片側性」を 1 枚の表で固定する: (a) AWS resource は OIDC subject 直接信頼 / session 3600s、(b) Cloudflare resource は scoped Token を GitHub Secrets 経由で渡し rotation 90 日 + scope を最小化。`deployment-gha.md` の OIDC trust contract 章に matrix を置き、各 workflow は「短命境界がどちら側か」を `permissions: id-token: write` 有無と Token 名 prefix（`CLOUDFLARE_*_OIDC_TARGET` / `AWS_ROLE_ARN_*`）で判別可能にする。runtime cutover 直前の dry-run で `aws sts get-caller-identity` と Cloudflare `/user/tokens/verify` を同一 job で叩き、両者が contract と一致することをログ化してから cutover する。

**promoted-to**: `references/deployment-gha.md`（§OIDC trust contract / 短命境界 matrix）

## L-DERIV01-002: G1-G4 approval gate 用語の過負荷

**苦戦箇所**: 既存 `phase-template-phase11.md` では「commit/push approval」「PR merge approval」「runtime cutover authorization」「rollback authorization」が同一 `gate` 用語で混在しており、DERIV-01 の skill-feedback-report で OIDC migration 専用の 4 段 gate を新設しようとした際、phase-11 evidence template の既存 gate 名と衝突した。Phase 12 の compliance check で「どの gate が満たされれば spec-created → implemented-staging に遷移してよいか」が読者ごとに揺れる。

**5 分解決カード**: OIDC migration 系タスクでは G1-G4 を予約語化する: G1 = OIDC trust 構築完了（IAM Identity Provider 登録 + thumbprint pin + role trust policy review）、G2 = staging cutover dry-run PASS（dual-run 並列で旧 Token と新経路の両方が同一結果）、G3 = production cutover authorization（user approval 明示 + revoke schedule 確定）、G4 = legacy Token revoke 完了（`last_used_on` 0 観測 24h 経過後）。`task-specification-creator/references/phase-template-phase11.md` に OIDC matrix と 4 段 gate vocabulary を追記し、generic な "approval" gate との被りを避けるため OIDC 系は `OIDC-G1` … `OIDC-G4` で常に prefix する。phase-11 evidence の `gate` フィールドは prefix 付きで記録する。

**promoted-to**: `task-specification-creator/references/phase-template-phase11.md`（§OIDC migration gate vocabulary）

## L-DERIV01-003: CLOUDFLARE_API_TOKEN_STAGING の暫定扱い（3 段ライフサイクル）

**苦戦箇所**: `d1-migration-verify.yml` だけが旧 `CLOUDFLARE_API_TOKEN_STAGING` を継続使用する設計になっており、cutover の瞬間に「全 workflow が新 Token に切替済み」と単純化できない。current-vs-target を deployment-secrets-management.md に明示しないと、後続 DERIV-02（D1 access scope 分割）で同一 Token を再分割する際に scope 境界が衝突し、revoke 順序を誤ると D1 verify が突然 401 で落ちる。

**5 分解決カード**: legacy Token を 3 段で管理する: 段階 A = DERIV-01 cutover まで current fact（全 workflow が依存）、段階 B = cutover 後 24h は rollback-only（`d1-migration-verify.yml` 1 本のみ参照、他は新経路）、段階 C = 24h + `last_used_on` 0 観測後に revoke。`deployment-secrets-management.md` の §OIDC migration boundary に 3 段表を入れ、各段階の「依存 workflow 一覧 / revoke 可否 / 観測指標」を 1 行で書く。DERIV-02 開始前に段階 C 完了を前提条件として明示し、scope 分割と revoke を同一 wave に混ぜない。

**promoted-to**: `references/deployment-secrets-management.md`（§OIDC migration boundary / legacy Token 3 段ライフサイクル表）

## L-DERIV01-004: 24h 並行運用中の旧 Token last_used_on 観測の自動化空白

**苦戦箇所**: Phase 12 implementation-guide では「旧 Token を Cloudflare `/user/tokens/{id}` で取得し `last_used_on` が cutover 以降更新されないことを 24h 観測してから revoke」と spec-created したが、cron による継続 polling と Audit Logs API（`/accounts/{id}/audit_logs`）による access source 監視は DERIV-04 に分離した。結果として、cutover 直後の 24h は人手チェックリストで `gh workflow run` 結果と `wrangler` ログを目視確認するしかなく、観測空白の timing risk（突発的な legacy 経路 fallback の見落とし）が残存する。

**5 分解決カード**: cutover 当日に 4 時間刻みの観測チェックリスト（T+0 / T+4h / T+12h / T+20h / T+24h）を `outputs/phase-12/implementation-guide.md` の cutover runbook 章に明記し、各時点で `curl https://api.cloudflare.com/client/v4/user/tokens/{id}` の `result.last_used_on` を記録する欄を作る。DERIV-04（`U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md`）で cron 自動化に置換するまでの 1 タスク分は人手でカバーする旨を unassigned-task-detection に明示し、Audit Logs polling の cron 仕様（5 分間隔・Slack incident webhook 通知）を未着手タスクとして固定する。

**promoted-to**: `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md`（§観測自動化要件）

## L-DERIV01-005: aiworkflow-requirements indexes の同時更新ポリシー

**苦戦箇所**: `references/deployment-gha.md` / `deployment-secrets-management.md` を編集した同一 wave で `pnpm indexes:rebuild` を実行しないと、`indexes/keywords.json` / `topic-map.md` / `quick-reference.md` / `resource-map.md` の 4 ファイルが drift し、後続 PR で CI gate `verify-indexes-up-to-date`（`.github/workflows/verify-indexes.yml`）が fail する。DERIV-01 では references 編集と indexes 再生成のコミットが分離してしまい、後続の skill 更新タスクが先に push された場合に CI block が他タスクへ波及した。

**5 分解決カード**: `references/` 配下の編集を含む wave では、編集 → `mise exec -- pnpm indexes:rebuild` → `git diff .claude/skills/aiworkflow-requirements/indexes/` 確認 → 同一コミットで indexes 差分を含めて push、を 1 セットで運用する。`SKILL.md` の §indexes 同時更新ポリシーに該当手順を追記し、`patterns-phase12-sync` チェックリスト（Phase 12 の `find outputs/phase-12 -maxdepth 1 -type f` と並列に `git diff --stat .claude/skills/aiworkflow-requirements/indexes/`）に組み込む。新規 lessons-learned を追加した場合も同様に indexes:rebuild を必須化する。

**promoted-to**: `SKILL.md`（§indexes 同時更新ポリシー）, `LOGS/_legacy.md`（DERIV-01 苦戦記録ログ）

## 関連ファイル

| 役割 | 参照先 |
| --- | --- |
| OIDC trust contract / 短命境界 matrix | `references/deployment-gha.md` |
| Legacy Token 3 段ライフサイクル | `references/deployment-secrets-management.md` |
| Phase 11 OIDC gate vocabulary | `task-specification-creator/references/phase-template-phase11.md` |
| Audit Logs 観測 cron（後続タスク） | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md` |
| Implementation guide / cutover runbook | `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/outputs/phase-12/implementation-guide.md` |
| Indexes 同時更新ポリシー | `.claude/skills/aiworkflow-requirements/SKILL.md` |
| 関連 deploy 系 workflow | `.github/workflows/web-cd.yml`, `.github/workflows/backend-ci.yml`, `.github/workflows/d1-migration-verify.yml` |
| Cloudflare CLI ラッパー | `scripts/cf.sh` |
