# Lessons Learned — task-09-w3 Tailwind v4 setup（2026-05-08）

> task: `task-09-w3-par-tailwind-v4-setup`
> date: 2026-05-08
> branch: `docs/task-09-tailwind-v4-setup-task-spec`
> upstream spec: `docs/00-getting-started-manual/specs/09b-design-tokens.md`
> 関連 workflow: `docs/30-workflows/task-09-w3-par-tailwind-v4-setup/`、`docs/30-workflows/ui-prototype-alignment-mvp-recovery/04-design-system/task-09-w3-par-tailwind-v4-setup.md`、`docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-12/skill-feedback-report.md`
> 関連 reference: `references/workflow-task-09-w3-par-tailwind-v4-setup-artifact-inventory.md`、`references/lessons-learned-task-08-w2-design-tokens-doc-2026-05.md`、`references/task-workflow-active.md`（Task 09 W3 行）、`indexes/resource-map.md`（task-09 行）、`indexes/keywords.json`

## 教訓一覧

### L-T09W3-001: VISUAL_ON_EXECUTION の generated CSS 検証は **2 点契約** で固定する

- **症状**: build pipeline タスクは「token が CSS に出ているか」だけだと utility class の生成可否を見落とす。`tokens.css` import のみで `@theme inline` が抜けても test が緑になり得る。
- **採用解**: Phase 11 build-output 検証を `var(--ubm-color-accent)` の存在 と `.bg-accent` 等の utility selector 存在の **2 点 grep 契約** に固定。`apps/web/src/__tests__/build-output.test.ts` で両方を assert し、片方だけでは fail する。`outputs/phase-11/evidence/generated-css-with-oklch.log` と `generated-css-with-bridge.log` の 2 ファイルで証跡分離。
- **再発防止**: VISUAL_ON_EXECUTION の Phase 11 テンプレに「token surface + utility surface の 2 点 grep」を必須化する旨を `skill-feedback-report.md` で task-specification-creator skill に promotion。
- **関連**: `docs/30-workflows/task-09-w3-par-tailwind-v4-setup/outputs/phase-11/main.md`、`apps/web/src/__tests__/build-output.test.ts`、`outputs/phase-12/skill-feedback-report.md` 行 7。

### L-T09W3-002: placeholder token grep 0 件 gate は **Phase 4 に前倒し** する

- **症状**: token 値の placeholder（HEX literal や旧短縮名）が Phase 11 まで残ると、build 後の修復コストが大きい。Phase 11 で初めて検出されると evidence やり直しになる。
- **採用解**: build pipeline タスクでは Phase 4 の段階で `hex-grep-gate.sh` 相当を実行し、`tokens.css` 投入直後に HEX / 旧短縮 token の出現数を 0 で fence。Phase 11 ではこの結果を `outputs/phase-11/evidence/hex-grep-zero.log` として再証拠化するだけにする。
- **再発防止**: `phase-12-documentation-guide.md` に「build pipeline タスクは Phase 4 に placeholder token grep 0 件 gate を置く」を追記する prompt を skill-feedback-report.md で発行。
- **関連**: `outputs/phase-4/hex-grep-gate.sh`、`outputs/phase-11/evidence/hex-grep-zero.log`、`outputs/phase-12/skill-feedback-report.md` 行 13。

### L-T09W3-003: 09b bridge contract の更新は **no-op** と判断する基準を明文化する

- **症状**: task-09 完了時に「09b §10 の Tailwind `@theme inline` template を更新すべきか」を判断する基準が曖昧。docs 側を毎回触ると spec 正本の安定性が下がる。
- **採用解**: 09b §10 が既に Tailwind v4 template を保持しているため、task-09 範囲では **09b 側の bridge contract 更新を no-op** と決定。理由を `outputs/phase-12/skill-feedback-report.md` の「ドキュメント改善 → no-op reason」列に明記する形で固定化。
- **再発防止**: 後続 build pipeline タスクで spec 側更新の要否を判断する際、phase-12 feedback report の「no-op reason」列を必須記入項目とする。docs-side の重複更新を抑止。
- **関連**: `docs/00-getting-started-manual/specs/09b-design-tokens.md` §10、`outputs/phase-12/skill-feedback-report.md` 行 19。

## 横展開チェックリスト

build pipeline / VISUAL_ON_EXECUTION の将来タスクで毎回確認する:

- [ ] generated CSS 検証は token surface + utility surface の 2 点 grep を assert しているか（L-T09W3-001）
- [ ] placeholder token grep 0 件 gate を Phase 4 に置いているか（L-T09W3-002）
- [ ] spec 側 bridge contract 更新の要否を phase-12 feedback report の no-op reason 列で判断しているか（L-T09W3-003）
- [ ] Phase 11 evidence は `typecheck.log` / `tokens-test.log` / `build-output-test.log` / `preview-200.log` / `hex-grep-zero.log` の 5 点が揃っているか
