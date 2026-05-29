# Phase 1: 要件定義

## 1.1 背景

google-form-reflection-diagnostics 本体（completed）で Phase 01 H2 仮説として識別された問題:

- `member_responses` には Google Form 経由で submit された response が存在する
- しかし対応する `member_identities` row が無いと、`/auth/session-resolve` は `gateReason=unregistered` を返す
- 結果として、Google Form に回答済みの本人でも sign-in できず、`/profile` を含む `/me/*` 全経路から永続的に解決不能になる

最新コードベース確認（2026-05-27 時点 `dev` HEAD）:

- `apps/api/src/routes/auth/session-resolve.ts:47` が `findIdentityByEmail` のみで判定（`member_responses` 側を見ない）
- `apps/api/src/diagnostics/forms-pipeline.ts:196-198` に `membersWithoutIdentity` metric は既に実装済（`member_status` あり / `member_identities` 欠損を COUNT）
- `apps/api/src/jobs/sync-forms-responses.ts:289` の `upsertMember` で同期時に `member_identities` を作成する経路はあるが、過去に sync が落ちた member や手動 seed された member については backfill が無い

## 1.2 問題のスコープ（最新コードに合わせて再フレーム）

旧仕様書（unassigned-task/...-followup-002）は `external_id` / OAuth sub を matching 軸として想定していたが、現 schema の `member_identities` には `response_email` のみが alias 列として存在する（`apps/api/migrations/0001_init.sql:90-101`）。また `member_responses` には `member_id` が無い。よって本タスクの matching 軸は **email 単軸**、既存 member_id 復元は `tag_assignment_queue(response_id, member_id)` bridge が残る範囲に確定する。

## 1.3 機能要件（FR）

| ID    | 要件                                                                                                                                    |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------- |
| FR-01 | `tag_assignment_queue` bridge で member_id を復元でき、かつ `member_responses` に存在し `member_identities` に存在しない email について、最新 submitted_at の response_id を `current_response_id` として `member_identities` row を生成する backfill migration を提供する |
| FR-02 | 同一 email の `member_responses` 履歴が複数ある場合、最古を `first_response_id`、最新を `current_response_id` とする                     |
| FR-03 | backfill SQL は `INSERT OR IGNORE` または `WHERE NOT EXISTS` 相当で冪等化する                                                          |
| FR-04 | `/auth/session-resolve` で `member_identities` が見つからない場合、`member_responses` を email で検索し、存在すれば auto-link を実行してから再度 status / admin lookup を行う |
| FR-05 | auto-link は既存 `member_identities` row を改変しない。bridge が無い email は `autolink:<uuid>` member_id を作り、status が無ければ既存契約どおり `rules_declined` に倒す |
| FR-06 | `/admin/diagnostics/member/:id` の `H2_identityMissing` は bridge-backed sample で false を返す。bridge 無し orphan は schema 上 email 対応が存在しないため、本タスクの migration で既存 member_id へ復元しない |

## 1.4 非機能要件（NFR）

| ID     | 要件                                                                            |
| ------ | ------------------------------------------------------------------------------- |
| NFR-01 | backfill migration の実行時間は production D1 で 60 秒以内（member_responses < 50k 行を想定） |
| NFR-02 | auto-link は session-resolve 1 リクエスト内で完結し、D1 round-trip ≤ 3 回         |
| NFR-03 | production 投入前に staging で 100% 検証完了をゲートとする                       |
| NFR-04 | 全変更が `pnpm typecheck` / `pnpm lint` / `pnpm --filter api test` で green     |

## 1.5 制約

- C1〜C6（index.md 参照）
- 本タスクは Google Form schema を変更しない（CLAUDE.md 不変条件 #1）
- response_email は normalize された lowercase 形式で扱う（既存 `asResponseEmail` ブランド型に従う）

## 1.6 スコープ外

- Auth.js provider 切替（Google OAuth / Magic Link の入替）
- `member_responses` 側に UNIQUE 制約を追加すること（履歴行のため許容、CLAUDE.md 0001_init.sql コメント参照）
- H1 / H3 / H4 仮説の修復（別 followup）
