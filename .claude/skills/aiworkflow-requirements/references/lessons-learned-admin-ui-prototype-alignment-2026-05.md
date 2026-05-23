# lessons-learned: admin-ui-prototype-alignment 苦戦箇所と再利用パターン（2026-05-23）

> 対象タスク: `docs/30-workflows/admin-ui-prototype-alignment/`
> Wave: implementation / VISUAL / 11 admin routes（dashboard / attendance / members / tags / meetings / meeting detail / schema / schema history / requests / identity conflicts / audit）
> 関連 references: `architecture-admin-api-client.md`, `ui-ux-admin-dashboard.md`, `lessons-learned-04c-admin-backoffice-2026-04.md`, `lessons-learned-parallel-03-appshell-layouts-2026-05.md`
> 出典: `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-12/implementation-guide.md` / `system-spec-update-summary.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md` / `unassigned-task-detection.md`

将来同様の admin UI prototype alignment（multi-route admin 系の per-section degrade + 共通 component + design token 移行）を最短で正しく実装するための知見をまとめる。L-AUIP-001..006 は実装中に発生した苦戦箇所、再利用可能パターンは独立セクションで列挙する。

---

## L-AUIP-001: Error boundary 戦略の per-section 分散化

**苦戦箇所**: server component で `await fetchAdmin()` を try-catch しても、上位の `apps/web/app/(admin)/admin/error.tsx` が throw を全画面エラー化してしまい、複数 endpoint を並列 fetch している admin 画面では 1 endpoint の fail が画面全体の停止に直結した。dashboard / requests / tags のように 3 ~ 5 endpoint を 1 page で扱う route ほど症状が深刻で、partial degrade の余地がなかった。

**解決方針**: throw を normalize する `SafeResult<T>`（`apps/web/src/lib/result.ts`）と `safeServerFetch<T>(path)`（`apps/web/src/lib/admin/safe-server-fetch.ts`）を導入し、server component の `Promise.all([safeServerFetch(...), safeServerFetch(...)])` 内で section 毎に `result.ok` を分岐させて `AdminSectionError` で degrade する。`error.tsx` の責務は「renderer crash 等の真の uncaught」だけに縮小し、API 不到達は section-level fallback で吸収する。

**適用先**: server component で複数 endpoint を並列 fetch し、1 endpoint fail で全画面停止を避けたい admin 系 multi-section page 全般。同じ pattern は member-side multi-widget page（profile dashboard 等）にも横展開できる。

---

## L-AUIP-002: 共通 component の Props contract は仕様書 Phase 2 で確定する

**苦戦箇所**: `AdminSectionCard` / `AdminSectionError` / `AdminEmptyState` / `AdminStat` / `AdminTable` / `AdminQueuePanel` の 6 種共通 component を Phase 5 implementation で立ち上げたが、Props 枝葉決定（`tone` prop が必要か、`accessor` を optional にするか、`emptyState` を slot にするか）が phase 5 中で繰り返し発生し、後続 route 実装の手戻りが累積した。

**解決方針**: Phase 2 design 段階で TypeScript `interface` を textual section に**完全形で**含める。design review は contract level（Props 完全形）で実施し、implementation 着手前に contract drift を排除する。Props 後出しは仕様 ≠ 実装の drift を生むので、Phase 2 で sign-off できない component は Phase 5 scope-in しない。

**適用先**: 「Lane A で共通 component を作り、Lane B-E で並列消費する」パターン全般。共通 component を 3 つ以上同時に投入する wave では Phase 2 contract sign-off を mandatory にする。

---

## L-AUIP-003: barrel import 強制を CI gate に

**苦戦箇所**: Lane A で `apps/web/src/features/admin/components/_shared/` 配下に共通 component を立てた後、Lane B-E を並列に進めたところ深 path import (`from '@/features/admin/components/_shared/AdminSectionCard'`) と barrel import (`from '@/features/admin/components/_shared'`) が混在し、Phase 8 refactor でまとめ修正する羽目になった。並列 wave では import style の drift が構造的に避けられない。

**解決方針**: ESLint `no-restricted-imports` で深 path を deny し、import は barrel 経由に統一する。仕様書には grep gate（`rg "from ['\"]@/features/admin/components/_shared/[A-Z]"` が 0 件）を Phase 5 DoD として明記し、CI gate 化する。これで並列 lane が import style に同期しなくても drift が即時検出される。

