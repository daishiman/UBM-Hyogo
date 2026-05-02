# Phase 7: 統合戦略 / 既存システム連携

## Phase 概要

| 項目 | 内容 |
| --- | --- |
| 目的 | 本タスクの cutover を、既存 API CD（`apps/api`）/ UT-06 smoke / UT-28 / UT-29 / ADR-0001 / CLAUDE.md スタック表と矛盾なく統合する戦略を確定する |
| 入力 | Phase 1〜6 全成果物、`apps/api` 側 CD（既設）、UT-06 Phase 11 smoke S-01〜S-10、UT-28（apps/web 配信形態決定）、UT-29（post-deploy smoke healthcheck）、ADR-0001（OpenNext on Workers 採用）、CLAUDE.md スタック表 |
| 出力 | `outputs/phase-07/main.md`、`outputs/phase-07/integration-map.md`、`outputs/phase-07/cors-impact-assessment.md`、`outputs/phase-07/back-references.md` |
| 完了条件 | 既存 5 系統との整合点が明示 / role 分担表（本タスク vs UT-28 / UT-29）確定 / API 側 CORS 影響評価 / ADR-0001 / CLAUDE.md スタック表への back-reference 完了 |

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-355-opennext-workers-cd-cutover-task-spec |
| Phase 番号 | 7 / 13 |
| Phase 名称 | 統合戦略 / 既存システム連携 |
| Wave | 1 |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 6（レビュー / 異常系） |
| 次 Phase | 8（CI/CD 品質ゲート） |
| 状態 | spec_created |
| taskType | implementation |

## 既存システムとの整合マップ

| 系統 | 接続点 | 本タスクの扱い |
| --- | --- | --- |
| `apps/api` CD（既設 web-cd と並列） | GitHub Actions concurrency / token scope / 同 account 内 deploy | 並列 deploy を許容（concurrency.group は web-cd / api-cd で別 namespace）。`CLOUDFLARE_API_TOKEN` 同一値・scope 同一 |
| UT-06 Phase 11 smoke S-01〜S-10 | `outputs/phase-11/staging-smoke-results.md` の format | 本タスク T-20〜T-29 は UT-06 Phase 11 smoke を staging URL 流用、PASS evidence は同 format で `outputs/phase-11/staging-smoke-results.md` に記録 |
| UT-28（apps/web 配信形態決定） | wrangler.toml 最終形 / Pages project 廃止方針 | UT-28 が「OpenNext on Workers」決定の上流。本タスクは CD 反映 + cutover runbook を担う。Pages project の物理 delete は UT-28 / 後続タスクが扱う（本タスクは dormant 化まで） |
| UT-29（post-deploy smoke healthcheck） | smoke 自動化基盤 / healthcheck endpoint | 本タスク staging cutover 後の smoke は UT-29 自動化基盤が稼働していれば自動実行で代替可。手動実行と自動実行のいずれでも T-30 evidence が `staging-smoke-results.md` に揃えば AC-3 PASS |
| ADR-0001（OpenNext on Workers 採用） | 採用根拠 / `.open-next/worker.js` entrypoint | 本タスクは ADR-0001 を CD パイプラインへ反映する位置付け。runbook と PR description で ADR-0001 を back-reference |
| CLAUDE.md スタック表 | `apps/web` 配信形態の記述 | 「Cloudflare Workers + Next.js App Router via `@opennextjs/cloudflare`」既存記述と整合。本タスクで記述変更は不要 |

## role 分担（本タスク vs UT-28 / UT-29）

| 領域 | 本タスク | UT-28 | UT-29 | 備考 |
| --- | --- | --- | --- | --- |
| 配信形態の決定 | 受領 | owner | — | UT-28 で決定済 |
| `apps/web/wrangler.toml` 最終形 | 維持確認 | 設計 owner | — | UT-28 が設計、本タスクが反映運用 |
| `web-cd.yml` 改修 | owner | — | — | 本タスクの正本作業 |
| Pages project dormant 化 | owner（cutover 期間中） | — | — | runbook S6 |
| Pages project 物理 delete | — | owner（後続） | — | dormant 期間終了後 UT-28 が削除 |
| post-deploy smoke 自動化 | 手動 fallback | — | owner | UT-29 で自動化、本タスクは手動 evidence でも AC-3 PASS |
| custom domain 移譲 | owner（一回限り） | — | — | runbook S4 |
| rollback 戦略 | owner | — | — | 一次=wrangler / 二次=Pages resume |

## API 側 CORS / origin allowlist 影響評価

### 前提

- 本 cutover では `apps/web` の **public URL（custom domain）は不変**。staging のみ `*.workers.dev` を使うが、API 側は staging では同一 Worker namespace 内 service binding 経由で叩かれるため public URL の origin allowlist 影響は staging では発生しない。
- production custom domain は Pages → Workers の移譲のみで、ホスト名は変わらない。

### 評価結果

