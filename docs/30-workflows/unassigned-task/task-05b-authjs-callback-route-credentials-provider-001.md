# 05b follow-up: Auth.js callback route / Credentials Provider 実装 - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-05b-authjs-callback-route-credentials-provider-001                       |
| タスク名     | Auth.js Credentials Provider と `/api/auth/callback/email` route 実装         |
| 分類         | implementation                                                                |
| 対象機能     | apps/web auth (Magic Link callback / session 確立)                            |
| 優先度       | High                                                                          |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | 05b Phase 12 再検証 (`unassigned-task-detection.md` U-01)                     |
| 発見日       | 2026-04-29                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

05b (parallel-magic-link-provider-and-auth-gate-state) は `POST /auth/magic-link/verify` の API 本体と apps/web 側の proxy route、`magic_tokens` lifecycle、`AuthGateState` shared type を実装した。一方、Magic Link メール本文に埋め込まれる URL は `/api/auth/callback/email?token=&email=` を指しており、この callback route と Auth.js (next-auth) Credentials Provider 本体は 05b スコープには含めず、`apps/web/app/lib/auth/config.ts` に placeholder のみを配置して 06b (member-login) に引き継いだ。

### 1.2 問題点・課題

- 現状、Magic Link メールに記載された URL をクリックすると `/api/auth/callback/email` が 404 になる
- next-auth の Credentials Provider 本体・session callback・JWT strategy が未実装で、verify 成功後の session cookie が確立されない
- `apps/web/app/lib/auth/config.ts` は placeholder のみのため、`auth()` / `signIn()` 等の Auth.js helper が機能しない
- 06b 以降の login gate state (`input/sent/unregistered/rules_declined/deleted`) と session 側の `SessionUserAuthGateState` (`active/rules_declined/deleted`) を混同せずに統合する必要がある（L-05B-004）

### 1.3 放置した場合の影響

- Magic Link 認証フローがエンドツーエンドで完結せず、メンバーログインが本番運用できない
- 06b/06a/06c wave で auth 依存のページが session を取得できず、機能ブロックが連鎖停止
- placeholder 状態が長期化し、callback route の URL 仕様や session shape が他タスクで暗黙前提化されるリスク
- next-auth の Edge runtime / Cloudflare Workers 互換性検証が後ろ倒しになり、リリース直前で互換性問題が露呈する恐れ

---

## 2. 何を達成するか（What）

### 2.1 目的

Auth.js Credentials Provider 本体と `/api/auth/callback/email` route を `apps/web` に実装し、Magic Link メールのリンククリックから session 確立までを完結させる。

### 2.2 最終ゴール

- `/api/auth/callback/email?token=&email=` route が存在し、token / email を受け取って `POST /api/auth/magic-link/verify` を呼び出す
- verify 成功時に Auth.js の session cookie が確立し、`SessionUser` が JWT/session に格納される
- 失敗時 (`expired` / `already_used` / `not_found` / `resolve_failed`) は session を作らず `/login?error=...` へ遷移する
- `apps/web/app/lib/auth/config.ts` の placeholder が本実装に置き換わり、`auth()` / `signIn()` が機能する
- apps/web は D1 を直接参照しない（不変条件 #5 の維持）

### 2.3 スコープ

#### 含むもの

- next-auth (Auth.js v5) の依存導入と Cloudflare Workers / Edge runtime 互換性確認
- Credentials Provider の `authorize()` 実装（`POST /api/auth/magic-link/verify` 呼び出し）
- `/api/auth/callback/email/route.ts` の実装（GET handler、token/email を受け取り signIn を実行）
- `apps/web/app/lib/auth/config.ts` の本実装化（providers / callbacks / session strategy）
- session callback で `SessionUser` を JWT/session に注入
- 失敗時の `/login?error=...` 遷移
- 単体テスト・E2E スモーク（success / expired / already_used / not_found / resolve_failed）

#### 含まないもの

- `/login` ページの UI 実装（06b 別タスク）
- `AuthGateState` の login gate 側 union 定義（06b の login UI スコープ）
- `/no-access` route の作成（既に方針として作らない）
- magic-link 発行側の改修（05b で完了済）
- D1 schema 変更

### 2.4 成果物

- `apps/web/app/api/auth/callback/email/route.ts`
- `apps/web/app/api/auth/[...nextauth]/route.ts`（必要に応じて）
- `apps/web/app/lib/auth/config.ts`（placeholder → 本実装）
- next-auth 依存追加の `package.json` / `pnpm-lock.yaml` 差分
- 単体テスト + Playwright/Vitest による callback route スモーク
- 動作確認ログ（成功 / 各種失敗）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 05b が main にマージ済み（`POST /auth/magic-link/verify` と apps/web proxy が動作）
- `magic_tokens` テーブルが D1 に存在する
- `apps/web/app/lib/auth/config.ts` に session callback 形が文書化されている

