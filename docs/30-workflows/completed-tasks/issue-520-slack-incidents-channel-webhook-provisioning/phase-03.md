# Phase 3: 設計レビュー — issue-520-slack-incidents-channel-webhook-provisioning

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 3 / 13 |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 の設計（変更対象ファイル一覧 / 命名規約 / webhook 共有案 A / redaction pattern / テスト方針 / G1〜G4 hook）を、要件レビュー思考法に基づき **システム系 / 戦略系 / 問題解決系** の 3 系統で論点抽出してレビューし、Phase 4 への GO/NO-GO を判定する。本タスクの不可逆 SaaS 操作（channel 作成 / webhook 発行）と secret 漏洩リスクに重点を置く。

## 入力

- Phase 1 確定 AC-1〜AC-8 / G1〜G4 / 自走禁止 / 用語集
- Phase 2 設計 output（`outputs/phase-02/main.md`）
- issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension の route 設計（責務境界の参照）
- 正本仕様（observability-monitoring.md / deployment-secrets-management.md）
- CLAUDE.md（`scripts/cf.sh` 必須 / `.env` op:// 参照 / 平文禁止）

## レビュー観点（3 系統）

### システム系（SYS）

| R-ID | 観点 | 判定基準 |
| --- | --- | --- |
| SYS-01 | 不変条件カバレッジ | INV #14 / #16 / #17 + webhook 実値非露出 INV + env-isolation INV が Phase 2 全セクションに反映 |
| SYS-02 | secret 漏洩リスク | 1Password / Cloudflare / GitHub Secrets / `.env` のすべての配置先で実値が op:// 参照または env scoped binding に閉じ、ファイル / log / PR / response / evidence template のいずれにも残らない |
| SYS-03 | redaction gate 設計 | grep pattern（`hooks\.slack\.com/services/[A-Z0-9]` / `B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}` / `xox[bp]-`）が Phase 9 / Phase 11 G4 / Phase 13 PR body 確定前に必ず実行される経路 |
| SYS-04 | 既存 issue-495 spec との責務分離 | 本タスクは `smoke-observability.ts` 本体を編集せず（test の redaction 追記のみ）、issue-495 の route 実装スコープを侵食しない |
| SYS-05 | Idempotency / 不可逆 SaaS 副作用の取扱い | channel 作成 / webhook 発行を G1 で gate 化し、既存時は再利用。1Password / Cloudflare / GitHub secret は upsert で再実行安全 |

### 戦略系（STR）

| R-ID | 観点 | 判定基準 |
| --- | --- | --- |
| STR-01 | webhook 共有 vs 分離 | 案 A（共有 + prefix 識別）の採用根拠が漏洩時ローテーションコストとの trade-off で説明されている |
| STR-02 | channel 名空間設計 | `ubm-hyogo-incidents` が UBM-Hyogo project の incident 一次受けとして将来の通知（PagerDuty 連携 / Sentry alert 等）拡張時に名空間衝突しない |
| STR-03 | secret 配置の正本性 | 1Password を canonical source とし、Cloudflare / GitHub Secrets はその同期先に位置づけられている。observability-monitoring.md / deployment-secrets-management.md への反映が記述済み |
| STR-04 | scope 1 サイクル完遂性（CONST_007） | Phase 11 までで channel 作成 / webhook 発行 / 3 配置 / staging+production smoke 着弾確認が後続実装プロンプト 1 サイクル内で完了でき、将来送りが発生しない |

### 問題解決系（PRB）

| R-ID | 観点 | 判定基準 |
| --- | --- | --- |
| PRB-01 | webhook URL 漏洩事故 | grep gate + redaction test + PR body チェックの三重 gate でファイルへの混入検知。漏洩時の rotate 手順（Slack admin で webhook 再発行 → 1Password 更新 → `cf.sh secret put` 上書き → `gh secret set` 上書き）が runbook に含まれる |
| PRB-02 | channel 削除事故 | `#ubm-hyogo-incidents` の archive / delete を防ぐため runbook に「archive 禁止」明示、idempotent 再作成手順、admin 操作前の G1 通過記録を要求 |
| PRB-03 | redaction 漏れ | redaction-safe 単体テストの追記対象（`smoke-observability.test.ts`）と grep gate の実行 phase（Phase 9 / Phase 11 G4 / Phase 13 PR body）が二重化されている |
| PRB-04 | staging / production 識別ミス | env prefix `[STAGING SMOKE]` / `[PRODUCTION SMOKE]` が Phase 11 evidence で必ず確認され、両 env が同 channel に流れる場合でも prefix mismatch を G3 / G4 で検知 |
| PRB-05 | `.env` 平文混入 | `.env.example` のプレースホルダーが op:// 参照のみで、`.gitignore` 済み `.env` 実体に値を書かない運用が runbook で強調されている |

## 修正必要点の取扱い

- FIX-NEEDED: Phase 2 へ戻すか、Phase 3 で修正併記して Phase 4 へ送るかを記録する
- DEFER: 軽微案件のみ Phase 4 以降での吸収を許容。ただし以下は DEFER 不可（Phase 2 へ戻す）:
  - SYS-02（secret 漏洩リスク）
  - SYS-03（redaction gate）
  - PRB-01（webhook URL 漏洩事故対応）
  - PRB-04（env 識別ミス）

