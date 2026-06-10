# Phase 4: I/O 契約 / テスト設計

`[実装区分: 実装仕様書（診断・観測性向上のコード変更を含む）]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| taskType | implementation（VISUAL） |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

Phase 3 で PASS した D1（区別分岐）/ D2（構造化ログ）/ D3（診断スクリプト）を、`/me` HTTP status × web error code の対応表・診断スクリプトの I/O 契約・区別分岐とログのテスト期待値（RED 観点）へ落とし込み、Phase 5 の task-01..03 がそのまま実装・検証できる粒度の契約を固定する。

## 実行タスク

### 4.1 D1: `/me` HTTP status × web error code 対応表（契約の核心）

`/profile` Server Component は `safeServerFetch(() => fetchAuthed<MeSessionResponse>("/me"), { codePrefix: "MEMBER_SESSION", rethrowOn: [AuthRequiredError] })` の `meResult` を起点とする（`page.tsx:41-44`）。`fetchAuthed`（401→`AuthRequiredError` / 非2xx→`FetchAuthedError(status,text)`）→ `safe-fetch.ts:34-37` の `normalizeError` で error code が決まる。

| `/me` HTTP status | web error code | web 側の帰結（契約） | 表示 / 区別 | 対応 H |
| --- | --- | --- | --- | --- |
| 401 | （`AuthRequiredError` rethrow） | `rethrowOn` で rethrow → catch → `redirect("/login?redirect=/profile")` | バナー無し・redirect（**不変・回帰なし**。`page.tsx:46-47`） | H2 |
| 404 | `MEMBER_SESSION_404` | `meResult.ok=false` / `error.code==="MEMBER_SESSION_404"` | 「アカウント情報を確認できませんでした。再ログインしてください。」+ `actionHref="/login?redirect=/profile"` / `actionLabel="再ログイン"`（**不変**。`page.tsx:53-63`） | （除外） |
| 410 | `MEMBER_SESSION_410` | デフォルト分岐を細分化し 410 として識別 | 「時間をおいて再読み込みしてください。」+ `retryHref="/profile"`、かつ `data-error-code="MEMBER_SESSION_410"` で開発者に可視化 | H3 |
| 5xx（500/502/503/...） | `MEMBER_SESSION_<5xx>`（5xx 族） | デフォルト分岐を細分化し 5xx 族として識別 | 同上文言 + `data-error-code="MEMBER_SESSION_<status>"` | H4 |
| transport 失敗（message に 3桁が無い） | `MEMBER_SESSION_FAILED` | デフォルト分岐を細分化し FAILED として識別 | 同上文言 + `data-error-code="MEMBER_SESSION_FAILED"` | H5 |
| 200 | （成功） | `meResult.ok=true` | 既存の本文描画（不変。`page.tsx:77-`） | — |

> **契約原則**: ユーザー向け文言は 410/5xx/FAILED で同一（「時間をおいて再読み込みしてください。」= 安全側維持）だが、**開発者向けには `data-error-code` 属性で 410/5xx/FAILED を区別**して root cause を隠蔽しない（AC-3）。401→redirect・404→再ログイン CTA は一切変更しない（回帰なし）。

### 4.2 D1: error code 分類の判定契約

`page.tsx:66-74` のデフォルト分岐内で、`meResult.error.code` を以下のように分類する（具体実装は Phase 5）。

| 入力 `error.code` | 分類 | `data-error-code` 値 |
| --- | --- | --- |
| `MEMBER_SESSION_404` | （上位分岐で再ログイン CTA・本分岐に来ない） | — |
| `MEMBER_SESSION_410` | DELETED 系（H3） | `MEMBER_SESSION_410` |
| `MEMBER_SESSION_500` / `_502` / `_503` 等（5xx 族） | サーバ例外系（H4） | `MEMBER_SESSION_<status>`（受領値そのまま） |
| `MEMBER_SESSION_FAILED` | transport 失敗系（H5） | `MEMBER_SESSION_FAILED` |
| その他（`MEMBER_SESSION_UNKNOWN` 等） | 予期しない系 | 受領 code そのまま |

> `data-error-code` は受領した `error.code` を素通しで載せる（マッピングは表示文言ではなく分類ログ用）。個人情報は含めない（#11）。

### 4.3 D2: 構造化ログの I/O 契約

`safe-fetch.ts` の `safeServerFetch` で `meResult.ok=false`（= catch 経路 / `normalizeError`）になったとき、`status`/`code`/`path` を構造化ログ出力する。

| 区分 | 内容 |
| --- | --- |
| 発火条件 | `safeServerFetch` の catch 経路（rethrow されない非2xx / transport 失敗）。`codePrefix` が `MEMBER_SESSION` のときに限定するか全 prefix で出すかは実装方針として Phase 5 で確定（最小は失敗時に常時構造化出力） |
| 出力 payload | `{ code: string, status: number | null, path?: string }`（`status` は `statusFromError` の結果。null は transport 失敗を意味する） |
| 出力経路 | `console.error` の構造化（JSON）or 既存 Sentry 経路。新規ログ基盤は作らない |
| 禁止 | memberId / email / cookie / secret / 生のレスポンス本文を出さない（#11）。技術文字列をユーザー画面に露出しない |
| 副作用 | ログ出力のみ。`SafeResult` の戻り値・code 生成ロジックは不変 |

### 4.4 D3: 診断スクリプトの I/O 契約

`scripts/diagnose-profile-session.sh`（read-only・冪等）。

| 区分 | 内容 |
| --- | --- |
| 入力 | env（staging URL / `scripts/cf.sh` 経由の Cloudflare 認証）。secret は `op` 参照経由でラップ・実値を引数で受けない |
| 出力1（status） | staging `/me` を https 直で叩いた HTTP status（401/404/410/5xx の別）を stdout に出力 |
| 出力2（parity） | env/secret parity 確認（`AUTH_SECRET` 等の **有無のみ**。実値は出力しない） |
| 出力3（版数） | staging deploy 版数（`bash scripts/cf.sh` 経由で取得） |
| 冪等性 | 複数回実行で副作用なし（GET / 読み取りのみ。書込・deploy なし） |
| 禁止 | `wrangler` 直叩き / secret 実値出力 / `.env` の cat |

### 4.5 safe-fetch の `statusFromError` 正規表現の挙動（契約として明記）

`safe-fetch.ts:11-19` の `STATUS_FROM_MESSAGE=/\bfailed:?\b.*\b(\d{3})\b/`。`statusFromError` はまず `err.status`（number）を見て、無ければ message を正規表現照合する。

| 入力（error） | `statusFromError` 結果 | `normalizeError` の code |
| --- | --- | --- |
| `FetchAuthedError`（`status=410`） | `410`（`err.status` 優先） | `MEMBER_SESSION_410` |
| message `"fetchAuthed failed: 503"`（status 無し） | `503`（正規表現 `(\d{3})` 抽出） | `MEMBER_SESSION_503` |
| **transport 失敗（message に 3桁が無い。例 `"fetch failed"` / `"... unresolved ..."`）** | **`null`**（match せず） | **`MEMBER_SESSION_FAILED`** |
| message `"... 12345 ..."`（4桁以上で 3桁境界なし） | パターン依存。`\bfailed\b` 前置が無ければ `null` | `MEMBER_SESSION_FAILED` |

> **契約上の含意**: transport 層の失敗（service-binding 未応答 / 非local throw `transport.ts:40-42` / network）は message に 3桁 HTTP status を含まないため `statusFromError`→`null`→`MEMBER_SESSION_FAILED` に正規化される。これが H5 を `_410`/`_5xx` と区別できる根拠であり、D1 の `data-error-code` で `MEMBER_SESSION_FAILED` を独立識別する契約の前提となる。

### 4.6 テスト期待値（RED 観点・テストケース表）

| TC-ID | 対象 | 入力 | 期待（RED→GREEN） | AC |
| --- | --- | --- | --- | --- |
| TC-01 | `page.tsx`（D1） | `/me` 410 → `MEMBER_SESSION_410` | `SectionError` 表示 + `data-error-code="MEMBER_SESSION_410"`。文言「時間をおいて再読み込みしてください。」 | AC-3 |
| TC-02 | `page.tsx`（D1） | `/me` 503 → `MEMBER_SESSION_503` | `SectionError` 表示 + `data-error-code="MEMBER_SESSION_503"` | AC-3 |
| TC-03 | `page.tsx`（D1） | transport 失敗 → `MEMBER_SESSION_FAILED` | `SectionError` 表示 + `data-error-code="MEMBER_SESSION_FAILED"` | AC-3 |
| TC-04 | `page.tsx`（回帰） | `/me` 404 → `MEMBER_SESSION_404` | 「再ログイン」CTA（`actionHref="/login?redirect=/profile"`）。`data-error-code` で再読み込み分岐に落ちない | AC-3 |
| TC-05 | `page.tsx`（回帰） | `/me` 401 → `AuthRequiredError` | `redirect("/login?redirect=/profile")`（バナー描画なし） | AC-3 |
| TC-06 | `page.tsx`（回帰） | `/me` 200 | 既存本文描画（`data-testid="profile-authenticated-root"`） | AC-6 |
| TC-07 | `safe-fetch.ts`（D2） | 失敗 thunk（`FetchAuthedError(410)`） | 構造化ログに `{ code:"MEMBER_SESSION_410", status:410 }` 出力。memberId 非含有 | AC-4 |
| TC-08 | `safe-fetch.ts`（D2） | transport 失敗 thunk | 構造化ログに `{ code:"MEMBER_SESSION_FAILED", status:null }` 出力 | AC-4 |
| TC-09 | `safe-fetch.ts`（D2 回帰） | 成功 thunk | ログ出力なし。`{ ok:true, data }` を返す | AC-4 |
| TC-10 | `safe-fetch.ts`（statusFromError） | message `"fetch failed"`（3桁なし） | code = `MEMBER_SESSION_FAILED`（`null` 正規化） | AC-3 |

> D3（診断スクリプト）は read-only シェルのため vitest 対象外。Phase 11 の手動実行で status/parity/版数の出力健全性を確認する。

## 完了条件

- [x] `/me` status × web error code 対応表（401→redirect / 404→再ログイン / 410→`_410` / 5xx→`_<5xx>` / transport→`_FAILED`）を契約化
- [x] D1 の `data-error-code` 分類判定契約を確定
- [x] D2 構造化ログの I/O（payload / 経路 / 禁止事項）を確定
- [x] D3 診断スクリプトの I/O（入力 env / 出力 status・parity・版数・read-only）を確定
- [x] `statusFromError` 正規表現の挙動（3桁なし→null→`_FAILED`）を契約として明記
- [x] テストケース表（TC-01..10・RED 観点）を確定

## 成果物

- `outputs/phase-4/phase-4.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | セッション / `/me` 解決 / session 境界の正本 |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | authGateState / session 境界 |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` レスポンス項目（不変であることの確認） |

- `outputs/phase-1/phase-1.md`（AC・真因仮説）
- `outputs/phase-3/phase-3.md`（設計レビュー・Phase 11 特化宣言）
- `apps/web/src/lib/server-fetch/safe-fetch.ts`（`STATUS_FROM_MESSAGE` / `normalizeError`）

## 統合テスト連携

本契約を Phase 5 の task-01（D1）/ task-02（D2）/ task-03（D3）の `## テスト方針` 表（TC-ID）へ展開し、Phase 6（fail path / 回帰 guard）・Phase 7（カバレッジ）で再利用する。Phase 11 は本契約の `/me` status 区別を staging 実機で実証する。
