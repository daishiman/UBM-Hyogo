# Workflow: profile-me-404-authenticated-admin-recovery

`[実装区分: 実装仕様書]`

## 概要

staging `/profile`（マイページ）で、**認証済み管理者**（valid JWT・Google ログイン直後）に「セッション情報を取得できませんでした / アカウント情報を確認できませんでした。再ログインしてください。」（`MEMBER_SESSION_404`）が表示され、マイページ本体が描画されない。本ワークフローは、この staging 障害を **今回 1 サイクルのコード変更で復旧** し、再発時も staging ログだけで data-cause を即特定でき、かつ web↔api のデプロイドリフトを構造的に断つ状態にする実装仕様書群である。

表示文言「アカウント情報を確認できませんでした。再ログインしてください」＋ CTA「再ログイン」は `session-error-display.ts` の **`MEMBER_SESSION_404`（`/me` が HTTP 404）専用文言**であり、これが表示されている事実そのものが (a) 401 ではない（401 なら `/login` redirect）(b) transport throw（`MEMBER_SESSION_FAILED`）でもない、を確定させる。ユーザー提供 JWT のデコードで `memberId=ce86abba…` / `email=manjumoto.daishi@senpai-lab.com` / `isAdmin=true` / `iat` がリクエスト 8 秒前 = **新規ログイン直後**が判明し、ログイン成功＝D1 に identity + consented status 存在が逆算で確定する。よって `/me` の **アプリルートは 200 を返すべき**だが実際は 404 ＝ **API の notFoundHandler（route 未マッチ）または web↔api デプロイ/経路ドリフト**が真因クラス（詳細 S1〜S3 は `_shared-context.md` §2）。

> 実装区分の根拠（CONST_004）: ユーザー要求は「なぜ起きるか調査しタスク化（=復旧）」であり、観測性追加・apps/api 自動 CD 追加・web 側 transport 診断強化という**コード変更なしでは達成不可能**。よってデフォルト通り実装仕様書として作成する。

## ステータス

| 項目 | 値 |
|------|------|
| ブランチ | `fix/profile-me-404-authenticated-admin-recovery` |
| 起点 | `origin/dev`（#1237 transport 多段フォールバック含む） |
| 種別 | recovery / bugfix（observability + CD drift 根治 + web 診断強化） |
| 実装区分 | 実装仕様書 |
| implementation_mode | `edit`（既存 error-handler / safe-fetch / 診断スクリプト編集 + api-cd.yml 新規） |
| taskType | implementation（復旧の最終証跡は staging `/profile` 正常描画 + 認証 `/me` 200） |
| visualEvidence | VISUAL_ON_EXECUTION（現象 screenshot はユーザー提供済。復旧後 staging runtime screenshot は user-gated） |
| workflow_state | `implemented_local_runtime_pending`（T01〜T04 のローカル実装・focused Vitest・bash syntax は完了。staging deploy・authenticated `/me` 200 復旧確認・runtime screenshot・commit・push・PR は user-gated） |
| 想定 PR base | `dev` |
| relatedIssue | null（staging 実機観察起点・ユーザー報告 2026-06-13 10:38 JST・JWT 提供あり） |

## ワークフロー構成

| Phase | ファイル | 役割 |
|-------|---------|------|
| 1 | `outputs/phase-1/phase-1.md` | 確定事実 F-1〜F-9・サブ原因 S1〜S3・横断欠陥 D-A/D-B・AC-1〜10・inventory・P50 |
| 2 | `outputs/phase-2/phase-2.md` | 多層防御設計（T01〜T04）・notFound ログ設計・api CD 設計・因果ループ・state ownership |
| 3 | `outputs/phase-3/phase-3.md` | 設計レビュー・Phase 4 進行判定・Phase 11 を復旧/data-cause 確定に特化する宣言 |
| 4 | `outputs/phase-4/phase-4.md` | I/O 契約（notFound ログ schema / api-cd job 契約 / safe-fetch ログ契約）・RED 観点 |
| 5 | `outputs/phase-5/phase-5.md` + `task-01..04-*.md` | 実装手順インデックス + タスク仕様書本体（4 タスク・CONST_005 全項目） |
| 6 | `outputs/phase-6/phase-6.md` | テスト拡充（404/401/410 分岐 × ログ × method 制約 × CD prereq skip） |
| 7 | `outputs/phase-7/phase-7.md` | カバレッジ確認（変更ブロック限定） |
| 8 | `outputs/phase-8/phase-8.md` | リファクタリング + rollback 手順 |
| 9 | `outputs/phase-9/phase-9.md` | 品質保証（type/lint/test/bash -n/yaml 構文/redaction grep） |
| 10 | `outputs/phase-10/phase-10.md` | 最終レビュー（AC-1〜10 充足・blocker・MINOR） |
| 11 | `outputs/phase-11/phase-11.md` / `manual-test-result.md` | staging 復旧 + data-cause 確定手順（user-gated）+ screenshot 計画 |
| 12 | `outputs/phase-12/phase-12.md`（+ `outputs/phase-12/main.md` / strict 7） | 実装ガイド・spec 同期・未タスク formalize・skill feedback・compliance |
| 13 | `outputs/phase-13/phase-13.md` | PR 作成（user-gated・`dev` base） |