### 3.2 依存タスク

- 05b Phase 12 完了（必須前提）
- 06b (member-login) UI と並走可能だが、本タスクが先行マージされることが望ましい

### 3.3 必要な知識

- Auth.js (next-auth v5) の Credentials Provider / callbacks / JWT strategy
- Next.js App Router Route Handler (`app/api/.../route.ts`)
- Cloudflare Workers + `@opennextjs/cloudflare` の Edge runtime 制約
- 不変条件 #5（D1 access boundary: apps/web → apps/api 経由のみ）
- 不変条件 #7（`SessionUser` の `memberId` / `responseId` 分離）
- L-05B-004（`SessionUserAuthGateState` と login gate state の名前空間分離）

### 3.4 推奨アプローチ

callback route は `GET /api/auth/callback/email` で `searchParams` から `token` / `email` を取り出し、Auth.js の `signIn("credentials", { token, email, redirect: false })` を呼ぶ。Credentials Provider の `authorize()` 内で apps/api の `POST /auth/magic-link/verify` を fetch し、`{ ok: true, user }` の場合のみ user を return する。失敗時は `null` を返し、callback route 側で `redirect(/login?error=...)` する。session strategy は JWT を採用し、Cloudflare Workers の Edge runtime 互換性を担保する。

---

## 4. 実行手順

### Phase構成

1. 依存導入と互換性確認
2. Credentials Provider / config 本実装
3. callback route 実装
4. 失敗系の error 遷移整備
5. テストと検証

### Phase 1: 依存導入と互換性確認

#### 目的

next-auth (Auth.js v5) を `apps/web` に導入し、Cloudflare Workers / Edge runtime での起動を確認する。

#### 手順

1. `pnpm --filter @repo/web add next-auth@beta` で依存追加
2. `apps/web/wrangler.toml` の compatibility flags を確認
3. `mise exec -- pnpm --filter @repo/web build` でビルド成功確認

#### 成果物

依存追加差分 / ビルドログ

#### 完了条件

next-auth import がビルドエラーにならず Workers バンドルに収まる

### Phase 2: Credentials Provider / config 本実装

#### 目的

`apps/web/app/lib/auth/config.ts` の placeholder を本実装に置き換え、Credentials Provider と callbacks を定義する。

#### 手順

1. `providers: [Credentials({ authorize })]` を実装
2. `authorize()` 内で `POST /api/auth/magic-link/verify` を fetch
3. `callbacks.jwt` で `SessionUser` を token に格納
4. `callbacks.session` で session.user に `SessionUser` を注入
5. `session: { strategy: "jwt" }` を指定

#### 成果物

`apps/web/app/lib/auth/config.ts` 本実装

#### 完了条件

`auth()` / `signIn()` helper が import できる

### Phase 3: callback route 実装

#### 目的

`/api/auth/callback/email?token=&email=` の GET handler を実装する。

#### 手順

1. `apps/web/app/api/auth/callback/email/route.ts` を新規作成
2. `searchParams` から `token` / `email` を取り出し validation
3. `signIn("credentials", { token, email, redirect: false })` を呼ぶ
4. 成功時は `/` または `/members/me` へ redirect
5. `apps/web/app/api/auth/[...nextauth]/route.ts` も合わせて配置（必要なら）

#### 成果物

callback route 実装差分

#### 完了条件

token/email 付きアクセスで 404 にならず、verify 成功時 session cookie が set される

### Phase 4: 失敗系の error 遷移整備

#### 目的

verify 失敗時に session を作らず適切な error クエリ付きで `/login` へ戻す。

#### 手順

1. `authorize()` が `null` を返した場合の handling 確認
2. callback route 側で `expired` / `already_used` / `not_found` / `resolve_failed` を `/login?error=...` の error code にマップ
3. login gate state (`input/sent/unregistered/rules_declined/deleted`) と session 側 `SessionUserAuthGateState` の名前空間が衝突しないことを確認（L-05B-004）

#### 成果物

error mapping 差分

#### 完了条件

各失敗ケースで session が作られず、`/login?error=<code>` に到達する

### Phase 5: テストと検証

#### 目的

callback route と Credentials Provider のエンドツーエンド動作を保証する。

#### 手順

