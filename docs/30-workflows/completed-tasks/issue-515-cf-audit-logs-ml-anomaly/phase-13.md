# Phase 13: PR 作成

## 目的

ユーザー承認後に PR を作成する。Issue #515 は閉じない（`Refs #515` のみ）。

## 多段ゲート（NON_VISUAL の二重承認）

| Gate | 内容 | 承認方法 |
| --- | --- | --- |
| G1 | spec 完了 + staging apply 完了 evidence | ユーザー明示 OK |
| G2 | secret leakage grep の positive / clean 両方 PASS evidence | ユーザー明示 OK |
| G3 | commit / push 承認 | ユーザー明示 OK |
| G4 | PR open 承認 | ユーザー明示 OK |

各 Gate を独立に承認させ、合算承認は禁止。

## PR 構成

- Title: `feat(cf-audit-log): introduce Classifier abstraction and offline evaluation harness (Refs #515)`
- Base: `main`
- Body 必須項目:
  - Summary: 本サイクル実装スコープ（classifier 抽象 + evaluation + redacted feature extractor + staging migration apply）
  - Out of scope: 学習データ取得 / モデル学習 / production 切替（Gate 通過後）
  - Refs #515（Closes は使わない）
  - Test plan: typecheck / lint / focused vitest / offline replay JSON / leakage grep / staging PRAGMA
  - Rollback: `gh variable set CF_AUDIT_CLASSIFIER --body "threshold"` 1 step
  - Migration: staging applied / production deferred to gate-passing follow-up
  - Evidence: `outputs/phase-11/` への path
  - Skill / SSOT updates: SSOT 3 + LOGS 2

## 禁止事項

- Issue #515 の `Closes #515` 記述
- Issue 状態の自動変更（reopen / close）
- production migration apply / production env 切替を本 PR に含めること
- `--no-verify` 系 hook skip

## 完了条件

- [ ] G1〜G4 各承認をユーザーから取得
- [ ] PR open 後 URL を `outputs/phase-13/main.md` に記録
- [ ] PR body に Refs #515 含む
- [ ] PR が production secret / token / model artifact を含まない

## 出力

- `outputs/phase-13/main.md`

## 参照資料

- `index.md`
- `phase-11.md` ・ `phase-12.md`
- CLAUDE.md `## PR作成の完全自律フロー`（NON_VISUAL では多段承認を優先するため、本 Phase はユーザー承認待ちで停止する）

## 統合テスト連携

- 不要（PR open 自体）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 13 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 13-1 | この Phase の契約を確定する |
| 13-2 | skill 定義と正本仕様への整合を確認する |

## 成果物/実行手順

- Phase 本文の出力パスへ成果物を配置する。
- 実装時は Phase 11 evidence と Phase 12 strict outputs に同期する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 の成果物を上流契約として参照する。
