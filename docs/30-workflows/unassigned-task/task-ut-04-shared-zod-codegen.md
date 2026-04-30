# UT-04 shared zod codegen follow-up

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | TASK-UT04-SHARED-ZOD-CODEGEN-001 |
| 状態 | unassigned |
| 作成日 | 2026-04-29 |
| 出典 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-12/unassigned-task-detection.md |
| 優先度 | MEDIUM |

## 目的

D1 の現行 schema から API / repository 層で使う TypeScript 型・Zod schema を派生し、DDL と入力検証の drift を減らす。

## スコープ

含む:

- `member_responses` / `member_identities` / `member_status` / `response_fields` / `schema_diff_queue` / `sync_jobs` の型定義方針
- ISO 8601 TEXT / JSON TEXT / consent enum の検証ルール
- 生成または手書き管理の採否 ADR

含まない:

- D1 migration 追加
- UI 実装

## 苦戦箇所【記入必須】

D1 は SQLite なので DATETIME や JSON は実質 TEXT として保存される。DB だけでは検証できない値が多く、mapper / repository 層の validation が正本 schema とずれる可能性がある。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| DDL と Zod schema の二重管理 | 生成方式と手書き方式を比較し、採用方式を ADR に残す |
| packages/shared が DB 実装詳細を持ちすぎる | apps/api 所有の DB schema と shared 契約型の境界を明示する |

## 検証方法

- `pnpm --filter @repo/shared test:run`
- D1 fixture 1 行から Zod parse が通ること
- 不正 ISO 8601 / 不正 JSON TEXT が reject されること

## 受入条件

- 型定義または生成方針が documented
- UT-09 mapper が同じ契約型を参照できる
