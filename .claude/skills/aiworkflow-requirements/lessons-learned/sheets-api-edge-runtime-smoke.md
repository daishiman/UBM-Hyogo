---
timestamp: 2026-04-29T00:00:00Z
branch: feat/wt-5
author: claude-code
type: lessons-learned
task: docs/30-workflows/completed-tasks/ut-26-sheets-api-e2e-smoke-test/
skill: aiworkflow-requirements
related-files:
  - apps/api/src/routes/admin/smoke-sheets.ts
  - apps/api/src/routes/admin/smoke-sheets.test.ts
  - apps/api/src/jobs/sheets-fetcher.ts
  - apps/api/src/index.ts
---

# UT-26: Sheets API E2E smoke test (`/admin/smoke/sheets`) 実装での苦戦点

`GoogleSheetsFetcher` を Cloudflare Workers Edge Runtime 上で実機動作させる E2E smoke route を追加する過程で、fetch mock テストでは検出不能な 5 系統の落とし穴に遭遇した。
本ファイルは UT-26 で確定した「smoke test で初めて検出される問題」と「事前に切り分けるための運用ルール」を記録する。

---

## L-UT26-001: fetch mock テストと実 API の差分（Edge Runtime Web Crypto / RSA-SHA256）

### 状況

`GoogleSheetsFetcher` は OAuth 2.0 Service Account JWT assertion で access token を取得する。
ローカルの Vitest では `globalThis.fetch` を mock し、JWT 署名は生成パスを通すだけで検証していなかったため、
RSA-SHA256（`SubtleCrypto.sign('RSASSA-PKCS1-v1_5', ...)`）が Workers の Web Crypto 実装で本当に動くかは smoke test で初めて分かる。

### Why（なぜ smoke test が必要か）

- Workers Edge Runtime の Web Crypto は Node の `crypto` と API 形状が一致しない（`importKey` のキーフォーマット / `pkcs8` PEM 改行コード扱い / `SubtleCrypto` 戻り値の `ArrayBuffer` 型）
- fetch mock では `Request`/`Response` の Edge 実装差（headers の `set-cookie` 重複扱い、`URL` parser の strictness）を踏まない
- `forms.responses.list` 系と異なり Sheets API v4 は `spreadsheets.values.get` で別の権限スコープ（`https://www.googleapis.com/auth/spreadsheets.readonly`）が要る → mock では検出されない 403 が実機で起きる

### How to apply

- smoke route は `/admin/smoke/sheets` として **dev / staging のみ** に mount し、`apps/api/src/index.ts` で `c.env.ENVIRONMENT === 'production'` の場合は 404 を返す
- smoke は `fetchRange()` を 2 回連続呼び、`getTokenFetchCount()` の差分が `tokenFetchesDuringSmoke=1` であることをレスポンス body に載せて検証する（mock では再現困難なキャッシュ動作を実機で確認）
- fetch mock テスト（`smoke-sheets.test.ts`）と smoke route 実機実行は **両方を経路として保持**する（mock は CI gate、smoke は手動実行）

---

## L-UT26-002: Service Account 権限付与漏れ → 403 PERMISSION_DENIED の 4 軸切り分け

### 状況

smoke を初回実行すると `403 PERMISSION_DENIED` が頻発する。原因は最低 4 系統あり、エラーメッセージだけでは特定できない。

### Why

Google API の 403 は以下のいずれでも同じ shape で返るため、エラー本文に `caller does not have permission` としか書かれない:

1. Service Account メールが対象 Spreadsheet に共有されていない（最頻出）
2. PEM private key の改行コードが `\\n` のまま literal 化されており JWT 署名が壊れている（401 や `invalid_grant` で出ることもあるが 403 でも観測される）
3. Google Cloud Project で Sheets API が有効化されていない
4. `formId`（Forms 側 ID）と `spreadsheetId`（Sheets 側 ID）を取り違えている → 「権限なし」と区別が付かない

### How to apply

- smoke のレスポンス body に `serviceAccountEmail`（ハッシュ化）と `spreadsheetIdHash` を含め、**どの SA がどの sheet に対して 403 だったか**を最低限可視化する（実値は出さない）
- 切り分け手順を runbook として固定化する:
  1. Sheets UI から Spreadsheet の共有設定を開き、`SA email` が `Viewer` 以上で共有されているか確認
  2. `GOOGLE_SHEETS_SA_JSON.private_key` が改行を含むか（`echo "$GOOGLE_SHEETS_SA_JSON" | jq -r .private_key | head -1` で `-----BEGIN PRIVATE KEY-----` が独立行に出るか）
  3. GCP Console → APIs & Services → Library で「Google Sheets API」が ENABLED か
  4. Forms「回答」タブの「スプレッドシートにリンク」から開いた Sheets URL の `/d/<id>/edit` の `<id>` が `SHEETS_SPREADSHEET_ID` と一致するか
- 上記 4 項目を smoke route 失敗時の手順として `docs/30-workflows/completed-tasks/ut-26-sheets-api-e2e-smoke-test/index.md` に固定する

---

## L-UT26-003: formId と spreadsheetId の混同

### 状況

UBM-Hyogo は `GOOGLE_FORM_ID`（03b response sync 用 / Forms API）と `SHEETS_SPREADSHEET_ID`（UT-26 smoke / Sheets API）の 2 つの ID を運用するが、Forms「回答」タブの連携 Sheets を作るまで両者は別の値であることに気付きにくい。

