# Phase 12: 適合性

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | members-not-displaying-form-sync-investigation |
| phase | 12 |
| state | implemented_local_runtime_pending |

## 目的

この Phase は Google Form response sync から public members 表示までの修復仕様とローカル実装状態を検証可能な形へ固定する。

## 実行タスク

- 既存実装との差分を仕様に反映する。
- ローカル実装済み項目は Gate-B passed、staging runtime 操作は Gate-C pending として明示する。

## 参照資料

- 依存 Phase: phase-01 / Phase 1, phase-02 / Phase 2, phase-05 / Phase 5, phase-06 / Phase 6, phase-07 / Phase 7, phase-08 / Phase 8, phase-09 / Phase 9, phase-10 / Phase 10, phase-11 / Phase 11
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-members-not-displaying-form-sync-investigation-artifact-inventory.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。


## 不変条件チェック

| Invariant | 該当 | 適合状況 |
|-----------|------|----------|
| #1 実フォーム schema をコードに固定しない | 関連 | sync policy は consent 値のみ参照、schema fix なし |
| #2 consent キー = publicConsent / rulesConsent | 関連 | extract-consent 既存 stable_key 経由のみ |
| #3 responseEmail = system field | 関連 | 触らず |
| #5 D1 直接アクセスは apps/api 内 | 関連 | apps/web 変更なし |
| #6 GAS prototype 非昇格 | 非該当 | |
| #7 Form 再回答が更新経路 | 関連 | 既存 sync 維持 |
| #8 *.spec.ts 命名 | 関連 | 新規 spec は全て .spec.ts |
| #9 admin FormField 経由 | 非該当（admin UI 変更なし） | |
| #10 admin mutation hook 統一 | 非該当 | |

## ユーザー指定 vs 実態判定

ユーザー指示は「原因確認 + 解消」。これはコード変更を必要とする（policy 新設・diagnostic endpoint 拡張・backfill ops）。よって **実装仕様書としてデフォルト通り作成**（CONST_004）。

## CONST_007 準拠

3 タスク全てを 1 サイクル内で完遂対象。先送りタスクなし。runtime ops（H1/H2/H4 該当時の既存 runbook 実行）も同サイクル内に含める方針を明記済み。

## Canonical 9 headings (root level)

このファイルは task-specification-creator skill の Phase 12 strict 7 形式に従う:

1. Main spec — phase-12-main.md（後続生成）
2. Implementation guide reflection — phase-05 参照
3. System spec update summary — Phase 12 phase-12/system-spec-update-summary.md（後続生成）
4. Documentation changelog — phase-12/documentation-changelog.md（後続生成）
5. Unassigned task detection — 候補スキャン → 0 件想定（既存 H1/H2/H4 は CLOSED issue 再開で扱い、新規 unassigned なし）
6. Skill feedback report — 既存 google-form-reflection-diagnostics 系 skill との重複なし
7. Phase 12 task spec compliance check — 本ファイルで担保

## 関連 issue / workflow

- 親系統: `docs/30-workflows/completed-tasks/google-form-reflection-diagnostics/`
- 既存 CLOSED issue: #956 (H1), #957 (H2), #958 (H3 UX), #959 (H4)
- 本 workflow: H3 を runtime data + sync policy の両面で恒久解決
