# Phase 5: 実装手順インデックス

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 5 / 13 |
| taskType | implementation |
| implementation_mode | `edit` |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |
| ブランチ | `fix/profile-session-staging-transport-recovery`（起点 `origin/dev` 986d5e669） |
| 想定 PR base | `dev` |

## 目的

Phase 4 で確定した I/O 契約（chain 契約・fallback マトリクス M-1〜M-4・field-tolerant 契約・診断 I/O）を、コード実装可能な **4 つの実装仕様書本体（task-01..04）** へ分解し、依存関係（T01 先行直列 → T02/T03 並列・T04 独立並列）と実行順を確定する。

## 実行タスク

### 5.1 タスク一覧と実装仕様書本体

| タスク | 領域 | 種別 | 実装仕様書 | 概要 |
| --- | --- | --- | --- | --- |
| T01 | git（branch 統合） | NON_VISUAL | [`task-01-observability-branch-integration.md`](./task-01-observability-branch-integration.md) | `origin/fix/profile-session-staging-localhost-endpoint` を work branch へ merge。`ApiTransportError{transportKind,baseHost}` / `describeTransport` / `getEnvironmentResolution`（`environmentExplicit` fail-closed）/ safe-fetch transport ログ / `FetchAuthedError` transport 引数 / magic-link 系 spec 追従が入る（F-6 解消・S2 fail-closed 化・AC-1） |
| T02 | `apps/web`（env） | NON_VISUAL | [`task-02-auth-env-field-tolerant.md`](./task-02-auth-env-field-tolerant.md) | `getAuthEnv` を field 単位 safeParse 化。不正 field のみ drop + `auth_env_field_dropped` key 名のみ warn（F-A 根治・AC-2/AC-5） |
| T03 | `apps/web`（transport） | NON_VISUAL | [`task-03-transport-fallback-chain.md`](./task-03-transport-fallback-chain.md) | `resolveApiTransportChain` / `fetchViaApiTransportChain` を transport.ts に追加し、`authed.ts` を内部 chain 化（公開契約不変）。M-1〜M-4 準拠（F-B 根治・AC-3/AC-4/AC-5） |
| T04 | `scripts/` | NON_VISUAL | [`task-04-diagnose-script-extension.md`](./task-04-diagnose-script-extension.md) | 診断スクリプトの probe 2 系統化（web `/api/me` + API direct `/me`）+ cookie 提供時 `data-cause` 抽出 + `bash scripts/cf.sh` 経由 deploy 版数確認手順の出力（MINOR-2 是正・AC-6） |

### 5.2 依存関係と実行順（T01 → {T02 ∥ T03} ∥ T04）

```
T01（観測性成果統合）─── 直列・最初に実施
 ├─→ T02（env field-tolerant）──┐
 ├─→ T03（transport chain）────┤ T02 と T03 は相互非依存・並列実装可
 └（独立）T04（診断スクリプト）──┘ T04 は T01〜T03 とコード非依存・いつでも並列可
```

| 順序制約 | 理由 |
| --- | --- |
| T01 を最初（直列） | T02/T03 の差分は T01 がもたらす `ApiTransportError` / `getEnvironmentResolution` / `environmentExplicit` の上に積む。先に統合しないと同一ファイル（env.ts / transport.ts / authed.ts）への二重実装・コンフリクトになる（Phase 2 §2.2） |
| T02 ∥ T03 | 対象ファイルが排他（T02: env.ts + env.spec / T03: transport.ts + authed.ts + 各 spec + page.spec 回帰）。`getAuthEnv` の戻り値型が不変のため T03 は T02 の完了を待たない |
| T04 独立 | shell スクリプトのみ。apps/web のコードと相互参照なし |

### 5.3 変更ファイル一覧（全タスク俯瞰・SSOT §5 と 1:1）

