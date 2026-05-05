# implementation-guide — task-05a-form-preview-503-001

本ガイドは **Part 1（中学生レベルの例え話）** と **Part 2（技術詳細）** の 2 部構成。両 Part の存在が AC-5 の必要条件。

---

## Part 1 — 中学生レベルの説明（何が起きていたのか）

### 例え話: 「貼り紙が外れた掲示板」

UBM 兵庫支部会のサイトには、入会希望者に「Google フォームの中身プレビュー」を見せる掲示板（=`/public/form-preview`）があります。掲示板は、別の倉庫（=データベース D1）に置かれた **「最新の貼り紙の番号」（=schema_versions）** を見て、対応する貼り紙の中身（=schema_questions）を取り出して表示します。

ところが今回、staging 環境（=本番のリハーサル環境）の倉庫には **「最新の貼り紙の番号」自体が空っぽ** でした。掲示板は番号が無いと貼り紙を取り出せないので「準備中です（HTTP 503）」というエラーを返してしまっていたのです。

### 何を直したか

ローカル実装では、「番号がない」ときに何が起きたかをすぐ追える警告ログと回帰テストを追加しました。倉庫（D1）への書き込みは本ワークツリーからは未実行で、Phase 11 の runtime evidence 取得時に operator が Part 2 の手順で実施します。

### なぜ放置するとマズいか

- 入会希望者がアクセスする `/register` ページが「フォームプレビュー読み込み中…」のままになる
- 503 は「サーバーが一時的に死んでいる」とブラウザや検索エンジンに判断され、信用が落ちる

### 再発しないためにやったこと

- 「番号がない」という珍しい状況を、テストでわざと作って、エラーがちゃんと 503 で返ること・番号があれば 200 で返ることを毎回チェックする仕組みにした
- 倉庫が空っぽになった時の **復旧手順書（runbook）** を Part 2 にまとめた

### 専門用語セルフチェック

| 用語 | 日常語での言い換え |
| --- | --- |
| HTTP 503 | 今は準備できていない、という返事 |
| D1 | サイトが使う表つきの保管場所 |
| schema_versions | どの貼り紙が最新版かを示す番号札 |
| schema_questions | 貼り紙に書かれた質問の一覧 |
| runbook | 困った時に順番どおり見る手順書 |
| staging | 本番公開前の練習場所 |

---

## Part 2 — 技術詳細

### 2.1 root cause

| 項目 | 内容 |
| --- | --- |
| 症状 | staging `GET /public/form-preview` が HTTP 503 |
| 直接原因 | `apps/api/src/use-cases/public/get-form-preview.ts` で `getLatestVersion()` が `null` を返す |
| エラーコード | `UBM-5500`（`packages/shared/src/errors.ts` で `status: 503` にマップ） |
| 真因 | staging D1 (`ubm-hyogo-db-staging`) の `schema_versions` テーブルにレコード 0 件 |
| 影響範囲 | staging / production の runtime curl は 2026-05-05 のレビュー実測で 503。production 200 維持という旧記述は撤回し、AC-2 は runtime blocker として扱う |

### 2.2 schema_versions テーブル仕様（参照）

`docs/00-getting-started-manual/specs/01-api-schema.md` および `docs/00-getting-started-manual/specs/08-free-database.md` を参照。

- `schema_versions(revision_id, form_id, schema_hash, state, synced_at, source_url, field_count, unknown_field_count)`：フォームの構造バージョンの正本。公開可能な最新行は `state = 'active'` で判定する
- `schema_questions(question_pk, revision_id, stable_key, question_id, item_id, section_key, section_title, label, kind, position, required, visibility, searchable, status, choice_labels_json)`：各バージョンの質問群
- `/public/form-preview` は `schema_versions` の最新行 → `schema_questions` 結合 → JSON で返す

### 2.3 UBM-5500 mapping

| code | message | http status | mapping 場所 |
| --- | --- | --- | --- |
| UBM-5500 | schema 未投入 / 取得失敗 | 503 | `packages/shared/src/errors.ts` `UBM_ERROR_CODES` |

### 2.4 環境変数 / D1 binding

| 環境 | D1 binding | DB 名 |
| --- | --- | --- |
| staging | `DB` | `ubm-hyogo-db-staging` |
| production | `DB` | `ubm-hyogo-db-prod` |

`apps/api/wrangler.toml` の `[[env.staging.d1_databases]]` / `[[env.production.d1_databases]]` を参照。

### 2.5 復旧 runbook（staging）

