# UT-25-DERIV-02 lessons learned: sheets-auth alert classification & dedup

date: 2026-05-22
workflow: docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/

---

## 1. alert-relay isolateId 遅延生成 (Workers validation error 10021)

### 課題
alert-relay Worker の constructor 段階で `crypto.randomUUID()` 等を用いて
`isolateId` を生成しようとすると Cloudflare Workers runtime が validation
error 10021 を返し、`wrangler deploy` 後の初回 fetch で全 request が 500 化した。

### 原因
Workers runtime では module-top-level / class constructor の同期実行コンテキストで
`crypto.*` を含む一部 web platform API を呼ぶと validation 違反になる。
isolateId のような per-isolate identifier は **request handler 内に入ってから**
初めて取得可能、という制約が非自明だった。

### 対処
commit `9eb505825 fix(alert-relay): defer isolateId generation to avoid Workers
validation error 10021` で、`isolateId` の生成を fetch handler 内の lazy 初期化に
変更（`let isolateId: string | undefined` を module スコープに持ち、初回 fetch で
generate）。これで constructor 段階の validation を回避しつつ、isolate 寿命の間は
同一 id を保てるという両立を達成。

### 将来適用すべき判断ルール
- Workers の module top-level / class constructor では **side-effecting web API
  (`crypto.*` / `fetch` / `Date.now` を含むランダム生成)** を呼ばない。
- per-isolate な identifier は `let x: T | undefined` + 初回 fetch lazy init で扱う。
- `wrangler deploy` 直後は staging endpoint へ 1 件 curl smoke を流して 10021 系
  validation error を fail-fast で検出する step を runbook に必ず入れる。

---

## 2. 401 vs 403 切り分け設計（SHEETS_AUTH_OTHER の false-positive 抑止）

### 課題
Sheets API auth 失敗を一律 `SHEETS_AUTH_FAILURE` として alert 化すると、
Google 側の transient 5xx や rate-limit 由来の 403 まで SA key 失効と誤認し、
on-call 通知の S/N 比が悪化する設計になりかけた。

### 原因
当初 design では `SheetsFetchError` を catch して即 alert payload を組み立てる
fall-through ロジックだったため、`status` 軸の分類が抜けていた。
401（auth invalid）/ 403（permission or quota）/ 5xx（upstream transient）を
同列に扱うと、SA key 失効監視としての precision が破綻する。

### 対処
`SheetsFetchError.status` を見て:
- `401` → `SHEETS_AUTH_INVALID`（SA key 失効候補・即 alert）
- `403` → `SHEETS_AUTH_FORBIDDEN`（permission / quota / scope）
- それ以外（5xx 等）→ `SHEETS_AUTH_OTHER`（false-positive 抑止軸として明示）

の 3 分類に切り、`isAuthFailure: boolean` flag で alert-relay へ渡すか否かを
gating する。`SHEETS_AUTH_OTHER` は **alert を出さず構造化 log のみ** に流す。

### 将来適用すべき判断ルール
- 外部 API auth 監視を作るときは「alert を出す軸」と「出さないが log を残す軸」を
  必ず 2 系統設計する。1 軸設計は必ず false-positive 過多に倒れる。
- 分類 enum は status code 直値ではなくドメイン語彙（`*_INVALID` / `*_FORBIDDEN`
  / `*_OTHER`）で命名し、HTTP status の意味解釈をコード上で 1 箇所に閉じる。

---

## 3. structured log emission の eslint `no-console` 抑止

### 課題
`logSheetsAuthFailure` 内で `console.error(JSON.stringify({...}))` を出力する
設計にしたところ、`no-console` lint で fail。`logger` ラッパー経由に逃がそうと
すると Workers logs / Tail Worker query との結線が崩れた。

### 原因
Cloudflare Workers では `console.*` 出力が **Tail Worker / wrangler tail / Logs
Engine の正規入力** であり、独自 logger 抽象を挟むと Tail query の structured
field 抽出が壊れる。eslint rule は SPA / Node サーバを想定したもので
Workers runtime の log 慣行とは前提が違う。

### 対処
`logSheetsAuthFailure` の `console.error` 行直上に
`// eslint-disable-next-line no-console -- Workers logs / Tail Worker query channel`
を置き、**「Workers における正規 log 経路としての console.* 利用」** を
コメントで正当化。lint 全体 disable ではなくピンポイント disable に留める。

### 将来適用すべき判断ルール
- Workers package で `console.*` を意図的に使う場合は、disable コメントに
  「Tail Worker / Logs Engine channel」と明記し、レビュー時に意図が読める形にする。
- logger 抽象を Workers に導入する前に、Tail query の structured field
  抽出が維持されるかを必ず確認する（壊れるなら抽象を入れない）。

---

## 4. sheets-auth dedup 10 分窓「3 件目以降 suppress」の是正

### 課題
初期 dedup 仕様で「10 分窓内の同種 alert を suppress」とした結果、
2 件目までは通知、3 件目以降は完全に消える挙動になっていた。
SA key 失効のように継続発生する事象では、復旧確認の信号まで失われた。

### 原因
dedup window を「全件 drop」として実装し、window 終了時の summary emit を
設計に組み込まなかった。「suppress = silent」ではなく
「suppress = aggregate then emit at window close」が正しい設計。

### 対処
2026-05-23 review で dedup 仕様を是正し、`LOGS/_legacy.md` に経緯を記録。
window 終了時に suppressed 件数を summary として 1 件 emit する形に変更。

### 将来適用すべき判断ルール
- alert dedup は「drop」ではなく「aggregate + window-close summary」を default に。
- dedup window 設計時は必ず「window 内で N 件発生 → 通知は何件か」の
  3 ケース（1 件 / 境界 / 大量）を仕様レビューで検算する。

---

## 5. cross-workflow rollback-runbook 逆参照

### 課題
本 workflow の rollback 手順は、別 workflow
`ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md`
で定義済みの secret rotate 手順を再利用する。同じ手順を本 workflow に複写すると
2 箇所メンテになり drift する。

### 原因
secret rotation は production-deploy workflow が「正本」を持ち、本 workflow
（monitoring 派生）はその consumer にすぎない、という責務分離を runbook 構造に
反映する必要があった。

### 対処
本 workflow の rollback 記述は「rotate 手順本体は
`ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md`
を参照」と逆参照リンクのみを置き、本 workflow 固有の前後処理（alert mute /
unmute, dedup state reset）のみをローカルに記述する。

### 将来適用すべき判断ルール
- 同じ運用手順を複数 workflow に複写しない。「正本 workflow」を 1 つ決め、
  consumer 側は逆参照リンクのみを置く。
- 逆参照リンクは relative path で書き、phase-12 監査時の path traversal
  evidence guard で resolve 可能性を検証する。

---

## 関連ファイル

- `references/workflow-ut-25-deriv-02-sa-key-expiry-monitoring-artifact-inventory.md`
- `LOGS/_legacy.md`（dedup 是正経緯）
- `docs/30-workflows/ut-25-deriv-02-sa-key-expiry-monitoring/outputs/phase-12/system-spec-update-summary.md`
- `docs/30-workflows/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md`（cross-workflow 正本）
