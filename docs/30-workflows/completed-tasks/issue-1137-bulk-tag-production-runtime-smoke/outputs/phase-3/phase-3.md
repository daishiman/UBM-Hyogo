# Phase 3: 設計レビュー — issue-1137-bulk-tag-production-runtime-smoke

## 目的

Phase 2 の設計が AC-1〜AC-8 / 不変条件 I-1〜I-7 を満たし、Phase 4（テスト作成）へ進めるかをレビューゲートで判定する。

## 設計レビュー思考法（要件レビュー一次結論）

| 評価軸 | 結論 |
| ------ | ---- |
| 価値性 | production deploy 後の bulk tag mutation contract（assign/noop/unassign/audit parity）が壊れていないことを、手動確認なしに二重承認越しで証跡取得できる。回帰検出コストを下げる |
| 実現性 | 既存 staging runner の orchestration を env 分岐で再利用。新規 SQL 2 本 + CI job 1 つ + test ケース追加のみ。本サイクルに収まる（CONST_007） |
| 整合性 | staging guard 逐語不変（I-7）+ production 別 guard 関数で責務境界が閉じる。fixture prefix 分離で本番データと衝突しない |
| 運用性 | cleanup 残件 0 assert + trap EXIT cleanup + redaction grep gate で、実走後の本番汚染・secret 漏洩を構造的に防ぐ。CI は workflow_dispatch 限定かつ input 明示 opt-in で誤実行不可 |

## 真の論点の再確認

- 主問題: 「production real D1 への書き込み smoke を、本番データ・公開面・audit を汚染せず二重承認越しにのみ実行する経路を作る」。1 提案に複数案件が混ざっていないか → 混ざっていない（staging 変更・endpoint 変更・共通 lib 抽出はすべてスコープ外に明示分離）。
- why now: staging gate（issue-1081）が安定運用フェーズに入ったため、production confidence の次段が必要。
- why this way: 先行事例 #922（`runtime-admin-web.sh` の production env 分岐）が確立済みのパターンを mutation smoke に類推適用するのが最小リスク。

## 因果と境界の確認

- **状態所有権**: env 別変数（`PREFIX`/`CF_D1_DATABASE`/`SEED_SQL`/`CLEANUP_SQL`/`MEMBER_IDS`/`TAG_IDS`/`ENVIRONMENT`/allowlist/guard）は `parse_args` → `configure_environment` で一元確定。staging と production の状態が混在しない。
- **意思決定権**: production 実走の可否は二重承認（GitHub environment 承認 + runner 内 marker）にある。runner は marker 欠落時 `exit 2` で fail-closed。
- **verify fail 後**: cleanup は `trap EXIT` で必ず実行。途中 fail でも synthetic data を残さない。

## リスクと対策（issue リスク表 + 設計レビュー追加）

| リスク | 影響 | 対策 | 対応 AC |
| ------ | ---- | ---- | ------- |
| production real D1 に test data が残留 | 高 | production 専用 prefix 固定 + cleanup 残件 0 assert（FAIL）+ trap EXIT cleanup | AC-2 / AC-4 |
| production endpoint への誤実行 | 高 | production 専用 allowlist regex 独立評価 + D1 名固定 + 二重承認 marker。staging guard は別関数で温存 | AC-1 / AC-3 / I-7 |
| staging guard の退化 | 高 | `assert_staging_guard` を逐語変更しない。既存 local test PASS で非退化確認 | AC-6 |
| 本番会員データへの synthetic data 混入が公開面に露出 | 高 | prefix 分離 + `publish_state='member_only'` seed + cleanup 残件 0 + audit 残件 0 | AC-2 / AC-4 / AC-5 |
| production smoke が承認なしに走る | 高 | 二重承認 gate（workflow_dispatch input opt-in + GitHub environment + runner marker）後のみ seed/POST/cleanup。通常の production smoke dispatch では bulk tag job は skipped | AC-3 |
| admin bearer / token をログへ出す | 高 | `redact.sh` でマスク + CI redaction grep gate + `::add-mask::` | AC-7 |
| **（追加）** `configure_environment` の staging 分岐で既存 staging 値がドリフト | 中 | env 一般化後も値を現状と完全一致させ、既存 local test（PASS）で挙動不変を回帰確認 | AC-6 |
| **（追加）** SQLite/D1 の seed カラム不整合（schema drift） | 中 | staging seed の現行カラム構成を踏襲。必要時に `cf.sh d1 execute --command "PRAGMA table_info(...)"` で確認可能と Phase 5 に明記 |
| **（追加）** CI job が attendance smoke job と evidence dir 衝突 | 低 | `--out-dir ci-evidence-bulk-tag-prod` を attendance の `ci-evidence` と分離 |

