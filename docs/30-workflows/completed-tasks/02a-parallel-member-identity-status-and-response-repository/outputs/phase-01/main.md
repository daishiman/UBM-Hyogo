# Phase 1: 要件定義

## タスク概要

`02a-parallel-member-identity-status-and-response-repository` タスクは、UBM兵庫支部会の会員管理システムにおいて、D1データベースへのアクセスを担うリポジトリ層を実装する。

## スコープ

### 実装対象テーブル

| テーブル名 | 役割 |
|-----------|------|
| `member_identities` | 会員 ID とメールアドレスの紐付け、現在フォーム回答 ID の管理 |
| `member_status` | 同意状態・公開状態・削除フラグの管理 |
| `member_responses` | フォーム回答本文の保存 |
| `response_sections` | 回答のセクション情報 |
| `response_fields` | 回答の個別フィールド値 |
| `member_field_visibility` | フィールド単位の公開可視性設定 |
| `member_tags` | 会員タグ（read-only） |
| `tag_definitions` | タグ定義（read-only） |
| `deleted_members` | 削除済み会員の記録 |

### 実装対象外

- `schema_versions`, `schema_questions`, `schema_diff_queue`（03a タスクのスコープ）
- `meeting_sessions`, `member_attendance`（別タスクのスコープ）
- `admin_member_notes`（`builder.ts` で adminNotes は引数受け取り型とし、DB 読み込みは別タスク）
- `tag_assignment_queue`（03a タスクのスコープ）

## 機能要件

### FR-01: 会員 ID 管理
- email から member_id を検索できる
- member_id から identities レコードを取得できる
- 新規 member_identity を upsert できる
- 現在回答 ID（current_response_id）を更新できる

### FR-02: 会員状態管理
- member_id から status を取得できる
- 同意状態（publicConsent, rulesConsent）を更新できる
- 公開状態（publishState）を管理者が変更できる
- 会員を論理削除でき、deleted_members に記録される

### FR-03: フォーム回答管理
- response_id から回答を取得できる
- member_id の現在回答を取得できる
- email に紐づく全回答をページネーション付きで一覧できる
- 回答を upsert できる（partial update 禁止、全項目更新のみ）

### FR-04: セクション・フィールド管理
- response_id からセクション一覧を取得できる
- response_id からフィールド一覧を取得できる

### FR-05: フィールド公開可視性管理
- member_id の全フィールド可視性を取得できる
- 特定フィールドの可視性を設定できる

### FR-06: タグ管理（read-only）
- member_id のタグ一覧を取得できる（tag_definitions JOIN）
- 複数 member_id のタグをバッチ取得できる
- 書き込み API は提供しない

### FR-07: ビュー組み立て
- PublicMemberProfile を組み立てる（is_deleted=1 または public_consent!='consented' または publish_state!='public' の場合 null）
- MemberProfile を組み立てる（本人用、visibility=public|member のフィールドを含む）
- AdminMemberDetailView を組み立てる（全 visibility のフィールド、adminNotes は引数受け取り）
- PublicMemberListItems をバッチ組み立てする

## 非機能要件

### NFR-01: D1 境界
- D1 への直接アクセスは `apps/api/src/repository/` にのみ閉じる
- `apps/web` からは直接アクセス禁止（不変条件 #5）

### NFR-02: 型安全性
- MemberId, ResponseId, StableKey などを branded type として扱う（不変条件 #7）
- テストコードでは D1 型を直接使わず、自前 interface 経由でモック

### NFR-03: フォーム回答の正本性
- partial update / patch は提供しない（不変条件 #4）
- フォーム再回答を本人更新の正式な経路とする（不変条件 #7）

### NFR-04: 管理者権限制限
- admin 用 setter は setPublishState / setDeleted のみ（不変条件 #11）
- admin が回答本文を直接編集する API は提供しない

### NFR-05: adminNotes 分離
- builder は adminNotes を引数で受け取り、PublicMemberProfile には含めない（不変条件 #12）

## 受け入れ条件

1. 全リポジトリ関数が vitest でテスト済みであること
2. 型チェックがエラーなしで通過すること
3. MemberId と ResponseId が型レベルで相互代入不可であること
4. is_deleted=1 の会員の PublicMemberProfile が null になること
5. public_consent != 'consented' の会員がパブリックリストに含まれないこと
6. visibility='admin' のフィールドが PublicMemberProfile に含まれないこと