**適用先**: 共通 component 群を barrel export 形式で公開し、複数 lane で並列消費する全パターン。`_shared` / `_internal` / `_primitives` 等の barrel 公開境界を持つ feature pkg すべて。

---

## L-AUIP-004: design token 移行は phase 分離で deadlock 回避

**苦戦箇所**: 「HEX 直書き 0 件」を新規 component に強制した結果、既存 `*Panel.tsx` 群（task-04c / task-15 系の resolve 前世代）に HEX が散在しているため「次 phase へ持ち越し」の判断が無限ループ化した。既存 HEX を**今回**まで巻き取るかどうかが phase 終盤で再評価され、scope 確定が遅延した。

**解決方針**: 新規 component（Phase 5 scope = 今回 alignment 対象）と既存 refactor（Phase 8 scope = HEX → OKLch 移行）を**明示的に 2 段階化**する。design review で「既存 *Panel.tsx の HEX は本 wave では棚上げ可」を明示的に承認し、Phase 8 の token migration 範囲を独立タスクとして切り出す。「全部 OKLch にしてから merge」を絶対条件にしない。

**適用先**: design token 移行 wave 全般。新規 component の token-clean を強制しつつ、既存 component の段階的 migration を別 phase に分離する設計パターンとして横展開。CI gate `verify-design-tokens` の対象 path も scope に合わせて narrow にする。

---

## L-AUIP-005: server/client boundary を architecture diagram で明示

**苦戦箇所**: `AdminQueuePanel`（client component）の `selectedId` / `onSelect` state を server page で hold しようとしてビルドエラーになり、`TagsClientShell` / `RequestsClientShell` という wrapper を急遽新設した。これらは Phase 5 scope に明記されていなかったため、scope creep として遅延要因になった。

**解決方針**: Phase 2 で「server page = throw-only / view-compute-only」「client wrapper = state/event-only」の twin principle を architecture text diagram に明示的に列挙する。state ownership を fix することで、queue/drawer 系 panel が必要とする client wrapper の存在を Phase 2 で先回り宣言できる。route ごとの shell wrapper 必要性を Phase 2 design に組み込む。

**適用先**: Next.js App Router + Server Components 配下で interactive state を持つ client panel を扱う全 admin page。queue / drawer / form 系 panel が複数ある page では client shell wrapper の存在を Phase 2 で先決する。

---

## L-AUIP-006: scope cutoff は Phase 4 test contract で lock

**苦戦箇所**: Phase 5 仕様の「`TagsClientShell` / `RequestsClientShell` 新設」「既存 `*Panel.tsx` の書き直し」が「API surface 不変なら持ち越せる」と作業中再評価され、Phase 12 で「持ち越し / 完了」の境界説明が冗長化した。scope の解釈余地が広く、完了判定がぶれた。

**解決方針**: Phase 4 test plan で TC として scope を lock する。test の fail = scope miss として alert する設計にすれば、scope の解釈ぶれは test contract violation として早期に検出される。完了/持越判定は Phase 5 implementation summary で「scope lock TC-XX が pass している→完了」「TC-XX を skip→持越し」と明示理由付きで記述し、phase 12 監査での後付け評価を排除する。

**適用先**: scope creep が起きやすい multi-route / multi-lane wave 全般。Phase 4 test contract を「品質確認」だけでなく「scope cutoff の lock 装置」として運用するパターンを横展開する。

---

## 再利用可能パターン

本 wave で確立し、後続 admin / member 系 UI alignment に転用可能な 5 パターンを列挙する。

### Pattern 1: SafeResult<T> + safeServerFetch（per-section degrade）

- **適用シーン**: server component で複数 endpoint を並列 fetch し、1 endpoint fail でも他 section を render したい場合。
- **パターン要約**: `SafeResult<T> = { ok: true; value: T } | { ok: false; error: ErrInfo }` を返す `safeServerFetch<T>(path)` で throw を normalize → `Promise.all` 後に section 毎に `result.ok` を分岐 → fail section は `AdminSectionError` で degrade、success section は通常 render。
- **コード参照 path**: `apps/web/src/lib/result.ts` / `apps/web/src/lib/admin/safe-server-fetch.ts` / `apps/web/src/features/admin/components/_shared/AdminSectionError.tsx`

