# Phase 6: テスト拡充

`[実装区分: 実装仕様書（診断・観測性向上のコード変更を含む）]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| workflow_id | `profile-session-fetch-failure-investigation` |
| taskType | VISUAL |
| implementation_mode | `new` |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_evidence_captured` |

## 目的

T01（区別表示）/ T02（構造化ログ）の各観測性変更に対し、正常系だけでなく **fail path（410 / 5xx 族 / `MEMBER_SESSION_FAILED` / 404 / 401）と回帰 guard・構造化ログ出力**を網羅するテストケースを確定する。とくに本タスクの主問題（H6: 410/5xx/FAILED を一律集約して root cause を隠蔽）に対し、**各 status が `data-cause` で区別される**こと・**401 redirect と 404 再ログイン CTA が回帰しない**こと・**memberId がログに露出しない**ことを正本テストとする。各新規 test は `*.spec.{ts,tsx}` のみ。

## 実行タスク

### 6.1 T01: 写像純関数 `resolveProfileSessionCause` テスト

ファイル: `apps/web/src/lib/server-fetch/__tests__/profile-session-cause.spec.ts`（新規）

| ID | 入力 code | 期待 cause | 期待 detail | 検証観点 |
| --- | --- | --- | --- | --- |
| CC-1 | `MEMBER_SESSION_410` | `"deleted"` | アカウント利用不可文言（再読み込みを促さない） | H3 410 区別 |
| CC-2 | `MEMBER_SESSION_500` | `"server"` | サーバー混雑文言 | H4 5xx 下限 |
| CC-3 | `MEMBER_SESSION_503` | `"server"` | サーバー混雑文言 | H4 5xx 中域 |
| CC-4 | `MEMBER_SESSION_599` | `"server"` | サーバー混雑文言 | H4 5xx 上限（境界） |
| CC-5 | `MEMBER_SESSION_FAILED` | `"transport"` | 通信失敗文言 | H5 transport 区別 |
| CC-6 | `MEMBER_SESSION_UNKNOWN` | `"unknown"` | 既定の再読み込み文言 | 非 Error / 未知 |
| CC-7 | `MEMBER_SESSION_404` | `"unknown"` | 既定文言（404 はデフォルト分岐に来ない前提の防御） | negative guard |
| CC-8 | `MEMBER_SESSION_400` | `"unknown"` | 既定文言（4xx を 5xx と取り違えない） | branch 境界 |

### 6.2 T01: `/profile` ページの error code 区別分岐テスト

ファイル: `apps/web/app/(member)/profile/page.spec.tsx`（既存に追加。既存の `vi.hoisted` モック `FetchAuthedError(status, bodyText)` を踏襲）

| ID | `/me` 結果 | 期待描画 | 検証観点 |
| --- | --- | --- | --- |
| PF-1 | `FetchAuthedError(410, "deleted")` | `alert` に「セッション情報を取得できませんでした」+ 利用不可文言。root に `data-cause="deleted"`。生 `fetchAuthed failed: 410` が DOM に**現れない** | AC-3 / H3 |
| PF-2 | `FetchAuthedError(503, "down")` | `data-cause="server"`。サーバー混雑文言。技術文字列が**現れない** | AC-3 / H4 |
| PF-3 | `new Error("transport failed")`（status 無 → `_FAILED`） | `data-cause="transport"`。通信失敗文言。技術文字列が**現れない** | AC-3 / H5 |
| PF-4（回帰） | `FetchAuthedError(404, "missing")` | 「再ログインしてください。」+ `actionLabel="再ログイン"` CTA（href `/login?redirect=/profile`）。`data-cause` 属性が付かない | AC-3 404 回帰なし |
| PF-5（回帰） | `AuthRequiredError`（401） | `redirect("/login?redirect=/profile")` が呼ばれ `SectionError` を描画しない | AC-3 401 回帰なし |
| PF-6（回帰） | `/me` 200 → `/me/profile` 200 | `profile-authenticated-root` を描画し `SectionError` を描画しない | 正常系回帰なし |
| PF-7（回帰） | `/me` 200 → `/me/profile` `FetchAuthedError(503)` | 既存の「プロフィールを読み込めませんでした」分岐を維持（`MEMBER_FETCH` 系は T01 のスコープ外） | profile 失敗分岐の非干渉 |
| PF-8（回帰・shell guard） | `/me` `FetchAuthedError(503)` | `data-testid="member-header"` を mount しない（既存 shell 統合 guard 維持） | AC-C6 回帰なし |

> PF-1〜PF-3 が H6 是正の正本テスト（デフォルト一律集約 → status 別 `data-cause` 区別）。PF-4/PF-5 が「区別追加で 404/401 既存挙動を壊さない」回帰 guard。

### 6.3 T01: `SectionError` の `cause` prop レンダリングテスト

ファイル: `apps/web/src/components/member/__tests__/SectionError.spec.tsx`（新規）

| ID | props | 期待描画 | 検証観点 |
| --- | --- | --- | --- |
| SE-1 | `cause="server"` | root（`data-component="section-error"`）に `data-cause="server"` 属性を出力 | 原因コード可視化 |
| SE-2 | `cause` 未指定 | root に `data-cause` 属性が**出ない** | 既存呼び出し後方互換 |
| SE-3 | `cause="deleted"` | 可視テキスト（`textContent`）に `"deleted"` 等の cause 値を**含まない** | 技術文字列の非露出 |
| SE-4（回帰） | `actionHref` + `actionLabel`（cause 無し） | 従来どおり `data-role="action"` CTA を描画し `data-cause` は出ない | 既存 CTA 後方互換 |
| SE-5（回帰） | `retryHref` のみ | 従来どおり `data-role="retry"` を描画 | 既存 retry 後方互換 |

