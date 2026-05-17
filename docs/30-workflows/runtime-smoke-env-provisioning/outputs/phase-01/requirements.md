# Phase 1: 要件定義

## タスク分類

| 項目 | 値 |
|------|----|
| タスク種別 | NON_VISUAL（backend + CI + ops） |
| 実装モード | `new`（service-token / production workflow / runbook） + `verify_existing`（既存 staging workflow / smoke runner / allowlist） |
| UI 変更 | なし（Phase 11 screenshot 不要） |

## 目的

staging + production の runtime smoke を SDD 準拠で恒常運用可能にする。具体的には:

1. CI smoke 用の長寿命 service-token を `apps/api` で発行できるようにする
2. smoke runner を production read-only 対応に拡張する
3. `runtime-smoke-production.yml` を staging 版と対称構造で新設する
4. `verify-env-secrets.allowlist` を production scope に拡張する
5. provision script を staging / production 両対応にする
6. D1 migration apply / seed user / service-token 発行 / incident 対応の runbook を整備する

## スコープ

### in

- `apps/api` への service-token endpoint 追加（admin / member 各専用、HMAC-signed protection、90日 JWT 発行）
- `scripts/smoke/runtime-attendance-provider.sh` の production 対応（read-only ガード付き）
- `.github/workflows/runtime-smoke-production.yml` の新設
- `scripts/ci/verify-env-secrets.allowlist` の production scope 行追加
- provision script の env 引数化 / 並列スクリプト追加
- D1 migration apply（staging / production）の runbook 化
- smoke seed user 投入の runbook 化
- service-token 発行手順の runbook 化
- 既存 incident runbook の staging + production 両対応への拡張

### out

- Google Form / Auth.js OAuth フローの変更（service-token は別経路で並存）
- `apps/web` から D1 直接アクセス（CLAUDE.md 不変条件）
- production への write 系 smoke（read-only 限定）
- bearer 値・API token 値・1Password 実値のドキュメント記載
- 実コード変更 / 実 secret 投入 / 実 workflow rerun（本タスクは spec 生成のみ）

## 受入条件（Acceptance Criteria）

| # | 内容 | 検証方法 |
|---|------|---------|
| AC-1 | `POST /internal/service-token/admin` と `POST /internal/service-token/member` の API 仕様（route / HMAC scheme / 入出力 / claim / rate limit / 監査）が Phase 2 に明記されている | Phase 2 design.md の §service-token endpoint を確認 |
| AC-2 | smoke runner の production 拡張仕様（staging-only ガード解除 / read-only 限定 / 環境分岐ロジック）が Phase 2 に明記されている | Phase 2 design.md の §smoke runner を確認 |
| AC-3 | `runtime-smoke-production.yml` の workflow 構造（trigger / environment / steps）が staging 版と対称で Phase 2 に明記されている | Phase 2 design.md の §workflow を確認 |
| AC-4 | `verify-env-secrets.allowlist` 拡張行（`production-runtime-smoke: PROD_API_BASE PROD_ADMIN_BEARER PROD_MEMBER_ID PROD_ME_BEARER`）が Phase 2 / Phase 5 に明記されている | Phase 2 / Phase 5 を確認 |
| AC-5 | provision script の rename / env 引数化 仕様（1Password 経路 / 直接 `gh secret set` 経路の両対応）が Phase 5 に明記されている | Phase 5 implementation-plan.md を確認 |
| AC-6 | D1 migration apply の runbook（staging / production）が新設されている | `runbooks/d1-migration-apply.md` の存在確認 |
| AC-7 | service-token 発行手順の runbook が新設されている | `runbooks/service-token-issuance.md` の存在確認 |
| AC-8 | staging / production の env provisioning runbook が新設されている | `runbooks/runtime-smoke-env-provisioning-{staging,production}.md` の存在確認 |
| AC-9 | Phase 12 の 4 必須成果物（implementation-guide / documentation-changelog / unassigned-tasks / skill-feedback）が揃っている | `outputs/phase-12/` を確認 |
| AC-10 | bearer 値・API token 値・1Password 実値がドキュメント本文に記載されていない | `grep -rE '(eyJ[A-Za-z0-9_-]+\.|sk-|ghp_|cfp_)' outputs/ runbooks/` で空 |

