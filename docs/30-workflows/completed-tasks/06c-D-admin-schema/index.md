# 06c-D-admin-schema

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 06c-fu |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## purpose

`/admin/schema` を実装し、Google Forms の questionId と stableKey alias assignment を admin が安全に確認・解消できる UI / API を成立させる。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、`11-admin-management.md` の admin schema management セクションが指す「schema alias assignment 画面」が、06c admin pages 本体・07b schema ops 本体のどちらにも closed gate として接続されていない follow-up gap だけを扱う。Forms schema の正本（`01-api-schema.md`）と Forms sync（`03-data-fetching.md`）の橋渡しを admin UI に閉じる責務に限定する。

## scope in / out

### Scope In
- `/admin/schema` ルート（admin 専用 UI）の page / loader / action 仕様
- schema diff 一覧（type × questionId × stableKey × label × status × createdAt）
- 未マップ questionId のハイライトと未同意 mapping の警告
- queued diff に対する stableKey alias 割当 flow と audit_log 記録
- resolvedAt・resolvedBy を含む解消状態の表示
- 手動 Forms re-sync は `POST /admin/sync/schema` の既存 route へ handoff し、本タスクでは `/admin/schema` からの新規 client 呼び出しを必須化しない
- `GET /admin/schema/diff` `POST /admin/schema/aliases` `POST /admin/sync/schema`
- admin 認可境界の test と Forms drift 検知の前提整備

### Scope Out
- Forms schema 自体の固定（不変条件 #1 違反）
- consent キー名の変更（不変条件 #2 違反）
- `responseEmail` を Form 項目として再導入する変更（不変条件 #3 違反）
- 一般会員向け UI の変更
- D1 schema 自体の migration（07b 本体に閉じる）
- secret 値・実 questionId の本仕様への記録
- 未承認の commit / push / PR

## dependencies

### Depends On
- 06c-C-admin-tags（admin shell 共通基盤）
- 06c admin pages 本体（admin shell・nav・auth gate）
- 07b schema ops 本体（admin-managed data の schema_aliases テーブル）
- 06b-A-me-api-authjs-session-resolver（admin session resolver の前提）
- Forms API integration（`03-data-fetching.md` の sync runner）

### Blocks
- 06c-E-admin-meetings（admin shell 共通基盤を引き継ぐ）
- 08b-A-playwright-e2e-full-execution（admin schema E2E）
- 09a-A-staging-deploy-smoke-execution（staging admin smoke）
- Forms drift 検知（運用 alert）

### 内部依存（同 wave 内 serial 実行を明示）
- 表記上は parallel だが、実依存は **06c 本体 → 07b 本体 → 本タスク → 08b-A E2E** の serial。
- 本タスクは admin schema 管理 UI / API の単独 SRP を担い、後続 E2E / smoke の前提条件を確定する。
- 06c-A〜E（admin 5 件）は実態として admin shell 共通基盤を共有する parallel-eligible だが、命名規則「sort 順 = 実行順」に従い名目上 serial として A → B → C → D → E の順で実行する。

## refs

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/01-api-schema.md
- docs/00-getting-started-manual/specs/03-data-fetching.md
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
- apps/web/app/(admin)/admin/schema/page.tsx（spec target）
- apps/api/src/routes/admin/schema.ts（spec target）
- apps/api/src/middleware/require-admin.ts

## AC

- `/admin/schema` が admin session で 200 を返し、未認可は 401 / 403 を返す
- schema diff 一覧に type / questionId / stableKey / label / status / createdAt が表示される
- added / changed / removed / unresolved の 4 ペインで未解消 diff が識別できる
- queued diff の stableKey alias 割当が `POST /admin/schema/aliases` 経由で永続化され、audit_log に記録される
- `POST /admin/sync/schema` は既存 sync route として参照し、06c-D の新規 UI 必須範囲には含めない
- Forms schema をコードに固定せず、admin-managed data として alias を分離保持できる
- consent キー（`publicConsent` / `rulesConsent`）と `responseEmail` system field は alias 編集対象外として保護される

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-12/system-spec-update-summary.md
- outputs/phase-12/documentation-changelog.md
- outputs/phase-12/unassigned-task-detection.md
- outputs/phase-12/skill-feedback-report.md
- outputs/phase-12/phase12-task-spec-compliance-check.md
- outputs/phase-13/main.md

## services / secrets

- Cloudflare Workers (`apps/web` admin shell, `apps/api` admin route)
- Cloudflare D1（admin-managed data: schema_aliases / audit_log）
- Google Forms API（read-only sync）
- secret: `AUTH_SECRET` / `GOOGLE_FORMS_API_KEY`（参照のみ・本仕様には実値を記録しない）

## invariants touched

- #1 実フォーム schema をコードに固定しすぎない
- #2 consent キーは `publicConsent` / `rulesConsent` に統一
- #3 `responseEmail` は system field として扱う
- #4 Google Form schema 外のデータは admin-managed data として分離
- #5 D1 直接アクセスは `apps/api` に閉じる
- #13 監査ログ（admin 操作）

## completion definition

全 phase 仕様書と declared outputs が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
