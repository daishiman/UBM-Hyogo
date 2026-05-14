# Lessons Learned — Issue #621 apps/web test suffix rename（2026-05-10）

## 概要

`apps/web/` 配下の Vitest テスト 70 ファイルを `.test.ts(x)` から責務分類付き `.spec.ts(x)`（`.component.spec.tsx` / `.runtime.spec.ts` / `.route.spec.ts` / `.page.spec.ts` / `.spec.ts` の 5 分類）へ rename し、ADR `outputs/phase-12/test-file-suffix-adr-apps-web.md` を確定。同 wave で boundary lint / stablekey lint / verify-design-tokens script / type-only `.test-d.ts` / aiworkflow-requirements indexes / SKILL を同期。本 lessons は同種 suffix migration を将来短時間で再現するための知見集。

## 苦戦箇所と知見

### L-I621-001: rename 対象の live root scan parity gate 不在

**苦戦**: Phase 7 時点で「`apps/web/src` 53 ファイル」と見積もったが、`apps/web/app` 配下と type-only `.test-d.ts` を含めた live `find apps/web` の実数は 70 ファイル（+ 1 type-only）であり、scope drift によって Phase 11 evidence と差異が発生。

**知見**: rename 系 workflow の Phase 11/12 close-out では、`find <target-root> -name '*.test.*' -o -name '*.spec.*'` の **live root scan を Phase-7 spec の expected count と parity check** することを必須化する。`apps/web/src` のような sub-tree 限定推定は禁止。

**How to apply**: 同種タスクは task-specification-creator/`phase12-checklist-definition.md` #22 (rename系 live root scan parity gate) を必ず通す。

### L-I621-002: type-only `.test-d.ts` の discovery 漏れ

**苦戦**: `apps/web/src/lib/api/me-types.test-d.ts` は Vitest runtime 対象外の type-only test だが、suffix 規約からは外れていた。初期 discovery で見落とし、Phase 11 後に追加対応。

**知見**: suffix migration の discovery は `*.test.ts(x)` だけでなく **`*.test-d.ts` を必ず含める**。rename 対象外と判断する場合も classification ルールに明示すること（本件は `.spec-d.ts` へ rename して runtime test と並べた）。

**How to apply**: 将来の type-only test 規約変更時は `tsd` / `expect-type` 系の type-only suffix を ADR の「適用範囲」節に明記する。

### L-I621-003: boundary lint と stablekey lint の `.test` ハードコード

**苦戦**: `scripts/lint-boundaries.mjs` と `scripts/lint-stablekey-literal.mjs` は `.test.ts` を test ファイルとして除外する hardcode を持っており、`.spec.ts` 化により全 spec ファイルが production boundary scan に乗り false positive 多発。

**知見**: suffix migration を行う場合は **テストファイル除外を行う lint script** を grep で網羅検出（`grep -rn "\.test\." scripts/`）し、同 wave で `.spec` parity を入れる。本件では両 script を `.test|.spec` の双方を許容する形に修正済み。

**How to apply**: 今後の test suffix 改訂時は `scripts/lint-*.{mjs,js,ts}` の test 判定箇所を全網羅で更新する。

### L-I621-004: `verify-design-tokens` の static path

**苦戦**: `apps/web/package.json` の `verify-design-tokens` script が `apps/web/src/__tests__/static-invariants.test.ts` を直接 path 指定しており、rename で path drift。CI gate が破綻寸前。

**知見**: rename 系 workflow の Phase 11 evidence には **`grep -rn "<old-suffix>" package.json .github/workflows scripts/` を必須項目化** し、static path 参照を全て同 wave で更新する。

**How to apply**: rename PR は CI gate script の path 参照を含めることを Phase 12 system-spec-update-summary.md の sync 表に明示する（本件で実施済）。

### L-I621-005: aiworkflow-requirements indexes / references の renamed path 残存

**苦戦**: `references/` 配下の lessons / artifact inventory / changelog に `.test.ts` 直接参照が散在（800件超）。scope は packages/* など apps/web 外も含むため全置換は危険、Issue #621 scope の `apps/web` 配下のみを慎重に identify して書き換える必要があった。

**知見**: rename 後の skill 同期は **`grep -rn "apps/web/.*\.test\." references/`** で apps/web scope に絞って検出し、scope 外（packages, apps/api）は別 issue（followup-002）で対応する境界を維持する。Phase 12 close-out で「未置換は scope 外で意図的」と明示記録する。

**How to apply**: aiworkflow-requirements の Phase 12 sync gate に「rename 系では scope 限定 grep の差分 0 化を確認」を追加（`phase12-checklist-definition.md` #22 で吸収）。

## 運用知見

| ID | 教訓 |
| --- | --- |
| OP-I621-1 | `apps/api` ADR を template に流用すると 4 分類 (authz / repository 含む) が UI 層に合わない。**apps/web は 5 分類 (component / runtime / route / page / lib-unit)** に再設計する判断が必要 |
| OP-I621-2 | 70 ファイル機械的 rename は `git mv` を一括スクリプト化し、`rename-mapping.csv` を Phase 11 evidence として保存する。手作業は drift の温床 |
| OP-I621-3 | E2E (`tests/e2e/`)・Storybook・Playwright は元から `.spec.ts` のため対象外。本件 ADR の「適用範囲」節で明示し scope 拡大を防止 |

## 参照

- workflow root: `docs/30-workflows/issue-621-apps-web-test-suffix-rename/`
- ADR: `outputs/phase-12/test-file-suffix-adr-apps-web.md`
- 親 Issue: `Issue #621`（apps/api Issue #325 の対称 task）
- followup-002 (`packages/**/*.test.ts` rename) / followup-003 (`vitest.config.ts` `.spec` 単独収斂) は scope 外で別 issue 化済み
