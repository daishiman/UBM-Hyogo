[実装区分: 実装仕様書]

# Phase 6: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| 機能名 | ut-15-waf-rate-limiting-rules-setup |
| 作成日 | 2026-05-09 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL（vitest console / coverage HTML / curl `-i` ログを採用）|
| scope | cloudflare_edge_security |
| 依存 | phase-04.md / phase-05.md（PASS 済み前提）|

## 目的

Phase 4 で確定した変更ファイル群と Phase 5 の実装手順を、実行可能なテストマトリクスに展開する。具体的には (a) unit テスト一覧、(b) integration / miniflare smoke、(c) E2E（staging）curl smoke、(d) coverage 目標、(e) テストファイル一覧と各ケースを Phase 9 / Phase 11 で再利用できる粒度に確定する。

## 1. テスト戦略の全体像

| レイヤー | 種別 | 対象 | 実行 tool | 自動 / 手動 |
| --- | --- | --- | --- | --- |
| L1 | unit | `edge-rate-limit-headers.ts` | vitest | 自動 |
| L2 | unit (snapshot) | `cf-waf-apply.sh --dry-run` 出力 | vitest（spawn） | 自動 |
| L3 | integration | 既存 `rate-limit-magic-link.ts` 互換維持 | vitest + miniflare | 自動 |
| L4 | integration | 429 + retry-after の wire format | vitest + miniflare | 自動 |
| L5 | E2E smoke | staging zone へ curl 連打 | curl + bash | 半手動（runbook 手順）|
| L6 | manual | Cloudflare Security Events で Simulate ログ確認 | dashboard | 手動（Phase 11 代替証跡）|

## 2. unit テスト一覧（L1: `edge-rate-limit-headers.test.ts`）

| TC 番号 | テスト名（describe / it 文字列）| 対象 | 期待 |
| --- | --- | --- | --- |
| TC-U-01 | `buildRateLimitedResponse > returns 429 status with retry-after header` | helper | `status === 429` && `headers["retry-after"] === "60"` |
| TC-U-02 | `buildRateLimitedResponse > preserves reason in body and header` | helper | `body.reason === "edge"` && `headers["x-ratelimit-source"] === "edge"` |
| TC-U-03 | `buildRateLimitedResponse > body matches { error, retryAfterSec, reason }` | helper | body shape strict 一致 |
| TC-U-04 | `buildRateLimitedResponse > sets cache-control no-store` | helper | `headers["cache-control"] === "no-store"` |
| TC-U-05 | `buildRateLimitedResponse > sets content-type application/json; charset=utf-8` | helper | header 完全一致 |
| TC-U-06 | `buildRateLimitedResponse > rejects retryAfterSec < 1` | helper | throw `TypeError` |
| TC-U-07 | `buildRateLimitedResponse > rejects non-integer retryAfterSec` | helper | throw `TypeError` |
| TC-U-08 | `toHonoResponse > returns Response with same status / headers / body` | helper | `Response` instance、JSON parse で body 一致 |

## 3. unit テスト一覧（L2: `cf-waf-apply/lib.test.ts`）

| TC 番号 | テスト名 | 対象 | 期待 |
| --- | --- | --- | --- |
| TC-U-10 | `cf-waf-apply --dry-run > emits diff JSON matching fixture` | spawn | stdout JSON が `__fixtures__/dry-run.snapshot.json` と一致 |
| TC-U-11 | `cf-waf-apply --dry-run > enforce mode normalizes managed ruleset mode to on` | spawn | stdout JSON の `mode` と `managedRuleset.mode` が enforce に揃う |
| TC-U-12 | `cf-waf-apply > rejects invalid mode` | spawn | `--mode bogus` で exit 1 |
| TC-U-13 | `cf-waf-apply > rejects missing mode` | spawn | `--mode` 省略で exit 1 |
| TC-U-14 | `cf-waf-apply --dry-run > exits 14 when CI diff gate is forced` | spawn | `CF_WAF_FORCE_DIFF=1` で exit 14 |
| TC-U-15 | `cf-waf-apply > exits 11 when CLOUDFLARE_API_TOKEN missing` | spawn | token 未注入で exit 11、token 文字列を stdout に出さない |
| TC-U-16 | `cf-waf-apply > does not echo token to stdout/stderr` | manual / shell | stdout/stderr に token 値が含まれないことを runtime preflight で確認 |
| TC-U-17 | `cf-waf-apply non-dry-run fails closed until G1 approval` | spawn | G1 前は exit 13 で false green を防ぐ |

> 実装方針: lib.test.ts は `child_process.spawnSync` で `bash scripts/cf-waf-apply.sh` を起動する。G1 user approval 前の local implementation は Cloudflare PUT を行わず、non-dry-run を exit 13 で fail-closed する。remote drift diff / enforce apply runtime evidence は Phase 13 G1 以後の runtime evidence として扱う。

## 4. integration テスト（L3 / L4: miniflare smoke）

