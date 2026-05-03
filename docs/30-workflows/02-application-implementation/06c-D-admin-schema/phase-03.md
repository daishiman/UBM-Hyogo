# Phase 3: 設計レビュー — 06c-D-admin-schema

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-D-admin-schema |
| phase | 3 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

矛盾、漏れ、整合性、依存関係をレビューし、simpler alternative とのトレードオフを PASS-MINOR-MAJOR で判定する。

## 実行タスク

1. 参照資料と該当ソースを確認する。完了条件: schema mapping 接続漏れの境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/01-api-schema.md
- docs/00-getting-started-manual/specs/03-data-fetching.md
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
- apps/web/app/admin/schema/page.tsx（spec target）
- apps/api/src/routes/admin/schema/index.ts（spec target）

## 実行手順

- 対象 directory: docs/30-workflows/02-application-implementation/06c-D-admin-schema/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 06c admin pages 本体, 07b schema ops 本体, 06b-followup-002 session resolver, Forms API integration
- 下流: 08b admin schema E2E, 09a staging admin smoke, Forms drift 検知

## 多角的チェック観点

- #1 実フォーム schema をコードに固定しすぎない
- #2 consent キー（`publicConsent` / `rulesConsent`）を alias 編集対象外として保護
- #3 `responseEmail` system field を alias 編集対象外として保護
- #4 admin-managed data 分離（schema_alias / schema_alias_audit）
- #5 D1 直接アクセスは `apps/api` に閉じる
- #13 admin 操作の監査ログ
- 未実装/未実測を PASS と扱わない。
- admin 認可境界（401 / 403）と一般会員 UI を混同しない。

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate を明記する
- [ ] outputs/phase-03/main.md を作成する

## 成果物

- outputs/phase-03/main.md

## 完了条件

- `/admin/schema` が admin session で 200、未認可で 401 / 403 を返す
- alias 一覧に questionId / internal field / source section / last-synced-at が表示される
- 未マップ questionId が UI 上で識別可能にハイライトされる
- 新規・編集・削除が `POST /api/admin/schema/aliases` で永続化され audit 履歴が残る
- `POST /api/admin/schema/resync` が Forms API を 1 回叩き差分 questionId を返す
- consent キーと `responseEmail` system field は alias 編集対象外として保護される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 4 へ、AC、blocker、evidence path、approval gate を渡す。
