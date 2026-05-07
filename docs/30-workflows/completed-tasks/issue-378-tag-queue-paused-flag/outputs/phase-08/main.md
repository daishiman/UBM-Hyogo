# Phase 08 — 結合 / Integration Notes

`sync-forms-responses` は per-sync で env を 1 度だけ `parsePaused` し、その boolean を `enqueueTagCandidate` 呼び出しのたびに渡す。
sync 中に env が変わることはないため、per-call 評価ではなく per-sync 評価で十分。

production 切替手順は runbook（`docs/30-workflows/runbooks/tag-queue-pause.md`）に集約。
切替経路は wrangler.toml `[env.production.vars]` 編集 → `scripts/cf.sh deploy --env production` のみ。
