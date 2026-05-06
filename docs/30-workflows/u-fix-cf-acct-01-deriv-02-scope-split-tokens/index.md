# タスク仕様書: Issue #406 — Cloudflare API Token を Workers / D1 / Pages 別に分割（ブラスト半径削減）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | u-fix-cf-acct-01-deriv-02-scope-split-tokens |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/406 (CLOSED) |
| 起票元 unassigned-task | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-02-scope-split-tokens.md` |
| 上流 wave | `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/`（単一 Token + 最小 4 scope の正本。本タスクはその Option C 進化版） |
| 配置先 | `docs/30-workflows/u-fix-cf-acct-01-deriv-02-scope-split-tokens/` |
| 作成日 | 2026-05-06 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装仕様書]** — Cloudflare 上で 6 Token を発行し、GitHub Secrets/Variables を再配置し、`.github/workflows/*.yml` の deploy job を Token scope 別に分割する変更を伴う。Issue #406 は CLOSED だが、目的（ブラスト半径削減）達成には repo 設定・workflow YAML・runbook docs の物理変更が必須のため、CONST_004 に従い実装仕様書として作成する。 |
| 優先度 | MEDIUM |
| 想定 PR 数 | 1（workflow 分割 + secrets 命名規約 docs + runbook + aiworkflow indexes 同期。Token 発行と GitHub Secrets 投入は手動作業として Phase 11 に runbook 化する。） |
| coverage AC | 適用外（CI/CD workflow + docs のみ。アプリケーションコード変更なし） |

## 目的

`U-FIX-CF-ACCT-01` で確立した「単一 Token に最小 4 scope（`Workers Scripts:Edit` / `D1:Edit` / `Cloudflare Pages:Edit` / `Account Settings:Read`）」運用を、deploy 経路（Workers / D1 / Pages）× 環境（staging / production）の **6 Token 構成**に進化させる。各 Token に必要 scope のみを保持させ、漏洩時のブラスト半径を縮小する。本タスクは現行 `.github/workflows/backend-ci.yml` / `.github/workflows/web-cd.yml` の Cloudflare token 参照分割、GitHub Secrets 命名規約、Token 単位の rotation/rollback runbook を物理アーティファクトとして作成・適用する。

## スコープ

### 含む

- 6 Token の scope 定義表（Workers/D1/Pages × staging/production）
- GitHub Secrets 命名規約: `CF_TOKEN_<SCOPE>_<ENV>` (例: `CF_TOKEN_WORKERS_STAGING`)
- `.github/workflows/backend-ci.yml` / `.github/workflows/web-cd.yml` の Cloudflare token 参照分割
  - `backend-ci.yml` D1 migration step → `secrets.CF_TOKEN_D1_<ENV>` のみ
  - `backend-ci.yml` Workers deploy step → `secrets.CF_TOKEN_WORKERS_<ENV>` のみ
  - `web-cd.yml` Pages deploy step → `secrets.CF_TOKEN_PAGES_<ENV>` のみ
- `scripts/cf.sh` の `CLOUDFLARE_API_TOKEN` 引数化（呼び出し元 job が scope 別 Token を環境変数に注入）
- Token 単位の rotation / rollback runbook（`docs/30-workflows/.../outputs/phase-12/runbook-token-rotation.md`）
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` の secrets 表更新
- 旧単一 Token の 24h 並行保持後の失効手順

### 含まない

- short-lived credential 化（OIDC）→ `U-FIX-CF-ACCT-01-DERIV-01` で扱う
- rotation 自動化 → `U-FIX-CF-ACCT-01-DERIV-03` で扱う
- Audit Logs 監視 → `U-FIX-CF-ACCT-01-DERIV-04` で扱う
- アプリケーションコード（`apps/web` / `apps/api`）変更

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `U-FIX-CF-ACCT-01` | 単一 Token の最小 4 scope が staging/production で 30 日 green であることが着手判断基準 |
| 上流 | UT-25 系 secret 配置運用 | secret 数増加で `bash scripts/cf.sh secret put` 運用が複雑化するため事前成熟が必要 |
| 関連 | `U-FIX-CF-ACCT-01-DERIV-01`（OIDC 化） | OIDC 後の credential も同じ scope 分割方針を継承 |
| 関連 | `U-FIX-CF-ACCT-01-DERIV-03`（rotation 自動化） | 6 Token rotation を automate しないと運用破綻リスク |

## Phase ファイル一覧

| Phase | ファイル | 役割 |
| --- | --- | --- |
| 1 | [phase-01.md](phase-01.md) | 要件定義・GO/NO-GO 判定（30 日 green 確認） |
| 2 | [phase-02.md](phase-02.md) | scope 設計・Token / Secrets / workflow 分割設計 |
| 3 | [phase-03.md](phase-03.md) | 設計レビューゲート |
| 4 | [phase-04.md](phase-04.md) | テスト作成（workflow lint / scope smoke） |
| 5 | [phase-05.md](phase-05.md) | 実装（workflow 分割・scripts/cf.sh 改修・docs） |
| 6 | [phase-06.md](phase-06.md) | テスト拡充（staging dry-run） |
| 7 | [phase-07.md](phase-07.md) | カバレッジ確認（適用外） |
| 8 | [phase-08.md](phase-08.md) | リファクタリング |
| 9 | [phase-09.md](phase-09.md) | 品質保証（typecheck / lint / actionlint） |
| 10 | [phase-10.md](phase-10.md) | 最終レビューゲート |
| 11 | [phase-11.md](phase-11.md) | 手動実機検証（Token 発行 → staging 7 日 green → production） |
| 12 | [phase-12.md](phase-12.md) | ドキュメント更新（runbook / aiworkflow / 未タスク検出） |
| 13 | [phase-13.md](phase-13.md) | PR 作成 |

## 実装区分判定根拠

ユーザー指示: 「Issue #406 (CLOSED) のタスク仕様書を Phase 1-13 で作成」。Issue 本文・参照 unassigned-task 仕様共に **物理変更（Token 発行・GitHub Secrets 投入・workflow YAML 編集・docs 更新）が目的達成の必須要素**であり、ドキュメントのみで完結しない。CONST_004 に従い、ラベルが docs-only であっても実態優先で **実装仕様書** として作成する。

## CONST_007 スコープ宣言

本仕様書は単一 PR 1 サイクル内で完了するスコープ。手動作業（Cloudflare ダッシュボードでの Token 発行、GitHub Secrets 投入、本番 24h 並行保持）は Phase 11 runbook として仕様書内に記述し、実行は人間オペレータが同サイクル内で完遂する。先送りタスクなし。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-02-scope-split-tokens.md` | 起票元仕様 / Option C 設計詳細 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | secrets 正本仕様 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-gha.md` | deploy workflow 構成 |
| 必須 | `scripts/cf.sh` | Cloudflare CLI ラッパー（変更対象） |
| 関連 | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md` | OIDC との設計整合 |
| 参考 | https://developers.cloudflare.com/fundamentals/api/get-started/create-token/ | Cloudflare API Token scope |
