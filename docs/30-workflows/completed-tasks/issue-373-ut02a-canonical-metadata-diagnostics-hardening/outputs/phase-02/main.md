# Phase 2: 設計 — 実行結果

## 確定アーキテクチャ判断
1. スクリプト配置: `scripts/regenerate-static-manifest.mjs` / `scripts/verify-static-manifest.mjs`
2. manifest schema 拡張: `sourceSpecHash` (sha256:hex) / `sourceSpecVersion` (git short SHA, fallback `"deterministic"`)
3. キー順序: `$comment, source, sourceSpecVersion, sourceSpecHash, generatedAt, regenerateCommand, retirementCondition, sections, fields`、sections は position 昇順、fields は stableKey 辞書順
4. `buildSectionsWithDiagnostics()` で `apps/api/src/lib/logger.ts` の `logWarn({ code: "UBM-MANIFEST-UNKNOWN-KEY", count, stableKeys })` を呼ぶ
5. CI gate は `.github/workflows/ci.yml` の Lint step 直後に追加
6. retirement 条件は `docs/00-getting-started-manual/specs/01-api-schema.md` 末尾に追記
