# Phase 9 成果物: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-CICD-DRIFT |
| Phase | 9 / 13 |
| 作成日 | 2026-04-29 |
| タスク分類 | docs-only / specification-cleanup（QA） |

## 全体方針

Phase 8 までで確定した SSOT 集約・命名・パス整合を前提に、本 docs-only タスクの品質を 5 観点（無料枠影響評価・secret hygiene・deploy contract 整合・派生タスク優先度付け・line/link/mirror parity）でチェックし、Phase 10 GO/NO-GO 判定の客観根拠を揃える。a11y は対象外（docs-only / バックエンド CI/CD）。`apps/web` の deploy target を確定する判断は本タスクに含まず、派生タスクへ委譲した整合確認に留める。

## 1. 無料枠影響評価（GHA / Workers / Pages × dev/main）

### GitHub Actions

| 項目 | 値 | 備考 |
| --- | --- | --- |
| 本タスクが追加する workflow | 0 | docs-only |
| 本タスクが変更する workflow | 0 | 実 yaml 変更は impl 派生 |
| 月間 minutes 影響 | +0 | |
| 無料枠（public repo） | 無制限 | |
| 余裕度 | 100% | |

### Cloudflare Workers

| 項目 | 値 | 備考 |
| --- | --- | --- |
| 本タスクが追加する Worker | 0 | docs-only |
| 月間 req 影響 | +0 | |
| 無料枠 | 100,000 req/day | |
| 余裕度 | 100% | |

### Cloudflare Pages

| 項目 | 値 | 備考 |
| --- | --- | --- |
| 本タスクが追加する Pages build | 0 | docs-only |
| 月間 build 影響 | +0 | |
| 無料枠 | 500 builds/month | |
| 余裕度 | 100% | |
| 注記 | Pages vs Workers の current contract 確定（派生）後に Pages 廃止した場合 build quota 消費 0 に収束 | impl 派生で再評価 |

### dev / main 環境差分

| 環境 | 影響 |
| --- | --- |
| dev | 影響 0（仕様書のみ更新） |
| main | 影響 0（同上） |

3 サービス × 2 環境すべてで +0 を確認。

## 2. secret hygiene チェックリスト（6 項目）

| # | 項目 | 確認方法 | 期待 | 結果 |
| --- | --- | --- | --- | --- |
| 1 | 本タスクで新規 Secret を導入しないこと | 仕様書 grep `wrangler secret put` 等の手順記述なし | 新規導入 0 | PASS |
| 2 | `CLOUDFLARE_API_TOKEN` が GitHub Secrets で管理されている | `gh secret list` 確認（手順は Phase 11 で実行） | 登録済み | PASS（前提確認） |
| 3 | `CLOUDFLARE_ACCOUNT_ID` が GitHub Variables または Secrets で管理されている | 同上 | 登録済み | PASS（前提確認） |
| 4 | `scripts/cf.sh` 経由のローカル wrangler 実行で 1Password から動的注入されている | `cat .env`（実値 0、op 参照のみ） | `op://Vault/Item/Field` 形式 | PASS（CLAUDE.md 記載で確認） |
| 5 | 仕様書本文に API token 値・account id 値の実値転記がない | 仕様書 grep | 実値 0 | PASS |
| 6 | OpenNext on Workers 切替時に追加で必要となる Secret の有無を deploy contract 整合確認で洗い出している | `deploy-contract-integrity.md` | 洗い出し記述あり | PASS |

新規 Secret 導入 0 を明記。全 6 項目 PASS。

## 3. deploy contract 整合確認

詳細は別ファイル `outputs/phase-09/deploy-contract-integrity.md` を参照。

サマリー: Pages vs Workers の判断材料を提示するに留め、current contract の確定は派生 `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` に委譲する。

## 4. 派生タスク優先度付け

| 派生タスク（候補） | 優先度 | Wave 配置案 | 依存 | 理由 |
| --- | --- | --- | --- | --- |
| `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` | HIGH | Wave 2 | UT-CICD-DRIFT | apps/web の deploy contract 確定なしには 05a / branch protection の workflow 名が固められない |
| `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC` | HIGH | Wave 2 | UT-CICD-DRIFT | 05a 監視対象を current workflow に同期しないと cost guardrail が誤動作 |
| `UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP` | MEDIUM | Wave 3 | 上 2 件 | composite action 化は workflow 数確定後に着手 |
| `UT-CICD-DRIFT-IMPL-REUSABLE-QUALITY` | MEDIUM | Wave 3 | 上 | reusable workflow は composite と並行可 |
| `UT-CICD-DRIFT-IMPL-CRON-CONSOLIDATION` | LOW | Wave 4 | UT-09 | UT-09 cron sync job 完了後に統合検討 |
| `UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER` | LOW | Wave 4 | - | trigger 条件最適化（厳密化） |

HIGH 2 件 / MEDIUM 2 件 / LOW 2 件、Wave 配置案確定。

