# Phase 5: 実装手順インデックス

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-me-404-authenticated-admin-recovery` |
| Phase | 5 / 13 |
| taskType | implementation |
| implementation_mode | `edit`（error-handler / safe-fetch / diagnose 編集 + api-cd.yml 新規） |
| visualEvidence | VISUAL_ON_EXECUTION（復旧後 screenshot は user-gated） |
| workflow_state | `implemented_local_runtime_pending` |
| ブランチ | `fix/profile-me-404-authenticated-admin-recovery`（起点 `origin/dev`・#1237 含む） |
| 想定 PR base | `dev` |
| SSOT | `_shared-context.md` |

## 目的

Phase 4 で確定した I/O 契約（notFound ログ payload・route-404 ログ・api-cd job 契約・診断 probe）を、コード実装可能な **4 つの実装仕様書本体（task-01..04）** へ分解し、依存関係（T01 先行直列 → T02 ∥ T03・T04 独立並列）と実行順を確定する。

## 実行タスク

### 5.1 タスク一覧と実装仕様書本体

| タスク | 領域 | 種別 | 実装仕様書 | 概要 |
| --- | --- | --- | --- | --- |
| T01 | `apps/api` | NON_VISUAL | [`task-01-api-notfound-observability.md`](./task-01-api-notfound-observability.md) | `notFoundHandler` に構造化診断ログ（`reason="route_not_matched"` + method/path + `hasAuthorization`/`hasSessionCookie` boolean）を追加し `/me` 404 の data-cause を一意化（応答 body/status 不変・D-B 根治・AC-2） |
| T02 | `.github/workflows` + `scripts` | NON_VISUAL | [`task-02-apps-api-auto-cd-and-smoke-gate.md`](./task-02-apps-api-auto-cd-and-smoke-gate.md) | apps/api 自動 CD（dev→staging / main→production）を `web-cd.yml` と同型で新設。deploy 後に `/me/healthz` 200 + minted-cookie 認証 `/me` 200 smoke gate（S1/D-A 根治・AC-3） |
| T03 | `apps/web` | NON_VISUAL | [`task-03-web-route404-logging.md`](./task-03-web-route404-logging.md) | `safe-fetch` の `logServerFetchFailure` で route-404（`code` が `*_404`）を `routeNotFound:true` 付き `server_fetch_failed` に明示記録（UI 不変・AC-4） |
| T04 | `scripts` | NON_VISUAL | [`task-04-diagnose-script-route-and-parity.md`](./task-04-diagnose-script-route-and-parity.md) | `diagnose-profile-session.sh` に `/me/healthz` vs `/me` の route 存在差分 + web↔api deploy parity hint を追加（read-only・冪等・AC-5） |

### 5.2 依存関係と実行順（T01 → {T02 ∥ T03} ∥ T04）

```
T01（apps/api notFound 観測性）─── 直列・最初（観測の土台）
 ├─→ T02（apps/api 自動 CD + smoke gate）──┐ T02 と T03 は相互非依存・並列実装可
 └─→ T03（web route-404 ログ）────────────┘
（独立）T04（diagnose script 拡張）──────── T01〜T03 とコード非依存・いつでも並列可
```

| 順序制約 | 理由 |
| --- | --- |
| T01 を最初（直列） | notFound 構造化ログが「`/me` が route 未マッチで 404 か」を一意化する観測の土台。T02 smoke gate と T03 web ログが指す data-cause を T01 ログと突合して確定するため、先に観測軸を固定する（Phase 2 §2.1） |
| T02 ∥ T03 | 対象が排他（T02: `.github/workflows/api-cd.yml` + `scripts/smoke/`、T03: `apps/web/src/lib/server-fetch/safe-fetch.ts` + spec）。相互参照なし |
| T04 独立 | shell スクリプトのみ。apps コードと相互参照なし。secret 非出力・read-only |

### 5.3 変更ファイル一覧（全タスク俯瞰・SSOT §8 と 1:1）

| パス | 変更種別 | タスク |
| --- | --- | --- |
| `apps/api/src/middleware/error-handler.ts` | 編集（notFound 構造化ログ追加） | T01 |
| `apps/api/src/middleware/error-handler.spec.ts` | 新規 | T01 |
| `.github/workflows/api-cd.yml` | 新規 | T02 |
| `scripts/smoke/runtime-admin-api.sh` | 新規 | T02 |
| `apps/api/wrangler.toml` | 確認のみ（deploy env 整合・変更しない） | T02 |
| `apps/web/src/lib/server-fetch/safe-fetch.ts` | 編集（route-404 ログ） | T03 |
| `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | 編集 | T03 |
| `scripts/diagnose-profile-session.sh` | 編集（route 差分 + parity hint） | T04 |

> 新規ファイル: `api-cd.yml` / `runtime-admin-api.sh` / `error-handler.spec.ts`。削除ファイルなし。`apps/api/src/routes/me/**`・`/profile` UI（page.tsx・_lib）・`apps/web/wrangler.toml`・`apps/api/wrangler.toml`（binding/vars）・D1 schema・Google Form 仕様は非接触（AC-6）。

### 5.4 検証コマンド（全タスク共通の最終確認・SSOT §8）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# focused vitest（T01: api / T03: web）
cd apps/api
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  apps/api/src/middleware/error-handler.spec.ts
cd ../web
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  'apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts'
cd ../..
# T02: yaml 構文 + shell 構文
bash -n scripts/smoke/runtime-admin-api.sh
# api-cd.yml は actionlint / yaml parse で検証（CI gate）
# T04: 診断スクリプト構文
bash -n scripts/diagnose-profile-session.sh
```

## 完了条件

- [x] T01〜T04 の実装仕様書本体へのリンクを確定
- [x] 依存関係（T01 直列先行 → T02 ∥ T03、T04 独立並列）と理由を確定
- [x] 変更ファイル一覧が SSOT §8 inventory と 1:1（新規 3・削除なし・`/me` route + UI 非接触）
- [x] 全タスク共通の検証コマンド（SSOT §8 形式）を固定

## 成果物

- `outputs/phase-5/phase-5.md`（本ファイル）
- `outputs/phase-5/task-01-api-notfound-observability.md`
- `outputs/phase-5/task-02-apps-api-auto-cd-and-smoke-gate.md`
- `outputs/phase-5/task-03-web-route404-logging.md`
- `outputs/phase-5/task-04-diagnose-script-route-and-parity.md`

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401/410 境界・fail-closed |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` 契約不変（AC-6） |

- `_shared-context.md` §2（T01〜T04）・§8（inventory）
- `outputs/phase-4/phase-4.md`（I/O 契約・job 契約・RED 観点）

## 統合テスト連携

各 task-0N の `テスト方針` の TC-ID（NF / SF / CD / DG）を Phase 6 で集約し、Phase 7 で変更ブロック限定カバレッジ、Phase 9 で品質ゲート一括、Phase 11 で staging 復旧実機検証（認証 `/me` 200・user-gated）へ引き継ぐ。
