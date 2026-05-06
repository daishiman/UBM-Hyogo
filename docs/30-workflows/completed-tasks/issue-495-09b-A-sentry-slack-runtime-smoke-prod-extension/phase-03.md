# Phase 3: 設計レビュー — issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 3 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 の設計（案 A 確定 / 関数シグネチャ / wrangler binding / 1Password item / prefix 戦略 / Sentry env tag / G1〜G4）を、**secret 漏洩リスク・production 誤送信リスク・redaction gate・運用承認フロー** の 4 観点でレビューし、Phase 4 への GO/NO-GO を判定する。

## 入力

- Phase 1 確定 AC-P1〜AC-P6 / 自走禁止 / G1〜G4
- Phase 2 設計 output（`outputs/phase-02/main.md`）
- 既存 09b-A staging spec（review baseline）
- 正本仕様（observability-monitoring.md / deployment-secrets-management.md）

## レビュー観点と判定

| R-ID | 観点 | 判定基準 |
| --- | --- | --- |
| R-01 | 不変条件カバレッジ | INV #14 / #16 / #17 と env 境界 INV が Phase 2 の各セクションに反映 |
| R-02 | secret 漏洩リスク | route response / log / evidence template に DSN / webhook / token / hash / project numeric id が一切返らない設計 |
| R-03 | production 誤送信リスク | `x-smoke-production-confirm` 必須化が staging では無視され、production では強制される。Slack prefix が必ず `[PRODUCTION SMOKE]` になる |
| R-04 | redaction gate 設計 | grep gate（`hooks.slack.com/services/[A-Z0-9]+` / `sentry.io/[0-9]+/[0-9]+` / `xox[bp]-`）が evidence 確定前に必ず通過する経路 |
| R-05 | 運用承認フロー（G1〜G4） | 各 gate の前提が他 gate と独立、staging→production の linearity 維持、user approval 取得 path が明確 |
| R-06 | DRY / 既存 staging との整合 | 案 A 採用で既存 route / test の整合が崩れない。`smokeMessagePrefix` 純関数で重複なし |

## 修正必要点の取扱い

- FIX-NEEDED: Phase 2 へ戻すか、Phase 3 で修正併記して Phase 4 へ送るかを記録
- DEFER: 軽微案件のみ Phase 4 以降での吸収を許容。secret 関連 / production gate 関連は DEFER 不可

## 既存 staging 仕様との整合チェック

- staging 仕様（`completed-tasks/09b-A-observability-sentry-slack-runtime-smoke/`）の secret 命名（`SENTRY_DSN_API` / `SLACK_WEBHOOK_INCIDENT` / `SMOKE_ADMIN_TOKEN`）を本タスクは production env で再利用する。命名衝突なし
- staging route の Slack prefix `[STAGING SMOKE]` は production の `[PRODUCTION SMOKE]` と一意区別
- evidence path は staging の `outputs/phase-11/manual-smoke-log.md`（既存）と本タスクの `outputs/phase-11/staging-smoke-log.md` / `production-smoke-log.md` は別タスク配下のため衝突なし

## Go/No-Go 判定基準

| 結論 | 条件 |
| --- | --- |
| GO | R-01〜R-06 が PASS、または FIX-NEEDED が Phase 4 以降で吸収可能 |
| NO-GO | R-02 / R-03 / R-04 のいずれかが FIX-NEEDED |

## 検証コマンド

```bash
grep -q "PASS\|FIX-NEEDED\|DEFER" docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/outputs/phase-03/main.md
grep -q "GO\|NO-GO" docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/outputs/phase-03/main.md
! rg -n 'hooks\.slack\.com/services/[A-Z0-9]|sentry\.io/[0-9]+/[0-9]+|xox[bp]-' docs/30-workflows/issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension/
```

## 成果物

- `outputs/phase-03/main.md`

## 完了条件

- [ ] R-01〜R-06 すべてに判定が記録
- [ ] FIX-NEEDED があれば戻し or 併記の方針を明示
- [ ] Phase 4 への GO/NO-GO 結論

## 次 Phase への引き渡し

Phase 4 へ: review 通過設計 / forward 課題 / GO 判定。
