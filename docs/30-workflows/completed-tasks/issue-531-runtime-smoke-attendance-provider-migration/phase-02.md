# Phase 2: 設計

## route inventory（AC-1）

`outputs/phase-02/route-inventory.md` に以下を記録する。

### admin（`apps/api/src/routes/admin/members.ts`）

| method | path | source line | DI-bound evidence | attendance hydrate |
| --- | --- | --- | --- | --- |
| GET | `/admin/members` | members.ts:212 | no | no（list summary。`members[]` / `total` / `page` / `pageSize` を検証） |
| GET | `/admin/members/:memberId` | members.ts:305 | yes | yes |
| GET | `/admin/members/:memberId/attendance` | members.ts:336 | no（route-local provider） | pagination response（`records[]` / `hasMore` / `nextCursor` を検証） |

### me（`apps/api/src/routes/me/index.ts`）

| method | path | source line | DI-bound evidence | attendance hydrate |
| --- | --- | --- | --- | --- |
| GET | `/me/` | index.ts:72 | no | no（self summary only） |
| GET | `/me/profile` | index.ts:90 | yes | yes |
| GET | `/me/attendance` | index.ts:122 | no（route-local provider） | pagination response（`records[]` / `hasMore` / `nextCursor` を検証） |
| POST | `/me/visibility-request` | index.ts:163 | no | no（queue accept） |
| POST | `/me/delete-request` | index.ts:199 | no | no（queue accept） |

## smoke 順序（決定論的）

1. `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/api test`（local PASS 5 点を先に確定）
2. `bash scripts/cf.sh whoami` で staging account 認証確認
3. `bash scripts/smoke/runtime-attendance-provider.sh staging` 実行
  - admin smoke: GET /admin/members (`members[]`) → /admin/members/:memberId (`attendance[]`, DI-bound) → /admin/members/:memberId/attendance (`records[]`, route-local provider)
  - me smoke: GET /me/ (`user.memberId`) → /me/profile (`profile.attendance[]`, DI-bound) → /me/attendance (`records[]`, route-local provider)
  - POST smoke は実行しない。visibility/delete request は DB write を伴うため、本タスクでは `scope out` として contract-only に留める
4. `scripts/smoke/runtime-attendance-provider.sh` が `mktemp` 配下の一時 body を `jq` で検証し、persistent evidence として status / contract / count summary だけを `runtime-smoke.log` に保存
5. token/cookie pattern は `outputs/phase-11/evidence/*.log` 全体で、PII/raw body pattern は `runtime-smoke.log` で検出しないことを `grep-gate.log` に記録（AC-5）

## evidence / redact 方針（AC-5）

永続 evidence は raw response body を保存しない。`runtime-smoke.log` に残してよい値は route label、HTTP status、jq contract、array length / type summary のみ。

`scripts/smoke/redact.sh` は補助 filter として以下を `[REDACTED]` に置換する:

| pattern | 置換例 |
| --- | --- |
| `^Set-Cookie: .*` | `Set-Cookie: [REDACTED]` |
| `^authorization: .*` (大小無視) | `authorization: [REDACTED]` |
| `Bearer [A-Za-z0-9._-]+` | `Bearer [REDACTED]` |
| `cf-_session=[^;]+` | `cf-_session=[REDACTED]` |
| `__Secure-authjs[^=]*=[^;]+` | `__Secure-authjs...=[REDACTED]` |
| JSON 内 `"sessionToken":"..."` 等 | `"sessionToken":"[REDACTED]"` |

## evidence canonical path

```
outputs/phase-11/evidence/
├── typecheck.log         # pnpm typecheck の stdout/stderr 全文
├── lint.log              # pnpm lint
├── test.log              # pnpm --filter @ubm-hyogo/api test（throw assertion PASS を含む）
├── build.log             # pnpm build（apps/api）
├── grep-gate.log         # secret / PII leak 検査結果
└── runtime-smoke.log     # summary-only curl smoke 結果
```

## AC ↔ Phase マッピング

| AC | 主担当 Phase |
| --- | --- |
| AC-1 | Phase 2（本ファイル）/ Phase 11 evidence 化 |
| AC-2, AC-3 | Phase 5（実装）/ Phase 11（runtime evidence）。route ごとの response contract は本ファイルの inventory を正本にする |
| AC-4 | Phase 8（test 実行）/ Phase 11 |
| AC-5 | Phase 5（redact 実装）/ Phase 11 grep-gate |
| AC-6 | Phase 12（親タスク state 境界維持） |
| AC-7 | Phase 7 / 8 / 11 |
| AC-8 | Phase 12 |
| AC-9 | Phase 13 |

## 完了条件

- route inventory / smoke 順序 / redact 規則 / evidence canonical path が本ファイルと `outputs/phase-02/route-inventory.md` に確定
- 全 AC が後続 Phase に紐づいていること