## inventory（既存資産の棚卸し）

| パス | 種類 | 本タスクでの扱い |
|------|------|------------------|
| `.github/workflows/runtime-smoke-staging.yml` | 既存 | `verify_existing`（production 版の対称参照モデル） |
| `.github/workflows/verify-env-secrets.yml` | 既存 | `verify_existing`（allowlist consumer） |
| `scripts/ci/verify-env-secrets.sh` | 既存 | `verify_existing`（コア検証ロジックは不変） |
| `scripts/ci/verify-env-secrets.allowlist` | 既存 | `modify`（production scope 行追加） |
| `scripts/ci/__tests__/verify-env-secrets.spec.sh` | 既存 | `modify`（production scope 行追加分のテスト追記） |
| `scripts/smoke/runtime-attendance-provider.sh` | 既存 | `modify`（production 分岐追加 / read-only ガード追加） |
| `scripts/smoke/provision-staging-secrets.sh` | 既存 | `rename` → `provision-runtime-smoke-secrets.sh`（env 引数化） |
| `scripts/cf.sh` | 既存 | `verify_existing`（D1 migration apply の wrapper として参照） |
| `apps/api/src/routes/` | 既存 | `new` 追加先 surface（`internal/service-token.ts`） |
| `apps/api/src/lib/` | 既存 | `new` 追加先 surface（`hmac.ts` / `service-token-audit.ts`） |
| `docs/30-workflows/runtime-smoke-staging-secrets-restore/` | 既存 | 参照モデル（artifacts.json / index.md 構造） |

## 命名規則確認

- shell script: `kebab-case.sh`（既存スクリプト群と一致）
- TypeScript: `kebab-case.ts`（既存 `apps/api/src/lib/` の命名と一致）
- workflow yaml: `kebab-case.yml`（既存と一致）
- runbook: `kebab-case.md`（参照 workflow `runtime-smoke-staging-secrets-restore/runbooks/incident-2026-05-16.md` と一致）
- allowlist entry: `<environment-name>: <SECRET_KEY_LIST>`（既存 staging 行と一致）

## P50 チェック結果

| 確認項目 | 結果 | 対応 |
|---------|------|------|
| current branch に実装が存在する | No（service-token endpoint / production workflow は未実装） | 通常の実装 Phase とする（ただし本タスクは spec only） |
| upstream に類似実装がマージ済み | Partial（staging 版 workflow / runner / allowlist は存在） | 既存部分は `verify_existing`、新規部分は `new` のハイブリッド |
| 前提タスクが完了済み | Yes（先行 workflow `runtime-smoke-staging-secrets-restore` で staging incident 対応済み） | 依存解消タスク不要 |

## NON_VISUAL 宣言

- タスク種別: NON_VISUAL
- 非視覚的理由: 本タスクは backend API endpoint 追加、CI workflow / shell script の拡張、ops runbook 整備で構成され、UI レンダリングを伴わない
- 代替証跡: Phase 4 test-plan.md（service-token endpoint 単体 / 統合テスト計画）/ Phase 11 manual-test-result.md（spec レビューチェックリスト + 静的検証結果）

## 将来の UI 統合経路（scope out）

- service-token を admin UI から発行する経路は別タスク化（FB-CRONVL-002 ルール準拠で明示）
- production smoke の Grafana / Cloudflare Analytics への連携は別タスク化

## 完了条件

- 本ファイルに AC-1〜AC-10、inventory、命名規則、P50 結果、NON_VISUAL 宣言が記録されている
- Phase 2 への入力（service-token endpoint 仕様の必須要素 / smoke runner 拡張要件 / workflow 構造要件）が列挙されている

## 成果物

- `outputs/phase-01/requirements.md`（本ファイル）

## 次 Phase 入力

- service-token endpoint の HMAC scheme / claim 設計
- smoke runner の production read-only 分岐ロジック
- production workflow の trigger / environment / steps 構造
- allowlist 拡張行の正確な key 名
