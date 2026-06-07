# Workflow Artifact Inventory: issue-1111-proxy-transport-util-unify

## Metadata

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1111-proxy-transport-util-unify/` |
| state | `implemented_local_evidence_captured / refactoring / NON_VISUAL` |
| issue | #1111 CLOSED（未実施のまま close。本 WF は closed のまま実装仕様を作成。PR 文脈は `Refs #1111` のみ） |
| scope | admin/public の transport 選択ロジック（service-binding 優先 → HTTP fallback）を新規 pure util `apps/web/src/lib/fetch/transport-select.ts` へ集約する pure refactor（apps/web only） |
| local implementation | complete（`apps/web` only; `apps/api` / D1 / Google Form unchanged） |
| focused tests | 6 files / 44 tests PASS（`transport-select` 9 + `route` + `server-fetch.binding` + `server-fetch.http-fallback` + `server-fetch.env` 4 + `public`） |
| evidence | focused Vitest 6 files / 44 tests PASS; web typecheck PASS; web lint PASS; verify:phase12-compliance ok:true; gate-metadata ERROR 0 |
| parent | `docs/30-workflows/completed-tasks/admin-meetings-attendance-404-fix-and-ux/`（FU-AMA-002・route.ts の transport 統一を landed 済み） |
| siblings | `task-05a-fetchpublic-service-binding-001`（public.ts 逆方向 fallback 設計）/ `staging-api-url-and-session-recovery`（server-side fetch service-binding 統一） |
| remaining user-gated boundary | commit, push, PR, staging smoke, Issue mutation |

## Workflow artifacts

| Artifact | Purpose |
| --- | --- |
| `index.md` | 現行コード基準に最適化した Issue #1111 実装仕様（YAGNI 解除判定 / 症状 1-4 アーキ決定 / util surface） |
| `phase-01-requirements.md` 〜 `phase-13-pr-creation.md` | Phase 1-13 workflow package（phase-01 に per-caller 真理値表を固定） |
| `artifacts.json` / `outputs/artifacts.json` | root / mirror artifact metadata |
| `outputs/phase-12/main.md` | Phase 12 実装ガイド hub |
| `outputs/phase-12/implementation-guide.md` | util surface 確定 + 呼び出し側差替手順 |
| `outputs/phase-12/system-spec-update-summary.md` | system spec 反映要否（公開 API / D1 / Form 不変 = n/a） |
| `outputs/phase-12/skill-feedback-report.md` | テンプレ改善なし + 知見 K-1..K-3 |
| `outputs/phase-12/unassigned-task-detection.md` | current 0 / baseline 1（auth.ts・起票しない） |
| `outputs/phase-12/documentation-changelog.md` | doc 変更ログ |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | strict 7 root evidence（canonical 9 見出し逐語） |

## Implemented files (apps/web only)

| Path | Change |
| --- | --- |
| `apps/web/src/lib/fetch/transport-select.ts` | new — pure util。`resolveServiceBinding({ binding, disableBinding })` / `stripTrailingSlash` / `selectAndFetch(cfg, path, init)`。binding 優先→HTTP fallback の制御骨格のみ共通化し、`SelectTransportResult` に `base-unavailable` 分岐を持つ |
| `apps/web/src/lib/fetch/__tests__/transport-select.spec.ts` | new — util 単体テスト（9 cases: disableBinding / strip / binding 経路 / fallback / base-unavailable / opt-in log） |
| `apps/web/app/api/admin/[...path]/route.ts` | edit — transport 分岐を util 経由へ切替。`disableBinding = isTestOrPlaywright(env) && !!env.INTERNAL_API_BASE_URL`、`resolveBase = () => apiBase(env)`、log 渡さず（ログ無し維持）、`base-unavailable` 時 500 を維持 |
| `apps/web/src/lib/admin/server-fetch.ts` | edit — util 経由へ切替。`resolveBase = () => resolveApiBase()`（常に string）、log = `logAdminTransport`（scope:admin） |
| `apps/web/src/lib/fetch/public.ts` | edit — util 経由へ切替。`disableBinding = isTestOrPlaywright() && !!env.PUBLIC_API_BASE_URL`、`resolveBase = () => getBaseUrl()`（DEFAULT localhost）、log = `logTransport`（scope 無し）。PLAYWRIGHT cache bypass（`effectiveInit`）は呼び出し側に保持 |

