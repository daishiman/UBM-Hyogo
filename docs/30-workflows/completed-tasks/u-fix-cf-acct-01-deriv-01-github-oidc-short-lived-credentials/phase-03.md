# Phase 3: 設計レビュー — u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials

[実装区分: 実装仕様書]

判定根拠: Phase 2 で設計した CI 認証経路の置換は実 GitHub Actions / 実 intermediate IdP / 実 Cloudflare に副作用を発生させる。設計の信頼境界・lifetime・rollback・free-tier 影響を精査し GO/NO-GO を決めるため docs-only ではない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials |
| phase | 3 / 13 |
| wave | post-u-fix-cf-acct-01 |
| mode | parallel |
| 作成日 | 2026-05-06 |
| taskType | implementation-spec |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 設計が (a) 不変条件 / aiworkflow-requirements と整合し、(b) 上流タスク苦戦箇所 #1〜#5 を漏れなくカバーし、(c) リスクが識別・軽減されており、(d) 代替案より優位であり、(e) Phase 4 以降に渡せる粒度であることをレビューし GO/NO-GO を判定する。

## 不変条件チェック

| 条件 | チェック内容 | 判定 |
| --- | --- | --- |
| #14 Cloudflare free-tier | intermediate IdP（経路 B）の追加コストが 1Password 既存 seat 内で完結。AWS 等の追加 free-tier 圏外サービスを必須化していない | GO |
| #5 admin/CI 境界 | CI から production への副作用は短命 credential 経由のみ。長命 Token の常時 secret 化を撤廃する設計 | GO |
| 信頼境界（自タスク #1） | trust policy の subject claim が repo / branch / environment で最小化、`*` 禁止、`pull_request_target` 不採用 | GO |
| lifetime 上限（自タスク #2） | lifetime ≤ 1h を `cf.sh` 側で fail-fast 検証。実測 evidence で AC2 を満たす | GO |
| 可逆性（自タスク #3） | 24h 並行運用 + 30 日 green + 1Password 退避の 3 段で rollback 可能 | GO |
| 4 scope 継承（自タスク #4） | 短命 credential も U-FIX-CF-ACCT-01 で確定した 4 scope を継承 | GO |

## 上流タスク苦戦箇所 5 項目のレビュー観点展開

| # | 苦戦箇所 | Phase 2 設計での対応 | レビュー判定 |
| --- | --- | --- | --- |
| 1 | Cloudflare の OIDC 直接受入れ非対応 | intermediate IdP 経路 B（1Password Connect）を一次候補、A（AWS STS）/ C（Cloudflare 直接 API）を代替案として保留 | GO（Phase 5 PoC で B/C を再評価する条件付き） |
| 2 | 「short-lived」の lifetime 設計 | 1h 上限を `scripts/cf.sh` の `CF_AUTH_MODE=oidc-short-lived` モードで verify、re-issue 経路を retry step で確保 | GO |
| 3 | fork PR / `pull_request_target` 漏洩防止 | `id-token: write` を deploy job 限定、`pull_request_target` 不採用、reusable workflow からの呼び出しを Phase 11 で grep 検証 | GO |
| 4 | rollback 経路の確保 | 1Password Vault 退避 + 24h 限定再注入 runbook + 30 日 green 完全廃止条件 | GO |
| 5 | 4 scope を OIDC 後 credential にも継承 | trust policy 側で credential 発行時に 4 scope に固定、`cf-token-scope.json` で実測 | GO |

## リスクマトリクス

