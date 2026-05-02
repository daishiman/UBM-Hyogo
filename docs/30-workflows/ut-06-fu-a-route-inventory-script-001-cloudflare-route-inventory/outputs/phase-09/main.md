# Phase 9 成果物: ステージング検証 / QA plan（multi-env / staging fixture）

> 本ドキュメントは Phase 9（品質保証 / ステージング検証）の close-out 成果物。`phase-09.md` を SSOT とし、本ファイルは multi-env config table と staging runbook patch を統合した QA plan 要約である。実打ちは受け側実装タスク `UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001` が script 実装後に実施する。

## 1. メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001 |
| Phase | 9 / 13 (品質保証 / ステージング検証) |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #328 |
| 親タスク | UT-06-FU-A-PROD-ROUTE-SECRET-001 |
| 状態 | spec_created |

## 2. 目的

inventory script は production と staging の両環境で **対称に動作する** ことを期待する。Phase 9 では `--env staging` 指定下での実行計画を確定し、staging route が staging 用 Worker のみを指すことを検証する。**production と staging の差し替えポイント（expectedWorker name / config / env）** を multi-env config table として固定し、Phase 8 と同一 runbook が引数差し替えのみで再利用できることを保証する。本 Phase でも production / staging 両方の **mutation を一切実行しない** ことを Phase 1 / 3 / 8 と整合させて再掲する。

## 3. multi-env config table

| env | wrangler.toml セクション | expectedWorker（spec 上） | 出力ファイル prefix | 実行コマンド env フラグ |
| --- | --- | --- | --- | --- |
| production | `[env.production]` | `ubm-hyogo-web-production` | `outputs/phase-11/inventory-production.{json,md}` | `--env production` |
| staging | `[env.staging]` | `ubm-hyogo-web-staging`（実値は `apps/web/wrangler.toml` を Phase 1 で再確認） | `outputs/phase-09/staging-inventory.{json,md}` | `--env staging` |

**差し替えポイント**: 環境フラグ（`--env`）と出力先 prefix の 2 点のみ。inventory builder のロジックは同一を維持する。expectedWorker 名は受け側実装タスクで `wrangler.toml` を参照して動的に取得する設計とし、ハードコードしない。

## 4. staging runbook patch（Phase 8 runbook からの差分）

### ステップ 2 staging 差分

```bash
# Phase 8 production 実行に対する staging 差分
# bash scripts/cf.sh <route-inventory-subcommand> \
#     --config apps/web/wrangler.toml \
#     --env staging \
#     --output outputs/phase-09/staging-inventory.json
```

### ステップ 3 staging 出力検証

| 検証項目 | コマンド例 | 期待結果 |
| --- | --- | --- |
| staging Worker 名の出現 | `grep -c 'ubm-hyogo-web-staging' outputs/phase-09/staging-inventory.json` | >= 1 |
| production Worker 名の **非出現** | `grep -c 'ubm-hyogo-web-production' outputs/phase-09/staging-inventory.json` | 0（staging fixture に production が混入していない） |
| `mismatches` セクション | `grep -E 'mismatches' outputs/phase-09/staging-inventory.json` | 想定どおり |

### ステップ 4 secret-leak grep（Phase 7 / 8 と同パターン）

Phase 7 で確定した正規表現 4 種類以上を staging 出力ファイルに対しても実行する。期待件数はすべて 0 件。

```bash
grep -E 'Bearer\s+[A-Za-z0-9._-]+' outputs/phase-09/staging-inventory.json outputs/phase-09/staging-inventory.md
grep -E 'CLOUDFLARE_API_TOKEN\s*[:=]\s*\S+' outputs/phase-09/staging-inventory.json outputs/phase-09/staging-inventory.md
grep -E 'ya29\.|ghp_|gho_' outputs/phase-09/staging-inventory.json outputs/phase-09/staging-inventory.md
```

## 5. 多環境差異の記録

