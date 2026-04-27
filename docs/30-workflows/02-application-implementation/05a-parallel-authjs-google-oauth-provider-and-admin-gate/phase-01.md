# Phase 1 — 要件定義: Google OAuth provider と admin gate

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 1 / 13 |
| Wave | 5 |
| 種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | 04b（member API）／ 04c（admin API）／ 02a（member_identities repo）／ 02c（admin_users repo）の Phase 13 完了 |
| 下流 | phase-02（設計） |

## 目的

UBM 兵庫支部会メンバーサイトの主導線である **Google OAuth ログイン** と、管理画面 / 管理 API を保護する **admin gate** の要件を確定する。本タスクで扱う **session 構造**（`memberId`, `isAdmin`）が後続 Wave 6（UI）と Wave 8（test）の前提となるため、本 Phase で「何を session に載せ、何を載せないか」を完全に固定する。

## true issue

| 観点 | 内容 |
| --- | --- |
| 解くべき問題 | Cloudflare Workers 上の Auth.js v5 で、Google OAuth による session 確立と、`admin_users` 確認を経た admin gate を実装する |
| 解いていない問題 | Magic Link / `AuthGateState` 5 状態の判定（**05b** が担当） |
| 解いてはいけない問題 | プロフィール本文の編集（不変条件 #4 / #11）、`/admin/users` 管理者管理 UI（06c の scope out） |
| 失敗時の影響 | 主導線ログインが動かない、admin 画面が無防備、特定の admin user に他人の profile が漏洩 |

## 依存境界

