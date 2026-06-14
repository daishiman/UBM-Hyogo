# System Spec Update Summary — home-dashboard-japanese-localization

> 正本: `_shared-context.md`。本タスクは implemented_local_evidence_captured（ローカル実装・証跡取得済み）・apps/web 内のみ。

## Step 1-A — 完了タスク記録

- タスク: ホーム画面（公開トップ `/`）の英語表記を非エンジニア向け日本語へ整える（統計4ラベル日本語化 + 同期バッジ文言 + 英語 overline 6 箇所削除 + dead CSS 削除）。
- 区分: VISUAL 実装仕様書（implemented_local_evidence_captured）。Phase 1〜13 の仕様書を作成完了。
- 成果物: `docs/30-workflows/completed-tasks/home-dashboard-japanese-localization/**`（仕様書 + outputs）。apps/web 表現層の実装差分を同一サイクルで反映済み。

## Step 1-B — 実装状況

- **実装状況 = implemented_local_evidence_captured（ローカル実装・証跡取得済み）**。
- コード変更（F1〜F7 + T1〜T6）・focused vitest 実行・ローカル実スクリーンショット取得は完了。commit/PR と staging visual baseline は user-gated（Phase 13・pending）。
- `artifacts.json.metadata.workflow_state = "implemented_local_evidence_captured"`。Gate-A passed（仕様完成）/ Gate-B passed（local implementation review）/ Gate-C pending（PR）。

## Step 1-C — 関連タスク

- 公開層の他 VISUAL タスク（例: public-member-common-ui-card-unification）と DOM contract / OKLch トークン正本を共有するが、対象ファイル（ホーム 6 セクション）が異なり重複・競合なし。
- UI prototype alignment 不変条件（既存 API のみ・OKLch 正本・新規 primitive 0・D1 直接アクセス禁止）を継承。
- eyebrow 削除は Hero/AboutUbm/Timeline/CallToActionCTA が home 専用（grep 確認済）のため他画面へ波及しない。

## Step 2 — 新規インターフェース追加

- **N/A（該当なし）**。新規 API endpoint・型・定数・スキーマ・インターフェースの追加は無い。
- データ取得は `/public/stats`（`PublicStatsView`）経由のまま。`Stats` の props 契約は不変。
- したがって aiworkflow-requirements 正本仕様（schema / auth / DB / interfaces）への更新は **不要**。
- 変更は文字列置換・要素削除・CSS 削除・web fetch 境界の旧 shape 補完・テスト更新のみで、システム正本仕様に影響しない。
