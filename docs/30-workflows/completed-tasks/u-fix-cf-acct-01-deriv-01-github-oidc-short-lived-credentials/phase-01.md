# Phase 1: 要件定義 — u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials

[実装区分: 実装仕様書]

判定根拠: 本タスクは `.github/workflows/deploy-*.yml`（想定パス）の YAML 改修、`scripts/cf.sh` の token 注入経路改修、intermediate IdP の trust policy 設定、Cloudflare 上の長命 Token 失効、仕様正本（runbook / aiworkflow-requirements references）更新を伴う。CI/CD 経路に対して実環境への副作用（短命 credential 発行・deploy 実行・旧 Token 失効）が発生するため docs-only ではなく実装仕様書として扱う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials |
| phase | 1 / 13 |
| wave | post-u-fix-cf-acct-01 |
| mode | parallel |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |
| 想定実行者 | 人間オペレーター + Claude Code（user approval ゲート併用） |

## 目的

長命 `CLOUDFLARE_API_TOKEN`（GitHub Secrets に保管）を CI deploy パイプラインから廃止し、GitHub Actions の OIDC token を起点として短命 credential（lifetime ≤ 1h、job スコープ）を取得する経路に置換する。U-FIX-CF-ACCT-01 で達成した「permission scope の最小化（4 scope）」を継承しつつ、漏洩ブラスト半径を「lifetime の最小化」へ拡張する。

ビジネス価値:
- 長命 Token がリポジトリ Secrets / 1Password / 開発者端末などに散らばる構造そのものを撤廃し、漏洩経路を縮約する
- rotation という運用手続き（DERIV-03 の 90 日 rotation）を「Trust Policy の更新」に置換し、運用の認知コストを下げる
- インシデント発生時の隔離が「Trust Policy 行の削除」だけで完結する

## 入力

| 種別 | 値 |
| --- | --- |
| 上流タスク evidence | U-FIX-CF-ACCT-01 Phase 11 verified（最小 4 scope: `Workers Scripts:Edit` / `D1:Edit` / `Cloudflare Pages:Edit` / `Account Settings:Read`） |
| 既存 deploy workflow | `.github/workflows/deploy-*.yml`（想定パス。実存ファイル名は Phase 5 でリポジトリ実態を確認） |
| Cloudflare 認証ラッパー | `scripts/cf.sh`（`op run --env-file=.env` で `CLOUDFLARE_API_TOKEN` 注入） |
| 仕様正本 | `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`、`.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`、`.claude/skills/aiworkflow-requirements/references/deployment-gha.md` |
| 上流タスク仕様 | `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md` |
| 関連参考 | GitHub OIDC ハードニング公式 / Cloudflare API Token scope 公式 |

## 出力（成果物 evidence 種別）

Phase 5 / 11 で取得し、以下のパスに保存する。本 Phase ではパスと命名規則のみを確定する。

| # | 種別 | 保存先（命名規則） |
| --- | --- | --- |
| 1 | trust policy 設計図（intermediate IdP 側 / sub claim 一覧） | `outputs/phase-02/trust-policy-design.md` |
| 2 | workflow YAML diff（before/after） | `outputs/phase-05/workflow-diff/{deploy-api,deploy-web}-{staging,production}.diff` |
| 3 | `scripts/cf.sh` 改修 diff | `outputs/phase-05/cf-sh-diff/cf.sh.diff` |
| 4 | staging dry-run（`workflow_dispatch`）実行ログ | `outputs/phase-11/evidence/staging/dry-run-*.log` |
| 5 | 短命 credential lifetime 実測 | `outputs/phase-11/evidence/lifetime/cf-token-lifetime.json` |
| 6 | 短命 credential scope 実測 | `outputs/phase-11/evidence/scope/cf-token-scope.json` |
| 7 | staging 7 日連続 green の deploy 実績サマリ | `outputs/phase-11/evidence/green-streak/staging-7day.md` |
| 8 | production cutover ログ | `outputs/phase-11/evidence/production/cutover-*.log` |
| 9 | 24h 並行運用ログ | `outputs/phase-11/evidence/parallel-run/parallel-24h.md` |
| 10 | 旧長命 Token 失効 evidence（Cloudflare API / Dashboard） | `outputs/phase-11/evidence/revocation/old-token-revoked.json` |
| 11 | 緊急 rollback runbook | `outputs/phase-12/runbook/oidc-rollback.md` |
| 12 | OIDC subject ログと Cloudflare audit ログの突合 evidence | `outputs/phase-11/evidence/audit/oidc-cf-audit-correlation.json` |
| 13 | fork PR 漏洩防止検証ログ | `outputs/phase-11/evidence/fork-pr/fork-pr-isolation.log` |

更新対象ドキュメント:
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`: deploy 経路の正本記述を OIDC 短命 credential 経路に更新、緊急 rollback 手順を追記
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`: `CLOUDFLARE_API_TOKEN` 長命版を「廃止済み」とマークし、OIDC 経路を正本に昇格
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`: `permissions: id-token: write` の付与方針、trust policy subject 設計を反映
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-03-token-rotation-90day-runbook.md`: 「Token rotation」概念から「Trust Policy 更新」概念へ移行する旨を追記（DERIV-03 の前提変更）

