# Phase 4 — テスト戦略: provider / session callback / admin gate

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 4 / 13 |
| Wave | 5 |
| 種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | phase-03（設計レビュー） |
| 下流 | phase-05（実装ランブック） |

## 目的

採用案 A（JWT + middleware + requireAdmin）に対する unit / contract / E2E / authorization の test を設計する。AC-1〜AC-10 を test 行（test ID）と紐付け、Wave 8a の contract test と Wave 8b の Playwright がそのまま流用できる粒度で固定する。

## 実行タスク

1. test 階層と責務分担確定（unit / contract / E2E / authz / security）
2. session 構造の test 行列（memberId / isAdmin / email / 改ざん）
3. admin gate の二段防御 test（middleware + requireAdmin）
4. session-resolve endpoint の test（4 状態：none / deleted / rules_declined / ok × admin/non-admin）
5. apps/web → D1 直接アクセス禁止の lint test
6. 05b との session 共有 contract test

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-01/main.md | AC-1〜AC-10 |
| 必須 | outputs/phase-02/api-contract.md | I/O 仕様 |
| 必須 | outputs/phase-03/main.md | 採用案 A |
| 参考 | doc/00-getting-started-manual/specs/06-member-auth.md | session 構造 |
| 参考 | doc/00-getting-started-manual/specs/11-admin-management.md | admin 権限境界 |

## 実行手順

### ステップ 1: verify suite 設計

| layer | 対象 | tool | 担当 task |
| --- | --- | --- | --- |
| unit | session-resolve / signIn callback / jwt callback / session callback | vitest | 本 task |
| contract | `GET /auth/session-resolve`, `/admin/*` API の requireAdmin | vitest + miniflare | 08a で全体実行 |
| E2E | `/login` → Google OAuth ボタン → callback → `/profile`、`/admin/*` への access | Playwright (mock OAuth) | 08b で全体実行 |
| authorization | middleware が admin / 非 admin / 未認証で正しく分岐 | vitest | 08a |
| security | JWT 改ざん（signature mismatch）、`?bypass=true` 等のバックドア無し | vitest + curl | 11 |
| lint | apps/web → D1 直接 import 禁止 | ESLint rule | 09 |

### ステップ 2: session 構造 test matrix

| ID | 入力 (resolve 結果) | 期待 session.user | 期待 JWT 状態 |
| --- | --- | --- | --- |
| S-01 | `{memberId:"M01", isAdmin:false}` | `{memberId:"M01", isAdmin:false, email}` | sub=M01, isAdmin=false |
| S-02 | `{memberId:"M02", isAdmin:true}` | `{memberId:"M02", isAdmin:true, email}` | sub=M02, isAdmin=true |
| S-03 | `{memberId:null, gateReason:"unregistered"}` | session 作らない | JWT 発行しない |
| S-04 | `{memberId:null, gateReason:"deleted"}` | session 作らない | JWT 発行しない |
| S-05 | `{memberId:null, gateReason:"rules_declined"}` | session 作らない | JWT 発行しない |
| S-06 | JWT 改ざん（payload 書き換え） | verify fail → 401 | - |
| S-07 | JWT に `responses`/`profile` が含まれる | snapshot test fail（含めてはいけない） | - |

### ステップ 3: admin gate 二段防御 test matrix

| ID | レイヤ | 入力 | 期待 |
| --- | --- | --- | --- |
| G-01 | middleware (`/admin/*`) | 非ログイン user | 302 to `/login?gate=admin_required` |
| G-02 | middleware | 一般 member（isAdmin=false） | 302 to `/login?gate=admin_required` |
| G-03 | middleware | admin member（isAdmin=true） | next() で admin page 表示 |
| G-04 | requireAdmin (`/admin/*` API) | Authorization なし | 401 |
| G-05 | requireAdmin | 一般 member の JWT | 403 |
| G-06 | requireAdmin | admin の JWT | next で endpoint 実行 |
| G-07 | middleware bypass attempt | `?bypass=true` クエリ | 無視されて 302 |
| G-08 | middleware bypass attempt | 偽造 JWT cookie | verify fail → 302 |

### ステップ 4: session-resolve test matrix

| ID | 入力 email | DB 状態 | 期待 response |
| --- | --- | --- | --- |
| R-01 | unknown@example.com | identities に無し | `{memberId:null, isAdmin:false, gateReason:"unregistered"}` |
| R-02 | deleted@example.com | identities にあり、is_deleted=1 | `{memberId:null, isAdmin:false, gateReason:"deleted"}` |
| R-03 | declined@example.com | identities にあり、rules_consent != "consented" | `{memberId:null, isAdmin:false, gateReason:"rules_declined"}` |
| R-04 | member@example.com | identities にあり、admin_users に無し | `{memberId:"M01", isAdmin:false, gateReason:null}` |
| R-05 | admin@example.com | identities にあり、admin_users にあり | `{memberId:"M02", isAdmin:true, gateReason:null}` |
| R-06 | email クエリなし | - | 422 |

