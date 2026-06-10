# Workflow: profile-session-fetch-failure-investigation

`[実装区分: 実装仕様書（診断・観測性向上のコード変更を含む）]`

## 概要

staging `/profile`（マイページ）で、ログイン済み（画像では「万壽本大嗣・管理者」）にもかかわらず Server Component が API Worker の `GET /me` 取得に失敗し、「セッション情報を取得できませんでした / 時間をおいて再読み込みしてください / 再読み込み」エラーバナーを表示してマイページ本体が描画されない。本ワークフローは、この **root cause を staging 実機で確定する調査**と、以後同種事象を即座に切り分けるための**観測性向上（エラーコード区別表示・構造化ログ・診断スクリプト）**を、今回 1 サイクルで完結させる実装仕様書群である。

画像の症状（「時間をおいて再読み込みしてください」= `/profile` page.tsx:66-74 のデフォルト失敗分岐）は、`/me` が **非404 かつ非redirect** で返ったことを意味する。`session-guard` の分岐を突き合わせると、401（session 未解決 / identity・status 不在）は web 側で `/login` へ **redirect** されバナーにならず、404 は「再ログイン」分岐になるため、**画像症状に一致する真因は 410（`member_status.is_deleted=1`）/ 5xx / transport 失敗（`MEMBER_SESSION_FAILED`）に絞られる**。現状この 3 つが一律「時間をおいて再読み込み」へ集約され root cause が隠蔽されている（観測性欠如 H6）ことが、診断を不能にしている主問題である。

> 実装区分の根拠（CONST_004）: ユーザー指定スコープは「調査・原因特定のみ（診断中心）」だが、原因を**確認可能にする**目的の達成には観測性欠如（H6）を是正するコード変更（区別表示・ログ・診断スクリプト）が必須のため、純 docs-only ではなく診断・観測性向上のコード変更を含む実装仕様書として作成する。本格的な根本修正は真因が staging 実機調査で確定するまで方針を決められない（CONST_007 例外①）ため Phase 12 で未タスク化する。

## ステータス

| 項目 | 値 |
|------|------|
| ブランチ | `feat/profile-session-fetch-failure-investigation` |
| 起点 | `origin/dev` (b59a9b450) |
| 種別 | investigation / diagnosis（観測性向上のコード変更を含む） |
| 実装区分 | 実装仕様書（診断・観測性向上のコード変更を含む） |
| implementation_mode | `new`（診断用の新規コード + 新規テスト） |
| taskType | VISUAL（`/profile` エラー表示分岐を観測性目的で変更） |
| visualEvidence | VISUAL_ON_EXECUTION（現象 screenshot はユーザー提供済み、診断後 static UI contract screenshot は実装時取得、staging 認証 runtime screenshot は user-gated） |
| workflow_state | `implemented_local_evidence_captured`（本サイクルはローカル実装とfocused tests完了。実装・commit・PR は後続 / user-gated） |
| 想定 PR base | `dev` |
| relatedIssue | null（staging 実機観察起点） |

## ワークフロー構成

| Phase | ファイル | 役割 |
|-------|---------|------|
| 1 | `outputs/phase-1/phase-1.md` | 観測事象・真因仮説マトリクス（H1-H6）・受入条件（AC-1〜8）・inventory・命名規則 |
| 2 | `outputs/phase-2/phase-2.md` | 調査 lane / 観測性向上設計（D1/D2/D3）・状態所有権・因果ループ・validation path |
| 3 | `outputs/phase-3/phase-3.md` | 設計レビュー・Phase 4 進行判定・Phase 11 を実機切り分けに特化する宣言 |
| 4 | `outputs/phase-4/phase-4.md` | I/O 契約（`/me` status × web error code 対応表・診断スクリプト I/O・テスト期待値） |
| 5 | `outputs/phase-5/phase-5.md` + `task-01..03-*.md` | 実装手順インデックス + 診断・観測性タスク本体（3 タスク） |
| 6 | `outputs/phase-6/phase-6.md` | テスト拡充（410/5xx/FAILED/404/401 各分岐の fail path / 回帰 guard） |
| 7 | `outputs/phase-7/phase-7.md` | カバレッジ確認（変更ブロックの line/branch） |
| 8 | `outputs/phase-8/phase-8.md` | リファクタリング（error code → 表示/ログ のマッピング純関数化）+ rollback |
| 9 | `outputs/phase-9/phase-9.md` | 品質保証（type/lint/test 一括・design-token・apps/api 非接触） |
| 10 | `outputs/phase-10/phase-10.md` | 最終レビュー（AC 充足・blocker・MINOR 追跡） |
| 11 | `outputs/phase-11/phase-11.md` / `outputs/phase-11/manual-test-result.md` | staging 実機切り分け手順 + 真因確定結論 + screenshot 計画 |
| 12 | `outputs/phase-12/phase-12.md` / `outputs/phase-12/*`（strict 6+） | 実装ガイド・SSOT 同期・未タスク（本格修正の formalize）・skill feedback・compliance |
| 13 | `outputs/phase-13/phase-13.md` | PR 作成（多段ゲート、`dev` base、user-gated） |

