# Phase 11: 手動テスト計画 + 証跡（staging 実機ログ確認）

## NON_VISUAL 宣言

| 項目 | 値 |
|------|------|
| タスク種別 | **NON_VISUAL** |
| 非視覚的理由 | 変更は fetch/transport 層のコードと構造化ログのみで、UI 表現（文言・色・レイアウト・DOM 構造）を変更しない。`/profile` のユーザー向け表示は既存 `session-error-display.ts`（dev 取込済）のまま不変であり、本タスクが追加するのは「ログに出る transport 診断メタ」と「fail-closed の throw 経路」だけである |
| 代替証跡 | focused tests（T1〜T5）+ staging 実機ログ（`wrangler tail` の `server_fetch_failed` 観測）。スクリーンショットは取得しない |
| workflow_state | `implemented_local_evidence_captured`（local 実装・focused vitest 完了。staging deploy・wrangler tail は user-gated） |

> 本タスクは UI 表現を変えないため Phase 11 のスクリーンショットは作成しない（screenshots/ は空のまま保持）。証跡の主ソースは (1) focused tests の名前と件数（T1〜T5）と (2) staging 実機の `server_fetch_failed` ログ（`{transportKind, baseHost, status}`）である。詳細メタは `manual-test-result.md`、NON_VISUAL 宣言の再掲は `ui-sanity-visual-review.md` に置く。

## 実施情報

| 項目 | 値 |
|------|------|
| 実施 wave | `implemented_local_evidence_captured`（実コード・focused tests 完了。staging deploy・wrangler tail・commit・PR は user-gated） |
| ブランチ | `fix/profile-session-staging-localhost-endpoint`（起点 `origin/dev` d0dd40069） |
| 対象環境 | staging（`ubm-hyogo-web-staging.daishimanju.workers.dev`） |
| 現象 URL | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile` |
| Cloudflare CLI | `bash scripts/cf.sh` 経由のみ（`wrangler` 直叩き禁止・SSOT §6 不変条件 8） |

## 証跡の主ソース（NON_VISUAL）

### 自動テスト（focused tests T1〜T5・件数）

実機ログと並ぶ一次証跡。local 実装後に RED → GREEN で取得した。期待値は phase-4 §6 の表（T1-1〜T5-5）がグラウンドトゥルース。

| ID | テストファイル | 観点 | 主なケース | 実行結果 |
|----|----------------|------|------------|----------|
| T1 | `apps/web/src/lib/fetch/transport.spec.ts` | fail-closed + describeTransport | T1-1（R-7 throw）/ T1-2/3（local 許可・後方互換）/ T1-4（binding 優先）/ T1-5/6（descriptor host 抽出） | PASS |
| T2 | `apps/web/src/lib/fetch/__tests__/transport-select.spec.ts` | service-binding 優先で localhost 不到達（回帰） | T2-1/T2-2（binding 優先・fetch 未呼出） | PASS |
| T3 | `apps/web/src/lib/fetch/authed.spec.ts` | 診断メタ付与 + ApiTransportError | T3-1/2（FetchAuthedError に transportKind/baseHost）/ T3-3（fetch throw → ApiTransportError）/ T3-4/5（回帰）/ T3-6（fail-closed 配線） | PASS |
| T4 | `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | `server_fetch_failed` ログに transportKind/baseHost | T4-1/2（メタ出力）/ T4-3（メタ無し回帰）/ T4-4（漏洩検査） | PASS |
| T5 | `apps/web/src/lib/__tests__/env.spec.ts` | `getEnvironmentResolution` | T5-1〜3（enum explicit=true）/ T5-4/5（未注入/typo → `{local,false}`） | PASS |

### staging 実機ログ（`server_fetch_failed` 観測）— DoD の一部

「localhost を叩いていないこと」を実機ログで証明し、真因（410/5xx/transport）を確定するための最重要証跡。SSOT §9 DoD の `（staging 実機 / user-gated 実行）` 項に対応する。

## staging 実機ログ確認手順（user-gated 実行・AC-1/AC-2 の実機証明）

各手順は「コマンド / 前提 / 期待結果 / 実結果」形式。staging 実機結果はすべて pending（user-gated）。

### MT-A: staging へ deploy（実装後）

