# workflow-issue-1007-density-toggle-help-hint-hardening artifact inventory

| Type | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1007-density-toggle-help-hint-hardening/` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-1007-density-toggle-help-hint-hardening/artifacts.json` |
| output artifacts | `docs/30-workflows/completed-tasks/issue-1007-density-toggle-help-hint-hardening/outputs/artifacts.json` |
| phase 11 local evidence | `docs/30-workflows/completed-tasks/issue-1007-density-toggle-help-hint-hardening/outputs/phase-11/manual-test-result.md` |
| phase 12 strict outputs | `docs/30-workflows/completed-tasks/issue-1007-density-toggle-help-hint-hardening/outputs/phase-12/` |
| implementation targets | `apps/web/src/components/public/DensityToggle.client.tsx`, `apps/web/src/components/ui/Icon.tsx`, `apps/web/src/components/ui/icons.ts` |
| focused tests | `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` |
| system specs | `docs/00-getting-started-manual/specs/09-ui-ux.md`, `docs/00-getting-started-manual/specs/09d-icons.md` |

Status: `implemented_local_runtime_pending / implementation / VISUAL`.

Issue #1007 is CLOSED and must be referenced with `Refs #1007` only. Staging visual evidence, commit, push, PR creation, and issue mutation are user-gated.

## Lessons Learned

詳細は [`lessons-learned/lessons-learned-issue-1007-density-toggle-help-hint-hardening-2026-05.md`](../lessons-learned/lessons-learned-issue-1007-density-toggle-help-hint-hardening-2026-05.md) を参照。

- **L-DTHH-001** 多重配置 component の `aria-describedby` 用 hidden span id は `useId()` 接頭辞で instance ごとに一意化する（固定 id は 2 個目以降で衝突し参照崩れ）
- **L-DTHH-002** disclosure は controlled state で全制御せず、非制御 native `<details>` の summary toggle を温存し close 操作のみ `detailsRef.current.open = false` で命令的に行う（最小複雑度）
- **L-DTHH-003** Escape / 外側クリック close 用 `document` listener は `browserDocument()` guard + mount 寿命 1 本 + handler 内で `detailsRef.current?.open` 判定 + unmount 解除の 4 点セット
- **L-DTHH-004** Escape は summary に focus 復帰、外側クリックは `pointerdown` + `instanceof Node` + `contains` guard の双方成立時のみ close
- **L-DTHH-005** jsdom は `<details>` summary click を native toggle しないため、test helper で `details.open = true` + `toggle` Event 手動 dispatch の fallback を 1 箇所に集約する
- **L-DTHH-006** icon 追加は icons.ts union + Icon.tsx glyph case + 09d-icons.md spec 行の 3 点を同一 wave で同期する