1. `authorize()` の単体テストを追加（mock fetch で各 reason を網羅）
2. callback route のテストで token/email 取り扱いと redirect を検証
3. ローカルで Magic Link 発行 → メール URL クリック → session 確立を手動確認
4. `mise exec -- pnpm typecheck` / `pnpm lint` / `pnpm test` 緑

#### 成果物

テスト追加差分 / 検証ログ

#### 完了条件

全テスト緑かつ手動 E2E で session 確立を確認

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `/api/auth/callback/email?token=&email=` が 404 にならず動作する
- [ ] verify 成功時に `SessionUser` が session に格納される
- [ ] expired / already_used / not_found / resolve_failed は session を作らない
- [ ] 失敗時は `/login?error=<code>` に遷移する
- [ ] `apps/web/app/lib/auth/config.ts` placeholder と矛盾せず本実装に置き換わっている
- [ ] apps/web は D1 を直接参照しない（不変条件 #5）

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] `mise exec -- pnpm --filter @repo/web test` 緑
- [ ] Cloudflare Workers ビルド成功

### ドキュメント要件

- [ ] 06b 仕様書から本タスクの参照リンクが解決する
- [ ] `apps/web/app/lib/auth/` 配下に session shape のコメント記載
- [ ] L-05B-004 の名前空間分離が反映されている

---

## 6. 検証方法

### テストケース

- success: 正常な token/email で `/api/auth/callback/email` にアクセスし、session cookie が set されること
- expired: 期限切れ token で session が作られず `/login?error=expired` に遷移すること
- already_used: 使用済み token で `/login?error=already_used` に遷移すること
- not_found: 存在しない token で `/login?error=not_found` に遷移すること
- resolve_failed: members 解決失敗で `/login?error=resolve_failed` に遷移すること
- D1 boundary: apps/web から D1 を直接 import している箇所が 0 件であること

### 検証手順

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @repo/web typecheck
mise exec -- pnpm --filter @repo/web lint
mise exec -- pnpm --filter @repo/web test
mise exec -- pnpm --filter @repo/web build
rg -n "from \"@cloudflare/workers-types\"|env\.DB" apps/web/app
```

---

## 7. リスクと対策

| リスク                                                                 | 影響度 | 発生確率 | 対策                                                                                       |
| ---------------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| next-auth v5 の Edge runtime / Cloudflare Workers 互換性問題           | 高     | 中       | Phase 1 でビルド・起動確認を先行。互換性 issue 発見時は早期に compatibility flag を調整    |
| login gate state と `SessionUserAuthGateState` の名前空間混同 (L-05B-004) | 中     | 中       | shared type に文脈名を含め、login UI 側 union は API contract に閉じ込める                 |
| placeholder と本実装の session shape 不一致                            | 中     | 低       | 05b で文書化された session callback 形を正本とし、差異がある場合は本実装に合わせて記録更新 |
| apps/web から D1 を直接参照する誤実装                                  | 高     | 低       | callback route から必ず apps/api 経由で verify する。grep で `env.DB` 0 件を完了条件化     |
| Magic Link URL の token/email エンコード差異                           | 中     | 低       | 05b の発行側仕様に合わせて `URLSearchParams` で decode し、テストで symmetric を担保       |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/05b-parallel-magic-link-provider-and-auth-gate-state/outputs/phase-12/unassigned-task-detection.md`（U-01）
- `apps/web/app/lib/auth/config.ts`（placeholder）
- `apps/api/src/routes/auth/magic-link.ts`（verify endpoint）
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-05b-magic-link-auth-gate-2026-04.md`（L-05B-004）
- `docs/00-getting-started-manual/specs/02-auth.md`
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`

### 参考資料

- 不変条件 #5（D1 access boundary）
- 不変条件 #7（`SessionUser` の memberId / responseId 分離）
- Auth.js v5 公式: Credentials Provider / Edge Compatibility

---

## 9. 実装課題と解決策（lessons-learned 対応）

> 本セクションは `lessons-learned-05b-magic-link-auth-gate-2026-04.md` の該当 lesson を引用し、
> 「実装時に同様の課題が再発する可能性」と「事前に確認すべき設計判断」を整理する。

### 9.1 対応する lesson

| Lesson ID  | 教訓要旨                                                                                       | 本タスクへの影響                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| L-05B-001  | NON_VISUAL task でも Phase 12 implementation guide は Phase 11 evidence を明示参照する必要がある | 本タスクは UI 副作用を持つため Phase 11 で `/login` redirect 経路の evidence（HAR or Playwright trace）を採取し、`outputs/phase-11/*` への参照表を Phase 12 で固定する |
| L-05B-004  | `AuthGateState` (login UI 側 union) と `SessionUserAuthGateState` (session 側 union) が混同されやすい | callback route は session 側 `active/rules_declined/deleted` のみを扱い、login gate state (`input/sent/unregistered/...`) は API contract 側の error code → query param への mapping のみで解決する |

