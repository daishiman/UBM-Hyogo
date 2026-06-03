# Phase 8: リファクタリング

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 8（リファクタリング） |
| 入力 | Phase 5 実装（GREEN）/ Phase 6 拡充 / Phase 7 カバレッジ |
| 出力 | 重複削減・命名整合済みの実装（インターフェース不変） |
| 分類 | NON_VISUAL（`apps/api` のみ。`apps/web` 無変更） |
| Step 2（公開 API 設計レビュー）要否 | 不要（外部 endpoint surface・関数シグネチャ不変。下記 §8.4 根拠） |

## 目的

Phase 5-7 で GREEN 化した実装を、外部から観測可能な挙動（HTTP レスポンス・関数シグネチャ）を 1 byte も変えずに内部品質だけ引き上げる。具体的には `ensureMemberStatusRow` / `defaultMemberStatusRow` を ingest・route・builder の 3 経路で共用し、`member_status` 既定行の生成・既定値表現の重複を排除する。命名ドリフトと navigation drift（参照リンク不整合）が無いことを確認する。

## 実行タスク

### 8.1 重複削減（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `member_status` 既定行の生成 SQL | ingest（`sync-forms-responses.ts`）・status PATCH（`member-status.ts`）・builder（`_shared/builder.ts`）が各々 `INSERT OR IGNORE` を書く可能性 | `repository/status.ts` の `ensureMemberStatusRow(c, mid)` 1 箇所に集約し 3 経路から import して呼ぶ | DRY。既定行生成ロジックの正本を 1 箇所に固定し、SQL 文の分散コピーを禁止する（不変条件 #5 の D1 アクセスは `apps/api` 内に閉じる） |
| 既定 status の値表現 | builder の degraded 分岐内に `public_consent:'unknown'` 等を inline 直書きする可能性 | `defaultMemberStatusRow(id)` 純関数を `status.ts` に置き、builder の `status ?? defaultMemberStatusRow(mid)` で参照 | 既定値の単一情報源化。`0002_admin_managed.sql` の DEFAULT と二重管理になる箇所を 1 つの純関数へ集約 |
| 「identity 存在判定」 | route と builder が別々の exists 判定を新設する可能性 | 既存 `findMemberById`（`members.ts:29`）を双方で再利用し新規 exists 関数を増やさない | 命名ドリフト回避（Phase 1 §1.4 / FB-SDK-07-4）。判定基準（identity 行有無）を 1 関数に統一 |

### 8.2 命名整合

| 項目 | 規則 | 確認 |
|------|------|------|
| helper 関数名 | 既存 `getStatus` / `setPublishState` / `setConsentSnapshot`（動詞 + 対象, camelCase）に整合 | `ensureMemberStatusRow`（動詞 ensure + 対象 MemberStatusRow）で一貫 |
| 既定値関数名 | 純関数・副作用なしであることを名前で表現 | `defaultMemberStatusRow`（名詞句・取得系）で副作用関数 `ensure*` と明確に区別 |
| migration 名 | `NNNN_snake_case.sql` 4 桁連番 | `0024_backfill_member_status.sql`（直近 `0023_member_photos_source.sql` の次） |
| builder | 新規関数を増やさず `buildAdminMemberDetailView` を拡張 | 関数名・引数 unchanged（§8.4） |

### 8.3 navigation drift / 参照整合

- 本タスクは `apps/web` を変更しないため UI ナビゲーション（sidebar / route group / activePath）への影響は無い。navigation drift は構造的に発生しない。
- `index.md` §5 Phase 構成の `[phase-8.md]` リンク・本ファイルの相互参照（Phase 5/7/9）が実ファイルを指すことを確認する。

### 8.4 インターフェース不変の根拠（Step 2 不要）

| 観点 | 不変の根拠 |
|------|-----------|
| 外部 endpoint surface | `GET /admin/members/:memberId` / `PATCH /admin/members/:memberId/status` のパス・メソッド・成功時レスポンス schema（`AdminMemberDetailViewZ` / `{ ok, status }`）は変更しない（不変条件: 既存 API のみ接続） |
| 公開関数シグネチャ | `buildAdminMemberDetailView` / `getStatus` / `setPublishState` の引数・戻り型は不変。追加するのは `ensureMemberStatusRow`（void）と `defaultMemberStatusRow`（純関数）の 2 つで、既存呼び出し側の契約は壊さない |
| zod schema | `MemberProfileZ.responseId` は `min(1)` を degraded 時も満たす（`current_response_id ?? member_id`）。schema 自体は無変更 |

→ 公開 API 形状が一切変わらないため、公開 API 設計レビュー（Step 2）は不要。内部リファクタのみで完結する。

## 参照資料

- Phase 2 §2.2 / §2.3（helper・既定 status 契約）
- Phase 5 実装（GREEN）/ Phase 7 カバレッジ
- `apps/api/src/repository/status.ts` / `_shared/builder.ts` / `routes/admin/member-status.ts` / `jobs/sync-forms-responses.ts`

## 成果物

- 本ファイル（Phase 8 リファクタリング）
- 重複削減 3 点・命名整合・インターフェース不変根拠の確定記録

## 統合テスト連携

- リファクタは挙動不変が前提のため、Phase 6 で確立した全テスト（status 欠落 / response 欠落 / identity 不在 / ingest / migration / 非回帰）が refactor 後も GREEN であることを Phase 9 で再確認する。
- `ensureMemberStatusRow` を 3 経路で共用したことにより、helper の単一 spec（`status.repository.spec`）が ingest / route 双方の既定行生成を間接的に保証する。

## 完了条件

- [x] 重複削減 3 点（SQL 集約 / 既定値集約 / exists 判定再利用）を対象/Before/After/理由で記録した
- [x] 命名整合（`ensureMemberStatusRow` / `defaultMemberStatusRow` / migration 名）を確認した
- [x] navigation drift が無いことを確認した
- [x] インターフェース不変を根拠付けし Step 2 不要と判定した
