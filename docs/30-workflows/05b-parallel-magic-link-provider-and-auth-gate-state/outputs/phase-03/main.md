# Phase 3: 設計レビュー — 成果物

## 0. 目的

Phase 2 の設計（`architecture.md` / `api-contract.md`）に対して 5 件の代替案を比較し、PASS-MINOR-MAJOR で判定する。`/no-access` 不採用方針（不変条件 #9）と、Auth.js EmailProvider を使わない Credentials bridge 方針、`gate-state` を public endpoint にする是非が中心論点。

## 1. 代替案の整理

### A: 採用案 — `gate-state` GET + `magic-link` POST 分離

- 概要: `GET /auth/gate-state?email=` で純粋判定、`POST /auth/magic-link` で判定 + 発行 + mail enqueue。callback は Auth.js 標準 `[...nextauth]` 経由で apps/api の `verify` を呼ぶ。
- 構成: `apps/web` は proxy のみ。判定・token・session 解決は `apps/api`。
- 判定: **PASS**
- 理由:
  - `/login` 画面が単一 fetch（POST）で 5 状態を吸収できる（preflight GET は任意）
  - 状態判定と token 発行を分離 → レートリミットを判定だけに重く掛けて UX 維持できる
  - 自前 magic_tokens verify と後続 Credentials bridge により D1 境界を apps/api に閉じられる
  - 不変条件 #5 / #7 / #9 / #10 を全て満たす

### B: POST 一本化（gate-state 廃止）

- 概要: `POST /auth/magic-link` のみ。state を必ず response に含む。preflight GET なし。
- 判定: **MINOR**
- 理由:
  - 機能的には A 案と等価。endpoint が 1 本減る利点あり
  - 一方で `/login` の UI が「メール入力して送信ボタンを押す」しか取れず、状態のリアルタイム表示（input 中の「このメールは未登録です」プレビュー）ができない
  - 採用案 A の `gate-state` は optional な強化点なので「廃止しても AC は満たせる」ため MINOR

### C: 専用 `/no-access` 画面復活

- 概要: `state in (unregistered, rules_declined, deleted)` 時に `/no-access?reason=...` へ redirect。
- 判定: **MAJOR**
- 理由:
  - **不変条件 #9 違反**（spec/02-auth.md 「`/no-access` には依存しない」明記）
  - 保守ルートが 1 つ増える、AC-7 を満たせない

### D: Auth.js 標準 EmailProvider のみ（事前判定なし）

- 概要: `signIn("email", { email })` のみ。Auth.js が send → callback を自動処理し、判定なし。
- 判定: **MAJOR**
- 理由:
  - 未登録 user にも mail 送信が走り、AC-1〜AC-3 を満たせない
  - 無料枠（Resend 100 通/日）を列挙攻撃で容易に枯渇させられる
  - 不変条件 #10 違反

### E: 自前 magic_tokens + 自前 verify（Auth.js 不使用）

- 概要: callback も `apps/api` 内に作り、cookie session を自前で発行。
- 判定: **MINOR**
- 理由:
  - 工数が大きく、05a の Google OAuth と session 統合が困難（重複実装）
  - 既に Auth.js 前提で 04b/04c/05a が動いている（`SessionUser` 既存）
  - 機能的には実現可能だが ROI が悪く採用しない

## 2. PASS-MINOR-MAJOR 集計

| 判定 | 件数 | 該当案 |
| --- | --- | --- |
| PASS | 1 | A（採用） |
| MINOR | 2 | B, E |
| MAJOR | 2 | C, D |

## 3. 採用理由（A 案）

1. `/login` 画面が単一 POST で 5 状態を吸収でき、UI が単純（`/no-access` 不要）
2. token 発行と判定の責務分離により、列挙攻撃対策（レートリミット）が判定だけに集中できる
3. Auth.js 本体は 06b に委譲し、05b は verify / resolve-session bridge を確定する
4. 既存 `apps/api/src/repository/magicTokens.ts`（02c 実装済み）の interface に変更不要
5. 並列タスク 05a（Google OAuth）と `POST /auth/resolve-session` を共有する経路が成立する

## 4. 未解決事項（次 Phase に引継ぎ）

| # | 論点 | 仮決定 | 確定 Phase |
| --- | --- | --- | --- |
| Q1 | レートリミット手段（isolate memory vs KV/DO/WAF） | MVP は isolate memory、厳密化は U-02 で KV/DO/WAF へ昇格 | 4 / 5 |
| Q2 | mail provider 選定（Resend / SendGrid / Mailtrap） | Resend を第一候補（無料 100 通/日、API 簡素） | 5 |
| Q3 | token TTL 10 分 vs 15 分 | 15 分（spec で固定済） | 確定 |
| Q4 | session 戦略（JWT vs database） | JWT（Workers ステートレス前提） | 確定（Phase 2） |
| Q5 | mail 送信失敗時の token rollback ポリシー | 同 transaction で issue → mail 順、mail 失敗時 `DELETE WHERE token = ?` | 5 |
| Q6 | `apps/web` → `apps/api` の同 origin 取り回し（`INTERNAL_API_BASE_URL` か service binding） | service binding を第一候補（無料枠で性能 + 認証同 zone） | 5 |

## 5. AC との整合再確認

| AC | A 案で満たす根拠 |
| --- | --- |
| AC-1〜AC-3 | `resolve-gate-state` で `unregistered` / `rules_declined` / `deleted` を早期 return、INSERT 0 件 |
| AC-4 | "ok" 判定時のみ `magicTokens.issue` + `mailer.send` を実行 |
| AC-5 / AC-6 | 既存 `magicTokens.consume` の楽観 lock UPDATE が `expired` / `already_used` を区別 |
| AC-7 | 設計上 `/no-access` ルートを一切作らない、Phase 5 で fs check + ESLint rule を追加 |
| AC-8 | secrets は Cloudflare Secrets / 1Password Environments 経由のみ（CLAUDE.md 既定） |
| AC-9 | 5 状態すべての response 形を api-contract.md で固定、08a で契約 test |
| AC-10 | `POST /auth/resolve-session` で `ok:false` の場合 callback が `null` を返し session 未発行 |

## 6. 多角的チェック

- 不変条件 #2: `rulesConsent` のみで判定、`publicConsent` は触らない（A〜E すべて維持）
- 不変条件 #5: A/B/D/E は apps/api に閉じる。C も apps/api 側は同一だが `/no-access` route の責務分離が崩れる
- 不変条件 #7: A/B/E は SessionUser 型で `memberId` と `responseId` を別フィールドに保つ。D は session に memberId 解決を入れない実装になりやすく違反リスク
- 不変条件 #9: C のみ違反 → MAJOR
- 不変条件 #10: D は無差別送信で枯渇リスク → MAJOR
- a11y: メール本文は HTML + text 両方を持つ（Phase 5 で確定）
- 認可境界: `gate-state` public 公開はレートリミットで列挙緩和（Q1）

## 7. 次 Phase への引継ぎ

- Phase 4（テスト戦略）: 採用案 A の API 契約 + 状態機械を入力に、5 状態 × 正常/異常の test 行列を作る
- Phase 5（実装ランブック）: Q1, Q2, Q5, Q6 を確定する
- Phase 6（異常系検証）: D 案的な「不正 token でも session 作る」リーク無きことを確認

## 8. 完了条件チェック

- [x] 代替案 5 件（≥3）
- [x] PASS-MINOR-MAJOR が全案に付与
- [x] 採用案 A の理由を明記
- [x] 未解決事項 Q1〜Q6 を確定 Phase 付きで残す
- [x] 不変条件 #9 違反案（C）を MAJOR と判定
