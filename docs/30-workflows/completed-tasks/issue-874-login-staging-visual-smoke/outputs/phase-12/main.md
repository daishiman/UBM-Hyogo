**[実装区分: 実装仕様書 / 状態: implemented_local_runtime_pending]**

# Phase 12: ドキュメント更新 / strict 7 集約

## 状態

- workflow_state: `implemented_local_runtime_pending`
- implementation_status: `local_validation_ready_staging_pending`
- taskType: `implementation`
- visualEvidence: `VISUAL`
- runtime boundary: staging deploy / staging smoke / PNG capture / commit / push / PR は user-gated

## Part 1: 中学生レベル概念説明

文化祭の本番前に、教室で作った看板を体育館でも見てみるような作業です。教室ではきれいに見えても、体育館の明かりや広さが違うと、文字の見え方が変わることがあります。

今回の `/login` 画面も、手元の環境では確認済みです。ただし公開前の試し打ち環境でも同じように見えるかは、実際に画面写真を撮って確認する必要があります。

そのため、画面写真の保存場所を切り替えられるようにし、試し打ち環境用の実行コマンドを1つ用意しました。本番公開や外部環境の変更は、ユーザー承認後だけにします。

## Part 2: 技術者レベル要約

`apps/web/playwright/tests/login-smoke.spec.ts` の `EVIDENCE_DIR` は `process.env.PLAYWRIGHT_EVIDENCE_DIR` を優先し、未指定時は親 workflow の local screenshot path を維持する。これにより local baseline と staging evidence を同一 spec で物理分離できる。

`scripts/run-login-staging-smoke.sh` は `PLAYWRIGHT_SKIP_WEB_SERVER=1`、`PLAYWRIGHT_STAGING_BASE_URL`、`PLAYWRIGHT_EVIDENCE_DIR` を設定し、`pnpm --dir apps/web exec playwright test playwright/tests/login-smoke.spec.ts --project=staging --grep 'renders LoginCard|captures mobile input' --reporter=line` を実行する薄い wrapper に限定した。deploy は含めず、user-gated のまま分離する。

Phase 11 runtime artifact は未取得のため、終端状態は `completed` ではなく `implemented_local_runtime_pending` とする。staging evidence 7 PNG と visual diff note が揃った時点で `implemented_staging_visual_evidence_captured` へ昇格できる。

## Local validation

- `bash -n scripts/run-login-staging-smoke.sh`
- `bash scripts/run-login-staging-smoke.sh` は URL 未指定時に usage + exit 1
- `PLAYWRIGHT_STAGING_BASE_URL=http://example.test bash scripts/run-login-staging-smoke.sh` は https 以外を拒否
- `pnpm --filter @ubm-hyogo/web typecheck`
- `pnpm verify:phase12-compliance -- docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke`

## 重要不変条件

- `apps/web/playwright.config.ts` は改変しない。既存 `staging` project を再利用する。
- `scripts/run-login-staging-smoke.sh` は deploy / secret mutation / PR 操作を実行しない。
- Phase 11 inventory の `present` 行は物理ファイルがある場合だけ使い、未実行 runtime evidence は `pending` に留める。
- strict 7 は `outputs/phase-12/` に正規ファイル名で配置する。

## 次 Phase への引き継ぎ

Phase 11 で user 承認後に staging deploy、warm-up、smoke、PNG inventory、visual diff note を取得する。取得後は Phase 11 inventory と本 strict 7 を同 wave で `present` / `implemented_staging_visual_evidence_captured` に更新する。