## Boundaries

- pure refactor: binding 優先→HTTP fallback の分岐結果・fallback base 解決・test/playwright 時 binding 無効化条件・各 transport ログ出力が抽出前後で完全不変（issue AC）。
- `auth.ts` session-resolve（`service ?? { fetch }` 三項の軽量変種）は **スコープ外**。同型 4 値 transport 選択ではない別形状で、統合すると pure refactor を破る（unassigned-task-detection の baseline 境界）。
- `apps/api` / D1 schema / Google Form / 新規 endpoint は不変。env 参照は `apps/web/src/lib/env.ts` の公開アクセサ経由のみ（`process.env` 直接参照を新規に増やさない）。
- `LOCAL_DEV_FALLBACK`（`127.0.0.1:8787`）は route.ts 側に残し util へ移送しない（task-18 grep gate 維持・util に 127.0.0.1 系文字列を焼き込まない）。
- commit / push / PR / staging smoke / Issue mutation は user-gated。

## Lessons Learned

専用 lessons file は新設せず本 inventory inline に集約（NON_VISUAL pure refactor・先例 issue-976 / issue-1094）。詳細知見は phase-12 `skill-feedback-report.md` K-1..K-3 と対応。

- **L-I1111-001**: pure refactor で「似ているが同型でない」コード（`auth.ts`）を統合しない。per-caller 真理値（`disableBinding` 等）を保存することが「挙動不変」の必須条件で、判定述語を util へ移送せず呼び出し側 boolean / closure に吸収する。
- **L-I1111-002**: 「YAGNI で見送り中」の前提が付く refactor は、Phase 1 で同型コピーが N 箇所あるかを実コード grep で再確認し、Rule of Three（3 箇所目 = `public.ts`）成立を着手 gate（AC）として明文化する。過去の見送り判断と現状の乖離を機械的に解消できる。
- **L-I1111-003**: transport ログの非対称（route.ts ログ無し / server-fetch `scope:admin` / public scope 無し）は util の `log` を optional 引数（opt-in）にして吸収する。route.ts へのログ新規追加は「挙動変更」ゆえ log を渡さない。
- **L-I1111-004**: fallback base 解決の 3 戦略差（route.ts: LOCAL_DEV_FALLBACK + null fail-fast / server-fetch: 末尾 `/` 除去のみ / public: DEFAULT localhost）を単一関数に潰さず、`resolveBase: () => string | null` を呼び出し側が渡す。`base-unavailable` 分岐は route.ts のみ到達し 500 を返す（その他は常に string ゆえ未到達）。
- **L-I1111-005**: task-18 grep gate（`127.0.0.1:8888` 禁止）対象は `apps/web/src`。util を `src/lib/fetch/` に置くため、`8787` を含むローカル fallback 文字列を util へ移送せず route.ts 内に留め、`8888` への誤改変を静的に避ける。
- **L-I1111-006**: NON_VISUAL refactor の Phase 11 evidence は status `n/a`（screenshot 行を作らない）で focused Vitest / typecheck / lint を代替証跡化する。`verify:phase12-compliance` の evidence は `present` / `pending` / `n/a` の 3 値固定（`n-a` ハイフン表記は invalid 判定で gate fail）。
- **L-I1111-007**: focused vitest を zsh から起動する際、`apps/web/app/api/admin/[...path]/route.spec.ts` のような `[...]` を含むパスはクォートしないと zsh glob で `no matches found`。test 件数確定の実走時はパスを必ずクォートする。
