# Lessons Learned — task-04-w3 window guard and logger（2026-05-08）

> task: `task-04-w3-window-guard-and-logger`
> date: 2026-05-08
> branch: `feat/task-04-window-guard-and-logger-spec`
> canonical guard: `apps/web/src/lib/is-browser.ts`（`isBrowser()` / `whenBrowser()` / `browserHistory()` / `browserDocument()`）
> canonical logger: `apps/web/src/lib/logger.ts`（structured one-line JSON, redaction, `captureException` bridge）
> 関連 spec: `docs/00-getting-started-manual/specs/09-ui-ux.md`（task-04 段落）
> 関連 workflow: `docs/30-workflows/task-04-w3-window-guard-and-logger/`、`docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md`、`docs/30-workflows/ui-prototype-alignment-mvp-recovery/02-runtime/task-04-w3-par-window-guard-and-logger.md`
> 関連 reference: `references/task-workflow-active.md`（task-04 行）、`references/lessons-learned-task-03-w2-par-sentry-workers-sdk-unify-2026-05.md`（capture wrapper 契約の上流）、`indexes/resource-map.md`（task-04 行）、`indexes/quick-reference.md`（task-04 cluster）

## 教訓一覧

### L-T04-001: `@sentry/cloudflare` の `init?.()` optional 呼び出しは contract として固定する

- **問題**: `@sentry/cloudflare` 最新版では `withSentry(handler, { dsn, ... })` を使う前提が増え、`Sentry.init` を export しないバージョンが存在する。test mock も同様に `init` を持たない場合があり、server runtime で `TypeError: Sentry.init is not a function` が発生する。
- **原因**: `instrumentation.ts` 内で `Sentry.init({...})` を必須呼び出しとして書いていた。SDK バージョン差分や mock 差分で `init` の有無が揺れる。
- **解決策**: `Sentry.init?.({...})` の optional chaining で呼ぶ contract に固定。test 側は `init` を持たない mock を許容し、`captureException` のみを契約 surface とする（task-03 capture wrapper の延長）。
- **適用ガード**: `apps/web/src/instrumentation.ts` / `apps/web/src/instrumentation-client.ts` の `init?.()` 呼び出し形式を grep gate に組み込み、`init({` の hard call が増えたら fail する。

### L-T04-002: `process.env.NEXT_RUNTIME` 参照は Workers/Edge で 3 段判定に閉じる

- **問題**: Workers / Edge / Browser / Node SSR で `process.env.NEXT_RUNTIME` の値が異なり、`undefined` も発生する。各 module で独自に分岐すると判定が散逸し、test mock も runtime ごとに必要になる。
- **原因**: runtime tag を一次抽象化していなかった。各所で `typeof window !== "undefined"` / `process.env.NEXT_RUNTIME === "edge"` などの判定が散らばっていた。
- **解決策**: `is-browser.ts` 内に `RUNTIME_TAG()` を closure で持ち、`isBrowser() → NEXT_RUNTIME → workers` の 3 段優先順位で判定する。downstream は `isBrowser()` / `whenBrowser()` / `browserHistory()` / `browserDocument()` のみ参照する契約。
- **適用ガード**: `apps/web/eslint.config.mjs` の `no-restricted-globals` で `window` / `document` の直接参照を禁止し、allow-list（`is-browser.ts` / `instrumentation-client.ts` / `lib/sentry/**` / `__tests__/**`）以外で参照したら lint fail。

### L-T04-003: ESLint allow-list は grep gate と同一文字列正本にする

- **問題**: ESLint `no-restricted-globals` の allow-list と grep gate（`scripts/verify-no-direct-window.sh` 等）の対象 path がドリフトしていると、片方で PASS でも実体に違反が残るリスクがある。
- **原因**: allow-list の path 列挙を ESLint config / grep gate で個別管理していた。
- **解決策**: allow-list 候補（`apps/web/src/lib/is-browser.ts` / `apps/web/src/instrumentation-client.ts` / `apps/web/src/lib/sentry/**` / `apps/web/src/**/__tests__/**`）を「同一文字列リスト」として ESLint config と grep gate の双方で参照する。文字列が一致しなければレビュー段で reject。
- **適用ガード**: Phase 12 compliance check に「ESLint allow-list と grep gate path が文字列一致するか」を必須項目化。

### L-T04-004: `lint` script が `tsc --noEmit` のみだった false-green を再発させない

- **問題**: `apps/web/package.json` の `lint` script が `tsc -p tsconfig.json --noEmit` のみで ESLint を呼ばず、ESLint 違反があっても CI が green になる false-green を引き起こしていた。
- **原因**: `lint` の意味論を typecheck と混同し、ESLint を別 script に分離したまま `lint` だけで両方を担保していると誤解した。
- **解決策**: `lint` script を `tsc -p tsconfig.json --noEmit && eslint 'src/**/*.{ts,tsx}'` の直列接続にし、Phase 11 evidence の `lint.log` で `exit 0` と `eslint` 行の両方が出ていることを確認する。
- **適用ガード**: Phase 11 strict evidence で `lint.log` を grep し、`eslint` 文字列が含まれていなければ Phase 11 を fail とする compliance 項目を追加。

