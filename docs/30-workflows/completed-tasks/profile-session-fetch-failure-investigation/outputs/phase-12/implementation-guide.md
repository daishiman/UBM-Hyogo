# Phase 12: 実装ガイド（implementation-guide）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | VISUAL |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

---

## Part 1: 中学生レベルの概念説明（なぜ → 何を）

### なぜこの調査・修正が必要か（日常の例え話）

マイページを開くのは、受付で「会員証を見せてください」と言われて見せるのに似ています。あなたが会員証を出すと、受付係（API という裏方）が**会員名簿**であなたの名前を探します。名簿でちゃんと見つかれば「どうぞお入りください」とマイページが開きます。

ところが今、受付係が名簿を確認できないことがあります。理由はいくつか考えられます。

- 名簿に「退会済み」と書いてある（＝あなたの登録が消されている状態。これを **410** と呼びます）
- 受付係がそもそも体調を崩していて名簿を開けない（＝サーバーの中で何か壊れている。これを **5xx** と呼びます）
- 受付の電話線が切れていて、奥の名簿係に連絡すらできない（＝通信そのものが届いていない。これを **transport 失敗** と呼びます）

問題は、**どの理由でも今のシステムは「今は確認できません。時間をおいて再読み込みしてください」という同じ一言にまとめて返してしまう**ことです。理由が 3 つもあるのに表示が 1 つなので、見ている人も直す人も「なぜダメなのか」が分かりません。原因が分からないと、毎回あてずっぽうで直すことになり、また同じことが起きます。

### 何をするか

今回は「本格的に直す」前に、まず **原因をきちんと見分けられるようにする**ことをします。お医者さんがいきなり手術するのではなく、まず検査して病名をはっきりさせるのと同じです。3 つのことをします。

1. **理由を分けて表示する**（T01）。今は「時間をおいて再読み込み」の一言だけですが、これを「退会済みのとき」「中で壊れているとき」「電話線が切れているとき」で見分けられるようにします。ただし会員さんの画面には怖い専門用語は出さず、開発者だけが分かる**目印（data 属性）**を画面の裏に付けます。
2. **失敗の記録を残す**（T02）。受付係が名簿を確認できなかったとき、「何時に・どの理由（status / code）で・どの宛先（path）で失敗したか」をログ（作業日誌）に書き残します。ただし会員さんの個人番号は日誌に書きません。
3. **検査キットを作る**（T03）。`diagnose-profile-session.sh` という、**見るだけで何も壊さない**検査スクリプトを作ります。これを 1 回走らせれば「受付の電話は通じているか」「名簿係は最新版か」を一度に確認できます。

この 3 つは「原因を見分ける」ためのもので、退会済みの人をどう案内するか・中の壊れをどう直すか、といった**本格的な手当ては、検査で病名が決まってから**やります（先送りではなく、原因が決まらないと手当ての方針を決められないため）。

### 今回作るもの（implemented_local_evidence_captured 段階の予定）

- `/profile` のエラー表示を `MEMBER_SESSION_410` / 5xx 族 / `MEMBER_SESSION_FAILED` で見分け、原因コードを `data-*` 属性で裏に出す変更（既存 `SectionError` の props 拡張）
- `/me` 取得失敗時に `status`/`code`/`path` を構造化ログで残す server-side 変更（`safe-fetch.ts`・個人情報は出さない）
- `scripts/diagnose-profile-session.sh`（read-only・冪等）の検査スクリプト
- web の focused Vitest（`page.spec.tsx` / `session-error-display.spec.ts` / `safe-fetch.spec.ts` / `SectionError.spec.tsx`）と、診断後の static UI contract screenshot

---

## Part 2: 技術者向け実装ガイド

### 背景

`/profile`（Server Component）は `safeServerFetch(() => fetchAuthed<MeSessionResponse>("/me"), { codePrefix: "MEMBER_SESSION", rethrowOn: [AuthRequiredError] })` で `/me` を取得する（`apps/web/app/(member)/profile/page.tsx:38-50`）。エラー分岐は 2 つだけで、`MEMBER_SESSION_404` のみ「再ログイン」CTA（page.tsx:53-63）、それ以外の非2xx / transport 失敗はすべて「時間をおいて再読み込み」デフォルト分岐（page.tsx:66-74）に集約される。画像の症状はこのデフォルト分岐であり、`session-guard` の分岐と突き合わせると **401 は redirect されバナーにならず、404 は再ログイン CTA になる**ため、真因は **410（`member_status.is_deleted=1`）/ 5xx / transport 失敗（`MEMBER_SESSION_FAILED`）に絞られる**（H3/H4/H5）。これら 3 つが一律集約され root cause が隠蔽されている観測性欠如（H6）が診断不能の主因である。

### 要約

