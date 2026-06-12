# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 10 / 13 |
| 名称 | 最終レビュー（AC 充足・blocker 判定） |
| 種別 | 検証 Phase |
| 前提 | Phase 4-9（テスト → 実装 → 拡充 → カバレッジ → リファクタリング → 品質保証）完了 |
| gate | 本 Phase PASS まで Phase 11（手動テスト）へ進まない |
| 判定基準 | AC-1〜AC-13 が全て充足、かつ blocker 0 件で PASS |

## 目的

実装サイクル（Phase 4-9）の成果が AC-1〜AC-13 を満たしているかを **観測可能な確認方法**で逐一検証し、PASS / FAIL を判定する。
特に「実装済み contract が consumer 側（web fetch）まで通っているか」を確認し、API ゲートだけ実装され web RSC の cookie 転送が未対応というような **partial fix（片側修正）を検出**する。

## 実行タスク

1. AC-1〜AC-13 の充足チェックリストを各 AC ごとに「確認方法」付きで実行する。
2. partial fix 検出: C2 の API ゲート（`requirePublicAccess`）が API 側だけでなく、consumer 側（`apps/web/src/lib/api/public.ts` / `fetch/public.ts` の session cookie 転送、`sitemap.ts` / `apps/og` の内部認証付与）まで連動して通っているかを確認する。
3. blocker（AC 未充足・回帰・fail-open）を列挙し、blocker 判定を下す。
4. PASS の場合は Phase 11 へ、FAIL の場合は戻り先 Phase を明示して差し戻す。
5. Phase 3 で記録した MINOR（M-1: JWT 検証共通化 / M-2: `INTERNAL_AUTH_SECRET` 未設定挙動）が解決済みか確認する。

## 参照資料

