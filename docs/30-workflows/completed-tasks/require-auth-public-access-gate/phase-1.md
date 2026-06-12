# Phase 1: 要件定義（設計書）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 1 / 13 |
| 名称 | 要件定義 |
| 種別 | 設計書（親 workflow root） |
| implementation_mode | new |
| タスク分類 | UI task（VISUAL）— `LoginRequiredNotice` 画面を新規追加 |
| 前提 | Phase 1-3 完了まで Phase 4 へ進まない（CONST_001） |

## 目的

「ログインしないと情報が見れない」状態を実現するための要件・受け入れ基準・命名規則を固定する。
現象（未認証で閲覧可能）ではなく主問題（**認証境界が公開層に対して開いている**）を 1 文で固定し、AC を番号付きで列挙する。

## 実行タスク

1. 主問題を 1 文で固定する（第「真の論点」節）。
2. 根本原因 RC-1〜RC-5 を現行コード根拠付きで確定する（第 2 節）。
3. 受け入れ基準 AC-1〜AC-13 を C1 / C2 / 全体に分けて番号付きで列挙する（第 3 節）。
4. 既存命名規則を表で固定する（第 4 節・FB-01 / FB-SDK-07-4 対策）。
5. 参照 specs と aiworkflow-requirements 正本を列挙する（参照資料節）。

## 1. 背景と問題

UBM 兵庫支部会メンバーサイトは「公開ディレクトリ / 会員マイページ / 管理バックオフィス」の 3 層で設計され、
公開層（`/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms`）は **意図的に未認証公開**だった。
しかしユーザー要望により、**会員情報を含む全情報をログイン必須**にする方針へ転換する。

> ユーザー原文（2026-06-10）: 「今ログインしなくても情報が見れる状態になっています。ログインしないと情報が見れないようにしてください。せっかくセキュリティを整えているにもかかわらず、ログインせずに見れてしまうと情報管理ができないからです。」

### 真の論点（1 文）

**公開層ルートおよび公開 API に対して認証境界が開いており、未認証ユーザーが UI / API 双方から情報を取得できる。これを「`/login` を除く全ルート・全公開 API は認証必須」へ閉じる。**

## 2. 根本原因（確定）

| # | 事実 | 根拠 |
|---|------|------|
| RC-1 | `(public)` 配下 6 ルートは middleware / layout / page いずれでも認証チェックしていない | `apps/web/middleware.ts:99-126`（`/admin`・`/profile` のみ判定）, `apps/web/app/(public)/layout.tsx`（ゲート無し） |
| RC-2 | 公開 API `createPublicRouter()` は session middleware 未適用で、誰でも `/public/*` を取得できる | `apps/api/src/routes/public/index.ts:18-30` |
| RC-3 | 公開 API はサーバー間（sitemap / OG ワーカー）からもユーザーセッション無しで消費されている | `apps/web/app/sitemap.ts:19`, `apps/og/src/member-source.ts:51-57` |
| RC-4 | `(public)/layout.tsx` は既に `x-pathname`（middleware 注入）を取得しており、案内画面の redirect リンク生成に流用できる | `apps/web/app/(public)/layout.tsx:17` |
| RC-5 | 既存の内部サービス認証（`X-Internal-Auth` / `INTERNAL_AUTH_SECRET`）が Worker-to-Worker 経路に存在する | `apps/api/src/routes/auth/session-resolve.ts`, `apps/api/src/middleware/internal-auth` |

## 3. 受け入れ基準（AC）

### C1: Web UI 認証ゲート

- **AC-1**: 未認証ユーザーが `/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms` のいずれにアクセスしても、ページ本来のコンテンツ（会員情報・統計・フォーム等）が一切描画されず、「ログインが必要です」案内画面が表示される。
- **AC-2**: 案内画面に「ログインする」ボタンがあり、`/login?redirect=<元の pathname>` へ遷移できる。`redirect` 値は `(public)/layout.tsx` が `x-pathname` から取得する。
- **AC-3**: `/login`（`(auth)` グループ）は未認証でも従来どおり表示される（ゲート対象外）。
- **AC-4**: 認証済みユーザーは `/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms` の本来コンテンツを従来どおり閲覧できる（機能リグレッション無し）。
- **AC-5**: ゲートは `(public)/layout.tsx` の **Server 側 session 検証**（`getSession()`）で行い、未認証時は子ページ（`page.tsx`）が React ツリーに render されない＝ RSC の `/public/*` データ取得が**実行されない**（情報の事前取得も遮断する fail-closed 設計）。

### C2: API アクセスゲート + サーバー間内部認証

