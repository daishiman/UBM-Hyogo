# Lessons learned — issue-924 style-src-attr 'unsafe-inline' 撤去 (2026-05-25)

> 親 workflow: `docs/30-workflows/completed-tasks/issue-924-style-src-attr-retirement/`
> 関連 SSOT: [security-web-response-headers.md](../references/security-web-response-headers.md), [lessons-learned-awshh-followup-003-csp-reporting-endpoints-2026-05.md](./lessons-learned-awshh-followup-003-csp-reporting-endpoints-2026-05.md), [lessons-learned-apps-web-security-headers-hardening-2026-05.md](./lessons-learned-apps-web-security-headers-hardening-2026-05.md)

---

## L-I924-001: invariant grep gate は `style={` を広く検出する。`style={{` 限定だと prop-forward と条件式が漏れる

- **Why**: 初回スキャンは `style={{` のみを対象にしたため、`<Component style={style} />`（prop forward）と `<div style={isActive ? activeStyle : undefined} />`（条件式）が検出されず、レビューサイクルで `AdminTable` と `GoogleBrandIcon` の residual `style={...}` が発覚した。`style-src-attr 'unsafe-inline'` を撤去した CSP では prop 由来でも条件式由来でも inline style は同様に block される。
- **How to apply**:
  - 撤去 invariant gate は `style={` を最低粒度として検索する（`scripts/verify-no-inline-style.sh`）。
  - 除外は **CSP 対象外の route** のみ（`ImageResponse` が出力する `apps/web/app/og/route.tsx` 等の PNG-render 経路）。除外は path allowlist で明示し、pattern 緩和で吸収しない。
  - gate は `pnpm lint` と lefthook pre-push の両方に配線し、CI と local の両方で同 invariant を強制する。
- **Evidence**:
  - `scripts/verify-no-inline-style.sh`
  - `lefthook.yml`（pre-push に `verify-no-inline-style` 配線）
  - `package.json`（`lint` に `verify-no-inline-style` 配線）
  - `docs/30-workflows/completed-tasks/issue-924-style-src-attr-retirement/outputs/phase-12/skill-feedback-report.md` § ワークフロー改善
- **Related**: L-I924-003（除外 boundary）

## L-I924-002: VISUAL タスクは local static sanity 1 枚と full 19-route regression を区別して評価する

- **Why**: 本 worktree では `pnpm --filter @ubm-hyogo/web dev` 起動後 60s 以内に route HTML が返らない事象が発生し、19 route の visual regression を local で取り切れなかった。「visual 取れない＝VISUAL fail」と短絡すると、CSS / DOM の local sanity は通っているのに workflow が `pending` で詰まる。
- **How to apply**:
  - `outputs/phase-11/screenshots/*-static-sanity.png` 1 枚で CSS / DOM の local sanity を closing し、`workflow_state = local_static_pass_browser_pending` を採る。
  - full route の visual regression（baseline 退行確認）は **常に user-gated**（`pending_user_approval`）として残し、PASS 表記しない。
  - `phase-11/manual-test-result.md` に「static sanity = present」「full route visual = pending」を明示し、2 段階を artifacts.json の `workflow_state` で区別する。
- **Evidence**:
  - `docs/30-workflows/completed-tasks/issue-924-style-src-attr-retirement/outputs/phase-11/screenshots/style-src-attr-retirement-static-sanity.png`
  - `docs/30-workflows/completed-tasks/issue-924-style-src-attr-retirement/outputs/phase-12/phase12-task-spec-compliance-check.md` § 7 Runtime or user-gated boundary
- **Related**: L-PUBERR-002（worktree dev server timeout 回避）

## L-I924-003: `ImageResponse` route は CSP 対象外として allowlist で除外し、撤去 invariant に巻き込まない

