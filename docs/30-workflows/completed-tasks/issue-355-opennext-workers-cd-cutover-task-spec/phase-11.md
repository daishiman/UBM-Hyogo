# Phase 11: 受入検証（NON_VISUAL evidence）

## NON_VISUAL 縮約適用宣言【冒頭必須】

> **本 Phase は NON_VISUAL 縮約テンプレを適用する。**
>
> 適用根拠:
> - **visualEvidence = NON_VISUAL**（Phase 1 メタ情報で確定）
> - **taskType = implementation**（apps/web の Cloudflare 配信形態を Pages → OpenNext on Workers に切替える CD cutover 実装）
> - 本タスクは UI 変更ゼロ（既存ルート / 既存ビュー）のため screenshot 不要
> - evidence は CD 実行ログ・`wrangler deploy` 出力・staging smoke 結果・route mapping snapshot・rollback readiness で構成
>
> 参照: `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`

## template 完了 ≠ production 実測 PASS【境界宣言】

> 本仕様書段階（spec_created）では evidence ファイルの **配置設計と取得手順のみ**を確定する。
> evidence 実値は実装 follow-up タスク（CD 改修 PR）が staging / production で実 deploy を行った後に上書き反映する。
> 本 PR の AC 達成は「設計レベル PASS」であり、「production 実測 PASS」は実装 follow-up の責務。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | apps/web OpenNext Workers CD cutover (task-impl-opennext-workers-migration-001) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 受入検証（NON_VISUAL 縮約） |
| 作成日 | 2026-05-02 |
| 前 Phase | 10（セキュリティレビュー / Design GO 判定） |
| 次 Phase | 12（ドキュメント close-out） |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval_required | false（Phase 13 で commit/PR gate） |
| GitHub Issue | #355（CLOSED） |

## 目的

Phase 1 AC-1〜AC-6 / Phase 3 NO-GO 条件 NG-1〜NG-5 を「設計レベル PASS」として NON_VISUAL evidence で機械的に確認する。production cutover 実 deploy は実装 follow-up に委譲し、本 Phase は evidence 配置設計・取得手順・PASS 判定基準を確定する。

## screenshot 不要の N/A 理由テーブル

| シナリオ | screenshot 想定ケース | 本タスクでの状態 | N/A 理由 |
| --- | --- | --- | --- |
| UI 画面の視覚回帰 | apps/web の各ページレイアウト | 該当なし | route / page / component の変更ゼロ。配信形態（Pages → Workers）のみ変更 |
| ダッシュボード表示確認 | Cloudflare Workers Dashboard の deploy 履歴 | 代替 evidence で対応 | `wrangler deploy` 出力と `version_id` をテキスト記録。GUI 画像は不要 |
| エラーモーダル | 5xx 画面 | 該当なし | smoke S-01〜S-10 PASS が前提。FAIL 時は rollback で復旧 |
| ブラウザ動作確認 | ナビゲーション動線 | 代替 evidence で対応 | smoke 結果に HTTP status / response shape を記録 |
| 多デバイス確認 | mobile / desktop / tablet | 該当なし | UI 変更ゼロのため既存スクリーンショット資産を再利用しない |

> **結論**: 本 Phase は CD log / wrangler 出力 / smoke 結果 / route snapshot / rollback readiness の 5 種で完結。`outputs/phase-11/screenshots/` ディレクトリは作成しない。

## NON_VISUAL evidence 一覧（必須 3 + 補助 2）

