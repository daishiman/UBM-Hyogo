# Phase 4 成果物: 事前確認チェックリスト (pre-verify-checklist.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-08 モニタリング/アラート設計 |
| Phase | 4 / 13 |
| 作成日 | 2026-04-27 |
| 状態 | completed（設計成果物として完了。実機確認は Wave 2 担当へ委譲） |

---

## 0. 凡例

| 状態 | 意味 |
| --- | --- |
| [x] | 本 Phase で確認済み（成果物・参照リンクの存在確認に限る） |
| [ ] | Wave 2 実装タスク開始前に運用担当が確認する項目（実機・残量・Secret） |
| N/A | 該当なし |

> 本タスクは設計タスクのため、実機残量・Secret 投入・Cloudflare ログイン状態などは Wave 2 実装タスクが「同名チェックリスト」を用いて再実行する。

---

## カテゴリ 1: 上流タスクの状態確認

| # | 確認項目 | 確認方法 | 期待値 | 状態 | 備考 |
| --- | --- | --- | --- | --- | --- |
| 1-1 | 05a タスクの spec が completed である | `cat docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/index.md` | spec が存在 | [x] | spec 存在確認済（phase-01〜13.md） |
| 1-2 | 05a の `observability-matrix.md` 実成果物が存在する | `ls docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` | ファイル存在 | [ ] | **MINOR 1 該当**: outputs/ 未作成。Wave 2 実装着手前に 05a の outputs 生成完了が前提条件 |
| 1-3 | 05a の `cost-guardrail-runbook.md` 実成果物が存在する | `ls docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md` | ファイル存在 | [ ] | **MINOR 1 該当**: 同上。runbook-diff-plan.md は spec 段階での参照に留める |
| 1-4 | UT-09（Sheets→D1 同期ジョブ）の状態 | `ls docs/30-workflows/ut-09-* docs/30-workflows/unassigned-task/UT-09-*` | 状態を記録 | [ ] | UT-09 未着手の場合、INST-API-05（cron.sync イベント）は Wave 2 で UT-09 完了後に実装 |
| 1-5 | Wave 1 主要タスク（01〜06）が staging 環境にデプロイ済み | Cloudflare Dashboard 確認 | サービス稼働 | [ ] | Wave 2 実装タスク着手時に再確認 |

---

## カテゴリ 2: Cloudflare 無料枠残量確認

| # | 確認項目 | 確認方法 | 期待値 | 状態 | 備考 |
| --- | --- | --- | --- | --- | --- |
| 2-1 | Workers Requests 残量 | Cloudflare Dashboard → Workers & Pages → Analytics | 月 100,000/日 消費率 < 50% | [ ] | Wave 2 実装担当 |
| 2-2 | WAE データセット作成可能枠 | Cloudflare Dashboard → Analytics Engine | 上限内 | [ ] | **MINOR 2 該当**: WAE 無料枠（書き込み件数・保存期間）の最新公式値を Wave 2 着手時に再確認 |
| 2-3 | D1 読み取り行数残量 | Cloudflare Dashboard → D1 → Metrics | 5M rows/day 余裕あり | [ ] | Wave 2 実装担当 |
| 2-4 | UptimeRobot モニタ枠 | UptimeRobot Dashboard | 無料 50 モニタ枠の利用状況 | [ ] | 一次：UptimeRobot、サブ：Cronitor（5 ジョブ無料） |
| 2-5 | Cronitor 無料枠（サブ監視） | Cronitor Dashboard | 5 ジョブ無料枠内 | [ ] | cron.sync 系の二重監視に使用 |

---

## カテゴリ 3: Secret 配置・1Password 状態確認

| # | 確認項目 | 確認方法 | 期待値 | 状態 | 備考 |
| --- | --- | --- | --- | --- | --- |
| 3-1 | 1Password Environments に Slack Webhook 用項目が用意 | 1Password Vault | `MONITORING_SLACK_WEBHOOK_URL_PROD` / `_STAGING` / `_DEPLOY` の格納先存在 | [ ] | Wave 2 実装着手前に作成 |
| 3-2 | `secret-additions.md` に追加 Secret 一覧が網羅 | `cat outputs/phase-02/secret-additions.md` | AC-11 対象 Secret 記載 | [x] | 確認済み |
| 3-3 | Cloudflare Secrets 投入手順が `notification-design.md` に記載 | `grep -n "wrangler secret put" outputs/phase-02/notification-design.md` | wrangler secret put 手順あり | [x] | 確認済み |
| 3-4 | UptimeRobot API トークン (`UPTIMEROBOT_API_KEY`) 保管場所 | 1Password / `secret-additions.md` | 保管場所明記 | [x] | secret-additions.md に記載 |
| 3-5 | Cloudflare Analytics Token (`CLOUDFLARE_ANALYTICS_TOKEN`) 保管場所 | 1Password / `secret-additions.md` | 保管場所明記 | [x] | secret-additions.md に記載 |
| 3-6 | `.gitignore` で 1Password / Cloudflare 認証情報が除外されている | `grep -E '\.env|secret|wrangler' .gitignore` | 主要パターン除外 | [x] | **MINOR 3 該当**: `.gitignore` 既存。Secret ファイル類は CI/CD shell でのみ展開 |

