# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化（命名・型・path・endpoint の正規化） |
| Wave | 3 |
| Mode | serial |
| 作成日 | 2026-04-30 |
| 前 Phase | 7（AC マトリクス） |
| 次 Phase | 9（品質保証） |
| 状態 | spec_created |
| GitHub Issue | #191（CLOSED） |

## 目的

Phase 1〜7 で確定した設計・実装ランブック・AC を踏まえ、既存コードベースとの重複や命名揺れを排除し、`schema_aliases` 関連の命名・型・path・endpoint を一意な正本に正規化する。本 Phase の出力は Phase 13 PR 提出時のリファクタ齟齬を未然に潰す目的で機能する。

## 実行タスク

1. Before / After 表（命名・型・path・endpoint の 4 種）を確定する
2. camelCase（TS）/ snake_case（D1 カラム）の境界を repository 層に閉じ、外部公開しないことを確認
3. 共有 schema 配置先（`packages/shared` vs `apps/api` 内）を Phase 1 Ownership 宣言と整合させて確定
4. lint rule（`UPDATE schema_questions SET stable_key` リテラル grep）の実装計画を Phase 9 に引き渡す
5. 削除候補（既存 07b 実装内に残る `schema_questions` 直接 UPDATE 経路）を一覧化

## Before / After

### 1. 命名（identifier）

| 区分 | Before（現状 / 揺れ） | After（正規化） | 備考 |
| --- | --- | --- | --- |
| TS field | `aliasQuestionId` 未定義 / 07b 内部で `questionId` のみ使用 | `aliasQuestionId` | Google Forms 由来の question_id を alias 文脈で扱う際の一意名 |
| TS field | `stable_key` を TS 側でも snake_case 混在 | `stableKey` | TS 層は camelCase 統一 |
| TS field | `aliasLabel`（未存在） | `aliasLabel` | nullable、解決時点の question label snapshot |
| TS field | `resolved_by` | `resolvedBy` | admin user id |
| TS field | `resolved_at` | `resolvedAt` | ISO8601 文字列 |
| TS field | `source` | `source` | union: `'manual' \| 'auto' \| 'migration'` |
| D1 column | `stable_key` / `alias_question_id` / ... | （Before と同じ snake_case） | DB 層は snake_case 維持 |
| 変換境界 | repository 内のみ（service 層へ漏らさない） | 同左 | mapper を repository 内で閉じる |

### 2. 型（TypeScript）

```ts
// Before（不在）
// — 07b は { questionId: string, stableKey: string } の ad-hoc literal で取り回し

// After（apps/api 内に閉じた canonical type）
export interface SchemaAlias {
  id: string;                              // ULID
  stableKey: string;
  aliasQuestionId: string;
  aliasLabel: string | null;
  source: 'manual' | 'auto' | 'migration';
  createdAt: string;                       // ISO8601
  resolvedBy: string | null; // row read model。manual resolve insert では必須
  resolvedAt: string | null;
}

export interface SchemaAliasInsert {
  id: string;
  stableKey: string;
  aliasQuestionId: string;
  aliasLabel: string | null;
  source: SchemaAlias['source'];
  resolvedBy: string | null;
  resolvedAt: string | null;
}

export interface SchemaAliasPatch {
  stableKey?: string;
  aliasLabel?: string | null;
  source?: SchemaAlias['source'];
  resolvedBy: string;
  resolvedAt?: string | null;
}
```

### 3. path（モジュール配置）

| 区分 | Before | After | 備考 |
| --- | --- | --- | --- |
| migration | （不在） | `apps/api/migrations/<timestamp>_create_schema_aliases.sql` | 新規 |
| repository | 07b 内に inline SQL | `apps/api/src/repositories/schemaAliases.ts` | 新規 |
| repository ext | （不在） | `apps/api/src/repositories/schemaQuestions.ts` に `findStableKeyById(questionId)` 追加 | 既存 patch |
| resolver | 03a 内 inline | `apps/api/src/services/sync/resolveStableKey.ts` | 新規（lookup 順序の単一実装） |
| 07b service | inline UPDATE | `apps/api/src/services/admin/aliasAssignment.ts` | 既存 patch（書き込み先切替） |
| 共有型配置 | — | `apps/api/src/repositories/schemaAliases.ts` 内 export | `packages/shared` には配置しない（apps/web は D1 直接アクセス禁止 = #5、共有不要） |
| 契約テスト | （不在） | `apps/api/test/repositories/schemaAliases.contract.test.ts` | 新規 |

#### 共有 schema 配置の確定

