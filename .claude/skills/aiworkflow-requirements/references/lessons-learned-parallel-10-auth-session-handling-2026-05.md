# lessons-learned: parallel-10 Auth Session Handling 苦戦箇所（2026-05-15）

> 対象タスク: `docs/30-workflows/parallel-10-auth-session-handling/`
> 状態: `implemented_local_evidence_captured / implementation / NON_VISUAL / Phase 13 blocked_pending_user_approval`
> 出典: `outputs/phase-12/{implementation-guide,system-spec-update-summary,skill-feedback-report,phase12-task-spec-compliance-check}.md`
> 関連 workflow: parallel-08（admin mutation 親仕様） / 06b-A（`/me` session resolver） / `apps/web` middleware / `lib/url/login-redirect` / `lib/fetch/authed`

UI prototype alignment MVP recovery の一環として、`fetchAuthed` の 401（`AuthRequiredError`）/ 403（`FetchAuthedError`）throw を mutation 共通 hook `useAdminMutation` で一元 catch し、401 → safe redirect / 403 → alert toast に振り分ける統一処理を実装した。今後の admin mutation 追加・client side auth 経路実装で同じ判断を 5 分で再現するため、苦戦箇所を promotion target 付きで固定する。

## L-PARA10-001: client hook の副作用境界は DI で隔離する

**苦戦箇所**: `window.location.assign` / `useToast()` / `usePathname()` を hook 本体から直接呼ぶと、vitest で `jsdom` の `window.location` を mock しづらく、`ToastProvider` 未配置の test では `useToast()` が throw する。SSR からの誤呼び出しで `window` ReferenceError も発生する。

**5分解決カード**: client hook を spec する Phase 2 で「副作用境界 DI 必須項目チェックリスト」を必ず確認する: `redirector` (location.assign 相当) / `toaster` (toast 表示) / `currentPath` (現在 URL 取得)。これら 3 つを optional DI 引数として hook 公開 API に組み込み、未注入時は内部 default に fallback、test では mock 注入で window 依存を完全排除する。SSR 経路では `isBrowser()` guard で navigation を no-op 化し、Phase 2 hook-design.md のテンプレに DI チェックリストを転記する。

**promoted-to**: `.claude/skills/task-specification-creator/SKILL.md`（Phase 2 client hook DI 必須項目チェックリスト）, `references/architecture-implementation-patterns-core.md`（client hook side-effect DI pattern）, `references/lessons-learned-parallel-08-admin-mutation-2026-05.md`（親仕様 hook と DI 境界の整合）

## L-PARA10-002: `window` 直接参照は lint rule (`no-restricted-globals: window`) で構造的に禁止する

**苦戦箇所**: 初期実装で `window.location.pathname` を hook 本体に書いてしまい、`apps/web` の lint rule `no-restricted-globals: window` で fail。実装後の手戻りで `isBrowser()` ヘルパー経由に書き換えた。Phase 5 の不変条件段にこの lint rule が明示されていなかったため事前察知できなかった。

**5分解決カード**: `apps/web` を対象とする全 client 実装 task の Phase 5 implementation-plan.md「不変条件」段に `no-restricted-globals: window` を必ず転記する。代わりに `apps/web/src/lib/browser/is-browser.ts` 経由（あるいは `typeof window !== "undefined"` を一箇所に閉じた helper）の利用を強制し、Phase 6 の検証ステップに「`grep -nE "^[^/]*window\." apps/web/src` 結果に hook 本体ヒット 0」を gate として明示する。

**promoted-to**: `.claude/skills/task-specification-creator/SKILL.md`（Phase 5 不変条件テンプレに `no-restricted-globals: window` を常時転記）, `references/architecture-implementation-patterns-core.md`（SSR / client 境界の lint gate）

## L-PARA10-003: Toast variant 拡張は後方互換でも既存 caller grep 影響範囲を Phase 5 で固定する

**苦戦箇所**: `toast(message)` を `toast(message, variant?: "alert" | "status")` に拡張した。optional 引数で後方互換だが、既存 caller の意図しない `variant` 経路混入や `role` 期待の test が壊れる可能性があった。本サイクルでは事故にならなかったが、汎用ルールとして固定したい。

**5分解決カード**: API surface（hook / primitive / util）に optional 引数を追加する全タスクで、Phase 5 implementation-plan.md に「既存 caller 影響範囲確認」セクションを必須化する。`grep -rn "toast(" apps/web/src` のような既存 caller 一覧を Phase 5 時点で固定し、Phase 6 step 7 の検証コマンドにも grep を含める。Phase 12 compliance check で「既存 caller 一覧 vs 現実装の影響範囲」を再確認する。