| 項目 | 内容 |
|------|------|
| 前提 | T01〜T04 実装済み・focused tests green・`apps/api` diff 空（AC-9）。Cloudflare 認証は `bash scripts/cf.sh` 経由（直 `wrangler` 禁止） |
| コマンド | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` |
| 期待結果 | staging web worker が `transportKind`/`baseHost` ログ拡張を含む新 bundle で稼働する。deploy 版数（version id）を控える |
| 実結果 | **pending（user-gated）** |

### MT-B: `wrangler tail` で `server_fetch_failed` を観測

| 項目 | 内容 |
|------|------|
| 前提 | MT-A 完了。staging `/profile` にログイン可能なアカウントがある（万壽本大嗣・管理者） |
| コマンド | `bash scripts/cf.sh tail --config apps/web/wrangler.toml --env staging`（ログを stream）。別ブラウザで staging `/profile` をリロードして `/me` 失敗を発火させる |
| 期待結果 | tail に `server_fetch_failed` イベントが現れ、`{ code, path, status, transportKind, baseHost }` を含む。`code` は `MEMBER_SESSION_410` / `MEMBER_SESSION_5xx`（5xx 族）/ `MEMBER_SESSION_FAILED` のいずれか |
| 実結果 | **pending（user-gated）** |

### MT-C: baseHost が localhost でないことを確認（C4 否定の実機証明）

| 項目 | 内容 |
|------|------|
| 前提 | MT-B で `server_fetch_failed` を捕捉済み |
| 確認 | ログの `transportKind` が `service-binding`、`baseHost` が `service-binding.local`（= staging では service-binding 解決でローカルフォールバックに到達しない）であることを確認する。**`baseHost` が `localhost:8787` や `127.0.0.1` でないこと**を実機ログで証明する（ユーザー疑問「localhost を見に行っていないか」への実機回答 = No） |
| 期待結果 | `transportKind=service-binding` / `baseHost=service-binding.local`。localhost / 127.0.0.1 / 8787 / 8888 は一切現れない |
| 実結果 | **pending（user-gated）** |

### MT-D: 真因ステータス（410 / 5xx / transport）の確定

| 項目 | 内容 |
|------|------|
| 前提 | MT-B / MT-C 完了 |
| 確認 | `server_fetch_failed.status` と `code` を突き合わせ、真因を C1（410）/ C2（5xx）/ C3（transport 失敗 = status null + `MEMBER_SESSION_FAILED`）のいずれか 1 つに収束させる |
| 補助 | `bash scripts/diagnose-profile-session.sh` を実行し、staging `/me` 疎通・deploy 版数・transport 確認手順 echo（T04 拡張）と突き合わせる（read-only・冪等） |
| 期待結果 | 真因が C1 / C2 / C3 のいずれか 1 つに確定する。結論を本ファイルへ追記し、本格修正（未タスク化済み）の方針決定に引き継ぐ |
| 実結果 | **pending（user-gated）** |

### 真因収束 判定フロー（C1 / C2 / C3）

```
MT-B: server_fetch_failed.status / code は？
├─ status=410, code=MEMBER_SESSION_410 ──→ ✓ C1 確定（410 / is_deleted=1 の疑い）
├─ status=5xx, code=MEMBER_SESSION_5xx ──→ ✓ C2 確定（resolver / D1 / handler 例外）
└─ status=null, code=MEMBER_SESSION_FAILED ──→ MT-C で transportKind / baseHost を確認
      ├─ transportKind=service-binding & baseHost=service-binding.local ──→ ✓ C3 確定（service-binding 未応答 / 旧 bundle）
      └─ baseHost が localhost ──→ （構造的に不可能・fail-closed で throw 済みのはず。出たら設定破損として MT-A 版数を再確認）
```

> C4（localhost 参照）は fail-closed（R-7 throw）により構造的に不可能化される。万一 `baseHost` に localhost が現れた場合は deploy 版数（MT-A）と `ENVIRONMENT` 注入を疑う。

## 完了条件

- [x] 冒頭に NON_VISUAL 宣言（タスク種別 / 非視覚的理由 / 代替証跡）を明記した。
- [x] 証跡の主ソース（focused tests T1〜T5 の名前と件数 + staging 実機ログ）を記録した。
- [x] staging 実機ログ確認手順 MT-A〜MT-D を「コマンド / 前提 / 期待結果 / 実結果(pending)」形式で記録した。
- [x] `baseHost=service-binding.local`（localhost でない）と真因ステータス確定（410/5xx/transport）の手順を DoD の一部として記載した。
- [x] スクリーンショットを作らない理由（NON_VISUAL）を明記し、screenshots/ を空のまま保持した。

## 成果物
- `outputs/phase-11/phase-11.md`（本ファイル）
- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-11/ui-sanity-visual-review.md`

## 参照資料
- `../../_shared-context.md` §3（真因）/ §9（DoD の staging 実機ログ確認項）
- `../phase-1/phase-1.md`（C1-C5 仮説 / AC-1〜9）
- `../phase-4/phase-4.md` §6（テスト期待値 T1-1〜T5-5）
- `../phase-5/task-04-*.md`（diagnose script の transport echo 拡張）

## 統合テスト連携
MT-A〜MT-D の真因収束結論（C1/C2/C3 のいずれか）と focused tests（T1〜T5）の green が AC-1/AC-2 の証跡正本。本格修正（未タスク化）の方針決定へ Phase 12 で引き継ぐ。staging deploy / wrangler tail / diagnose 実行はすべて user-gated。