- **Why**: `ImageResponse` の出力は HTML ではなく PNG であり、CSP の `style-src-attr` 制約の対象にならない。これらを invariant gate に含めると、画像生成側で必要な `style={{...}}` まで撤去対象になり、og:image 等の機能が壊れる。
- **How to apply**:
  - 除外対象は path allowlist で **明示列挙**（`apps/web/app/og/**` 等）。grep の pattern 側で `next/og` import を見て自動除外しようとすると、import 形だけで除外可否が決まらないケースで誤検出する。
  - Phase 5 implementation-plan で「除外ファイル」を表で固定し、Phase 11 evidence で「除外確認」と「対象スキャン PASS」を別行で記録する。
- **Evidence**:
  - `docs/30-workflows/completed-tasks/issue-924-style-src-attr-retirement/outputs/phase-12/unassigned-task-detection.md` § 2 検出観点
  - `scripts/verify-no-inline-style.sh` の exclude 配列
- **Related**: L-I924-001（gate 粒度）

## L-I924-004: 撤去後の置換は 3 区分（A 静的 / B 動的有限 / C 連続値）で先に分類してから実装する

- **Why**: 51 箇所すべてを「とりあえず className 化」しようとすると、`width: ${percent}%` のような連続値や、`backgroundColor: bucketColor` のような bucket 制約付き動的値で行き詰まる。Tailwind の任意値クラスは CSP `style-src` ではなく `style-src-attr` 由来でない別経路で評価されるため、撤去後でも生成 CSS は問題なく通る。
- **How to apply**:
  - 区分 A（静的）: `style={{ display: "flex" }}` 等 → Tailwind utility / CSS module class へ単純置換。
  - 区分 B（動的・離散有限）: bucket 12 色や zone 4 色等 → `data-bucket="N"` / `data-zone="X"` 属性 + `globals.css` / `legacy-public.css` の `[data-bucket="N"] { ... }` rule。値が `tokens.css` OKLch に集約されることを確認。
  - 区分 C（動的・連続値）: progress bar の `width: ${percent}%` 等 → SVG `<rect width="...">` に置換し、HTML inline style から逃がす。
  - 区分判定は Phase 5 implementation-plan で先に表化し、ファイル単位の作業順序を「A → C → B」に固定する（B は token 整備が前提のため最後）。
- **Evidence**:
  - `apps/web/src/components/ui/Avatar.tsx`（区分 B）
  - `apps/web/src/features/admin/components/_dashboard/ZoneDistribution.tsx`（区分 C, SVG rect 化）
  - `apps/web/src/styles/globals.css` / `apps/web/src/styles/legacy-public.css`（区分 B 用 data-attr rule）
  - `docs/30-workflows/completed-tasks/issue-924-style-src-attr-retirement/outputs/phase-12/implementation-guide.md` Part 2
- **Related**: design-tokens.md OKLch 正本化

## L-I924-005: CSP directive 削除は middleware 側の Tests と grep を同サイクルで更新する

- **Why**: `style-src-attr 'unsafe-inline'` を削除すると `apps/web/src/lib/security-headers.spec.ts` の assertion がそのままだと fail する。`apps/web/__tests__/middleware.spec.ts` / `apps/web/playwright/tests/security-headers.spec.ts` も同じ directive を見ているため、ヘッダ削除と test 更新を別 PR にすると CI が割れる。
- **How to apply**:
  - `security-headers.ts` の修正 / focused spec の assertion / Playwright smoke spec の assertion / middleware spec を **1 commit に束ねる**（小さくしても 4 ファイル同時編集）。
  - Phase 4 test-plan で「assertion 更新対象」を表化し、Phase 5 implementation-plan の修正順を「directive 削除 → spec 更新 → grep gate 強化 → 置換実装」に固定する。
- **Evidence**:
  - `apps/web/src/lib/security-headers.ts`（directive 削除）
  - `apps/web/src/lib/security-headers.spec.ts` / `apps/web/__tests__/middleware.spec.ts` / `apps/web/playwright/tests/security-headers.spec.ts`（assertion 同期更新）
- **Related**: L-AWSHH-FU003（CSP Reporting-Endpoints 同様の同期パターン）
