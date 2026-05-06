# Phase 7: AC マトリクス — issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 7 / 13 |
| 作成日 | 2026-05-06 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

staging AC（既存 09b-A 本体の AC-1〜AC-5）と本タスクで追加された production AC-P1〜AC-P6 を **明示的に分離した** trace matrix を確定する。各 AC に evidence path / 検証コマンド / PASS 条件 / 取得 phase / approval gate を 1:1 で対応させる。

## 入力

- Phase 1 AC-P1〜AC-P6
- Phase 4 Test ID 表（T-01〜T-11）
- Phase 5 runbook（Step 0〜9）
- Phase 6 異常系（A-01〜A-08）

## staging AC（継承）

| AC | 取得 phase | 主 evidence path | 検証 | gate |
| --- | --- | --- | --- | --- |
| AC-1 (staging Sentry test event) | Phase 11 | `outputs/phase-11/staging-smoke-log.md` | event id 記録 | G2 前提 |
| AC-2 (staging Slack alert) | Phase 11 | `outputs/phase-11/staging-smoke-log.md` | permalink 記録 | G2 前提 |
| AC-3 (secret 漏洩ゼロ) | Phase 11 | `outputs/phase-11/staging-smoke-log.md` 内 redact gate 結果 | T-10 grep 0 hit | G2 / G4 |
| AC-4 (fallback runbook) | Phase 6 | `outputs/phase-06/main.md` | A-01〜A-08 完備 | — |
| AC-5 (placeholder 解除) | Phase 12 | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements diff | — |

## production AC（本タスク追加）

| AC | 取得 phase | 主 evidence path | 検証 | gate |
| --- | --- | --- | --- | --- |
| AC-P1 (production smoke 200 + 双方到達) | Phase 11 | `outputs/phase-11/production-smoke-log.md` | T-09 で 200 / Sentry event id short evidence / Slack status、Slack permalink は UI から手動取得 | **G3** |
| AC-P2 (production_confirm 欠落で 403) | Phase 9 | vitest 実行ログ | T-01 PASS | — |
| AC-P3 (Slack `[PRODUCTION SMOKE]` 識別) | Phase 9 + Phase 11 | vitest（T-02）+ permalink message text | prefix 一致 | G3 / G4 |
| AC-P4 (redaction safe response/log/evidence) | Phase 9 + Phase 11 | T-05 vitest + T-10 shell grep | grep 0 hit / response 検査 | G4 |
| AC-P5 (G1〜G4 通過記録) | Phase 11 | `outputs/phase-11/production-smoke-log.md` | timestamp 付 approval table | G1〜G4 |
| AC-P6 (staging / production evidence 分離) | Phase 11 | `staging-smoke-log.md` / `production-smoke-log.md` の 2 ファイル分離 | ファイル存在と内容相互参照のみ | — |

## coverage gap self-check

- AC-P1〜AC-P6 のうち evidence path 未割当が 0 であること
- T-01〜T-11 のうち AC trace されないものが 0 であること
- G1〜G4 すべてが少なくとも 1 つの AC に登場すること

## 成果物

- `outputs/phase-07/main.md`（matrix 表 / coverage gap self-check）

## 完了条件

- staging AC + production AC の分離記載
- AC × evidence × Test ID × gate × phase の 1:1 対応
- coverage gap 0

## 次 Phase への引き渡し

Phase 8 へ: AC matrix を check list として渡す。
