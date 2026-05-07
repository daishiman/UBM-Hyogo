# Phase 4: テスト戦略 — u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials

[実装区分: 実装仕様書]

判定根拠: Phase 1-3 で確定した 13 evidence と 4 approval gate を、実 GitHub Actions / 実 intermediate IdP / 実 Cloudflare で取得・検証する戦略を定義する。検証対象が CI 認証経路の置換と Cloudflare 上の credential 操作という副作用を伴うため docs-only ではない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials |
| phase | 4 / 13 |
| wave | post-u-fix-cf-acct-01 |
| mode | parallel |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1-3 の成果に対し、(a) どの観点を (b) どのテスト種別で (c) どのコマンド契約で (d) どの pass 条件で評価するかを定義し、Phase 5 ランブック / Phase 11 実測がそのまま機械検証可能になる粒度に落とす。

## 検証戦略の階層

```
Layer 1  unit       (scripts/cf.sh の token 注入分岐 / lifetime verify)
Layer 2  integration (workflow_dispatch dry-run で trust policy 動作)
Layer 3  security   (fork PR から OIDC が漏洩しないこと / pull_request 経路遮断)
Layer 4  audit      (短命 token の lifetime / scope を Cloudflare API で実測)
Layer 5  steady-state (staging 7 日連続 green、production 24h 並行運用)
Layer 6  cutover    (production cutover の成功 / 旧 Token 失効)
```

下層が落ちた時点で上層は実行しない（fail-fast）。各層の判定は Phase 7 AC マトリクスに 1:1 で対応させる。

## coverage 概念の適用

本タスクは `scripts/cf.sh` の改修（unit）と CI 経路の実測（integration / security / audit）を併用する。

| 指標 | 目標値 |
| --- | --- |
| `scripts/cf.sh` token 注入分岐の unit coverage（statement） | 80% 以上（CF_AUTH_MODE 分岐 / lifetime verify / fail-fast パスを網羅） |
| evidence 保存数（論理） | 13 / 13 |
| `secrets.CLOUDFLARE_API_TOKEN` 残存 grep | 0 件（`.github/workflows/` 配下 / コメント含む） |
| trust policy `*` 残存 grep | 0 件 |
| staging 連続 green 日数 | 7 日以上 |
| production 並行運用 連続 green | 24 時間以上 |

## テスト種別マトリクス