| 観点 | 評価 |
| --- | --- |
| `apps/api` の CORS allowlist | 変更不要（origin host 不変） |
| service binding 経路 | `API_SERVICE` binding は wrangler.toml 既設、Workers 配信下でも同一仕様で動作 |
| Auth.js callback URL | host 不変のため OAuth provider / Magic Link 設定変更不要 |
| Cookie domain | host 不変のため影響なし |
| Cloudflare Access / WAF rule | 既存 rule の host scope を維持。Pages project の rule attachment は cutover 後解除されることを Dashboard で確認 |

> CORS 変更が必要となるのは「production custom domain を変更する」「staging public URL を別ホストへ昇格させる」場合のみ。本タスク scope では発生しない。発生時は `apps/api/src/middleware/cors.ts` 相当を別タスクで改修。

## 並列 CI 実行 / 影響評価

| 観点 | 評価 |
| --- | --- |
| `web-cd` と `api-cd` の同時起動 | 別 workflow ファイル / 別 concurrency group のため衝突なし |
| Cloudflare API rate limit | 同一 account 内同時 deploy 2 件は rate limit 上問題なし（公開 quota 余裕あり） |
| `CLOUDFLARE_API_TOKEN` 共用 | scope に Workers Scripts:Edit + Pages:Edit が含まれていれば両 CD で共用可。本タスク runbook で scope 確認をセルフレビュー（Phase 6 セキュリティ観点 2） |
| GitHub Environment protection | `production` environment を web/api で共有する場合、Required reviewers が両方に効く。本タスクでは production 手動承認を推奨 |

## back-reference

| 参照先 | 記載場所 | 内容 |
| --- | --- | --- |
| ADR-0001 | `outputs/phase-05/cutover-runbook.md` 冒頭 / PR description | OpenNext on Workers 採用根拠を引用 |
| UT-28 | `outputs/phase-07/integration-map.md` / runbook S6 | 配信形態決定の上流タスク、Pages project 物理 delete の owner |
| UT-29 | `outputs/phase-07/integration-map.md` / runbook S2 | post-deploy smoke 自動化の owner、本タスク手動実行は fallback |
| UT-06 Phase 11 smoke | Phase 4 T-20〜T-30 仕様 / `outputs/phase-11/staging-smoke-results.md` | smoke S-01〜S-10 の流用元 |
| CLAUDE.md スタック表 | 本 Phase 7 整合マップ | 配信形態記述との整合確認（変更不要） |
| CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | runbook 全章 / Phase 5 検証コマンド一覧 | `bash scripts/cf.sh` 経由必須 |

## 統合 risk と緩和

| risk | 緩和 |
| --- | --- |
| API 側 deploy が遅延し service binding target 不在 | `apps/api-staging` / `apps/api-production` の deploy 完了を staging cutover 前に確認（runbook S2 操作 1 の prerequisite として記載） |
| UT-29 自動 smoke と本タスク手動 smoke の二重実行 | evidence file を `staging-smoke-results.md` に集約し、source（manual / UT-29-auto）を行内に注記 |
| Pages project 物理 delete のタイミング誤り | UT-28 owner と dormant 期間（2 週間）の合意を runbook S6 に記載、本タスクでは delete 実行せず |
| ADR-0001 と本実装の解釈差 | PR description で ADR-0001 リンクと採用判断を再掲し、レビュー時に整合確認 |

## CLAUDE.md スタック表との整合確認

| CLAUDE.md 記載 | 本タスク後の実態 | 整合 |
| --- | --- | --- |
| `Web UI: Cloudflare Workers + Next.js App Router via @opennextjs/cloudflare (apps/web)` | Workers 配信に統一 | OK |
| `D1 への直接アクセスは apps/api に閉じる（apps/web から直接アクセス禁止）` | service binding 経由のみ維持 | OK（不変条件 #5） |
| `ローカル秘密情報の正本: 1Password Environments` | `scripts/cf.sh` 経由で op 注入 | OK |
| `wrangler login で OAuth トークンを保持しない` | 本タスク runbook 全章で `bash scripts/cf.sh` 経由 | OK |

## 多角的チェック

- 価値性: 既存 5 系統との整合明示で incident リスクを最小化
- 実現性: 各系統の owner 分離が role 分担表で明確、本タスクは scope 内に閉じる
- 整合性: ADR-0001 / UT-28 / UT-29 / UT-06 / CLAUDE.md の 5 軸で矛盾なし
- 運用性: dormant 期間・手動 vs 自動 smoke の振り分けが runbook 経由で運用可能
- セキュリティ: API Token scope の共用前提を明示、scope 余剰は dormant 終了後に削減

## 完了条件

- [ ] 既存 6 系統との整合マップが確定
- [ ] role 分担表（本タスク / UT-28 / UT-29）が確定
- [ ] API 側 CORS / origin allowlist 影響評価で「変更不要」根拠が明示
- [ ] 並列 CI 実行影響評価が完了
- [ ] back-reference 6 件が記載
- [ ] 統合 risk 4 件と緩和策が確定
- [ ] CLAUDE.md スタック表との整合 4 行で確認

## 成果物

- `outputs/phase-07/main.md`
- `outputs/phase-07/integration-map.md`
- `outputs/phase-07/cors-impact-assessment.md`
- `outputs/phase-07/back-references.md`

## 次の Phase

Phase 8: CI/CD 品質ゲート（contract test の CI 投入 / production manual approval / required status checks）
