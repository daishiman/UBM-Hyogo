# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

> Phase: 10 / 13

---

## 最終チェックリスト

### コード変更レビュー

- [x] `apps/web/src/lib/fetch/public.ts` の diff が以下のみであること
  - `isTestOrPlaywright()` 関数の新規追加
  - `getServiceBinding()` の早期 return 条件変更
  - ファイル冒頭コメント更新
- [x] `apps/web/src/lib/fetch/public.spec.ts` の diff が以下のみであること
  - 新規 `describe('getServiceBinding env guard regression (AC-R-01..R-05)', ...)` block 追加
  - 既存 `afterEach` への `vi.unstubAllEnvs()` 追加(必要に応じて)
- [x] 追加 diff は workflow 仕様書、source unassigned consumed marker、aiworkflow-requirements same-wave sync、`apps/web/playwright.config.ts` の `PLAYWRIGHT_TEST=1` 明示に限定されている

### 不変条件チェック

- [x] D1 直接アクセス禁止違反なし(`apps/web` から D1 binding 呼び出し追加なし)
- [x] `apps/web` env 不変条件: `process.env.*` 直参照は `isTestOrPlaywright()` 1 箇所と既存 `getBaseUrl`/`getServiceBinding` のみ。`CI` は transport 判定に使わない
- [x] `apps/api` endpoint surface 不変
- [x] `wrangler` 直叩きなし
- [x] secret を test fixture に書き込んでいない(URL は plausible placeholder のみ)
- [x] `*.spec.ts` 命名遵守(`*.test.ts` 新規作成なし)
- [x] PR base = `dev`

### AC 充足

- [x] AC-R-01: 環境ガードロジックが Phase 5 通り実装されている
- [x] AC-R-02: production context regression test green
- [x] AC-R-03: `CI=true` 単独では service binding 優先の safety test green
- [ ] AC-R-04: `PLAYWRIGHT_TEST=1` 明示付き `e2e-tests-coverage-gate` job が PR で green
- [x] AC-R-05: `getEnv()` zod schema 不変、新規 test/Playwright 判定キーの `process.env.*` 直参照は `isTestOrPlaywright()` に閉じる

### Phase 9 evidence 整備

- [x] `outputs/phase-11/evidence/typecheck.txt`
- [x] `outputs/phase-11/evidence/lint.txt`
- [x] `outputs/phase-11/evidence/unit-test.txt`
- [x] `outputs/phase-11/evidence/build.txt`
- [x] `outputs/phase-11/evidence/build-cloudflare.txt`
- [x] `outputs/phase-11/evidence/inverse-assertion-fail.txt`
- [x] `outputs/phase-11/evidence/grep-process-env.txt`
- [x] `outputs/phase-11/evidence/wrangler-env-grep.txt`
- [x] `outputs/phase-11/evidence/opennext-bundle-transport-grep.txt`

### コードコメント整合

- [x] ファイル冒頭の transport 経路コメントが新ロジックと一致
- [x] `isTestOrPlaywright()` 直上コメントに「env 不変条件の例外」明示
- [x] `getServiceBinding()` 内の test/Playwright 早期 return 直上コメントに「mock API 差し替え目的」明示
- [x] production 経路コメントに「PUBLIC_API_BASE_URL の有無に関わらず service binding を最優先」明示

### task-05a 関連性の明示

- [x] ファイル冒頭コメントで `task-05a-fetchpublic-service-binding-001`(逆方向 fallback 設計)への参照リンクが残っているか、本タスクで補足コメントが追加されている

## レビュー NG 時の対応

| 項目 | 対応 |
|------|------|
| 不要ファイル混入 | `git restore` で除去 |
| AC 未達 | 該当 Phase に戻る |
| evidence 不足 | Phase 11 を再実行 |
| コメント不整合 | Phase 5 Step 1 / Phase 8 の指示に沿って書き直し |

## 完了条件(Phase 10)

AC-R-04 の GitHub Actions runtime evidence は commit / push / PR 後の user-gated 確認として残し、それ以外の local final review は check 済み。
