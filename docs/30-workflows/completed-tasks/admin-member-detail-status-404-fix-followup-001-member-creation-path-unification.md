# member 作成経路の統一 - タスク指示書

## メタ情報

```yaml
issue_number: 1104
task_id: admin-member-detail-status-404-fix-followup-001-member-creation-path-unification
task_name: member 作成経路の統一
```

| 項目         | 内容                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------- |
| タスクID     | admin-member-detail-status-404-fix-followup-001-member-creation-path-unification                  |
| タスク名     | member 作成経路の統一                                                                             |
| 分類         | 改善                                                                                              |
| 対象機能     | apps/api member 作成 / ingest 経路（`sync-forms-responses.ts` の upsertMember / `repository/members.ts` の upsertMember / admin 経由 member 作成） |
| 優先度       | 低                                                                                                |
| 見積もり規模 | 小規模                                                                                            |
| ステータス   | 未実施                                                                                            |
| 発見元       | workflow admin-member-detail-status-404-fix / Phase 10 §10.3 MINOR / Phase 12 unassigned-task-detection MINOR-FUT-1 |
| 発見日       | 2026-06-02                                                                                        |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

親タスク admin-member-detail-status-404-fix は、staging admin 会員管理で
`GET /api/admin/members/{id}` と `PATCH /api/admin/members/{id}/status` が 404 になる問題を
根本解決した。404 の真因は、`member_identities` 行はあるが `member_status` 行が欠落した
orphan 会員が staging に存在したこと（一覧は LEFT JOIN で生存する一方、詳細 / status 更新は
行の存在を前提とするため 404 になる）にある。

その orphan が生じた構造的理由は、member の作成が複数経路に分散している点にある。

- ingest（Form 同期）: `apps/api/src/jobs/sync-forms-responses.ts:303`（`upsertMember` 呼出）
  → `apps/api/src/repository/members.ts:63`（`upsertMember` は `member_identities` のみ作成）。
  `member_status` は同 job の `setConsentSnapshot`（`sync-forms-responses.ts:385`）でしか作られず、
  その経路が条件付き or 例外で抜けると orphan 化する。
- member 生成（identity 作成）と member_status 既定行生成の責務が、単一の helper に集約されていない。

### 1.2 問題点・課題

- `upsertMember` は `member_identities` 行しか作らず、`member_status` 行の生成は呼び出し側
  （ingest job 内の別ステップ）に委ねられている。
- 生成責務が単一点に集約されていないため、新たな作成経路（admin 直接作成等）が将来追加された際にも
  「member_status を作り忘れる」構造的リスクが残り続ける。
- 親タスクの `ensureMemberStatusRow`（F-4）は、ingest と route mutation 前に予防呼び出しを
  「散在的に」配置したものであり、再発を止血する予防策ではあるが、生成責務を構造的に1点へ集約した
  根本解決ではない。呼び出し漏れの可能性が経路追加のたびに再発する。

### 1.3 放置した場合の影響

- 現時点の実害は小さい。親タスク（404-fix）の `ensureMemberStatusRow` 予防呼び出し（F-4）と
  backfill（migration 0024）で既に止血済みであり、新規 orphan は当面発生しない。
- ただし将来 member 作成経路が増えた場合、その新経路が予防呼び出しを欠くと再び orphan が発生し得る。
  予防が「散在呼び出し」である限り、経路追加時の漏れに気付けない。
- 影響が将来時点に限定され、現状は予防で抑止済みであるため、優先度は低とする。

---

## 2. 何を達成するか（What）

### 2.1 目的

member（`member_identities`）の生成と `member_status` 既定行の生成を、単一の責務
（例: `createMember` / `ensureMember` helper）に統一する。どの経路から member を作っても
`member_status` 既定行が必ず同期生成される構造にし、新規 orphan を構造的に発生不能にする。

### 2.2 最終ゴール

- member の生成責務が単一 helper に集約され、その helper 内で `member_identities` と
  `member_status` が必ず同期生成される。
- 親タスクが配置した `ensureMemberStatusRow` の散在的な予防呼び出しが、構造的に1点へ集約される
  （呼び出し漏れが起き得ない構造になる）。
- 既存の全 member 作成経路（ingest / 他経路）が、この単一 helper を経由するよう差し替えられている。
- 既存 endpoint surface・レスポンスは不変で、回帰がない。

### 2.3 スコープ

member 作成経路の棚卸し → 単一 helper への集約 → 各経路の差し替え → 回帰テスト。
対象は `apps/api` のみ。D1 schema 変更・新規 endpoint・apps/web 変更は含まない。

---

## 3. スコープ

### 含むもの

- member 作成経路の棚卸し（ingest の `upsertMember` 呼出 / `repository/members.ts` の `upsertMember` /
  admin 経由の member 作成があればそれも対象）
