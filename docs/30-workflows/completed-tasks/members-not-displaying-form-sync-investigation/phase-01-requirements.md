# Phase 1: 要件

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | members-not-displaying-form-sync-investigation |
| phase | 01 |
| state | implemented_local_runtime_pending |

## 目的

この Phase は Google Form response sync から public members 表示までの修復仕様とローカル実装状態を検証可能な形へ固定する。

## 実行タスク

- 既存実装との差分を仕様に反映する。
- ローカル実装済み項目は Gate-B passed、staging runtime 操作は Gate-C pending として明示する。

## 参照資料

- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-members-not-displaying-form-sync-investigation-artifact-inventory.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。


## 問題ステートメント

staging 公開メンバー一覧 (`/members`) に Google Form 回答済み会員が 1 人も表示されない。Form 側には実回答があるため、Form→D1→公開 API→Web のどこかでデータが落ちている。

## ユーザー要求

> 「APIがしっかりと連携できていないとか、どういうところが問題なのかというところも解消してほしい」

つまり **原因特定 + 根本解消** までを 1 サイクルで完遂すること。

## 機能要件

- FR-01: staging で「Form 回答 → 数分以内に公開メンバー一覧に反映」される end-to-end フローが動作すること
- FR-02: 原因が複数 (H1: ingest 不稼働 / H2: identity mismatch / H3: publish_state default / H4: schema alias drift) のどれかを runtime evidence で確定できること
- FR-03: 既存の `/api/admin/diagnostics/forms-pipeline` レスポンスから原因特定に必要な情報がすべて取れること（不足項目は本サイクルで追加）
- FR-04: 既存 staging records (publish_state='member_only' のまま滞留している分) を policy に従って batch 修復できること
- FR-05: 新規回答が同じ滞留を起こさないよう、policy を恒久化（feature flag で staging/production 個別 toggle 可能）

## 非機能要件

- NFR-01: 診断 ops は read-only。書き込みは backfill script の `--apply` 明示時のみ
- NFR-02: backfill は idempotent（複数回実行で結果同一）
- NFR-03: auto-publish policy 切替は env feature flag で逆引き可能（即時 rollback 可能）
- NFR-04: `apps/web` からの D1 直接アクセス禁止（不変条件 #5）を破らない
- NFR-05: Google Form schema 仮定をコードに固定しない（不変条件 #1）

## 受け入れ基準

| AC | 内容 |
|----|------|
| AC-01 | `bash scripts/diagnose-members-pipeline.sh --env staging` 実行で「最終 sync 時刻 / member_status 全件数 / public_consent 分布 / publish_state 分布 / 公開条件全 AND を満たす件数」が JSON で取得できる |
| AC-02 | 診断結果 JSON から H1/H2/H3/H4 のどれが該当するか目視で判別できる対応表が出力される |
| AC-03 | `MEMBERS_AUTO_PUBLISH_ON_CONSENT=true` の環境で新規 sync された `public_consent='consented'` レコードが `publish_state='public'` で書き込まれる（unit test 緑） |
| AC-04 | `MEMBERS_AUTO_PUBLISH_ON_CONSENT=false`（default）では従来動作（`'member_only'`）を維持する（regression test 緑） |
| AC-05 | `bash scripts/backfill-publish-state.sh --env staging --dry-run` で対象件数を表示、`--apply` で実反映、再実行時 0 件追加更新（idempotent） |
| AC-06 | staging deploy 後 `/members` に該当会員が表示される（user-gated browser smoke） |

## スコープ外

- H1 secrets/cron 投入そのもの（既存 #956 runbook を参照、本サイクルでは "実行が必要" と判定するところまで）
- Google Form schema 変更
- production 環境への自動展開（staging 検証完了後 user-gated）
- staging deploy、backfill apply、browser smoke（Gate-C で明示的に pending）
