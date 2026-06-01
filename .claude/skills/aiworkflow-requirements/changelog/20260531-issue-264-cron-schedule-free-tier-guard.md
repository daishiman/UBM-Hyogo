# 2026-05-31 issue-264 cron schedule free-tier guard

Issue #264 を `implemented_local_evidence_captured / implementation / NON_VISUAL` として同期。

- `apps/api/src/sync/wrangler-cron-schedule.guard.spec.ts` を追加し、`apps/api/wrangler.toml` の default / staging / production cron schedule を canonical 3 本へ固定。
- legacy Sheets hourly cron `0 * * * *` は runtime cron ではなく手動互換経路としてのみ扱うことを `deployment-cloudflare.md` に再同期。
- workflow root / Phase 12 strict 7 / artifact inventory / quick-reference / resource-map / task-workflow-active を同一 wave で反映。
- Focused Vitest 16 PASS、package-script apps/api suite 76 files / 481 tests PASS。
- 苦戦点を `lessons-learned/lessons-learned-issue-264-cron-schedule-free-tier-guard-2026-05.md`（L-I264-001..008）に記録。zero-dep TOML 正規表現パースの section header 部分文字列衝突（`[triggers]` ⊂ `[env.staging.triggers]` → `^\[name\]$` 行アンカー）、`match.index===0` falsy 判定、`[` `]` `.` メタ文字の二段正規化、コメント除去順序、複数行配列 `[^\]]*` キャプチャ、次 section 上界、CLOSED/obsolete issue の再スコープ、文書 vs guard enforcement（CONST_004）を整理。
- 参照実装 drift 注記: Phase 12 implementation-guide 初稿の `extractCrons` 素朴 `indexOf` 版は shipped のアンカー正規表現版と乖離。正本は shipped 実装。
- task-specification-creator の `references/patterns-lessons-and-pitfalls.md` に zero-dep 設定ファイル guard パターン（SP-CFGUARD-001..006）を汎化。
- Optional staging cron tail、commit、push、PR、Issue mutation は user-gated。
