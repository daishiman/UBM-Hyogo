# Phase 8: リファクタ対象

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| タスク | issue-378-tag-queue-paused-flag |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | completed |


[実装区分: 実装仕様書]
判定根拠: env binding 追加・関数シグネチャ変更・テスト追加・runbook 新規作成を伴うため、コード変更が必須。

## 目的

本タスクは小規模変更（5 ファイル + runbook 1 件）であり、リファクタ対象は最小限とする。

## リファクタ判断

| 項目 | 対象 | 判断 |
| --- | --- | --- |
| `parsePaused` の責務 | env → boolean 変換のみ | OK。単一責務。再利用想定の他 flag が出るまで一般化は不要。 |
| `enqueueTagCandidate` 第3引数 | `paused: boolean` を直接受ける | OK。env 全体を渡さないことで test と関心分離。env を渡す案は YAGNI。 |
| log helper | 既存 helper があれば流用、なければ `console.warn` | OK。専用 helper の新規導入はしない。 |
| result 型 union 拡張 | `"paused"` を追加するのみ | OK。enum 化等の構造変更は不要。 |

## 後続改善候補（本タスクでは対応しない）

- `TAG_QUEUE_PAUSED` 以外に複数 flag が増えた場合の `parseEnvFlags(env)` 一般化
- log sampling（pause 中の log 量制御）
- admin UI toggle（unassigned task で out of scope と確定済み）

これらは本タスクでは扱わず、必要時に別 unassigned task として起票する（phase-12 unassigned-task-detection で再評価）。

## 実行タスク

- [x] Phase 8 の目的に沿って、本文で定義した確認・実装・検証を実施する。
- [ ] 関連する実コード、実仕様書、実スキル参照を同一サイクルで更新する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/issue-378-tag-queue-paused-flag/artifacts.json`

### 依存 Phase

- Phase 1: `phase-01.md`
- Phase 2: `phase-02.md`
- Phase 5: `phase-05.md`
- Phase 6: `phase-06.md`
- Phase 7: `phase-07.md`

## 成果物

- `docs/30-workflows/issue-378-tag-queue-paused-flag/phase-08.md`
- Phase 8 に対応する `outputs/phase-08/` 成果物

## 統合テスト連携

- [ ] NON_VISUAL のため、統合テストは `pnpm --filter @ubm-hyogo/api test` と focused Vitest evidence に集約する。
- [ ] runtime Cloudflare mutation は user approval gate の外では実行しない。

## 完了条件

- [x] Phase 8 の完了条件を満たす。

- リファクタ判断 4 項目が記録されている。
- 後続改善候補が本タスクスコープ外として明記されている。
