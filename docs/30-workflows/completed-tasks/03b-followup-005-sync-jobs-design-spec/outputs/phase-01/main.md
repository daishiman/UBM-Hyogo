# Phase 1: 要件定義（Why/What/不変条件/4条件評価）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義（Why/What/不変条件/4条件評価） |
| Wave | 3 |
| Mode | parallel（implementation / NON_VISUAL） |
| 作成日 | 2026-05-02 |
| 前 Phase | なし |
| 次 Phase | 2 (設計 — `_design/sync-jobs-spec.md` 章立て + schema 設計) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |
| Issue | #198（CLOSED, 2026-05-02 — クローズドのまま仕様書整備） |

## 目的

03b followup #5（`03b-followup-005-sync-jobs-design-spec.md`）の Why / What / 不変条件を本タスクの AC-1〜AC-10 に 1:1 でマッピングし、4 条件評価と open question を確定する。本 Phase は実体ファイル（`_design/sync-jobs-spec.md`）を作成しない。要件と境界の固定のみが目的。

## 実行タスク

1. Why の整理（03a/03b 個別定義による drift / 同期更新漏れリスクの再確認）
2. What の整理（`_design/sync-jobs-spec.md` を正本にし、`job_type` enum / `metrics_json` schema / lock TTL 10 分を集約）
3. 不変条件の列挙（PII 不混入 / DDL 非変更 / migration 追加なし / lock TTL は 03b 実装値正本）
4. AC-1〜AC-10 の根拠記述（index.md と 1:1 対応 + 担当 Phase 割当）
5. 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）
6. open question 列挙（最大 3 件）
7. implementation / NON_VISUAL タスクであることの明示（CONST_004 適用、TS ランタイム正本化あり）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/03b-followup-005-sync-jobs-design-spec/index.md | 本タスク AC 10 件 / Phase 一覧 |
| 必須 | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-005-sync-jobs-design-spec.md | 起票元 followup |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_jobs` 節の現状把握 |
| 推奨 | apps/api/src/jobs/sync-forms-responses.ts | 03b 実装（lock TTL 10 分の根拠） |
| 推奨 | apps/api/src/jobs/sync-lock.ts | lock 実装 |

## 実行手順（ステップ別）

### ステップ 1: Why の整理

- 03a / 03b の task spec で `job_type` enum / `metrics_json` schema / lock TTL が独立定義されている現状を `outputs/phase-01/main.md` 冒頭に再掲
- 「新 sync wave 追加 → 両 spec 同期更新が必要 → 漏れで enum 不整合」のリスクパスを 1 段落で明記

### ステップ 2: What の整理

- `_design/sync-jobs-spec.md` を新規作成し、以下を集約:
  - `job_type` enum 正本一覧（最低 `response_sync` / `schema_sync`）
  - `metrics_json` 共通 schema（`cursor` / `processed_count` / `write_count` / `error_count` / `lock_acquired_at`）
  - job_type 別 `metrics_json` 拡張 schema
  - lock TTL（10 分）と stuck lock 取り扱い
  - 各 sync task spec からの参照ルール

### ステップ 3: 不変条件

- INV-1: `metrics_json` に PII を含めない（氏名・メール・電話番号・住所等）
- INV-2: DDL は変更しない（既存 schema 準拠）
- INV-3: D1 マイグレーション新規追加なし
- INV-4: lock TTL は 03b 実装値（10 分）を正本、変更時は `_design/` 起点で同期
- INV-5: 03b 実装と schema に乖離が出た場合は本タスク内で吸収せず別 follow-up に分離

### ステップ 4: AC-1〜AC-10 根拠記述

- index.md の AC を `outputs/phase-01/main.md` に転記し、各 AC に下記 4 項目を付ける:
  - 達成根拠 / 検証コマンド / 担当 Phase / 失敗時の分岐

### ステップ 5: 4 条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | `_design/` 集約で同期更新漏れ・drift リスクが解消されるか | PASS |
| 実現性 | implementation / 13 Phase で 1 営業日内に完遂可能か | PASS |
| 整合性 | AC 10 件 / 不変条件 5 つ / `verify-indexes-up-to-date` CI gate と矛盾しないか | PASS |
| 運用性 | 後続 sync wave 追加時に `_design/` 経由で更新するルールが追跡可能か | PASS |

### ステップ 6: open question 列挙

- Q1: `metrics_json` schema の表現は zod / JSON Schema どちらを採用するか → Phase 2 で決定（候補: `@repo/shared` 既存 zod に揃える）
- Q2: 03a 側 task spec が未取り込みの場合、参照差し替えはどこまで先行で良いか → Phase 7 で 03b 単独先行 / 03a は後追い差分の方針
- Q3: 03b 実装と schema に乖離が見つかった場合の分離先 follow-up 命名 → Phase 5 棚卸し時に決定

### ステップ 7: implementation 明示

- CONST_004 に従い `taskType=implementation` / `visualEvidence=NON_VISUAL` を全 phase ファイル冒頭で固定
- 成果物が markdown とドキュメントのみで完結することを `outputs/phase-01/main.md` 末尾で再確認

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | Why / What / 不変条件 / AC 10 件根拠 / 4 条件 / open question |
| メタ | artifacts.json | Phase 1 を completed に更新 |

## 統合テスト連携

- 本タスクは implementation / NON_VISUAL の仕様書作成であり、D1 DDL・API 挙動は変更しない。TS ランタイム正本と既存 consumer の参照化は本 wave で実施済み。
- 統合テストの実行は Phase 11 の NON_VISUAL evidence（cross-reference / job_type coverage / indexes drift）で代替する。
- 実装や schema drift が見つかった場合は、本タスク内で吸収せず別 follow-up に分離する。

## 完了条件

- [ ] Why / What が起票元 followup と整合
- [ ] 不変条件 INV-1〜INV-5 が列挙されている
- [ ] AC-1〜AC-10 すべてに evidence パス / 検証コマンド / 担当 Phase / 失敗時分岐が紐づく
- [ ] 4 条件評価で MAJOR がない
- [ ] open question が 3 件以内
- [ ] implementation / NON_VISUAL の方針が文中で明示されている
- [ ] ファイルが存在し相互リンクが有効（grep で参照確認）
- [ ] `mise exec -- pnpm indexes:rebuild` 実行で drift がない（Phase 9 で再確認）

## 次 Phase

- 次: 2（設計 — `_design/sync-jobs-spec.md` 章立て + schema 設計）
- 引き継ぎ事項: AC 10 件根拠 / 不変条件 5 件 / open question 3 件 / implementation 方針
- ブロック条件: open question 4 件以上 / AC 根拠不足 / 起票元 followup との整合不一致
