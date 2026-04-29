# Phase 1: 要件定義 — 成果物

## 0. サマリ

Magic Link 補助導線と `AuthGateState` 5 状態判定の責務範囲を確定する。`/no-access` 専用画面に依存せず、`/login` 画面が単一 fetch でログイン可否と誘導 CTA を切り替える設計を要件として固定する。判定ロジックと token 発行は `apps/web` から D1 を直接触らず `apps/api` に閉じる（不変条件 #5）。

---

## 1. AuthGateState 5 状態と判定条件

`AuthGateState` は `/login` 画面の状態機械であり、`SessionUser.authGateState`（`active` / `rules_declined` / `deleted`）とは別概念である（spec/06-member-auth.md 100-114 行を踏襲）。

| 状態 | 意味 | 判定条件 | 副作用 |
| --- | --- | --- | --- |
| `input` | 初期。メール入力待ち | （前提） | なし |
| `sent` | Magic Link メール送信済み | `member_identities.response_email = email` AND `member_status.rules_consent = "consented"` AND `member_status.is_deleted = false` | `magic_tokens` に 1 行 INSERT、mail enqueue |
| `unregistered` | フォーム未回答 | 上記 lookup で `member_identities` 不存在 | なし（D1 write 0） |
| `rules_declined` | 規約未同意 | identity 存在 AND `rules_consent != "consented"` | なし |
| `deleted` | 削除済み | identity 存在 AND `is_deleted = true` | なし |

判定優先順位（早期 return）: `unregistered` → `deleted` → `rules_declined` → `sent`。
`deleted` を `rules_declined` より先に評価するのは、削除済みユーザーに「規約再同意で復活できる」と誤認させないため。

### 判定キー（不変条件 #2 / #3 / #7）

- lookup key: `email`（system field の `responseEmail` と同一値、ただし呼び出し側 input 名は `email`）
- 比較は normalize 済み（lowercase, trim）
- consent キーは `rulesConsent`（不変条件 #2）。`publicConsent` は判定に使わない（公開可否は別軸）
- session 確立時は `memberId` を返し、`responseId` と混同しない（不変条件 #7）

---

## 2. magic_tokens token lifecycle

### schema（`spec/08-free-database.md` 235-243 行）

```sql
CREATE TABLE IF NOT EXISTS magic_tokens (
  token TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  email TEXT NOT NULL,
  response_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
```

### lifecycle ルール

| 段階 | ルール | 根拠 |
| --- | --- | --- |
| 発行 | TTL = 15 分 (`expires_at = now + 900s`) | spec 02-auth.md 補助導線 / 無料枠 |
| 形式 | crypto-strong 32 byte（hex 64 文字） | repository/magicTokens.ts 既存実装 |
| 検証 | `expires_at >= now` AND `used = 0` | `verify()` |
| 消費 | `UPDATE used = 1 WHERE used = 0 AND expires_at >= now` で楽観 lock | `consume()` 既存実装、replay 不可 |
| sweep | 不要（TTL 短いため自然消滅、参照は expires_at 比較で弾く） | 無料枠運用 #10 |
| レート | 同一 email あたり 5 回 / 1h | 列挙緩和 |

---

## 3. 受入条件（AC-1 〜 AC-10）

| AC | 条件 |
| --- | --- |
| AC-1 | `POST /auth/magic-link` に未登録メール → `{ state: "unregistered" }`。`magic_tokens` への INSERT は 0 件。mail 送信なし |
| AC-2 | `rules_consent != "consented"` のメール → `{ state: "rules_declined" }`。INSERT 0 件、mail 送信なし |
| AC-3 | `is_deleted = true` のメール → `{ state: "deleted" }`。INSERT 0 件、mail 送信なし |
| AC-4 | 上記いずれにも該当しない有効メール → token 発行（INSERT 1 件）+ mail enqueue + `{ state: "sent" }` |
| AC-5 | `expires_at < now` の token を `/api/auth/callback/email` に渡すと `401 INVALID_TOKEN`、session 未確立 |
| AC-6 | 同一 token 2 回目使用は `401 ALREADY_USED`（`used=1` で UPDATE が `changes=0` になる挙動を活用） |
| AC-7 | `apps/web/app/` 配下に `no-access` ルート（`no-access/page.tsx` 等）が存在しない（fs check + ESLint rule で fail） |
| AC-8 | gitleaks スキャンで `MAIL_PROVIDER_KEY` 等が hit しない |
| AC-9 | `AuthGateState` 5 状態すべての契約 test が green（`08a` で実行） |
| AC-10 | Auth.js session callback で `memberId` と `isAdmin` が解決された場合のみ session 発行。未解決時は session を作らない（callback で null 返却） |

