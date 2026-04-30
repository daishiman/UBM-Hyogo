# Phase 9: 品質保証 / 5 点同期チェック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 direction reconciliation（task-ut09-direction-reconciliation-001） |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 / 5 点同期チェック |
| 作成日 | 2026-04-29 |
| 前 Phase | 8 (DRY 化 / 重複解消) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク分類 | docs-only / direction-reconciliation（QA / contract sync） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 8 で確定した「採用 base case = 案 a (採用 A / Forms 分割方針)」整合の正本表記を前提に、本タスクの品質保証を以下の 3 軸で行う。

1. **aiworkflow-requirements との整合検証**（topic-map / quick-reference / resource-map / keywords / indexes の 5 同期点）
2. **5 文書 contract 同期検証**（legacy umbrella / 03a / 03b / 04c / 09b の reconciliation 結論との整合）
3. **3 点一致確認**（ledger / Secret / endpoint の正本登録が単一方針で一致）

a11y / 無料枠 / coverage 閾値は本タスクで対象外（docs-only かつ実装を伴わないため）と明記する。SKILL.md / topic-map 等の **更新は別タスク** とし、本 Phase は drift 検出と差分マッピングまで。

## 実行タスク

1. aiworkflow-requirements との 5 同期点（topic-map / quick-reference / resource-map / keywords / indexes）の現行登録 vs reconciliation 結論の差分を確認する（完了条件: 5 点すべてに「drift あり」「drift なし」「N/A」のいずれかを付与）。
2. 5 文書（legacy umbrella / 03a / 03b / 04c / 09b）の contract 同期チェックを実施する（完了条件: 5 文書 × 観点（endpoint / ledger / Secret / Cron / responsibility）でマトリクス完成）。
3. 3 点一致確認（ledger / Secret / endpoint）を行う（完了条件: 各 3 点について「現行登録」「reconciliation 結論」「一致 / 不一致」を表化）。
4. legacy umbrella タスクとの整合検証を行う（完了条件: current 方針記述との差分 0 を確認）。
5. a11y / 無料枠 / coverage 閾値の対象外宣言を記述する（完了条件: 対象外理由 3 件記述）。
6. line budget / link 検証を実施する（完了条件: 全 phase が 100-300 行範囲内 / リンク切れ 0）。
7. outputs/phase-09/main.md と outputs/phase-09/contract-sync-check.md の 2 ファイルに分離して記述する（完了条件: main = QA サマリー / contract-sync-check = 5 文書 × 観点マトリクス）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-08.md | DRY 化済み正本表記 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-02.md | 5 文書同期チェック手順の起点 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-03.md | base case = 案 a / 着手可否ゲート |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/index.md | AC-1〜AC-14 / Secrets 一覧 |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | current 方針正本 |
| 必須 | docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md | 03a 正本 |
| 必須 | docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md | 03b 正本 |
| 必須 | docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md | 04c 正本 |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md | 09b 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | endpoint 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | ledger 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md / .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Secret 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/topic-map.md | topic-map 同期点 |
| 必須 | .claude/skills/aiworkflow-requirements/quick-reference.md | quick-reference 同期点 |
| 必須 | .claude/skills/aiworkflow-requirements/resource-map.md | resource-map 同期点 |
| 必須 | .claude/skills/aiworkflow-requirements/keywords.md | keywords 同期点 |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/ | indexes 同期点 |
| 参考 | .github/workflows/verify-indexes.yml | indexes drift gate |
| 参考 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-09.md | 5 点同期 お手本 |

## aiworkflow-requirements 5 同期点の検証