| ID | evidence 名 | 取得手段 | 採取先 | 値の取り扱い | 必須/任意 |
| --- | --- | --- | --- | --- | --- |
| E-1 | CD 実行ログ抜粋（web-cd workflow run） | GitHub Actions UI から該当 run の log を抜粋（build:cloudflare step / wrangler deploy step） | `outputs/phase-11/web-cd-deploy-log.md` | API Token / OAuth secret は `<MASKED>`。worker 名 / VERSION_ID / build artifact 名は実値 | **必須** |
| E-2 | wrangler deploy 結果（version_id 付き） | CD log から `Uploaded ubm-hyogo-web-<stage>` 〜 `Current Version ID: <UUID>` 部を抜粋 | `outputs/phase-11/wrangler-deploy-output.md` | VERSION_ID 実値（rollback 起点として必要）。Account ID は `<MASKED>` | **必須** |
| E-3 | staging smoke S-01〜S-10 結果 | UT-06 Phase 11 smoke を staging URL に対し実行し PASS/FAIL を記録 | `outputs/phase-11/staging-smoke-results.md` | HTTP status / response 概要。Cookie / Authorization ヘッダは `<MASKED>` | **必須** |
| E-4 | route mapping snapshot | cutover 前後の Pages project route と Workers route を比較 | `outputs/phase-11/route-mapping-snapshot.md` | hostname / pattern のみ。Zone ID は `<MASKED>` | 補助 |
| E-5 | rollback readiness check | `wrangler rollback <VERSION_ID>` の dry を staging で 1 回実証 + Pages dormant 状態確認 | `outputs/phase-11/rollback-readiness.md` | VERSION_ID 実値 / dormant 状態フラグ | 補助 |

## E-1 web-cd-deploy-log.md（最低必須項目）

| 項目 | 必須 | 取得元 |
| --- | --- | --- |
| workflow run URL | yes | GitHub Actions の run permalink |
| トリガ commit SHA | yes | `${{ github.sha }}` |
| 対象 environment（staging / production） | yes | job 名 |
| `pnpm --filter @ubm-hyogo/web build:cloudflare` の exit code | yes | step 出力 |
| `.open-next/worker.js` 生成確認行 | yes | build step 出力 |
| `wrangler deploy --env <stage>` の exit code | yes | step 出力 |
| `Current Version ID` 行 | yes | wrangler deploy step 出力 |
| 所要時間（build + deploy） | no | run summary |

**PASS 判定**: build exit 0 / deploy exit 0 / `.open-next/worker.js` 生成確認行存在 / VERSION_ID 取得済。

### 取得コマンド（手動再現用）

```bash
# CI 上の自動実行が canonical。手動再現は以下:
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging
```

## E-2 wrangler-deploy-output.md（最低必須項目）

| 項目 | 必須 | 取得元 |
| --- | --- | --- |
| Worker script 名（`ubm-hyogo-web-staging` / `ubm-hyogo-web-production`） | yes | wrangler 出力 |
| `Total Upload` サイズ | yes | wrangler 出力 |
| `Worker Startup Time` | no | wrangler 出力 |
| `Your Worker has access to the following bindings` セクション（`ASSETS` / `API_SERVICE`） | yes | wrangler 出力 |
| `Current Version ID: <UUID>` | yes | wrangler 出力 |
| Custom Domains セクション（production のみ） | production のみ | wrangler 出力 |

**PASS 判定**: VERSION_ID が UUID 形式 / `ASSETS` binding / `API_SERVICE` binding が両方表示されている。

## E-3 staging-smoke-results.md（最低必須項目）

| Smoke ID | UT-06 Phase 11 流用 | 期待 | 記録項目 |
| --- | --- | --- | --- |
| S-01 | トップページ | 200 | URL / status / response 先頭 100 byte（HTML doctype 確認） |
| S-02 | 公開ディレクトリ | 200 | 同上 |
| S-03 | 認証導線 | 200 / 302 | redirect 先含む |
| S-04 | マイページ | 401 / 302（未認証時） | 認証 gate の正常動作 |
| S-05 | 管理 BO | 401 / 302（未認証時） | 同上 |
| S-06 | 静的アセット（`.open-next/assets/` 経由） | 200 + Cache-Control | アセット URL と header |
| S-07 | 404 ハンドリング | 404 / SPA fallback | `not_found_handling` 整合 |
| S-08 | robots / sitemap | 200 | content-type 確認 |
| S-09 | OAuth callback | 302 | redirect 整合 |
| S-10 | Magic Link redirect | 302 | redirect 整合 |

**PASS 判定**: 10/10 PASS。1 件でも FAIL なら NG-1 適用 → production cutover 保留。

