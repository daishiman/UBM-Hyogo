# Phase 10: レビュー + 整合確認（ADR と owner 表と markdown 論理正本の 1:1 対応）

[実装区分: 実装仕様書（CONST_004 例外条件適用）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-195-sync-jobs-contract-schema-consolidation-001 |
| Phase 番号 | 10 / 13 |
| Phase 名称 | レビュー + 整合確認 |
| Wave | 5 |
| Mode | parallel（実装仕様書） |
| 作成日 | 2026-05-04 |
| 前 Phase | 9 (indexes 再生成 + drift 検証 + typecheck/lint/test 実行) |
| 次 Phase | 11 (NON_VISUAL evidence 収集) |
| 状態 | created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | REQUIRED |

## 第 0 セクション: 実装区分の宣言

本 Phase は実装変更を行わず、ADR / owner 表 / markdown 論理正本 / runtime SSOT の 1:1 対応を確認する。整合不良があれば Phase 6〜8 へ戻る。

## 目的

AC-1〜AC-8 の整合を最終確認し、後続 Phase 11（evidence）/ Phase 12（実装ガイド）/ Phase 13（PR）に進める状態を保証する。

## 実行タスク

1. ADR-001 と owner 表行の owner / co-owner / 備考の整合確認
2. `_design/sync-jobs-spec.md` の §2 / §3 / §5 への参照リンクが ADR-001 Links と一貫しているか確認
3. runtime SSOT (`apps/api/src/jobs/_shared/sync-jobs-schema.ts`) の export と markdown 論理正本（§3 / §5）の項目名整合確認
4. `database-schema.md` の `sync_jobs` 節と `_design/sync-jobs-spec.md` の参照方向が一貫しているか確認
5. unassigned-task の status / resolved-by / resolved-date が Phase 8 で更新されていることを確認
6. 4 条件評価の再実行（価値性 / 実現性 / 整合性 / 運用性）

## 整合確認チェックリスト

| # | 確認項目 | 期待 | 不一致時 |
| --- | --- | --- | --- |
| 1 | ADR-001 Decision = `apps/api` 維持 | YES | Phase 6 戻り |
| 2 | owner 表行の owner = 03a, co-owner = 03b | YES | Phase 6 戻り |
| 3 | ADR-001 Links が owner 表 / runtime SSOT を含む | YES | Phase 6 戻り |
| 4 | §2 / §3 / §5 に owner 表参照リンクが追記済み | YES | Phase 6 戻り |
| 5 | runtime SSOT export と §3 / §5 の項目名が一致 | YES | Phase 6 戻り（markdown 側調整） |
| 6 | `database-schema.md` `sync_jobs` 節が `_design/` 参照 | YES | Phase 7 戻り |
| 7 | unassigned-task status = resolved | YES | Phase 8 戻り |
| 8 | 4 条件評価で MAJOR なし | YES | Phase 1 戻り |

## ローカル実行コマンド

```bash
# ADR / owner 表 / 参照リンクの一括 grep
rg -n "ADR-001|sync-shared-modules-owner|_shared/sync-jobs-schema" docs/30-workflows/_design/sync-jobs-spec.md
rg -n "sync-jobs-schema\\.ts" docs/30-workflows/_design/sync-shared-modules-owner.md

# unassigned-task status
rg -n "^- status:" docs/30-workflows/unassigned-task/task-issue195-sync-jobs-contract-schema-consolidation-001.md

# runtime SSOT export と markdown の項目名突合
rg -n "^export " apps/api/src/jobs/_shared/sync-jobs-schema.ts
```

## 4 条件再評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | runtime SSOT 配置 ADR + owner 表登録 + 契約テスト網羅で sync 系 governance が完結するか | （Phase 9 結果を踏まえ確定） |
| 実現性 | 13 Phase / 1 PR で完遂したか | （Phase 9 結果を踏まえ確定） |
| 整合性 | AC 8 件 / 不変条件 7 件 / 既存テスト / CI gate と矛盾なし | （Phase 9 結果を踏まえ確定） |
| 運用性 | 後続 sync wave 追加時に owner 表 1 行 + ADR 1 段落で済むか | （Phase 9 結果を踏まえ確定） |

## DoD

- [ ] 整合確認チェックリスト 8 項目が全て YES
- [ ] 4 条件再評価で MAJOR がない
- [ ] 不一致があれば該当 Phase へ戻り、再実行ログを `outputs/phase-10/main.md` に記録

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | レビュー結果 / 整合確認チェックリスト / 4 条件再評価 |
| メタ | artifacts.json | Phase 10 を completed に更新（実行時） |

## 統合テスト連携

- レビューのみ。コマンドは grep の照合用

## 完了条件

- [ ] チェックリスト全 YES
- [ ] 4 条件で MAJOR なし
- [ ] 戻り作業があれば原因と再実行が記録

## 次 Phase

- 次: 11（NON_VISUAL evidence 収集）
- 引き継ぎ事項: 整合確認結果 / 4 条件再評価
- ブロック条件: チェックリスト 1 件以上 NO

## 参照資料

- `docs/30-workflows/_design/sync-jobs-spec.md`
- `docs/30-workflows/_design/sync-shared-modules-owner.md`
- `apps/api/src/jobs/_shared/sync-jobs-schema.ts`

## 依存 Phase 参照

- Phase 1: `outputs/phase-01/main.md`
- Phase 2: `outputs/phase-02/main.md`
- Phase 5: `outputs/phase-05/main.md`
