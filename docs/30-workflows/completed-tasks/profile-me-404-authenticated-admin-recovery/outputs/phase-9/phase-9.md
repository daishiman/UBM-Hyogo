# Phase 9: 品質保証

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-me-404-authenticated-admin-recovery` |
| Phase | 9 / 13 |
| taskType | implementation |
| implementation_mode | `edit`（既存 error-handler / safe-fetch / diagnose script 編集 + api-cd.yml / runtime-admin-api.sh 新規） |
| visualEvidence | VISUAL_ON_EXECUTION（NON_VISUAL・UI 描画不変） |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

T01〜T04（notFound 構造化診断ログ / apps/api 自動 CD + 認証 `/me` smoke gate / web route-404 ログ / 診断スクリプト route 差分 + parity）と Phase 8 のリファクタリング（R-1 notFound payload helper / R-2 smoke probe 関数 / R-3 composite 非採用）が、AC-2〜AC-9 を満たすことを保証するため、**検証コマンド・期待 exit code・grep ゲート**を層ごとに表で固定する。本 WF は「削除でなく新規追加中心」の観測性付与であり（FB-UI-02-1）、応答契約・UI 文言・D1・Form の不変は **`/me` route 差分なし grep と session-error-display 差分なし grep で機械検証**する。本サイクルは `implemented_local_runtime_pending`（ローカル実装済み）のため、local 品質ゲートとして扱い、focused Vitest と shell syntax は本 wave で実測済み。

## 実行タスク

### 9.1 品質保証 層（検証コマンド一覧・SSOT §8 準拠）

| 層 | コマンド | 期待 exit | AC 紐付け | 対象タスク |
| --- | --- | --- | --- | --- |
| L-1 typecheck | `mise exec -- pnpm typecheck` | 0 | AC-8 | T01 / T03（R-1 helper 型整合含む） |
| L-2 lint | `mise exec -- pnpm lint` | 0 | AC-7 / AC-8 | T01 / T03 |
| L-3 focused vitest（api notFound） | `cd apps/api && mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts apps/api/src/middleware/error-handler.spec.ts && cd ../..` | 0 | AC-2 / AC-6 / AC-9 | T01（NF-1〜NF-5・R-1） |
| L-4 focused vitest（web route-404） | `cd apps/web && mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts 'apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts' 'apps/web/app/(member)/profile/page.spec.tsx' && cd ../..` | 0 | AC-4 / AC-6 | T03（SF-1〜SF-5 / PG 系） |
| L-5 shell 構文（diagnose） | `bash -n scripts/diagnose-profile-session.sh` | 0 | AC-5 | T04（DG-1） |
| L-6 shell 構文（api smoke runner） | `bash -n scripts/smoke/runtime-admin-api.sh` | 0 | AC-3 | T02（CD-3・R-2） |
| L-7 yaml 構文（api-cd.yml） | `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/api-cd.yml'))"`（actionlint 導入済なら `mise exec -- pnpm exec actionlint .github/workflows/api-cd.yml`） | 0 | AC-3 | T02（CD-1・R-3） |
| L-8 redaction grep（ci-evidence + spec 全体） | §9.3 G-redact | 0（leak 0 件） | AC-9 | 横断 |
| L-9 `/me` route 差分なし grep | §9.3 G-1 | 0（diff 空） | AC-6 | T01 / T03 |
| L-10 session-error-display 差分なし grep | §9.3 G-2 | 0（diff 空） | AC-6 | T03 |
| L-11 wrangler 直叩きなし grep | §9.3 G-3 | 0（ヒット 0 件） | AC-7 | T02 / T04 |
| L-12 `process.env` 直接参照なし grep | §9.3 G-4 | 0（増加 0 件） | AC-7 | T03 |
| L-13 復旧検証（diagnose 実走） | `bash scripts/diagnose-profile-session.sh` | 0 | AC-1 / AC-5 | Phase 11（user-gated・deploy 後） |

> L-1〜L-12 は local 品質ゲート、L-13 は staging deploy 後・user-gated（Phase 11 の RT 系）。本 wave では focused Vitest と shell syntax を実行済み。

### 9.2 focused vitest 対象 spec と AC 対応

`apps/web` / `apps/api` package 内から `--root=../..` 形式で実行する（include glob が monorepo root 基準のため直 path 指定では "No test files found" になる既知の罠・SSOT §8 注記）。