### 取得コマンド（手動再現用）

```bash
# staging URL は wrangler deploy 完了時の "https://ubm-hyogo-web-staging.<account>.workers.dev"
for path in "/" "/directory" "/auth/signin" "/mypage" "/admin" "/_next/static/...." "/nonexistent" "/robots.txt" "/auth/callback/google" "/auth/magic-link"; do
  curl -sS -o /dev/null -w "%{http_code} %{url_effective}\n" "https://ubm-hyogo-web-staging.<account>.workers.dev${path}"
done
```

## E-4 route-mapping-snapshot.md（補助 / 最低必須項目）

| 項目 | 必須 | 値 |
| --- | --- | --- |
| cutover 前の Pages custom domain | yes | hostname のみ |
| cutover 前の Pages project deployment URL | yes | `*.pages.dev` |
| cutover 後の Workers custom domain | yes | hostname のみ |
| cutover 後の Workers script URL | yes | `*.workers.dev` |
| Pages project の dormant 状態（Pause Deployments 済か） | yes | bool |

**PASS 判定**: cutover 後に同一 custom domain が Workers script を指している / Pages project が dormant 化されている。

## E-5 rollback-readiness.md（補助 / 最低必須項目）

| 項目 | 必須 | 値 |
| --- | --- | --- |
| staging で `wrangler rollback <VERSION_ID>` を 1 回実証した記録 | yes | 旧 VERSION_ID と復旧後の VERSION_ID |
| Pages project の Resume Deployments UI 操作可能性確認（実行はしない） | yes | bool |
| runbook S5 / S6 が `outputs/phase-05/cutover-runbook.md` 内に存在 | yes | bool |

**PASS 判定**: 一次手段（wrangler rollback）が staging で実証可能 / 二次手段（Pages resume）が UI から到達可能 / runbook 章存在。

## AC × 達成状態（設計レベル PASS / 実測 PASS 分離）

| AC | 内容 | 設計レベル PASS（本 PR） | 実測 PASS（実装 follow-up） | 仕様確定先 |
| --- | --- | --- | --- | --- |
| AC-1 | `build:cloudflare` で `.open-next/worker.js` / `.open-next/assets/` 生成 | PASS（E-1 build step に出力確認行を要求する設計） | TBD（CI run の build log 実値） | E-1 |
| AC-2 | `web-cd.yml` deploy step が `wrangler deploy --env <stage>` に置換 | PASS（Phase 2 差分表で確定） | TBD（merged workflow の grep 実測） | Phase 2 web-cd-diff.md |
| AC-3 | UT-06 Phase 11 smoke S-01〜S-10 が staging で全件 PASS | PASS（E-3 配置設計） | TBD（staging 実測） | E-3 |
| AC-4 | staging URL 疎通 + service binding 経由 Web→API 連携 | PASS（E-1 binding 表示 + E-3 で代表 API 経由 page を含む） | TBD（実応答） | E-1 / E-3 |
| AC-5 | `wrangler.toml` から `pages_build_output_dir` 不在 + `main = ".open-next/worker.js"` | PASS（Phase 2 wrangler-final-form.md で固定） | TBD（merge 後 grep） | Phase 2 wrangler-final-form.md |
| AC-6 | cutover runbook が 6 セクション存在 | PASS（Phase 2 設計骨子で章立て確定） | TBD（Phase 5 本文成果物） | Phase 5 cutover-runbook.md |

## AC ↔ evidence 対応表

| AC | 主 evidence | 補助 evidence |
| --- | --- | --- |
| AC-1 | E-1 | — |
| AC-2 | E-1 / E-2 | — |
| AC-3 | E-3 | — |
| AC-4 | E-2（binding 表示）/ E-3（API 経由 page） | — |
| AC-5 | （Phase 2 wrangler-final-form.md grep） | — |
| AC-6 | （Phase 5 runbook 存在）| E-5 |

## NG（NO-GO）対応

