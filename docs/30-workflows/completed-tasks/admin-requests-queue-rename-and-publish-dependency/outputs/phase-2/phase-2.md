# Phase 2 — 設計

`[実装区分: 実装仕様書]` / 正本: [_shared-context.md](../../_shared-context.md)

## 2.1 アーキテクチャ全体像

```
会員本人 (マイページ /me)
   │ POST /me/visibility-request {desiredState}
   │ POST /me/delete-request
   ▼
admin_member_notes (note_type=visibility_request|delete_request, request_status=pending)  ← D1（既存・不変）
   │                                              ▲
   │ GET /admin/requests?type&status              │ seed (Lane A) で TEST-NOTE-* を pending 投入
   ▼                                              │
[会員からの申請] 画面 (旧 依頼キュー)  ──承認── POST /admin/requests/:noteId/resolve
   │  Lane B: 命名平易化 + 役割説明 + 会員管理への相互リンク       │
   │                                                            ▼
   └──────────────────────────────────────► member_status.publish_state / is_deleted 更新
                                                                ▲
管理者 (会員管理 /admin/members)                                 │ PATCH /admin/members/:id/status（即時・直接）
   │  GET /members → projection に pendingRequestTypes 追加 (Lane C API)
   │  Lane C UI: pending を持つ行に「申請中」バッジ → /admin/requests?type=... へ相互リンク + 説明文
   ▼
会員一覧テーブル
```

設計の要諦: **データモデル（admin_member_notes / member_status）と承認/トグルのロジックは一切変えない**。変えるのは (A) seed データ、(B) apps/web 表示テキスト・説明・リンク、(C) 会員一覧 projection への読み取り専用フィールド追加と UI バッジ。

## 2.2 Lane A — seed 設計

[_shared-context §4](../../_shared-context.md) の通り。設計ポイント:

- catalog.ts に `requests` 配列（`{noteId, memberId, noteType, payload, reason}`）を追加し、build-seed-sql.ts で `admin_member_notes` への `INSERT OR REPLACE` を決定論生成。
- 3 件・3 パターン: 公開中会員の hidden 申請 / 非公開会員の public 申請 / 未削除会員の退会申請。承認すると実際に状態が変わる member を選ぶ（無変化申請を避ける）。
- body JSON は `json_object('reason', <reason>, 'payload', json(<payload-json>))`。payload なし（delete）は `json_object()`。
- created_at/updated_at は既存 seed の固定 ISO 規約に合わせる（決定論・drift guard byte 一致のため）。
- cleanup に `DELETE FROM admin_member_notes WHERE note_id LIKE 'TEST-NOTE-%'`。
- 生成物（test-accounts-seed.sql / cleanup.sql）を再生成しコミット対象に含める。drift guard test が生成 vs committed の byte 一致を検証する。

**データ整合の注意**: delete_request の紐付け先は `is_deleted=0` の会員。visibility の desiredState は会員の現 publish_state と異なる遷移にする。catalog 実値を Read して member を確定。

## 2.3 Lane B — 命名 + 役割明確化 設計

[_shared-context §3 命名マップ](../../_shared-context.md) を逐語適用。設計原則:

1. **変えるのは人間可読テキストノードと `aria-label` のみ**。`id` / `className` / `data-*` / テストセレクタ / ルート / API パス / ファイル名 / import 名は不変（AC-4・リグレッション防止）。
2. ページ説明に「会員本人発の申請を承認/却下する場所。管理者起点の即時変更は会員管理から」を入れ、依頼キューと会員管理の役割差を明文化（AC-2）。
3. 「会員管理」への相互リンクを設置（AC-3）。既存の admin nav / AdminPageHeader の補助リンク慣行に合わせる（新規 primitive を生やさない）。
4. NOTE_TYPE_LABEL（公開停止/再公開・退会）は既に平易なので不変。

## 2.4 Lane C — 申請中バッジ + API 設計

### API（apps/api/src/routes/admin/members.ts）

会員一覧 SELECT に相関サブクエリ 1 本を追加（tags_json と同型・N+1 なし）:

```sql
(
  SELECT json_group_array(DISTINCT amn.note_type)
  FROM admin_member_notes amn
  WHERE amn.member_id = mi.member_id
    AND amn.note_type IN ('visibility_request','delete_request')
    AND amn.request_status = 'pending'
) AS pending_request_types_json
```

- `MemberListRow` 型に `pending_request_types_json: string | null` 追加。
- projection に `pendingRequestTypes: parsePendingRequestTypes(row.pending_request_types_json)`（不正/NULL→`[]`、`["visibility_request"|"delete_request"]` のみ通す純関数）。
- `AdminMemberListViewZ` member item に `pendingRequestTypes: z.array(z.enum(["visibility_request","delete_request"])).default([])`。
- web 側再宣言 zod / adapter / 型へ同フィールドを伝播。

### UI（apps/web）

- 会員一覧行に `pendingRequestTypes.length > 0` で「申請中」バッジ（種別が分かる文言が望ましい）。`<Link href="/admin/requests?type=<noteType>">` で会員からの申請の該当タブへ遷移（AC-10）。
- 会員管理ページに説明 1 文 + 「会員からの申請」相互リンク（AC-11）。
- 既存 status バッジ primitive 再利用・OKLch トークンのみ・HEX 禁止（AC-12）。

### 依存関係の可視化（AC-13 の本質）

会員管理で非公開にしていても、その会員が「再公開」申請を pending で持てば**会員管理側に申請中バッジが出る**。これにより「会員管理の状態」と「会員本人の申請」が別軸であることが画面上で交差して見える。バッジは publish_state とは独立に pending 申請の有無で出す。

## 2.5 データフロー（pendingRequestTypes）

```
admin_member_notes (request_status=pending)
   └─ GET /members 相関サブクエリ json_group_array(DISTINCT note_type)
        └─ pending_request_types_json: "[\"visibility_request\"]"
             └─ parsePendingRequestTypes() → ["visibility_request"]
                  └─ AdminMemberListViewZ.member.pendingRequestTypes
                       └─ web adapter → 行コンポーネント
                            └─ length>0 → 「申請中」バッジ + Link(/admin/requests?type=visibility_request)
```

## 2.6 不変条件の遵守（CLAUDE.md）

- 新 endpoint 追加なし（既存 `/members` の projection 拡張のみ・API surface 形は同一 path）。
- D1 schema 変更なし（admin_member_notes は既存・seed 追加のみ）。
- apps/web から D1 直接アクセスなし（API 経由）。
- OKLch トークン正本・HEX 禁止。
- spec ファイルは `*.spec.{ts,tsx}` のみ。

## 2.7 完了条件（Phase 2）

- [x] 3 レーンのアーキテクチャ・データフローを確定
- [x] Lane C の SQL / 型 / zod / 純関数の設計を確定
- [x] 命名マップを表示テキスト限定で確定（内部識別子不変）
- [x] 依存可視化（AC-13）の設計根拠を明示
- [x] 不変条件の遵守を確認