---

## 4. 含むこと / 含まないこと

### 含む

- Auth.js EmailProvider 設定（`apps/web/lib/auth/`）
- `POST /auth/magic-link`（`apps/api`）
- `GET /auth/gate-state?email=`（`apps/api`、純粋判定）
- magic_tokens 発行・検証・消費（既存 `apps/api/src/repository/magicTokens.ts` を再利用）
- メール送信プロバイダ配線（Resend を第一候補）
- `/api/auth/callback/email` 検証 → session 確立
- `/no-access` route 不在の自動検証

### 含まない

- Google OAuth provider（05a）
- `/login` `/profile` 画面 UI（06b）
- admin gate middleware（05a 所掌、`apps/api/src/middleware/admin-gate.ts` は既存）
- `/me/*` `/admin/*` API 本体（04b / 04c で実装済み or 並行）

---

## 5. 上流からの引き渡し（handoff）

| 上流タスク | 引き渡し物 | 形式 | 確認状態 |
| --- | --- | --- | --- |
| 02c | `magic_tokens` repository（issue / verify / consume） | `apps/api/src/repository/magicTokens.ts` | 実装済み確認済み |
| 03b | `member_status.rules_consent` / `is_deleted` snapshot | D1 row | sync 済み前提 |
| 04b | `GET /me` の SessionUser 形 | `MeSessionResponseZ`（既存） | 実装済み |
| 04c | admin gate / `admin_users.email` lookup | `apps/api/src/middleware/admin-gate.ts` | 実装済み |

---

## 6. 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | `/no-access` 画面の保守コストを下げるか | PASS | 5 状態を `/login` で吸収 → 1 ルート削減、UX 単純化 |
| 実現性 | 無料枠で magic link を運用できるか | PASS | Resend 100 通/日、D1 100k writes/日 で十分 |
| 整合性 | consent / responseEmail / memberId が specs と一致するか | PASS | 02-auth / 06-member-auth / 13-mvp-auth と完全一致、不変条件 #2 #3 #7 順守 |
| 運用性 | token sweep / rotation が可能か | PASS | TTL 15 分で expires_at 比較のみ。物理 sweep 不要 |

---

## 7. 不変条件マッピング

| # | 不変条件 | 反映先 |
| --- | --- | --- |
| #2 | publicConsent / rulesConsent 統一 | AC-2、判定ロジックは `rulesConsent` のみ参照 |
| #3 | `responseEmail` は system field | AC-1、`member_identities.response_email` が lookup key |
| #5 | apps/web から D1 直接禁止 | architecture（apps/web → apps/api proxy） |
| #7 | responseId と memberId 混同しない | AC-10、session callback は `memberId` を返す |
| #9 | `/no-access` 不採用 | AC-7、fs check + ESLint rule |
| #10 | 無料枠 | token TTL 15 分・レートリミット 5/1h、sweep 不要 |

---

## 8. 異常系観点（Phase 6 引継ぎ）

- 無料枠超過: 1 email から短時間に大量 magic-link 発行 → レートリミットで弾く
- D1 drift: `member_status` snapshot 不整合 → gate-state は最新 row を strict に読む
- token brute force: 32 byte hex は探索不可能。expires_at 比較で時間窓を制限
- email 列挙攻撃: `gate-state` public endpoint のレート制限 + response 形を 5 状態どれでも 200 で返す（HTTP status は判別材料にしない）
- mail provider 障害: enqueue 失敗時は token を rollback or 後段リトライ（Phase 5 で確定）

---

## 9. 次 Phase への引継ぎ

- AC-1〜AC-10 を Phase 2 の API contract 入力として渡す
- AuthGateState を Mermaid 状態機械に展開
- `responseId` を session callback で member_identities から解決する経路を要設計
- Q1〜Q3（レートリミット手段、mail provider、TTL）は Phase 3 / 5 で確定

## 10. 完了条件チェック

- [x] AC-1〜AC-10 を記載
- [x] 5 状態判定条件を表で提示
- [x] 4 条件評価が全 PASS
- [x] 不変条件 #2/#3/#5/#7/#9/#10 を明記
- [x] 異常系観点を記述
- [x] 次 Phase 引継ぎ事項を末尾に記述