`artifacts.json` と `outputs/artifacts.json` は `phases[].status` / `metadata.workflow_state` を保持する正本で、byte-identical に保つ。設計の正本（SSOT）は `_shared-context.md`。

## 実装結果（2026-06-13 JST）

| 項目 | 結果 |
| --- | --- |
| T01 API notFound 観測性 | `apps/api/src/middleware/error-handler.ts` に `dataCause=route_not_matched` / `routeMatched=false` / method / path / accept / userAgent の structured context を追加。レスポンス body/status は不変 |
| T02 apps/api CD + smoke gate | `.github/workflows/api-cd.yml` と `scripts/smoke/runtime-admin-api.sh` を追加。dev→staging / main→production deploy 後に `/me/healthz` と authenticated `/me` を検査 |
| T03 web route-404 ログ | 既存 `safeServerFetch` の transport descriptor ログを維持し、`MEMBER_SESSION_404` + transport descriptor の回帰テストを追加 |
| T04 診断スクリプト | `scripts/diagnose-profile-session.sh` に `/me/healthz`・API root・route inventory 判定・web/api deploy parity hint を追加 |
| ローカル証跡 | `bash -n scripts/diagnose-profile-session.sh` PASS、`bash -n scripts/smoke/runtime-admin-api.sh` PASS、API focused Vitest 1 PASS、web focused Vitest 12 PASS |
| 残る境界 | staging deploy、authenticated runtime `/me` 200、`/profile` 復旧 screenshot、commit、push、PR は user-gated |

## タスク分解（今回サイクルで完結 / CONST_007）

| タスク | 領域 | 種別 | 並列性 | 概要 |
|--------|------|------|--------|------|
| T01 | `apps/api` | NON_VISUAL | 直列（最初） | `notFoundHandler` に構造化診断ログ（受信 method+path+transport hint）を追加し `/me` 404 の data-cause を一意化（**D-B 根治**） |
| T02 | `.github/workflows` + `scripts` | NON_VISUAL | T01 後・T03 と並列 | apps/api 自動 CD（dev→staging / main→production）新設 + deploy 後 `/me/healthz` 200 & 認証 `/me` 200 smoke gate（**S1/D-A 根治**） |
| T03 | `apps/web` | NON_VISUAL | T01 後・T02 と並列 | `safe-fetch`/`fetchAuthed` で route-404 を transport descriptor 付き `server_fetch_failed` に明示記録（UI 不変・AC-7） |
| T04 | `scripts` | NON_VISUAL | 独立並列 | `diagnose-profile-session.sh` を `/me` route 存在 + web↔api deploy parity 出力に拡張（read-only・冪等） |

## 不変条件（CLAUDE.md / プロジェクト準拠）

- `/me` の path・shape・status 体系、`apps/api` 既存 endpoint surface、D1 schema、Google Form 仕様、`/profile` UI 文言・分岐を変更しない（AC-6）。
- D1 直接アクセスは `apps/api` に閉じる（不変条件 #5）。
- env 参照はアクセサ経由のみ（`process.env` 直接参照禁止）。認証境界 fail-closed 維持。
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ。`wrangler` 直叩き禁止（`bash scripts/cf.sh`）。secret/cookie/JWT/memberId 非転記。
- コミット・PR・push・deploy はユーザー指示があるまで実行禁止（CONST_002）。

## 既知のスコープ外

| 事象 | 理由 / 対応先 |
|------|------|
| data-cause が 401/410 と確定した場合（S3 真因時） | `/me` 404 ではなく member データ/認証境界事象。admin `/profile` 専用 UX = Issue #1192、environmentExplicit fail-closed = Issue #1234（FU-001）が追跡。`unassigned-task/` に格下げ記録。 |
| 自動リンク管理者の `/me/profile`（`PROFILE_UNAVAILABLE` 404）= 「プロフィール情報が見つかりません」 | `/me` 200 復旧後に顕在化し得る別レイヤ（form response sections 欠如）。Issue #1192 と重複。本 WF は `/me`（session）復旧に限定。 |
| Cloudflare Workers ランタイムの根本的 service-binding 仕様変更 | プラットフォーム領域・自社外 |

## 正本順位（衝突時）

1. `_shared-context.md`（SSOT）
2. 本 `index.md`（SCOPE）
3. `outputs/phase-{1,2,3}/phase-N.md`（設計の正本）
4. `outputs/phase-5/task-0N-*.md`（実装仕様書本体）
5. `docs/00-getting-started-manual/specs/*.md` / `.claude/skills/aiworkflow-requirements/references/*`
