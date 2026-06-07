# Skill Feedback Report — issue-1089 backfill impact preview

## Template Improvements

- `implementation_mode:new` で実コード対象が明確な workflow は、実装可能な範囲を同一 cycle で完了し、`spec_created` のまま close しない運用が再確認された。
- VISUAL かつ admin 認証必須の場合、runtime screenshot は user-gated pending とし、focused UI/schema/backend contract を主証跡にする二段証跡が有効。

## Workflow Improvements

- Phase 12 strict 7 は実装後に物理ファイル存在で検証する。`phase12-task-spec-compliance-check.md` だけで代替しない。
- `artifacts.json` と `outputs/artifacts.json` の `workflow_state` / `implementation_status` は実コード差分に追随させる。

## Documentation Improvements

- `POST /admin/sync/responses?dryRun=true` のような既存 API の opt-in 契約追加は、API 正本と skill changelog の same-wave sync 対象。
- UI の「件数取得不可」などユーザー向け文言は、仕様書・実装・テストで同じ語彙に揃える。

## Urgency

緊急の skill 本体改修は不要。既存の same-wave implementation reclassification pattern で吸収できる。

