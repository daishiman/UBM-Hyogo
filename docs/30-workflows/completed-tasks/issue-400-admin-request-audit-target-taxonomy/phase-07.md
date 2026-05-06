# Phase 7: 品質ゲート / coverage 戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-400-admin-request-audit-target-taxonomy |
| phase | 07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #400 の admin request audit target taxonomy を実装・検証・正本同期する。

## 実行タスク

- Phase 本文の内容を実行し、成果物と検証証跡を同期する。

## 参照資料

- `docs/30-workflows/issue-400-admin-request-audit-target-taxonomy/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`

## 成果物

- root Phase 仕様書と `outputs/phase-*/main.md`


## ゲート一覧

| ゲート | 内容 | 状態 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` で error 0 | gate defined / pending follow-up execution |
| lint | `mise exec -- pnpm lint` で error 0 | gate defined / pending follow-up execution |
| unit test (api) | repository / route の追加 / 更新ケースが green | gate defined / pending follow-up execution |
| unit test (web) | UI placeholder ケース（条件付）が green | gate defined / pending follow-up execution |
| coverage | 80% 全体ゲート維持。`coverage-gate` CI job がパス | COVERED_BY_PLANNED_TEST |
| build | `mise exec -- pnpm build` で warnings/errors なし | gate defined |

## coverage 戦略

- 新規追加ブランチ（`admin_member_note` の append / filter / listByTarget）はテスト計画の追加ケースで全実行される
- 既存 `'member'` 経路は legacy regression として既存テストでカバー
- 削除コードはなし → coverage 低下なし

## 静的検証パス

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm build
```

## 完了条件

- すべてのコマンドが exit 0
- coverage 80% gate を CI で観測

## 統合テスト連携

- focused unit / route tests と validator を Phase 11 で接続する。
