# 05a follow-up: /public/form-preview 503 調査

## メタ情報

```yaml
issue_number: 388
```

| 項目 | 内容 |
| --- | --- |
| タスクID | task-05a-form-preview-503-001 |
| タスク名 | `apps/api` `/public/form-preview` が staging で 503 を返す原因調査 |
| 分類 | bug-fix / investigation |
| 対象機能 | apps/api public route / register page 依存 |
| 優先度 | Medium |
| ステータス | 未実施 |
| 発見元 | `ut-05a-followup-google-oauth-completion` Phase 11 Stage B-1 endpoint check |
| 発見日 | 2026-05-01 |

## 背景

staging で `https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview` が **HTTP 503** を返す（他 `/public/*` は 200）。`/register` page が fetchPublic 経由で `/public/form-preview` を叩く設計のため、register ページの機能影響可能性。

`apps/api/src/routes/public/form-preview.ts` のロジックで `schema_versions` テーブル等のレコード欠落時に 503 を返す挙動が確認されている。

## 目的

503 の root cause を特定し、staging で 200 を返す状態にする（または production の挙動と整合する seed データを投入する）。

## スコープ

含む:

- `wrangler tail --env staging` で error stack 取得
- `apps/api/src/routes/public/form-preview.ts` の 503 分岐特定
- staging D1 の `schema_versions` / 関連テーブルの状態確認
- 必要なら seed migration / sync 実行
- staging で `/public/form-preview` 200 evidence
- `/register` ページの動作確認

含まない:

- form-preview の API 仕様変更

## 受け入れ条件

- staging `/public/form-preview` が 200
- production も 200
- `/register` page が staging で 200 を返し form preview が表示される

## 関連

- `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-PRD-005`
- `apps/api/src/routes/public/form-preview.ts`

## 苦戦箇所【記入必須】

- 対象:
  - `apps/api/src/routes/public/form-preview.ts`（503 を返す分岐の特定が未確定）
  - staging D1 (`ubm-hyogo-db-staging`) の `schema_versions` 等関連テーブル状態
- 症状: staging `https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview` が **503**。他 `/public/*` は 200。root cause は調査 pending（`schema_versions` レコード欠落で 503 を返す挙動が確認されているが、staging で実際に欠落しているかは未確定）
- 参照:
  - `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-PRD-005`
  - GitHub Issue #388

## リスクと対策

| リスク | 対策 |
| --- | --- |
| seed migration を staging に投入する際に production と整合しないデータを混入させる | 投入前に production の `schema_versions` を `bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production` で取得し差分確認 |
| 503 分岐が複数あり 1 箇所修正で再発する | `form-preview.ts` の return 503 箇所を grep で網羅的に列挙し、各々のトリガー条件を表に整理 |
| `/register` ページが form-preview に依存するため修正中ユーザー導線が壊れる | staging で先行検証し、production には evidence 取得後に反映 |
| 503 が D1 binding 不整合に起因する場合、本タスクのスコープを越える | 切り分け結果に応じて別タスクへ分岐させる旨を Issue に追記する |

## 検証方法

- 実行コマンド:
  - `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging`
  - `curl -s -o /dev/null -w "%{http_code}\n" https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview`
  - `bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT * FROM schema_versions"`
  - `curl -s -o /dev/null -w "%{http_code}\n" https://<web-staging>/register`
- 期待結果:
  - staging `/public/form-preview` 200
  - production `/public/form-preview` 200
  - `/register` 200 かつ form preview が表示される
  - `wrangler tail` に 503 関連 stack が出ない
- 失敗時の切り分け:
  1. tail に stack が出る → 該当 throw 行を `form-preview.ts` から特定し条件分岐を見直す
  2. D1 レコードが空 → seed migration を作成して `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging`
  3. production と挙動差がある → 両環境の `schema_versions` を export して diff 比較
