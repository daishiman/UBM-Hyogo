# Unassigned Task Detection — issue-1081-bulk-tag-real-d1-runtime-smoke

> 0 件でも出力必須。本タスク本体の成果物（runner / seed・cleanup SQL / CI job / local test）は**先送りせず本 cycle で実装完了**。以下は本体スコープと分離した将来候補のみを列挙する。

## 設計タスク 4 パターン チェック

| パターン | チェック観点 | 検出 |
| -------- | ------------ | ---- |
| 型 → 実装 | 仕様に定義した型/関数（runner 関数群 / contract shape）に未実装の宣言が残らないか | 0 件（成果物は本体スコープ内で実装済み） |
| 契約 → テスト | 実 contract（results[].status / audit parity）に対応する local test ケースが設計されているか | 0 件（Phase 4/6 で AC-1〜AC-7 を TC/FP/G に対応付け済み） |
| UI → component | UI route / component の不足 | 0 件（NON_VISUAL・UI 変更なし） |
| 仕様書間差異 | Phase 1/5/10 と本 strict 7 の contract / prefix / パッケージ名の不整合 | 0 件（`@ubm-hyogo/api` / `e2e_test_issue1081_` / results[].status で全 phase 統一） |

## ソース別 検出結果

| ソース | 検出 | 内容 |
| ------ | ---- | ---- |
| 元タスク仕様書（スコープ外） | 候補 3 件 | 下記 UT-CANDIDATE-1/2/3（全て本体 AC 射程外・別関心） |
| Phase 3/10 レビュー MINOR | 3 件 | Phase 10 M-1/M-2/M-3 と一致（下記候補に対応） |
| Phase 11 手動テスト発見 | 0 件 | spec 段階のため runtime 発見なし |
| コードコメント TODO/FIXME | 0 件 | 新規 runner / test / SQL に TODO/FIXME なし |
| describe.skip 残存 | 0 件 | — |

## 未タスク候補（本体スコープと分離・将来候補）

### UT-CANDIDATE-1: production bulk tag runtime smoke 拡張

- 概要: staging で本 gate 確立・安定運用後、production への bulk tag mutation smoke へ拡張する。
- 今サイクル外の理由: 本タスクは staging 固定（`--env staging`）。production への bulk mutation は allowlist subject + 専用 test fixture 設計が別途必要で、issue #1081 scope に含まれない。
- 実施時期 / 場所: staging gate の実証 + 安定運用後。別 Issue 候補（Phase 12 detection を 2 回検証一致で取り次第 user-gated 起票）。

### UT-CANDIDATE-2: audit_log correlation_id index 最適化

- 概要: `audit_log` に correlation_id 列が無く、batchId は `after_json` / `before_json` の `json_extract` 経由でしか相関できない。bulk 相関 query の index 最適化。
- 今サイクル外の理由: 親 issue-1036 の軽量方針（schema を重くしない）に従い別関心。本タスクの audit count query は `target_id LIKE 'e2e_test_issue1081_%'` で成立し、index 最適化は smoke gate の AC に含まれない。
- 実施時期 / 場所: bulk 相関 query の運用負荷が顕在化した時点で別 Issue。schema 変更を伴うため親 issue-1036 の方針整合が前提。

### UT-CANDIDATE-3: smoke 共通 lib 抽出（`scripts/smoke/lib/smoke-common.sh`）

- 概要: `assert_target` / `fail_and_exit` / redact 経由ログ / summary.json 出力など runner 間で重複する機構を共通 lib へ抽出。
- 今サイクル外の理由: YAGNI。現状 runner は attendance / admin-web / 本タスクの 3 本だが、抽出は 3 本目以降の重複が安定した時点で行うのが妥当。先行抽出は過剰設計で本タスク AC に含まれない。
- 実施時期 / 場所: 4 本目の runner 追加または共通機構の drift 顕在化時点で refactoring タスクとして別 Issue。

## 本体スコープの分離宣言

- UT-CANDIDATE-1/2/3 は本タスク AC-1〜AC-7 の**射程外**であり、本体成果物（runner / seed・cleanup SQL / CI job / local test）の先送りではない。本体は本 cycle で実装済み（CONST_007）。
- 各候補は Phase 12 detection の 2 回検証一致を取った上で、必要なら user-gated で Issue 化する（本仕様書作成では起票しない）。
