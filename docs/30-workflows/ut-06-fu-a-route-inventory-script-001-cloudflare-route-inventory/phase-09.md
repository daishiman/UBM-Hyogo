# Phase 9: ステージング検証（multi-env / staging fixture）

> **本タスクは docs-only / infrastructure-automation である。** 本 Phase の "ステージング検証" は、Phase 8 で確立した production read-only smoke runbook を **staging Worker** に対しても適用し、staging route が staging Worker（`ubm-hyogo-web-staging` 等）のみを指していることを **別 fixture / 別 evidence** として検証する計画を仕様化する。本 Phase は production deploy も staging deploy も実行せず、read-only API hit のみで完結する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production Worker route inventory script (UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | ステージング検証（multi-env / staging fixture） |
| 作成日 | 2026-05-01 |
| 前 Phase | 8 (E2E / NON_VISUAL 代替検証) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク分類 | infrastructure-automation（multi-env staging validation spec） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #328 |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001 |

## 目的

inventory script は production と staging の両環境で **対称に動作する** ことを期待する。Phase 9 では `--env staging` 指定下での実行計画を確定し、staging route が `ubm-hyogo-web-staging`（または staging 用 Worker 名）のみを指すことを検証する。**production と staging の差し替えポイント（expectedWorker name / config / env）** を multi-env config table として固定し、Phase 8 と同一 runbook が引数差し替えのみで再利用できることを保証する。本 Phase でも production / staging 両方の **mutation を一切実行しない** ことを Phase 1 / 3 と整合させて再掲する。

## 実行タスク

1. staging 環境の expectedWorker 名を確定する（完了条件: `apps/web/wrangler.toml [env.staging].name` に基づく Worker 名と、`apps/web/wrangler.toml [env.production].name = ubm-hyogo-web-production` の差分が表化される）。
2. multi-env config table を作成する（完了条件: env / wrangler.toml セクション / expectedWorker / 出力ファイル prefix の 4 列 × 2 行（production / staging）が埋まる）。
3. staging fixture が production fixture と独立して保存される配置を定義する（完了条件: `outputs/phase-09/staging-inventory.json` 等の path が確定）。
4. Phase 8 runbook を staging に適用する際の引数差分を runbook patch として記述する（完了条件: `--env staging` / `--config apps/web/wrangler.toml` / 出力先の 3 点が固定）。
5. staging Worker が staging route のみに紐付くことの検証観点を確定する（完了条件: production Worker 名が staging fixture に出現したら mismatch 扱い、staging Worker 名が production fixture に出現したら mismatch 扱い）。
6. production deploy / staging deploy の **両方を本タスクで実行しない** ことを Phase 1 / 3 と同一文言で再掲する（完了条件: 6 操作以上の非実行表が再掲）。
7. staging 出力ファイルに対しても Phase 7 / 8 と同じ secret-leak grep を適用する手順を確定する（完了条件: 同正規表現で 0 件期待）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-001.md | 正本仕様 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-09.md | 親タスク Phase 9（フォーマット踏襲元） |
| 必須 | apps/web/wrangler.toml | `[env.production].name` / `[env.staging].name` の正本 |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `bash scripts/cf.sh` 経由強制 |
| 必須 | docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/phase-07.md | secret-leak grep 仕様の正本 |
| 必須 | docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/phase-08.md | production smoke runbook（本 Phase で再利用） |

## multi-env config table

| env | wrangler.toml セクション | expectedWorker（spec 上） | 出力ファイル prefix | 実行コマンド env フラグ |
| --- | --- | --- | --- | --- |
| production | `[env.production]` | `ubm-hyogo-web-production` | `outputs/phase-11/inventory-production.{json,md}` | `--env production` |
| staging | `[env.staging]` | `ubm-hyogo-web-staging`（実値は `apps/web/wrangler.toml` を Phase 1 で再確認） | `outputs/phase-09/staging-inventory.{json,md}` | `--env staging` |

> **差し替えポイント**: 環境フラグ（`--env`）と出力先 prefix の 2 点のみ。inventory builder のロジックは同一を維持する。expectedWorker 名は受け側実装タスクで `wrangler.toml` を参照して動的に取得する設計とし、ハードコードしない。

## staging runbook patch（Phase 8 runbook からの差分）

### ステップ 2: script 実行（staging 用差分）

```bash
# Phase 8 production 実行に対する staging 差分
# bash scripts/cf.sh <route-inventory-subcommand> --config apps/web/wrangler.toml --env staging --output outputs/phase-09/staging-inventory.json
```

### ステップ 3: 出力ファイル検証（staging 用差分）

| 検証項目 | コマンド例 | 期待結果 |
| --- | --- | --- |
| staging Worker 名の出現 | `grep -c 'ubm-hyogo-web-staging' outputs/phase-09/staging-inventory.json` | >= 1 |
| production Worker 名の **非出現** | `grep -c 'ubm-hyogo-web-production' outputs/phase-09/staging-inventory.json` | 0（staging fixture に production が混入していない） |
| `mismatches` セクション | `grep -E 'mismatches' outputs/phase-09/staging-inventory.json` | 想定どおり |

### ステップ 4: secret-leak grep（Phase 7 / 8 と同パターン）

Phase 7 §「secret-leak 検出テスト」で確定した正規表現 4 種類以上を staging 出力ファイルに対しても実行する。期待件数はすべて 0 件。

## 多環境差異の記録

| 観点 | production | staging | 差分の扱い |
| --- | --- | --- | --- |
| Worker 名 | `ubm-hyogo-web-production` | `ubm-hyogo-web-staging`（要確認） | wrangler.toml から動的取得 |
| route hostname | production public domain | staging public domain | hostname 値は inventory に出力するが、token / secret は含めない |
| custom domain | production custom domain | staging 用 custom domain（無い場合あり） | staging で 0 件であることは正常 |
| API rate limit | smoke 1 回 | smoke 1 回 | 合算でも通常枠内 |
| secret 設定 | production secrets | staging secrets | inventory script はいずれも参照せず、token は env から渡る |

## production / staging 承認 gate（再掲）

本タスクは Phase 1 / 3 / 8 と整合し、以下を **本 Phase 内で一切実行しない**。Phase 9 でも同一表で再掲する。

| 操作 | production | staging |
| --- | --- | --- |
| `bash scripts/cf.sh deploy` | 非実行 | 非実行 |
| route の付け替え | 非実行 | 非実行 |
| custom domain の付け替え | 非実行 | 非実行 |
| `bash scripts/cf.sh secret put` | 非実行 | 非実行 |
| 旧 Worker の削除 / 無効化 | 非実行 | 非実行 |
| DNS record の編集 | 非実行 | 非実行 |

read-only API hit のみが許容される。production deploy 自体は本タスクの完了条件に含まれない（正本仕様 §「含まない」と整合）。

## 静的検証（multi-env 観点）

| チェック | 方法 | 期待 |
| --- | --- | --- |
| `wrangler` 直接実行ゼロ | `grep -rn 'wrangler ' docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/ \| grep -v 'bash scripts/cf.sh'` | 0 件 |
| Worker 名のハードコード | inventory script 仕様内に `ubm-hyogo-web-staging` / `ubm-hyogo-web-production` がべた書きされず、wrangler.toml から動的取得すること | grep で確認 |
| 出力 path の独立性 | `outputs/phase-09/staging-*` と `outputs/phase-11/inventory-production-*` が別 path | path 表で確認 |
| secret-leak 0 件 | Phase 7 4 正規表現を staging 出力に適用 | 全 0 件 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | mock fixture を staging 用にも作成しておくと、本 Phase 実打ち前に builder の挙動が staging fixture でも成立することを事前確認できる |
| Phase 8 | 同 runbook を `--env` フラグの差し替えのみで再利用 |
| Phase 10 | multi-env で expected/actual が一致する設計になっていることを Design GO/NO-GO 根拠に使用 |
| Phase 11 | production / staging 双方の inventory ファイルを evidence として保存 |
| 親 UT-06-FU-A | 本タスクの inventory script が staging でも動くことを親 runbook の追記材料として提供 |

## 多角的チェック観点

- 価値性: staging で先行検証することで production 実打ち前にロジックの妥当性が確認できる。
- 実現性: `--env` フラグ差し替えのみで再利用でき、新規実装を追加しない。
- 整合性: production / staging で expectedWorker 名が wrangler.toml と乖離しないことを Phase 1 で再確認する経路が引き継がれる。
- 運用性: multi-env config table が 1 表で全差分を表現する。
- 認可境界: production / staging 両方で deploy / mutation を行わないことが Phase 1 / 3 / 8 / 9 で重複明記される。
- セキュリティ: secret-leak grep を staging 出力にも同パターンで適用。
- 無料枠: read-only API hit は通常枠内。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | staging expectedWorker 名確定 | spec_created |
| 2 | multi-env config table 作成 | spec_created |
| 3 | staging fixture 配置 path 定義 | spec_created |
| 4 | Phase 8 runbook の staging 差分記述 | spec_created |
| 5 | staging Worker × staging route 専有性検証観点確定 | spec_created |
| 6 | production / staging 承認 gate 再掲 | spec_created |
| 7 | secret-leak grep の staging 適用手順確定 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/staging-validation-plan.md | staging 検証計画（runbook patch / staging fixture / secret-leak grep） |
| ドキュメント | outputs/phase-09/multi-env-config-table.md | production / staging 差分表（env / wrangler.toml / expectedWorker / 出力 prefix / env フラグ） |
| メタ | artifacts.json | Phase 9 状態更新 |

## 完了条件

- [ ] multi-env config table が production / staging 2 行 × 5 列で埋まる
- [ ] expectedWorker 名がハードコードされず wrangler.toml から動的取得される旨が明示
- [ ] staging 出力 path（`outputs/phase-09/staging-*`）が production 出力 path と独立
- [ ] Phase 8 runbook の staging 差分が `--env staging` のみで成立することを記述
- [ ] secret-leak grep 4 正規表現が staging 出力にも適用される手順を記述
- [ ] production / staging 承認 gate（6 操作以上の非実行表）が再掲される
- [ ] `wrangler` 直接実行が本仕様書内 0 件
- [ ] 成果物 2 ファイルが `outputs/phase-09/` 配下に配置予定

## タスク100%実行確認【必須】

- 実行タスク 7 件すべてが `spec_created`
- 成果物 2 ファイルが `outputs/phase-09/` 配下に配置予定
- multi-env config table が production / staging 2 行で埋まる
- production deploy / staging deploy 両方が「非実行」と明記
- secret 値の **記述例** にも実トークンが登場しない（key 名のみ）
- `wrangler` 直叩きが本仕様書内ゼロ件

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - multi-env config table → Phase 10 Design GO/NO-GO 判定で「production / staging 両方で expectedWorker と actual が一致する設計」を根拠に使用
  - staging fixture path → Phase 11 evidence で production fixture と並列保存
  - production / staging 承認 gate 再掲 → Phase 10 / 11 / 12 でも同一文言を維持
  - secret-leak grep の staging 適用 → Phase 11 evidence 検証で再利用
- ブロック条件:
  - multi-env config table に空セル
  - expectedWorker 名がハードコードのまま
  - production / staging いずれかで mutation が紛れ込む
  - secret-leak grep が staging 出力で未適用
