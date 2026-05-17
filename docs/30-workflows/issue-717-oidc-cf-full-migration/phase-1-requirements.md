# Phase 1: 要件定義

> Source issue: [#717](https://github.com/daishiman/UBM-Hyogo/issues/717)
> Parent spec: docs/30-workflows/unassigned-task/issue-640-followup-001-oidc-full-migration.md
> implementation_mode: `verified_current_no_code_change_pending_pr`
> task classification: code task (GitHub Actions workflow YAML)
> visual classification: NON_VISUAL
> 実装区分: **実装仕様書** (CONST_005 必須項目すべてを含む / CONST_007 1サイクル完了スコープ)

---

## 1. 真の論点

- 現象: Issue #640 で `CLOUDFLARE_API_TOKEN` を step-scoped 化したが、credential 自体は long-lived API Token のまま GitHub Repository / Environment Secrets に保管され、Cloudflare account scope の Workers Scripts:Edit / D1:Edit / Pages:Edit 権限を維持している。
- 主問題: long-lived token は rotation SOP 発動時の同期コスト（GitHub Secrets / Cloudflare dashboard / 1Password の 3 箇所）と漏洩時の blast radius を残置する。
- why now: Issue #640 Phase 12 `unassigned-task-detection.md` で OIDC full migration が後続タスクとして formalize 済み。step-scoped 化が安定運用フェーズに入ったため、credential 寿命の根本対策に着手するタイミングが確定した。
- why this way: Cloudflare 公式の OIDC / workload identity federation サポート状況を一次情報で再確認した上で、公式未対応であれば speculative な `id-token: write` / token exchange 実装を入れず、Issue #640 の step-scoped token 経路を current safe baseline として維持する。

## 2. P50 チェック結果

| 項目 | 結果 |
|---|---|
| current branch に実装が存在する | No → 公式未対応のため no-code verification |
| upstream にマージ済み | No |
| 前提タスク完了 | Yes（Issue #640 step-scoped cutover / staging-production runtime evidence 完了） |

→ `implementation_mode: "verified_current_no_code_change_pending_pr"` / `implementationCategory: "conditional"`

## 3. 背景

### 3.1 Issue #640 step-scoped token 化との関係

Issue #640 (`issue-640-oidc-cf-token-cutover`) では `.github/workflows/web-cd.yml` の `CLOUDFLARE_API_TOKEN` を job-level `env:` から deploy step 直下に降格し、build / lint / install など他 step への token 露出を遮断した。同時に `scripts/redaction-check.sh` で deploy log の token / Account ID redaction を CI gate 化している。これにより **runtime 露出 surface** は step 単位に縮小済み。

### 3.2 long-lived token 残置リスク

step-scoped 化後も以下リスクが残存:

- credential の **静的寿命**: GitHub Secrets に保管された API Token は明示 rotation まで有効。漏洩経路は workflow runtime に限らず、Secrets 取得権限を持つ workflow / runner / actor 全てを含む。
- **rotation 工数**: 1Password → Cloudflare dashboard → GitHub Environment Secrets の 3 箇所同期 SOP が固定化。
- **blast radius**: Cloudflare account scope の Workers / D1 / Pages 編集権限が long-lived のまま保持される。
- **trust boundary 不明示**: `id-token: write` permission の subject claim 制限が未設計のため、後続 OIDC 化のセキュリティ前提が確定していない。

## 4. 機能要件

- F-1: Cloudflare 公式の OIDC / workload identity federation サポート状況を一次情報で再検証し、採用可否（完全移行 / 段階移行 / 延期）を判定可能にする。
- F-2: 2026-05-16 時点で公式 OIDC deploy support が確認できない場合、`.github/workflows/web-cd.yml` に `permissions: id-token: write` や仮 exchange step を追加しない。
- F-3: future supported path 用に、subject claim pin の最低条件（`repo` / `ref` / `environment`）を後続タスクの gate として記録する。
- F-4: production rollout は公式 support + staging proof + observation 後の別 task とし、本タスクでは実切替を実行しない。
- F-5: 既存 step-scoped `secrets.CLOUDFLARE_API_TOKEN` 経路を current runtime contract として維持し、rollback path を壊さない。
- F-6: `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` に no-code 判定・current secret boundary・future OIDC gate を反映する。

## 5. 非機能要件

| 観点 | 要件 |
|---|---|
| セキュリティ（blast radius 削減） | 未文書化 OIDC endpoint / action input を推測実装しない。現時点の削減策は Issue #640 の step-scoped token boundary を維持 |
| 運用（token rotation 工数削減） | OIDC 化による rotation 工数削減は future supported task へ委譲。本タスクでは token 名・保管場所を変更しない |
| CI 実行時間 | workflow 実装変更なし。required status check の current behavior を維持 |
| 互換性 | `scripts/cf.sh` の env var 名 `CLOUDFLARE_API_TOKEN` を維持し、ローカル deploy 経路を破壊しない |
| 観測性 | Phase 11 代替証跡は公式 docs / wrangler-action README の一次情報再検証とし、runtime deploy log は発生させない |
| trust boundary 明示 | `id-token: write` は公式 support が確認されるまで付与しない |

## 6. スコープ確定（CONST_007）

### 含む（in-scope）

- Cloudflare 公式 OIDC サポートの一次情報再検証（`cloudflare/wrangler-action` 最新 release の `id-token` 入力対応含む）
- unsupported 判定時に `.github/workflows/web-cd.yml` を変更しないことの明文化
- future supported path 用 subject claim pin 条件（`repo` / `ref` / `environment`）の後続 gate 化
- staging 限定 OIDC deploy proof を future implementation task の前提へ戻す判断
- step-scoped token 経路を current rollback-capable baseline として維持する判断
- production rollout 段階手順を後続 task として formalize
- `deployment-secrets-management.md` への no-code 判定・current secret boundary 反映

### 含まない（out-of-scope / CONST_007 例外）

元仕様 `issue-640-followup-001-oidc-full-migration.md` §2.3 を引用:

- Cloudflare dashboard 上での legacy API Token **物理失効**（`issue-640-followup-002-legacy-token-revocation` が所有）
- `apps/api` 側の D1 token cutover 全般
- 1Password 正本の構造変更本体（参照更新の判断材料作成にとどめる）
- HEALTH_DB_TOKEN 等、他 rotation SOP 文書の本体改訂
- `scripts/cf.sh` ラッパー仕様変更（env var 名 `CLOUDFLARE_API_TOKEN` 互換性は維持）
- production environment への OIDC 実切替実行（本タスクでは設計のみ）

## 7. 変更対象ファイル一覧（CONST_005 必須）

| パス | 種別 | 概要 |
|---|---|---|
| `.github/workflows/web-cd.yml` | 変更なし | 公式 support が確認できるまで `id-token: write` / OIDC exchange step を追加しない |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | no-code 判定・current `CLOUDFLARE_API_TOKEN` boundary・future OIDC gate の正本反映 |
| `docs/30-workflows/issue-717-oidc-cf-full-migration/outputs/phase-*/` | 新規 | 一次情報サマリ / Phase 12 strict outputs / compliance check / 同期計画 |
| `scripts/cf.sh` | 変更なし | env var 名 `CLOUDFLARE_API_TOKEN` 互換性維持 |
| `.github/workflows/backend-ci.yml` / `cf-audit-log-*.yml` / `cloudflare-alerts-drift.yml` / `cloudflare-analytics-export.yml` / `d1-migration-verify.yml` / `post-release-dashboard.yml` | スコープ外（本タスクでは触らない） | 後続 followup タスクで OIDC 化を検討。本タスクは `web-cd.yml` の staging 限定 proof に集中 |

## 8. 受入条件（DoD 抜粋）

### 機能 DoD

- [x] Phase 1/11 成果物に Cloudflare 公式 OIDC サポート再検証結果（採用可否判定）が一次情報ベースで記録されている
- [x] `id-token: write` / OIDC exchange step を `.github/workflows/web-cd.yml` に追加しない判断が記録されている
- [x] future subject claim pin 条件（`repo` / `ref` / `environment`）が後続 task の gate として記録されている
- [x] staging 限定 OIDC deploy は公式 support 確認後の future task に戻し、本サイクルの PASS 根拠にしない
- [x] step-scoped `secrets.CLOUDFLARE_API_TOKEN` 経路を current contract として維持する

### 品質 DoD

- [x] runtime OIDC token / subject claim log を発生させない
- [x] staging proof は official support + staging task の前提へ委譲
- [x] `scripts/cf.sh` 経由のローカル deploy contract（env var 名 `CLOUDFLARE_API_TOKEN`）を変更しない
- [x] workflow yaml 変更なしのため actionlint 対象差分なし

### ドキュメント DoD

- [x] `deployment-secrets-management.md` に no-code 判定・current secret boundary・future OIDC gate が含まれている
- [x] production OIDC cutover は `issue-717-followup-001-production-oidc-cutover.md` に formalize されている
- [x] `outputs/phase-12/unassigned-task-detection.md` で legacy token 物理失効タスク (`issue-640-followup-002`) との実行順制約が明示されている
- [x] `outputs/phase-12/system-spec-update-summary.md` に正本同期対象が列挙されている

## 9. 既存命名規則

- workflow file: kebab-case（`web-cd.yml`）
- secret 名: SCREAMING_SNAKE_CASE（`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`）
- script: kebab-case + `.sh`
- GitHub Actions permission キー: lowercase + colon（`id-token: write`）

## 10. カテゴリ別 task 分類記録

- task classification: conditional code task（公式 support 確認までは GitHub Actions workflow YAML 変更なし）
- visual classification: NON_VISUAL（理由: CI/CD workflow 改修と設計のみ、UI 変更なし）
- Phase 11 → 一次情報再検証 evidence で代替（UI/UX 変更なし、runtime deploy 未実行）
