# Lessons Learned — task-08-w2 design tokens doc（2026-05-07）

> task: `task-08-w2-design-tokens-doc`
> date: 2026-05-07
> branch: `feat/task-08-w2-design-tokens-spec`
> token SSOT: `docs/00-getting-started-manual/specs/09b-design-tokens.md`
> 出典: `docs/00-getting-started-manual/claude-design-prototype/styles.css` L1-L70
> 関連 spec: `docs/00-getting-started-manual/specs/09-ui-ux.md`、`docs/00-getting-started-manual/specs/09c-primitives.md`、`docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md`、`docs/00-getting-started-manual/specs/00-overview.md`
> 関連 workflow: `docs/30-workflows/task-08-w2-design-tokens-doc/`、`docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`、`docs/30-workflows/ui-prototype-alignment-mvp-recovery/04-design-system/task-09-w3-par-tailwind-v4-setup.md`、`docs/30-workflows/ui-prototype-alignment-mvp-recovery/08-regression/task-18-w7-solo-verify-tokens-and-playwright-smoke.md`、`docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md`
> 関連 reference: `references/workflow-task-08-w2-design-tokens-doc-artifact-inventory.md`、`references/task-workflow-active.md`（Task 08 W2 行）、`indexes/resource-map.md`（Task 08 W2 行）

## 教訓一覧

### L-T08W2-001: 旧短縮 token と canonical token は **互換 mapping 表** で接続し、混在を許容しない

- **症状**: `09-ui-ux.md` / `09c-primitives.md` / `09f-screen-blueprints-member.md` に旧短縮名 `--ubm-bg` / `--ubm-accent` / `--ubm-text-2` が残存。task-09（Tailwind `tokens.css`）と task-18（verify gate）が「正本どちらに合わせるか」を決められず block していた。
- **原因**: token 命名が prototype `styles.css` の短縮形と canonical `--ubm-color-*` で 1:1 に紐づいていなかった。短縮名を直書きする導線が specs / blueprint 双方に残っていた。
- **採用解**: 09b 第 11 章に「互換 mapping 表」を一本立て、旧短縮 → canonical の 1:1 対応を固定。`--ubm-bg → --ubm-color-bg`, `--ubm-accent → --ubm-color-accent`, `--ubm-text-2 → --ubm-color-text-2` 等を全件列挙。新規実装では canonical のみ許可、旧短縮は引用時にだけ言及する文書ルールを明文化。
- **再発防止**: token 命名変更時は **同一 wave で mapping 表を更新**。task-09 `tokens.css` 実装時は canonical を一次定義、旧短縮は `var(--ubm-color-*)` を再 export する deprecation alias とする（task-09 範囲）。task-18 verify script は短縮名直書きを fail とし、specs 内の引用は許容する allowlist を持つ。
- **関連ファイル**: 09b-design-tokens.md §11, 09c-primitives.md, 09f-screen-blueprints-member.md, 09-ui-ux.md

### L-T08W2-002: spec rename（09e → 09b）は **横断 link 補正を同一 PR で完遂**する

- **症状**: 09e 命名で散った link が member blueprint / SCOPE / task-01 / task-09 / task-18 / phase-3 出力に残り、reader が dead link に当たる risk があった。
- **原因**: spec ordinal は 09a..09f の連番に揺らぎがあり、design-tokens を 09b に格上げした際の参照が specs/ 単独では完結しない。30-workflows 配下の workflow 仕様書、SCOPE、phase 出力にも依存。
- **採用解**: rename と同一 wave で以下 6 箇所を grep で抽出して一括修正:
  1. `docs/00-getting-started-manual/specs/00-overview.md`
  2. `docs/00-getting-started-manual/specs/09-ui-ux.md`
  3. `docs/00-getting-started-manual/specs/09c-primitives.md`
  4. `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md`
  5. `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`、`04-design-system/task-09-...md`、`08-regression/task-18-...md`、`01-scope/task-01-...md`、`outputs/phase-3/phase-3.md`
  6. `.claude/skills/aiworkflow-requirements/`（changelog / quick-reference / resource-map / topic-map / keywords / SKILL.md / task-workflow-active）
