# Skill Feedback Report

## task-specification-creator

| Feedback | Why | Suggested update |
| --- | --- | --- |
| Phase 12 必須成果物が `phase-12.md` 本文に集約され、outputs 個別ファイル作成が漏れた | artifacts は個別ファイルを要求しているため parity が崩れる | Phase 12 checklist に「artifacts outputs 全ファイル存在確認」を必須化 |
| UIタスクで screenshot 未取得の扱いが曖昧 | VISUAL task では Phase 11画像と Phase 12参照が必須だが、fixture不足時の委譲形式が必要 | `VISUAL_DEFERRED` の代替 evidence テンプレートを追加 |
| `spec_created` から実装済みへ変わった際の metadata 更新が漏れた | docs-only のままでは成果物状態と実装状態が矛盾する | Phase 12 close-out に `taskType/docs_only/workflow_state` 再判定を追加 |

## aiworkflow-requirements

| Feedback | Why | Suggested update |
| --- | --- | --- |
| 04c API と 06c UI の接続早見が不足 | UI実装者が API / gate / invariant を横断検索する必要がある | quick-reference に Admin UI 早見を追加 |
| resource-map に 06c UI 実装導線が未登録 | 後続 07a/07b/07c/08a/08b が参照しにくい | resource-map の UBM-Hyogo セクションへ 06c 行を追加 |

## 結論

スキル本体の大幅構造変更は不要。Phase 12の検証チェックリスト強化と VISUAL_DEFERRED evidence のテンプレート追加が再発防止として有効。
