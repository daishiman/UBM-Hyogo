# Phase 12: 未タスク検出（unassigned-task-detection）

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-me-404-authenticated-admin-recovery` |
| Phase | 12 / 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

SSOT §3（S1〜S3）・index.md「既知のスコープ外」・Phase 3-10 の MINOR 指摘・Phase 11 発見事項・コードコメント TODO を確認し、本サイクルで formalize すべき未タスクを検出する。本 WF は「S1/S2 のいずれであっても復旧する多層防御」を today's fix とするため、新規の current 未タスクは検出しない。0 件でも本ファイルを出力する。

## 検出結果サマリ

**current 新規未タスク: 0 件。** T01〜T04 で本サイクル内に復旧と観測性を完結させ、スコープ外（S3 確定時の admin `/profile` UX 等）は既存 Issue #1192 / #1234 が追跡中で重複起票しない。baseline 候補は 3 件（将来候補・本サイクル対象外）。

## current（今サイクルで解消する範囲）

| 区分 | 内容 |
| --- | --- |
| 本サイクルで仕様確定するタスク | T01（apps/api notFound 観測性）/ T02（apps/api 自動 CD + smoke gate）/ T03（web route-404 ログ）/ T04（diagnose route 差分 + parity）。いずれも `implemented_local_runtime_pending` で仕様確定済・コード実装はlocal implementation |
| 本サイクルで formalize する新規未タスク | **なし（0 件）**。S1/S2 の復旧は T01〜T04 が回収し、S3 は既存 Issue が追跡 |

## baseline（将来候補・本サイクル対象外）

| ID | 内容 | 委譲先 / 起票判定 |
| --- | --- | --- |
| B-1 | data-cause=S3（401/410）と Phase 11 RT-E で確定した場合の admin `/profile` UX / environmentExplicit fail-closed | **既存 Issue #1192（admin `/profile` 専用 UX）/ #1234（environmentExplicit fail-closed・FU-001）へ委譲**。新規起票しない（領域非交差・後述「関連タスク差分確認」参照） |
| B-2 | smoke gate 用 `STAGING_API_BASE` 等 secret の GitHub Environment 登録 | **user-gated**（secret 登録は Claude Code が実行しない）。未登録時は T02 smoke が `skip_reason` で exit 0 のため CD 本体はブロックしない。登録は実装後の Phase 11 RT 実行時にユーザーが判断 |
| B-3 | production api-cd の本番 smoke 範囲（`deploy-production` 後の認証 `/me` 200 probe を本番で行うか） | 本サイクルは staging smoke を正本とし、production smoke 範囲は実運用後に判断（本番認証 cookie 発行の安全性確認が前提・user-gated 検討事項） |

> baseline 3 件はいずれも本サイクルの T01〜T04 とは別レイヤ。B-1 は既存 Issue 委譲、B-2/B-3 は user-gated 運用判断のため、本 wave では新規 GitHub Issue を起票しない。

## 関連タスク差分確認（#1192 / #1234 との重複チェック・FB-CANCEL-004-2）

| 関連 Issue | 内容 | 本 WF との領域差分 | 重複判定 |
| --- | --- | --- | --- |
| #1192 | admin `/profile` 専用 UX | 本 WF は transport/CD/観測層のみで `/profile` UI 文言・分岐・shape を一切変更しない（AC-6）。#1192 は UI 層の論点で、本 WF が S3 と確定した場合のみ委譲先になる | **重複なし**（領域非交差・UI 層は本 WF 対象外） |
| #1234（FU-001） | environmentExplicit fail-closed（ENVIRONMENT 未注入時の縮退構成） | 本 WF の T01〜T04 は env 注入の縮退構成を扱わない。#1234 は env アクセサ層の論点で、S3 確定時に env 注入が data-cause の場合に委譲先になる | **重複なし**（env 注入層は本 WF 対象外） |

> 本 WF の今サイクルタスク（T01〜T04）は notFound 観測性・api 自動 CD・web route-404 ログ・診断拡張で、#1192（UI）/ #1234（env 注入）のいずれとも領域が重ならない。S3（data-cause=401/410）と確定した場合のみ、本 WF はスコープ外となり #1192/#1234 へ委譲する（新規未タスクを作らず既存 Issue を追跡先とする）。

## 検出ソースと結果

### 1. 元タスク仕様書のスコープ外（SSOT §3 / index.md「既知のスコープ外」）

| 事象 | 候補化 | 起票判定 |
| --- | --- | --- |
| data-cause=S3（401/410）確定時の admin `/profile` UX | baseline B-1 | 既存 Issue #1192/#1234 が追跡・重複起票しない |
| 自動リンク管理者の `/me/profile`（`PROFILE_UNAVAILABLE`）= 「プロフィール情報が見つかりません」 | baseline（#1192 と重複） | `/me` 200 復旧後に顕在化し得る別レイヤ・#1192 が追跡 |
| Cloudflare Workers service-binding 仕様の根本変更 | 候補外 | プラットフォーム領域・自社外・起票しない |

### 2. Phase 3-10 の MINOR 指摘

| 指摘 | 検出 |
| --- | --- |
| diagnose script の route 差分偽陽性回避（401 を route miss と誤判定しない） | 未タスク化不要（T04 が本サイクル内で `both_alive` 判定として吸収・AC-5） |
| notFound ログの redaction 誤発火回避（`hasAuthorization`/`hasSessionCookie` 命名） | 未タスク化不要（T01 が本サイクル内で命名 + boolean 化で吸収・AC-9） |

### 3. Phase 11 発見事項

| 発見 | 検出 |
| --- | --- |
| Phase 11 実行発見 | 0 件（`implemented_local_runtime_pending` のため RT-A〜RT-E は未実施・user-gated）。RT-E で data-cause が S3 と確定した時点で baseline B-1（#1192/#1234 委譲）の判断条件が満たされる |

### 4. コードコメント TODO

| TODO | 検出 |
| --- | --- |
| 新規 TODO/FIXME | 0 件（本タスク由来の新規 TODO/FIXME なし） |

## 完了条件

- [x] current（本サイクルで仕様確定する T01〜T04・新規未タスク 0 件）と baseline（将来候補 3 件）を分離
- [x] baseline B-1（S3 確定時 admin `/profile` UX = #1192 / environmentExplicit = #1234 委譲）/ B-2（smoke secret 登録・user-gated）/ B-3（production smoke 範囲）を記録
- [x] 関連タスク差分確認セクションで #1192/#1234 との重複なし（領域非交差）を明記（FB-CANCEL-004-2）
- [x] スコープ外 / MINOR / Phase 11 発見 / TODO の 4 ソースを確認
- [x] current 新規未タスク 0 件でも本ファイルを出力

## 成果物

- `outputs/phase-12/unassigned-task-detection.md`（本ファイル）

## 参照資料

- `_shared-context.md` §2（S1〜S3）/ §3（因果ループ）
- `index.md`（既知のスコープ外）
- `outputs/phase-11/manual-test-result.md`（RT-E・S3 確定条件）