| 入力 | 提供元 | 内容 |
| --- | --- | --- |
| `member_identities` lookup | 02a | email → memberId 解決のための repository function |
| `admin_users` lookup | 02c | memberId → isAdmin 解決のための repository function |
| `/me/*` API | 04b | session 確立後に web で呼ぶ endpoint |
| `/admin/*` API | 04c | admin gate で保護対象になる endpoint |
| OAuth credentials | infra 04（Phase 12 の reference） | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` の secrets 配置先 |

| 出力 | 利用先 | 内容 |
| --- | --- | --- |
| `SessionUser` view model | 06a/b/c, 08a | `{ memberId, email, isAdmin, name }` |
| admin gate middleware | 06c, 08a | `/admin/*` への access を `admin_users` で gate |
| 05b との contract | 05b | session callback 共通化（同一 memberId を返す） |

## 価値とコスト

| 項目 | 内容 |
| --- | --- |
| 価値 | 主導線ログインの成立、管理画面の安全、後続 6 タスクの session 前提を確定 |
| 直接コスト | Auth.js + provider 設定 + middleware 実装の spec 化（コード placeholder）／ secrets 3 個の配線記述 |
| 間接コスト | session storage 戦略（JWT vs DB）の選定、Cloudflare Edge runtime 互換性検証 |
| やらない場合のコスト | 主導線ログイン不能、admin gate 不在による情報漏洩リスク（不変条件 #11 違反） |

## スコープ

### 含む
- Google OAuth provider 設定 spec（`apps/web/src/lib/auth.ts`）
- `AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` の secrets 設計
- session callback で `memberId` / `isAdmin` を解決する spec
- admin gate middleware（`apps/web` `middleware.ts` + `apps/api` `requireAdmin`）spec
- session JWT claim（`memberId`, `isAdmin`, `email`）の確定
- Cloudflare Edge runtime 上での session ストレージ戦略（JWT 採用）

### 含まない
- Magic Link provider（**05b**）
- `AuthGateState` 5 状態判定（**05b**）
- `/login` `/profile` `/admin/*` 画面（**06**）
- `/admin/users` 管理者追加/削除 UI（06c の scope out、後続 wave）

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 主導線ログインと admin gate は MVP の必須機能。これがないと Wave 6 以降が成立しない |
| 実現性 | PASS | Auth.js v5 は Cloudflare Workers 互換、Google OAuth は標準実装。既存 04b/04c API の session lookup を活用 |
| 整合性 | PASS | 05b（Magic Link）と session 構造を共有し、両 provider が同じ `memberId` を返すことで Wave 6 が一貫性を保てる |
| 運用性 | PASS | secrets は infra 04 の管理体系に準拠、session JWT 方式で D1 row 増を回避（不変条件 #10） |

## 不変条件マッピング

| # | 内容 | 本タスクでの扱い |
| --- | --- | --- |
| #2 | consent キーは `publicConsent` / `rulesConsent` 統一 | session 解決時に `rulesConsent != consented` のユーザーは session 作らない（05b の AuthGateState とリンク） |
| #3 | `responseEmail` は system field | OAuth profile email を `responseEmail` カラムで lookup |
| #5 | apps/web から D1 直接禁止 | session callback の D1 lookup は `apps/api` 経由か server-only adapter |
| #7 | responseId と memberId を混同しない | session JWT には `memberId` のみ載せる、`responseId` は載せない |
| #9 | `/no-access` 専用画面に依存しない | 未承認ユーザーは `/login?gate=...` に redirect、専用画面は作らない |
| #10 | Cloudflare 無料枠内で運用 | session ストレージは JWT を採用し D1 row 増を抑制 |
| #11 | 管理者は他人プロフィール本文を直接編集できない | admin gate は閲覧 / 状態操作のみ許可、本文編集 endpoint は最初から不在（04c の scope out 確認） |

## 受入条件 (AC)

index.md の AC-1〜AC-10 を Phase 7 で全 trace。

## サブタスク管理

- [ ] 04b/04c の Phase 13 完了確認
- [ ] 02a/02c の Phase 13 完了確認
- [ ] Auth.js v5 Cloudflare Workers 互換 ADR の参照（infra 04 と整合）
- [ ] `SessionUser` view model schema の決定（packages/shared に配置予定）
- [ ] secrets 配置先（Cloudflare / GitHub / 1Password）を infra 04 の方針に合わせる
- [ ] 05b との session 共有契約 ADR 起票

## 実行手順

1. infra 04 の secrets 一覧を Read し、`AUTH_SECRET` 等の placeholder が確保されているか確認
2. 04b/04c の `index.md` を Read し、session を必要とする endpoint 一覧を抽出
3. 02a/02c の `index.md` を Read し、提供される repository function（`findIdentityByEmail`, `isAdminMember`）の signature を確認
4. specs/02, 06, 11, 13 を Read し、AuthGateState / admin 判定 / session 構造の差分が無いか確認
5. 不変条件 #2/#3/#5/#7/#9/#10/#11 が AC でカバーされていることを self-check
6. AC 漏れがあれば index.md を更新

## 統合テスト連携

| 並列 / 上流 / 下流 | タスク | 連携内容 |
| --- | --- | --- |
| 並列 | 05b | session callback の `MemberId` 共通化（同一メールで OAuth / Magic Link 両者から同じ memberId 解決） |
| 下流 | 06b | `/login` で Google OAuth ボタン表示、callback 後 `/profile` リダイレクト |
| 下流 | 06c | `/admin/*` への access は middleware で gate |
| 下流 | 08a | gate の認可境界 contract test（401 / 403）|

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| セキュリティ | session JWT の signature 検証、改ざん検出 | #5, #11 |
| privacy | `memberId` 以外のフィールドを JWT に載せない（profile 本文等は含めない）| #4, #11 |
| 権限境界 | admin gate の skip 条件を作らない、`?bypass=true` 等のバックドアを作らない | #11 |
| 無料枠 | session storage は JWT 採用で D1 row 数を抑える | #10 |
| 観測性 | OAuth callback / admin gate 拒否は監査ログに残す（07c の audit と連携） | - |
| Cloudflare 互換 | Auth.js callback と middleware が Edge runtime 上で動くこと | - |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md | このタスクの scope / AC / 依存関係 |
| 必須 | ../README.md | Wave 全体の実行順と依存関係 |

## 成果物

- `outputs/phase-01/main.md` — 本 phase の成果サマリ
- `outputs/phase-01/scope-decision.md` — scope in/out の根拠記録
- `outputs/phase-01/dependency-confirmation.md` — 上流 4 タスク（04b/04c/02a/02c）の確定確認

## 完了条件

- [ ] AC が 10 件以上、`SessionUser` 構造が確定
- [ ] 不変条件マッピングが 7 個（#2,#3,#5,#7,#9,#10,#11）以上
- [ ] 上流 4 タスクの index.md を読了し、必要な signature が出揃っている
- [ ] scope out 項目が明確（特に 05b と 06c の境界）

## タスク 100% 実行確認

- [ ] index.md の AC が 10 件以上
- [ ] スコープに `/admin/users` 管理者管理 UI が **含まれていない** ことを確認
- [ ] スコープに Magic Link / AuthGateState が **含まれていない** ことを確認
- [ ] 4 条件すべて PASS
- [ ] 不変条件 #11 がスコープに反映済み
- [ ] 成果物 3 ファイルの placeholder を outputs/ に作成

## 次 Phase

Phase 2（設計）で次を確定:
- session callback の擬似コード
- admin gate middleware（apps/web edge と apps/api hono）の責務分離図
- secrets / env / route の Mermaid 図
- 05b との session contract ADR

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する
