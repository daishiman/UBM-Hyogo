# Phase 11 — ドキュメントリンク整合チェックリスト（NON_VISUAL）

本ワークフロー（`docs/30-workflows/completed-tasks/issue-1054-wrangler-binding-drift-ci-gate/`）内のドキュメントリンク・相互参照の整合を確認するチェックリスト。NON_VISUAL タスクの代替検証として、画面ではなくドキュメント整合を点検する。

## 1. phase-NN.md ↔ outputs/phase-NN/main.md 対応

| Phase | phase-NN.md | outputs/phase-NN/main.md | 確認 |
| --- | --- | --- | --- |
| 1 | phase-01.md | outputs/phase-01/main.md | - [ ] 両方存在し AC / 命名規則が一致 |
| 2 | phase-02.md | outputs/phase-02/main.md | - [ ] D-1〜D-7 / 突合マトリクスが一致 |
| 3 | phase-03.md | outputs/phase-03/main.md | - [ ] GO 判定 / MINOR R-1〜R-3 が一致 |
| 4 | phase-04.md | outputs/phase-04/main.md | - [ ] テスト戦略 / TC-01〜TC-10 が一致 |
| 5 | phase-05.md | outputs/phase-05/main.md | - [ ] 変更 5 ファイル / Step 順序が一致 |
| 6 | phase-06.md | outputs/phase-06/main.md | - [ ] 異常系・回帰前提が一致 |
| 7 | phase-07.md | outputs/phase-07/main.md | - [ ] AC / カバレッジマトリクスが一致 |
| 8 | phase-08.md | outputs/phase-08/main.md | - [ ] RF-1〜RF-7 が一致 |
| 9 | phase-09.md | outputs/phase-09/main.md | - [ ] QG-1〜QG-7 が一致 |
| 10 | phase-10.md | outputs/phase-10/main.md | - [ ] AC 充足 / GO 判定が一致 |
| 11 | phase-11.md | outputs/phase-11/main.md ほか 2 件 | - [ ] NON_VISUAL 宣言 / S-1〜S-5 が一致 |
| 12 | phase-12.md | outputs/phase-12/main.md | - [ ] ドキュメント更新範囲が一致 |
| 13 | phase-13.md | outputs/phase-13/main.md | - [ ] PR 作成方針が一致 |

## 2. index.md のリンク整合

- [ ] index.md「Phase 一覧」が phase-01.md 〜 phase-13.md の全 13 リンクを持つ
- [ ] index.md の AC-1〜AC-11 が各 phase-NN.md の AC 参照と一致
- [ ] index.md「関連リンク」の相対パス（`../unassigned-task/...` / `../completed-tasks/...` / `../../../apps/api/...` / `../../../.claude/skills/...`）が到達可能
- [ ] index.md「変更ファイル」記載と Phase 2「変更ファイル一覧」（5 件）が一致

## 3. 用語・識別子の一貫性

- [ ] スクリプト名 `scripts/verify-wrangler-binding-drift.mjs` が全 Phase で一致
- [ ] package script `verify:wrangler-binding-drift` が全 Phase で一致
- [ ] workflow `.github/workflows/verify-wrangler-binding-drift.yml` が全 Phase で一致
- [ ] test `scripts/__tests__/verify-wrangler-binding-drift.spec.ts`（不変条件 #8）が全 Phase で一致
- [ ] ログ接頭辞 `[verify-wrangler-binding-drift]` が全 Phase で一致
- [ ] Drift code（`ENV_TYPE_MISSING` / `INVENTORY_MISSING` / `INVENTORY_KIND_MISMATCH` / `INVENTORY_ORPHAN`）が Phase 2 / 7 / 10 / 11 で一致
- [ ] AC-10（MEMBER_PHOTOS 棚卸し表追記）の表記が index / Phase 1 / 2 / 9 / 10 / 11 で一致

## 4. 外部参照（解析対象・先例）

- [ ] `apps/api/wrangler.toml` への参照が「解析対象・非編集」で一貫
- [ ] `apps/api/src/env.ts` への参照が「解析対象・非編集」で一貫
- [ ] `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` が「棚卸し表正本・MEMBER_PHOTOS 是正先」で一貫
- [ ] 先例 `scripts/verify-design-tokens.ts` / `.github/workflows/verify-design-tokens.yml` への参照が一貫

> 本チェックリストの実点検（チェックボックス埋め）は実装サイクルおよび PR 前検証で行う。spec_created 時点では未チェック（`- [ ]`）でよい。