**promoted-to**: `.claude/skills/task-specification-creator/SKILL.md`（Phase 5 backward-compatible expansion impact grep）, `references/lessons-learned-design-tokens-callsite-grep.md`

## L-PARA10-004: `pnpm` script の引数は vitest にそのまま伝搬しない

**苦戦箇所**: `pnpm --filter @ubm-hyogo/web test apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx` のように file filter を渡しても、`package.json` の `test` script の書き方によっては full suite が実行され filter が効かない場合があった。検証時間が伸び、focused vitest と勘違いするリスクがある。

**5分解決カード**: Phase 6 step 7（検証コマンド一覧）に「`pnpm --filter <pkg> test` 系で filter が効かない場合は `pnpm exec vitest run --root=. --config=apps/web/vitest.config.ts <path>` を直叩きする」旨を注記する。focused 検証では必ず実行された test name を log に確認し、full suite 通過時間と乖離があれば filter 不発を疑う。

**promoted-to**: `.claude/skills/task-specification-creator/SKILL.md`（Phase 6 検証コマンド `pnpm` filter 不発リスク）, `references/lessons-learned-vitest-focused-execution.md`

## L-PARA10-005: `02-auth.md` の Client 401 / 403 ハンドリングを参照導線の正本にする

**苦戦箇所**: 個別 mutation 毎に 401 catch / 403 catch を場当たり実装していた歴史があり、UI 全体での挙動が割れていた。`02-auth.md` には authn / authz の API contract 記載はあったが「client 側で 401/403 をどう扱うか」の正本がなく、新規 admin mutation 実装者は parallel-08 の親仕様まで遡る必要があった。

**5分解決カード**: `docs/00-getting-started-manual/specs/02-auth.md` に新設した「Client 401 / 403 ハンドリング」セクションを `useAdminMutation` 利用 caller を増やす際の必読参照として正本化する。新規 admin mutation の Phase 1 要件定義テンプレに `02-auth.md#client-401-403-ハンドリング` への明示リンクを含める。本セクションを更新する際は本 lessons / artifact-inventory も同一 wave で更新する。

**promoted-to**: `.claude/skills/task-specification-creator/SKILL.md`（admin mutation Phase 1 要件定義の必読参照）, `references/api-endpoints.md`（admin mutation 401/403 cross-link）, `references/architecture-implementation-patterns-core.md`（client error handling matrix）

## L-PARA10-006: silent refresh は MVP 不採用、24h TTL を 401 → redirect で吸収する

**苦戦箇所**: 401 / 403 ハンドリング統一の議論で「Auth.js silent refresh を入れるべきか」が論点になり、Phase 2 設計レビューで採否判断に時間を消費した。Workers Paid + refresh token 取得経路が必要で、Free tier MVP では割に合わない。

**5分解決カード**: MVP では silent refresh を採用しない（Auth.js JWT 24h TTL の範囲内 expiry は 401 → safe redirect で吸収）。Workers Paid 移行 + refresh token 取得経路の整備が揃った時点で再検討する。本判断を覆す前に `outputs/phase-02/auth-session-policy.md` を必ず再読し、変更時は `02-auth.md` / `13-mvp-auth.md` / 本 lessons を同一 wave で更新する。

**promoted-to**: `.claude/skills/task-specification-creator/SKILL.md`（MVP scope 判断: silent refresh 不採用根拠の参照）, `docs/00-getting-started-manual/specs/13-mvp-auth.md`（MVP 認証方針の silent refresh セクション）, `references/lessons-learned-06b-a-me-api-authjs-session-resolver-2026-05.md`

## 関連 artifact / 参照

- `references/workflow-parallel-10-auth-session-handling-artifact-inventory.md`（同 wave で個別更新）
- `docs/30-workflows/parallel-10-auth-session-handling/outputs/phase-12/`（7 strict files）
- `docs/00-getting-started-manual/specs/02-auth.md`（§Client 401 / 403 ハンドリング 正本）
- `docs/00-getting-started-manual/specs/13-mvp-auth.md`（MVP silent refresh 不採用根拠）
- `references/lessons-learned-06b-a-me-api-authjs-session-resolver-2026-05.md`（`/me` session resolver の隣接 lessons）
- `indexes/quick-reference.md`（§parallel-10 Auth Session Handling 早見表）
- `references/task-workflow-active.md`（§parallel-10-auth-session-handling 行）