- `member_identities` + `member_status` 生成を1点に束ねる単一 helper（例 `createMember` / `ensureMember`）への集約
- 既存各経路を単一 helper 経由へ差し替え（散在する `ensureMemberStatusRow` 予防呼び出しの集約）
- 回帰テスト（各経路から member を作ると member_status 既定行が必ず同期生成されることの検証）
- 対象は `apps/api` のみ

### 含まないもの

- D1 schema 変更（カラム追加）
- 新規 endpoint の追加
- `apps/web` の変更
- **FK 制約導入（`member_status.member_id` → `member_identities` への FK）。これは
  followup-002 の責務であり、本タスクからは明確に分離・委譲する**（本タスクはアプリケーション層での
  生成責務集約、followup-002 は DB レベルの整合性保証で関心が異なる）

---

## 4. 受け入れ基準（AC）

| AC番号 | 基準                                                                                          | 測定方法                                                          |
| ------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| AC-1   | member 作成経路の棚卸し表が文書化され、現存する全経路（ingest / 他経路）が列挙されている       | 仕様書 §5 の棚卸し表 / `grep` による呼び出し箇所確認              |
| AC-2   | `member_identities` と `member_status` 既定行を必ず同期生成する単一 helper が新設されている    | repository spec（helper 単体テスト・冪等性確認）                  |
| AC-3   | 既存の全 member 作成経路が単一 helper 経由に差し替えられ、散在する `ensureMemberStatusRow` 予防呼び出しが集約されている | `grep` で散在呼び出しが残っていないこと / 各経路の参照確認        |
| AC-4   | どの経路から member を作っても `member_status` 既定行が生成される（経路ごとの回帰テスト）       | sync-forms-responses spec / 各作成経路の spec                    |
| AC-5   | 既存 endpoint surface・レスポンスが不変で回帰がない（一覧 / 詳細 / status の従来挙動を維持）   | 既存 spec 全 PASS / `mise exec -- pnpm typecheck` 成功            |
| AC-6   | `apps/web` は無変更（diff 0）                                                                  | `git diff --name-only` に apps/web を含めない                    |

---

## 5. 実装方針（How）

### 5.1 現状の複数経路の棚卸し

| 経路 | ファイル | member_identities 生成 | member_status 生成 |
| ---- | -------- | ---------------------- | ------------------ |
| ingest（Form 同期） | `apps/api/src/jobs/sync-forms-responses.ts:303`（`upsertMember` 呼出） | `upsertMember`（`repository/members.ts:63`）が作成 | 同 job の `setConsentSnapshot`（`sync-forms-responses.ts:385`・`status.ts` 経由）に依存。親タスク F-4 で `ensureMemberStatusRow` 予防呼び出しを追加済み |
| repository helper | `apps/api/src/repository/members.ts:63`（`upsertMember`） | 作成する | 作成しない（呼び出し側に委譲） |
| route mutation（status PATCH） | `apps/api/src/routes/admin/member-status.ts` | — | 親タスク F-3 で mutation 前に `ensureMemberStatusRow` を呼ぶ予防を追加済み |
| admin 直接作成（存在すれば） | 棚卸しで確認 | — | — |

> 棚卸しの第一手は、`upsertMember` / `ensureMemberStatusRow` の呼び出し箇所を `grep` で洗い出し、
> member を新規生成し得る経路を網羅すること。

### 5.2 単一 helper への集約案

- `apps/api/src/repository/members.ts` 付近に、`member_identities` 作成と `member_status` 既定行
  生成（`ensureMemberStatusRow` 相当: `INSERT OR IGNORE INTO member_status (member_id) VALUES (?1)`・
  冪等・既定行生成）を**同一 helper 内で必ず両方行う**集約 helper（例 `createMember` / `ensureMember`）
  を新設する。
- 既存の `upsertMember` は内部で member_identities の生成のみを担い、集約 helper がその直後に
  `member_status` 生成を必ず連結する形に整理する（または `upsertMember` 自体に member_status 生成を内包する）。
- ingest（`sync-forms-responses.ts`）と route mutation の散在する `ensureMemberStatusRow` 予防呼び出しを、
  この集約 helper 経由に置き換え、生成責務を構造的に1点へ集約する。
- `member_status` の NOT NULL カラムは全て DEFAULT 値を持つ（`public_consent='unknown'` /
  `rules_consent='unknown'` / `publish_state='member_only'` / `is_deleted=0` /
  `updated_at=datetime('now')`・`0002_admin_managed.sql`）ため、`INSERT OR IGNORE INTO member_status (member_id) VALUES (?1)`
  だけで安全に既定行を生成できる（親タスク §1.3 で確認済み）。

### 5.3 回帰テスト

- 集約 helper 単体: identity 作成と同時に member_status 既定行が生成されること・冪等性（再呼び出しで重複なし）。
- 各経路（ingest / 他経路）から member を作ると member_status 既定行が必ず生成されること。
- 既存挙動の非回帰: 一覧 / 詳細 / status の従来レスポンスが不変であること。
- repository / migration の D1 contract test は `vitest.d1.config.ts` を使用する。