## 機能要件

1. **OIDC trust 確立**: GitHub Actions の OIDC issuer (`https://token.actions.githubusercontent.com`) を、選定した intermediate IdP（AWS STS / 1Password Connect / Vault のいずれか）が信頼する。subject claim は `repo:daishiman/UBM-Hyogo:ref:refs/heads/dev` / `repo:daishiman/UBM-Hyogo:ref:refs/heads/main` および `environment:staging` / `environment:production` で最小化する。
2. **deploy workflow 置換**: `.github/workflows/deploy-*.yml` 内の `secrets.CLOUDFLARE_API_TOKEN` 参照を OIDC 経由短命 token 取得 step に置換する。job 単位で `permissions: id-token: write` を付与し、それ以外の job では `id-token: none` を維持する。
3. **staging-first 適用**: staging 経路で短命化を先行検証し、7 日連続 green を確認した後に production 経路へ展開する。
4. **24h 並行運用**: production 切替後、旧長命 Token を即時失効せず 24h は失効猶予として残し、OIDC 経路の安定性を観測してから失効する。
5. **長命 Token 失効**: 24h 並行運用完了後、Cloudflare Dashboard / API で旧 `CLOUDFLARE_API_TOKEN` を失効し evidence として記録する。
6. **rollback runbook**: OIDC 経路が壊れた場合、長命 Token を 1Password から 24h 限定で再注入する手順を runbook 化する。完全廃止は OIDC 経路で 30 日連続 green 確認後とする。
7. **最小 4 scope 継承**: 短命 credential 側でも `Workers Scripts:Edit` / `D1:Edit` / `Cloudflare Pages:Edit` / `Account Settings:Read` の 4 scope を維持する。OIDC 化を機に scope を緩めない。
8. **`scripts/cf.sh` 切替フラグ**: ローカル端末からの実行（op + 1Password）と、CI からの実行（OIDC 短命 credential を環境変数経由で受領）の両モードを切り替えられるようにする。

## 非機能要件

| 観点 | 要求 |
| --- | --- |
| 安全性（信頼境界ハードニング） | trust policy の subject claim を repo / branch / environment まで絞る。`*` ワイルドカードを禁止。`pull_request_target` を採用しない。fork PR では `id-token: write` を付与しない |
| 再現性 | 全 Cloudflare 操作は `bash scripts/cf.sh ...` 経由のみ。CI からも同ラッパーを呼び、実行経路の差異を最小化する |
| Free-tier 遵守 | 不変条件 #14。intermediate IdP（特に AWS STS の API call 数 / 1Password Connect の seat 数）が UBM-Hyogo の予算枠内に収まることを Phase 2 で確認 |
| 監査性 | GitHub Actions OIDC subject ログ（`github.com/.../attempts/.../job/.../step/...`）と Cloudflare audit ログ（actor / API token id）を時刻と job_id で突合できる evidence を残す |
| 操作の明示性 | trust policy 更新 / staging cutover / production cutover / 長命 Token 失効 はすべて user approval gate で停止し、自走しない |
| 可逆性 | 24h 並行運用期間中はいつでも長命 Token 経路に戻せる。完全失効は 30 日 green 後のみ |

## 制約条件

1. **Cloudflare の OIDC 直接受入れ非対応**（上流タスク苦戦箇所 #1）: Cloudflare API は GitHub OIDC を IAM に直接統合しない。intermediate IdP（AWS STS / 1Password Connect / Vault）か、Cloudflare の短命 Token 発行 API が利用可能ならそれを使う、の 2 経路に限定する。
2. **lifetime 上限**（苦戦箇所 #2）: 短命 credential は **最大 1 時間以内**。retry や long-running deploy では re-issue 経路を用意する。
3. **fork PR / `pull_request_target` 漏洩防止**（苦戦箇所 #3）: `pull_request_target` は採用しない。`id-token: write` を付与する job は `workflow_dispatch` または `push`（protected branch）に限定する。
4. **rollback 経路確保**（苦戦箇所 #4）: 長命 Token を 1Password に保管し続け、24h 限定で再注入できる runbook を維持する。完全廃止は OIDC 経路で 30 日 green 確認後。
5. **最小 4 scope 継承**（苦戦箇所 #5）: OIDC 化を機に scope を緩めない。`Account Settings:Read` 等を含む 4 scope を維持する。
6. **CONST_007**: 本タスクで発見した課題は「Phase XX で対応」と先送りせず、Phase 13 evidence もしくは `unassigned-task/` 起票のいずれかで完結させる。
7. **`.env` への実値書き込み禁止 / `wrangler login` の OAuth トークン保持禁止**（CLAUDE.md 既定）。
8. **production への直接実行禁止**: staging 経路の 7 日 green 確認 → production cutover → 24h 並行 → 失効、の順序を逸脱しない。

## 関係者・承認ゲート

