# Phase 2 — 設計

## 目的

Phase 1 の AC を満たす実装の topology・責務境界・SubAgent lane・検証 path を設計する。既存コンポーネント再利用を最優先し、新規 primitive を増やさない（FB-SDK-07-1）。

## 成果物

- 実装 topology / lane 分割 / state ownership / adapter 設計 / seed builder 設計（本ファイル）。

## 設計方針

### 責務境界（concern 1-3 / apps/web 表現層）

| レイヤ | 責務 | 変更可否 |
| --- | --- | --- |
| API (`apps/api/routes,repository,services`) | 候補検出・merge/dismiss・レスポンス shape | **不変**（AC-8） |
| shared 型 (`packages/shared`) | `IdentityConflictRow`/`matchedFields` 等 | **不変**（AC-8） |
| 表現層 page/Row/Guide | 受け取った API データを**日本語で表示**・操作 UX | 変更/新規 |
| glossary | `matchedFields("name"/"affiliation")` → `氏名`/`職業` の単方向 adapter | 新規 |

> 原則: API が返す英語キー（`name`/`affiliation`）はそのまま受け取り、**表示の最終段でのみ** glossary 変換する。型・fetch path は触らない。

### 再利用するもの（新規 primitive を作らない）

- `AdminSectionCard` / `AdminPageHeader` / `EmptyState` / `Pagination` / `Badge` / `Button` / `Textarea`（既存）。
- `IdentityConflictAnnouncer`（aria-live）はそのまま再利用。
- `IdentityConflictGuide` は `AdminSectionCard`（または既存の注記スタイル）を内部合成する stateless component（新規だが既存 primitive の組み合わせのみ）。

### state ownership（IdentityConflictRow）

現行の `stage`（idle/merge-confirm/merge-final/dismiss）/ optimistic / mutation hook 構造は**維持**。変更は**表示文言と glossary 経由の badge ラベルのみ**。state machine・mutation endpoint・optimistic 挙動・fade animation は不変（既存テスト/挙動を壊さない）。

### glossary 設計（adapter）

```ts
// apps/web/src/features/admin/identity-conflicts/identityConflictGlossary.ts
export const MATCHED_FIELD_LABELS: Record<string, string> = { name: "氏名", affiliation: "職業" };
export const matchedFieldLabel = (field: string): string => MATCHED_FIELD_LABELS[field] ?? field;
// 任意: 画面共通文言（source/target ラベル等）も定数化して Row/page から参照
export const RECORD_ROLE_LABELS = { source: "新しい登録", target: "まとめ先（以前の登録）" } as const;
```

- 純データ＋純関数。throw しない。未登録キーは原文 fallback（WEEKGRD-02 防御的返却）。

### Guide 設計

- `IdentityConflictGuide.tsx`: props 無し（または `className?`）。3 点の説明をリスト表示。色 `var(--ubm-color-*)`。
- 配置: `page.tsx` の `AdminPageHeader` 直後・候補カードの上（empty/error/list いずれの分岐でも常に表示）。

### concern 4 seed 設計（apps/api + scripts / NON_VISUAL）

#### catalog（SSOT）

```ts
// apps/api/src/testing/identity-conflicts/catalog.ts
export interface DupMember { memberId; responseId; email; fullName; occupation; ubmZone; lastSubmittedAt; }
export const IDENTITY_CONFLICT_SEED = {
  actor: "seed:identity-conflicts",
  formId / revisionId / schemaHash,            // TEST-REV-DUP 等
  members: DupMember[],                          // 10 件（shared-context §6.3 の通り）
} as const;
```

#### build-seed-sql（pure）

```ts
// apps/api/src/testing/identity-conflicts/build-seed-sql.ts
export const buildIdentityConflictSeedSql = (catalog = IDENTITY_CONFLICT_SEED): string => { ... }
export const buildIdentityConflictCleanupSql = (catalog = IDENTITY_CONFLICT_SEED): string => { ... }
```

- 既存 `test-accounts/build-seed-sql.ts` の helper（`sqlString`/`sqlJson`/`buildInsert`）と同等のローカル関数を持つ（共有 module を汚さないため再実装、または export 拡張は避ける）。
- 出力テーブル: `schema_versions`(1) / `schema_questions`(fullName,occupation,ubmZone 等最小) / `member_responses`(10) / `response_fields`(各 member の fullName,occupation,ubmZone,location,businessOverview,selfIntroduction) / `member_identities`(10) / `member_status`(10)。
- `value_json` は `JSON.stringify` 後に SQL クォート（`json_extract` 互換）。`INSERT OR REPLACE` で idempotent。明示 BEGIN/COMMIT 無し（D1 remote 制約）。

#### 決定論（contract test のため）

- `Date.now()`/乱数を使わない。`lastSubmittedAt` は catalog 固定値。生成 SQL はバイト決定論。

#### ライブラリ選定 / semantics 実測（FB-CRONVL-001 相当の事前確認）

- NFKC 正規化は検出側（detector）が `normalize("NFKC")` で行うため、seed 側は**原文をそのまま保存**すればよい（P2 の全角/半角、P3 の末尾空白を SQL にそのまま格納）。検出が trim+NFKC で一致させることを Phase 4/11 で実測確認する。

### lane 分割（Phase 4-13 の SubAgent 並列化）

| lane | 範囲 | 並列 |
| --- | --- | --- |
| Lane A | Phase 4-5（テスト計画＋実装手順：concern 1-3 と concern 4 の両方の手順を含む） | 並列可 |
| Lane B | Phase 6-10（テスト追加/カバレッジ/リファクタ/QA/最終レビュー） | 並列可 |
| Lane C | Phase 11-13 + outputs/phase-11 + outputs/phase-12（strict 7） | 並列可 |

validation lane（gate 実行）は直列で最後に締める。

## ステップ間 state 引き渡し（multi-step 確認 UI）

| 遷移 | 保持 | リセット |
| --- | --- | --- |
| idle → merge-confirm | — | — |
| merge-confirm → merge-final | — | — |
| merge-final → idle（キャンセル/成功） | — | mergeReason クリア |
| idle → dismiss → idle | — | dismissReason クリア |

> 既存挙動を維持（本タスクは文言変更のみで state machine 非変更）。

## 統合テスト連携

- glossary は純関数単体テスト。Row/Guide は jsdom で文言・glossary 経由 badge を検証。
- seed は contract test（生成 drift / idempotent / 行数）＋ local D1 apply の機能 smoke（Phase 11）。
- gate: `verify:phase12-compliance` / `gate-metadata:validate` / `verify:tokens`。

## 完了条件

- [ ] 責務境界（API 不変・表現層のみ変更）を固定した。
- [ ] glossary/Guide/seed builder の signature を設計した。
- [ ] lane 分割と検証 path を定義した。
