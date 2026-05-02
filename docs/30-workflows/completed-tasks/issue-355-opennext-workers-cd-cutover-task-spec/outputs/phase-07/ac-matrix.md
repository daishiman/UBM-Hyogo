# AC ↔ テストケース ↔ evidence 対応マトリクス

本ファイルは Phase 7（AC マトリクス / カバレッジ確認）の正本マトリクスである。Phase 1 で確定した AC-1〜AC-6 と、Phase 4 で確定したテスト T-01〜T-42、Phase 11 で確定する evidence E-1〜E-5（NON_VISUAL）の三者対応を 1 表に集約する。

## 凡例

| 記号 | 意味 |
| --- | --- |
| 主 | 主検証テスト（AC を直接検証） |
| 補 | 補助検証テスト（周辺挙動 / 補強） |
| evidence | implementation follow-up 実行時に Phase 11 へ提出する成果物。本specではcontractのみ |

evidence 識別子（Phase 11 連携）:

- E-1: `outputs/phase-11/web-cd-deploy-log.md`（CD 成功ログ抜粋 / token mask 済）
- E-2: `outputs/phase-11/wrangler-deploy-output.md`（wrangler 出力 / VERSION_ID 含む / token mask 済）
- E-3: `outputs/phase-11/staging-smoke-results.md`（T-20〜T-30 PASS 表 / HTTP result excerpt）
- E-4: `outputs/phase-11/route-mapping-snapshot.md`（Workers / Pages 紐付け状態）
- E-5: `outputs/phase-11/rollback-readiness.md`（drill ログ / Pages resume 活性確認）

## マトリクス本体

| AC | 内容（要約） | 主検証 | 補助検証 | evidence | NG 連動 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | OpenNext build artefact（`.open-next/worker.js` + assets）が CD 上で生成される | T-01（`build:cloudflare` exit 0） / T-02（worker.js 生成） / T-03（assets 生成） | T-05（next.config.ts 非互換 key 不在） / T-25（S-06 静的アセット） | E-1 / E-2 | NG-2 |
| AC-2 | `.github/workflows/web-cd.yml` から `pages deploy` が消去され `deploy --env <stage>` 経路で staging / production が動作 | T-10（pages deploy 不在 grep） / T-11（`--env staging` / `--env production` 各 1 件以上） / T-12（dev merge → CD success） | T-15（observability tail 接続） | E-1 | NG-6 |
| AC-3 | UT-06 Phase 11 smoke S-01〜S-10 が staging URL で全 PASS（10/10） | T-20（S-01 トップ） / T-21（S-02 公開ディレクトリ） / T-22（S-03 認証導線） / T-23（S-04 マイページ） / T-24（S-05 管理 BO） / T-25（S-06 静的アセット） / T-26（S-07 404） / T-27（S-08 robots/sitemap） / T-28（S-09 OAuth callback） / T-29（S-10 Magic Link） / T-30（集約） | — | E-3 / E-4 | NG-1 / NG-4 |
| AC-4 | staging URL `*.workers.dev` が 200 / 3xx を返し、Web→API service binding 経由で連携が成立 | T-13（staging HTTP 200/3xx） / T-14（service binding 経由 API 応答） | T-15（observability tail） | E-3 | NG-3 / NG-4 |
| AC-5 | `apps/web/wrangler.toml` が OpenNext on Workers 形式（`main = ".open-next/worker.js"` / `pages_build_output_dir` 不在） | T-04（contract grep 1 行） | — | E-2 | NG-6 |
| AC-6 | cutover runbook（`outputs/phase-05/cutover-runbook.md`）が S1〜S6 の 6 セクションで完備 | T-42（`grep -cE '^## S[1-6]\.'` = 6） | T-40（rollback drill 実証） / T-41（Pages resume 活性確認） | E-5 | NG-5 / NG-6 |

## evidence ↔ AC 逆引き

| evidence | カバーする AC |
| --- | --- |
| E-1 web-cd-deploy-log | AC-1 / AC-2 |
| E-2 wrangler-deploy-output | AC-1 / AC-2 / AC-5 |
| E-3 staging-smoke-results | AC-3 / AC-4 |
| E-4 route-mapping-snapshot | AC-3 / AC-6 |
| E-5 rollback-readiness | AC-6 |

## NG ↔ AC 逆引き

| NG | 連動 AC |
| --- | --- |
| NG-1（smoke FAIL >= 1） | AC-3 |
| NG-2（OpenNext build artefact 欠損） | AC-1 |
| NG-3（service binding 解決失敗） | AC-4 |
| NG-4（staging 5xx 1 件以上 / 5 分 window） | AC-3 / AC-4 |
| NG-5（rollback drill 失敗） | AC-6 |
| NG-6（contract test 違反 T-04 / T-05 / T-10 / T-11 / T-42） | AC-2 / AC-5 / AC-6 |

## 異常系（A-1〜A-9）↔ AC 逆引き

| 異常系 | 連動 AC |
| --- | --- |
| A-1（build:cloudflare 失敗） | AC-1 |
| A-2（wrangler deploy authentication 失敗） | AC-2 / AC-4 |
| A-3（service binding 解決失敗） | AC-4 |
| A-4（staging 5xx） | AC-3 / AC-4 |
| A-5（custom domain 未付替 / traffic split） | AC-6 |
| A-6（Workers route 衝突） | AC-2 / AC-6 |
| A-7（Pages 配信残存） | AC-6 |
| A-8（rollback 不能） | AC-6 |
| A-9（contract test 違反） | AC-2 / AC-5 / AC-6 |

## カバレッジ完全性チェック

- [x] AC-1: 主 3 件 / 補 2 件 / evidence 2 件 — COVERED_BY_PLANNED_TEST
- [x] AC-2: 主 3 件 / 補 1 件 / evidence 1 件 — COVERED_BY_PLANNED_TEST
- [x] AC-3: 主 11 件（T-20〜T-30）/ 補 0 件 / evidence 2 件 — COVERED_BY_PLANNED_TEST
- [x] AC-4: 主 2 件 / 補 1 件 / evidence 1 件 — COVERED_BY_PLANNED_TEST
- [x] AC-5: 主 1 件 / 補 0 件 / evidence 1 件 — COVERED_BY_PLANNED_TEST（contract grep のみで 1 行検査）
- [x] AC-6: 主 1 件 / 補 2 件 / evidence 1 件 — COVERED_BY_PLANNED_TEST
- [x] 全 AC に NG 連動 ≥ 1
- [x] 全 AC に evidence ≥ 1
- [x] 全 AC に主検証 ≥ 1

## 補足

- screenshot は取得しない（NON_VISUAL 判定）
- production custom domain での AC-3 / AC-4 再評価は実装 follow-up issue 側で実施（本タスクは gate defined / pending follow-up execution）
- T-41 は Dashboard 目視確認のため evidence は runbook S6 への参照記載で代替

## 改訂履歴

| 日付 | 改訂内容 |
| --- | --- |
| 2026-05-02 | 初版（Phase 7 close-out にて確定） |
