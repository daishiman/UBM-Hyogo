# Skill Feedback Report

## Feedback

| skill | finding | action |
|-------|---------|--------|
| `task-specification-creator` | Phase 12 strict 7 / artifacts parity が workflow root に不足していた | root / outputs artifacts と strict 7 を追加 |
| `task-specification-creator` | 実装対象 path に旧 `src/app` 系 drift があった | `apps/web/app` へ補正 |
| `task-specification-creator` | Phase 11 evidence inventory が `present` を宣言しても物理ログが無い状態を許していた | serial-05 で typecheck / lint / build / adapter / token / grep / route inventory を物理生成し、present/pending を同期 |
| `task-specification-creator` | Next.js build が env schema に依存する場合の local build command が不足していた | Phase 10 に `ENVIRONMENT=local` と API base URL 群を明記 |
| `task-specification-creator` | `serial-00-design` の Phase 1-3 と root Phase 1-13 記述が矛盾していた | `serial-00-design` を非実行 preface として明記 |
| `aiworkflow-requirements` | prototype source と current app route の照合台帳が不足していた | `PROTOTYPE-COVERAGE.md` を追加 |
| `automation-30` | 30種思考法の evidence が本文に散らばると重複する | compact evidence table と four-condition gate に集約 |

## Promotion Need

Promotion candidate recorded. 汎用ルールとして、Phase 12 では `current_app_path` を `rg --files apps packages` で実在確認し、参照先の正本仕様に stale path が残る場合は同 wave で補正するか supersede 境界を明記する。今回の対象 workflow では 09a / 09h と workflow-local docs を同一サイクルで補正済み。
