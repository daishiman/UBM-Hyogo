# タスク仕様書: Issue #400 — admin request audit target taxonomy 拡張

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-400-admin-request-audit-target-taxonomy |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/400 (CLOSED) |
| 起票元 unassigned-task | `docs/30-workflows/unassigned-task/task-04b-admin-request-audit-target-taxonomy-001.md`（参照元 — 現在 worktree に未存在の場合は Issue #400 本文を SSOT とする） |
| 親タスク | 04b-followup-004 admin queue resolve workflow (#319) |
| 配置先 | `docs/30-workflows/issue-400-admin-request-audit-target-taxonomy/` |
| 作成日 | 2026-05-06 |
| 状態 | implemented-local |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装済みローカル]** — `AuditTargetType` Zod / TS enum 拡張 + `apps/api/src/routes/admin/requests.ts` の audit `target_type` 値変更 + UI placeholder / docs 更新を同一 wave で反映。Issue が CLOSED でも目的（filter 精度を first-class type で確保）達成にコード変更が不可欠なため CONST_004 に従い実コードへ反映した。 |
| 優先度 | MEDIUM（Issue label `priority:medium`） |
| 想定 PR 数 | 1 |
| coverage AC | `apps/api/src/repository/auditLog.ts` / `apps/api/src/routes/admin/requests.ts` の new branch を 80% 以上カバーすること（既存 coverage を下げない） |

## 目的

admin request resolve（visibility_request / delete_request の approve / reject）が audit_log に append される際、現在は `target_type='member'` + `after.noteId` で member 一般変更と区別がつかず、`/admin/audit` の `targetType=member` filter では request resolution と他の member 系 audit が混在する。本タスクで canonical target type **`admin_member_note`** を first-class enum 値として導入し、新規 audit 行のみこの type を使うことで filter 精度を上げる。既存行は migration せず後方互換を維持する。

## スコープ

### 含む

- `apps/api/src/repository/auditLog.ts` の `AuditTargetType` union に `"admin_member_note"` を追加
- `apps/api/src/routes/admin/requests.ts` の resolve 経路（INSERT INTO audit_log）の `target_type` を `'member'` → `'admin_member_note'` に変更し、`target_id` を `note_id`、`after_json` に `memberId` を保持する形に整える（既に `after_json` に `noteId` / `memberId` 両方が入っている前提を維持）
- `packages/shared/src/zod/viewmodel.ts` の audit `targetType` schema 拡張（必要なら enum 化、または現状の `z.string()` のままなら docs に enum 制約を明記し API 側 schema で限定する方向に統一）
- `apps/api/src/routes/admin/audit.ts`（filter エンドポイント側）のドキュメント / OpenAPI 相当コメント更新（filter 値として `admin_member_note` を受け付けることを明示）
- `apps/web/src/components/admin/AuditLogPanel.tsx` の placeholder / 表示 label に新 type を反映（最小限の文言更新）
- 単体テスト追加・更新:
  - `apps/api/src/repository/__tests__/auditLog.test.ts` で `targetType: 'admin_member_note'` の append / listFiltered / listByTarget のラウンドトリップを検証
  - `apps/api/src/routes/admin/requests.test.ts` で resolve 後の audit 行が `targetType='admin_member_note'` / `targetId=<noteId>` / `after_json` に `memberId` を含むことを検証（既存 expect の `'member'` は新仕様に置換）
  - `apps/api/src/routes/admin/audit.test.ts` で `?targetType=admin_member_note` filter が新規行のみを返すこと、既存 `targetType='member'` 行が依然読み取れることを検証
- ドキュメント更新:
  - `docs/00-getting-started-manual/specs/` 配下で audit_log 記述を持つ章（存在すれば）に新 type を追記
  - `.claude/skills/aiworkflow-requirements/references/` に audit target taxonomy の SSOT があれば同期更新

### 含まない

- 既存 `target_type='member'` 行の DB migration / 再分類（CONST: 既存行は据え置く）
- audit_log テーブル DDL の変更（`target_type` は既に TEXT カラム — schema 変更なし）
- 監査画面の大規模 UI リデザイン（最小 placeholder / 説明文のみ）
- `04b-followup-004` 親タスクのスコープ全体（resolve workflow の本流は対象外）

## 不変条件

1. 既存の `target_type='member'` 行は読み取り可能なまま維持する（破壊的 migration を行わない）
2. `AuditTargetType` の TypeScript 型と D1 column の値は append 時のみ整合させる（read 時の `targetType: string` ゆるめ型は維持）
3. `admin_member_note` の `target_id` は `note_id` を格納し、`memberId` は `after_json` に保持する（PII 不混入ルールは継続）
4. shared schema は API 側の Zod を SSOT とし、web/api で重複定義しない

## Phase 構成

| Phase | ファイル | 概要 |
| --- | --- | --- |
| 1 | phase-01.md / outputs/phase-01/main.md | 要件定義・taskType / visualEvidence 確定 |
| 2 | phase-02.md / outputs/phase-02/main.md | 影響範囲調査・対象ファイル一覧 |
| 3 | phase-03.md / outputs/phase-03/main.md | 設計（型・契約・互換性方針） |
| 4 | phase-04.md / outputs/phase-04/main.md | 実装タスク分解 |
| 5 | phase-05.md / outputs/phase-05/main.md | 実装手順詳細 |
| 6 | phase-06.md / outputs/phase-06/main.md | テスト計画 |
| 7 | phase-07.md / outputs/phase-07/main.md | 品質ゲート / coverage 戦略 |
| 8 | phase-08.md / outputs/phase-08/main.md | NON_VISUAL governance（CI gate / lint / type） |
| 9 | phase-09.md / outputs/phase-09/main.md | 静的検証手順 |
| 10 | phase-10.md / outputs/phase-10/main.md | ドキュメント連動 |
| 11 | phase-11.md / outputs/phase-11/main.md | 実行 evidence（NON_VISUAL） |
| 12 | phase-12.md / outputs/phase-12/main.md | Phase 12 必須 6 タスク / strict 7 outputs |
| 13 | phase-13.md / outputs/phase-13/main.md | PR 作成（承認ゲート後のみ） |

## 参照

- `apps/api/src/repository/auditLog.ts:8-13` — 現行 `AuditTargetType` 定義
- `apps/api/src/routes/admin/requests.ts:352-368` — resolve 時の audit INSERT（変更対象）
- `apps/api/src/routes/admin/requests.test.ts:150-160` — 期待値変更必要
- `apps/api/src/routes/admin/audit.ts` — filter エンドポイント
- `apps/web/src/components/admin/AuditLogPanel.tsx:180` — placeholder 文言
- `packages/shared/src/zod/viewmodel.ts:179-188` — audit recentActions schema