## リスク評価と緩和策

| リスク | 影響 | 緩和策 |
| --- | --- | --- |
| webhook URL 漏洩 | 第三者から `#ubm-hyogo-incidents` への任意 POST 可能 | 三重 redaction gate（grep / unit test / PR body）+ 1Password 単一正本 + 漏洩時の rotate runbook |
| channel 削除事故 | smoke / 実 incident 通知が消失 | runbook に archive 禁止記載 + idempotent 再作成手順 + Slack admin 通知設定 |
| redaction 漏れ | repo / log に webhook URL 残置 | `smoke-observability.test.ts` redaction assertion + Phase 9 grep gate + Phase 13 PR body grep gate |
| staging / production 識別ミス | production smoke を staging と誤認、または逆 | env prefix `[STAGING SMOKE]` / `[PRODUCTION SMOKE]` の二重識別 + G3 / G4 で prefix verify |
| 1Password / Cloudflare / GitHub Secrets の同期ずれ | env 不整合により smoke 失敗 | runbook に同期チェックリスト記載 + `cf.sh secret list` / `gh secret list` の name-only 確認を AC-3 / AC-4 evidence 化 |
| 不可逆 SaaS 操作の自走 | 仕様書 phase 中に誤って channel 作成 | G1 gate を Phase 11 起点に固定、自走禁止 8 項目を Phase 1 で明文化 |

## issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension との境界（責務分離）最終確認

| 観点 | issue-495 spec | issue-520 spec（本タスク） |
| --- | --- | --- |
| route 本体実装 | 担当（production 分岐 / `x-smoke-production-confirm` / Sentry env tag） | 触れない（test の redaction 追記のみ） |
| Slack webhook URL 入手 | 前提（外部依存として scope out） | 担当（channel 作成 / webhook 発行） |
| 1Password item 整備 | 担当（DSN / token / webhook 全 3 item の path 規約定義） | 担当（webhook item の実値投入は Phase 11、path 規約は issue-495 と整合） |
| Cloudflare secret 配置 | 担当（3 secret 全体の runbook） | 担当（`SLACK_WEBHOOK_INCIDENT` の staging+production 配置を Phase 11 で発火） |
| GitHub Actions secret | scope out | 担当 |
| smoke 着弾確認 | route 単体の AC-P1〜AC-P6 | webhook 経路の AC-5 / AC-6 着弾確認 |

責務境界に重複・空白なし。

## G1〜G4 multi-stage approval gate（Phase 1 継承の再確認）

| gate | 確認事項 |
| --- | --- |
| G1 | channel 作成 + webhook 発行承認。Slack workspace への不可逆操作を user approval 取得後にのみ実行 |
| G2 | 1Password item 投入 + Cloudflare staging secret 配置承認。`cf.sh secret put --env staging` 実行直前に gate |
| G3 | Cloudflare production secret 配置承認 + staging smoke PASS 確認。`cf.sh secret put --env production` と production smoke 発火直前に gate |
| G4 | production smoke PASS + redaction grep gate PASS + evidence 確定保存 gate |

## Go/No-Go 判定基準

| 結論 | 条件 |
| --- | --- |
| GO | SYS-01〜SYS-05 / STR-01〜STR-04 / PRB-01〜PRB-05 が PASS、または FIX-NEEDED が DEFER 可項目のみ |
| NO-GO | SYS-02 / SYS-03 / PRB-01 / PRB-04 のいずれかが FIX-NEEDED |

## 検証コマンド

```bash
grep -q "PASS\|FIX-NEEDED\|DEFER" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/outputs/phase-03/main.md
grep -q "GO\|NO-GO" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/outputs/phase-03/main.md
grep -q "SYS-\|STR-\|PRB-" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/outputs/phase-03/main.md
! rg -n 'hooks\.slack\.com/services/[A-Z0-9]|B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}|xox[bp]-' docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/
```

## 成果物

- `outputs/phase-03/main.md`

## 完了条件

- [ ] SYS-01〜SYS-05 すべてに判定が記録
- [ ] STR-01〜STR-04 すべてに判定が記録
- [ ] PRB-01〜PRB-05 すべてに判定が記録
- [ ] FIX-NEEDED があれば戻し or 併記の方針を明示
- [ ] リスク評価表（webhook 漏洩 / channel 削除 / redaction 漏れ / env 識別 / 同期ずれ / 自走）と緩和策が明示
- [ ] issue-495 spec との責務分離が表で確定
- [ ] G1〜G4 が Phase 1 から継承され、Phase 11 hook と紐づく
- [ ] Phase 4 への GO/NO-GO 結論
- [ ] 実値混入なし（grep gate PASS）

## 次 Phase への引き渡し

Phase 4 へ: review 通過設計 / forward 課題 / GO 判定 / リスク緩和策 / 責務境界確定。

## 実行タスク

- 本 Phase の確定事項を対応する outputs/phase-* 成果物へ反映する。

## 参照資料

- 本 workflow の前段 Phase。
- task-specification-creator / aiworkflow-requirements の該当 reference。

## 完了条件

- 必須成果物が存在し、runtime pending と static PASS の境界が明記されている。

## 統合テスト連携

- ローカル静的検証は focused test / validator / redaction grep で行い、実 Slack / secret / smoke は user approval 後の Phase 11 runtime wave で実行する。