| # | 同期対象 | チェック方法 | 期待結果（案 a 採用時） | 本タスクでの扱い |
| --- | --- | --- | --- | --- |
| 1 | topic-map.md | reconciliation / sync 関連 topic（admin-sync / forms-sync / sheets-sync）の登録確認 | Forms 分割方針 topic が正本、Sheets 直接実装系は legacy 表記 | drift 検出のみ。更新 PR は別タスク |
| 2 | quick-reference.md | sync 系 quick-reference の short answer | 「Forms API 上流 / 2 endpoint / `sync_jobs` ledger」が 1 行で読める | drift 検出のみ |
| 3 | resource-map.md | sync 系正本ファイルへのナビゲーション | legacy umbrella / 03a / 03b / 04c / 09b への path が登録済 | drift 検出のみ |
| 4 | keywords.md | reconciliation / sync_jobs / GOOGLE_FORM_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY 等の検索キー | 主要キーワードがヒット可能 | drift 検出のみ |
| 5 | indexes/ | `pnpm indexes:rebuild` 後の生成物に drift がないか | `verify-indexes-up-to-date` job が green | 本タスクは仕様書のみ。実 rebuild は別タスク（`pnpm indexes:rebuild` は drift 検出時のみ実行） |

> SKILL.md は本タスクで更新不要（参照のみ）。topic-map / quick-reference / resource-map / keywords の実更新は reconciliation 結論を反映する別タスクで実施。本 Phase は **差分マッピングまで**。

## 5 文書 contract 同期チェック マトリクス

> 詳細は `outputs/phase-09/contract-sync-check.md` に転記。本仕様書はサマリー。