T01（`/profile` エラー分岐を error code で区別表示・原因コードを `data-*` 可視化）、T02（`/me` 取得失敗時の構造化ログ）、T03（read-only 診断スクリプト）の 3 タスクで観測性を獲得し、staging 実機調査（Phase 11）で真因を H3/H4/H5 のいずれかへ収束させる。`/me` の path・shape・status 体系・D1 schema・Google Form 仕様・`apps/api/src/**` は**一切変更しない**（AC-6 / apps/api 非接触）。本格的な根本修正（410 復帰 / 5xx 根治 / transport 運用是正 / 管理者 UX）は真因確定後でないと方針を決められないため Phase 12 で未タスク化する（CONST_007 例外①）。

### APIシグネチャ

- API Worker route: `GET /me` の既存契約（path・shape・401/410/5xx status 体系）を維持する。**観測は read-only**。
- Web safe fetch: `normalizeError` が生成する error code 体系を維持する（`MEMBER_SESSION_<status>` / status 不在は `MEMBER_SESSION_FAILED`）。`STATUS_FROM_MESSAGE=/\bfailed:?\b.*\b(\d{3})\b/`。
- UI component props: `SectionErrorProps` に診断用 optional props（原因コード可視化のための `data-*` 連携）を追加する。新規 primitive は作らない。

### `/me` status × web error code 対応表（区別分岐の正本）

| `/me` 応答 | session-guard 条件 | web error code | `/profile` 分岐（After） | ユーザー文言 | `data-*` 原因コード | 仮説 |
| --- | --- | --- | --- | --- | --- | --- |
| 401 | session 未解決 / identity・status 不在 | （`AuthRequiredError` rethrow） | `/login?redirect=/profile` redirect | （バナー無し） | — | H2（除外） |
| 404 | route 解決層 | `MEMBER_SESSION_404` | 再ログイン CTA（既存・回帰なし） | 「アカウント情報を確認できませんでした。再ログインしてください。」 | `data-cause="session-404"` | （既存） |
| 410 | `member_status.is_deleted=1` | `MEMBER_SESSION_410` | **区別分岐（新規）** | 安全な一般文言（生 message 非露出） | `data-cause="session-410"` | **H3** |
| 5xx | resolver / D1 / handler 例外 | `MEMBER_SESSION_5xx`（5xx 族） | **区別分岐（新規）** | 安全な一般文言 +「再読み込み」 | `data-cause="session-5xx"` | **H4** |
| transport 失敗 | service-binding 未応答 / 旧 bundle / network | `MEMBER_SESSION_FAILED` | **区別分岐（新規）** | 安全な一般文言 +「再読み込み」 | `data-cause="session-failed"` | **H5** |

> ユーザー向けには安全側の文言を維持しつつ、開発者が `data-cause` 属性（および T02 の server ログ `code`）で root cause を判別できるようにする。技術文字列（`fetchAuthed failed: <status>`）はユーザー画面に露出しない。

### 実装ステップ

#### T01: `/profile` エラー分岐の区別表示（VISUAL）

`apps/web/app/(member)/profile/page.tsx` の `!meResult.ok` 分岐（66-74 行目のデフォルト分岐）を、`meResult.error.code` で区別する。error code → 表示/原因コード のマッピングは Phase 8 で純関数化する（`mapProfileSessionErrorToDisplay`）。

```ts
// error code → 表示・data-cause のマッピング純関数（Phase 8 で抽出）
interface SessionErrorDisplay {
  title: string;
  detail: string;          // 固定一般文言（生 message を渡さない）
  retryHref?: string;      // 5xx / FAILED は "/profile"
  actionHref?: string;     // 404 のみ "/login?redirect=/profile"
  actionLabel?: string;
  dataCause: "session-404" | "session-410" | "session-5xx" | "session-failed";
}

function mapProfileSessionErrorToDisplay(code: string): SessionErrorDisplay { /* ... */ }
```

- `MEMBER_SESSION_404` → 既存の再ログイン CTA（回帰なし）。
- `MEMBER_SESSION_410` → 安全文言 + `data-cause="session-410"`（原因コード可視化）。
- `MEMBER_SESSION_5xx`（5xx 族）→ 安全文言 + `retryHref="/profile"` + `data-cause="session-5xx"`。
- `MEMBER_SESSION_FAILED` → 安全文言 + `retryHref="/profile"` + `data-cause="session-failed"`。
- 401（`AuthRequiredError`）は従来どおり `redirect("/login?redirect=/profile")` を維持（AC-3 回帰なし）。

`apps/web/src/components/member/SectionError.tsx` は原因コードを裏に出すため `data-cause`（または既存 `data-*` パターンに合わせた属性）を受け取れるよう props を拡張する。色は既存 `section-error` primitive とトークンに従い HEX 直書きしない。

