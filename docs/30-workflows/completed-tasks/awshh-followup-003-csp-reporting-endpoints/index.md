# awshh-followup-003-csp-reporting-endpoints — タスク仕様書 index

## 実装区分

**[実装区分: 実装仕様書]（NON_VISUAL）**

`apps/web/src/lib/security-headers.ts` に `Reporting-Endpoints` / legacy `Report-To` ヘッダと CSP `report-to` / レガシー `report-uri` ディレクティブを追加し、CSP 違反レポートを **Sentry の CSP security endpoint** へ集約する。受信側は既存導入済み Sentry を利用するため新規受信実装は不要で、`apps/web` のみの変更で 1 サイクル完結する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | awshh-followup-003-csp-reporting-endpoints |
| ディレクトリ | docs/30-workflows/completed-tasks/awshh-followup-003-csp-reporting-endpoints |
| GitHub Issue | #868（CLOSED — 再オープンせず仕様書化のみ） |
| 発見元 | apps-web-security-headers-hardening Phase 12 unassigned-task-detection |
| 発見日 | 2026-05-23 |
| 作成日 | 2026-05-24 |
| Wave | followup |
| 実行種別 | sequential |
| 担当 | web-security / infra-runbook |
| 状態 | implemented_local_evidence_captured |
| タスク種別 | implementation |
| implementation_mode | new |
| visualEvidence | NON_VISUAL |

## purpose