```bash
# 1) 現状確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT COUNT(*) AS n FROM schema_versions;"

# 2) active revision を投入（staging のみ。production は別承認）
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "INSERT INTO schema_versions (revision_id, form_id, schema_hash, state, source_url, field_count, unknown_field_count) VALUES ('manual-staging-form-preview-001', '119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg', 'manual-staging-form-preview-001', 'active', 'https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform', 0, 0);"

# 3) 確認
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "SELECT form_id, revision_id, state, synced_at FROM schema_versions WHERE state = 'active' ORDER BY synced_at DESC LIMIT 1;"

# 4) HTTP 200 を確認
curl -s -o /dev/null -w "%{http_code}\n" \
  https://ubm-hyogo-api-staging.daishimanju.workers.dev/public/form-preview
```

> `getLatestVersion()` は `state = 'active'` のみを読むため、`synced` や `published` を投入しても 503 は解消しない。`schema_questions` は `revision_id` で紐づくため、`schema_questions.form_id` を前提にした確認 SQL は使わない。

### 2.6 production への影響と確認

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  https://ubm-hyogo-api.daishimanju.workers.dev/public/form-preview   # 200 期待
```

production は本タスクで変更しない。2026-05-05 のレビュー実測では production も 503 のため、AC-2 は **runtime blocker** として扱い、production D1 への書き込みは別途 user approval gate を通す。

### 2.7 回帰テスト（実装サイクルで実装済み）

`apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts` に以下 9 ケースを実装済み（10 件中 9 件が本タスク経由）：

| ID | テスト名 | 担保 |
| --- | --- | --- |
| 既存 happy | schema manifest と field を view に組み立てる | 200 系 |
| 既存 null | schema_versions が無い場合は UBM-5500 を投げる | 503 mapping |
| 既存 fail | schema_questions の query 失敗を伝播させる | error propagation |
| TC-RED-01 / TC-FAIL-01 | schema_questions が 0 件でも 503 にならず fieldCount=0 / sectionCount=0 で view を返す | 不変条件 #14（schema 集約点） |
| TC-RED-02-A | GOOGLE_FORM_ID が undefined のとき FORM_ID で schema_versions を検索する | env fallback |
| TC-RED-02-B | GOOGLE_FORM_ID / FORM_ID が共に undefined なら FALLBACK formId で検索する | CLAUDE.md フォーム固定値 |
| TC-FAIL-02-a | choice_labels_json が不正な JSON のとき空配列で fallback する | parseChoiceLabels try/catch |
| TC-FAIL-02-b | choice_labels_json が object の場合は空配列で fallback する | Array.isArray ガード |
| TC-COV-01 | env 両方 undefined で manifest が null のときも UBM-5500 を投げる | usedFallback 経路の branch 補完 |

`apps/api/src/routes/public/index.test.ts` に以下 1 ケースを追加：

| ID | テスト名 | 担保 |
| --- | --- | --- |
| TC-RED-03 / TC-REG-01 | GET /form-preview は schema_versions 欠落時に UBM-5500 (HTTP 503) を返す | route 層 503 mapping |

実測:
- focused local regression は 2026-05-05 review で再実行。`pnpm --filter @ubm-hyogo/api exec vitest run apps/api/...` は filter 後 cwd の都合で no-test となったため、root から `pnpm exec vitest run apps/api/src/use-cases/public/__tests__/get-form-preview.test.ts apps/api/src/routes/public/index.test.ts` を正コマンドとして使う。
- coverage `get-form-preview.ts`: Stmts 100 / Branches 100 / Funcs 100 / Lines 100

### 2.9 構造化ログ（実装サイクルで採用）

`apps/api/src/use-cases/public/get-form-preview.ts` の `manifest === null` 分岐に `@ubm-hyogo/shared/logging` の `logWarn` を追加：

```ts
if (!manifest) {
  logWarn({
    code: "UBM-5500",
    message: "schema_versions row missing — returning 503",
    context: {
      where: "getFormPreviewUseCase",
      formId,
      usedFallback:
        env.GOOGLE_FORM_ID === undefined && env.FORM_ID === undefined,
    },
  });
  throw new ApiError({ code: "UBM-5500", detail: "..." });
}
```

これにより staging で 503 が再発した際、`wrangler tail` で `code=UBM-5500` を grep するだけで root cause（schema_versions 0 件 + どの formId で lookup したか）を即時識別できる。`apps/api/src/middleware/error-handler.ts` で `logError` 使用前例があり追加依存なし。

### 2.8 関連 Issue / 仕様

- GitHub Issue #388 (CLOSED) — 起票元、`Refs #388` で参照
- `docs/30-workflows/unassigned-task/task-05a-form-preview-503-001.md` — 元 spec
- `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-11/discovered-issues.md` `P11-PRD-005`
