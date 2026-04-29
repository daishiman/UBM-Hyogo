# Skill Feedback Report

## task-specification-creator

Phase 12 outputs 7 ファイル必須と root / outputs `artifacts.json` parity を同 wave で閉じる必要がある。

## aiworkflow-requirements

新規 API contract は Step 2 REQUIRED。`docs/00-getting-started-manual/specs/01-api-schema.md` を同期対象として扱う。

## scripts/cf.sh / Cloudflare 運用

`HEALTH_DB_TOKEN` Secret 投入、deploy、tail、D1 sanity check は `wrangler` 直接実行ではなく `bash scripts/cf.sh ... --config apps/api/wrangler.toml --env <env>` に統一する。WAF allowlist 内は apps/api 401、allowlist 外は WAF 403 として smoke を分離する必要がある。