| # | 層 | 対象 | 種別 | 自動/手動 | コマンド契約 | evidence path | pass 条件 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T01 | L1 | `scripts/cf.sh` の `CF_AUTH_MODE=oidc-short-lived` 分岐 | unit | 自動 | `bash scripts/cf.sh whoami` を `CF_AUTH_MODE=oidc-short-lived` で `CLOUDFLARE_API_TOKEN=<dummy>` 注入時に `op run` を skip して直接使用 | unit ログ | exit 0、`op run` を spawn しない（strace / log 観測） |
| T02 | L1 | `scripts/cf.sh` lifetime verify（>1h fail-fast） | unit | 自動 | mock Token（expires_at が現在 +3700s）注入時に fail | unit ログ | exit != 0、`lifetime exceeds 3600s` メッセージ |
| T03 | L1 | `scripts/cf.sh` `CF_AUTH_MODE=local-1password`（既定） | unit | 自動 | flag 未設定時に従来通り `op run --env-file=.env` を呼ぶ | unit ログ | exit 0、`op run` 呼び出しを観測 |
| T04 | L2 | `workflow_dispatch` での staging dry-run | integration | 手動 + approval (G2 前) | `gh workflow run web-cd.yml --ref dev` で OIDC 経路の deploy を起動 | `outputs/phase-11/evidence/staging/dry-run-deploy-api.log` | workflow run が success、`Deployed ubm-hyogo-api-staging` ログを含む |
| T05 | L2 | trust policy 不一致時の拒否動作 | integration | 自動 | 不正 subject（例: `ref:refs/heads/feature/...`）からの credential 取得試行 | `outputs/phase-11/evidence/staging/trust-policy-deny.log` | IdP からのレスポンスが 401/403、Token が発行されない |
| T06 | L3 | fork PR から `id-token: write` job が起動しない | security | 手動 | テスト用 fork から PR を作成し、deploy workflow が triggered されないことを確認 | `outputs/phase-11/evidence/fork-pr/fork-pr-isolation.log` | workflow が triggered されない、もしくは triggered されても `id-token: none` で OIDC token 取得不能 |
| T07 | L3 | `pull_request_target` 経路の不在 | security | 自動 | `git grep 'pull_request_target' .github/workflows/` | 結果ログ | hit 0 |
| T08 | L3 | reusable workflow からの `id-token` 継承の不在 | security | 自動 | `git grep 'uses: \./\.github/workflows/deploy' .github/workflows/` | 結果ログ | hit 0、または hit がある場合は `id-token: none` を継承していることを確認 |
| T09 | L4 | 短命 credential lifetime 実測 | audit | 自動 | OIDC 経路で取得した Token を `GET /user/tokens/verify` および expires_at メタデータで確認 | `outputs/phase-11/evidence/lifetime/cf-token-lifetime.json` | `lifetimeSeconds <= 3600` |
| T10 | L4 | 短命 credential scope 実測 | audit | 自動 | `bash scripts/cf.sh` whoami 系コマンドで scope 取得、JSON 整形 | `outputs/phase-11/evidence/scope/cf-token-scope.json` | scopes が exactly `["Workers Scripts:Edit","D1:Edit","Cloudflare Pages:Edit","Account Settings:Read"]` |
| T11 | L4 | OIDC subject ログ × Cloudflare audit ログ突合 | audit | 自動 | GitHub run_id と Cloudflare audit `when` / `actor` を `jq` で突合 | `outputs/phase-11/evidence/audit/oidc-cf-audit-correlation.json` | `passAllCorrelated=true`、サンプル ≥ 5 件 |
| T12 | L5 | staging 7 日連続 green | steady-state | 手動 | 平日 dev push deploy / 週末 `workflow_dispatch` で計 7 日 | `outputs/phase-11/evidence/green-streak/staging-7day.md` | 連続成功、failure 0、各日 1 件以上の deploy |
| T13 | L6 | production cutover deploy | cutover | 手動 + approval (G3) | `gh workflow run backend-ci.yml --ref main`（G3 後） | `outputs/phase-11/evidence/production/cutover-deploy-api.log` / `cutover-deploy-web.log` | success、`Deployed ubm-hyogo-{api,web}-production` |
| T14 | L5 | production 24h 並行運用 | steady-state | 手動 | OIDC 経路のみで 24h 連続 deploy 観測（旧 Token は失効猶予中） | `outputs/phase-11/evidence/parallel-run/parallel-24h.md` | failure 0、新経路で全 deploy が成功 |
| T15 | L6 | 旧長命 Token 失効 | cutover | 手動 + approval (G4) | Cloudflare API `DELETE /user/tokens/:id` または Dashboard | `outputs/phase-11/evidence/revocation/old-token-revoked.json` | `revoked=true`、その後の旧 Token 利用が 401 になる検証 1 件 |
| T16 | L4 | staging credential が production scope を取得不能 | security | 自動 | staging trust policy で発行された Token で production-only resource にアクセス | `outputs/phase-11/evidence/audit/staging-cred-prod-deny.log` | 403 / 401 |
| T17 | L1 | esbuild 整合（CI モード） | unit | 自動 | CI runner で `bash scripts/cf.sh deploy --dry-run` を実行 | dry-run ログ | esbuild バイナリ整合、deploy 成功（dry-run） |
| T18 | L2 | re-issue 経路（>1h long-running deploy 想定） | integration | 自動 | 長時間 step を持つ workflow で expired token を意図的に発生させ、re-issue or fail-fast を確認 | `outputs/phase-11/evidence/staging/reissue-or-failfast.log` | re-issue 成功 もしくは fail-fast 明示エラー |

## staging で 7 日連続 green の評価指標

| 指標 | 目標 |
| --- | --- |
| 1 日あたりの deploy 件数 | 1 件以上（dev push or `workflow_dispatch`） |
| 連続日数 | 7 日（暦日。日付跨ぎは UTC で判定） |
| failure 件数 | 0 |
| flaky retry 許容 | 同 commit に対し 1 回までの retry は許容、2 回目失敗で連続記録リセット |
| evidence 形式 | `staging-7day.md` に日付 / commit SHA / workflow run URL / 結果 を表形式で記録 |

## production cutover 前のチェックリスト

Phase 11 production cutover 直前に以下を Claude Code が user に提示する:

- [ ] staging 7 日 green を `staging-7day.md` で確認
- [ ] T01〜T11 がすべて pass
- [ ] T16（staging credential が production scope を取得不能）を実測
- [ ] production environment の required reviewers が設定済み（`gh api repos/.../environments/production`）
- [ ] 1Password の `Cloudflare/UBM-Hyogo-Emergency-Rollback` に旧長命 Token が退避済み
- [ ] rollback runbook（`oidc-rollback.md`）が approve 済み
- [ ] G3 user approval 取得

## evidence 取得方法

| evidence | 取得元 |
| --- | --- |
| dry-run / cutover ログ | `gh run view <run-id> --log` をリダイレクト |
| lifetime / scope JSON | Cloudflare API `GET /user/tokens/verify` のレスポンスを `jq` 整形 |
| trust policy deny ログ | intermediate IdP のエラーレスポンスを log 化 |
| 監査突合 JSON | GitHub Actions の `runs` API + Cloudflare `audit_logs` API を `jq` で結合 |
| 7 日 green / 24h 並行 | 手動で日次サマリを `.md` に記録 |

