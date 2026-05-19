# dev sync — UT-07C-FU-001 feature branch ← dev 2026-05-19 自律解消記録

`feat/ut-07c-followup-001-attendance-csv-import` に `origin/dev` を取り込んだ際、skill 系 4 conflict + 実装側で `verify:static-manifest` の sourceSpecHash drift が CI で発生していたため、自律解消の手順を記録する。

## 発生 conflict（skill 側）
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` — 3-way block（HEAD: UT-07C-FU-001 entry / base 空 / dev: 2026-05-19 wave 14 entry）
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`

`pnpm sync:resolve` で 3 件は union driver 自動解消、`LOGS/_legacy.md` のみ手動 union（時系列で dev 側 entry を先頭、HEAD 側 UT-07C entry を後段に連結）。

## 発生 CI 失敗（実装側 — dev 取り込み後に判明）
- `verify-static-manifest` で `sourceSpecHashDrift`
  - expected (HEAD 側コミット時点): `sha256:383ad101...`
  - actual (dev 取り込み後): `sha256:94845077...`
  - 原因: dev 取り込みで `apps/api/src/sync/*.ts` の source spec が更新されたため、生成済み `apps/api/src/repository/_shared/generated/static-manifest.json` が陳腐化
  - 解消: `pnpm regenerate:static-manifest` を実行し、生成物を merge commit と同 wave で commit

## 再確認した不変
- dev 取り込みで `apps/api/src/sync/**`、`packages/shared/src/zod/**`、`apps/api/src/repository/_shared/**` の source が更新された場合、ローカル `verify:static-manifest` を merge commit の直後に走らせて `sourceSpecHashDrift` を先回り検出する。
- `LOGS/_legacy.md` の 3-way block は L-DEVSYNC-012「追記型 conflict は両側採用」ルールで時系列 union 解消する（`pnpm sync:resolve` の unhandled は仕様）。

## 適用先
- このスキル: 上記不変を `pr-pre-flight-ci-gate-checklist.md` 既存項目に統合済み（drift パターン追加は不要、ローカル `pnpm regenerate:static-manifest` 経路の再確認のみ）。
- `task-specification-creator` skill: dev-sync 時の generated artifacts drift 検出パターンとして同日 changelog を追加。