Phase 1 Ownership 宣言では「07b / 03a の書き込み・読み取り経路の追加 patch」のみを本タスク所有としている。`apps/web` 側は alias を直接扱わず、admin UI 経由で 07b API を叩く構造のため、`SchemaAlias` 型を `packages/shared` に置く必要がない。**`apps/api` 内 export に閉じる**ことを確定し、不変条件 #5 と整合させる。

### 4. endpoint（HTTP API 契約）

| 区分 | Before | After | 備考 |
| --- | --- | --- | --- |
| 07b alias 解決 | `POST /admin/schema/aliases` 内で `schema_questions` UPDATE | `POST /admin/schema/aliases` のまま、内部書き込み先を `schema_aliases` へ変更 | body の `questionId` / `aliasQuestionId` 正規化は実装 preflight で確定 |
| request body | `{ stableKey: string }`（既存揺れあり） | `{ stableKey: string, source?: 'manual' \| 'migration' }` | `source` は省略時 `'manual'` |
| response | `{ ok: true }` のみ | `{ ok: true, alias: SchemaAlias }` | 監査 / UI 表示に活用 |
| 03a sync 内部 | resolver 関数が分散 | 単一 `resolveStableKey()` 経由 | endpoint 公開はしない（internal） |
| read endpoint | （不在 / 必要時のみ） | `GET /admin/schema/aliases?questionId=` は本タスク scope out | 06c 表示は別 issue で扱う |

> 既存 07b endpoint の URL / verb / path param 名と差分が出る場合は、**既存値を正本として After を合わせ、本 Phase 8 の Before 列を実 endpoint に修正する**運用ルールとする（破壊的変更を避ける）。Phase 13 の最終レビューで再確認。

## 重複削除候補

| 種別 | 削除対象 | 削除根拠 |
| --- | --- | --- |
| inline SQL | 07b workflow 内の `UPDATE schema_questions SET stable_key = ?` | After で `schema_questions` への書き込みが repository から消える |
| ad-hoc type | 07b 内の `{ questionId, stableKey }` literal type | `SchemaAliasInsert` に統合 |
| 重複 lookup | 03a 内に散在する `schemaQuestions.stableKey` 参照 | `resolveStableKey()` 経由に集約 |

## lint rule（Phase 9 へ引き渡し）

- ripgrep 規則: `rg -n "UPDATE\s+schema_questions\s+SET\s+stable_key" apps/` がヒット 0 を期待
- CI workflow: 既存 `verify-*` ジョブに 1 step 追加（Phase 9 で詳細）
- 例外許可: migration ファイル（DDL）は対象外（grep 対象を `apps/**/*.ts` に限定）

## 不変条件マッピング再確認

| 不変条件 | After 状態での適合 |
| --- | --- |
| #1 | TS 型 `SchemaAlias` がコード内 stableKey 直書きを構造的に防ぐ |
| #5 | repository / type 共に `apps/api/` 配下に閉じる（`packages/shared` 配置しない） |
| #14 | endpoint は既存契約互換の `POST /admin/schema/aliases` に集約 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Before/After 4 表と削除候補 |
| 補助 | outputs/phase-08/lint-rule-spec.md | Phase 9 へ引き渡す lint 仕様 |

## 統合テスト連携

本 workflow は spec_created / docs-only のため、この Phase では統合テストを実行しない。実装タスクでは Phase 4 の verify suite と Phase 7 の AC matrix を入力に、apps/api 側で契約テストと NON_VISUAL evidence を収集する。

## 完了条件

- [ ] Before/After 表が命名 / 型 / path / endpoint の 4 種すべて記載
- [ ] camelCase（TS）/ snake_case（D1）境界が repository に閉じることが明記
- [ ] 共有 schema 配置先が Phase 1 Ownership と整合（`apps/api` 内 export に閉じる）
- [ ] 削除候補が一覧化され、Phase 5 ランブックの該当ステップと突合可能
- [ ] lint rule 仕様が Phase 9 に引き渡される形で記載
- [ ] artifacts.json の phase 8 が `spec_created`

## 参照資料

- 依存 Phase: Phase 6
- 必須: `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
- 必須: `docs/00-getting-started-manual/specs/01-api-schema.md`
- 参考: 既存 07b admin API endpoint 定義（実装ファイル探索は Phase 5 ランブックで完了済前提）
- 上流: Phase 2 設計 / Phase 5 ランブック / Phase 7 AC マトリクス

## 次 Phase への引き渡し

- 引き継ぎ事項: lint rule grep 仕様、共有型配置（apps/api 内に閉じる）、endpoint contract、削除候補一覧
- ブロック条件: 既存 07b endpoint の実 path と After が乖離したまま放置されること
- open question: 移行終端（fallback 廃止）後に `schema_questions.stable_key` カラム自体を削除するか — 別 issue で扱う