| # | リスク | likelihood | impact | mitigation |
| --- | --- | --- | --- | --- |
| R1 | trust policy が過剰許容（`*` 残存 / pull_request 許容） | 中 | 致命 | trust policy を grep で `*` / `pull_request` がヒットしないことを Phase 11 で確認、Phase 5 PoC で許容 subject の最小集合を実測 |
| R2 | 短命 credential lifetime が 1h を超過 | 低 | 高 | `scripts/cf.sh` の verify ステップで >3600s なら fail-fast、`cf-token-lifetime.json` で AC2 検証 |
| R3 | fork PR から OIDC token が漏洩 | 低 | 致命 | `pull_request_target` 不採用、`id-token: write` を deploy job 限定、Phase 11 fork PR 検証ログで実測 |
| R4 | intermediate IdP（1Password Connect）の障害で deploy 不能 | 中 | 中 | rollback runbook で 24h 限定再注入、IdP 障害時は emergency commit を別ブランチで運用 |
| R5 | 24h 並行運用中に新旧両経路で同時 deploy が発生 | 低 | 中 | 並行運用期間中は新経路のみで deploy する運用ルールを Phase 8 で明記、旧経路 workflow は手動発火専用にコメントアウト |
| R6 | 30 日 green 監視を忘れて 1Password から旧 Token を完全削除しないまま長期保管 | 中 | 中 | DERIV-03（rotation runbook 改訂）の TODO に「30 日 green 達成後に 1Password 完全削除」を必須項目として記載 |
| R7 | esbuild バージョン整合が CI モードで崩れる | 低 | 中 | `scripts/cf.sh` の `ESBUILD_BINARY_PATH` 解決ロジックを CI モードでも維持し Phase 11 dry-run で検証 |
| R8 | 旧 Token 失効後に rollback runbook が機能しない（再発行手順未文書化） | 低 | 致命 | Phase 12 runbook で「失効済み時の長命 Token 再発行手順」を必須項目として記載、admin 操作として明示 |
| R9 | OIDC subject claim と Cloudflare audit ログの突合が取れない（mapping table 不在） | 中 | 中 | intermediate IdP 側に `github_run_id → cf_token_id` の mapping を log で残し、Phase 11 突合スクリプトで検証 |
| R10 | staging / production の credential が混線（trust policy の environment 分離失敗） | 低 | 致命 | trust policy を物理的に別 Service Account / Role として分離、Phase 11 で staging credential が production scope を取得できないことを実測 |

## 代替案検討

| 代替案 | 内容 | 採否 | 根拠 |
| --- | --- | --- | --- |
| A1: 経路 B（1Password Connect）採用（採用） | Phase 2 推奨案 | 採用 | 既存の `op://` 運用と整合、CLAUDE.md 既定経路と矛盾しない、free-tier 内 |
| A2: 経路 A（AWS STS） | OIDC federation がネイティブ | 不採用（保留） | AWS アカウント運用が増え、free-tier 圏外コストが Lambda 呼び出しに応じて発生。規模拡大時の選択肢 |
| A3: 経路 C（Cloudflare 直接の短命 Token API） | 中継不要 | 不採用（要 PoC） | 2026-05 時点で公式の OIDC ネイティブ短命 Token 発行 API は限定的。Phase 5 PoC で実現性が立証されれば C に切替検討 |
| A4: 長命 Token 維持（OIDC 化を行わない） | 現状維持 | 不採用 | 上流 issue #405 / DERIV-01 のスコープに反する |
| A5: deploy を手動運用化（CI から外す） | operator 端末から `bash scripts/cf.sh deploy` 実行 | 不採用 | 自動 deploy の利便性を毀損し、09a / 09c の deploy 実行と整合しない |

採用案 A1 は CLAUDE.md（Cloudflare 系 CLI 実行ルール / `.env` 運用ルール）と整合する。

## aiworkflow-requirements との整合確認

- `references/deployment-secrets-management.md`: 本タスクで `CLOUDFLARE_API_TOKEN` 長命版を「廃止済み」にマークする更新を Phase 12 で実施
- `references/deployment-gha.md`: `permissions: id-token: write` の付与ルールと trust policy subject 最小化を反映する更新を Phase 12 で実施
- `references/task-workflow-active.md`: Phase 11 完了後に本タスクを「実行済み状態」に更新する指示を Phase 12 へ引き渡し
- `aiworkflow-requirements/indexes`: references 更新後に `pnpm indexes:rebuild` を Phase 13 PR 作成時に実行することを最終チェック

## 設計の盲点レビュー（Phase 2 への補強指示）

