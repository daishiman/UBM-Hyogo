# Phase 4: テスト戦略 — issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 4 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

route 拡張に伴う **vitest 追加ケース** と、実 secret 投入前の **dry-run / redaction grep / smoke 受信 / rollback** の各検証経路を確定する。Phase 5 runbook と Phase 11 実測 evidence の橋渡しを Test ID で固定する。

## 入力

- Phase 2 設計（案 A / `PRODUCTION_CONFIRM_HEADER` / `smokeMessagePrefix` / wrangler binding）
- 既存 vitest（`apps/api/src/routes/admin/smoke-observability.test.ts`）
- Phase 1 AC-P1〜AC-P6
- Phase 3 GO 判定

## Test ID 表

| Test ID | 種別 | 対象 | 期待 | 実行 phase |
| --- | --- | --- | --- | --- |
| T-01 | unit (vitest) | production env で `x-smoke-production-confirm` 欠落 | `403 { errorCode: "PRODUCTION_CONFIRM_REQUIRED" }`、外部 fetch 0 回 | Phase 9 |
| T-02 | unit (vitest) | production env + `x-smoke-production-confirm: YES` + 正規 Bearer + target=both | `200`、Slack body の `text` が `[PRODUCTION SMOKE]` で始まる、Sentry envelope に `environment: "production"` | Phase 9 |
| T-03 | unit (vitest) | production env + production_confirm 有 + token mismatch | `401 { error: "unauthorized" }`、production_confirm の有無に関わらず認証先行 | Phase 9 |
| T-04 | unit (vitest) | staging env + production_confirm header **無し**でも 200 を返す（過剰要求しない） | `200`、Slack prefix `[STAGING SMOKE]` | Phase 9 |
| T-05 | unit (vitest) | redaction safe レスポンス | response JSON / evidence string に DSN / webhook / token / `sentry.io/[0-9]+/[0-9]+` / `hooks.slack.com/services/[A-Z0-9]+` が含まれない | Phase 9 |
| T-06 | unit (vitest) | `smokeMessagePrefix("production")` / `("staging")` / `(undefined)` | `"[PRODUCTION SMOKE]"` / `"[STAGING SMOKE]"` / `"[UNKNOWN SMOKE]"` | Phase 9 |
| T-07 | shell dry-run | `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production` で baseline（実 put 前に空 / 既存有無）を記録 | secret 名 list が値非表示で取得できる | Phase 11（pre-state） |
| T-08 | shell smoke | staging smoke 実行 → AC-1〜AC-5 PASS 確認 | event id / Slack permalink を `staging-smoke-log.md` に記録 | Phase 11（G2 通過前） |
| T-09 | shell smoke | production smoke 実行（G3 通過後）`curl -H 'authorization: Bearer ...' -H 'x-smoke-production-confirm: YES'` | 200 / event id short evidence / Slack status を route response で確認し、Slack permalink は Slack UI から手動取得して `production-smoke-log.md` に記録 | Phase 11（G3 後） |
| T-10 | shell redact | repo + outputs 全体に `rg -n 'hooks\.slack\.com/services/[A-Z0-9]+\|sentry\.io/[0-9]+/[0-9]+\|xox[bp]-'` | 0 hit | Phase 11（G4 直前） |
| T-11 | shell rollback | `cf.sh secret delete <name> --env production` → `secret list` 不在確認 | 任意 secret の rollback 経路が通る（production の rollback dry-run は staging で 1 周代替可） | Phase 11（G4 後） |

## redaction grep regex（再掲）

```
rg -n 'hooks\.slack\.com/services/[A-Z0-9]+'
rg -n 'sentry\.io/[0-9]+/[0-9]+'
rg -n 'xox[bp]-'
```

## 失敗時 rerun ルール

- T-09（production smoke）失敗時は **即座に rerun せず** Phase 6 escalation に入る。production への連投は INV #17 を毀損するため禁止
- T-08（staging smoke）失敗時は最大 2 回まで rerun 可。3 回連続失敗は Phase 6 escalation
- T-10 が hit したら G4 通過禁止。即時 rotation / revoke 経路（Phase 6 A-04）に escalate
- 各 rerun は evidence file に rerun #n / timestamp / 仮説を記録

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm exec vitest run apps/api/src/routes/admin/smoke-observability.test.ts
```

## 成果物

- `outputs/phase-04/main.md`

## 完了条件

- T-01〜T-11 すべてが evidence path / 実コマンド / PASS 条件 / approval gate に 1:1 対応
- staging-only / production-deferred / production-after-G3 の境界明示
- AC-P1〜AC-P6 と T-01〜T-11 の trace が記録

## タスク 100% 実行確認

- [ ] AC-P1〜AC-P6 すべてに対応 Test ID あり
- [ ] redaction safe テスト（T-05 / T-10）が独立して存在
- [ ] approval gate G1〜G4 が Test ID と紐づく
- [ ] 本タスクで実 production smoke を実行していない

## 次 Phase への引き渡し

Phase 5 へ: Test ID 表 / rerun ルール / vitest 追加ケース仕様 / G1〜G4 と Test ID の対応。