`artifacts.json` と `outputs/artifacts.json` は `phases[].status` / `metadata.workflow_state` を保持する正本で、byte-identical に保つ。設計の正本（SSOT）は `_shared-context.md`。

## 真因仮説マトリクス（要約 / 詳細は phase-1）

| ID | 仮説 | 画像症状（非404・非redirect）一致 | 一次切り分け |
|----|------|------|------|
| H1 | 既存 6 WF の staging 未デプロイ（古い bundle 残存） | △ | deploy 版数 / 直 https `/me` |
| H2 | 401（session 未解決 / identity・status 不在） | ✗（redirect される） | `/me` status |
| H3 | **410（`member_status.is_deleted=1`）** | ✓ | `/me` status=410 / D1 read-only |
| H4 | **5xx（resolver / D1 / ハンドラ例外）** | ✓ | `/me` status=5xx / API ログ |
| H5 | **transport 失敗（service-binding 未応答 / 旧 bundle）→ `MEMBER_SESSION_FAILED`** | ✓ | service-binding 応答 / error code |
| H6 | **観測性欠如（410/5xx/FAILED を一律集約）= 診断不能の主因** | 主問題 | page.tsx:66-74 |

最有力: H3 / H4 / H5。401・404 は症状と矛盾するため一次除外。

## タスク分解（今回サイクルで完結 / CONST_007）

| タスク | 領域 | 種別 | 並列性 | 概要 |
|--------|------|------|--------|------|
| T01 | `apps/web`（UI） | VISUAL | 独立 | `/profile` エラー分岐を `MEMBER_SESSION_410` / 5xx族 / `_FAILED` で区別表示（root cause 可視化）。401/404 既存挙動は回帰なし |
| T02 | `apps/web`（lib） | NON_VISUAL | 独立 | `/me` 取得失敗時に `status`/`code`/`path` を構造化ログ出力（個人情報を出さない） |
| T03 | `scripts/` | NON_VISUAL | 独立 | 診断スクリプト `diagnose-profile-session.sh`（read-only・冪等）: `/me` status / env・secret parity / deploy 版数 |

3 タスクは関心が分離（UI 表示 / server ログ / 運用診断）し独立に並列実装可能。本格的な根本修正（410 復帰 / 5xx 根治 / transport 運用是正 / 管理者 UX）は真因確定後でないと方針を決められないため Phase 12 で未タスク化する（先送りではなく仕様分岐の合意待ち = CONST_007 例外①）。

## 不変条件（CLAUDE.md / プロジェクト準拠）

- 既存 API endpoint surface（`/me` path・shape・status 体系）を変更しない。調査の D1 参照は read-only。
- D1 直接アクセスは `apps/api` に閉じる（不変条件 #5）。`apps/web` から D1 binding 禁止。
- `apps/web` の env 参照は `getEnv()` / `getAuthEnv()` 等のアクセサ経由のみ（`process.env` 直接参照禁止）。認証境界は fail-closed を維持。
- 不変条件 #11: `/me/*` は `session.user.memberId` のみ参照し memberId を response / ログに露出しない。
- OKLch トークン正本（HEX 直書き禁止）。エラー表示変更は `SectionError` props 拡張に留め新規 primitive を作らない。
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ。
- `wrangler` 直叩き禁止（`bash scripts/cf.sh` 経由）。secret 実値・トークンを出力/ドキュメントに転記しない。

## 既知のスコープ外（本ワークフローでは扱わない）

| 事象 | 理由 / 対応先 |
|------|------|
| `[Sentry] You cannot use Sentry.init() in a browser extension` | ブラウザ拡張バンドル由来・自社外（画像コンソールのノイズ） |
| `content.js POST http://127.0.0.1:8888 ERR_CONNECTION_REFUSED` | ブラウザ拡張（1Password 等）由来・自社外 |
| `Permissions-Policy: browsing-topics` 警告 | Chromium 標準警告・無害 |
| 真因確定後の本格修正（410 復帰 / 5xx 根治 / transport 運用是正 / 管理者 `/profile` 専用 UX） | 真因が調査で確定するまで方針を決められない。Phase 12 で未タスク化（CONST_007 例外①） |
| 既存 6 関連 WF（profile-reload-session-404-fix 等）の commit / deploy | それぞれ user-gated。本タスクは解決済み真因を前提として引き継ぐ |

## 正本順位（衝突時）

1. `_shared-context.md`（SSOT）
2. 本 `index.md`（SCOPE）
3. `outputs/phase-{1,2,3}/phase-N.md`（設計の正本）
4. `outputs/phase-5/task-0N-*.md`（実装仕様書本体）
5. `docs/00-getting-started-manual/specs/*.md`（`02-auth.md` / `13-mvp-auth.md` / `01-api-schema.md`）/ `.claude/skills/aiworkflow-requirements/references/*`
