## 概要

Issue 191 の schema alias 実装を完了し、`schema_questions.stable_key` 直接更新から `schema_aliases` への INSERT に移行します。

主な変更:

- `schema_aliases` D1 migration、repository、shared `SchemaAlias` / `SchemaAliasZ` contract を追加
- `POST /admin/schema/aliases` の write path を `schema_aliases` INSERT + diff resolve に変更
- Forms sync の stable key 解決を `schema_aliases` first、`schema_questions.stable_key` fallback に変更
- schema alias 実装に合わせて aiworkflow 正本仕様、Phase-12成果物、未タスクを同期
- 旧 workflow artifacts の整理と completed task への移動を反映

## 関連 Issue

- True Issue: #191
- Dependency: #298

## 変更種別

- [x] 機能追加
- [ ] バグ修正
- [x] ドキュメント更新
- [x] インフラ変更
- [ ] リファクタリング
- [ ] その他（説明: ）

## 4条件チェック

- [x] **価値性**: schema alias 対応表により、Forms 質問ID変更時の stable key 解決と監査可能性を維持する
- [x] **実現性**: 既存 Hono API / D1 / shared zod contract の範囲で成立する
- [x] **整合性**: API / DB / shared type / 正本仕様の same-wave sync を反映済み
- [x] **運用性**: production D1 apply、fallback retirement、direct update guard は別未タスクとして分離済み

## テスト確認

- [x] ローカルで動作確認済み
- [ ] CI が GREEN
- [x] 影響範囲を確認済み（スコープ外サービスへの変更なし）
- [x] secret 実値がコードに含まれていないことを確認済み

ローカル確認:

- `pnpm install --force` PASS（Node 24.x 要求に対しローカル Node v22.21.1 の engine warning あり）
- `pnpm typecheck` PASS
- `pnpm lint` PASS

## その他

UI/UX 変更なし。`docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001/outputs/phase-11/` 配下に画像スクリーンショットはないため、スクリーンショット項目は省略します。

Phase-12 implementation guide 反映元:

`docs/30-workflows/completed-tasks/task-issue-191-schema-aliases-implementation-001/outputs/phase-12/implementation-guide.md`

以下、Phase-12 implementation guide 全文:

````md
# Implementation Guide

## Part 1: 初学者向け

### なぜ必要か

名簿に同じ人の名前が少し違う形で書かれていると、同じ人なのに別人として扱ってしまうことがある。たとえば「山田 太郎」と「山田たろう」が同じ人だと分かるためには、あとから見ても迷わない対応表が必要になる。

### 今回作ったもの

何をするかというと、Google Forms の質問が少し変わっても、古い質問と新しい質問を同じ意味として扱える対応表を作る。既存の受付窓口は変えず、裏側の保存先だけを専用の表へ移す。これにより、古い保存場所を直接書き換えて履歴が分かりにくくなる問題を避ける。

## Part 2: 技術者向け

### Current Contract

- API path: `POST /admin/schema/aliases`
- auth: Auth.js admin JWT + `admin_users.active`
- old write target: `schema_questions.stable_key` direct update
- new write target: `schema_aliases` INSERT + `schema_diff_queue.status='resolved'`
- lookup order: `schema_aliases` first, then `schema_questions.stable_key` fallback on alias miss only
- shared contract: `SchemaAlias` / `SchemaAliasZ`

### Type Shape

```ts
type SchemaAlias = {
  id: string;
  stableKey: string;
  aliasQuestionId: string;
  aliasLabel: string | null;
  source: "manual" | "auto" | "migration";
  createdAt: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
};
```

### APIシグネチャ

`POST /admin/schema/aliases`

### 使用例

```http
POST /admin/schema/aliases
Content-Type: application/json

{
  "questionId": "q_123",
  "stableKey": "member.nickname",
  "dryRun": false
}
```

```ts
await fetch("/admin/schema/aliases", {
  method: "POST",
  body: JSON.stringify({
    questionId: "q_123",
    stableKey: "member.nickname",
    dryRun: false,
  }),
});
```

### エラーハンドリング

`manual_actor_required` と `alias_conflict` は `409` として返す。`alias_conflict` では既存の対応先を `existingStableKey` で返し、管理者が同じ質問を別の stableKey へ誤って結び直さないようにする。

### エッジケース

| Case | Expected behavior |
| --- | --- |
| alias duplicate | reject or idempotently resolve according to repository contract |
| diff row missing | `404` |
| diff/question mismatch | `409` |
| stable key collision | `422` |
| D1 transient lookup error | fail sync job; do not fallback |
| deleted member response | skip back-fill target |

### 設定項目と定数一覧

| Item | Value |
| --- | --- |
| table | `schema_aliases` |
| required index | `idx_schema_aliases_stable_key` |
| forbidden executable write | `UPDATE schema_questions SET stable_key` |
| fallback retirement | out of scope: `task-issue-191-schema-questions-fallback-retirement-001` |

### テスト構成

- NON_VISUAL evidence: `outputs/phase-11/test-results.md`
- D1 schema evidence: `outputs/phase-11/d1-schema-evidence.md`
- Static guard: `outputs/phase-11/static-guard.md`
````
