# lessons-learned: Issue #393 stableKey Literal Legacy Cleanup 苦戦箇所（2026-05-03）

> 対象タスク: `docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/`
> 状態: `strict_ready` / NON_VISUAL / Phase 1-12 completed / Phase 13 pending_user_approval
> 出典: `outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` / `outputs/phase-11/evidence/lint-strict-after.txt` / `packages/shared/src/zod/field.ts` / `scripts/lint-stablekey-literal.test.ts`
> 関連: 親タスク `03a-stablekey-literal-lint-enforcement`（AC-7） / follow-up `task-03a-stablekey-strict-ci-gate-001.md`

03a wave で warning-mode dry-run まで到達した stableKey literal 検査を strict CI gate 昇格させるための blocker、すなわち legacy literal 148 件 / 14 ファイルを一掃した wave。`packages/shared/src/zod/field.ts` に新規追加した `STABLE_KEY` const SSOT への named import 参照に置換し、`node scripts/lint-stablekey-literal.mjs --strict` を 0 violation で PASS させた。次回類似の「SSOT 導入 + 既存 literal 一括置換」wave で同じ判断を最短で再現できるよう、苦戦箇所を 5 件固定する。

## L-I393-001: branded type と命名衝突するため SSOT は SCREAMING_SNAKE_CASE で固定する

**苦戦箇所**: `packages/shared/src/zod/field.ts` には既に branded type `StableKey` が export されており、PascalCase / camelCase の `stableKey` / `StableKey` は型空間と値空間の両方で衝突候補となる。素直に `export const StableKey = { ... } as const` とすると、型 import と値 import の解決順で IDE のジャンプ先が drift し、レビュー時に「これは型？値？」が一瞬で判別できない。`as const` だけでは「列挙キーが内部値と一致している」契約が型レベルで担保されず、後段の typo 混入リスクが残る。

**5分解決カード**: 値レベル SSOT は **SCREAMING_SNAKE_CASE** で `STABLE_KEY` と命名し、`as const satisfies { readonly [K in StableKeyName]: K }` を必ず付与してキー名と値の一致を型で固定する。branded type が既に存在する module で新規 const を足す場合は、まず `rg "export (type|interface|const) <候補名>" packages/shared/src/zod/field.ts` で衝突有無を確認し、衝突するなら命名規約レイヤー（型=PascalCase / 値=SCREAMING_SNAKE_CASE）で必ず逃がす。`satisfies` 句の `StableKeyName` のような型パラメータは別途 export して再利用可能にしておく。

**promoted-to**: `references/architecture-monorepo.md`, `references/lessons-learned-03a-stablekey-literal-lint-enforcement-2026-05.md`

## L-I393-002: 値レベル lint script は型レベル literal を見ないので indexed-access type も同 wave で潰す

**苦戦箇所**: `scripts/lint-stablekey-literal.mjs` は AST の値ノードしか走査しないため、`MeProfileStatusSummary["rulesConsent"]` のような **indexed-access 型** に書かれた string literal は検知されない。値の置換だけ完了して strict PASS したと思っても、型レベル literal が残ると「SSOT 化された」契約が嘘になり、将来 `STABLE_KEY` のキー名を変えた瞬間に型側だけ silent break する。実際 family D（use-case / view-model）と family E（web profile components）で複数件の indexed-access literal が後追いで見つかり、family ごとに re-grep が必要になった。

**5分解決カード**: 値レベル lint と並行して、置換 wave 内で必ず `rg '\[\s*"<候補キー>"\s*\]' apps packages` を全候補キーに対して回し、indexed-access 型 literal を検出する。ヒット箇所は `T[typeof STABLE_KEY.<key>]` 形式に置換する。lint script 側は将来 ts-morph 等で型ノードまで走査する案を follow-up に積み、当面は **置換 wave のチェックリストに「indexed-access 全 grep」を必須項目で固定**する。family 分割（A〜G）の各 family について、値レベル grep と型レベル grep の 2 系統を同 wave 内で完了させる。

**promoted-to**: `task-specification-creator/references/spec-template-evidence.md`, `references/spec-guidelines.md`