### L-T04-005: redaction の `Error` インスタンス特別扱いは shape 正規化で短絡する

- **問題**: structured logger の redaction が generic な key sanitizer のみで実装されており、`Error` インスタンスを渡すと `name` / `message` / `stack` が dropped されるか、`enumerable: false` で空オブジェクトに正規化される。
- **原因**: `redactPII` を「キー単位の sanitize」のみで設計し、Error を generic object として扱った。
- **解決策**: redaction 入口に `instanceof Error` の short-circuit を最優先で配置し、`{ errorName, message, stack }` shape に正規化する（PII を含む可能性のある stack は別途 truncate）。
- **適用ガード**: `apps/web/src/lib/logger.ts` のテストで「Error → `{ errorName, message, stack }` 正規化」「PII を含む key の sanitize」「Error 内 PII の sanitize」の 3 ケースを必須カバー。

### L-T04-006: `history.replaceState` の test 用 DI は contract に組み込む

- **問題**: `apps/web/src/lib/url/login-state.ts` などの URL 操作で `window.history.replaceState` を直接呼ぶと、JSDOM / Workers test 環境で history が固有に書き換わり、test 間で副作用が leak する。
- **原因**: `replaceState` の DI 契約がなく、test では `vi.spyOn(window.history, "replaceState")` で対応するしかなかった。
- **解決策**: `historyImpl?: Pick<History, "replaceState">` を opt-in DI として関数 signature に組み込み、test は明示的に `historyImpl` を注入する（`login-state.ts` で実証済み）。production code は default で `browserHistory()` を使う。
- **適用ガード**: `is-browser.ts` を呼ぶ全モジュールで「DI hook が provided か」を Phase 12 compliance に列挙し、test での history mock を `historyImpl` 経由に統一する。

### L-T04-007: Phase 1〜3 の workflow を Phase 12 で完結させる際は root ledger を同 commit で更新する

- **問題**: task-04 のワークフローは初期に Phase 1〜3 のみで設計され、後から Phase 12 strict 7 outputs を追加した。`artifacts.json` / `index.md` の Phase 一覧が更新されないまま Phase 12 outputs が出現し、root ledger がドリフトした。
- **原因**: Phase 拡張時に「Phase 出力の追加」と「root ledger 更新」を別 commit にしてしまい、間に CI / verify-indexes が走ると drift を検知できなかった。
- **解決策**: Phase 拡張時は `artifacts.json` / `index.md` を **同一 commit** で更新する gate を skill 側で必須化。Phase 12 compliance check の冒頭に「root ledger に当該 Phase が enumerate されているか」を入れる。
- **適用ガード**: `task-specification-creator` skill 側に「Phase 拡張 = root ledger 更新を同 commit で」を明文化。`scripts/verify-workflow-artifacts.sh`（仮称）で artifacts.json と outputs/ の Phase 集合の AND を取る。

### L-T04-008: `captureException` への同期 throw を logger は握り潰す契約を Phase 1 で固定する

- **問題**: structured logger の `logger.error()` 内部から `captureException` を呼ぶ際、Sentry SDK 側が同期 throw（DSN 不正 / SDK 未 init / dynamic import 失敗）するとアプリ本体に伝播し、観測層障害が user 操作の 500 を引き起こす。
- **原因**: `logger.error` の契約に「観測 API は fail-soft」を明示しなかった（task-03 L-T03-004 が capture wrapper 単体には適用済みだが、logger 経由のパスで再発した）。
- **解決策**: `logger.error()` 内の `captureException` 呼び出しを `try { captureException(...) } catch { /* swallow */ }` で wrap し、observability API は Phase 1 で「アプリ本体に throw しない」を contract として固定。capture wrapper 自身が fail-soft であっても logger 経由で同期 throw を許容しない。
- **適用ガード**: `apps/web/src/lib/logger.ts` の test に「`captureException` が throw しても `logger.error` が throw しないこと」を必須ケースで追加。

## 横展開チェックリスト

ランタイムガード / 構造化ロガー / observability bridge を含む将来タスクで毎回確認する:

- [ ] `Sentry.init?.()` の optional 呼び出し形式が維持されているか（L-T04-001）
- [ ] runtime tag 判定が `is-browser.ts` の 3 段判定に閉じているか（L-T04-002）
- [ ] ESLint `no-restricted-globals` allow-list と grep gate path が文字列一致しているか（L-T04-003）
- [ ] `lint` script に `eslint` 呼び出しが含まれ、Phase 11 evidence で `eslint` 行が確認できるか（L-T04-004）
- [ ] redaction が `instanceof Error` short-circuit を最優先で持つか（L-T04-005）
- [ ] browser globals 参照モジュールが `historyImpl` 等の DI hook を opt-in で持つか（L-T04-006）
- [ ] Phase 拡張時に `artifacts.json` / `index.md` が同 commit で更新されているか（L-T04-007）
- [ ] observability API（`logger.error` / `captureException`）が同期 throw を握り潰す契約か（L-T04-008）