- **再発防止**: spec ordinal 変更時の checklist を Phase 12 sub-task に固定化（`grep -rn "<旧 path>" docs/ .claude/`）。docs-only タスクの compliance check 項目に「全 link 解決」を必須化。
- **関連ファイル**: SCOPE.md, phase-3.md, task-01/09/18 spec, 09-ui-ux.md, 09c-primitives.md, 09f-...member.md

### L-T08W2-003: 09c primitives との **dual-naming 期間境界**は spec 文面で明示する

- **症状**: 09c primitives は色を色名（stone-900 / warm-500 …）で抽象参照しているが、09b は `--ubm-color-*` canonical を一次定義する。「primitive 内の参照名」と「token canonical」が同居する移行期間に、どちらを直書きしてよいかが不明確だった。
- **原因**: primitive layer と token layer の責務境界（primitive は意味付け、token は値正本）が docs として分離されていなかった。
- **採用解**: 09b 冒頭に「primitive 層は 09c が正本、value 層は 09b が正本」を明示。primitive 内 CSS は `var(--ubm-color-*)` のみ参照し、stone-900 等の literal は 09b の互換注記でのみ言及するルールに固定。dual-naming は **task-09 (Tailwind v4 `@theme inline` 投入) までの過渡期に限定**することを 09b §11 / §12 に記録。
- **再発防止**: primitive と token の責務境界を 00-overview.md にも 1 行で記載済（「色値正本 = 09b、primitive 構造正本 = 09c」）。task-09 完了時点で過渡期ルールを retire し、09b §11 から「移行期注記」を delete する fork point を 09b 末尾に予約。
- **関連ファイル**: 09b-design-tokens.md §1 / §11 / §12, 09c-primitives.md, 00-overview.md

### L-T08W2-004: Tailwind v4 `@theme inline` と OKLch literal の cross-check は **84 token × 12 章 × styles.css 行範囲**で全件突合する

- **症状**: prototype `styles.css` L1-L70 の literal（stone / warm / cool 各色 OKLch + radius + shadow + font + spacing + motion）が 84 token あり、09b の 12 章にどう振り分けるかと、Tailwind v4 `@theme inline` でどれを surface するかが、章単位の rough check では破綻した（漏れ・重複・誤値）。
- **原因**: token 定義は 1 ファイルに集約されず、09b 章構造と Tailwind theme との 2 軸で同期する必要がある。目視 diff だと literal 値の typo（OKLch L 値 0.0 桁）を検出しきれない。
- **採用解**:
  - styles.css L1-L70 を 09b 第 2-9 章に章単位で対応付け、章末に「styles.css L行 → 09b 行」の対応注記を入れた
  - Tailwind v4 `@theme inline` で expose する subset（color / radius / spacing / shadow / font / motion）を 09b §10 に専用章で固定し、task-09 はこの章を**一次入力**として `tokens.css` を生成する契約を確立
  - Phase 11 evidence で `grep oklch styles.css | wc -l` と 09b 内 oklch 出現数を突合
- **再発防止**: 84 token / 12 章 / styles.css L1-L70 の triple cross-check を Phase 12 strict 7 files の compliance check に固定。task-09 では 09b §10 の subset を JSON 化して `tokens.css` 生成の input にする。task-18 verify gate は OKLch literal の HEX fallback ペアも検証する。
- **関連ファイル**: 09b-design-tokens.md §2-§10, claude-design-prototype/styles.css L1-L70, task-09-w3-par-tailwind-v4-setup.md, task-18-w7-solo-verify-tokens-and-playwright-smoke.md

## 横展開チェックリスト

token / spec rename / dual-naming を含む将来タスクで毎回確認する:

- [ ] 旧名 → canonical の 1:1 mapping 表が spec 本体にあるか（L-T08W2-001）
- [ ] spec rename 時、specs/ + 30-workflows/ + .claude/skills の 3 領域すべてで grep 0 件か（L-T08W2-002）
- [ ] primitive 層と token 層の責務境界が冒頭で明示されているか（L-T08W2-003）
- [ ] dual-naming の retire fork point（どの下流タスクで終了するか）が記録されているか（L-T08W2-003）
- [ ] literal 値（OKLch / HEX / radius / shadow）の出典行範囲と spec 章対応が章末注記で残っているか（L-T08W2-004）
- [ ] Tailwind v4 `@theme inline` で expose する subset が独立章で固定されているか（L-T08W2-004）
- [ ] Phase 12 compliance check に「dead link 0」「token count 突合」「OKLch literal 突合」が含まれているか