### Why

- `formId` = `forms.googleapis.com/v1/forms/{formId}` で使う Forms 自体の ID
- `spreadsheetId` = `sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}` で使う、Forms の回答を流し込む別 Sheets ファイルの ID
- Forms 単体では `spreadsheetId` は存在しない。「回答」タブで「スプレッドシートにリンク」を初めて押した瞬間に新規 Sheets が生成され、そのときに初めて `spreadsheetId` が確定する

### How to apply

- env 名は `GOOGLE_FORM_ID` と `SHEETS_SPREADSHEET_ID` で意図的に prefix を分ける（`GOOGLE_*` ≠ `SHEETS_*`）
- `references/environment-variables.md` に「`GOOGLE_FORM_ID` は Forms API 用、`SHEETS_SPREADSHEET_ID` は Forms「回答」タブの連携 Sheets から取得した別の ID」と明記
- smoke route のエラー body には `expectedIdShape: 'spreadsheetId (44 chars)'` を含めて誤入力を即座に検出可能にする

---

## L-UT26-004: `wrangler dev --local` の外部 fetch 制限

### 状況

`wrangler dev --local` モードは miniflare 経由で local isolate を起動し、外部 HTTP fetch は許可されているが、
TLS / DNS / OAuth サーバーへの到達性が remote モードと微妙に異なり、Service Account JWT の `aud=https://oauth2.googleapis.com/token` 取得が intermittent に失敗するケースがある。

### Why

- miniflare の Web Crypto は Node の `crypto` を polyfill しており、Workers 実機の Web Crypto と完全には一致しない
- local モードでは Cloudflare の egress proxy を経由しないため、企業 NAT 環境では Google OAuth サーバーへの connection が ISP DNS の影響を受ける
- miniflare の `fetch` は `cf` プロパティが空であり、production と異なる経路で TLS handshake する

### How to apply

- UT-26 smoke の **動作確認は `wrangler dev --remote` または staging deploy で実行**することを runbook に固定
- ローカルの fetch mock テスト（`smoke-sheets.test.ts`）と remote/staging smoke を **役割分離**する:
  - mock テスト = `tokenFetchesDuringSmoke=1` の契約検証 + auth header / range query の構築検証
  - 実 smoke = RSA-SHA256 / Sheets API 実権限 / TLS 経路の検証
- `wrangler dev --local` での 401 / network error は smoke 失敗とは見做さず、remote モードで再実行する

---

## L-UT26-005: アクセストークン TTL 1 時間と Workers isolate 再起動でのキャッシュ消失

### 状況

`GoogleSheetsFetcher` は OAuth access token を module-scope の Map にキャッシュし、`getTokenFetchCount()` で fetch 回数を返す。
smoke は「2 回連続 `fetchRange()` で token fetch が 1 回だけ」を成功条件とするが、
Workers isolate が再起動すると module-scope state は消えるため、smoke の 2 回目 fetchRange が cold isolate にディスパッチされた瞬間に `tokenFetchesDuringSmoke=2` になる。

### Why

- Workers isolate は heat（直近 active）/ cold（再起動）で振る舞いが異なり、cold start 時は in-memory キャッシュが空
- access token の TTL は通常 3600 秒（1 時間）。これより長い間 isolate が生きている保証はない
- production sync ジョブ（cron `*/15`）でも token cache は isolate 単位なので、worst case で毎 sync ごとに新規 token fetch が走る前提で設計する必要がある

### How to apply

- smoke は **同一 isolate で連続 2 回**叩くことを意図しているため、間隔を短く（数百ms 以内）し isolate eviction を踏まないよう request を構築する
- production の sync job ではトークン取得失敗（401 / `invalid_grant`）時に **1 回だけ retry + 再 token fetch** するロジックを `sheets-fetcher.ts` に置き、isolate cold start を許容する
- `tokenFetchesDuringSmoke` が 2 になっても **smoke 自体は失敗にしない**（warn 扱い）。失敗条件は「2 回連続 fetchRange が成功すること」のみとし、cache 動作はベストエフォートとして観測する設計に倒す
- 1 時間以上稼働する isolate に依存した最適化（例: token を D1 に persist して isolate 跨ぎで共有）は MVP では行わない。token 取得は毎 isolate 1 回で十分安いため

---

## 横断的な再発防止チェックリスト

新しい Google API 連携を Workers 上に追加するときに毎回確認する項目:

- [ ] fetch mock テストとは別に、dev/staging 限定の smoke route を `/admin/smoke/<service>` として用意したか
- [ ] production への mount を `c.env.ENVIRONMENT === 'production'` で 404 ガードしたか
- [ ] smoke route の認可は `SMOKE_ADMIN_TOKEN` のように **production には絶対配置しない** secret に分離したか
- [ ] Service Account 権限付与の 4 軸（共有 / private_key 改行 / API 有効化 / 正しい ID）を runbook 化したか
- [ ] formId と spreadsheetId のように **別 ID なのに似た名前**になる env は prefix で意図的に区別したか
- [ ] smoke 実行は `wrangler dev --remote` または staging deploy で行うことを明記したか
- [ ] access token cache を `getTokenFetchCount()` 系の診断 API で可観測化したか
- [ ] cold isolate でキャッシュが消える前提で retry を実装したか