---

## 6. 関連ファイル

- `apps/api/src/jobs/sync-forms-responses.ts`（ingest 経路・`upsertMember` 呼出 :303 / `setConsentSnapshot` :385）
- `apps/api/src/repository/members.ts`（`upsertMember` :63）
- `apps/api/src/repository/status.ts`（`ensureMemberStatusRow` / `getStatus` / `setConsentSnapshot`）
- `apps/api/src/routes/admin/member-status.ts`（status PATCH の予防呼び出し）
- `apps/api/src/repository/_shared/builder.ts`（詳細 view・参考。本タスクでは変更対象外想定）
- `apps/api/src/**/__tests__/*.spec.ts`（回帰テスト・新規 / 編集）
- `apps/api/migrations/0002_admin_managed.sql`（member_status の DEFAULT 値・参考）

---

## 7. リスクと緩和策

| リスク                                                              | 影響度 | 発生確率 | 緩和策                                                                                       |
| ------------------------------------------------------------------- | ------ | -------- | -------------------------------------------------------------------------------------------- |
| 経路の集約で既存 ingest 挙動が変わり回帰が出る                       | 中     | 中       | 集約前後でレスポンス・生成結果を不変に保つ。既存 spec 全 PASS を AC とし、経路ごとに回帰テストを併設 |
| member 作成経路の棚卸し漏れ（隠れた作成経路が残る）                  | 中     | 中       | `upsertMember` / `ensureMemberStatusRow` 呼び出し箇所を `grep` で網羅し、棚卸し表を AC-1 で固定 |
| followup-002（FK 制約）と責務が重複し二重対応になる                  | 低     | 中       | 本タスクはアプリ層の生成責務集約に限定し、DB レベルの整合性保証（FK）は followup-002 に委譲。§3 で境界明記 |
| 集約 helper が冪等でなく重複 INSERT で失敗する                       | 低     | 低       | `INSERT OR IGNORE` を用い、冪等性を AC-2 のテストで強制                                       |
| 既存 endpoint surface を誤って変更してしまう                        | 中     | 低       | 既存 endpoint surface 不変を不変条件とし、AC-5 / AC-6（apps/web diff 0）で強制               |

---

## 8. 参照情報

### 関連ドキュメント

- 親ワークフロー: `docs/30-workflows/completed-tasks/admin-member-detail-status-404-fix/`
  （§1 根本原因 §1.2 発生経路 / §2 採用方針 F-1〜F-5 / §1.3 安全な後付け INSERT 前提）
- `docs/00-getting-started-manual/specs/01-api-schema.md`（フォーム schema と項目定義）
- `docs/00-getting-started-manual/specs/08-free-database.md`（D1 構成）
- `apps/api/migrations/0002_admin_managed.sql`（member_status テーブル定義・DEFAULT 値）

### 責務境界（関連 followup）

- **followup-002（FK 制約導入）**: `member_status.member_id` → `member_identities` への FK 制約を
  DB レベルで導入する責務。本タスク（アプリケーション層での生成責務集約）とは関心が異なるため明確に分離する。
  本タスクは「どの経路から作っても両行が生成される」構造をアプリ層で保証し、followup-002 は
  「両行の参照整合を DB が保証する」防御層を追加する。両者は補完関係であり重複しない。

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | `member_identities` 行はあるが `member_status` 行が欠落した orphan 会員が staging に存在し、一覧は LEFT JOIN で生存する一方、詳細（GET）/ status 更新（PATCH）は行の存在を前提とするため 404 になった |
| 原因     | member 作成が複数経路（ingest の `upsertMember` / 他経路）に分散し、各経路が `member_status` 生成を各自のタイミングで行うため、ある経路では `member_status` が生成されず orphan 化した。生成責務が単一点に集約されていない |
| 対応     | 親タスク（404-fix）では `ensureMemberStatusRow`（`INSERT OR IGNORE` で既定行生成・冪等）を ingest と route mutation 前に散在的に呼ぶ予防（F-4）＋ backfill（migration 0024）で止血。経路統一という根本的な再設計は過剰スコープのため本 followup に分離した |
| 再発防止 | member 作成を単一 helper に集約し、その helper 内で `member_identities` と `member_status` を必ず同期生成する構造にすれば、新規 orphan を構造的に発生不能にできる                          |

### 補足事項

優先度が低い理由は、現時点の実害が親タスクの `ensureMemberStatusRow` 予防（F-4）と
backfill（migration 0024）で既に止血済みであり、新規 orphan が当面発生しないため。
影響は「将来 member 作成経路が増えた際に予防呼び出しを欠くと再発し得る」将来時点に限定される。

実装着手・テスト実行・CI gate 追加・commit / push / PR は、親タスクの不変条件に従い
すべてユーザー承認後に行う。本タスクは `apps/api` のみを対象とし、D1 schema 変更・新規 endpoint・
`apps/web` 変更・FK 制約導入（followup-002 へ委譲）は含まない。