### Pattern 2: Barrel export + import path lint enforcement

- **適用シーン**: 共通 component 群を 1 ディレクトリにまとめ、複数 lane / route から並列消費させる場合。
- **パターン要約**: `_shared/index.ts` で barrel export → 利用側は `from '@/features/admin/components/_shared'` のみ許可 → ESLint `no-restricted-imports` で深 path を deny → CI grep gate（`rg "from ['\"]@/features/admin/components/_shared/[A-Z]"` が 0 件）を Phase 5 DoD に組み込む。
- **コード参照 path**: `apps/web/src/features/admin/components/_shared/index.ts` / `apps/web/eslint.config.*`（`no-restricted-imports` rule）

### Pattern 3: data-* attribute driven styling + OKLch token CSS bind

- **適用シーン**: Tailwind / arbitrary value (`bg-[#xxx]`) を排除し、token-only な visual contract を立てたい場合。
- **パターン要約**: component に `data-tone` / `data-state` / `data-component` 等の data attribute を出力 → CSS 側で `[data-tone="warning"] { background: var(--ubm-color-warning-bg); }` のように bind → HEX 直書きと `bg-[#xxx]` を grep gate で 0 件強制 → `verify-design-tokens` CI gate で fail 検出。
- **コード参照 path**: `apps/web/src/styles/tokens.css` / `apps/web/src/features/admin/components/_shared/AdminSectionCard.tsx` / `docs/00-getting-started-manual/specs/design-tokens.md`

### Pattern 4: Per-section degrade boundary（AdminSectionCard wrap → safeServerFetch → AdminSectionError fallback）

- **適用シーン**: admin page で「section 単位の card UI」と「per-section error fallback」を統一したい場合。
- **パターン要約**: page を `<AdminSectionCard title="..." description="...">` でラップ → 内側で `safeServerFetch` の `result.ok` を分岐 → `false` なら `<AdminSectionError onRetry={...} />` を render → `true` なら通常 content。Card 境界と error 境界を同一 component shape に揃えることで、route 横断で見た目と挙動を統一する。
- **コード参照 path**: `apps/web/src/features/admin/components/_shared/AdminSectionCard.tsx` / `AdminSectionError.tsx` / `apps/web/app/(admin)/admin/{dashboard,members,tags,meetings,schema,requests,identity-conflicts,audit}/page.tsx`

### Pattern 5: Phase 4 test-contract scope lock

- **適用シーン**: multi-route / multi-lane wave で scope creep を構造的に防ぎたい場合。
- **パターン要約**: Phase 4 test plan に「scope lock TC」を列挙 → 各 TC は「この component / route / file が wave 内で実装されること」を assert → Phase 5 implementation summary で「lock TC pass = 完了 / TC skip = 持越し（理由必須）」と明示判定 → Phase 12 監査での解釈ぶれを排除。
- **コード参照 path**: `docs/30-workflows/admin-ui-prototype-alignment/phase-4-test-plan.md` / `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-12/implementation-guide.md` § scope lock

---

## 関連未タスク / 後続 wave 連携

- 既存 `*Panel.tsx` 群の HEX → OKLch 完全移行は本 wave 後の独立 token migration wave に分離（L-AUIP-004）。
- `safeServerFetch` の member-side 横展開（profile dashboard 等）は別 wave で評価。
- `AdminQueuePanel` の twin principle（server page = throw-only / client wrapper = state-only）は member-side queue / form panel にも同形で適用可能（L-AUIP-005）。

## 参照

- 出典 phase-12 出力: `docs/30-workflows/admin-ui-prototype-alignment/outputs/phase-12/implementation-guide.md`, `system-spec-update-summary.md`, `skill-feedback-report.md`, `phase12-task-spec-compliance-check.md`, `unassigned-task-detection.md`
- 関連 lessons-learned: `references/lessons-learned-04c-admin-backoffice-2026-04.md`（admin API 9-router 分割）, `references/lessons-learned-parallel-03-appshell-layouts-2026-05.md`（AppShell data-* 契約）
- 関連 patterns: `references/pattern-d1-soft-delete-optimistic-lock-batch.md`（schema alias rollback wave で確立した汎用 pattern）
