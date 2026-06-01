# Phase 11 手動 smoke ログ（NON_VISUAL / 自動テスト代替）

> 本タスクは API-only / NON_VISUAL。ローカル dev server は起動せず、同等の HTTP contract spec と parser/use-case test を主証跡とした。

## 目的

`expand=tags` 指定時のみ tags が応答に含まれ、未指定時は現行挙動（tags なし）が維持されることを
実 API 応答で確認する（AC-1 / AC-3 の手動確認）。自動テスト（`main.md`）の補助証跡。

## 前提

- API をローカル起動（`mise exec -- pnpm --filter @ubm-hyogo/api dev` 等、実起動コマンドは実装時に確定）。
- D1 に公開可能な member（`public_consent='consented'` / `publish_state='public'` / `is_deleted=0`）と、
  その member に紐づく active な tag が最低 1 件存在すること。

## 手順

### 1. expand 未指定（現行挙動の維持確認）

```bash
curl -s "http://127.0.0.1:8787/public/members" | jq '.items[0] | keys'
```

- 期待: 返却キーに `tags` が **含まれない**（既存 shape のまま）。

### 2. expand=tags（tags 付与の確認）

```bash
curl -s "http://127.0.0.1:8787/public/members?expand=tags" | jq '.items[0]'
```

- 期待: item に `tags: [{ "code": ..., "label": ..., "category": ... }, ...]` が含まれる。
- 期待: tag を持たない member は `tags: []`。

### 3. appliedQuery の回帰確認

```bash
curl -s "http://127.0.0.1:8787/public/members?expand=tags" | jq '.appliedQuery | keys'
```

- 期待: `appliedQuery` に `expand` が **含まれない**（`.strict()` 6 キー固定の回帰維持）。

### 4. 未知 expand 値の防御確認

```bash
curl -s "http://127.0.0.1:8787/public/members?expand=tags,unknown" | jq '.items[0] | has("tags")'
```

- 期待: `true`（未知値 `unknown` は黙って除外され、`tags` のみ有効）。エラーにならない。

## 応答抜粋

```
curl 実行は未実施。代替として `apps/api/src/routes/public/index.contract.spec.ts` が Hono route へ直接 request し、
`expand=tags` / expand 未指定 / repeated expand / appliedQuery 6キー固定を検証済み。
```

## 判定

| 手順 | 期待 | 結果 |
| ---- | ---- | ---- |
| 1    | tags キーなし | PASS（contract spec） |
| 2    | tags 配列付与 | PASS（contract spec） |
| 3    | appliedQuery に expand なし | PASS（contract spec） |
| 4    | 未知値除外・エラーなし | PASS（parser + contract spec） |