| Phase 3 NO-GO | evidence で検出する手段 | 適用判定 |
| --- | --- | --- |
| NG-1: smoke 1 件以上 FAIL | E-3 集計 | 1 件でも FAIL → production cutover 保留 |
| NG-2: `.open-next/` 未生成 | E-1 build step 出力 | 生成確認行不在 → CD 改修 PR を merge しない |
| NG-3: `API_SERVICE` 解決失敗 | E-2 bindings セクション | binding 不在 → staging cutover 中止 |
| NG-4: 5xx 連発 / critical error | E-3 + Cloudflare observability ログ | 観測 → rollback 即実行 |
| NG-5: rollback 経路不実証 | E-5 | 不実証 → production cutover 保留 |

## handoff 設計（実測 PASS の引き渡し経路）

| 項目 | 値 |
| --- | --- |
| 受け側タスク | 実装 follow-up（CD 改修 PR + staging cutover + production cutover） |
| 起票方針 | 別 Issue で fork するか、本 spec PR の merge 後に新規 PR で `Refs #355` を参照（Issue #355 は CLOSED のため再 open しない） |
| 受け側完了後の evidence 反映先 | `outputs/phase-11/web-cd-deploy-log.md` / `wrangler-deploy-output.md` / `staging-smoke-results.md` を実値で上書き |
| 反映トリガ | 実装 follow-up PR の staging deploy 完了時 |
| AC 実測 PASS タイミング | 実装 follow-up PR merge + handoff PR merge 完了時 |

## セキュリティガード【厳守】

| 禁止事項 | 理由 | 検証方法 |
| --- | --- | --- |
| `.env` の中身を `cat` / `Read` / `grep` 等で表示 | AI コンテキスト混入防止 | grep `Read.*\.env` 0 件 |
| API Token / OAuth Token / Bearer / Cookie / Authorization ヘッダの実値転記 | 漏洩防止 | E-1〜E-3 の grep で 0 件 |
| `wrangler login` でローカル OAuth token 保持 | `.env` op 参照一本化 | 実装 follow-up review 時 |
| `bash scripts/cf.sh` 以外の `wrangler` 直呼び（runbook / spec 内） | CLAUDE.md 違反 | spec 内 grep で 0 件 |
| Zone ID / Account ID 実値転記 | 識別子経由の被害拡大防止 | E-1〜E-5 で `<MASKED>` 統一 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | NG-1〜NG-5 を E-1〜E-5 で機械検出 |
| Phase 10 | Design GO 判定の対策結果を本 evidence で確認 |
| Phase 12 | E-1〜E-5 設計を implementation-guide / system-spec-update に反映 |
| Phase 13 | E-1〜E-5 のパスを PR description Test plan に転記 |
| UT-06 Phase 11 smoke | S-01〜S-10 仕様を staging URL で再利用 |

## 多角的チェック観点

- 価値性: 設計レベル PASS で AC-1〜AC-6 の検証経路が確定
- 実現性: CD log / wrangler 出力 / smoke は CI 上で機械取得可能
- 整合性: 不変条件 #5（D1 直接アクセス禁止）は service binding 維持で gate
- 運用性: rollback 一次（wrangler）/ 二次（Pages dormant）が E-5 で実証
- Secret hygiene: API Token / OAuth は全 evidence で `<MASKED>`

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | NON_VISUAL 縮約適用宣言 | spec_created | 冒頭必須 |
| 2 | template 完了 ≠ 実測 PASS 境界宣言 | spec_created | |
| 3 | screenshot N/A 理由テーブル | spec_created | 5 シナリオ |
| 4 | E-1 web-cd-deploy-log 設計 | spec_created | 必須 |
| 5 | E-2 wrangler-deploy-output 設計 | spec_created | 必須 |
| 6 | E-3 staging-smoke-results 設計 | spec_created | 必須 |
| 7 | E-4 route-mapping-snapshot 設計 | spec_created | 補助 |
| 8 | E-5 rollback-readiness 設計 | spec_created | 補助 |
| 9 | AC ↔ evidence 対応表 | spec_created | 6 件 |
| 10 | NG-1〜NG-5 検出設計 | spec_created | 5 件 |
| 11 | handoff 設計 | spec_created | 実装 follow-up |
| 12 | セキュリティガード | spec_created | 5 禁止事項 |

