# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | CI/CD workflow topology and deployment spec drift cleanup (UT-CICD-DRIFT) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-29 |
| 前 Phase | 8 (DRY 化 / リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（QA） |

## 目的

Phase 8 までで確定した SSOT 集約・命名・パス整合を前提に、本 docs-only タスクの品質を 5 観点（無料枠影響評価・secret hygiene・deploy contract 整合・派生タスク優先度付け・line/link/mirror parity）でチェックし、Phase 10 の GO/NO-GO 判定に必要な客観的根拠を揃える。a11y は対象外（docs-only かつバックエンド CI/CD のため）と明記する。本タスクは `apps/web` の deploy target を確定する判断は含まず、派生タスクへ委譲した整合確認に留める。

## 実行タスク

1. 無料枠影響評価を実施する（完了条件: GitHub Actions / Cloudflare Workers / Cloudflare Pages の 3 サービス × dev/main 2 環境について、本タスクの仕様書更新で発生する追加コストが 0 であることを確認する記述が outputs/phase-09/main.md にある）。
2. secret hygiene チェックリストを作成し、`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` の参照状況を確認する（完了条件: 4 項目チェックすべてが PASS、新規 Secret 導入なしを明記）。
3. deploy contract 整合確認を行う（完了条件: `deployment-cloudflare.md` の Pages vs Workers 表記と `apps/web/wrangler.toml` 実体の差分が `outputs/phase-09/deploy-contract-integrity.md` に表化されている）。
4. 派生タスクの優先度付けを行う（完了条件: impl 派生タスク候補がすべて HIGH/MEDIUM/LOW で評価され、Wave 配置案が記述されている）。
5. line budget / link 検証 / mirror parity を確認する（完了条件: 各 phase-XX.md が原則 100-250 行、Phase 12/13 は承認ゲートと必須成果物列挙のため 350 行以内、index.md が 250 行以内、リンク切れ 0、mirror parity は N/A 判定）。
6. a11y 対象外を明記する（完了条件: 「docs-only / CI/CD 仕様整理のため a11y 対象外」と記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-08.md | SSOT 集約結果 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/index.md | Secrets / 関連サービス無料枠 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | secret hygiene 規約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | workflow topology SSOT |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | deploy contract SSOT |
| 必須 | apps/web/wrangler.toml / apps/api/wrangler.toml | deploy target 実体 |
| 参考 | https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration | GHA 無料枠公式 |
| 参考 | https://developers.cloudflare.com/workers/platform/limits/ | Workers 無料枠公式 |
| 参考 | https://developers.cloudflare.com/pages/platform/limits/ | Pages 無料枠公式 |

## 無料枠影響評価（サマリー）

本タスクは docs-only であり、新規 workflow / 新規 deploy / 新規 D1 アクセスを発生させない。よって追加コストは原則 0。詳細は `outputs/phase-09/main.md` に集約する。

### GitHub Actions

| 項目 | 値 | 備考 |
| --- | --- | --- |
| 本タスクが追加する workflow | 0 | docs-only |
| 本タスクが変更する workflow | 0（本タスクは仕様書側のみ更新） | 実 yaml 変更は impl 派生タスク |
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
| 注記 | Pages vs Workers の current contract 確定（派生タスク）後に Pages を廃止した場合、build quota 消費は 0 に収束する見込み | impl 派生で再評価 |

### dev / main 環境差分

| 環境 | 影響 |
| --- | --- |
| dev | 影響 0（仕様書のみ更新） |
| main | 影響 0（同上） |

## secret hygiene チェックリスト

| # | 項目 | 確認方法 | 期待結果 |
| --- | --- | --- | --- |
| 1 | 本タスクで新規 Secret を導入しないこと | 仕様書 grep `wrangler secret put` 等の手順記述なし | 新規導入 0 |
| 2 | `CLOUDFLARE_API_TOKEN` が GitHub Secrets で管理されていること | `gh secret list` で確認（手順は手動 smoke test Phase 11 で実行） | 登録済み |
| 3 | `CLOUDFLARE_ACCOUNT_ID` が GitHub Variables または Secrets で管理されていること | 同上 | 登録済み |
| 4 | `scripts/cf.sh` 経由のローカル wrangler 実行で 1Password から動的注入されていること | `cat .env`（実値 0、op 参照のみ） | op://Vault/Item/Field 形式 |
| 5 | 仕様書本文に API token 値・account id 値の実値転記がないこと | 仕様書 grep | 実値 0 |
| 6 | OpenNext on Workers 切替時に追加で必要となる Secret の有無を deploy contract 整合確認で洗い出していること | Phase 9 deploy-contract-integrity.md | 洗い出し記述あり |

## deploy contract 整合確認（apps/web）

| 観点 | `deployment-cloudflare.md` 表記 | `apps/web/wrangler.toml` 実体 | drift 種別 | 派生タスク化先 |
| --- | --- | --- | --- | --- |
| Pages 前提 | `pages_build_output_dir` を持つこと | 実値の有無を確認（Phase 11 smoke で grep） | docs-only or impl | 派生タスク `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` |
| OpenNext on Workers 前提 | `main = ".open-next/worker.js"` 等 | 同上 | 同上 | 同上 |
| Cron Triggers | `[triggers] crons = ['0 */6 * * *']` 形式 | 同上 | docs-only | impl 派生で wrangler.toml に追加が必要なら起票 |
| `[assets]` block | OpenNext on Workers 前提で必要 | 同上 | impl | 派生 |
| compatibility_date / compatibility_flags | SSOT 化対象 | 実値確認 | docs-only | `deployment-cloudflare.md` で SSOT 化 |

> 本表は判断材料の整理であり、current contract の確定は派生タスクで行う。本タスクではどちらを current にしても docs-only 部分が一貫することを優先する。

## 派生タスクの優先度付け

| 派生タスク（候補） | 優先度 | Wave 配置案 | 依存 | 理由 |
| --- | --- | --- | --- | --- |
| `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` | HIGH | Wave 2 | UT-CICD-DRIFT | apps/web の deploy contract が確定しないと 05a cost guardrail / branch protection の workflow 名が固められない |
| `UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP` | MEDIUM | Wave 3 | 上記 | composite action 化は workflow 数が確定してから着手 |
| `UT-CICD-DRIFT-IMPL-REUSABLE-QUALITY` | MEDIUM | Wave 3 | 上記 | reusable workflow は composite 化と並行可 |
| `UT-CICD-DRIFT-IMPL-CRON-CONSOLIDATION` | LOW | Wave 4 | 上記 | UT-09 cron sync job 完了後に統合検討 |
| `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC` | HIGH | Wave 2 | UT-CICD-DRIFT | 05a の監視対象を current workflow に同期しないと cost guardrail が誤動作 |
| `UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER` | LOW | Wave 4 | - | trigger 条件の最適化（厳密化） |

## a11y 対象外の明記

- 本タスクは docs-only / specification-cleanup であり、UI を持たない。
- ゆえに WCAG 2.1 / a11y 観点は本タスクで **対象外**。
- 関連の a11y 確認は UI を含むタスクで行う。

## line budget 確認

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | 約 192 行 | 250 行以内 | PASS |
| phase-01.md 〜 phase-11.md | 各 100-250 行 | 100-250 行 | PASS 目標 |
| phase-12.md / phase-13.md | 各 250-350 行 | 350 行以内 | Phase 12 必須7成果物と Phase 13 承認ゲートのため拡張許容 |
| outputs/phase-XX/*.md | 個別判定（main.md は 200-400 行を目安） | 個別 | 個別チェック |

> 仕様書（phase-XX.md）が 100 行未満の場合は内容不足、Phase 1〜11 が 250 行超または Phase 12/13 が 350 行超の場合は分割を Phase 10 で検討する。

## link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| index.md × phase-XX.md | `Phase 一覧` 表 × 実ファイル | 完全一致 |
| phase-XX.md 内の `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/deployment-*.md` | 実在確認 |
| 原典 unassigned-task | `docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-001.md` | 実在 |
| GitHub Issue link | `https://github.com/daishiman/UBM-Hyogo/issues/58` | 200 OK / CLOSED |
| 05a 監視対象 | `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` | 実在 |

## mirror parity（N/A 判定）

- 本タスクは `.claude/skills/aiworkflow-requirements/references/` を Phase 12 の承認ゲートで **docs-only 正本更新対象**に含める。更新対象は `deployment-gha.md` / `deployment-cloudflare.md` と、index 再生成で必要な `resource-map.md` / `quick-reference.md` / `topic-map.md` / `keywords.json` に限定する。
- skill 資源を編集した場合のみ `.claude` 正本と `.agents` mirror の同期義務が発生する。本タスクで edit する場合は同 wave 規約に従い両方を更新。
- 編集しない場合は **N/A**。判定は Phase 12 documentation 更新時に確定する。

## 実行手順

### ステップ 1: 無料枠影響評価
- GHA / Workers / Pages の 3 サービス × 2 環境で +0 を確認。
- outputs/phase-09/main.md に表化。

### ステップ 2: secret hygiene 6 項目を outputs/phase-09/main.md に記述
- 新規 Secret 導入 0 を明記。

### ステップ 3: deploy contract 整合確認
- `outputs/phase-09/deploy-contract-integrity.md` を作成。
- Pages vs Workers の判断材料を表化（current contract 決定は派生タスク）。

### ステップ 4: 派生タスク優先度付け
- HIGH / MEDIUM / LOW × Wave 配置案を表化。

### ステップ 5: line budget / link / mirror parity 検証
- `wc -l` で各 phase-XX.md を計測。
- リンク切れ 0 / mirror parity N/A を確認。

### ステップ 6: a11y 対象外の明記
- 「docs-only / CI/CD 仕様整理のため a11y 対象外」を記述。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 無料枠影響 0 / secret hygiene PASS / deploy contract 整合 / 派生タスク優先度を GO/NO-GO の根拠に使用 |
| Phase 11 | 手動 smoke test 時の rg / yamllint 確認手順として再利用 |
| Phase 12 | implementation-guide.md / unassigned-task-detection.md に派生タスク優先度付けを転記 |
| 派生 UT-CICD-DRIFT-IMPL-* | 優先度・Wave 配置案を起票時の入力として引き渡し |
| UT-GOV-001 | required_status_checks 名と SSOT 化された workflow 名の整合確認 |

## 多角的チェック観点

- 価値性: docs-only での集約により、impl 派生タスクの優先順位が明確化される。
- 実現性: 本タスク内で deploy 判断を抱え込まず、判断材料の提示に留めることで実現性 PASS を維持。
- 整合性: 不変条件 #5（D1 access apps/api 内閉鎖）/ #6（GAS prototype 非昇格）が deploy contract に違反していないことを確認。
- 運用性: 派生タスク優先度付けで Wave 2 着手対象が一意に決まる。
- 認可境界: 新規 Secret 導入 0、既存 Secret は参照のみ。
- 無料枠: 全サービスで +0、影響なし。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 無料枠影響評価 +0 確認 | 9 | spec_created | GHA / Workers / Pages |
| 2 | secret hygiene 6 項目 | 9 | spec_created | 新規導入 0 |
| 3 | deploy contract 整合確認 | 9 | spec_created | 別ファイル |
| 4 | 派生タスク優先度付け | 9 | spec_created | HIGH/MEDIUM/LOW × Wave |
| 5 | line/link/mirror parity | 9 | spec_created | リンク切れ 0 / N/A |
| 6 | a11y 対象外明記 | 9 | spec_created | docs-only |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリー（5 観点 + a11y 対象外） |
| ドキュメント | outputs/phase-09/deploy-contract-integrity.md | Pages vs Workers の判断材料・drift 表 |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] 無料枠影響評価（GHA / Workers / Pages × dev/main）がすべて +0 で記述
- [ ] secret hygiene 6 項目すべてが PASS、新規 Secret 導入 0 を明記
- [ ] deploy contract 整合確認が `deploy-contract-integrity.md` に表化されている
- [ ] 派生タスク優先度付けが HIGH/MEDIUM/LOW × Wave 配置案で完了
- [ ] line budget が Phase 1〜11 は 100-250 行、Phase 12/13 は 350 行以内に収まっている
- [ ] link 検証でリンク切れ 0
- [ ] mirror parity の判定が記述されている（編集なしなら N/A）
- [ ] a11y 対象外と明記
- [ ] outputs/phase-09/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物 2 ファイルが `outputs/phase-09/` 配下に配置予定
- 無料枠影響 0 が定量化されている
- secret hygiene 6 項目すべてチェック済み
- 派生タスク優先度付け完了
- a11y 対象外が明記されている
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - 無料枠影響 0（GHA / Workers / Pages すべて）
  - secret hygiene PASS（新規導入 0）
  - deploy contract 整合確認結果（Pages vs Workers の判断材料）
  - 派生タスク優先度付け（HIGH 2 件 / MEDIUM 2 件 / LOW 2 件）
  - line budget / link 整合 / mirror parity（条件付き N/A）
  - a11y 対象外の判断
- ブロック条件:
  - secret hygiene に NG が残る
  - link 切れが残る
  - 派生タスク優先度が確定していない
  - deploy contract 整合確認で MAJOR 級 drift が判明したのに派生タスク化されていない