| 観点 | 指摘 | Phase 5/11 への反映指示 |
| --- | --- | --- |
| reusable workflow からの呼び出し | 他 workflow から `uses: ./.github/workflows/deploy-*.yml` で呼び出されている場合、`id-token` 継承挙動を確認する必要 | Phase 11 で `git grep 'uses: \./\.github/workflows/deploy'` を実行し、reusable 化されていないことを確認 |
| `CLOUDFLARE_ACCOUNT_ID` の出所 | 非機密だが GitHub Variables からの取得を維持する必要 | Phase 5 ランブックで `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` 参照を明記 |
| short-lived Token re-issue の連鎖 | 1h を超える long-running deploy（D1 migration 大量適用等）で Token expired の挙動 | Phase 6 異常系検証で `expired token` 受領時の自動 re-issue / fail-fast の挙動を定義 |
| GitHub Environments の required reviewers | production environment は必ず required reviewers を設定（依存条件） | Phase 11 で `gh api repos/.../environments/production` を確認 |
| 1Password Service Account の seat 消費 | seat 不足だと CI 経路が成立しない | Phase 5 PoC 開始前に 1Password 管理画面で seat 残を確認 |
| `mise exec` の CI runner での挙動 | `ubuntu-latest` runner で `mise install` の cold start コスト | Phase 5 で `setup-mise` action 等のキャッシュ戦略を確認 |

## GO/NO-GO 判定

- 不変条件: 全項目 GO
- 苦戦箇所 #1〜#5: 全て設計上の打ち手あり
- リスク R1〜R10: 全て mitigation 設定済み
- 代替案: A1 採用妥当、A2/A3 は再評価条件あり
- aiworkflow-requirements 整合: 確認済み（Phase 12 で正本更新）
- 設計盲点 6 項目: Phase 5 / 11 への補強指示として確定

判定: **GO**（Phase 4 テスト戦略へ進む）

## 参照資料

- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-01.md`
- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/phase-02.md`
- `docs/30-workflows/u-fix-cf-acct-01-deriv-01-github-oidc-short-lived-credentials/index.md`
- `docs/30-workflows/unassigned-task/U-FIX-CF-ACCT-01-DERIV-01-github-oidc-short-lived-credentials.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-gha.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## 統合テスト連携

- 上流: U-FIX-CF-ACCT-01 Phase 11 verified
- 下流: DERIV-03 rotation runbook 改訂（本タスク GO 判定が DERIV-03 の前提を構成）
- 並走: DERIV-02 / DERIV-04

## 多角的チェック観点

- 苦戦箇所 5 項目すべてに設計上の打ち手と Phase 11 検証手段が紐付いている
- リスク mitigation が「先送り」になっていない（CONST_007）
- 代替案 A2/A3 の再評価条件（Phase 5 PoC）が明示されている
- subject claim の最小化が宣言的に検証可能
- 30 日 green 監視を忘れない仕組みが DERIV-03 の TODO で担保される

## サブタスク管理

- [ ] 不変条件 6 項目を判定
- [ ] 苦戦箇所 5 項目をレビュー観点に展開
- [ ] リスク 10 件にすべて mitigation を割当
- [ ] 代替案 5 件を比較し A1 採用を確定
- [ ] aiworkflow-requirements 整合確認 4 件
- [ ] 設計盲点 6 項目を Phase 5 / 11 へ引き渡し条件として記録
- [ ] `outputs/phase-03/main.md` を作成

## 成果物

- `outputs/phase-03/main.md`

## 完了条件

- [ ] 本 Phase の成果物と検証結果を確認済み。

- 不変条件 / 苦戦箇所 / リスク / 代替案 / 整合 の 5 軸すべてに判定が記載されている
- GO/NO-GO 判定の根拠が明文化されている
- Phase 4 以降への引き渡し項目が evidence path / approval gate / 補強指示 の 3 種で揃っている

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] 設計レビューで NO-GO 要素が残っていない（残っている場合は Phase 2 に差し戻し）
- [ ] 本 Phase で workflow YAML 改修・実 deploy・commit・push・PR を実行していない

## 次 Phase への引き渡し

Phase 4（テスト戦略）以降に渡す:
- evidence path 一覧（13 件）と命名規則
- approval gate 4 件（G1〜G4）
- 設計盲点 6 項目（reusable workflow grep / `CLOUDFLARE_ACCOUNT_ID` 出所 / re-issue 連鎖 / required reviewers 確認 / 1Password seat 残 / mise キャッシュ）
- リスク mitigation のうち Phase 11 実行時に再確認が必要な項目（R1 trust policy grep / R3 fork PR 検証 / R10 environment 分離実測）
- 代替案 A2/A3 の再評価条件（Phase 5 PoC 実施タイミング）

## 実行タスク

- [ ] phase-03 の既存セクションに記載した手順・検証・成果物作成を実行する。
