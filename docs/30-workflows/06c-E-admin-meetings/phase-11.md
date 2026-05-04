# Phase 11: 手動 smoke / 実測 evidence — 06c-E-admin-meetings

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-E-admin-meetings |
| phase | 11 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 実装区分

[実装区分: 実装仕様書]

本タスクは admin meetings 機能の follow-up 実装を含むため、CONST_005 必須項目を満たす実装仕様書として作成する。

## 目的

実装後に踏む手動 smoke と実測 evidence の取得手順、placeholder 配置を確定する。

## 実行タスク

1. screenshot path を決める（例: `outputs/phase-11/screenshots/admin-meetings-list.png`）。完了条件: list / create drawer / attendance / CSV のうち最低 4 枚が定義される。
2. curl による API smoke 手順を書く（cookie 取得 → POST → GET → CSV download）。完了条件: 認証 cookie の扱いが明記される。
3. wrangler 出力 placeholder（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` の Version ID 記録欄）を置く。完了条件: secret 値は記載しない。
4. ログイン admin として Cloudflare staging で踏む手順を書く。完了条件: 失敗時の rollback 手順が併記される。

## 参照資料

- CLAUDE.md（Cloudflare 系 CLI 実行ルール）
- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md

## 実行手順

- 対象 directory: docs/30-workflows/06c-E-admin-meetings/
- 本仕様書作成ではアプリケーションコード、D1 migration 適用、deploy、commit、push、PR 作成を行わない。
- 実測時は `bash scripts/cf.sh ...` 経由のみ使用する（`wrangler` 直接実行禁止）。
- screenshot / curl 出力 / wrangler 出力に secret 値が混入しないよう mask する。

## 統合テスト連携

- 上流: 06c admin pages 本体, 06b-followup-002 session resolver
- 下流: 08b admin meetings E2E, 09a staging admin smoke

## 多角的チェック観点

- #4 admin-managed data 分離
- #5 apps/web D1 direct access forbidden
- #13 audit log
- #15 Auth session boundary
- secret 値（API token / cookie 値）を成果物に含めない。

## サブタスク管理

- [ ] screenshot path を定義する
- [ ] curl smoke 手順を書く
- [ ] wrangler placeholder を置く
- [ ] rollback 手順を書く
- [ ] outputs/phase-11/main.md を作成する

## 実装仕様 (CONST_005)

### evidence path（必須）

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/manual-smoke-log.md` | 手動 smoke 実行結果（タイムスタンプ・実行者・結果） |
| `outputs/phase-11/screenshots/admin-meetings-list.png` | 一覧画面 |
| `outputs/phase-11/screenshots/admin-meetings-create-drawer.png` | 作成 Drawer |
| `outputs/phase-11/screenshots/admin-meetings-edit-drawer.png` | 編集 Drawer（PATCH 実装後） |
| `outputs/phase-11/screenshots/admin-meetings-attendance.png` | 参加記録 ON/OFF |
| `outputs/phase-11/screenshots/admin-meetings-csv-button.png` | CSV ダウンロードボタン |
| `outputs/phase-11/csv-export-sample.csv` | 実際にダウンロードした CSV（メール・実名は redaction 済み） |
| `outputs/phase-11/curl/` | curl 実行ログ（cookie 値・token 値マスク済み） |

### 手動 smoke 手順

1. **ローカル起動**
   ```bash
   mise exec -- pnpm dev   # apps/api と apps/web を並走
   ```
2. **admin login**: ローカル admin アカウントで Magic Link / Google OAuth ログイン → `/admin/meetings` 表示確認
3. **開催日作成 (POST /api/admin/meetings)**
   - フォーム入力 → 作成
   - D1 直接 query で audit log 確認: `bash scripts/cf.sh d1 execute ubm-hyogo-db-local --command "SELECT * FROM audit_logs WHERE action = 'meeting.created' ORDER BY created_at DESC LIMIT 1"`
4. **編集 (PATCH /api/admin/meetings/:id)**
   - 編集 Drawer を開いて値変更 → 保存
   - audit log で `meeting.updated` を確認
5. **参加記録 ON/OFF (POST/DELETE /api/admin/meetings/:id/attendance)**
   - 候補 member の checkbox を ON → audit log で `attendance.added` 確認
   - OFF → `attendance.removed` 確認
   - 削除済み member が候補に出ないことを確認
6. **CSV ダウンロード (GET /api/admin/meetings/:id/export.csv)**
   - ボタン押下 → ファイル取得
   - Excel / VS Code で開いて確認: BOM 有り、列順（meetingId, heldOn, memberId, displayName, attended）固定、改行 `\r\n`、`Content-Disposition: attachment; filename="meetings-YYYY-MM-DD.csv"`
7. **境界エラー手動確認**
   - cookie 削除して GET → 401
   - 一般 user cookie で GET → 403
   - 存在しない id で PATCH → 404
   - zod 違反 body で POST → 422
8. **redaction**: 全スクリーンショット・CSV のメール・実名・cookie 値を blur / `***` で置換し、確認

### rollback 手順

実測時に問題が出た場合: `bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env staging`（staging 環境）

### DoD（CONST_005）

- 上記 7 手順すべて ✓
- screenshot 5 枚以上、csv-export-sample.csv、manual-smoke-log.md がすべて取得済み
- redaction 完了（メール・実名・cookie・API token がマスクされている）
- evidence path が AC matrix と一対一に紐づく

## 成果物

- outputs/phase-11/main.md
- outputs/phase-11/manual-smoke-log.md
- outputs/phase-11/screenshots/（5 枚以上）
- outputs/phase-11/csv-export-sample.csv
- outputs/phase-11/curl/（cookie / token マスク済み）

## 完了条件（CONST_005 強化版）

- [x] 手動 smoke が再現可能な粒度で記述される
- [x] evidence path が AC matrix と一対一になる
- [x] secret 値が成果物に含まれない（redaction 完了）
- [x] 401/403/404/422 全境界が手動確認されている
- [x] audit log が 5 mutation すべてで確認されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 12 へ、smoke 手順と evidence path を渡す。
