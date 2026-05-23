# Phase 12: Documentation / Skill Sync — task-13-login-rebuild

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-13-login-rebuild |
| phase | 12 / 13 |
| wave | w5-par |
| mode | sequential |
| 作成日 | 2026-05-09 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented-local |
| implementation_status | implemented_local_runtime_pending |

## 目的

Phase 12 strict 7 outputs を実体化し、task-specification-creator と aiworkflow-requirements の両 skill に同一 wave で同期する。apps/web 実装と local screenshot は本 cycle で反映済み。staging smoke・commit・push・PR は user gate 後に残し、runtime production completed は使わない。

## 実行タスク

1. `outputs/phase-12/main.md` を作成し、Phase 12 の実行結果を記録する。
2. `outputs/phase-12/implementation-guide.md` を Part 1 / Part 2 構成で作成する。
3. `outputs/phase-12/system-spec-update-summary.md` を作成し、aiworkflow-requirements 同期先を列挙する。
4. `outputs/phase-12/documentation-changelog.md` を作成し、変更ファイルと検証コマンドを記録する。
5. `outputs/phase-12/unassigned-task-detection.md` を作成する（0 件でも必須）。
6. `outputs/phase-12/skill-feedback-report.md` を作成する（改善なしでも必須）。
7. `outputs/phase-12/phase12-task-spec-compliance-check.md` を作成し、strict 7 / artifacts parity / 4条件 / 30種思考法 compact evidence を検証する。

## Phase 12 Strict 7 Outputs

| # | Path | 判定 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | required |
| 2 | `outputs/phase-12/implementation-guide.md` | required |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | required |
| 4 | `outputs/phase-12/documentation-changelog.md` | required |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | required |
| 6 | `outputs/phase-12/skill-feedback-report.md` | required |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | required |

## Implementation Guide 要件

### Part 1: 中学生レベル

- 「なぜ必要か」を「何をするか」より先に書く。
- 日常生活の例え話を 1 つ以上入れる。
- 専門用語セルフチェック表を 5 語以上で作る。
- 5 core states + rules_declined derived state を「利用者から見た体験」として説明する。

### Part 2: 技術者レベル

- `LoginGateState`, `LoginCardProps`, `LoginStatusProps`, `LoginPanelProps` の TypeScript interface / type を載せる。
- `parseLoginQuery()`、Magic Link submit、Google OAuth click の API / function signature と使用例を載せる。
- open redirect、XSS、unknown state fallback、Auth.js API surface 不変のエラーハンドリングを説明する。
- 設定値・定数（state enum、error max length、redirect fallback、screenshot paths、test commands）を一覧化する。

## システム仕様更新

- Step 1-A: `.claude/skills/aiworkflow-requirements/` の quick-reference / resource-map / task-workflow-active / changelog / LOGS を更新する。
- Step 1-B: workflow state を `implemented-local / implementation / VISUAL_ON_EXECUTION / IMPLEMENTED_LOCAL_RUNTIME_PENDING` として登録する。
- Step 1-C: task-09 / task-10 dependency、task-18 downstream gate、task-11/12/14/15/16/17 parallel relationship を更新する。
- Step 1-H: skill feedback を task-specification-creator / aiworkflow-requirements / no-op へ routing する。
- Step 2: 新 API endpoint / D1 schema / Auth.js config は追加しないため N/A。ただし login UI contract の正本導線は indexes に追加する。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md`

## 依存 Phase 成果物参照

- Phase 2: `outputs/phase-02/main.md`
- Phase 5: 実装計画
- Phase 6: 単体テスト計画
- Phase 7: 統合テスト計画
- Phase 8: a11y 計画
- Phase 9: E2E smoke 計画
- Phase 10: token / lint gate 計画
- Phase 11: visual evidence 計画

## 成果物

- `artifacts.json`
- `outputs/artifacts.json`
- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- [ ] Phase 12 strict 7 outputs がすべて存在する
- [ ] root/output `artifacts.json` parity が `cmp -s` で PASS
- [ ] aiworkflow-requirements の index / active workflow / changelog / LOGS が同期済み
- [ ] task-specification-creator の LOGS に command drift / Phase 12 strict sync を記録済み
- [ ] `completed` を runtime evidence なしに使っていない
- [ ] commit / push / PR は実行していない

## タスク100%実行確認

- [ ] 必須セクションがすべて埋まっている
- [ ] Phase 12 strict 7 が揃っている
- [ ] 4条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）が PASS

## 次 Phase への引き渡し

Phase 13 へ、PR 準備 skeleton、Phase 12 compliance、user-gated 実行境界を渡す。
