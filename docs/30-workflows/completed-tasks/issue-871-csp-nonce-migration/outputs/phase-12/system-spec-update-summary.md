# Phase 12: system spec 更新サマリ

## 1. 方針

CSP nonce 化は production 挙動に関わるため、実コードと system spec を同一サイクルで同期した。本サイクルでは `docs/00-getting-started-manual/specs/` ではなく、当該正本を持つ `.claude/skills/aiworkflow-requirements/references/security-web-response-headers.md` を更新対象にした。

## 2. 更新内容

| 対象 | 変更 |
|-------------|------|
| `.claude/skills/aiworkflow-requirements/references/security-web-response-headers.md` | U-AWSHH-002 を user-gated follow-up から current local implementation に昇格。nonce flow、directive、`style-src-attr` 過渡境界、user-gated runtime boundary を追記 |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-871-csp-nonce-migration-artifact-inventory.md` | workflow artifact inventory を新規追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` / `resource-map.md` | issue #871 lookup entry を追加 |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | dated changelog row を追加 |

## 3. Current contract

1. middleware は request ごとに 16 random bytes の base64 nonce を生成し、request header `x-nonce` / request CSP / response CSP に注入する。
2. response CSP は `Content-Security-Policy-Report-Only` のまま維持する。
3. `script-src` は `script-src 'self' 'nonce-<n>' 'strict-dynamic'`。
4. `style-src` / `style-src-elem` は nonce を要求する。
5. 既存 `style={{...}}` 互換は `style-src-attr` に分離する。これは完全撤去前の明示的な過渡境界であり、script/style element の nonce 化とは別扱い。
6. literal `'unsafe-inline'` は `apps/web/src` / `apps/web/middleware.ts` / middleware focused spec に置かない。grep gate で 0 hit を維持する。

## 4. 残る user-gated 境界

staging/production response verification、route violation-zero smoke、commit、push、PR は Phase 13 承認後に実施する。
