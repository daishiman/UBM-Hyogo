# Phase 11: 手動テスト

| 項目              | 値                                                                 |
| ----------------- | ------------------------------------------------------------------ |
| Phase             | 11 / 13                                                            |
| 名称              | 手動テスト                                                         |
| 状態              | implemented_local_evidence_captured                                |
| 作成日            | 2026-05-28                                                         |
| visualEvidence    | NON_VISUAL                                                         |
| NON_VISUAL 宣言   | UI 表示物の意匠変更なし。DOM 出し分けは `data-auth-state` 属性 grep + vitest で代替する |
| 主証跡            | focused Vitest log（TC-01 / TC-02 / TC-03 / TC-04 / TC-05）と typecheck/lint/build log |
| 代替証跡          | grep gate（旧 `<PublicHeader />` 残存ゼロ / `await getAuthView()` 1 件） |

## 1. 実施情報

| 項目         | 値                                                  |
| ------------ | --------------------------------------------------- |
| 実施環境     | local（worktree `task-20260528-133914-wt-4`）       |
| 実施日       | 2026-05-28                                           |
| 実施者       | Codex                                                |
| 自動テスト件数 | focused Vitest 3 files / 9 tests PASS                |

## 2. 仕様判断根拠

- UI/UX の意匠変更なし（NON_VISUAL）→ スクリーンショット不要
- DOM 差分は `data-auth-state="guest"` / `data-auth-state="member"` の属性切替のみで、Phase 4 vitest が assert する
- staging runtime の 200 / セッション別 DOM 確認は user-gated（Cloudflare 環境）

## 3. NON_VISUAL evidence inventory

| #   | Classification        | Path                                                                | Status   | 備考                                              |
| --- | --------------------- | ------------------------------------------------------------------- | -------- | ------------------------------------------------- |
| 1   | manual test result    | `outputs/phase-11/manual-test-result.md`                            | present  | local gate summary                                |
| 2   | canonical paths       | `outputs/phase-11/canonical-paths.json`                             | present  | implementation / test / evidence path inventory   |
| 3   | focused Vitest log    | `outputs/phase-11/evidence/focused-vitest.log`                      | present  | 3 files / 9 tests PASS                            |
| 4   | static source guard   | `outputs/phase-11/evidence/static-source-guard.log`                 | present  | root wiring + public layout wiring verified        |
| 5   | web typecheck         | `outputs/phase-11/evidence/typecheck.log`                           | present  | `pnpm typecheck` PASS                             |
| 6   | web lint              | `outputs/phase-11/evidence/web-lint.log`                            | present  | `pnpm lint` PASS                                  |
| 7   | OpenNext build        | `outputs/phase-11/evidence/web-build.log`                           | present  | `pnpm --filter @ubm-hyogo/web build` PASS         |

## 4. Runtime evidence（user-gated）

| #   | Runtime Evidence              | Path                                                                | Boundary               |
| --- | ----------------------------- | ------------------------------------------------------------------- | ---------------------- |
| 1   | staging `/` curl              | `outputs/phase-11/evidence/staging-root-curl.log`                   | pending_user_approval  |
| 2   | staging `/` tail clean        | `outputs/phase-11/evidence/staging-root-tail.log`                   | pending_user_approval  |
| 3   | session 切替 DOM observation  | `outputs/phase-11/evidence/staging-root-data-auth-state.txt`        | pending_user_approval  |

## 5. workflow_state 昇格条件

Phase 11 local evidence #1〜7 が `present` になったため、`artifacts.json.metadata.workflow_state` は `implemented_local_evidence_captured`。staging runtime evidence #1〜3 が揃った時点で Gate-B `passed` に更新する。

## 6. 既知制限リスト

- staging Cloudflare Workers deploy は本 spec 範囲外（user-gated）
- session を持つ実 user での画面確認は user-gated