- **AC-6**: API `/public/stats`・`/public/members`・`/public/members/:id`・`/public/form-preview` は、**有効な会員セッション（Cookie `authjs.session-token` または `Authorization: Bearer <jwt>`）** または **内部サービス認証（`X-Internal-Auth: <INTERNAL_AUTH_SECRET>`）** のいずれも無い場合に **401** を返す。
- **AC-7**: sitemap 生成（`apps/web/app/sitemap.ts`）と OG 画像ワーカー（`apps/og/src/member-source.ts`）は内部サービス認証ヘッダを付与し、ゲート後も従来どおり 200 で動作する（リグレッション無し）。
- **AC-8**: Web の公開ページ RSC（`apps/web/src/lib/api/public.ts` 経由）は、認証済みユーザーの session cookie を API へ転送して `/public/*` を取得する。
- **AC-9**: 認証境界は fail-closed。session 検証エラー・env 未設定時は 401（公開しない）。

### 全体

- **AC-10**: 既存の `/profile`・`/admin/*` のゲート挙動（middleware redirect）は変更しない。
- **AC-11**: 設計正本のアクセス制御記述を更新する（`00-overview.md` の 3 層アクセス制御、`02-auth.md`、`06-member-auth.md` の可視性、`01-api-schema.md` の公開境界）。「公開層 = 未認証可」を「全ルート / 全公開 API = 認証必須（内部経路を除く）」へ是正する。
- **AC-12**: OKLch トークン正本（HEX 直書き / `bg-[#xxx]` 禁止）・既存 primitive 再利用・`apps/web` env アクセサ経由・D1 直接アクセス禁止（#5）を遵守。新規 D1 migration・Google Form schema 変更を含まない。
- **AC-13**: 全 concern が 1 サイクル内完了（CONST_007・先送り無し）。

## 4. 既存命名規則（FB-01 / FB-SDK-07-4 対策）

実装時に新規ファイルが従う既存規則を Phase 1 で固定する。

| 対象 | 既存規則 | 本タスクの新規命名 |
|------|---------|-------------------|
| `apps/api` middleware | kebab-case（`require-admin.ts`, `session-guard.ts`, `admin-gate.ts`） | `require-public-access.ts` |
| `apps/api` middleware の export 関数 | `requireXxx`（`requireAdmin`, `requireSyncAdmin`） | `requirePublicAccess` |
| `apps/web` React component | PascalCase（`PublicFooter.tsx`, `AllHiddenFallback.tsx`） | `LoginRequiredNotice.tsx`（`apps/web/src/components/auth/`） |
| test ファイル | `*.spec.{ts,tsx}` のみ（不変条件 #8） | `*.spec.tsx` / `*.spec.ts` |
| session 取得 | `getSession()`（`apps/web/src/lib/session.ts`） | 同左を再利用 |

## 参照資料

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保する。

| 参照資料 | パス | 内容 |
|---------|------|------|
| システム概要 | `docs/00-getting-started-manual/specs/00-overview.md` | 3 層アクセス制御（AC-11 で更新） |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | `/login` 状態管理・認証フロー |
| 会員認証 | `docs/00-getting-started-manual/specs/06-member-auth.md` | ログイン許可条件・可視性（AC-11 で更新） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | 公開境界・フィールド可視性（AC-11 で更新） |
| セキュリティ | `.claude/skills/aiworkflow-requirements/references/security-*.md` | 認証境界・fail-closed 原則 |

## 統合テスト連携

- C1: `apps/web` の `(public)/layout` ゲートテストで「未認証→notice / 認証済み→children」を検証。
- C2: `apps/api` の public router contract spec で「無認証 401 / session 200 / 内部認証 200」を検証。OG・sitemap は内部認証ヘッダ付与の単体テストで担保。
- 認証境界の回帰として `/profile`・`/admin/*` の既存ゲートテストが GREEN のまま（AC-10）。

## 多角的チェック観点（AIが判断）

- システム系: 認証境界の状態所有権は web（UI gate）と api（API gate）に分離。fail-closed を両層で保持。
- 戦略・価値系: ユーザー価値 = 「情報管理ができる（未認証では一切見えない）」。コスト最大部品 = API ゲートのサーバー間互換（sitemap/OG）。これを内部認証バイパスで吸収。
- 問題解決系: 主問題 = 認証境界が開いている。UI のみ塞ぐ部分最適を避け、API も同時に塞ぐ（多層防御）。

## サブタスク管理

- [ ] C1 / C2 の AC を番号付きで確定（本 Phase）
- [ ] 命名規則を固定（本 Phase 第 4 節）
- [ ] Phase 2 設計へ引き継ぐ

## 成果物

| 成果物 | 配置 |
|--------|------|
| 要件定義（本書） | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-1.md` |

## 完了条件

- [ ] 主問題が 1 文で固定されている
- [ ] AC-1〜AC-13 が本文に列挙されている
- [ ] 既存命名規則が表で固定されている
- [ ] 参照 specs が列挙されている

## タスク100%実行確認【必須】

- [ ] 背景・根本原因・AC・命名規則・参照をすべて記述した

## 次Phase

[phase-2.md](phase-2.md) — 設計（topology / シグネチャ / データフロー）
