# Phase 8: DRY 化 — issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 8 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

production 拡張で導入する route 分岐 / prefix 算出 / Sentry environment tag / Slack body 整形の重複を整理し、SSOT を維持する。

## 検査観点

| D-ID | 観点 | 検査 |
| --- | --- | --- |
| D-01 | env-aware prefix 単一定義 | `smokeMessagePrefix(env)` 純関数を 1 箇所で定義し、route 内の Slack body 組み立てから参照。文字列リテラル `"[PRODUCTION SMOKE]"` / `"[STAGING SMOKE]"` を route 中に散在させない |
| D-02 | Sentry / Slack 送信ロジック共通化 | 既存 `sendSentrySmoke` / `sendSlackSmoke` を維持し、production 拡張は **入力 envName のみで分岐** する。production 用の別関数を作らない |
| D-03 | production_confirm header の唯一性 | `PRODUCTION_CONFIRM_HEADER` / `PRODUCTION_CONFIRM_VALUE` を const export し、test と route の両方で同じ識別子を使う |
| D-04 | secret 命名整合 | `SENTRY_DSN_API` / `SLACK_WEBHOOK_INCIDENT` / `SMOKE_ADMIN_TOKEN` は env で値を分けるのみ。命名を変えない（staging との SSOT 維持） |
| D-05 | evidence path 衝突回避 | `outputs/phase-11/staging-smoke-log.md` / `production-smoke-log.md` が他 task spec と衝突しない。本タスク配下に閉じる |
| D-06 | aiworkflow-requirements 整合 | `observability-monitoring.md` / `deployment-secrets-management.md` の secret 命名 / 通知 prefix 規約と本実装が整合 |

## 重複検出時の集約方針

| 状況 | 方針 |
| --- | --- |
| route 内に prefix リテラル散在 | `smokeMessagePrefix()` への集約必須（実装時 fail fast） |
| production 用に新規 helper を増設 | 既存 `sendSentrySmoke` / `sendSlackSmoke` への入力分岐に統合 |
| 命名衝突（既存と差異） | aiworkflow-requirements を SSOT として優先・本実装を寄せる |

## サブタスク管理

- [ ] D-01〜D-06 検査
- [ ] 重複検出表を `outputs/phase-08/main.md` に記録
- [ ] SSOT 構造図（route 内 helper 関係 / secret 命名）を記録

## 成果物

- `outputs/phase-08/main.md`

## 完了条件

- D-01〜D-06 すべてに判定（PASS / FIX-NEEDED / FORWARD）
- prefix 単一定義 / secret 命名 SSOT が確認

## 次 Phase への引き渡し

Phase 9 へ: DRY 結果と forward 課題（あれば）。
