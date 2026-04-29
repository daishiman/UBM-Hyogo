# Auth.js cookie session resolver の本番化 - タスク指示書

## メタ情報

| 項目         | 内容                                                              |
| ------------ | ----------------------------------------------------------------- |
| タスクID     | 04b-followup-001-authjs-cookie-session-resolver                   |
| タスク名     | Auth.js cookie session resolver の本番化（dev Bearer ヘッダ脱却） |
| 分類         | 改善 / 認証本番化                                                 |
| 対象機能     | `/me/*` API の SessionResolver を Auth.js cookie ベースに切替     |
| 優先度       | 高                                                                |
| 見積もり規模 | 中規模                                                            |
| ステータス   | 未実施                                                            |
| 発見元       | 04b Phase 12 unassigned-task-detection #1                         |
| 発見日       | 2026-04-29                                                        |
| 委譲先 wave  | 05a / 05b                                                         |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

04b では `/me/profile` `/me/visibility-request` `/me/delete-request` 等の member self-service API を実装したが、Auth.js + Google OAuth / Magic Link の cookie session 連携 (05a/05b) が未着手のため、`SessionResolver` は **依存注入型** とした上で **dev Bearer header 方式**（`Authorization: Bearer dev-session:<memberId>` のような開発専用解決機構）で完結させている。本番では cookie からの session 解決に置換する必要がある。

### 1.2 問題点・課題

- 本番デプロイ可能な `/me/*` 認証経路が存在しない（dev resolver を 04b の API 単体テストで使っているのみ）
- Auth.js JWT / Database session のどちらを使うかが 04b 段階では未確定（13-mvp-auth.md は magic link を MVP として記述、Google OAuth は段階移行）
- cookie の HttpOnly / SameSite / Secure / domain などの設定が `/me/*` 側の CORS / credentials ポリシーと整合しているか未検証

### 1.3 放置した場合の影響

- 06b の `/me/profile` UI 消費（[04b-followup-003](04b-followup-003-me-profile-ui-consumption.md)）が dev resolver でのみ動き、本番昇格できない
- 不変条件 #5（D1 アクセスは `apps/api` 内に閉じる）と不変条件 #7（Auth.js 経由）が架橋されないまま実装が進み、後続 wave で session 由来の memberId 取り違えが発生するリスク

---

## 2. 何を達成するか（What）

### 2.1 目的

Auth.js の cookie session（`__Secure-authjs.session-token` 等）から `memberId` を解決する **本番用 SessionResolver** を実装し、04b 完成済の `/me/*` API へ差し替える。dev resolver は test fixture としてのみ残置する。

### 2.2 最終ゴール

- `apps/api/src/auth/session-resolver.ts`（または同等パス）が cookie session から `SessionUser` を返す本番実装を持つ
- 04b の `/me/*` ハンドラが新 resolver を経由し、dev Bearer header 経路は test 専用に縮退している
- 新 resolver の単体テスト（cookie 検証 / 期限切れ / 不正署名 / 未登録ユーザー）が追加されている
- `/me/profile` のレスポンス `authGateState` が cookie session の状態と整合する

### 2.3 スコープ

#### 含むもの

- Auth.js の session callback で発行される token を Workers 側で検証する経路（NextAuth shared secret / JWT 検証）
- cookie 名 / SameSite / Secure / Domain の本番設定整合
- 04b の `/me/*` ハンドラの resolver 差し替え（SessionResolver 注入ポイント維持）
- 不正 cookie / 期限切れ時の 401 / 403 振り分け

#### 含まないもの

- Auth.js 自体の Google OAuth / Magic Link 設定（05a / 05b 本体）
- 04b で確定した API 仕様 / response schema 変更
- KV / D1 ベース cross-isolate rate limit（[04b-followup-002](04b-followup-002-cross-isolate-rate-limit-kv-d1.md)）

### 2.4 成果物

- 本番 `SessionResolver` 実装ファイル
- 04b ハンドラ差分（resolver 差し替え）
- 単体テスト追加分
- `docs/00-getting-started-manual/specs/13-mvp-auth.md` への運用手順反映差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 05a（Auth.js セットアップ）または 05b（cookie session 配線）が着手済または並行実装可能
- 04b の `SessionResolver` 注入ポイントを把握（依存注入インターフェース）
- 不変条件 #2（consent キー: publicConsent / rulesConsent）に session 解決が干渉しないこと

### 3.2 実行手順

1. Auth.js が発行する session token のフォーマット（JWT or DB session lookup）を確定（05a/05b と同期）
2. Workers 側で token 検証する関数を実装（JWT の場合は AUTHJS_SECRET を 1Password 経由で binding）
3. `SessionResolver` interface に準拠する **本番実装** を 04b ハンドラへ DI
4. dev Bearer resolver は `apps/api/src/auth/__fixtures__/` に隔離し、test code からのみ参照可能にする
5. 単体テスト追加（valid cookie / expired / tampered / unknown member / deleted member）
6. `/me/profile` の `authGateState` が cookie session 由来の状態と整合することを統合テストで確認

### 3.3 受入条件 (AC)

- AC-1: cookie session を持つ request で `/me/profile` が 200 を返し、`memberId` が cookie 由来であることをテストで保証
- AC-2: cookie 不正・期限切れ時に 401、未登録ユーザーで 401 / 403 のいずれかを spec 通りに返す
- AC-3: dev Bearer resolver が production import path から参照されない（`.dependency-cruiser.cjs` rule または build exclude）
- AC-4: `/me/visibility-request` `/me/delete-request` も同 resolver で動作
- AC-5: 13-mvp-auth.md に session resolver の運用フローと cookie 設定が反映されている

---

## 4. 苦戦箇所 / 学んだこと（04b で得た知見）

### 4.1 Auth.js 未着手のまま `/me/*` を実装する戦略

依存注入型 resolver を 04b 内で確立したことで、05a/05b の完成を待たずに 04b の API 仕様・テスト・UI 契約を固めることができた。本タスクは「dev resolver を本番 resolver に差し替えるだけ」の最小差分で本番昇格可能な構造になっている。

### 4.2 SessionUser 型のドリフト

`SessionUserZ.authGateState`（`input/sent/unregistered/rules_declined/deleted`）と 04b response の `authGateState`（`active/rules_declined/deleted`）に差異があり、04b では `MeSessionUserZ` を独自定義した。本タスクで cookie session resolver を実装するときに、この型分離を維持し、Auth.js → SessionUser → MeSessionUser への変換境界を resolver 側に閉じる必要がある（spec 04-types / 06-member-auth との整合は別タスクで実施中）。

---

## 5. 関連リソース

- `docs/30-workflows/04b-parallel-member-self-service-api-endpoints/outputs/phase-12/skill-feedback-report.md`
- `docs/30-workflows/04b-parallel-member-self-service-api-endpoints/outputs/phase-12/unassigned-task-detection.md`
- `docs/00-getting-started-manual/specs/06-member-auth.md`
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`
- 04b 実装本体（`apps/api/src/index.ts` ほか `/me/*` ハンドラ）
- [04b-followup-003-me-profile-ui-consumption.md](04b-followup-003-me-profile-ui-consumption.md)