| TC 番号 | テスト名 | 対象 | 期待 |
| --- | --- | --- | --- |
| TC-I-01 | `rate-limit-magic-link > returns 429 with retry-after on burst` | 既存テストの再利用 | 既存挙動維持・retry-after が helper 由来の整数秒 |
| TC-I-02 | `rate-limit-magic-link > body matches new helper shape` | 同上 | `{ error: "rate_limited", retryAfterSec, reason: "app" }` |
| TC-I-03 | `rate-limit-self-request > returns 429 with retry-after` | 既存テスト | 同上 |
| TC-I-04 | `rate-limit-* > x-ratelimit-source header is "app"` | 新規 | helper 統一 |
| TC-I-05 | `rate-limit-* > does not regress existing test cases` | 既存全件 | 既存ケース数維持 |

> 既存 `apps/api/src/middleware/__tests__/rate-limit-magic-link.test.ts` のパターンを参考に、helper 経由化後も「ケース数 / 期待 status / 期待 retry-after 整数値」が同一であることを保証する。

## 5. E2E smoke（L5: staging へ curl 連打）

> Phase 5 §2.1 の staging 適用後に runbook 手順として実行。CI には乗せない（実 zone への外部 traffic を伴うため）。

```bash
# AUTH path 連打（10/60s threshold）
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code} %{header_json}\n" \
    -X POST "https://staging.<zone>/api/auth/magic-link" \
    -H "content-type: application/json" \
    -d '{"email":"smoke@example.com"}'
done | tee outputs/phase-6/smoke-auth.log

# 期待: 11 件目以降で 429 + retry-after header
grep -c "^429" outputs/phase-6/smoke-auth.log   # >= 2
```

| TC 番号 | テスト | 期待 |
| --- | --- | --- |
| TC-E-01 | AUTH 12 連打 | 11 件目以降で `429` + `retry-after >= 1` |
| TC-E-02 | ME 70 連打（60/60s） | 61 件目以降で `429` |
| TC-E-03 | PUBLIC 60 連打（50/10s） | 51 件目以降で `429` |
| TC-E-04 | ADMIN 35 連打（30/60s） | 31 件目以降で `429` または `managed_challenge` |
| TC-E-05 | retry-after 経過後の再 200 | sleep retryAfterSec; curl で 200 |

> Simulate モード期間中は 429 が出ない（log のみ）。Phase 5 §2.3 の Enforce 移行後にのみ TC-E-01〜04 が GREEN になる設計。Simulate 期間中は Cloudflare Security Events の `action=log` 件数で代替検証する（runbook 手順）。

## 6. coverage 目標

| 対象 | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| `apps/api/src/middleware/edge-rate-limit-headers.ts` | 95%+ | 90%+ | 100% | 95%+ |
| `apps/api/src/middleware/rate-limit-magic-link.ts`（既存）| 既存維持 | 既存維持 | 既存維持 | 既存維持 |
| `apps/api/src/middleware/rate-limit-self-request.ts`（既存）| 既存維持 | 既存維持 | 既存維持 | 既存維持 |
| apps/api workspace 全体 | 80%+ | 80%+ | 80%+ | 80%+（`coverage-guard.sh` 既定閾値）|
| `scripts/cf-waf-apply/lib.sh` | bash 性質上 vitest coverage 対象外。代わりに TC-U-10〜17 の automated spawn tests と runtime token-leak checklist で主要分岐を網羅 |

検証コマンド:

```bash
mise exec -- pnpm --filter @ubm/api test --coverage
bash scripts/coverage-guard.sh   # exit 0 を期待
```

## 7. テストファイル一覧

| ファイル | 種別 | TC 番号 |
| --- | --- | --- |
| `apps/api/src/middleware/__tests__/edge-rate-limit-headers.test.ts` | unit | TC-U-01〜08 |
| `scripts/cf-waf-apply/lib.test.ts` | unit / spawn snapshot | TC-U-10〜15, TC-U-17 |
| `scripts/cf-waf-apply/__fixtures__/dry-run.snapshot.json` | fixture | （TC-U-10）|
| `apps/api/src/middleware/__tests__/rate-limit-magic-link.test.ts` | integration（既存編集）| TC-I-01〜02, 04, 05 |
| `apps/api/src/routes/me/index.test.ts` | integration（既存編集）| TC-I-03〜05 |
| `outputs/phase-6/smoke-auth.log` 等 | E2E ログ | TC-E-01〜05（手動）|

## 8. 副作用境界マトリクス（dryRun / apply）

| 関数 | DB | queue | audit | external API | 副作用境界 |
| --- | --- | --- | --- | --- | --- |
| `cf-waf-apply.sh --dry-run` | × | × | × | GET のみ | read-only |
| `cf-waf-apply.sh --mode simulate` | × | × | × | GET + PUT（rule mode=log）| Cloudflare 側 ruleset を Simulate に切替 |
| `cf-waf-apply.sh --mode enforce` | × | × | × | GET + PUT（rule mode=block/managed_challenge）| Cloudflare 側 ruleset を Enforce に切替 |
| `buildRateLimitedResponse` | × | × | × | × | pure function |

> dryRun は audit / queue を変更しない。apply のみが Cloudflare API state を永続化する。