### 9.2 再発する可能性

- next-auth (Auth.js v5) を Cloudflare Workers Edge runtime に乗せる際の互換性検証は、依存導入だけで scope creep を起こしやすい。05b ではこれを理由に本機能を切り出した。06b 以降の wave で本タスクを着手する場合、**同一 wave に UI 実装（`/login` の状態 UI）を同居させない**こと
- session shape を placeholder と本実装で取り違えると、shared type (`SessionUser`) と JWT claim の往復で型不整合が連鎖発生する。L-05B-004 の名前空間分離が崩れると login UI 側 union と session 側 union の混在が再燃する
- callback route に D1 を直接読みに行く誘惑（不変条件 #5 違反）は middleware 検証時に毎回発生する。「`apps/api` 経由でのみ verify」を Phase 0 のスコープ宣言で必ず明記する

### 9.3 事前に確認すべき設計判断

- session strategy（JWT vs database session）の固定: Edge runtime + D1 boundary 制約から **JWT strategy を採用**することを Phase 1 で確定する
- `signIn("credentials", { redirect: false })` の戻り値仕様（success/error 構造）と Auth.js v5 beta の breaking change を事前に確認する
- error code 体系（`expired` / `already_used` / `not_found` / `resolve_failed`）が 05b の verify endpoint contract と 1:1 対応していることを Phase 2 着手前に schema レベルで diff する
- placeholder `apps/web/app/lib/auth/config.ts` のコメントに記載された session callback 形を **正本** とし、本実装で差異が生じた場合は本実装に合わせて placeholder コメントと L-05B-004 を逆方向に更新する

---

## 10. 備考

### 苦戦箇所【記入必須】

> 05b 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | 05b スコープに Auth.js (next-auth) の本体導入と `/api/auth/callback/email` route 実装を含めると、next-auth の peer dependency 解決・Edge runtime 互換性検証・Cloudflare Workers バンドル検証が肥大化し、05b の本来の主軸である `magic_tokens` lifecycle と `AuthGateState` shared type の検証完了が遅延した                            |
| 原因     | NON_VISUAL/API task（magic-link 発行 / verify / token lifecycle）と UI/auth provider 統合（next-auth 本体導入 + callback route + session 確立）を同一 wave に同居させると、互換性検証コストと scope creep が同時に発生する。05b 着手時のスコープ宣言で provider 統合の境界を明示していなかった                                          |
| 対応     | callback route と Credentials Provider 本体を 06b (member-login) に切り出し、05b では `apps/web/app/lib/auth/config.ts` を placeholder として配置 + session callback 形のみ文書化する判断を行った。これにより 05b は invariant #5 (D1 access boundary) の検証コストが下がった一方、Magic Link メール文中の URL `/api/auth/callback/email` が現時点で 404 になる「歩み寄り」を残した |
| 再発防止 | NON_VISUAL/API task と UI/auth provider 統合は同一 wave に同居させない。Phase 0 のスコープ宣言で「provider 統合（next-auth 本体・callback route・session 確立）の境界はどこか」を明示する。placeholder で先送りする場合は必ず unassigned-task として明文化し、メール本文 URL のような外向き interface が一時的に 404 になる事実を記録する |

### レビュー指摘の原文（該当する場合）

```
05b Phase 12 unassigned-task-detection.md U-01:
next-auth (Auth.js) 本体導入 + Credentials Provider 実装 + `/api/auth/callback/email` route は 06b (member-login) で完結させる。
05b では `apps/web/app/lib/auth/config.ts` を placeholder として配置し、session callback 形を文書化する。
```

### 補足事項

- 05b 完了時点で Magic Link メール本文の URL は `/api/auth/callback/email?token=&email=` 形式で発行されるが、callback route 未実装のため 404 を返す。本タスク完了によりエンドツーエンドのログイン導線が初めて成立する。
- 06b の login UI 実装と並走可能だが、本タスクを先行マージすることで login UI 側の error 遷移検証が容易になる。
- L-05B-004 の通り、`SessionUserAuthGateState` (`active/rules_declined/deleted`) と login gate state (`input/sent/unregistered/rules_declined/deleted`) は別 union として扱い、本タスクでは前者のみを session に格納する。