#### T02: `/me` 取得失敗時の構造化ログ（NON_VISUAL）

`apps/web/src/lib/server-fetch/safe-fetch.ts` の `normalizeError`（`codePrefix_<status>` 生成 / status 無→`_FAILED`）失敗パスに、server-side 構造化ログを挿入する。

```ts
// /me 取得失敗時のみ（codePrefix が MEMBER_SESSION のとき）
console.error(JSON.stringify({
  event: "session_fetch_failed",
  status,          // 410 / 5xx / null
  code,            // MEMBER_SESSION_410 / _5xx / _FAILED
  path,            // "/me"
  // memberId・token は出さない（不変条件 #11）
}));
```

- 出力は `status` / `code` / `path` のみ。memberId / 認証 token / 個人情報は出さない（不変条件 #11）。
- 既存 Sentry 経路がある場合はそれに合わせ、無い場合は構造化 `console.error`。技術文字列はユーザー画面に露出しない。

#### T03: 診断スクリプト `scripts/diagnose-profile-session.sh`（read-only・冪等）

```bash
#!/usr/bin/env bash
# read-only・冪等。副作用なし。secret 実値は出さない（存在有無のみ）。
set -euo pipefail
# 1. staging /me を https 直で叩き status を確認（未認証なら 401 期待＝疎通確認）
# 2. env/secret parity 確認（AUTH_SECRET 等の存在有無のみ・実値は出力しない）
# 3. staging deploy 版数を bash scripts/cf.sh 経由で確認（旧 bundle 残存 = H1 切り分け）
```

- `bash scripts/cf.sh` ラッパー経由のみ（直 `wrangler` 禁止）。既存 `diagnose-auth-secret-parity.sh` / `smoke-staging-me.sh` と同系の命名・read-only 規約に揃える。
- 再実行で同一出力（冪等）・副作用なし。secret 実値・token を出力しない。

### 使用例

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/app/(member)/profile/page.spec.tsx" \
  "apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts" \
  apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts \
  apps/web/src/components/member/__tests__/SectionError.spec.tsx
bash scripts/diagnose-profile-session.sh   # read-only 診断
```

### 診断スクリプト I/O

| 項目 | 内容 |
| --- | --- |
| exit code | `0=診断完了`（疎通・parity・版数を出力）。`2=ラッパー/認証エラー`（`cf.sh` 失敗等） |
| 出力 | stdout に `/me` status・env/secret parity（存在有無）・deploy 版数。secret 実値・memberId は出力しない |
| 副作用 | なし（read-only）。D1 書込・deploy・secret 変更は行わない |
| 冪等 | 同一 input → 同一出力。再実行で状態変化なし |

### エラーハンドリング

- `/me` 401 → 従来どおり `/login?redirect=/profile` redirect（観測対象外・回帰なし）。
- `/me` 410 → 安全文言 + `data-cause="session-410"` + server ログ `code=MEMBER_SESSION_410`。
- `/me` 5xx → 安全文言 + `retryHref="/profile"` + `data-cause="session-5xx"` + server ログ `code=MEMBER_SESSION_5xx`。
- transport 失敗 → 安全文言 + `data-cause="session-failed"` + server ログ `code=MEMBER_SESSION_FAILED`。
- いずれも生 message（`fetchAuthed failed: <status>`）をユーザーに露出しない。

### エッジケース

- status が 3 桁で取れない transport 失敗は `MEMBER_SESSION_FAILED`（`STATUS_FROM_MESSAGE` 不一致）として `data-cause="session-failed"`。
- 5xx は 500/502/503/504 を 5xx 族として同一 `data-cause="session-5xx"` に写像する。
- 診断スクリプトは cookie 未指定なら未認証直叩きの 401 を「疎通あり」として扱い、`PROFILE_SESSION_COOKIE` / `PROFILE_SESSION_COOKIE_FILE` 指定時は認証付き `/me` status を確認する（status の有無が切り分け基準）。
- 管理者アカウントが member identity/status を持たない場合（orphan）は 401/500 経路になり得るため、Phase 11 MT-C の D1 read-only で確認する。

### 設定項目と定数一覧

| 識別子 | 値 / 役割 |
| --- | --- |
| `MEMBER_SESSION_410` | `/me` 410（is_deleted）を区別分岐へ写す safe fetch code |
| `MEMBER_SESSION_5xx` | `/me` 5xx 族を区別分岐へ写す safe fetch code |
| `MEMBER_SESSION_FAILED` | transport 失敗（status 不在）を区別分岐へ写す safe fetch code |
| `MEMBER_SESSION_404` | `/me` 404 を再ログイン CTA へ写す既存 code（回帰なし） |
| `data-cause` | `/profile` エラーバナーの原因コード可視化属性（`session-410`/`session-5xx`/`session-failed`/`session-404`） |
| `STATUS_FROM_MESSAGE` | `/\bfailed:?\b.*\b(\d{3})\b/`（message から status を抽出。不一致は `_FAILED`） |

### テスト構成

| 領域 | ファイル | 観点 |
| --- | --- | --- |
| Profile UI | `apps/web/app/(member)/profile/page.spec.tsx` | 410/5xx/FAILED 区別表示 + `data-cause`、401 redirect 回帰、404 再ログイン CTA 回帰、生 error 非露出 |
| Profile error mapping | `apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts` | `MEMBER_SESSION_*` → 表示・`data-cause` の境界値と安全文言 |
| safe-fetch ログ | `apps/web/src/lib/server-fetch/safe-fetch.spec.ts` | `status`/`code`/`path` 構造化ログ、memberId 非露出、code 生成（410/5xx/FAILED） |
| SectionError | `apps/web/src/components/member/__tests__/SectionError.spec.tsx` | `data-cause` 属性描画、HEX 直書きなし、既存 props 後方互換 |

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  "apps/web/app/(member)/profile/page.spec.tsx" \
  "apps/web/app/(member)/profile/_lib/__tests__/session-error-display.spec.ts" \
  apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts \
  apps/web/src/components/member/__tests__/SectionError.spec.tsx
git diff --name-only dev...HEAD -- apps/api   # apps/api 非接触（空出力期待・AC-6）
bash scripts/diagnose-profile-session.sh       # read-only 診断（user-gated）
```

