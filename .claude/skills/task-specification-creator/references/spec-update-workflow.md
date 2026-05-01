# システム仕様更新ワークフロー

> 読み込み条件:
> Phase 12 Task 2 を開始する時。Step 1 と Step 2 を混同しないための index。

## 2種類の更新アクション

| アクション | 必須 | 役割 | 詳細 |
| --- | --- | --- | --- |
| Step 1: 完了記録 | すべての task で必須 | workflow 完了と台帳の同期 | [spec-update-step1-completion.md](spec-update-step1-completion.md) |
| Step 2: domain spec sync | 条件付き | interface / API / architecture 変更の反映 | [spec-update-step2-domain-sync.md](spec-update-step2-domain-sync.md) |
| Step 1-H: skill/reference feedback promotion | Phase 12 feedback がある場合必須 | `skill-feedback-report.md` の苦戦箇所を owning skill / lesson / no-op に routing | [phase12-skill-feedback-promotion.md](phase12-skill-feedback-promotion.md) |
| validation | 完了前に必須 | 4系統の validator と pass 基準 | [spec-update-validation-matrix.md](spec-update-validation-matrix.md) |

## 判断フロー

1. まず Step 1-A〜1-G を完了する。
2. 次に interface、API、state、security、UI contract の変更有無を判定する。
3. Step 2 が不要でも、判断根拠を `documentation-changelog.md` と `system-spec-update-summary.md` に残す。
4. `skill-feedback-report.md` の各 item を `task-specification-creator` / `aiworkflow-requirements` / `skill-creator` / no-op に routing し、反映先または no-op reason を残す。
5. final validation を通してから Phase 12 を閉じる。

### Step 1-H: skill/reference feedback promotion

Phase 12 の feedback は domain spec sync と skill-process sync を分けて扱う。domain implementation lesson は `aiworkflow-requirements/references/lessons-learned-*.md`、workflow/template gap は `task-specification-creator/references/*` または `assets/*`、skill authoring/update-process gap は `skill-creator/references/*` に昇格する。

`skill-creator/SKILL.md` は entrypoint / routing が変わった時だけ更新し、通常は `references/update-process.md` や assets に追記する。昇格しない場合は `documentation-changelog.md` に no-op reason を記録する。

### 外部状態を最終正本にする task の Step 2 判定

GitHub branch protection など、外部サービスの GET 結果が最終正本になる task では、Phase 12 の予定 payload だけで references 本文へ final state を書かない。

- Phase 12: Step 1 で workflow / LOGS / indexes / active task を同期し、Step 2 は「Phase 13 applied evidence 後に別 task」として分離できる。
- Phase 13 後: fresh GET output、drift-check、manual-verification-log を evidence として、aiworkflow-requirements references へ final state を反映する。
- 禁止: placeholder JSON、reserved path、`blocked_until_user_approval` の記述を実適用 evidence として扱うこと。

## 詳細資料インデックス

| 資料 | 内容 |
| ---- | ---- |
| [spec-update-step1-detailed-checklist.md](spec-update-step1-detailed-checklist.md) | Step 1-A〜1-G の詳細チェックリスト・LOGS.md テンプレート |
| [spec-update-step1-validation-commands.md](spec-update-step1-validation-commands.md) | Step 1-G 検証コマンド・Warning 3段階分類・baseline/current 分離監査 |
| [spec-update-step1-completion.md](spec-update-step1-completion.md) | Step 1 完了記録の概要・完了タスク実績 |
| [spec-update-step2-domain-sync.md](spec-update-step2-domain-sync.md) | Step 2 更新判断基準・Runtime orchestration 補足・spec_created 補足 |
| [spec-update-ipc-mapping-guide.md](spec-update-ipc-mapping-guide.md) | 変更タイプ別更新対象マッピング・IPC機能開発時の追加更新対象・型定義配置フロー |
| [spec-update-validation-matrix.md](spec-update-validation-matrix.md) | validator コマンド一覧・pass 基準・Warning 扱いルール |
| [spec-update-workflow-advanced.md](spec-update-workflow-advanced.md) | よくある誤判断テーブル（全パターン）・新規仕様追加手順 |

## 参照リソース

| リソース                   | パス                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| 仕様スキル                 | `.claude/skills/aiworkflow-requirements/SKILL.md`                              |
| トピックマップ             | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`                  |
| 記述ガイドライン           | `.claude/skills/aiworkflow-requirements/references/spec-guidelines.md`         |
| 仕様テンプレート           | `.claude/skills/aiworkflow-requirements/assets/spec-template.md`               |
| ドキュメント更新履歴テンプレート | `.claude/skills/task-specification-creator/assets/documentation-changelog-template.md` |

---

- [phase-12-documentation-guide.md](phase-12-documentation-guide.md)
- [phase12-checklist-definition.md](phase12-checklist-definition.md)
- [technical-documentation-guide.md](technical-documentation-guide.md)
- [patterns-phase12-sync.md](patterns-phase12-sync.md)
- [phase12-skill-feedback-promotion.md](phase12-skill-feedback-promotion.md)

## Step 1-D: 上流仕様書差分追記ルール

設計タスク（`spec_created`）が完了した時点で、上流の仕様書・runbook へ差分追記が発生する場合は以下のルールを適用する:

- **同一 Wave 追記**: 上流 outputs が同 Wave で生成済みかつ責務が同一タスクに含まれる場合
- **Wave N+1 別 PR**: 設計と実装の責務が分離され、上流 outputs が後続タスクで生成される場合
- **baseline 留置**: 上流タスクが未着手で再合意が必要な場合

判定は `outputs/phase-02/runbook-diff-plan.md` に記録し、Phase 12 の `system-spec-update-summary.md` で実施有無を明示する。判定詳細は [phase-template-phase12.md](phase-template-phase12.md) を参照。

## 変更履歴

| Date | Changes |
| ---- | ------- |
| 2026-05-01 | 09a Phase 12 sync を契機に Step 1-H（skill/reference feedback promotion）を追加 |
| 2026-04-27 | UT-08 monitoring-alert-design を契機に Step 1-D（上流仕様書差分追記ルール）を追加 |
| 2026-04-07 | 974行のmonolithを子ファイル群に分散。本ファイルをフロー図+リンク集（100行以内）に縮小 |
| 2026-03-26 | UT-IMP-RUNTIME-WORKFLOW-ENGINE-FAILURE-LIFECYCLE-001 を反映 |
| 2026-03-26 | TASK-SDK-02 workflow-engine-runtime-orchestration を反映 |
| 2026-03-26 | TASK-SDK-01 manifest foundation の close-out を反映 |
| 2026-03-12 | TASK-SKILL-LIFECYCLE-04 の再監査を反映 |
| 2026-03-12 | Step 1 / Step 2 / validation の 3 ファイルへ責務分離 |