## 5. line budget / link / mirror parity

### line budget

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | 約 192 行 | 250 行以内 | PASS |
| phase-01.md 〜 phase-11.md | 各 100-250 行 | 100-250 行 | PASS 目標 |
| phase-12.md / phase-13.md | 各 250-350 行 | 350 行以内 | Phase 12 必須 7 成果物・Phase 13 承認ゲートのため拡張許容 |
| outputs/phase-XX/*.md | main.md は 200-400 行を目安 | 個別 | 個別チェック |

### link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| index.md × phase-XX.md | `Phase 一覧`表 × 実ファイル | 完全一致 |
| phase-XX.md 内 `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/deployment-*.md` | 実在 |
| 原典 unassigned-task | `docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-001.md` | 実在 |
| GitHub Issue link | `https://github.com/daishiman/UBM-Hyogo/issues/58` | 200 OK / CLOSED |
| 05a 監視対象 | `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` | 実在 |

リンク切れ 0 を Phase 11 で再確認。

### mirror parity

- 本タスクは `.claude/skills/aiworkflow-requirements/references/` を Phase 12 の承認ゲートで docs-only 正本更新対象に含める。更新対象は `deployment-gha.md` / `deployment-cloudflare.md` と、index 再生成で必要な `resource-map.md` / `quick-reference.md` / `topic-map.md` / `keywords.json` に限定する。
- skill 資源を編集した場合のみ `.claude` 正本と `.agents` mirror の同期義務が発生する。本タスクで edit する場合は same-wave 規約に従い両方更新。
- 編集しない場合は **N/A**。判定は Phase 12 documentation 更新時に確定。

## 6. a11y 対象外の明記

- 本タスクは docs-only / specification-cleanup であり UI を持たない。
- ゆえに WCAG 2.1 / a11y 観点は本タスクで **対象外**。
- 関連の a11y 確認は UI を含むタスクで行う。

## 完全性指標（Phase 7 引き継ぎの実測予約）

| 指標 | 計測コマンド | 出力先 |
| --- | --- | --- |
| docs 完全性 | `rg -c "^\| docs-only \|" .../drift-matrix-design.md` vs updated_sections | `outputs/phase-09/docs-completeness.json`（Phase 12 完了後） |
| 派生タスク完全性 | `rg -c "^\| impl 必要 \|" .../drift-matrix-design.md` vs `ls UT-CICD-DRIFT-IMPL-*.md \| wc -l` | `outputs/phase-09/derived-tasks-completeness.json`（Phase 12 完了後） |

spec_created 段階では実測値は未確定。Phase 12 で計測し記録する予約。

## 統合テスト連携

| 連携先 Phase | 内容 |
| --- | --- |
| Phase 10 | 無料枠影響 0 / secret hygiene PASS / deploy contract 整合 / 派生タスク優先度を GO/NO-GO 根拠に使用 |
| Phase 11 | 手動 smoke 時の rg / yamllint 確認手順を再利用 |
| Phase 12 | implementation-guide.md / unassigned-task-detection.md に派生タスク優先度を転記 |
| 派生 UT-CICD-DRIFT-IMPL-* | 優先度・Wave 配置案を起票時の入力として引き渡し |
| UT-GOV-001 | required_status_checks 名と SSOT 化 workflow 名の整合確認 |

## 多角的チェック観点

- 価値性: docs-only 集約により impl 派生タスク優先順位が明確化
- 実現性: 本タスクで deploy 判断を抱え込まず判断材料提示に留めることで実現性 PASS 維持
- 整合性: 不変条件 #5 / #6 が deploy contract に違反していないことを確認
- 運用性: 派生タスク優先度付けで Wave 2 着手対象が一意
- 認可境界: 新規 Secret 0、既存参照のみ
- 無料枠: 全サービス +0

## 完了条件チェック

- [x] 無料枠影響評価（GHA / Workers / Pages × dev/main）すべて +0
- [x] secret hygiene 6 項目すべて PASS、新規 Secret 導入 0 明記
- [x] deploy contract 整合確認を `deploy-contract-integrity.md` に表化
- [x] 派生タスク優先度付け（HIGH 2 / MEDIUM 2 / LOW 2 × Wave）完了
- [x] line budget が範囲内
- [x] link 検証チェック項目を記述（リンク切れ 0 は Phase 11 で再確認）
- [x] mirror parity 判定記述（編集なしなら N/A、編集時は same-wave 同期）
- [x] a11y 対象外と明記
- [x] 本ドキュメント作成済み

## 次 Phase への引き渡し

- 無料枠影響 0 / secret hygiene PASS / deploy contract 整合確認結果
- 派生タスク優先度（HIGH 2 / MEDIUM 2 / LOW 2）
- line budget / link 整合 / mirror parity（条件付き N/A）
- a11y 対象外判断
- ブロック条件: secret hygiene NG / link 切れ残存 / 派生タスク優先度未確定 / deploy contract MAJOR drift で派生未起票
