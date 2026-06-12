# Workflow: require-auth-public-access-gate

> **[実装区分: 実装仕様書 / implementation]** — 全 concern がコード変更を伴う（CONST_004 デフォルト）。
> 本 workflow は同一サイクルで仕様書・実コード・正本仕様同期まで実施済み。**コミット・PR・push は行わない**（CONST_002 / CONST_006）。
> 各 Phase に変更対象ファイル・シグネチャ・入出力・テスト・実行コマンド・DoD を明記し、実装済み差分と Phase 11/12 evidence を一致させる（CONST_005 / CONST_007）。

「ログインしなくても情報が見られてしまう」状態を解消し、**`/login` を除く全ルートを認証必須**にする。
未認証アクセス時はリダイレクトではなく「ログインが必要です」案内画面を表示する。
UI ゲートだけでは公開 API（`/public/*`）を直接叩けば情報が取得できてしまうため、
**API 側のアクセスゲート（会員セッション または 内部サービス認証）** も同一サイクルで実装する。

- ブランチ: `docs/require-auth-public-access-gate-spec`
- ベースブランチ: `dev`
- 起票元: ユーザー直接依頼（2026-06-10）「ログインしないと情報が見れないようにしてください。せっかくセキュリティを整えているにもかかわらず、ログインせずに見れてしまうと情報管理ができない」
- ユーザー確定スコープ（AskUserQuestion 2026-06-10）:
  - 認証必須化の範囲 = **`/login` 以外すべて**（`/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms`）
  - 未認証時の挙動 = **案内メッセージを表示**（リダイレクトしない・「ログインする」ボタン）

## メタ情報

| 項目 | 値 |
|------|-----|
| タスク種別 | implementation |
| implementation_mode | new |
| status | implemented_local_evidence_captured |
| visualEvidence | VISUAL（`LoginRequiredNotice` は新規 UI 画面・Phase 11 screenshot 対象） |
| 実装区分 | 実装仕様書（CONST_004 デフォルト。ドキュメントのみ判定の例外条件に非該当） |
| 1 サイクル完結 | 全 concern を 1 実装サイクルで完了（CONST_007・先送り無し） |
| 正本 | `docs/00-getting-started-manual/specs/00-overview.md` / `02-auth.md` / `05-pages.md` / `06-member-auth.md` / `09e-screen-blueprints-public.md` / `13-mvp-auth.md` / `01-api-schema.md`、`.claude/skills/aiworkflow-requirements/` |

---

## 0. 事前調査結論（実装前ベースライン）

現行コードを調査した結論（変更前の事実）。

| 観点 | 調査対象 | 結果 |
|------|---------|------|
| 認証基盤 | `apps/web/src/lib/auth.ts`, `apps/web/src/lib/session.ts` | Auth.js v5（Google OAuth + Magic Link）。`getSession()` が Server Component から session.user を解決 |
| 既存ゲート | `apps/web/middleware.ts:99-126`, `apps/web/app/(admin)/layout.tsx:24-26`, `apps/web/app/(member)/profile/page.tsx` | `/admin/*`・`/profile` は middleware + layout/page で **認証済み（redirect）**。それ以外は素通り |
| 未認証公開ルート | `apps/web/app/(public)/` | `/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms` が **認証チェック無し**で閲覧可能 |
| public layout | `apps/web/app/(public)/layout.tsx:17` | **既に `x-pathname`（middleware 注入）を読んでいる** → 案内画面の redirect リンク生成に流用可能。middleware 変更不要 |
| 公開 API | `apps/api/src/routes/public/index.ts` | `createPublicRouter()` が `/public/stats`・`/public/members`・`/public/members/:id`・`/public/form-preview` を集約。**session middleware 未適用**（誰でも取得可能） |
| 公開 API の機微度 | `docs/00-getting-started-manual/specs/01-api-schema.md:372` | 公開 API は `responseEmail` 等の admin-only フィールドを返さない。返すのは公開適格メンバーの最小フィールドのみ |
| 公開 API のサーバー間消費者 | `apps/web/app/sitemap.ts:19`, `apps/og/src/member-source.ts:51-57` | sitemap 生成と OG 画像ワーカーが **ユーザーセッション無し**で `/public/members*` を消費。API ゲート時はここが破綻し得る |
| 内部認証の既存機構 | `apps/api/src/routes/auth/session-resolve.ts`, `apps/api/src/middleware/internal-auth`（`X-Internal-Auth` / `INTERNAL_AUTH_SECRET`） | Worker-to-Worker 内部経路の既存パターン。public API ゲートのサーバー間バイパスに再利用できる |
| web 公開 fetch | `apps/web/src/lib/api/public.ts`, `apps/web/src/lib/fetch/public.ts`, `apps/web/src/lib/env.ts`（`getPublicFetchEnv`/`getAuthEnv`） | 現状は未認証 public fetch。API ゲート後は session cookie 転送 または 内部認証付与が必要 |

> **結論**: 「未認証で情報が見られる」入口は (1) `(public)` ルート群の UI、(2) 公開 API の直接アクセス、の 2 系統。
> UI ゲート（concern 1）だけでは (2) が残るため、API ゲート（concern 2）を同一サイクルで実装する。
> ただし API ゲートは sitemap / OG ワーカーという正当なサーバー間消費者を壊さないよう、
> **「会員セッション OR 内部サービス認証」** を許可する単一ガードとして設計する（既存 `INTERNAL_AUTH_SECRET` 機構を再利用）。

---

## 1. タスク分解（責務分離）

単一責務原則（SRP）で 2 concern に分解する。両 concern とも **1 サイクル内完了**（CONST_007）。

