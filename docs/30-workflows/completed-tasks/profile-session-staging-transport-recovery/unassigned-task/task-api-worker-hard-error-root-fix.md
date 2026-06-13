# 未タスク: API worker（`ubm-hyogo-api-staging`）hard error の根治（S3 確定時のみ着手）

## メタ情報

| 項目 | 値 |
| --- | --- |
| 親ワークフロー | `docs/30-workflows/completed-tasks/profile-session-staging-transport-recovery` |
| 状態 | `deferred_pending_sub_cause`（サブ原因確定待ちバックログ） |
| 着手条件 | **Phase 11 RT-D で S3（service-binding fetch throw ＝ bound worker hard error）と staging ログで確定した場合のみ** |
| 配置 | 本ファイル＝バックログ（GitHub Issue 化は S3 確定後・user-gated） |
| 対象領域 | `apps/api/**`（`ubm-hyogo-api-staging` worker） |
| taskType | NON_VISUAL（想定） |

## 背景

staging `/profile` の `MEMBER_SESSION_FAILED`（transport throw）のサブ原因 4 つ（S1〜S4）のうち、S3 は「service binding は解決できたが `API_SERVICE.fetch` 自体が throw する＝bound worker（`ubm-hyogo-api-staging`）の hard error / binding 不調」である。親 WF の T03（fallback chain）により S3 でも **http transport への fallback で復旧はする**が、bound worker 側の hard error そのものは残るため、根治は本タスクで行う。

## なぜ親 WF で実施しないか（CONST_007 例外①）

- 親 WF は不変条件 AC-7（**apps/api 非接触**）を持つ。サブ原因が S3 と確定する**前**に `apps/api` を変更するのは、(a) AC-7 違反、(b) 真因不明のままの推測修正（仕様分岐の合意未済）の二重の理由で禁止。
- S1（env 解決不能）/ S2（localhost fallback）/ S4（http 到達不能）が真因だった場合、本タスクは**不要**であり着手しない。

## 着手条件（排他判定の根拠）

Phase 11 RT-D（`outputs/phase-11/manual-test-result.md`）の判定フローで、staging の新構造化ログに次が確認されること:

- `server_fetch_failed` ログの `transportKind=service-binding` の `ApiTransportError`（`API_SERVICE.fetch` 自体の throw）
- 併せて `api_transport_fallback {from: service-binding, to: http, ...}` warn（chain による劣化運転の証跡）が出ていれば、binding 経路のみの故障＝S3 の確度が上がる
- RT-B（診断スクリプト）の API direct probe が 401 を返す（API ホスト自体は生存）一方で binding 経路だけが落ちている対比

## 実施内容（S3 確定後に詳細化）

1. `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging` で bound worker 側の hard error（例外 / OOM / startup error）ログを特定する。
2. 特定した例外箇所（route handler / middleware / D1 接続等）を最小差分で修正する（`/me` の path・shape・status 体系は不変のまま）。
3. 修正後 `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` で deploy し（user-gated）、親 WF の RT-B/RT-C を再実行して binding 経路の復旧を確認する。
4. 必要に応じて `api_transport_fallback` warn の消失（service-binding 第一候補での成功復帰）をログで確認する。

## 制約・不変条件

- D1 直接アクセスは `apps/api` に閉じる（不変条件 #5）。
- `/me` のレスポンス shape・path・status 体系・D1 schema・Google Form 仕様は変更しない。
- `wrangler` 直叩き禁止（`bash scripts/cf.sh` 経由）。secret 実値・cookie・memberId 非転記。
- commit・PR・deploy は user-gated。

## 依存

- 親 WF T01〜T04 の実装 + staging deploy（RT-A）完了
- Phase 11 RT-D による S3 確定（確定しない限り本タスクは着手しない）

## 前身 Issue との関係

- 前身 WF の Issue #1189（410）/ #1190（5xx）/ #1191（transport 運用是正・親 WF が実装で回収）/ #1192（管理者 UX）のいずれとも領域が重ならない（bound worker hard error 根治は新規領域）。重複起票しない。

## 苦戦箇所【記入必須】

親 WF の `MEMBER_SESSION_FAILED` は transport throw を示すが、S1/S2/S3/S4 のどれが staging 実機で発生しているかは deploy 後の構造化ログなしには排他確定できない。S3 未確定のまま `apps/api/**` を修正すると、親 WF の AC-7（apps/api 非接触）と「推測修正をしない」方針に反する。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| S3 以外が真因なのに API worker を変更して scope を拡大する | Phase 11 RT-D で `transportKind=service-binding` の throw と API direct probe の対比が揃るまで着手しない |
| hard error 調査で secret / cookie / memberId を証跡に残す | `bash scripts/cf.sh` 経由で tail し、ログ引用時は値を redaction する |
| `/me` contract を変えて web 側回帰を起こす | path / shape / status 体系は不変条件として固定し、focused route / repository tests で確認する |

## 検証方法

1. 親 WF の RT-D で S3 確定ログを保存する（service-binding throw + http fallback 成功または API direct 生存）。
2. `apps/api` 側の該当例外を focused test で再現し、最小修正する。
3. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` 後、親 WF RT-B/RT-C を再実行する。
4. service-binding 第一候補で成功し、`api_transport_fallback` が不要になることを tail で確認する。

## スコープ

| 区分 | 内容 |
| --- | --- |
| IN | S3 確定後の `ubm-hyogo-api-staging` hard error 根治、必要最小限の `apps/api/**` 修正、focused tests、staging deploy verification |
| OUT | S1/S2/S4 の web transport/env 問題、`/profile` UI 変更、D1 schema 変更、Google Form 変更、410 復帰 UX、管理者 UX |