| パス | 変更種別 | タスク |
| --- | --- | --- |
| `apps/web/src/lib/env.ts` | 編集（T01 統合 → T02 field-tolerant 化） | T01/T02 |
| `apps/web/src/lib/fetch/transport.ts` | 編集（T01 統合 → T03 chain 追加） | T01/T03 |
| `apps/web/src/lib/fetch/authed.ts` | 編集（T01 統合 → T03 内部 chain 化） | T01/T03 |
| `apps/web/src/lib/fetch/errors.ts` | T01 統合 のみ | T01 |
| `apps/web/src/lib/server-fetch/safe-fetch.ts` | T01 統合 のみ | T01 |
| `apps/web/src/lib/result.ts` | T01 統合 のみ（`SafeResultError.transport` 追加） | T01 |
| `apps/web/app/api/me/[...path]/route.ts` ほか route 4 ファイル + `verify-magic-link.ts` | T01 統合 のみ（`getEnvironmentResolution` 化追従） | T01 |
| `scripts/diagnose-profile-session.sh` | 編集（T01 統合 の tail_hint 行 → T04 probe 2 系統化） | T01/T04 |
| `apps/web/src/lib/__tests__/env.spec.ts` | 編集（T01 統合 → T02 ケース追加） | T01/T02 |
| `apps/web/src/lib/fetch/transport.spec.ts` | 編集（T01 統合 → T03 chain ケース追加） | T01/T03 |
| `apps/web/src/lib/fetch/authed.spec.ts` | 編集（T01 統合 → T03 fallback ケース追加） | T01/T03 |
| `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | T01 統合 のみ | T01 |
| `apps/web/app/api/auth/magic-link/route.route.spec.ts` / `verify/route.route.spec.ts` | T01 統合 のみ（fail-closed 追従） | T01 |
| `apps/web/app/(member)/profile/page.spec.tsx` | 編集（回帰確認ケースの追加のみ。UI 実装は非接触） | T03 |

> 新規ファイル・削除ファイルは無し。`apps/api/**`・`/profile` UI 実装（page.tsx・_components・_lib）・`apps/web/wrangler.toml`・D1 schema・Google Form 仕様は非接触（AC-7）。

### 5.4 検証コマンド（全タスク共通の最終確認・SSOT §8）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
# focused vitest（apps/web package 内から実行。--root=../.. は monorepo root 基準 glob のため必須）
cd apps/web
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/__tests__/env.spec.ts \
  apps/web/src/lib/fetch/transport.spec.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  'apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts' \
  'apps/web/app/(member)/profile/page.spec.tsx'
cd ../..
bash -n scripts/diagnose-profile-session.sh
```

## 完了条件

- [x] T01〜T04 の実装仕様書本体へのリンクを確定
- [x] 依存関係（T01 直列先行 → T02 ∥ T03、T04 独立並列）と理由を確定
- [x] 変更ファイル一覧が SSOT §5 inventory と 1:1（新規・削除なし、apps/api 非接触）
- [x] 全タスク共通の検証コマンド（SSOT §8 形式）を固定

## 成果物

- `outputs/phase-5/phase-5.md`（本ファイル）
- `outputs/phase-5/task-01-observability-branch-integration.md`
- `outputs/phase-5/task-02-auth-env-field-tolerant.md`
- `outputs/phase-5/task-03-transport-fallback-chain.md`
- `outputs/phase-5/task-04-diagnose-script-extension.md`

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | fail-closed・401/410 境界 |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` 契約不変（AC-7） |

- `_shared-context.md` §2（T01〜T04）・§5（inventory）・§8（検証コマンド）
- `outputs/phase-4/phase-4.md`（I/O 契約・M-1〜M-4・RED 観点）

## 統合テスト連携

各 task-0N の `テスト方針` の TC-ID（EV / CH / FB / AU / PG / DG）を Phase 6 で集約し、Phase 7 で変更ブロック限定カバレッジ、Phase 9 で品質ゲート一括、Phase 11 で staging 復旧実機検証（user-gated）へ引き継ぐ。