| spec | 検証対象 | AC | タスク |
| --- | --- | --- | --- |
| `apps/api/src/middleware/error-handler.spec.ts` | T01 notFound 構造化ログ（`reason:"route_not_matched"` / `method` / `path` / `hasAuthorization` bool / `hasSessionCookie` bool・cookie/Bearer 生値非出力・応答 404/`UBM-1404` 不変） | AC-2 / AC-6 / AC-9 | T01 |
| `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | T03 route-404 明示記録（`routeNotFound:true` を 404 のみ付与 / 401・410・FAILED で非付与 / `transportKind`・`baseHost`・`status` 既存フィールド不変 / `logPath` 無し no-op） | AC-4 / AC-6 | T03 |
| `apps/web/app/(member)/profile/page.spec.tsx` | `/profile` 分岐・文言不変の回帰（401 redirect / 404 CTA「再ログイン」/ 410・FAILED バナー文言不変） | AC-6 | T03 回帰 |

> 実 spec パス（`server-fetch/__tests__/` 配下か直下か、`error-handler.spec.ts` の新規要否）は実装着手時に grep で再確認し、不在なら `*.spec.ts` で新規作成する（SSOT §8 注記・命名ドリフト防止・`*.test.*` 禁止＝不変条件 #8）。T02（yaml）/ T04（shell）は vitest 対象外で L-5〜L-7 が担保する。

### 9.3 grep ゲート（不変条件の機械検証）

| ID | 検査（AC） | コマンド | 期待 |
| --- | --- | --- | --- |
| G-1 | **`/me` route 差分なし**（AC-6 の中核） | `git diff origin/dev...HEAD --name-only -- 'apps/api/src/routes/me'` | **空出力**（`/me` route の path/shape/status 体系不変） |
| G-2 | **session-error-display 差分なし**（AC-6・UI 文言不変） | `git diff origin/dev...HEAD -- 'apps/web/app/(member)/profile/_lib/session-error-display.ts'` および `git diff origin/dev...HEAD -- 'apps/web/app/(member)/profile/page.tsx'` | **両方空出力**（文言・分岐・redirect/notFound 挙動不変） |
| G-3 | **wrangler 直叩きなし**（AC-7） | `grep -nE '(^\|[^.])wrangler (deploy\|publish)' .github/workflows/api-cd.yml scripts/smoke/runtime-admin-api.sh scripts/diagnose-profile-session.sh` | **ヒット 0 件**（deploy/version 確認は `bash scripts/cf.sh` 経由のみ） |
| G-4 | **`process.env` 直接参照なし**（AC-7） | `git diff origin/dev...HEAD -- 'apps/web/src/lib/server-fetch/safe-fetch.ts' \| grep -n 'process\.env'` | **増加 0 件**（env 参照は `apps/web/src/lib/env.ts` アクセサ経由のみ） |
| G-redact | **redaction grep（secret/cookie/JWT 非出力）**（AC-9） | §9.4 の 2 段（ci-evidence 系 + spec/ci-evidence 全体）を実行 | **leak 0 件**（`__Secure-authjs.session-token` の値・`Bearer <token>`・`Cookie:` 行・memberId UUID が出ない） |

> G-1 / G-2 は SSOT §6 AC-6（`/me` path/shape/status 体系・`/profile` UI 文言/分岐を変更しない）の機械検証。本 wave で当該 diff が出た場合は直ちに revert（AC-6 NO-GO・スコープ外は `unassigned-task/` が受け皿）。

### 9.4 redaction grep（secret/cookie/JWT/memberId 非出力の負方向検証・AC-9）

ci-evidence（smoke gate 出力）と本 WF の全 spec ドキュメントから、secret・cookie・JWT・memberId（UUID）が一切出ないことを 2 段で検証する。

```bash
# 段1: smoke gate の ci-evidence（実装/CI サイクルで生成される証跡）に漏洩が無い
#   api-cd.yml の `redaction grep gate` step と同型パターン
leak_files="$(grep -rEl 'Cookie:|authorization:|Bearer [A-Za-z0-9_-]{20,}|__Secure-authjs\.session-token=[A-Za-z0-9._~+/=-]+' ci-evidence/ 2>/dev/null || true)"
[ -z "$leak_files" ] && echo "no leak (ci-evidence)" || { echo "LEAK: $leak_files"; exit 1; }

# 段2: 本 WF の全 spec + ci-evidence から JWT 生文字列・cookie 値・memberId UUID が出ない
#   （SSOT §9 の JWT デコードは boolean/フィールド名のみ記載・生値非記載が正本）
grep -rEi 'Bearer [A-Za-z0-9_-]{20,}|__Secure-authjs\.session-token=[A-Za-z0-9._~+/=-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' \
  docs/30-workflows/profile-me-404-authenticated-admin-recovery/ ci-evidence/ 2>/dev/null \
  | grep -v 'ce86abba' \
  && echo "LEAK DETECTED" || echo "no leak (spec + ci-evidence)"
