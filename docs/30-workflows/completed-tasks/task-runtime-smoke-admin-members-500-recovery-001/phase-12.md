# Phase 12: 完了確認・compliance

[実装区分: 実装仕様書]

## 1. 中学生レベル説明（Part 1）

staging という「本番に出す前のお試し環境」で、管理者用の「会員一覧を取ってくる」API（`GET /admin/members`）が壊れていて、いつも 500 エラーを返していました。これだと毎回 CI（自動テスト）が赤くなって、新しい修正もデプロイできません。

このタスクでは、

1. なぜ 500 が出ているのかを **ログとデータベースを覗いて切り分け**
2. 原因（zod チェック失敗 / SQL 失敗 / 設定ミス）に応じて **コードか設定を直す**
3. 同じ問題が再発しても **すぐ気づけるよう error code を仕込み、エラー本文をログに残す**

の 3 つを順番にやります。最終的には CI の smoke テストが緑になり、`.members` が配列で返ってくる状態がゴールです。

## 2. 技術者レベル説明（Part 2）

- `apps/api/src/routes/admin/members.ts` の `GET /members` を try/catch + structured log + 統一 error shape (`{ok:false, error:"internal", code:"UBM-ADMIN-MEMBERS-500"}`) にリファクタ
- `publishState` / `publicConsent` / `rulesConsent` の enum 縮退関数を導入し、DB 上の想定外値で zod が落ちないようにする。legacy `published` / `private` は意味を保って `public` / `hidden` に正規化する
- 根因が SQL drift だった場合は `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` で復旧
- `scripts/smoke/runtime-attendance-provider.sh` non-200 path で redaction 済み body を OUT_LOG に転記し、次回以降の RCA を高速化
- contract spec に enum 縮退 / legacy enum / DB binding 不在 / zod fail safe body の 6 ケースを追加

## 3. システム仕様書更新
- 仕様変更なし（仕様準拠の bugfix）。`docs/00-getting-started-manual/specs/01-api-schema.md` の `AdminMemberListView` は不変

## 4. Phase 11 evidence 実在確認（CI gate）
- local typecheck / lint / focused api test / smoke runner regression は `present`。staging 500 body / D1 schema / Workers tail / deploy / runtime smoke は user-gated のため `pending`
- `bash scripts/verify-pr-ready.sh` の `verify:phase12-compliance` は PR 準備時に実行する

## 5. 未タスク検出
- 検出時はこの章にリストアップ。0 件でも本章を残す
- 候補: alert-relay 経路での `UBM-ADMIN-MEMBERS-500` 監視 alert 追加（staging smoke 再実行後に別タスク化判断）

## 6. skill feedback
- smoke runner が non-200 で body を出さない設計は RCA を遅延させるため、本サイクルで `scripts/smoke/runtime-attendance-provider.sh` に redaction 済み body 転記を実装し、T-4-5 regression test を追加済み
- `task-specification-creator` の `phase12-skill-feedback-promotion.md` に、runtime smoke recovery 仕様では fail path body visibility を同 wave 実コード/テストへ反映するルールを追記する

## 7. compliance-check
- 9 canonical headings は `outputs/phase-12/phase12-task-spec-compliance-check.md` が保持
- Phase 11 inventory の `pending` runtime evidence と、実装済み smoke runner regression test の `present` evidence を分離する

## 8. Phase 12 DoD
- 7 outputs（実装ガイド / システム仕様書更新 / docs changelog / 未タスク検出 / skill feedback / spec compliance / main）が `outputs/phase-12/` に物理配置されている
- workflow_state は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。local 実装と evidence は同期済み、staging runtime smoke evidence 取得後に completion へ昇格する