### ステップ 5: 認可境界 / lint test

| ID | シナリオ | 期待 |
| --- | --- | --- |
| Z-01 | apps/web から `import { getDb } from "@/d1"` 試行 | ESLint で error |
| Z-02 | apps/web の Auth.js callback から `getCloudflareContext().env.DB.prepare(...)` 試行 | ESLint で error |
| Z-03 | session callback で `isAdmin` を解決し session に積む | 単体 test green |
| Z-04 | session.user に `responses`/`profile` を含めない | snapshot test |
| Z-05 | requireAdmin の error response 形式（`{error:"forbidden"}`）統一 | snapshot test |

### ステップ 6: 05b との session 共有 contract test

| ID | シナリオ | 期待 |
| --- | --- | --- |
| C-01 | 同一 email で Google OAuth と Magic Link 両方ログイン | 解決される memberId が同一 |
| C-02 | session.user.isAdmin の値が provider 経由で変わらない | 同一 |
| C-03 | session-resolve endpoint が両 provider から呼ばれる | 同一 implementation |

### ステップ 7: a11y / UI 観点（08b へ引き渡し）

- `/login` の「Google でログイン」ボタンに `aria-label` がある
- gate 拒否時の error 表示が `aria-live="polite"`

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | test ID を実装ランブックの完了条件に組み込む |
| Phase 6 | 異常系の追加（OAuth callback での state mismatch、CSRF token 不正） |
| Phase 7 | AC × test ID 対応表 |
| 05b Phase 4 | session 共有 contract test の整合 |
| 08a | contract test の入力 |
| 08b | E2E シナリオの入力 |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| セキュリティ | S-06 / G-08 で JWT 改ざん検出 | #5 |
| privacy | S-07 / Z-04 で session に余分な情報を載せない | #4, #11 |
| 認可境界 | G-01〜G-08 で middleware と requireAdmin の二段防御を網羅 | #11 |
| 無料枠 | session storage が JWT のため D1 read/write 試験不要 | #10 |
| Cloudflare 互換 | E2E で Cloudflare Workers preview を使い middleware が動くことを確認 | - |
| dependency | C-01〜C-03 で 05b と session-resolve を共有 | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | verify suite 表 | 4 | pending | 6 layer × tool |
| 2 | session 構造 test matrix | 4 | pending | S-01〜S-07 |
| 3 | admin gate 二段防御 test | 4 | pending | G-01〜G-08 |
| 4 | session-resolve test | 4 | pending | R-01〜R-06 |
| 5 | 認可境界 / lint test | 4 | pending | Z-01〜Z-05 |
| 6 | 05b 共有 contract test | 4 | pending | C-01〜C-03 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | Phase 4 サマリ |
| ドキュメント | outputs/phase-04/test-matrix.md | AC × test ID × layer × tool |
| メタ | artifacts.json | phase 4 status |

## 完了条件

- [ ] AC-1〜AC-10 がいずれかの test ID と紐付き
- [ ] session 構造 / admin gate / session-resolve / 認可境界 / 05b 共有 がそれぞれ test 設計済み
- [ ] ESLint rule で apps/web → D1 を阻止する Z-01/Z-02 が記載
- [ ] 二段防御の bypass 試験（G-07/G-08）を含む

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- 2 種ドキュメント（main.md / test-matrix.md）配置
- 全 AC が test ID と対応
- 不変条件 #4, #5, #10, #11 への対応 test を含む
- 次 Phase へ test ID リストを引継ぎ

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ事項: test ID を runbook の完了条件として参照
- ブロック条件: AC × test ID 対応に欠落があれば進まない

## verify suite

| layer | tool | scope | 期待件数 |
| --- | --- | --- | --- |
| unit | vitest | session-resolve / signIn callback / jwt / session | 15 件以上 |
| contract | vitest + miniflare | session-resolve, requireAdmin, admin endpoints | 20 件以上 |
| E2E | Playwright (08b) | `/login` → OAuth → `/profile`, `/admin/*` | 6 件以上 |
| authz | vitest | middleware × member type 行列 | 8 件 (G-01〜G-08) |
| security | curl + script | JWT 改ざん, bypass 試行 | 4 件 |
| lint | ESLint | apps/web → D1 阻止 | 2 件 (Z-01, Z-02) |
