# Phase 4: テスト戦略 — 成果物

## 0. サマリ

採用案 A（`POST /auth/magic-link` + `GET /auth/gate-state` 分離 + 自前 magic_tokens verify + 後続 Auth.js Credentials bridge）の test を unit / contract / authorization / security の 4 層に展開する。AC-1〜AC-10 と Phase 6 の F-XX failure case を test ID に紐付ける。E2E（Playwright）は 08b の責務に委譲し、本タスクでは vitest + miniflare による D1 統合テストを作る。

## 1. verify suite

| layer | 対象 | tool | 担当 task | 期待件数 |
| --- | --- | --- | --- | --- |
| unit | gate-state-resolver / magic-link-mailer / verify | vitest | 本 task | 8+ 件 |
| contract | `POST /auth/magic-link` / `GET /auth/gate-state` / `POST /auth/magic-link/verify` / `POST /auth/resolve-session` | vitest + miniflare | 本 task | 15+ 件 |
| E2E | `/login` 5 状態 → callback → `/profile` | Playwright | 08b（本 task では実装しない） | 5+ 件 |
| authz | gate-state public 公開でも token 副作用は条件付き / `apps/web` から D1 直 import 禁止 | vitest + ESLint | 本 task | 3 件 |
| security | レートリミット、列挙耐性 | vitest（fake clock） | 本 task | 3+ 件 |

## 2. AuthGateState 5 状態 × 2 系統 test matrix（要約）

詳細は `test-matrix.md` を参照。

- R1（unregistered）: identity 不在 → POST/GET ともに `state: "unregistered"`、INSERT 0 件
- R2（rules_declined）: rules_consent != consented → POST/GET ともに `state: "rules_declined"`
- R3（deleted）: is_deleted = 1 → 両系統 `state: "deleted"`（rules_declined より優先）
- R4（ok→sent）: 全条件 OK → POST=`sent`+INSERT 1件+mail 1通、GET=`ok`、副作用なし
- R5（input）: ユーザー入力前。API は返さず UI 内部状態（test 対象外）

## 3. token lifecycle test ID

| ID | 概要 | 対応 AC |
| --- | --- | --- |
| T-01 | 有効 token consume → ok=true、used=1 になる | AC-9 |
| T-02 | 期限切れ token consume → ok=false / reason=expired → 401 | AC-5 |
| T-03 | 二回目 consume → ok=false / reason=already_used → 401 | AC-6 |
| T-04 | 不正 token（DB 不在）consume → ok=false / reason=not_found → 401 | AC-9 |
| T-05 | email mismatch（token は valid だが request email が違う） → ok=false / reason=resolve_failed | AC-9 |

## 4. レートリミット test

| ID | シナリオ | 期待 |
| --- | --- | --- |
| R-01 | 同 email で 1h 以内に 6 回 POST /auth/magic-link | 6 回目 429 RATE_LIMITED |
| R-02 | 異なる email で交互に 6 回 | 全件成功（ok 状態） |
| R-03 | gate-state を同 IP で 61 回 | 61 回目 429 |

## 5. 認可境界 test

| ID | シナリオ | 期待 |
| --- | --- | --- |
| Z-01 | apps/web 配下に D1 直接 import が無い | grep / ESLint で 0 件 |
| Z-02 | gate-state response に memberId が含まれない | snapshot で確認、zod strict |
| Z-03 | resolve-session が ok=false 時に user を返さない | unit test で discriminated union 強制 |

## 6. AC ↔ test ID 対応

| AC | test ID |
| --- | --- |
| AC-1 | R1, F-03 |
| AC-2 | R2, F-04 |
| AC-3 | R3, F-05 |
| AC-4 | R4 |
| AC-5 | T-02, F-07 |
| AC-6 | T-03, F-08 |
| AC-7 | fs check + Z-01 |
| AC-8 | gitleaks（Phase 9） |
| AC-9 | matrix R1〜R4 全件、contract test |
| AC-10 | Z-03、resolve-session unit |

## 7. 完了条件チェック

- [x] AC-1〜AC-10 すべて test ID に対応
- [x] token lifecycle が T-01〜T-05 で網羅
- [x] レートリミット test R-01〜R-03 設計済み
- [x] Z-01〜Z-03 で apps/web → D1 阻止 + memberId 漏洩防止

## 8. 次 Phase 引継ぎ

- 実装する test ID 一覧: T-01〜T-05、R-01〜R-03、Z-01〜Z-03、契約 R1〜R4
- 実装位置: `apps/api/src/routes/auth/__tests__/` 配下、`apps/api/src/use-cases/auth/__tests__/` 配下
