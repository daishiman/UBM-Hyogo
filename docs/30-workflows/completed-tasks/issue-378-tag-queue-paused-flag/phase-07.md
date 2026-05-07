# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| タスク | issue-378-tag-queue-paused-flag |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | completed |


[実装区分: 実装仕様書]
判定根拠: env binding 追加・関数シグネチャ変更・テスト追加・runbook 新規作成を伴うため、コード変更が必須。

## 目的

phase-01 で確定した受入条件 6 件が、テスト or 手動検証のいずれかで担保されることを表で固定する。

## AC マトリクス

| AC ID | 内容 | 検証方法 | 検証アーティファクト |
| --- | --- | --- | --- |
| AC-1 | env binding `TAG_QUEUE_PAUSED` が定義され default disabled | typecheck + grep | `apps/api/src/env.ts` / `apps/api/wrangler.toml` |
| AC-2 | flag true で INSERT 0 件・`reason: "paused"` 戻り値 | unit test ケース 3（fakeD1 INSERT spy not called） | `tagCandidateEnqueue.test.ts` |
| AC-3 | skip reason `paused` の structured log 出力 | unit test ケース 3 の log spy assertion | `tagCandidateEnqueue.test.ts` |
| AC-4 | runbook が `docs/30-workflows/runbooks/` に存在 | ファイル存在確認 + 内容 review | `docs/30-workflows/runbooks/tag-queue-pause.md` |
| AC-5 | unit test PASS（3 ケース + 補助 5 ケース + log spy）| `pnpm --filter @ubm/api test` PASS log | phase-11 NON_VISUAL evidence |
| AC-6 | 不変条件 #5 / #13 遵守 | grep で `apps/web` 編集ゼロ確認 / `member_tags` 直接 INSERT 経路不変確認 | phase-09 quality-report / `git diff main...HEAD --name-only` |

## トレース

- AC-1 → phase-01 default 方針 / phase-05 ファイル変更 #1〜#2
- AC-2 → phase-02 pause check 挿入位置 / phase-04 ケース 3
- AC-3 → phase-02 log code 採番 / phase-04 log spy
- AC-4 → phase-05 runbook テンプレート
- AC-5 → phase-04 テスト戦略 / phase-09 品質ゲート
- AC-6 → phase-03 アーキテクチャ整合

## 実行タスク

- [x] Phase 7 の目的に沿って、本文で定義した確認・実装・検証を実施する。
- [ ] 関連する実コード、実仕様書、実スキル参照を同一サイクルで更新する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `docs/30-workflows/issue-378-tag-queue-paused-flag/artifacts.json`

### 依存 Phase

- Phase 5: `phase-05.md`
- Phase 6: `phase-06.md`

## 成果物

- `docs/30-workflows/issue-378-tag-queue-paused-flag/phase-07.md`
- Phase 7 に対応する `outputs/phase-07/` 成果物

## 統合テスト連携

- [ ] NON_VISUAL のため、統合テストは `pnpm --filter @ubm-hyogo/api test` と focused Vitest evidence に集約する。
- [ ] runtime Cloudflare mutation は user approval gate の外では実行しない。

## 完了条件

- [x] Phase 7 の完了条件を満たす。

- 受入条件 6 件全てに検証方法とアーティファクトが対応している。
- 各 AC が他 phase に逆引き可能（トレース表）。