| ゲート | 承認者 | タイミング | 影響 |
| --- | --- | --- | --- |
| G1: trust policy 反映 | user | intermediate IdP の trust policy を実環境に書き込む直前 | trust 境界の最小化が破綻すると CI が認証不能 / 過剰権限 |
| G2: staging deploy 切替 | user | staging workflow を OIDC 経路に切り替えるコミット直前 | staging deploy が壊れた場合は速やかに rollback |
| G3: production deploy 切替 | user | production workflow を OIDC 経路に切り替えるコミット直前 | production への影響。staging で 7 日 green が必須 |
| G4: 長命 Token 失効 | user | 24h 並行運用完了後、Cloudflare で旧 Token を失効する直前 | 失効後は 30 日間 OIDC 経路が単一の deploy 認証経路となる |

各ゲートで Claude Code は実行コマンドと予測影響を提示して停止する。

## DoD（index.md AC を Phase 1 チェックリストへ展開）

- [ ] AC1: `git grep 'secrets.CLOUDFLARE_API_TOKEN' .github/workflows/` がヒット 0
- [ ] AC2: `cf-token-lifetime.json` で lifetime ≤ 3600s を実測
- [ ] AC3: staging / production の trust policy が environment 単位で分離されていることを `trust-policy-design.md` と実環境設定で確認
- [ ] AC4: `old-token-revoked.json` に Cloudflare API のレスポンス（`revoked: true` 相当）が記録されている
- [ ] AC5: `oidc-rollback.md` が存在し、24h 限定再注入手順 / 1Password 退避先 / 30 日 green 後の完全廃止条件 が明記されている
- [ ] AC6: `cf-token-scope.json` で 4 scope のみが付与されていることを実測
- [ ] AC7: trust policy の subject claim が repo / branch / environment で最小化されており、fork PR 検証ログで漏洩しないことを確認
- [ ] AC8: `oidc-cf-audit-correlation.json` で GitHub OIDC subject と Cloudflare audit ログが job_id で突合できる
- [ ] AC9: `staging-7day.md` で 7 日連続 deploy green が記録されている

## 参照資料

- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/index.md`
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md`
- `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/phase-03.md`（Option D）
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `scripts/cf.sh`
- `CLAUDE.md`（cf.sh 経由必須 / `.env` op:// 参照）

## 多角的チェック観点

- 不変条件 #14: intermediate IdP の追加コスト・quota が free-tier 内
- 不変条件 #5: CI（admin 相当の権限を持つ）から production への副作用が短命 credential 経由のみ
- 信頼境界: subject claim の最小化、`*` ワイルドカード禁止、`pull_request_target` 不採用
- 可逆性: 24h 並行運用 / 30 日 green 後の完全廃止 / rollback runbook が揃う
- 苦戦箇所 5 項目すべてに DoD / 制約条件 / approval gate が紐付いている

## サブタスク管理

- [ ] 上流タスク仕様（unassigned-task の 6 項目完了条件 + 苦戦箇所 5 項目 + 実行概要 6 ステップ）を本 Phase に展開
- [ ] 13 evidence の保存パス命名規則を確定
- [ ] 4 approval gate（G1〜G4）が Phase 5 / Phase 8 / Phase 11 ランブックに貫通することを確認
- [ ] DERIV-03 の前提変更（rotation → trust policy 更新）を Phase 12 で更新する旨を引き渡し
- [ ] `outputs/phase-01/main.md` を作成

## 成果物

- `outputs/phase-01/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 上記 DoD（AC1〜AC9）に対する取得手段（コマンド / API / 保存先）が Phase 1 内で確定している
- approval gate 4 件の場所と実行コマンドが文書化されている
- 13 evidence パスの命名規則が Phase 2 設計に渡せる粒度で揃っている
- 苦戦箇所 5 項目が制約条件として網羅されている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 本タスクは U-FIX-CF-ACCT-01 本体の再実装ではなく DERIV-01 単独タスクとして scope が分離されている
- [ ] 本 Phase では workflow YAML 改修・実 deploy・commit・push・PR を実行していない

## 次 Phase への引き渡し

Phase 2（設計）へ以下を渡す:
- 13 evidence の保存パス命名規則
- 9 件の DoD（実行手段が紐付いた状態）
- 4 件の approval gate（G1: trust policy / G2: staging cutover / G3: production cutover / G4: 長命 Token 失効）
- 上流タスクの苦戦箇所 5 項目（Phase 3 でリスクマトリクスへ展開する元ネタ）
- intermediate IdP 候補 3 経路（AWS STS / 1Password Connect / Vault）と Phase 2 で比較すべき指標

## 実行タスク

- [ ] phase-01 の既存セクションに記載した手順・検証・成果物作成を実行する。

## 統合テスト連携

- 上流: U-FIX-CF-ACCT-01 Phase 11 verified（最小 4 scope の実測）
- 下流: U-FIX-CF-ACCT-01-DERIV-03（rotation runbook 改訂。本タスク完了で前提が rotation → trust policy 更新に変わる）
- 並走: DERIV-02（scope split） / DERIV-04（audit logs monitoring）