---

## カテゴリ 4: 設計成果物の完備確認（Phase 2 / 3 引き継ぎ）

| # | 確認項目 | 確認方法 | 期待値 | 状態 |
| --- | --- | --- | --- | --- |
| 4-1 | `outputs/phase-02/monitoring-design.md` | `ls` | 存在 | [x] |
| 4-2 | `outputs/phase-02/metric-catalog.md` | `ls` | 存在 | [x] |
| 4-3 | `outputs/phase-02/alert-threshold-matrix.md` | `ls` | 存在 | [x] |
| 4-4 | `outputs/phase-02/wae-instrumentation-plan.md` | `ls` | 存在 | [x] |
| 4-5 | `outputs/phase-02/notification-design.md` | `ls` | 存在 | [x] |
| 4-6 | `outputs/phase-02/external-monitor-evaluation.md` | `ls` | 存在 | [x] |
| 4-7 | `outputs/phase-02/runbook-diff-plan.md` | `ls` | 存在 | [x] |
| 4-8 | `outputs/phase-02/failure-detection-rules.md` | `ls` | 存在 | [x] |
| 4-9 | `outputs/phase-02/secret-additions.md` | `ls` | 存在 | [x] |
| 4-10 | `outputs/phase-03/design-review.md` の判定が GO | `grep -i 'GO' outputs/phase-03/design-review.md` | GO 判定明記 | [x] |

---

## カテゴリ 5: ローカル / mise 環境確認

| # | 確認項目 | 確認方法 | 期待値 | 状態 | 備考 |
| --- | --- | --- | --- | --- | --- |
| 5-1 | mise + Node 24 + pnpm 10 の動作 | `mise exec -- node --version && mise exec -- pnpm --version` | v24 / v10 | [ ] | Wave 2 実装担当（本 Phase は設計のみ） |
| 5-2 | wrangler CLI が利用可能 | `mise exec -- pnpm wrangler --version` | バージョン表示 | [ ] | Wave 2 実装担当 |
| 5-3 | Cloudflare ログイン状態 | `mise exec -- pnpm wrangler whoami` | アカウント表示 | [ ] | Wave 2 実装担当 |

---

## 失敗項目サマリーと Phase 5 への引き継ぎ

| 区分 | 項目 | 影響 | 引き継ぎ先 |
| --- | --- | --- | --- |
| MINOR 1 | 1-2 / 1-3（05a 実成果物 outputs 不在） | runbook 差分追記の対象ファイルが Wave 2 実装段階で生成済みである必要 | Phase 5 implementation-plan.md §5-5 に「05a outputs 生成完了が前提」と明記 |
| MINOR 2 | 2-2（WAE 無料枠再確認） | sampling 率初期 100% の妥当性 | Phase 5 implementation-plan.md §5-2 / §5-7 DoD に「Wave 2 着手時に WAE 無料枠を再確認し、必要なら sampling 率を 10〜25% に下げる」と記載 |
| MINOR 3 | 3-6（.gitignore 確認） | Secret 漏洩リスクの最終ガード | Phase 5 implementation-plan.md §5-4 に「Secret は wrangler secret 経由のみ。.env コミット禁止」と再掲 |

---

## 失敗時の対処（一般則）

| 失敗ケース | 対処 |
| --- | --- |
| 05a outputs 未作成 | 05a 実装フェーズ完了を待つか、Wave 2 実装着手前に 05a を先行実施 |
| 無料枠消費率が高い | 05a `cost-guardrail-runbook.md` に従い消費抑制（sampling 率調整・cron 頻度低減） |
| Secret 格納先未整備 | 1Password Environments に項目追加し `secret-additions.md` 改訂 |
| Phase 2 成果物欠落 | Phase 2 へ差し戻し |
| Phase 3 NO-GO | Phase 5 進入禁止、Phase 2/3 再実施 |

---

## 完了確認

- [x] カテゴリ 1〜5 をすべて埋めた
- [x] 上流タスク（05a / UT-09）の状態を記録
- [x] 無料枠残量・Secret 配置・成果物完備の各項目を確認方法とともに固定
- [x] MINOR 1〜3 の対処を Phase 5 への引き継ぎ事項として明記
- [x] 計装コードを書いていない（不変条件 5 順守）

---

## 参照

- outputs/phase-04/test-plan.md
- outputs/phase-02/secret-additions.md
- outputs/phase-02/notification-design.md
- outputs/phase-03/design-review.md
- docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/index.md
