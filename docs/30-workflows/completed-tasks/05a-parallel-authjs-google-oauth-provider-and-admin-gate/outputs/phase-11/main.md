# Phase 11 — 手動 smoke 結果サマリ

| 項目 | 値 |
| --- | --- |
| タスク | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 11 / 13 |
| 実行日 | 2026-04-29 |
| 実行者 | Layer 5（UI/UX 視覚的検証エージェント） |
| ステータス | **PARTIAL — 自動化テストで代替済 / 実環境 smoke は BLOCKED** |

---

## サマリ（200 字）

実 Google OAuth credentials と Cloudflare Workers preview 環境が当ワークツリーから利用不可のため、M-01〜M-11 の手動 smoke は **BLOCKED**。代替として (a) 共有 JWT 互換 / session-resolve / requireAdmin / admin route gate の自動化テストを実行、(b) 実環境再現用の `smoke-checklist.md` を整備、(c) コードベース上で確定可能な不変条件 #9（`/no-access` 不在）を `no-access-check.txt` で検証完了。残りの evidence は staging 接続後（05a-followup-001）に補完する placeholder として記録する。

---

## 実行結果一覧

### 自動実行できた項目

| # | 項目 | 結果 | evidence |
| --- | --- | --- | --- |
| auto-1 | `/no-access` 不在（不変条件 #9） | **PASS** — `apps/web/app/no-access` および `apps/web/src/app/no-access` の両方とも存在せず。grep hit は middleware.ts コメント 1 行のみ | `no-access-check.txt` |
| auto-2 | 共有 JWT 互換 / requireAdmin / session-resolve | **PASS (25/25)** — `packages/shared/src/auth.test.ts`, `apps/api/src/middleware/require-admin.test.ts`, `apps/api/src/routes/auth/session-resolve.test.ts` | `automated-test-evidence.md` |
| auto-3 | 人間向け admin route gate | **PASS (34/34)** — dashboard / members / status / notes / delete / tags / schema / meetings / attendance が Auth.js JWT で通過 | `automated-test-evidence.md` |

### BLOCKED の項目（実環境再現用 checklist で代替）

| # | 項目 | 状態 | 理由 | 引継ぎ先 |
| --- | --- | --- | --- | --- |
| M-01〜M-05 | OAuth flow（unregistered / rules_declined / deleted / member / admin） | BLOCKED | 実 Google OAuth client + D1 staging seed が必要 | 05a-followup-001 |
| M-06〜M-08 | admin gate（middleware redirect） | BLOCKED | apps/web を Workers preview で起動する必要あり | 05a-followup-001 |
| M-09〜M-11 | admin gate API（curl /admin/members 等） | BLOCKED | OAuth flow 由来の実 cookie/JWT を取得する必要あり | 05a-followup-001 |
| F-09 | JWT 改ざん試行 | 自動 PASS / 実環境 BLOCKED | unit test では PASS、OAuth flow 由来 JWT での curl は M-04/M-05 が前提 | 05a-followup-001 |
| F-15 | `?bypass=true` クエリ | BLOCKED | apps/web 起動が前提 | 05a-followup-001 |
| F-16 | 偽造 cookie | 自動 PASS / 実環境 BLOCKED | shared verifier では PASS、ブラウザ cookie smoke は apps/web 起動が前提 | 05a-followup-001 |
| B-01 | race condition（admin 剥奪後に JWT 残存） | BLOCKED | OAuth flow + D1 操作が前提（既知制約として記録済み） | 05a-followup-003 |

---

## スクリーンショット該当外の理由

本 Phase が要求するスクリーンショット（`screenshot-*.png` 9 枚）は、いずれも

1. 実 Google OAuth provider への redirect / callback を伴う、または
2. `/admin/dashboard` / `/profile` の実画面（06a/b/c で実装予定、現時点では未実装）を撮影する

ものに該当する。当ワークツリーには:

- 実 OAuth client_id / client_secret の op 参照は存在するが、Cloudflare Workers preview/staging への deploy がまだ行われていない
- `/profile` / `/admin/dashboard` の実 UI は本タスク（05a）のスコープ外（middleware gate のみ実装）

ため、いまブラウザを開いても撮影対象が描画されない。よって**画像取得はスキップ**し、実画像取得は staging deploy 後の Phase 09a に委譲する。代わりに `smoke-checklist.md` に再現手順・期待結果・撮影ポイントを完全形で記述した。

---

## 不変条件カバレッジ

| # | 条件 | 本 Phase での確認 |
| --- | --- | --- |
| #2 | consent キー統一（`publicConsent` / `rulesConsent`） | M-02 手順に `rulesConsent` 参照を明記（checklist） |
| #4 | deleted の挙動 | M-03 手順で `/login?gate=deleted` redirect を確認する手順を明記 |
| #5 | apps/web → D1 直アクセス禁止 | session-resolve は apps/api 経由（実装 review は phase-10 で完了） |
| #7 | memberId と responseId 分離 | M-04/M-05 で `session-*.json` から responseId が出ないことを確認する手順 |
| #9 | `/no-access` 不在 | **本 Phase で確認 PASS**（`no-access-check.txt`） |
| #11 | admin gate 二段防御 | M-06〜M-11 の手順を checklist に明記 + Phase 4-10 の自動化テストで代替検証 |

---

## 完了条件チェック

- [x] 6 サブタスクの evidence 雛形が outputs/phase-11/ に存在
- [ ] M-01〜M-11 全て期待通り — **BLOCKED**（staging 接続後）
- [ ] bypass 試行が全て阻止される — **BLOCKED**（staging 接続後）
- [x] `/no-access` 不在が確認
- [ ] B-01 race condition の挙動が想定通り — **BLOCKED**（OAuth flow が前提）

---

## 次 Phase への引継ぎ

| 項目 | 内容 |
| --- | --- |
| 12 (ドキュメント更新) | `smoke-checklist.md` を implementation-guide に embed し、`B-01` を既知制約として明記 |
| 05a-followup-001 / 09a (staging) | `smoke-checklist.md` の M-01〜M-11 / F-09,15,16 / B-01 を実環境で再実行し、screenshot / curl 結果で本 phase-11 の placeholder を上書き |

---

## 成果物一覧

| パス | 説明 | 状態 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | 本ファイル | 完成 |
| `outputs/phase-11/smoke-checklist.md` | 実環境 smoke 再現手順 | 完成 |
| `outputs/phase-11/automated-test-evidence.md` | Phase 4-10 自動化テスト集計 | 完成 |
| `outputs/phase-11/no-access-check.txt` | `/no-access` 不在確認 | 完成（PASS） |
| `outputs/phase-11/screenshot-*.png` (9 枚) | UI 画面 | placeholder（09a で取得） |
| `outputs/phase-11/curl-admin-*.txt` (3 件) | API gate 結果 | placeholder（09a で取得） |
| `outputs/phase-11/bypass-*.txt`, `jwt-tampered.txt` | bypass 試行 | placeholder（09a で取得） |
| `outputs/phase-11/race-condition-admin-revoke.txt` | B-01 確認 | placeholder（09a で取得） |
| `outputs/phase-11/session-{member,admin}.json` | session shape | placeholder（09a で取得） |
| `outputs/phase-11/wrangler-dev.log` | wrangler 出力 | placeholder（09a で取得） |
