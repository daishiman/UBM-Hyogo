# Phase 12: ドキュメント更新 — 06c-D-admin-schema

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-D-admin-schema |
| phase | 12 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

正本仕様、runbook、lessons learned の同期を定義する。Phase 12 は中学生レベル概念説明を含む。

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
- apps/web/app/(admin)/admin/schema/page.tsx（spec target）
- apps/api/src/routes/admin/schema.ts（spec target）

## 実行手順

- 対象 directory: docs/30-workflows/completed-tasks/06c-D-admin-schema/
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 06c admin pages 本体, 07b schema ops 本体, 06b-followup-002 session resolver, Forms API integration
- 下流: 08b admin schema E2E, 09a staging admin smoke, Forms drift 検知

## 多角的チェック観点

- #1 実フォーム schema をコードに固定しすぎない
- #2 consent キー（`publicConsent` / `rulesConsent`）を alias 編集対象外として保護
- #3 `responseEmail` system field を alias 編集対象外として保護
- #4 admin-managed data 分離（schema_aliases / audit_log）
- #5 D1 直接アクセスは `apps/api` に閉じる
- #13 admin 操作の監査ログ
- 未実装/未実測を PASS と扱わない。
- admin 認可境界（401 / 403）と一般会員 UI を混同しない。

## サブタスク管理

- [x] refs を確認する
- [x] AC と evidence path を対応付ける
- [x] blocker / approval gate を明記する
- [x] outputs/phase-12/main.md を作成する
- [x] Phase 12 strict 7 files を作成する
- [x] root `artifacts.json` と `outputs/artifacts.json` の parity を作成する

## 成果物

- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

## 完了条件

- `/admin/schema` が admin session で 200、未認可で 401 / 403 を返す
- schema diff 一覧に type / questionId / stableKey / label / status / createdAt が表示される
- added / changed / removed / unresolved の 4 ペインで未解消 diff が識別できる
- queued diff の stableKey alias 割当が `POST /admin/schema/aliases` で永続化され audit_log に記録される
- `POST /admin/sync/schema` は既存 sync route として参照し、06c-D の新規 UI 必須範囲には含めない
- consent キーと `responseEmail` system field は alias 編集対象外として保護される

## 中学生レベル概念説明（Phase 12 必須）

- 「Google Form の質問」と「データベースの欄の名前」は別の言葉でつけられている。たとえばフォームでは `question_07f3` という機械的な ID で呼ばれているけど、データベースでは `phoneNumber` という人が読みやすい名前で持ちたい。この 2 つを「これは同じ意味だよ」と結びつける仕組みが stableKey alias assignment。
- `/admin/schema` 画面は、その対応を管理者だけが安全に確認・解消できる場所。フォームに新しい質問が増えたら、ここで差分を見て「この質問はこの名前に対応するよ」と割り当てる。
- 「同意のチェック」と「メールアドレス」は仕組みの根っこなので、ここでは編集できないように鍵をかけてある。間違えて壊すと全員のログインや同意確認が動かなくなるから。
- 「再同期ボタン」は、フォームの中身を Google から取り直してくる動作。1 回押すと 1 回だけ取りに行く（連打しても無料枠を食いつぶさない設計）。

## ドキュメント同期成果物（Phase 12 必須）

- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md

## タスク100%実行確認

- [x] この Phase の必須セクションがすべて埋まっている
- [x] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [x] deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 13 へ、AC、blocker、evidence path、approval gate を渡す。
