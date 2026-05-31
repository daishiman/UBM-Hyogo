# Phase 12: 適合性

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | issue-998-members-publish-state-production-rollout |
| phase | 12 |
| state | implemented_local_runtime_pending |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

この Phase は issue #998 の根本問題を production まで解決する実装仕様書を、Phase 12 strict 7 形式で検証可能な形へ固定する。本ファイルはルート直下の Phase 12 適合性サマリーであり、`outputs/phase-12/` 配下の strict 7 への索引として機能する。

## 実行タスク

- production flag 変更（Task A）を実装サイクル内のコード変更として記録する。
- staging / production runtime ops（Task B/C）を Gate-C user-gated として明示する。
- strict 7 outputs の生成と present 状態を確認する。

## 参照資料

- 依存 Phase: phase-01 / Phase 1, phase-02 / Phase 2, phase-03 / Phase 3, phase-10 / Phase 10, phase-11 / Phase 11
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- 親ワークフロー: `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/`

## 成果物

- 本 Phase ファイル
- `outputs/phase-12/` strict 7（下表）

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。
- [x] strict 7 outputs が present。

## 不変条件チェック

| Invariant | 該当 | 適合状況 |
|-----------|------|----------|
| #1 実フォーム schema をコードに固定しない | 関連 | flag 変更のみ。schema fix なし |
| #2 consent キー = publicConsent / rulesConsent | 関連 | 既存 consent 値のみ参照（policy 不変） |
| #3 responseEmail = system field | 非該当 | 触らず |
| #5 D1 直接アクセスは apps/api 内 | 関連 | apps/web 変更なし。backfill / diagnostics は apps/api 内 |
| #6 GAS prototype 非昇格 | 非該当 | |
| #7 Form 再回答が更新経路 | 関連 | 既存 sync 維持 |
| #8 *.spec.ts 命名 | 関連 | 新規 spec 追加なし。既存 spec は全て .spec.ts |
| #9 admin FormField 経由 | 非該当（admin UI 変更なし） | |
| #10 admin mutation hook 統一 | 非該当 | |

## ユーザー指定 vs 実態判定

ユーザー指示は「issue #998 を production まで根本解決」。これは `apps/api/wrangler.toml` の production flag 変更（コード変更）を伴うため **実装仕様書としてデフォルト通り作成**（CONST_004 / CONST_005）。runtime ops（deploy / backfill apply / browser smoke）は本質的な user-gated 分離（`governance_mutation_user_gate=true`）として runbook 化する。

## CONST_007 準拠

Task A（`wrangler.toml` 1 行 + 既実装回帰）は実装サイクル内で完遂対象。先送りなし。Task B/C の runtime ops は「分量が多い」ためではなく Cloudflare secret + 本番 D1 mutation を伴う本質的な user-gated 分離であり、runbook を本サイクルで確定し、実行のみ承認待ちとする。

## Canonical 9 headings (root level)

このファイルは task-specification-creator skill の Phase 12 strict 7 形式に従う:

1. Main spec — `outputs/phase-12/main.md`
2. Implementation guide reflection — `outputs/phase-12/implementation-guide.md`
3. System spec update summary — `outputs/phase-12/system-spec-update-summary.md`
4. Documentation changelog — `outputs/phase-12/documentation-changelog.md`
5. Unassigned task detection — `outputs/phase-12/unassigned-task-detection.md`（0 件想定。conditional follow-up 注記あり）
6. Skill feedback report — `outputs/phase-12/skill-feedback-report.md`
7. Phase 12 task spec compliance check — `outputs/phase-12/phase12-task-spec-compliance-check.md`

## Phase 12 strict 7 索引

| # | Classification | Path | Status |
| --- | --- | --- | --- |
| 1 | main | outputs/phase-12/main.md | present |
| 2 | implementation guide | outputs/phase-12/implementation-guide.md | present |
| 3 | system spec update summary | outputs/phase-12/system-spec-update-summary.md | present |
| 4 | documentation changelog | outputs/phase-12/documentation-changelog.md | present |
| 5 | unassigned task detection | outputs/phase-12/unassigned-task-detection.md | present |
| 6 | skill feedback report | outputs/phase-12/skill-feedback-report.md | present |
| 7 | compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md | present |

## 関連 issue / workflow

- 親系統: `docs/30-workflows/completed-tasks/members-not-displaying-form-sync-investigation/`
- 関連 CLOSED issue: #956 (H1), #957 (H2), #958 (H3 UX), #959 (H4)
- 本 issue: #998 — **CLOSED**（PR 文脈は `Refs #998` のみ）。production rollout で根本解決する。
