# 12: skill-feedback-report

## 実行スキル
- task-specification-creator: 本タスク仕様書 13 phase の構造に従い outputs を生成
- int-test-skill: vitest unit test 設計に活用可能だったが、本タスクでは contract test 範囲に絞ったため部分採用

## 改善提案
- repository 層の unit test では「fake D1」が普遍的に必要。`int-test-skill` テンプレに fake D1 patterns の追加が有用
- `task-specification-creator` の Phase 12 における implementation-guide 雛形を repository 系タスク用に微調整できると望ましい（後続タスクへの公開 API 一覧表を強制する）
- Phase 11 仕様で UI smoke の名残が残ると repository-only task でも screenshot を要求してしまう。NON_VISUAL 判定時は `phase-11.md` 本文も同波で補正するガードが必要。
- `spec_created` / `docs_only` の metadata でも code 実装が入った場合は、Phase 12 Step 2 を必ず再判定し、公開 API 契約を正本仕様へ反映する必要がある。

## 不要だったスキル
なし。
