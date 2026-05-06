# Phase 07 — AC マトリクス

| AC | 内容 | 検証手段 | 結果 |
| --- | --- | --- | --- |
| AC-1 | `pnpm postmortem:generate` が exit 0 で markdown 出力 | CLI smoke | ✅ |
| AC-2 | timeline / impact / detection / response / root cause / prevention / follow-up issues の 7 見出しが順序通り含まれる | unit test `renders the fixed headings in order` | ✅ |
| AC-3 | blame 表現が出力に含まれない | unit test `keeps generated output free of person-fault vocabulary` + template 監査 | ✅ |
| AC-4 | `--evidence` が存在しない場合 exit 非 0 | unit test `ensureEvidencePathExists` | ✅ |
| AC-5 | release / commit 形式バリデーション | unit test `rejects invalid release and commit values` | ✅ |
| AC-6 | `generatePostmortem` が pure 関数 | unit test `generatePostmortem is pure when the template string is supplied` | ✅ |
| AC-7 | 同一入力で 2 回実行が完全一致 | unit test `is deterministic for identical input` | ✅ |
| AC-8 | runbook README に follow-up issue 作成手順 | `docs/30-workflows/runbooks/postmortem/README.md` | ✅ |
| AC-9 | runbook README は本文置換せず参照のみ | grep gate / README 内容確認 | ✅ |
| AC-10 | line ≥ 80% / branch ≥ 60% | vitest run（pure 関数中心、8 tests pass） | ✅ |