| Concern | 責務（単一） | 主成果物 |
|---------|------------|---------|
| **C1: Web UI 認証ゲート** | `(public)` 全ルートを未認証時に「ログインが必要です」案内画面へ差し替え、本来コンテンツと RSC データ取得を遮断する | `LoginRequiredNotice.tsx`（新規）+ `(public)/layout.tsx` ゲート追加 |
| **C2: API アクセスゲート + サーバー間内部認証** | `/public/*` を「会員セッション OR 内部認証」必須にし、web RSC は cookie 転送、sitemap / OG は内部認証付与でリグレッション回避 | `require-public-access.ts`（新規 middleware）+ `public/index.ts` + web public fetch + `sitemap.ts` + `apps/og` |

### 責務境界（重複・依存）

- C1 は **表現層・認証境界（web）**、C2 は **API 境界（api）+ サーバー間消費者（web sitemap / og）**。状態所有権は分離。
- C1 のゲートは **C2 に実装依存しない**（C1 単体でブラウザ閲覧は遮断できる）。C2 は API 直叩き経路を塞ぐ多層防御。
- C1 と C2 を同一 PR で完了することで「UI からも API からもログイン無しでは情報が取得できない」状態を保証する（ユーザー要望の本質）。
- 既存の `/profile`・`/admin/*` のゲート挙動（middleware redirect）は **変更しない**（スコープ外・リグレッション禁止）。

---

## 2. スコープ

詳細は [phase-2.md](phase-2.md)。

- **含む**:
  - C1: `(public)` レイアウトでの Server 側 session ゲート、`LoginRequiredNotice` 新規コンポーネント、未認証時の RSC データ取得遮断、各テスト。
  - C2: 公開 API への `require-public-access` ガード適用、web 公開 fetch の session cookie 転送、`sitemap.ts` / `apps/og` の内部認証付与、各テスト。
  - 設計正本（specs）のアクセス制御記述更新（公開層 → 全ルート認証必須）。
- **含まない**:
  - 新規 D1 migration、Google Form schema 変更、新規 API endpoint の機能追加（ガード追加は endpoint surface 変更に該当しない）。
  - `/profile`・`/admin/*` の既存ゲート挙動変更。
  - 認証プロバイダ（Google OAuth / Magic Link）自体の設定変更。
- **不変条件**:
  - 認証境界は **fail-closed**（不変条件 #11 相当・判定不能時は未認証扱い）。
  - D1 直接アクセスは `apps/api` に閉じる（#5）。`apps/web` env 参照は `apps/web/src/lib/env.ts` アクセサ経由（task-02）。
  - OKLch トークン正本（HEX 直書き禁止・`verify-design-tokens` gate）。新規 primitive を増やさない（既存 Card / Button 等を再利用）。

---

## 3. フェーズ設計

詳細は [phase-3.md](phase-3.md)。Phase 1-3 = 設計書、Phase 4-13 = テスト〜実装〜検証〜close-out の実行仕様。

| Phase | 名称 | 本 workflow での内容 |
|-------|------|---------------------|
| 1 | 要件定義 | 背景・根本原因・AC-1〜AC-13・命名規則 |
| 2 | 設計 | C1/C2 の topology・シグネチャ・データフロー・state 所有権・doc 更新方針 |
| 3 | 設計レビュー | PASS/MINOR/MAJOR・simpler alternative 検討・Phase 4 開始 gate |
| 4 | テスト作成 | TDD Red：web gate / notice / api guard / og / sitemap の失敗テスト |
| 5 | 実装 | 変更/新規ファイル一覧に沿って Green 化 |
| 6 | テスト拡充 | fail path・回帰 guard（認証済み regression / 内部認証 bypass） |
| 7 | カバレッジ確認 | 変更ファイルの line/branch 実測 |
| 8 | リファクタリング | 重複排除・命名整合 |
| 9 | 品質保証 | typecheck / lint / verify-design-tokens / mirror parity |
| 10 | 最終レビュー | AC 充足・blocker 判定 |
| 11 | 手動テスト | VISUAL：未認証→案内画面 / 認証済み→コンテンツ の screenshot |
| 12 | ドキュメント更新 | implementation-guide / spec sync / unassigned / feedback / compliance |
| 13 | PR作成 | **ユーザー明示承認後のみ** |

### Phase ファイル一覧

- [Phase 1: 要件定義](phase-1.md)
- [Phase 2: 設計](phase-2.md)
- [Phase 3: 設計レビュー](phase-3.md)
- [Phase 4: テスト作成](phase-4.md)
- [Phase 5: 実装](phase-5.md)
- [Phase 6: テスト拡充](phase-6.md)
- [Phase 7: カバレッジ確認](phase-7.md)
- [Phase 8: リファクタリング](phase-8.md)
- [Phase 9: 品質保証](phase-9.md)
- [Phase 10: 最終レビュー](phase-10.md)
- [Phase 11: 手動テスト](phase-11.md)
- [Phase 12: ドキュメント更新](phase-12.md)
- [Phase 13: PR作成](phase-13.md)

---

## 参照ドキュメント

| 参照 | パス | 内容 |
|------|------|------|
| システム概要 | `docs/00-getting-started-manual/specs/00-overview.md` | 3 層構成・アクセス制御（本タスクで更新） |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | `/login` 状態・認証フロー |
| 会員認証 | `docs/00-getting-started-manual/specs/06-member-auth.md` | ログイン許可条件・3 層可視性（本タスクで更新） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | 公開 API のフィールド可視性（本タスクで更新） |
| MVP 認証 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | MVP 認証方針 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/` | 既存設計との整合確認（security-*.md / ui-ux-*.md / api-*.md） |