```

> SSOT §9 が記録する memberId `ce86abba-…` は**確定事実の診断記録**（cookie 生値・JWT 文字列・secret は非記載）。段2 の grep は `ce86abba` を既知の許容記録として除外し、それ以外の UUID / cookie 値 / Bearer token / session-token 値が spec・ci-evidence に混入していないことを確認する。新規に追加する spec / ログ payload / smoke evidence は cookie・JWT・Bearer・memberId の**生値を一切含めない**（T01 は boolean 化・T02 は status のみ・T04 は status + ラベルのみ）。

### 9.5 「削除でなく新規追加中心」の PASS 基準（FB-UI-02-1）

本 WF は復旧（recovery）であり、既存挙動の削除・置換ではなく**観測性フィールド・CD・probe の新規追加が中心**であることを PASS 基準とする。

| ID | PASS 基準 | 検証 |
| --- | --- | --- |
| A-1 | T01 は `notFoundHandler` の応答（body/status/headers）を**削除・変更せず**、診断 `context`（payload key）を**追加**する | NF-4 回帰 green + G-1 |
| A-2 | T03 は既存 `server_fetch_failed` payload の `code`/`path`/`status`/`transportKind`/`baseHost` を**削除せず**、`routeNotFound` を 404 時のみ**追加**する | SF-4 / SF-2（非 404 で `routeNotFound` キー無し）+ G-2 |
| A-3 | T02 は `web-cd.yml` を**非接触**のまま `api-cd.yml` / `runtime-admin-api.sh` を**新規追加**する（既存 CD を削除・改変しない） | `git diff origin/dev...HEAD --name-only -- '.github/workflows/web-cd.yml'` が空 |
| A-4 | T04 は `diagnose-profile-session.sh` の既存出力（`web_api_me_status` / `api_me_status` / `profile_data_cause` / `candidate`）を**削除せず**、`api_me_healthz_status` / `api_route_diff` / `parity_hint` を**追加**する | DG-2（既存 + 新規 key 併存）+ DG-5（冪等・副作用なし） |
| A-5 | Phase 8 リファクタリングは内部構造のみ整え、外部契約（payload key / probe 判定 / step 構造）を**削除・変更しない** | §8.2 の再実行ゲート green（NF/SF byte 一致・`bash -n` / yaml parse 不変） |

> 「削除でなく新規追加中心」が崩れる（既存 payload key の削除・既存挙動の置換）場合は AC-6 / FB-UI-02-1 違反として Phase 10 で blocker 判定。本 WF の唯一の許容「変更」は観測フィールドの**追加**であり、応答契約・UI・D1・Form は不変（G-1 / G-2 で担保）。

### 9.6 line budget / link / mirror parity 判定方針

| 項目 | 判定方針 |
| --- | --- |
| line budget | 本 WF の Phase ファイルは設計密度に応じた行数とし、**1 ファイル単一責務の見出し（# Phase N / ## メタ情報 / ## 目的 / ## 実行タスク / ## 統合テスト連携 / ## 参照資料 / ## 成果物 / ## 完了条件）を全充足**することを line budget の充足基準とする。冗長な再掲（SSOT の F/S/AC 全文転記）は避け、SSOT へリンク参照する（重複は単一情報源原則違反）。phase12-compliance（canonical 9 headings）/ validate-phase-output の警告ゼロ化を実装サイクルの仕様書ゲート（L-0 系・SSOT 準拠）で確認する |
| link | spec 内の相互参照（`_shared-context.md` / `index.md` / `outputs/phase-{1..7}/*` / `outputs/phase-5/task-0N-*.md` / `.github/workflows/web-cd.yml`）が**実在パス**を指すこと。参照資料節のパスを `test -e` で実在確認（dead link 0 件）。`apps/` 配下参照（error-handler.ts / safe-fetch.ts / diagnose-profile-session.sh）も実パス（`apps/web/app/` であり `src/app/` ではない命名）を grep で確認 |
| mirror parity（.claude ↔ .agents） | 本 WF は `docs/30-workflows/` 配下の spec 作成のみで `.claude/skills/` / `.agents/skills/` を**編集しない**ため、mirror parity は「**本サイクルで .claude / .agents に diff を出さない**」を PASS 基準とする（`git diff origin/dev...HEAD --name-only -- '.claude/' '.agents/'` が空）。skill 反映が必要になった場合（Phase 12 の skill feedback）は別サイクルで `.claude/skills/` を正本に編集し `.agents/skills/` を symlink/同一 inode で parity 維持する（既存運用・本 Phase スコープ外） |

### 9.7 自動修復方針（失敗時・最大 3 回）

- L-1 typecheck fail → unused import / null 許容 / 型注釈漏れ / export-import 不整合（R-1 helper 戻り値型の不整合含む）を最小差分で修正し再実行。
- L-2 lint fail → `mise exec -- pnpm lint --fix` を先に試し、残違反のみ手修正。
- L-3 / L-4 vitest fail → Phase 8 の縮退方針（R-1 helper / R-2 probe 関数を見送り DoD green の T01/T02 母体実装へ戻す）に従い切り分け、実装側を修正（テスト期待値は AC を正本とし安易に緩めない）。
- L-5 / L-6 `bash -n` fail → 構文位置を特定し最小修正（probe 関数 R-2 の `case` 分岐・関数定義の閉じ漏れ）。
- L-7 yaml fail → `python3 yaml.safe_load` のエラー行を特定し indent/quote を最小修正。
- G-1 / G-2（`/me` route / session-error-display diff）違反 → 直ちに該当変更を revert（AC-6 NO-GO・apps/api `/me` 契約 / UI 文言は不変）。
- G-redact 違反 → 該当ログ payload / smoke evidence / spec から生値を除去し boolean / status / ラベルへ戻す（AC-9 NO-GO）。
- 最大 3 回まで自動修復を試み、修復差分はタスク単位でコミットする（commit は user-gated・CONST_002）。

## 統合テスト連携

L-1〜L-12 全 PASS と G-1〜G-4 / G-redact 違反 0（特に G-1 `/me` route diff 空・G-2 session-error-display diff 空・G-redact leak 0）、および §9.5 の「削除でなく新規追加中心」A-1〜A-5 充足を Phase 10 の AC-2〜AC-9 充足判定へ引き継ぐ。L-13（復旧検証 = diagnose 実走 + 認証 `/me` 200 確認 + staging `/profile` 正常描画 screenshot）は Phase 11 の RT 系（user-gated・deploy 後）として実施する。Phase 8 のリファクタリング（R-1/R-2/R-3）の不変担保（§8.2 再実行ゲート）は本 Phase の L-3/L-4/L-6/L-7 で同時に確認する。

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` shape・status 体系（G-1 / AC-6 検査基準） |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401/410 境界・fail-closed（NF / SF / PG の期待根拠） |
| MVP 認証方針 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | session 未解決→401→redirect（PG-1 の正本） |

- `_shared-context.md` §6（AC-1〜AC-10・本 Phase の検証対象）/ §7（不変条件）/ §8（検証コマンド・inventory）/ §9（JWT/cookie 生値非記載の正本）
- `outputs/phase-6/phase-6.md`（テストケース NF / SF / MT / PG / CD / DG）
- `outputs/phase-7/phase-7.md`（変更ブロック限定カバレッジ）
- `outputs/phase-8/phase-8.md`（リファクタリング R-1/R-2/R-3・rollback 単位）
- `.github/workflows/web-cd.yml`（A-3 の非接触対象・redaction grep gate 同型）
- `CLAUDE.md`（`bash scripts/cf.sh` 経由 deploy・新規 test `*.spec.ts` 限定・coverage-guard sync-merge スキップ）

## 成果物

- `outputs/phase-9/phase-9.md`（本ファイル）

## 完了条件

- [x] 検証コマンド一覧（L-1 typecheck / L-2 lint / L-3 focused vitest〔error-handler.spec.ts〕/ L-4〔safe-fetch.spec.ts〕/ L-5 `bash -n` diagnose / L-6 `bash -n` runtime-admin-api.sh / L-7 api-cd.yml yaml 構文）を期待 exit と AC 紐付けで表化
- [x] redaction grep（ci-evidence + 全 spec から `__Secure-authjs.session-token` / Bearer / cookie 値 / memberId が出ないこと）を 2 段で固定（AC-9）
- [x] apps/api `/me` route 差分なし grep（G-1）と session-error-display 差分なし grep（G-2）を明示（AC-6）
- [x] FB-UI-02-1 準拠で「削除でなく新規追加中心」を PASS 基準（A-1〜A-5）として固定
- [x] line budget / link（実在パス）/ mirror parity（.claude ↔ .agents diff 空）の判定方針を明示
- [x] 自動修復方針（最大 3 回・テスト期待値は緩めない・AC-6/AC-9 違反は即 revert）を明示