apps-web-security-headers-hardening (#886) で `apps/web/src/lib/security-headers.ts` に `Content-Security-Policy-Report-Only` を導入したが、`report-to` / `report-uri` ディレクティブが未設定のため、ブラウザで発生した CSP 違反イベントがどこにも送信されず観測できない。U-AWSHH-001 で予定する enforce 切替は、違反レポートで誤検知・許可漏れ origin を把握してからでなければ会員機能を破壊するリスクが高い。

本タスクは `Reporting-Endpoints` / legacy `Report-To` ヘッダと CSP `report-to`（+ レガシー `report-uri`）を出力し、CSP 違反を **既存導入済み Sentry の CSP security endpoint** に集約する観測基盤を 1 サイクルで立ち上げる。

**CONST_007: 本仕様書は単独で 1 サイクル完了するスコープ。「受信側 endpoint が決まらないので別 wave に分離」という先送りは禁止。受信先を Sentry CSP endpoint に確定させ、ヘッダ・ディレクティブ実装とプライバシー/retention 文書化まで本サイクルで完結させる。**

## 受信先決定（本サイクルで確定）

| 項目 | 決定 |
| --- | --- |
| 受信先 | 既存導入済み **Sentry** の CSP security report endpoint（`https://<org>.ingest.sentry.io/api/<project>/security/?sentry_key=<public_key>`） |
| 根拠 | apps/web は既に Sentry を統合済み（`SENTRY_DSN_WEB` / `NEXT_PUBLIC_SENTRY_DSN`）。受信側内製（apps/api 新規 endpoint + D1 保存）は不変条件 #5 と 1 サイクル完結を破る。SaaS 採用で受信側実装ゼロ。 |
| apps/api 変更 | なし（不変条件 #5 維持） |
| D1 schema 変更 | なし |
| 新規 secret | なし（既存公開 `NEXT_PUBLIC_SENTRY_DSN` から CSP report URL を導出） |

## scope in / out

### scope in

- `apps/web/src/lib/security-headers.ts` への `Reporting-Endpoints` / legacy `Report-To` ヘッダ組み立てと CSP `report-to` / `report-uri` 追加
- CSP `report-to` グループ名と `Reporting-Endpoints` / `Report-To` グループ名を一致させる canonical 定数 `CSP_REPORT_GROUP` の導入
- `apps/web/src/lib/env.ts` の `PublicEnvSchema` に既存公開 env `NEXT_PUBLIC_SENTRY_DSN` を追加
- `apps/web/middleware.ts` の `buildSecurityHeaderConfig` で `NEXT_PUBLIC_SENTRY_DSN` から `reportEndpoint` を導出して注入
- `apps/web/src/lib/security-headers.spec.ts` への単体テスト追加（ヘッダ存在・グループ名一致・後方互換）
- CSP violation report payload の個人情報含有レビューと retention / privacy 運用 runbook 文書化

### scope out

- CSP enforce 切替（U-AWSHH-001 の責務）
- 受信側 endpoint の内製実装（`apps/api` 新規 route / D1 保存）
- D1 schema / migration 変更
- Google Form 仕様変更
- apps/web 以外のアプリ変更
- commit / push / PR 作成（user 明示承認後 Phase 13 でのみ実施）
- Issue #868 の状態変更（CLOSED 維持・再オープンしない）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | apps-web-security-headers-hardening (#886) | Report-Only CSP / security-headers.ts の正本（マージ済み） |
| 下流 | U-AWSHH-001（CSP enforce 切替） | 本タスク完了を前提とする（違反レポート集約が enforce 判断材料） |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | apps/web/src/lib/security-headers.ts | 実装対象（Reporting-Endpoints / Report-To / report-to 追加） |
| 必須 | apps/web/src/lib/env.ts | 公開 env 追加対象（getEnv/getPublicEnv 経由のみの不変条件） |
| 必須 | apps/web/middleware.ts | reportEndpoint 注入対象 |
| 必須 | apps/web/src/lib/security-headers.spec.ts | 単体テスト追加対象 |
| 必須 | CLAUDE.md | env アクセス不変条件 / secret hygiene / 不変条件 #5 |
| 参考 | docs/30-workflows/completed-tasks/unassigned-task/awshh-followup-003-reporting-endpoints.md | 元 placeholder（Phase 12 で consumed trace 化） |
| 参考 | W3C Reporting API Level 1 / MDN CSP report-to・report-uri | 仕様根拠 |

## AC（Acceptance Criteria）

- **AC-1**: `reportEndpoint` が設定されているとき `buildSecurityHeaders` が `Reporting-Endpoints` と legacy `Report-To` ヘッダを出力する。
- **AC-2**: CSP に `report-to <group>` ディレクティブが含まれ、その `<group>` が `Reporting-Endpoints` / `Report-To` ヘッダのグループ名と**一致**する（canonical 定数 `CSP_REPORT_GROUP` 由来）。
- **AC-3**: レガシーブラウザ互換のため CSP に `report-uri <url>` が併記される。
- **AC-4**: `reportEndpoint` が未設定（local 等）のとき `Reporting-Endpoints` / `Report-To` ヘッダ・`report-to`・`report-uri` を一切出力しない（後方互換）。
- **AC-5**: 既存公開 env `NEXT_PUBLIC_SENTRY_DSN` は `apps/web/src/lib/env.ts` の `getEnv()`/`getPublicEnv()` 経由でのみ参照され、`process.env` 直接参照を増やさない（env アクセス不変条件）。
- **AC-6**: `apps/api` 実装 / D1 schema が不変であることを `git diff --stat -- apps/api apps/api/migrations` 0 件で確認する（不変条件 #5）。
- **AC-7**: CSP violation payload に含まれる個人情報項目（document-uri / referrer / blocked-uri / source-file）の取り扱いと Sentry 側 retention / data scrubbing 方針が runbook に文書化されている。

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | Why（観測不能リスク）/ AC-1〜7 / 既存命名規則 / CONST_007 先送り禁止 |
| 2 | 設計 | phase-02.md | 受信先 Sentry 確定 / 関数シグネチャ / グループ名一致設計 / env 注入経路 |
| 3 | 設計レビュー | phase-03.md | 内製 vs SaaS トレードオフ / report-to vs report-uri 併記判断 |
| 4 | テスト作成 | phase-04.md | テストケース TC-1〜5 / 期待 assert / 命名規則整合 |
| 5 | 実装 | phase-05.md | 変更ファイル一覧 / diff / 実装手順 |
| 6 | テスト拡充 | phase-06.md | 異常系（未設定 / 空文字 / グループ名 drift）回帰 guard |
| 7 | カバレッジ確認 | phase-07.md | AC × テスト × evidence トレースマトリクス |
| 8 | リファクタリング | phase-08.md | 定数集約 / 重複除去（対象/Before/After/理由） |
| 9 | 品質保証 | phase-09.md | typecheck / lint / secret hygiene / env 不変条件 |
| 10 | 最終レビュー | phase-10.md | GO/NO-GO 判定 / blocker 確認 |
| 11 | 手動評価実行 | phase-11.md | staging で Reporting-Endpoints 到達確認手順 / プライバシーレビュー |
| 12 | ドキュメント更新 | phase-12.md | implementation-guide / runbook / consumed trace / 7 ファイル |
| 13 | PR 作成 | phase-13.md | user 承認後のみ。base=dev。Issue #868 は CLOSED のまま |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-03/main.md
outputs/phase-04/main.md
outputs/phase-05/main.md
outputs/phase-06/main.md
outputs/phase-07/main.md
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/evidence/        # staging 到達確認ログ / プライバシーレビュー（実行時生成）
outputs/phase-12/main.md
outputs/phase-12/implementation-guide.md
outputs/phase-12/phase12-task-spec-compliance-check.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/unassigned-task-detection.md
outputs/phase-12/documentation-changelog.md
outputs/phase-13/main.md
```

## CONST_005 必須項目

| 項目 | 値 |
| --- | --- |
| 変更対象ファイル | `apps/web/src/lib/security-headers.ts`（修正） / `apps/web/src/lib/env.ts`（修正） / `apps/web/middleware.ts`（修正） / `apps/web/src/lib/security-headers.spec.ts`（修正） / `apps/web/src/lib/__tests__/env.spec.ts`（修正） |
| 関数シグネチャ | `buildSentryCspReportUrl(dsn: string \| undefined): string \| undefined` 新規 / `buildReportingEndpointsHeader(cfg: SecurityHeaderConfig): string \| null` 新規 / `buildReportToHeader(cfg: SecurityHeaderConfig): string \| null` 新規 / `SecurityHeaderConfig` に `reportEndpoint?: string` 追加 / `CSP_REPORT_GROUP: string` 定数追加 / `CSP_REPORT_MAX_AGE_SECONDS: number` 定数追加 / `buildCspDirective` / `buildSecurityHeaders` 拡張 |
| 取り得る値範囲 | `NEXT_PUBLIC_SENTRY_DSN` = Sentry public/browser DSN or `undefined`。導出不能時は `reportEndpoint=undefined` として report 系ヘッダ/ディレクティブを一切出力しない |
| 入出力 | 入力 = `SecurityHeaderConfig`（`reportEndpoint` = `buildSentryCspReportUrl(env.NEXT_PUBLIC_SENTRY_DSN)`）、出力 = `Reporting-Endpoints` / `Report-To` ヘッダ + CSP `report-to`/`report-uri` 付き response headers |
| 副作用 | response headers への set のみ。D1 / 外部 POST は発生しない（ブラウザが Sentry endpoint へ送信） |
| テスト方針 | `mise exec -- pnpm --filter @ubm-hyogo/web test -- security-headers` で TC-1〜5 を assert |
| 実行コマンド | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `mise exec -- pnpm --filter @ubm-hyogo/web test -- security-headers` |
| DoD | AC-1〜7 充足 / typecheck・lint・単体テスト green / runbook で retention・privacy 文書化 / `apps/api`・D1 unchanged |

## invariants touched

- **#5（中心）** D1 直接アクセスは `apps/api` 経由のみ — 本タスクは受信側を Sentry SaaS にし apps/api / D1 に触れない
- **apps/web env アクセス不変条件** env 参照は `getEnv()`/`getPublicEnv()` 経由のみ — 既存 `NEXT_PUBLIC_SENTRY_DSN` も schema 検証経由で参照
- **CONST_002** commit/push/PR は user 指示前は禁止 — Phase 13 は user 明示承認後のみ
- **CONST_007** 先送り禁止 — 受信先 Sentry を本サイクルで確定し実装・文書化まで完結

## completion definition

### implemented_local_evidence_captured completion（本サイクルの到達点）

- Phase 1〜13 の仕様ファイル（13 個）と `outputs/phase-12/` 必須 7 ファイルが存在する
- root `artifacts.json` と `outputs/artifacts.json` を作成済み（Phase 1〜12 status = `completed`、Phase 13 = `blocked`、`docs_only=false`、`taskType=implementation`）
- 受信先 Sentry CSP endpoint を既存 public DSN から導出する実装、関数シグネチャ / env 注入経路 / テストケース / runbook 方針を反映済み
- `gate-metadata:validate` が schema green

### runtime completion（user-gated runtime の到達点）

- AC-1〜7 が Phase 7 マトリクスで完全トレース
- staging で `Reporting-Endpoints` / `Report-To` ヘッダ到達と Sentry 受信を確認
- プライバシー / retention runbook 文書化済み
- Phase 13 で user 承認後に PR 作成完了
- GitHub Issue #868 は CLOSED のまま（再オープンしない。実装 PR は CLOSED issue 参照として作成）
