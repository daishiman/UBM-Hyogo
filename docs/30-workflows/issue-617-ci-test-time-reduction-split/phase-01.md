# Phase 1: 要件定義 / Gate 整理 / 真の論点

## 目的

Issue #617 拡張版の要件を確定する。原 trigger は「軸 B / 軸 D の組み合わせでも CI 時間が許容外な場合のみ着手」だったが、ユーザー要望で `apps/web` 含む CI 全体の test 時間短縮にスコープ拡張する。

## 状態

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |
| evidence_state | LOCAL_EVIDENCE_PARTIAL_CI_RUNTIME_PENDING |

## 真の論点

- 論点 1: スコープを apps/api 内部に閉じるか、CI 全体に広げるか
  - 結論: ユーザー要望に基づき **CI 全体（apps/web / apps/api unit / apps/api d1 / packages）の matrix 並列化**まで含める。
- 論点 2: vitest config 分割 vs projects 機能のどちらを採用するか
  - 結論: Phase 2 で技術選定。本 Phase では「coverage v8 merge との相性が確認できる方式を優先」とだけ確定。
- 論点 3: D1 依存 test の機械判定ルール
  - 結論: 三段判定。(1) `env.DB` / `D1Database` の型参照 (2) `setupD1` / Miniflare D1 setup の import (3) ファイル名規約（`*.d1.test.ts`）。三段のいずれかに該当すれば D1 group。
- 論点 4: coverage 閾値の扱い
  - 結論: 既存 80% を**維持**。merge 後の `coverage-summary.json` で判定。
- 論点 5: 既存 `test:coverage` script の後方互換
  - 結論: `apps/api/test:coverage` は **unit + d1 を実行して merge する wrapper** に置き換える。lefthook / pre-push / 既存ドキュメントからの呼び出しは破壊しない。

## Gate

- Gate-1: 既存 `apps/api/test:coverage` で port exhaustion が再発していないこと → 実装後に `outputs/phase-11/before-after.md` へ raw command / exit code / grep 結果を保存する。仕様作成時点では `runtime_pending`。
- Gate-2: coverage 閾値が現状で 80% を満たしていること → 実装前 baseline は `bash scripts/coverage-guard.sh --no-run` または現行 CI `coverage-gate` run から取得し、実測 path を Phase 11 に保存する。
- Gate-3: CI で matrix 化が許容コスト内であること → wall-clock だけでなく billed minutes も `gh run view --json jobs` から記録する。
- Gate-4: required status check drift がないこと → Phase 9 では `coverage-gate-shard` を matrix job にし、最終集約 job 名 `coverage-gate` を維持するため branch protection mutation は不要。

## 完了条件

- 論点 1-5 の結論が記録されている
- Gate-1〜3 の確認方法が明示されている

## 参照

- `index.md`（本仕様書）
- `docs/30-workflows/completed-tasks/issue-577-api-coverage-rerun-miniflare-port-exhaustion/`