### 既知制限

- `/me` のレスポンス shape・path・status 体系・D1 schema・Google Form 仕様・`apps/api/src/**` は一切変更しない（AC-6 / apps/api 非接触）。
- 本タスクは**観測性向上のみ**。真因確定後の本格修正（410 復帰 / 5xx 根治 / transport 運用是正 / 管理者 `/profile` 専用 UX）は Phase 12 unassigned-task-detection で current 未タスクとして formalize する（CONST_007 例外①・先送りでなく仕様分岐の合意待ち）。
- staging 実機調査・診断スクリプト実行・D1 read-only・commit・PR は user-gated（implemented_local_evidence_captured 段階では未実施）。

---

## 視覚証跡

VISUAL_ON_EXECUTION。T01 のエラーバナー区別表示は、現象 screenshot を**ユーザー提供**（staging `/profile`「時間をおいて再読み込み」バナー）で受領済み。診断後の static UI contract screenshot（410/5xx/FAILED 区別バナー）は実装時に取得する計画。staging 認証 runtime screenshot は認証必須で user-gated。一次証跡は jsdom render（`page.spec.tsx` / `SectionError.spec.tsx`）と診断後 static UI contract screenshot。

| 証跡 | パス | 状況 |
| --- | --- | --- |
| 現象 screenshot（ユーザー提供） | （ユーザー提供画像・文中参照） | user-provided（受領済み） |
| jsdom render（profile） | `apps/web/app/(member)/profile/page.spec.tsx` | PASS |
| jsdom render（SectionError） | `apps/web/src/components/member/__tests__/SectionError.spec.tsx` | PASS |
| static UI contract screenshot | `outputs/phase-11/screenshots/profile-session-disambiguation-static-contract.png` | present |
| static page screenshot | `outputs/phase-11/screenshots/profile-session-disambiguation-static-page.png` | present |
| staging runtime screenshot | `outputs/phase-11/screenshots/profile-session-disambiguation-staging.png` | user-gated（認証必須） |

## 完了条件

- [x] Part 1（中学生レベル・例え話・なぜ→何を・専門用語を避けた説明）を本文 3 行以上で記述
- [x] Part 2（`/me` status×error code 対応表 / 区別分岐の TS 型・関数 / safe-fetch ログ / 診断スクリプト I/O / 設定値）を背景・要約・実装ステップ・検証コマンド・既知制限つきで記述
- [x] `## 視覚証跡` で現象 screenshot（ユーザー提供）と診断後 capture 計画（pending / user-gated）を明記
- [x] 識別子（`MEMBER_SESSION_410`/`_5xx`/`_FAILED`/`data-cause`/`safeServerFetch`/`SectionError`）を anchor と一致

## 成果物

- `outputs/phase-12/implementation-guide.md`（本ファイル）

## 参照資料

- `_shared-context.md` §2（H1-H6）/ §3（D1/D2/D3）/ §5（inventory）
- `outputs/phase-3/phase-3.md`（修正方針）
- `outputs/phase-8/phase-8.md`（`mapProfileSessionErrorToDisplay` 純関数化）
- `apps/web/app/(member)/profile/page.tsx` / `apps/web/src/lib/server-fetch/safe-fetch.ts` / `apps/web/src/components/member/SectionError.tsx`