## manual evidence（実測時に採取するログの placeholder）【必須】

| 項目 | 取得手段 | 採取先 | 値の取り扱い | 採取済 |
| --- | --- | --- | --- | --- |
| E-1 CD log | GitHub Actions run | outputs/phase-11/web-cd-deploy-log.md | secret mask | TBD（実測 PASS） |
| E-2 wrangler output | CD log 抜粋 | outputs/phase-11/wrangler-deploy-output.md | Account ID mask / VERSION_ID 実値 | TBD |
| E-3 smoke 結果 | curl one-liner | outputs/phase-11/staging-smoke-results.md | header mask | TBD |
| E-4 route mapping | Cloudflare Dashboard 目視 | outputs/phase-11/route-mapping-snapshot.md | Zone ID mask | TBD |
| E-5 rollback readiness | staging で wrangler rollback dry | outputs/phase-11/rollback-readiness.md | VERSION_ID 実値 | TBD |

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | AC 実測 PASS は本 PR スコープ外 | 機械検証の実証跡 | 実装 follow-up PR で反映 |
| 2 | NON_VISUAL のため screenshot 不要 | 視覚証跡なし | E-1〜E-5 で代替 |
| 3 | production custom domain 切替は手動 GUI 操作 | 自動化スコープ外 | runbook S4 で手順明示 |
| 4 | Pages project 物理削除は本タスクで実行しない | dormant 期間維持 | runbook S6 で 2 週間後の削除を別作業として委譲 |
| 5 | rollback 一次（wrangler）は staging のみ実証 | production 実証なし | RISK-4 受容、二次手段を併設で緩和 |
| 6 | Logpush 経路再構築は本タスク scope 外 | 観測継続性 | 別 unassigned タスクへ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| evidence | outputs/phase-11/web-cd-deploy-log.md | E-1 CD ログ抜粋 |
| evidence | outputs/phase-11/wrangler-deploy-output.md | E-2 deploy 結果と version_id |
| evidence | outputs/phase-11/staging-smoke-results.md | E-3 S-01〜S-10 結果 |
| 補助 | outputs/phase-11/route-mapping-snapshot.md | E-4 route mapping |
| 補助 | outputs/phase-11/rollback-readiness.md | E-5 rollback 実証 |
| サマリ | outputs/phase-11/main.md | Phase 11 サマリー / N/A 理由 / AC PASS |
| メタ | outputs/artifacts.json | Phase 11 状態反映 |

## 完了条件

- [ ] NON_VISUAL 縮約適用宣言が冒頭記載
- [ ] template 完了 ≠ 実測 PASS 境界宣言が記載
- [ ] screenshot N/A 理由テーブル（5 シナリオ）
- [ ] E-1〜E-3（必須）/ E-4〜E-5（補助）のパスが配置設計済み
- [ ] AC-1〜AC-6 の設計レベル PASS / 実測 PASS 分離表
- [ ] AC ↔ evidence 対応表が 6 件揃う
- [ ] NG-1〜NG-5 の検出経路が evidence にマップ済
- [ ] handoff 設計に実装 follow-up タスクの起票方針記載
- [ ] secret-mask の取り扱いが evidence ごとに明記
- [ ] `screenshots/` 未作成（NON_VISUAL 整合）
- [ ] 既知制限が 6 項目以上列挙

## 次 Phase への引き渡し

- 次 Phase: 12（ドキュメント close-out）
- 引き継ぎ事項:
  - E-1〜E-5 設計を Phase 12 implementation-guide / system-spec-update-summary に転記
  - 実装 follow-up タスク（CD 改修 + staging/production cutover）を Phase 12 unassigned-task-detection で formalize
  - AC 実測 PASS の handoff 経路を documentation-changelog に記録
- ブロック条件:
  - secret 実値が evidence に混入
  - `screenshots/` 誤作成
  - `wrangler` 直呼びサンプルが runbook / evidence に残存