| 参照 | パス | 用途 |
|------|------|------|
| 受け入れ基準 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-1.md` 第 3 節 | AC-1〜AC-13 の原文 |
| 設計 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-2.md` | topology・シグネチャ・consumer 一覧 |
| MINOR 追跡 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-3.md` 第 2 節 | M-1 / M-2 |
| 実装ファイル | `apps/web/src/components/auth/LoginRequiredNotice.tsx` / `apps/web/app/(public)/layout.tsx` / `apps/api/src/middleware/require-public-access.ts` / `apps/api/src/routes/public/index.ts` / `apps/web/src/lib/api/public.ts` / `apps/web/src/lib/fetch/public.ts` / `apps/web/app/sitemap.ts` / `apps/og/src/member-source.ts` | 充足確認の対象 |

## 実行手順

### Step 1. AC 充足チェックリスト（各 AC → 確認方法）

| AC | 内容（要約） | 確認方法 | 判定 |
|----|------------|---------|------|
| AC-1 | 未認証 6 ルート → notice 表示・本来コンテンツ非描画 | `apps/web/app/(public)/layout.tsx` の session 分岐 spec が GREEN。未認証時に `LoginRequiredNotice` のみ render され children（page）が React ツリーに無いことを確認 | ☐ |
| AC-2 | notice「ログインする」→ `/login?redirect=<pathname>` | `LoginRequiredNotice.tsx` の CTA が `/login?redirect=encodeURIComponent(redirectTo)` を生成する spec が GREEN | ☐ |
| AC-3 | `/login` はゲート対象外 | `(auth)` グループは `(public)/layout.tsx` 配下でないことをルーティング構造で確認。未認証で `/login` が表示される | ☐ |
| AC-4 | 認証済みは従来通りコンテンツ閲覧 | session あり時に既存 shell + children が render される spec が GREEN（機能リグレッション無し） | ☐ |
| AC-5 | 未認証時 RSC データ取得が走らない | layout が未認証時に `{children}` を返さない実装。page の async server component が実行されず `/public/*` fetch が走らないことを spec で確認 | ☐ |
| AC-6 | `/public/*` 無認証 401 | `apps/api` public router contract spec：無認証 → 401 / session → 200 / `X-Internal-Auth` → 200 が GREEN | ☐ |
| AC-7 | sitemap / OG 内部認証で 200 維持 | `apps/web/app/sitemap.ts` / `apps/og/src/member-source.ts` が `X-Internal-Auth` を付与する spec が GREEN。ゲート後も 200 | ☐ |
| AC-8 | web RSC cookie 転送 | `apps/web/src/lib/api/public.ts` / `fetch/public.ts` が `cookies()` を読み API fetch の `Cookie` ヘッダへ転送する spec が GREEN | ☐ |
| AC-9 | fail-closed | `getSession()` throw / env 未設定時に notice（web）・401（api）になる spec が GREEN。fail-open 経路が無い | ☐ |
| AC-10 | `/profile`・`/admin/*` 不変 | 既存 middleware redirect ゲートテストが変更なく GREEN（回帰確認） | ☐ |
| AC-11 | specs4 更新 | `00-overview.md` / `02-auth.md` / `06-member-auth.md` / `01-api-schema.md` のアクセス制御記述が「全ルート認証必須」へ更新済み（Phase 12 Task で確定・本 Phase では更新方針の整合のみ確認） | ☐ |
| AC-12 | トークン / primitive / env アクセサ / D1 禁止 / migration 無 | `verify-design-tokens` gate GREEN（HEX 0）。新規 primitive 無し。`apps/web` env 参照はアクセサ経由（`process.env` 直参照無し）。D1 直接アクセス無し。新規 migration 無し | ☐ |
| AC-13 | 1 サイクル完結 | C1 / C2 両 concern が同一サイクルで GREEN。先送りタスク無し | ☐ |

> チェック欄は実装サイクル実行時に埋める。全 AC が ✅ かつ blocker 0 で PASS。

### Step 2. partial fix（片側修正）検出

| contract | producer 側 | consumer 側 | 連動確認 |
|----------|------------|------------|---------|
| API ゲート（session 経路） | `require-public-access.ts` が会員 session を受理 | `apps/web/src/lib/api/public.ts` / `fetch/public.ts` が session cookie を転送 | 両側 GREEN で認証済みユーザーが 401 にならないこと |
| API ゲート（内部認証経路） | `require-public-access.ts` が `X-Internal-Auth` を受理 | `sitemap.ts` / `apps/og/src/member-source.ts` が `X-Internal-Auth` を付与 | 両側 GREEN で sitemap / OG が 200 維持 |

> producer のみ実装され consumer 未対応の場合は **blocker**（partial fix）として FAIL 判定し Phase 5（実装）へ戻す。

### Step 3. MINOR 解決確認

| MINOR ID | 解決予定 | 確認 |
|----------|---------|------|
| M-1（JWT 検証共通化） | Phase 8 | `require-public-access.ts` の session 検証が `require-admin.ts` / `session-guard.ts` と重複していないか（共通ヘルパー抽出済みか）を確認 |
| M-2（`INTERNAL_AUTH_SECRET` 未設定挙動） | Phase 4 で明示・Phase 7 確認 | 未設定時に内部経路 401・session 経路は通る挙動が spec で固定されているか確認 |

### Step 4. PASS / FAIL 判定と戻り先

| 判定 | 条件 | アクション |
|------|------|----------|
| **PASS** | AC-1〜AC-13 全充足 + blocker 0 + partial fix 無し | Phase 11（手動テスト）へ進む |
| **FAIL（実装不足）** | AC 未充足・partial fix 検出 | Phase 5（実装）へ戻す |
| **FAIL（テスト不足）** | 確認方法に対応する spec が無い | Phase 4 / 6（テスト）へ戻す |
| **FAIL（品質）** | typecheck / lint / token gate red | Phase 9（品質保証）へ戻す |

## 統合テスト連携

- C1（web layout ゲート）・C2（api guard / og / sitemap）の Red→Green が全て揃い、既存 `/profile`・`/admin/*` ゲートテストが GREEN 維持であることを最終確認する。
- partial fix 検出は「producer spec と consumer spec が両方 GREEN」を統合確認の必須条件とする。

## 多角的チェック観点（AIが判断）

- システム系: 認証境界が web（UI gate）・api（API gate）の両層で fail-closed を保持しているか。片側だけ閉じる部分最適が無いか。
- 問題解決系: 「UI からも API からもログイン無しでは情報が取得できない」という主問題の解決が観測可能な形で確認できているか。
- リスク系: 認証済みユーザーが 401 になる（cookie 転送漏れ）リグレッションが無いか。

## サブタスク管理

- [ ] AC-1〜AC-13 チェックリストを全件確認
- [ ] partial fix（producer/consumer 連動）を検出
- [ ] MINOR M-1 / M-2 の解決確認
- [ ] PASS / FAIL 判定と戻り先を記録

## 成果物

| 成果物 | 配置 |
|--------|------|
| 最終レビュー結果（本 Phase の実行記録） | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/outputs/phase-10/final-review.md`（実装サイクルで作成） |

## 完了条件

- [ ] AC-1〜AC-13 の充足チェックが確認方法付きで埋まっている
- [ ] partial fix 検出が実施され、producer/consumer 連動が確認されている
- [ ] blocker 判定（PASS / FAIL）と戻り先が明示されている
- [ ] Phase 10 で発見した MINOR 指摘は「機能に影響なし」を理由に却下せず、必ず Phase 12 Task4（未タスク化）の対象として記録する

## タスク100%実行確認【必須】

- [ ] AC 充足チェックリスト・partial fix 検出・MINOR 確認・PASS/FAIL 判定をすべて記述した
- [ ] FAIL 時の戻り先 Phase を明示した

## 次Phase

[phase-11.md](phase-11.md) — 手動テスト（VISUAL・screenshot 証跡）