すべての evidence は `outputs/phase-11/evidence/` 配下に保存し、Token 値・OIDC token JWT 本体・scope 以外の secret を含めない（redact）。

## 失敗時の判定基準

| カテゴリ | 失敗条件 | 切り分け |
| --- | --- | --- |
| trust policy 過剰 | T07 / T08 で hit 検出 | Phase 5 で workflow YAML / trust policy を修正、再 PoC |
| lifetime 超過 | T09 で `lifetimeSeconds > 3600` | IdP の Token 発行設定を見直し、`scripts/cf.sh` の fail-fast を確認 |
| scope 不一致 | T10 で 4 scope と一致しない | trust policy の scope mapping を修正 |
| 監査突合不能 | T11 で `passAllCorrelated=false` | IdP 側 mapping log に `github_run_id` を追加する設計改修を Phase 5 へ差し戻し |
| 7 日 green 未達 | T12 で failure 発生 | failure 原因を分析し、再起算（Day 0 から再カウント） |
| 24h 並行運用中の failure | T14 で failure | rollback 検討（G4 を保留し旧 Token 維持）、原因解消後に再開 |
| 旧 Token 失効後の rollback 不能 | T15 後の緊急時 | runbook の「失効済み時の長命 Token 再発行手順」（admin 操作）を実行 |

## 自走禁止操作（approval gate 再掲）

| gate | 対象テスト | 停止位置 |
| --- | --- | --- |
| G1 | trust policy 反映前 | intermediate IdP に trust policy を書き込む直前 |
| G2 | T04（staging cutover commit） | workflow YAML 切替コミット直前 |
| G3 | T13（production cutover） | production workflow 切替コミット直前 |
| G4 | T15（旧 Token 失効） | Cloudflare API `DELETE /user/tokens/:id` 直前 |

## 参照資料

- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-01.md` 〜 `phase-03.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `scripts/cf.sh`
- 参考: GitHub OIDC ハードニング公式 / Cloudflare API Token 公式

## 統合テスト連携

- 上流: U-FIX-CF-ACCT-01 Phase 11 verified（4 scope 実測）
- 下流: 09a / 09c の deploy 実行 evidence と本タスクの cutover ログを参照関係で結合
- 並走: DERIV-04 audit logs monitoring と T11 突合 evidence を共有

## 多角的チェック観点

- 苦戦箇所 #1〜#5 がテスト T01〜T18 のいずれかでカバーされている
- unit / integration / security / audit / steady-state / cutover の 6 層が揃っている
- redact 失敗時の evidence 破棄ルール（Phase 5 で詳述）と整合
- 失敗時の rollback / 切り分けが gate と紐付いている
- staging 7 日 green / 24h 並行 / 30 日 green の 3 段階の steady-state を区別している

## サブタスク管理

- [ ] T01〜T18 のテスト項目と evidence path の対応を確定
- [ ] coverage 目標（`scripts/cf.sh` 80% / evidence 13/13 / grep 0）を Phase 7 AC マトリクスに反映する指示を残す
- [ ] cutover 前チェックリスト 7 項目を Phase 11 ランブックに引き渡し
- [ ] failure 判定 7 カテゴリを Phase 6 異常系検証に引き渡し
- [ ] `outputs/phase-04/main.md` を作成

## 成果物

- `outputs/phase-04/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 13 論理 evidence に対応する 18 テスト項目（T01〜T18）が、種別 / コマンド / pass 条件で一意に定義されている
- 7 日連続 green / 24h 並行運用 / 30 日 green の評価指標が確定している
- production cutover 前チェックリスト 7 項目が確定している
- 失敗時の判定基準 7 カテゴリが切り分けと紐付いている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本 Phase で workflow YAML 改修・実 deploy・commit・push・PR / `outputs/phase-XX/main.md` 編集を実行していない
- [ ] CONST_007 に従い、未確定事項は Phase 5 / Phase 11 への引き渡し条件として明示している

## 次 Phase への引き渡し

Phase 5（実装ランブック）へ:
- T01〜T18 のコマンド契約と pass 条件
- 4 approval gate の停止位置
- production cutover 前チェックリスト 7 項目
- failure 判定 7 カテゴリ（Phase 6 異常系検証へ繋ぐ）
- staging-first 段階展開 7 段階の各ステップ実行手順（Phase 5 で具体コマンド化）
- `scripts/cf.sh` 改修コードの差分（unit テスト T01〜T03 を満たす実装）

## 実行タスク

- [ ] phase-04 の既存セクションに記載した手順・検証・成果物作成を実行する。
