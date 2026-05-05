# Phase 2: 設計（_design/sync-jobs-spec.md 章立て + schema 設計）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計（_design/sync-jobs-spec.md 章立て + schema 設計） |
| Wave | 3 |
| Mode | parallel（implementation / NON_VISUAL） |
| 作成日 | 2026-05-02 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (実装計画) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |

## 目的

`docs/30-workflows/_design/sync-jobs-spec.md` の章立て・各章で扱うキー・`metrics_json` の zod または JSON Schema 構造・参照ルール（03a / 03b spec → `_design/` への片方向参照）を確定する。実体ファイルは Phase 6 で初版作成するため、本 Phase は設計のみ。

## 実行タスク

1. `_design/sync-jobs-spec.md` の章立て確定
2. `job_type` enum テーブル設計（値 / 用途 / 追加時の更新先）
3. `metrics_json` 共通 schema 設計（zod 採用候補 + JSON Schema バックアップ）
4. job_type 別 `metrics_json` 拡張 schema 設計
5. lock 制御セクション（`lock_acquired_at` / TTL 10 分 / stuck 時の取り扱い）
6. 参照ルール（各 sync task spec → `_design/` の片方向参照のみ、定義の二重持ち禁止）
7. PII 不混入の不変条件セクション（INV-1）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/03b-followup-005-sync-jobs-design-spec/phase-01.md | AC 10 件 / 不変条件 |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | 03b 実装（cursor high-water mark / lock TTL） |
| 必須 | apps/api/src/jobs/sync-lock.ts | lock 制御 |
| 必須 | apps/api/src/jobs/cursor-store.ts | cursor 永続化 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | 現状の `sync_jobs` 節 |
| 推奨 | docs/30-workflows/_design/ | `_design/` 配下既存ファイルの章立てパターン |

## 設計（章立て確定）

### `_design/sync-jobs-spec.md` 章立て

1. 概要（位置づけ / 正本ポリシー）
2. テーブル仕様（既存 DDL 準拠 / 変更しない旨）
3. `job_type` enum 一覧（テーブル形式）
4. `metrics_json` 共通 schema（zod）
5. job_type 別 `metrics_json` 拡張 schema
6. lock 制御（`lock_acquired_at` / TTL 10 分 / stuck lock 復旧）
7. 参照ルール（各 sync task spec はここを差分参照のみ）
8. 不変条件（PII 不混入 / DDL 非変更 / migration 追加禁止）
9. 変更履歴

### `job_type` enum 設計

| 値 | 用途 | cron / trigger | 追加時の更新先 |
| --- | --- | --- | --- |
| `response_sync` | 03b: Google Forms 回答取り込み | cron | `_design/sync-jobs-spec.md` + 03b spec |
| `schema_sync` | 03a: フォーム schema 取り込み | cron | `_design/sync-jobs-spec.md` + 03a spec |

### `metrics_json` 共通 schema（zod 採用候補）

```ts
// 設計のみ（実コードには反映しない）
const SyncJobMetricsCommon = z.object({
  cursor: z.string().optional(),
  processed_count: z.number().int().nonnegative().optional(),
  write_count: z.number().int().nonnegative().optional(),
  error_count: z.number().int().nonnegative().optional(),
  lock_acquired_at: z.string().datetime().optional(),
});
```

### job_type 別拡張

- `response_sync`: `cursor` 必須（`submittedAt|responseId` high-water mark 表現）
- `schema_sync`: `write_count` 必須

### lock 制御

- TTL: **10 分**（03b 実装値正本）
- stuck 時: TTL 超過分は次回 cron で取得し直す
- 値変更時の更新経路: `_design/sync-jobs-spec.md` を更新 → 各 spec / 実装が参照

### 参照ルール

- 各 sync task spec は `_design/sync-jobs-spec.md` を 1 行リンクで参照
- 定義の二重記述禁止（`job_type` enum / `metrics_json` schema / lock TTL を spec 側に転記しない）

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/main.md | 章立て / schema 設計 / 参照ルール |
| メタ | artifacts.json | Phase 2 を completed に更新 |

## 統合テスト連携

- 本タスクは implementation / NON_VISUAL の仕様書作成であり、D1 DDL・API 挙動は変更しない。TS ランタイム正本と既存 consumer の参照化は本 wave で実施済み。
- 統合テストの実行は Phase 11 の NON_VISUAL evidence（cross-reference / job_type coverage / indexes drift）で代替する。
- 実装や schema drift が見つかった場合は、本タスク内で吸収せず別 follow-up に分離する。

## 完了条件

- [ ] `_design/sync-jobs-spec.md` 章立て 9 章が確定
- [ ] `job_type` enum テーブルが 2 件以上で記述
- [ ] `metrics_json` 共通 schema（zod 表記）が確定
- [ ] job_type 別拡張 schema が 2 件以上で記述
- [ ] lock TTL 10 分 / stuck 復旧手順が記述
- [ ] 参照ルール（片方向参照 / 定義二重禁止）が明記
- [ ] PII 不混入の不変条件が章 8 に含まれる
- [ ] DoD: ファイル存在 / リンク有効 / grep 参照確認 / indexes drift なし

## 次 Phase

- 次: 3（実装計画 — 変更ファイル一覧 + 差し替え順序）
- 引き継ぎ事項: 9 章構成 / zod 採用方針 / lock TTL 10 分 / 参照ルール
- ブロック条件: schema 設計が job_type 別に拡張不能 / zod 採用不可（その場合 JSON Schema にフォールバック）
