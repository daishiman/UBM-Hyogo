# 未割当タスク: CODEOWNERS validator CI gate 導入

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-codeowners-validator-ci-001 |
| 作成日 | 2026-04-29 |
| 起点 | docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/unassigned-task-detection.md (C-1) |
| 種別 | infrastructure_governance / NON_VISUAL |
| 優先度 | Medium |
| 状態 | unassigned |
| 関連 | UT-GOV-003 (CODEOWNERS), UT-GOV-004 (required status checks context sync) |

## 背景

UT-GOV-003 で `.github/CODEOWNERS` の整備と Phase 11 manual smoke (`gh api .../codeowners/errors`) を仕様レベルで固定したが、CI レイヤで CODEOWNERS 構文・存在 owner・パス整合を継続検証する gate が未整備のままになっている。手動 smoke は PR ごとに実走しないため、`@<unknown-handle>` の誤記や glob 表記揺れが merge 後に顕在化するリスクがある。

UT-GOV-004（required status checks context sync）と context 名を整合させる必要があるため、本タスク単体では確定できない部分（`required_status_checks.contexts` への追加）は UT-GOV-004 に申し送る。

## スコープ

### 含む

- `.github/workflows/verify-codeowners.yml` の新設（`on: pull_request` で起動）
- `gh api repos/{owner}/{repo}/codeowners/errors` 相当の検証ステップ（`{"errors": []}` を期待）
- 任意で `mszostok/codeowners-validator` action 採用検討（owner 存在チェック / glob 検証を補強）
- 失敗時の PR コメント / log への期待 JSON 表示
- workflow context 名の決定（UT-GOV-004 へ申し送る name 文字列を仕様書に明記）

### 含まない

- `required_status_checks.contexts` への追加（UT-GOV-004 で実施）
- `.github/CODEOWNERS` 本体の編集（UT-GOV-003 で完了済）
- `require_code_owner_reviews=true` 切替（task-codeowners-require-reviews-runbook-001 で扱う）
- D1 / Cloudflare 関連変更

## 受入条件

- AC-1: PR 作成時に `verify-codeowners` workflow が自動実行される
- AC-2: CODEOWNERS に構文エラーまたは未知 owner があると job が `failure` で停止する
- AC-3: 正常時の workflow log に `gh api .../codeowners/errors` の `{"errors": []}` 相当が記録される
- AC-4: workflow context 名が UT-GOV-004 の `required_status_checks.contexts` 候補と整合する形で文字列固定されている（仕様書内 §context-name 参照可）
- AC-5: secrets に追加 token を要求しない（`secrets.GITHUB_TOKEN` のみで動作）

## 苦戦箇所（UT-GOV-003 で確認）

- **中間ケース判定**: 「実装タスクだが本ワークフローでは仕様書整備に閉じる」ケースのため、Phase 11 の `phase-template-phase11.md` を docs-only として流用しつつ `status: NOT EXECUTED — 実適用 PR で実走` を毎回手書きする必要があった。本タスク実装時は実 PR で workflow を走らせて smoke ログを取る前提に戻る点に注意。
- **governance 系 grep 検証**: 期待 JSON `{"errors": []}` を manual-smoke-log.md に明記する慣習を本タスクで踏襲し、CI 実走でも同じ文字列を log に残すこと。
- **action 選定**: `mszostok/codeowners-validator` は owner 存在検証に GH Token の `read:org` scope が必要な場合がある。public repo + solo 運用では `gh api` 直接呼び出しの方が Token 要件が軽い可能性が高く、初版は最小構成（`gh api` 直叩き）を選び、必要に応じて action 化する判断を推奨。

## 参照

- `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-12/`
- `docs/30-workflows/ut-gov-003-codeowners-governance-paths/outputs/phase-11/`（manual smoke 仕様）
- `.github/CODEOWNERS`
- 関連 Issue: #146（UT-GOV-003 親）