| 文書 | endpoint 観点 | ledger 観点 | Secret 観点 | Cron 観点 | responsibility 観点 |
| --- | --- | --- | --- | --- | --- |
| legacy umbrella spec | `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint 維持 | `sync_jobs` 単一維持 | Forms 系 SA secret 維持 | 09b runbook 経路維持 | 旧 UT-09 を direct implementation 化しない方針維持 |
| 03a/index.md | `/admin/sync/schema` 担当 | `sync_jobs` 書き込み | `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`（forms.get） | scheduled で 6h or 1h | Forms schema sync 専任 |
| 03b/index.md | `/admin/sync/responses` 担当 | `sync_jobs` 書き込み + responses 更新 | `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`（forms.responses.list） | scheduled で 1h | Forms response sync 専任 |
| 04c/index.md | 2 endpoint の認可境界（`app.use('/admin/sync*', adminAuth)`） | 各 endpoint で `sync_jobs` row 作成 | `SYNC_ADMIN_TOKEN` Bearer + admin role | N/A | admin endpoint 契約の正本 |
| 09b/index.md | scheduled handler が 2 endpoint を順次叩く / 直接 `runSync` を呼ぶ | `sync_jobs` 観測 | N/A（runtime は env binding） | Cron schedule 正本（dev 6h / prod 1h 等） | cron + monitoring + runbook |

> 各セルの「現行登録 vs reconciliation 結論の差分」を `contract-sync-check.md` で詳細化。差分が残る場合は別タスク（実 PR）で解消。

## 3 点一致確認

| 軸 | 現行登録（aiworkflow-requirements 正本） | reconciliation 結論（案 a） | 一致 / 不一致 | 不一致時の処置 |
| --- | --- | --- | --- | --- |
| ledger | `sync_jobs`（database-schema.md） | `sync_jobs` 単一 | 一致想定 | `sync_locks` / `sync_job_logs` が登録されていれば別タスクで撤回 |
| endpoint | `POST /admin/sync/schema` + `POST /admin/sync/responses`（api-endpoints.md） | 2 endpoint | 一致想定 | 単一 `/admin/sync` が登録されていれば別タスクで撤回 |
| Secret | `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` + `SYNC_ADMIN_TOKEN` + `ADMIN_ROLE_EMAILS`（environment-variables.md / deployment-cloudflare.md） | Forms 系 + 共通 | 一致想定 | `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` が「正本」扱いならば別タスクで「廃止候補」へ降格 |

> 「一致想定」は本タスク作成時点の前提。実検証は Phase 9 実行時に references を grep で確認し、差分があれば `contract-sync-check.md` に記録、別タスクへ register。

## legacy umbrella タスクとの整合検証

| 観点 | legacy umbrella spec の記述 | 本 reconciliation の結論 | 整合判定 |
| --- | --- | --- | --- |
| 旧 UT-09 の扱い | direct implementation にしない | direct implementation 化記述を撤回 | 一致 |
| 上流 API | Forms API（`forms.get` / `forms.responses.list`） | Forms API | 一致 |
| endpoint 数 | 2 endpoint（`/admin/sync/schema` + `/admin/sync/responses`） | 2 endpoint | 一致 |
| ledger | `sync_jobs` | `sync_jobs` | 一致 |
| 撤回対象 | Sheets 系実装 | Sheets 系実装 | 一致 |
| 移植対象（共通項） | D1 contention mitigation 知見 | D1 contention mitigation 5 知見 | 一致 |

> 整合判定がすべて「一致」であれば、Phase 10 GO 条件 #6（current facts 5 文書からの逸脱が 0 件）を満たす。

## 対象外宣言

| 観点 | 対象外理由 |
| --- | --- |
| a11y（WCAG） | 本タスクは reconciliation の docs-only。UI を持たないため WCAG 観点は本タスクで対象外。admin UI 側の a11y は 04c / 別 UT で扱う。 |
| 無料枠見積もり | 本タスクは仕様書のみ。Workers / D1 / API quota への新規負荷は発生しない。Sheets 系撤回 / Forms 系維持の負荷試算は採用方針 a 採用後の別タスクで実施（現状無料枠余裕は 03a / 03b / 09b で確認済）。 |
| coverage 閾値 | 本タスクはコード変更を伴わないため Vitest / coverage 閾値は対象外。実装着手時のテスト戦略は別タスク（03a / 03b 実装フェーズ）で扱う。 |

## line budget 確認

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | ≤ 250 行 | 250 行以内 | PASS |
| phase-01.md 〜 phase-13.md | 各 100-300 行 | 100-300 行 | 全 PASS |
| outputs/phase-XX/*.md | main は 200-400 行 | 個別 | 個別チェック |

## link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| index.md × phase-XX.md | `Phase 一覧` × 実ファイル | 完全一致 |
| phase-XX.md 内 `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/*.md` | 実在 |
| 5 文書同期対象 path | legacy umbrella / 03a / 03b / 04c / 09b | 実在 |
| 原典 unassigned-task | `../unassigned-task/task-ut09-direction-reconciliation-001.md` | 実在 |
| GitHub Issue | `https://github.com/daishiman/UBM-Hyogo/issues/94` | CLOSED でも 200 OK |

## CI ゲート（本タスク該当分）

| Gate | 確認方法 | パス条件 |
| --- | --- | --- |
| verify-indexes | `.github/workflows/verify-indexes.yml` で `.claude/skills/aiworkflow-requirements/indexes` drift 検出 | 本タスクで indexes 直接更新がない場合は green を維持。drift 検出時は `mise exec -- pnpm indexes:rebuild` を別タスクで実行 |
| typecheck / lint / vitest / build | 本タスクはコード変更なし | 既存 CI green を維持 |

## 実行手順

### ステップ 1: aiworkflow-requirements 5 同期点 grep

- `rg 'sync_jobs|sync_locks|sync_job_logs|admin/sync|GOOGLE_(SHEETS|FORMS)_SA_JSON' .claude/skills/aiworkflow-requirements/` で現行登録を抽出。
- topic-map / quick-reference / resource-map / keywords / indexes の 5 同期点について差分を判定。

### ステップ 2: 5 文書 contract 同期チェック

- legacy umbrella / 03a / 03b / 04c / 09b それぞれの index.md を grep し、endpoint / ledger / Secret / Cron / responsibility の 5 観点で reconciliation 結論との差分を確認。
- マトリクスを `contract-sync-check.md` に固定。

### ステップ 3: 3 点一致確認

- references の現行登録と reconciliation 結論を表化。
- 不一致があれば別タスクへの register 候補に追加。

### ステップ 4: legacy umbrella 整合検証

- legacy umbrella spec の方針記述を逐条確認し「一致」が 6 観点すべてで揃うことを確認。

### ステップ 5: 対象外 / line budget / link / CI ゲート

- 対象外理由 3 件を main.md に記述。
- line budget / link / verify-indexes ゲートを確認。

### ステップ 6: 成果物 2 ファイル分離

- `outputs/phase-09/main.md`: QA サマリー（5 同期点 / 3 点一致 / 対象外 / line budget / link / CI ゲート）
- `outputs/phase-09/contract-sync-check.md`: 5 文書 × 5 観点 contract 同期マトリクス詳細

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 5 同期点 / 3 点一致 / contract sync 結果を GO/NO-GO の根拠 |
| Phase 11 | 整合性検査ログ（grep / 仕様書 diff スキャン）として代替 evidence に再利用 |
| Phase 12 | drift 検出結果を unassigned-task-detection / documentation-changelog に register |
| 別タスク | references / indexes 更新 PR、5 文書同期更新 PR の入力に渡す |

## 多角的チェック観点

- 価値性: 5 同期点 + 3 点一致確認で reconciliation 結論の正本伝播が保証されるか。
- 実現性: docs-only 範囲で grep + 表化のみで完結するか。
- 整合性: 不変条件 #1/#4/#5/#6 が 5 文書同期で全 satisfied。
- 運用性: 別タスクへの引き継ぎ（references 更新 PR / indexes rebuild PR）が明示されているか。
- 認可境界: `/admin/sync*` の 2 endpoint 認可境界が 04c と一致しているか。
- ledger 一意性: `sync_jobs` 単一が 5 文書すべてで保持されているか。
- Secret hygiene: Forms 系正本 / Sheets 系廃止候補の区別が environment-variables.md / deployment-cloudflare.md と整合するか。
- staging smoke 表記: pending / PASS / FAIL の区別が共通項として保持されているか。
- docs-only 境界: indexes 実 rebuild / references 実 PR が別タスクであることが明記されているか。
- legacy umbrella 整合: 6 観点すべて一致が確認されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | aiworkflow-requirements 5 同期点 drift 検証 | 9 | spec_created | 更新 PR は別タスク |
| 2 | 5 文書 contract 同期チェック | 9 | spec_created | 5 文書 × 5 観点 |
| 3 | 3 点一致確認（ledger / Secret / endpoint） | 9 | spec_created | 一致想定 |
| 4 | legacy umbrella 整合検証 | 9 | spec_created | 6 観点すべて一致 |
| 5 | 対象外宣言（a11y / 無料枠 / coverage） | 9 | spec_created | 3 件 |
| 6 | line budget / link / verify-indexes 確認 | 9 | spec_created | drift 0 |
| 7 | 成果物 2 ファイル分離 | 9 | spec_created | main / contract-sync-check |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA サマリー（5 同期点 / 3 点一致 / 対象外 / link / CI ゲート） |
| ドキュメント | outputs/phase-09/contract-sync-check.md | 5 文書 × 5 観点 contract 同期マトリクス詳細 |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] aiworkflow-requirements 5 同期点（topic-map / quick-reference / resource-map / keywords / indexes）すべてに drift 判定が付与されている
- [ ] 5 文書 contract 同期マトリクス（5 文書 × 5 観点）が空セルゼロで完成
- [ ] 3 点一致確認（ledger / Secret / endpoint）が表化されている
- [ ] legacy umbrella 整合検証で 6 観点すべて「一致」
- [ ] 対象外宣言（a11y / 無料枠 / coverage）が 3 件記述
- [ ] line budget が全 phase で 100-300 行範囲内
- [ ] link 検証でリンク切れ 0
- [ ] 成果物 2 ファイル（main.md / contract-sync-check.md）が分離されている
- [ ] indexes 実 rebuild / references 実 PR が別タスクである旨が明記

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 2 ファイルが `outputs/phase-09/` 配下に配置予定
- 5 同期点 / 5 文書 contract / 3 点一致 / legacy umbrella 整合 / 対象外 / link の 6 観点すべて記述
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - 5 同期点 drift 結果（更新 PR は別タスクで実施）
  - 5 文書 contract 同期結果（差分があれば別タスク化）
  - 3 点一致確認結果（ledger / Secret / endpoint）
  - legacy umbrella 整合 6 観点すべて一致
  - line budget / link / verify-indexes ゲートの状態
  - 対象外宣言（a11y / 無料枠 / coverage）の根拠
- ブロック条件:
  - 5 同期点いずれかに「drift あり」かつ別タスク化されていない
  - 5 文書 contract 同期マトリクスに空セル
  - 3 点一致のいずれかが「不一致」かつ別タスク化されていない
  - legacy umbrella 整合 6 観点いずれかが「不一致」
  - link 切れ残存