## 正本整合チェック

| 正本 | 整合 |
| ---- | ---- |
| 実装コード（endpoint contract / staging guard line 122 / parse_args line 71-74） | ✅ 現行確認済。endpoint 不変・staging guard 逐語不変 |
| production 環境定数（`ubm-hyogo-db-prod` / `ubm-hyogo-api` / `https://api.ubm-hyogo.workers.dev`） | ✅ wrangler.toml 確認済 |
| #922 `runtime-admin-web.sh`（env 分岐 + allowlist regex） | ✅ パターン踏襲 |
| `production-runtime-smoke.yml`（workflow_dispatch + environment 承認） | ✅ job 追加で踏襲 |
| CLAUDE.md 不変条件（D1 は apps/api 経由 / cf.sh / secret redact） | ✅ I-1〜I-3 で遵守 |

## 代替案検討（メタ思考 / 水平思考）

| 代替案 | 採否 | 理由 |
| ------ | ---- | ---- |
| A. production 専用の別 runner ファイル `runtime-tag-bulk-production.sh` を新規作成 | ✗ | orchestration（post_bulk/audit_count/cleanup）が完全重複し保守コスト増。followup-007（共通 lib 抽出）未完では DRY を保てない。#922 は単一 runner 拡張を選択済 |
| B. 単一 runner を env 分岐拡張 + 別 guard 関数（採用） | ✅ | 重複排除・staging guard 逐語不変・#922 踏襲・followup-007 非依存 |
| C. staging guard を緩めて production も通す | ✗ | staging smoke の安全性が退化（I-7 違反）。issue 苦戦箇所が明確に禁止 |
| D. 承認 marker を 1 つに簡略化 | ✗ | AC-3 が二重承認を要求。本番書き込みは GitHub environment + runner marker の 2 段で守る |
| E. CI を auto trigger（deploy 後） | ✗ | AC-3「CI 自動実行不可」違反。本番 mutation を毎 deploy で叩くのは危険 |

## スコープ妥当性（CONST_007）

- 全成果物（runner 拡張 / production seed・cleanup SQL / production CI job / local test 拡張 / runbook）は本サイクルで完了可能な範囲。
- 先送り（別 Issue 化）した項目: followup-007 共通 lib 抽出（別 unassigned task・本タスク非依存）/ server idempotency store（issue #913・別物）。いずれも「今回完了させると破綻する明確な理由」を持つ独立スコープであり、分量・複雑さを理由とした先送りではない。
- production 実走証跡取得は user 二重承認後の実行タイミング分離（先送りではない）。

## 判定

| 項目 | 判定 |
| ---- | ---- |
| AC-1〜AC-8 を満たす設計か | ✅ |
| 不変条件 I-1〜I-7 と矛盾しないか | ✅ |
| 状態所有権・責務境界が閉じているか | ✅ |
| リスクに対策が紐づくか | ✅ |
| 本サイクルに収まるか（CONST_007） | ✅ |
| MINOR 指摘 | なし（Phase 12 未タスク検出で baseline 候補のみ記録） |

→ **PASS。Phase 4（テスト作成）へ進む。**

## 完了判定

- [x] 4 条件（価値性 / 実現性 / 整合性 / 運用性）で一次結論
- [x] リスク表に設計レビュー追加リスク 3 件を補完し対策を紐付け
- [x] 代替案 A〜E を検討し採用案 B を確定
- [x] 正本整合（endpoint / staging guard / 環境定数 / #922 / CLAUDE.md）を確認
- [x] レビューゲート PASS 判定