## 9. テストの非実施範囲

| 範囲 | 理由 |
| --- | --- |
| Cloudflare 実 Managed Ruleset の検出ロジック | Cloudflare 側責務。ローカルでは検証不可 |
| Bot Fight Mode | scope 外（index.md「含まない」）|
| 地域ブロック | scope 外 |
| OWASP CRS 完全網羅 | Free Managed Ruleset の範囲外 |

## 10. 既存テスト回帰確認（Phase 5 と連動）

```bash
# baseline
git stash
mise exec -- pnpm --filter @ubm/api test rate-limit
# → 全 GREEN を記録

# 実装後
git stash pop
mise exec -- pnpm --filter @ubm/api test rate-limit
# → ケース数・期待値（status / retry-after 整数）が同一で全 GREEN
```

## 11. CI gate 連携

| CI workflow | gate |
| --- | --- |
| `.github/workflows/verify-*.yml`（既存）| `pnpm test` / `pnpm typecheck` / `pnpm lint` の既存 gate に乗せる。新規 workflow は追加しない |
| `coverage-guard.sh` | apps/api workspace 80/80/80/80 |
| shellcheck | `pnpm exec shellcheck scripts/cf-waf-apply.sh scripts/cf-waf-apply/lib.sh` |

## 12. 上流ブロッカー（gate 重複明記）

| ブロッカー | 解除条件 |
| --- | --- |
| miniflare で `[[ratelimits]]` binding のローカル再現が困難 | MINOR-02 を「採用しない」で確定済み（Phase 4 §6）。テストは zone-level Rate Limiting の wire format（429 + retry-after）に限定 |
| staging zone への E2E 実行は本番影響を伴う | Simulate 期間中のみ実行。Enforce 後は本番ピークを避けて少量で実行 |

## 13. 参照資料

| 資料 | パス |
| --- | --- |
| `phase-04.md` | helper / cf-waf-apply 詳細設計 |
| `phase-05.md` | Step 1〜5 の実装順序 |
| coverage 標準 | `.claude/skills/task-specification-creator/references/coverage-standards.md` |
| 既存 rate-limit テスト | `apps/api/src/middleware/__tests__/rate-limit-magic-link.test.ts` |

## 14. 成果物

| 成果物 | パス |
| --- | --- |
| テスト戦略書（本ファイル） | `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/phase-06.md` |
| unit テスト群 | TC-U-01〜17（§2 / §3）|
| integration テスト群 | TC-I-01〜05（§4）|
| E2E smoke ログ | `outputs/phase-6/smoke-auth.log`（Phase 5 適用後に取得）|
| coverage report | `coverage/lcov-report/`（Phase 6 実行時）|

## 15. 統合テスト連携【必須】

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ユニットテスト Line | 80%+ | TC-U-01〜17 完走で達成想定 |
| ユニットテスト Branch | 80%+ | 同上 |
| ユニットテスト Function | 80%+ | 同上 |
| 結合テスト API | 100% | TC-I-01〜05 完走で達成想定 |
| 結合テスト正常系 | 100% | TC-I-01, 03, 05 |
| 結合テスト異常系 | 80%+ | TC-I-02, 04 / TC-U-06, 07, 11, 13, 14, 15, 17 |

## 16. 完了条件（DoD）

- [ ] §2 unit テスト一覧 8 ケース（TC-U-01〜08）が `edge-rate-limit-headers.test.ts` に実装され GREEN
- [ ] §3 automated spawn テスト 7 ケース（TC-U-10〜15, TC-U-17）が `cf-waf-apply/lib.test.ts` に実装され GREEN
- [ ] §3 runtime token-leak preflight（TC-U-16）は Phase 13 G1 以後の evidence として実行される
- [ ] §4 integration 5 ケース（TC-I-01〜05）が既存テストの編集として GREEN
- [ ] §5 E2E TC-E-01〜05 の curl 手順が runbook（Phase 7）に記録されている（Simulate 期間中は手動 / Enforce 移行後に再実行）
- [ ] §6 coverage 目標を満たし `bash scripts/coverage-guard.sh` exit 0
- [ ] §11 CI gate（既存 workflow）が GREEN
- [ ] §8 副作用境界が dryRun / simulate / enforce で明確に分かれている
- [ ] secret 値が test fixture / 実行ログに混入しない（TC-U-16 で検証）

## 17. 次の Phase

Phase 7: ドキュメント / runbook（`docs/runbooks/cloudflare-waf-operations.md` の構造定義と aiworkflow-requirements 反映）

## 実行タスク

1. helper unit、script snapshot、miniflare smoke、coverage gate のテスト仕様を固定する。
2. Workers binding no-op によるテスト範囲を明確化する。

## 参照資料

| 資料 | 用途 |
| --- | --- |
| `phase-04.md` | helper / script contract |
| `phase-05.md` | implementation steps |

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 6 テスト拡充仕様 | `phase-06.md` |

## 完了条件

- [ ] unit / dry-run / smoke / coverage の gate が記述されている。

## 統合テスト連携

Phase 9 / 11 の NON_VISUAL evidence に検証結果を接続する。