### 6.4 T02: 構造化ログ出力テスト

ファイル: `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts`（新規。`vi.spyOn(console, "error")` で payload をキャプチャ）

| ID | 入力（thunk reject） | opts | 期待 | 検証観点 |
| --- | --- | --- | --- | --- |
| LG-1 | `{ status: 410, message: "fetchAuthed failed: 410" }` | `codePrefix:"MEMBER_SESSION", path:"/me"` | payload = `{event:"server_fetch_failure", path:"/me", code:"MEMBER_SESSION_410", status:410}` | AC-4 / H3 |
| LG-2 | `{ status: 503, message: "down" }` | 同上 | `code:"MEMBER_SESSION_503", status:503` | AC-4 / H4 |
| LG-3 | `new Error("transport failed")`（status 無） | 同上 | `code:"MEMBER_SESSION_FAILED", status:null` | AC-4 / H5 |
| LG-4 | 非 Error（`"boom"`） | 同上 | `code:"MEMBER_SESSION_UNKNOWN", status:null` | unknown 経路 |
| LG-5（回帰） | `AuthRequiredError`（rethrowOn 該当） | `rethrowOn:[AuthRequiredError]` | throw され `console.error` が**呼ばれない** | 401 はログ非出力 |
| LG-6（回帰） | 成功（resolve） | 任意 | `console.error` が**呼ばれない** | 成功は非出力 |
| LG-7（不変条件 #11） | `{ status:410, message:"member m_secret leaked", memberId:"m_secret" }` | `path:"/me"` | payload 文字列に `"m_secret"` / `memberId` キーを**含まない** | memberId 非露出 |
| LG-8（後方互換） | `{ message:"fetchAuthed failed: 500" }` | `path` **未指定** | `path:"unknown"` | path 未指定の既存呼び出し |

### 6.5 fail path / 回帰 guard マトリクス（H 仮説対応）

| H 仮説 | status / code | T01 区別（`data-cause`） | T02 ログ（`status`/`code`） | 回帰 guard |
| --- | --- | --- | --- | --- |
| H3 410 | `MEMBER_SESSION_410` | PF-1 / CC-1 → `deleted` | LG-1 → `status:410` | — |
| H4 5xx | `MEMBER_SESSION_5\d\d` | PF-2 / CC-2〜4 → `server` | LG-2 → `status:5xx` | — |
| H5 transport | `MEMBER_SESSION_FAILED` | PF-3 / CC-5 → `transport` | LG-3 → `status:null` | — |
| 404（既存） | `MEMBER_SESSION_404` | PF-4 / CC-7 → 再ログイン CTA・cause 無 | （ログ対象だが分岐は CTA） | PF-4 |
| 401（既存） | `AuthRequiredError` | PF-5 → redirect・描画なし | LG-5 → ログ非出力 | PF-5 |
| 200（正常系） | — | PF-6 → 本体描画 | LG-6 → ログ非出力 | PF-6 |

### 6.6 補助コマンド（テスト実行）

| 対象 | コマンド |
| --- | --- |
| T01 純関数 | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run "src/lib/server-fetch/__tests__/profile-session-cause.spec.ts"` |
| T01 page | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run "app/(member)/profile/page.spec.tsx"` |
| T01 SectionError | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run "src/components/member/__tests__/SectionError.spec.tsx"` |
| T02 safe-fetch | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run "src/lib/server-fetch/__tests__/safe-fetch.spec.ts"` |

> T03 診断スクリプトは shell のため vitest 対象外。検証は `bash -n` / `--help` exit code（task-03 §5）で担保する。

## 完了条件

- [x] T01 純関数（CC-1〜CC-8）の 410/5xx 境界/FAILED/未知/negative の分岐を列挙
- [x] T01 page（PF-1〜PF-8）の status 別区別 + 401/404/200/shell 回帰 guard を列挙
- [x] T01 SectionError（SE-1〜SE-5）の `data-cause` 出力・後方互換を列挙
- [x] T02 ログ（LG-1〜LG-8）の status/code/path 出力・401 非出力・memberId 非露出・後方互換を列挙
- [x] H3/H4/H5/404/401/200 を fail path × 回帰 guard マトリクスで対応付け
- [x] 新規 test がすべて `*.spec.{ts,tsx}` 規則であることを確認
- [x] 各テストの実行補助コマンドを固定

## 成果物

- `outputs/phase-6/phase-6.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | `/me` 解決 / 401・410 境界（区別分岐・ログの根拠） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` レスポンス shape（PF-6 正常系の必須キー判定基準） |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | session 未解決→401→redirect の正本（PF-5） |

- `_shared-context.md`（SSOT §2 仮説 H3-H6 / §4 AC-3・AC-4）
- `outputs/phase-5/task-01-error-branch-disambiguation.md` / `task-02-structured-logging.md`

## 統合テスト連携

PF-1〜PF-3（区別分岐）/ LG-1〜LG-3（ログ）が H6 是正の正本テスト。Phase 7 で TS（cause 純関数）/ PF / SE / LG の変更ブロックに対する line/branch カバレッジ予定値（変更箇所 100%）を確定し、Phase 9 で typecheck/lint と併せ一括 PASS を確認する。