## L-I393-003: JSX attribute literal は ESLint auto-fix 候補にならず手作業で family 単位に洗い出す

**苦戦箇所**: family E / F の web components には `data-role="nickname"` のような **JSX attribute literal** が多数あり、これも stableKey literal の対象。eslint-react 系の自動修正は attribute name までは見るが attribute **value** の semantic までは推論しないため auto-fix 候補にならない。素朴に `rg 'data-role="'` で grep すると testing-library 由来の test fixture や storybook まで巻き込み、apps/web 本体だけを対象とするため scope 制御に追加 1 ステップが必要だった。

**5分解決カード**: JSX attribute literal の grep は `rg 'data-(role|key|stable[-_]?key)="' apps/web/src apps/web/app -g '!**/*.test.*' -g '!**/*.stories.*'` のように **本体パスへの whitelist + テスト/stories の blacklist** を二重に設定する。置換は `data-role={STABLE_KEY.<key>}` 形式に統一し、attribute 名規約（`data-role` / `data-stable-key` 等）はファイル横断で 1 つに揃える。family ごとの完了判定は「該当 family の全ファイルで `rg 'data-role="'` が 0 件」を Phase 11 evidence に固定する。

**promoted-to**: `references/spec-guidelines.md`, `task-specification-creator/references/spec-template-implementation-evaluation.md`

## L-I393-004: `eslint-disable` / `@ts-ignore` / dynamic 合成を逃げ道にしない不変条件を additive test で固定する

**苦戦箇所**: 148 件の literal を一気に置換する wave では、時間圧で `// lint-disable-next-line stablekey-literal` や `` `${prefix}_consent` `` のような dynamic string composition に逃げる誘惑が常に発生する。これらは lint script を骨抜きにし、後段で再発検知が効かなくなる。03a で warning-mode に倒した経緯と同じく、issue-393 wave でも「baseline 0 を未来も維持する」ための静的ガードが必要だった。

**5分解決カード**: cleanup wave 完了時に必ず `scripts/lint-stablekey-literal.test.ts` に **issue-393 0-violation 期待値テスト** を additive で追加し、`expect(strictResult.violations).toHaveLength(0)` を将来回帰の static guard として固定する。inline suppression は `rg "lint-disable.*stablekey" apps packages` で 0 件を Phase 11 evidence に残す。dynamic 合成は `rg '\`\$\{[^}]+\}_(consent|email|nickname)\`' apps packages` のような pattern grep を併走させ、置換完了 wave のチェックリスト最終項目とする。「逃げ道 0 件」を不変条件として SKILL 化する。

**promoted-to**: `references/lessons-learned-03a-stablekey-literal-lint-enforcement-2026-05.md`, `task-specification-creator/references/spec-template-quality-gates.md`

## L-I393-005: SSOT module への単一方向 import で循環依存リスクを潰す

**苦戦箇所**: family G の `packages/shared/src/utils/consent.ts` は consent 判定 util であり、`STABLE_KEY` を import すると schema layer (`zod/field.ts`) → utils layer の依存方向となる。逆向き（utils → field）の import が既に存在すると、SSOT 導入で循環依存が発生し build が落ちる。実際に最初の試行で IDE の auto-import が誤って utils 経由の re-export を提案し、循環の手前まで行った。

**5分解決カード**: SSOT module を新設する際は、import 方向を **schema (SSOT) → utils → use-case → routes** の単一方向に固定し、`packages/shared/src/zod/field.ts` から utils への import が **存在しないこと**を `rg "from '\.\./utils/" packages/shared/src/zod/field.ts` で確認してから const を追加する。auto-import 候補は必ず手動で SSOT module パスに揃え、`re-export 経由の SSOT 参照` は禁止する。循環検査は `pnpm typecheck` の error message に加え、`pnpm madge --circular packages/shared/src` 等で wave 完了時に明示確認する。

**promoted-to**: `references/architecture-monorepo.md`, `references/lessons-learned-03a-stablekey-literal-lint-enforcement-2026-05.md`
