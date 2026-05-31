# Lessons Learned: issue-991-admin-fetch-error-typed-class (2026-05)

`docs/30-workflows/completed-tasks/issue-991-admin-fetch-error-typed-class/` の Phase 12 close-out で確定した learnings。
親 `admin-audit-prototype-alignment` FU-AAUDIT-001（Issue #991 CLOSED 維持）。

## L-I991-001 Error を typed class 化しつつ message format を byte-identical で維持する

**Rule**: `Error` を `AdminFetchError extends Error` に置き換えるとき、`super()` に渡す message 文字列は既存実装と **一字一句同じ** にする。具体的には `admin api ${path} failed: ${status}` + 非空 body 時のみ ` body=${body.slice(0, 256)}`。構造化フィールド（`status` / `path` / `responseBodySnippet`）は message とは別に追加し、message format には影響させない。

**Why**: 既存テスト（`server-fetch.binding.spec.ts:101` ほか）と consumer `safe-fetch.ts` の regex `STATUS_FROM_MESSAGE` が message 文字列を逐語前提にしている。message を 1 byte でも変えると既存回帰が壊れる。中身を仕切るが「お弁当箱のフタのラベルはそのまま」が原則。

**How to apply**: `Error` → typed class 化の Phase 2 で、まず現状 message を生成する全コードパスを grep し、各ケース（body あり/なし/256 超/空/読取失敗）の出力を表に固定する。新 class の `super()` 出力が同表と byte-identical になることを Phase 6 のテストで assert する。message 上限（256）は定数化せず既存コードと同値を維持する。

## L-I991-002 共通正規化層は下位ドメインを import せず duck typing で status を抽出する

**Rule**: public/admin 共通の `apps/web/src/lib/server-fetch/safe-fetch.ts` から status を取り出すとき、`instanceof AdminFetchError` や `import { AdminFetchError }` を入れない。`statusFromError(err)` helper で `(err as { status?: unknown }).status` が `Number.isInteger` を満たせば採用、満たさなければ既存 regex message parse に fallback する duck typing にする。

**Why**: 共通層が admin ドメインを import すると、public 系 fetch にも admin の依存が漏れ責務境界が崩れる。元 follow-up 仕様は `instanceof AdminFetchError` を提案していたが、これは境界違反。「共通層は下位ドメインを import しない」を優先する。

**How to apply**: 共通層で domain 固有 error の構造化フィールドを使いたくなったら、import せず property の存在 + 型ガード（`typeof === 'number' && Number.isInteger`）で読む。既存 message parse は fallback として残し、structured 値を優先順位 1 位にする。`lint-boundaries` / import grep で共通層 → 下位ドメインの import が増えていないか確認する。

## L-I991-003 PII redaction は snippet 化の前段で適用し、message と snippet を独立スライスする

**Rule**: response body を保持する前に email / phone 形状を redaction（`[masked-email]` / `[masked-phone]`）してから、message suffix 用に 256 文字、`responseBodySnippet` 用に 500 文字を **独立に** slice する。256 と 500 は片方の slice 結果を再 slice せず、redaction 済み body から個別に切り出す。

**Why**: structured metadata（500 文字）の方が message（256 文字）より長く露出するため、redaction を slice 後に掛けると切れ目で PII が残るリスクがある。redaction を最前段に置き、上限は独立適用することで両出力とも PII free を保証する。`responseBody=""` は falsy のため suffix 抑止だが `responseBodySnippet=""`（null と区別）として保持する。

**How to apply**: error body を 2 つ以上の長さで露出する設計では、(1) redaction → (2) 各上限で独立 slice の順を固定する。空文字 / null / 上限超のエッジを Phase 6 テストで個別 case 化する。

## L-I991-004 cross-module 環境を想定した type guard は instanceof + duck typing の二段に倒す

**Rule**: `isAdminFetchError(error): error is AdminFetchError` は `error instanceof AdminFetchError` を第一条件にしつつ、OR で `error instanceof Error && name === "AdminFetchError" && typeof path === "string" && typeof status === "number"` の duck typing fallback を持たせる。

**Why**: Cloudflare Workers の cross-module / bundle 分割境界では prototype chain が切れて `instanceof` が false になりうる。name + 必須 field の構造判定を fallback に持つことで、bundle 境界をまたいでも判定が壊れない。

**How to apply**: Workers ランタイムで custom Error class の判定 helper を作るときは `instanceof` 単独に頼らず、`name` literal + 識別 field の `typeof` チェックを OR で添える。

## L-I991-005 CLOSED follow-up Issue と現状コードの drift は「Issue 記述 vs 現状コード」差分表で吸収する

**Rule**: CLOSED な follow-up Issue（#991）の記述が現状コードと乖離している場合（message format / 二重 `res.text()` read 回避策など）、index.md 冒頭に「Issue 記述 vs 現状コード」差分表を置き、**現状コードを正本** として AC を再定義する。Issue は reopen せず `Refs #991` のみとする。

**Why**: Issue 起票時点のコードと実装着手時点のコードがずれているのは常態。Issue literal をそのまま AC にすると現状コードを退行させる。現状コードを SSOT に固定し、Issue 記述との差分を明示することで「なぜ Issue 通りでないか」を追跡可能にする。

**How to apply**: closed-issue / 古い follow-up 仕様から着手するときは Phase 1 で対象コードを実測し、Issue 記述と差分があれば index 冒頭に差分表を置く。現状コードを正本として AC を書き直し、Phase 12 compliance で Issue は CLOSED 維持・`Refs` のみと明記する。

## L-I991-006 byte-identical 維持 AC は「既存出力ケース × 新出力」突合マトリクスで担保する

**Rule**: 既存テストが文字列を逐語 assert している箇所を変更する場合、「既存 message の各ケース（body あり / なし / 256 超 / 空 / 読取失敗）× 新実装の出力」を Phase 2 設計時に表で突合し、各セルを Phase 6 の focused test の case にマッピングする。

**Why**: 後方互換を「壊さないつもり」で進めると境界ケース（空 body の suffix 抑止、256 超の slice 位置）で drift する。AC レベルでケース表を固定すると、message format を維持する/変える判断を設計時に確定でき回帰を機械的に検出できる。

**How to apply**: 互換維持タスクでは Phase 2 §design に出力ケース表を作り、各行に対応する spec の test 名を併記する。Phase 6 で表の全 case が test 化されているか grep で確認する。

## Anti-pattern

- typed error 化のついでに message 文言を「より良く」整形してしまい、message を逐語 assert する既存テスト / regex consumer を壊す
- 共通正規化層に `instanceof AdminFetchError` / admin import を入れて public 系にも admin 依存を漏らす
- PII redaction を slice 後に掛け、上限の切れ目に PII を残す / 256 を再 slice して 500 を作る
- Workers で custom Error 判定を `instanceof` 単独に頼り、bundle 境界で false になって握り潰す
- CLOSED Issue の literal を現状コード検証なしに AC へ写し、現状の回避策（二重 read 回避等）を退行させる