| 観点 | production | staging | 差分の扱い |
| --- | --- | --- | --- |
| Worker 名 | `ubm-hyogo-web-production` | `ubm-hyogo-web-staging`（要確認） | wrangler.toml から動的取得 |
| route hostname | production public domain | staging public domain | hostname 値は inventory に出力するが、token / secret は含めない |
| custom domain | production custom domain | staging 用 custom domain（無い場合あり） | staging で 0 件であることは正常 |
| API rate limit | smoke 1 回 | smoke 1 回 | 合算でも通常枠内 |
| secret 設定 | production secrets | staging secrets | inventory script はいずれも参照せず、token は env から渡る |

## 6. production / staging 承認 gate（再掲）

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

## 7. 静的検証（multi-env 観点）

| チェック | 方法 | 期待 |
| --- | --- | --- |
| `wrangler` 直接実行ゼロ | `grep -rn 'wrangler ' docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/ \| grep -v 'bash scripts/cf.sh'` | 0 件 |
| Worker 名のハードコード | inventory script 仕様内に `ubm-hyogo-web-staging` / `ubm-hyogo-web-production` がべた書きされず、wrangler.toml から動的取得 | grep で確認 |
| 出力 path の独立性 | `outputs/phase-09/staging-*` と `outputs/phase-11/inventory-production-*` が別 path | path 表で確認 |
| secret-leak 0 件 | Phase 7 4 正規表現を staging 出力に適用 | 全 0 件 |

## 8. NO-GO 3 軸との対応

| NO-GO 軸 | 本 Phase での担保 |
| --- | --- |
| mutation endpoint 誤呼び出し | §6 承認 gate で staging 側 mutation も明示的に「非実行」化。Phase 11 で再 grep |
| secret 漏洩 | §4 ステップ 4 で staging 出力にも 4 正規表現 grep。0 件期待 |
| wrangler 直接実行 | §7 静的検証で `wrangler ` 直叩き 0 件を grep gate 化 |

## 9. AC との対応

| AC | 本 Phase での担保 |
| --- | --- |
| AC-1（read-only API のみ） | §6 で staging 側 mutation も非実行化 |
| AC-2（出力 JSON / Markdown） | §3 multi-env config table で両環境とも `.json` / `.md` 両方出力 |
| AC-3（secret 不在） | §4 ステップ 4 / §7 secret-leak 0 件 |
| AC-4（`bash scripts/cf.sh` 経由） | §4 staging 差分も全て `bash scripts/cf.sh` 経由 |
| AC-5（production mutation 非実行） | §6 承認 gate 表（production / staging 両側） |

## 10. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | mock fixture を staging 用にも作成しておくと、本 Phase 実打ち前に builder の挙動が staging fixture でも成立することを事前確認できる |
| Phase 8 | 同 runbook を `--env` フラグの差し替えのみで再利用 |
| Phase 10 | multi-env で expected/actual が一致する設計になっていることを Design GO/NO-GO 根拠に使用 |
| Phase 11 | production / staging 双方の inventory ファイルを evidence として保存 |
| 親 UT-06-FU-A | 本タスクの inventory script が staging でも動くことを親 runbook の追記材料として提供 |

## 11. 完了条件チェック

- [x] multi-env config table を §3 で production / staging 2 行 × 5 列で埋める
- [x] expectedWorker 名がハードコードされず wrangler.toml から動的取得される旨を §3 末尾に明示
- [x] staging 出力 path（`outputs/phase-09/staging-*`）が production 出力 path と独立
- [x] Phase 8 runbook の staging 差分が `--env staging` のみで成立することを §4 に記述
- [x] secret-leak grep 4 正規表現を staging 出力にも適用する手順を §4 に記述
- [x] production / staging 承認 gate（6 操作の非実行表）を §6 で再掲
- [x] `wrangler` 直接実行が本ファイル内 0 件

## 12. 次 Phase への引き渡し

- 次 Phase: 10（セキュリティレビュー / 最終レビューゲート）
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
