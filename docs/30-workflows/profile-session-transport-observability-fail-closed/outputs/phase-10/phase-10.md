# Phase 10: 最終レビュー

## メタ情報
正本: `outputs/phase-10/phase-10.md` / 上位 SSOT: `../../_shared-context.md`

| 項目 | 値 |
|------|------|
| taskType | NON_VISUAL |
| visualEvidence | NON_VISUAL（UI 表現変更なし。証跡は focused tests + staging 実機ログ） |
| workflow_state | `implemented_local_evidence_captured`（local 実装・focused tests 完了。staging deploy・commit・PR は user-gated） |
| 想定 PR base | `dev` |

## 目的
Phase 1〜9 の設計・I/O 契約・テスト期待値が AC-1〜9（`outputs/phase-1/phase-1.md` §4）を漏れなく満たしているかを最終レビューし、blocker の有無と MINOR 追跡事項を確定する。本ワークフローは `implemented_local_evidence_captured` であり、local 実コード・focused tests・静的 gate は実施済み。staging 実機実行値だけを Phase 11 / Phase 13（user-gated）に委ねる。

## 1. AC 充足判定表（implemented_local_evidence_captured）

| ID | 受入条件（要約） | 充足を担保する設計／成果物 | 検証手段（実装時） | 判定 |
|----|------------------|---------------------------|--------------------|------|
| AC-1 | `/me` 失敗時 `server_fetch_failed` ログに `transportKind`（`service-binding`\|`http`）が含まれる | phase-2 §5・phase-4 §4 ログ出力キー契約。`transportFromError` で `error.transport` を読みログへ flat spread | T4 safe-fetch.spec（T4-1/T4-2） | local PASS |
| AC-2 | 同ログに `baseHost`（host のみ）が含まれる。localhost リテラルを新規焼き込みしない | phase-4 §1 `describeTransport` は `SERVICE_BINDING_ORIGIN` / `t.baseUrl` を `new URL().host` で抽出 | T4 + `verify-no-localhost-bake --src-only` | local PASS |
| AC-3 | ログに memberId / cookie / secret を出力しない（host とステータスのみ） | phase-4 §4 出力禁止キー（memberId/cookie/secret/token/authorization/body） | T4 漏洩検査（`JSON.stringify(calls)` に禁止語なし） | local PASS |
| AC-4 | `getEnvironmentResolution` が enum 明示時 `explicit=true`、未注入/不正時 `{local,false}` | phase-4 §2 入出力表 E-1〜E-5 | T5 env.spec | local PASS |
| AC-5 | `resolveApiFetch` は `environmentExplicit=false` × binding/baseUrl 無 のとき throw（fail-closed） | phase-4 §3.2 真理値表 R-7 | T1 transport.spec | local PASS |
| AC-6 | `API_SERVICE` 有のとき従来どおり service-binding 優先（localhost 不到達）= 回帰なし | phase-4 §3.2 R-1/R-2（binding 優先で fail-closed 不発） | T2 transport-select.spec 回帰 + T1 | local PASS |
| AC-7 | transport 接続失敗（fetch throw）時 `ApiTransportError`（診断メタ付）が投げられ safe-fetch が `MEMBER_SESSION_FAILED` に正規化 | phase-4 §5.2 `ApiTransportError` shape + safe-fetch 正規化 | T3 authed.spec + T4-2 | local PASS |
| AC-8 | 既存テスト（transport/transport-select/authed/safe-fetch/env）回帰ゼロ・既存シグネチャ後方互換 | phase-4 §3.1（明示 local のみ fallback）・§4 互換性（メタ無し error はキー非出力）・§5.1 後方互換 constructor | focused Vitest 5 files / 70 tests | local PASS |
| AC-9 | `apps/api` 非接触（diff 空）・`verify-no-localhost-bake --src-only` green | SSOT §6 不変条件 1（apps/api 非接触）・§8 検証コマンド | `git diff --stat -- apps/api`（空）+ gate | local PASS |

> staging deploy と `wrangler tail` による実機 `server_fetch_failed` 観測は user-gated。local で証明できるコード・テスト・静的 gate は本 wave で完了済み。

## 2. blocker 判定

**blocker なし。** 以下を根拠とする。

- 変更は fetch/transport 層の型・純関数・optional フィールド追加に閉じ、公開呼び出し元の既存シグネチャは後方互換（phase-3 §1 実現性 ◎）。
- 唯一の結合点（transport 解決 → 診断メタ → error → ログ）は phase-4 §4/§5 で I/O 契約として固定済み（phase-3 §4 で指示された drift 防止が完了）。
- `apps/api` 非接触で endpoint surface 不変（AC-9）。D1 直接アクセスなし（不変条件 #5）。
- 新規 localhost/8787/8888 リテラルを焼かない設計（phase-4 §1・gate で機械検知）。

## 3. MINOR 追跡事項（実装時に留意・blocker ではない）

| ID | 内容 | 追跡先 |
|----|------|--------|
| MINOR-1 | T2（transport-select.spec）は `resolveApiFetch` 系の新規ケースを T1 に集約し、当ファイルは既存挙動の回帰確認に留める（重複回避）。実装時に当ファイルへの追加要否を task-01 で判断する | phase-4 §6 T2 注記 |
| MINOR-2 | `getEnvironment` と `getEnvironmentResolution` の `environment` 同値性（後方互換）を保つため、重複ロジックの純関数寄せは Phase 8 のリファクタ範囲に留め、`getEnvironment` のシグネチャは変更しない | phase-2 §3 / phase-8 |
| MINOR-3 | T4 のログ漏洩検査（T4-4）は禁止語リスト（memberId/cookie/secret/token/authorization）を網羅する。新たな診断メタを将来追加する際は同検査を更新する | phase-4 §4 |
| MINOR-4 | 本格的な根本修正（410 復帰導線 / 5xx の apps/api 根治 / transport 運用是正）は真因確定後でないと方針を決められないため本サイクル外。Phase 12 で `deferred_pending_root_cause` として未タスク化し、既存 #1189-1192 と重複チェックする | phase-12 unassigned-task-detection |

## 統合テスト連携
AC-1〜9 の充足は Phase 4 で固定した I/O 契約・テスト期待値（T1-1〜T5-5）に紐づく。実機統合（staging `/me` 応答の真因確定）は Phase 11 の手動手順（`wrangler tail` を `scripts/cf.sh` 経由・user-gated）で代替する。

## 参照資料
- `../phase-1/phase-1.md`（AC-1〜9）/ `../phase-2/phase-2.md` / `../phase-3/phase-3.md` / `../phase-4/phase-4.md`
- `../../_shared-context.md`（SSOT §6 不変条件 / §9 DoD）

## 成果物
- `outputs/phase-10/phase-10.md`

## 完了条件
- [x] AC-1〜9 の充足判定表を作成し、local 実装・focused tests・静的 gate の PASS と staging user-gated 境界を分離して明記した。
- [x] blocker なしを根拠付きで判定した。
- [x] MINOR 追跡事項（MINOR-1〜4）を記録した。
