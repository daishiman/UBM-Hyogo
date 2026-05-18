# Phase 13: PR作成（ユーザー明示承認後）

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 |
| 名称 | PR 作成 |
| ユーザーゲート | 明示承認なしに着手しない |
| base ブランチ | `dev` |

## 目的

ユーザー明示承認後に PR を作成し、本タスクの成果物（実装 + テスト + ドキュメント + ledger 更新）を `dev` ブランチへ反映可能な状態にする。

## ユーザーゲート

**この Phase はユーザーの明示的な承認なしに着手しない。** commit / push / PR 作成は本タスク仕様書の責務外（CONST_002）。

## 事前条件

- Phase 1-12 すべて completed
- `outputs/phase-12/` の 6 成果物完成
- `artifacts.json` / `outputs/artifacts.json` parity
- typecheck / lint / test all PASS

## 実行タスク

1. ユーザー明示承認のログを取得する
2. PR スコープテーブルを最終確認する
3. PR 本文を `.claude/commands/ai/diff-to-pr.md` に従って構成する
4. base = `dev` で PR を作成する
5. `outputs/phase-13/pr-summary.md` に承認時刻 / PR URL / base を記録する
6. `artifacts.json` の root status を `completed` に更新する

## PR スコープ

| 種別 | パス |
| --- | --- |
| feat | `apps/api/src/services/aliasRecommendation.ts` |
| test | `apps/api/src/services/aliasRecommendation.spec.ts` |
| docs | `docs/30-workflows/ut-07b-alias-recommendation-i18n/` 一式 |
| docs | aiworkflow-requirements references 同期差分 |
| ledger | `unassigned-task/` → `completed-tasks/` 移動 |

## PR 本文要点

- 解決する Issue: `#292`
- 変更概要: `recommendedStableKeys` の label 比較に NFKC + trim + whitespace 圧縮の前処理を追加
- response shape: 変更なし
- 検証: vitest 20 ケース PASS / typecheck / lint
- スクリーンショット: 不要（NON_VISUAL）
- 関連: `07b-parallel-schema-diff-alias-assignment-workflow`（親）/ `UT-07B-schema-alias-hardening-001`（責務分離）

## 参照資料

- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `.claude/commands/ai/diff-to-pr.md`
- CLAUDE.md「PR作成の完全自律フロー」

## 成果物

`outputs/phase-13/pr-summary.md` に承認時刻 / PR URL / base ブランチを記録。

## 完了条件

- [ ] ユーザー明示承認のログが残っている
- [ ] PR URL が記録されている
- [ ] `artifacts.json` の root status が `completed` に更新されている
- [ ] base ブランチが `dev` である
- [ ] `outputs/phase-13/pr-summary.md` が存在する
