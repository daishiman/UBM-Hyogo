# task-01: 観測性成果統合（`fix/profile-session-staging-localhost-endpoint` の merge）

`[実装区分: 実装仕様書]`

> 判定根拠: CONST_004 に従う。本タスクは未マージ branch `fix/profile-session-staging-localhost-endpoint`（観測性 + fail-closed 実装・dev 同期済 82f19bcc8・PR 未作成）を work branch へ git merge で統合し、T02/T03 の前提となる `ApiTransportError` / `describeTransport` / `getEnvironmentResolution` を本 branch に揃えるコード統合作業を伴うため実装仕様書とする。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ワークフロー | `profile-session-staging-transport-recovery` |
| 親 Phase | Phase 5（実装） |
| タスク ID | T01 |
| ブランチ | `fix/profile-session-staging-transport-recovery`（起点 `origin/dev` 986d5e669） |
| visualEvidence | NON_VISUAL（merge 結果は focused vitest green で判定） |
| 想定 PR base | `dev` |
| 並列性 | **直列・最初に実施**（T02/T03 の前提。T04 とは独立だが、同一ファイル diagnose-profile-session.sh に T01 の tail_hint 1 行が入るため T04 も T01 後を推奨） |
| 紐づく AC / F / S | AC-1（merge + 既存テスト green）/ F-6（観測性未デプロイの解消）/ S2（localhost fail-closed 化） |

## 背景

観測性 + fail-closed の先行実装は branch `fix/profile-session-staging-localhost-endpoint` に存在するが **dev 未マージ → staging 未デプロイ**（F-6）。現行 staging ログには `transportKind` / `baseHost` が出ず、S1〜S4 のどれが起きているか確定できない。また T02/T03 の差分はこの branch がもたらす `ApiTransportError` / `getEnvironmentResolution` / `environmentExplicit` の上に積むため、先に統合しないと env.ts / transport.ts / authed.ts への二重実装・コンフリクトになる（Phase 2 §2.2）。当該 branch は 2026-06-11 に dev 同期済みのため、`origin/dev` 起点の work branch への merge はコンフリクト最小で完了する見込み。

## 目的

`git merge origin/fix/profile-session-staging-localhost-endpoint` を work branch で実施し、観測性（transport 診断付きエラー・構造化ログ）と fail-closed（`ENVIRONMENT` 非明示時の localhost fallback 禁止）を本 WF branch に取り込む。merge 後、取り込んだ実装の既存テストがすべて green であることを focused vitest で確認する（AC-1）。本 WF の PR が当該 branch の成果を dev へ届ける（個別 PR は立てない。SSOT §6）。

## 1. 変更対象ファイル一覧（CONST_005 必須）

merge で取り込まれるファイル（`git diff origin/dev...origin/fix/profile-session-staging-localhost-endpoint -- apps/web scripts` の実測 18 ファイル・227 insertions / 29 deletions）。変更種別はすべて「編集（merge 取込）」。新規・削除なし。

| パス | merge で入る差分の要点 |
| --- | --- |
| `apps/web/src/lib/fetch/transport.ts` | `ApiTransportDescriptor{transportKind,baseHost}` 型 / `describeTransport()` / `ApiTransportError`（cause 付き）追加。`fetchViaApiTransport` が transport 層 throw を `ApiTransportError` で包む。localhost fallback 条件に `env.environmentExplicit === true` を追加（**fail-closed**: `ENVIRONMENT` 未注入では localhost に落ちず throw） |
| `apps/web/src/lib/env.ts` | `EnvironmentResolution{environment,explicit}` 型 + `getEnvironmentResolution()` 追加（`ENVIRONMENT` が enum 3 値のとき explicit:true、欠落/不正値は `{local, explicit:false}`） |
| `apps/web/src/lib/fetch/authed.ts` | `getEnvironment()` → `getEnvironmentResolution()` 化（`environmentExplicit` を resolveApiFetch へ伝播）。`describeTransport` で descriptor を作り `FetchAuthedError` の第 3 引数に渡す |
| `apps/web/src/lib/fetch/errors.ts` | `FetchAuthedError` に optional `transport?: ApiTransportDescriptor` 引数・プロパティ追加 |
| `apps/web/src/lib/result.ts` | `SafeResultError` に optional `transport?: {transportKind, baseHost}` 追加 |
| `apps/web/src/lib/server-fetch/safe-fetch.ts` | `transportFromError()` 追加。`normalizeError` が err の transport descriptor を `SafeResultError.transport` へ正規化。`server_fetch_failed` ログ payload に `transportKind`/`baseHost` を展開 |
| `apps/web/app/api/auth/gate-state/route.ts` / `apps/web/app/api/auth/magic-link/route.ts` / `apps/web/app/api/auth/magic-link/verify/route.ts` / `apps/web/app/api/me/[...path]/route.ts` / `apps/web/src/lib/auth/verify-magic-link.ts` | `getEnvironment()` → `getEnvironmentResolution()` 化（`environmentExplicit` 伝播の caller 追従） |
| `apps/web/src/lib/__tests__/env.spec.ts` | `getEnvironmentResolution` の explicit/implicit 判定テスト追加 |
| `apps/web/src/lib/fetch/transport.spec.ts` | `ApiTransportError` / `describeTransport` / fail-closed（非明示 local で throw）の契約テスト追加 |
| `apps/web/src/lib/fetch/authed.spec.ts` | mock を `getEnvironmentResolution` へ追従。network failure が `ApiTransportError`（transport 診断付き）で throw されるテストへ更新 |
| `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | transport descriptor のログ展開テスト追加 |
| `apps/web/app/api/auth/magic-link/route.route.spec.ts` / `verify/route.route.spec.ts` | fail-closed 契約追従（localhost fallback テストに `vi.stubEnv("ENVIRONMENT", "local")` 明示を追加） |
| `scripts/diagnose-profile-session.sh` | `profile_session.tail_hint=`（`bash scripts/cf.sh tail web` + `rg 'server_fetch_failed|transportKind|baseHost'`）1 行追加 |

## 2. 主要な関数・型のシグネチャまたは構造（CONST_005 必須）

merge で本 branch に入る公開シグネチャ（T02/T03 が前提とするもの）:

```ts
// apps/web/src/lib/fetch/transport.ts
export interface ApiTransportDescriptor {
  readonly transportKind: "service-binding" | "http";
  readonly baseHost: string;
}
export function describeTransport(transport: ApiTransport): ApiTransportDescriptor;
export class ApiTransportError extends Error {
  readonly transport: ApiTransportDescriptor;
  constructor(message: string, transport: ApiTransportDescriptor, cause?: unknown);
}
export interface ApiTransportEnv {
  API_SERVICE?: { fetch: typeof fetch } | undefined;
  baseUrl?: string | undefined;
  environment?: "local" | "staging" | "production" | undefined;
  environmentExplicit?: boolean | undefined; // 追加
  isTest?: boolean | undefined;
}

// apps/web/src/lib/env.ts
export interface EnvironmentResolution {
  readonly environment: "local" | "staging" | "production";
  readonly explicit: boolean;
}
export function getEnvironmentResolution(rawEnv?: RawEnv): EnvironmentResolution;

// apps/web/src/lib/fetch/errors.ts
export class FetchAuthedError extends Error {
  readonly status: number;
  readonly bodyText: string;
  readonly transport?: ApiTransportDescriptor; // 追加（optional・後方互換）
  constructor(status: number, bodyText: string, transport?: ApiTransportDescriptor);
}
```

## 3. 入力・出力・副作用の定義（CONST_005 必須）

| 区分 | 内容 |
| --- | --- |
| 入力 | `origin/fix/profile-session-staging-localhost-endpoint`（origin push 済・dev 同期済 82f19bcc8） |
| 出力 | work branch `fix/profile-session-staging-transport-recovery` 上の merge commit（上記 18 ファイルの差分を含む） |
| 副作用（runtime 挙動の変化） | (1) transport 層 throw が `ApiTransportError{transportKind,baseHost}` で観測可能になる (2) `server_fetch_failed` ログに `transportKind`/`baseHost` が載る (3) **fail-closed**: `ENVIRONMENT` 非明示の非 local 相当環境では localhost に落ちず throw（S2 の根治） |
| 不変 | `/me` の path・shape・status 体系、`apps/api`、D1 schema、`/profile` UI 文言・分岐（AC-7） |

## 4. merge 実施手順

```bash
# 1. work branch を origin/dev から作成（未作成の場合）
git fetch origin
git checkout -b fix/profile-session-staging-transport-recovery origin/dev

# 2. 観測性ブランチを merge
git merge origin/fix/profile-session-staging-localhost-endpoint
```

### コンフリクト時の解消方針（dev 同期済のため最小想定）

| 種別 | 方針 |
| --- | --- |
| `apps/web/src/lib/**`（env.ts / transport.ts / authed.ts / safe-fetch.ts / errors.ts / result.ts） | **両意図保持**で統合。観測性側（descriptor / ApiTransportError / environmentExplicit）の追加行と dev 側の後続変更を両方残し、import を統合する |
| spec ファイル | 両側のテストケースをすべて残す（テスト削除でのコンフリクト解消は禁止） |
| `scripts/diagnose-profile-session.sh` | tail_hint 行を保持しつつ dev 側差分と結合 |
| 解消後 | `git add -A && git commit`（merge commit）。CLAUDE.md の sync-merge ポリシーどおり `--no-verify` は不要（hook 側で merge commit を自動スキップ） |

## 5. テスト方針（CONST_005 必須）

本タスクで**新規テストは追加しない**。merge で取り込まれる既存テスト（観測性・fail-closed の契約テスト群）と、本 branch 既存のテストが**すべて green** であることを確認する（AC-1）。

| 確認対象 | 内容 |
| --- | --- |
| `transport.spec.ts` | `ApiTransportError` / `describeTransport` / fail-closed（`environmentExplicit` 無し→throw・明示 local→localhost）の契約 |
| `env.spec.ts` | `getEnvironmentResolution` の explicit/implicit 判定 |
| `authed.spec.ts` | network failure → `ApiTransportError`（transport 診断付き）throw / 401・非 2xx の既存挙動 |
| `safe-fetch.spec.ts` | `server_fetch_failed` ログへの transportKind/baseHost 展開 |
| `page.spec.tsx` | `/profile` 分岐（401 redirect / 404 CTA / FAILED バナー）の非回帰 |
| magic-link route specs | fail-closed 追従（`ENVIRONMENT=local` 明示で localhost fallback） |

## 6. ローカル実行・検証コマンド（CONST_005 必須）

```bash
# 1. merge 結果の確認（コンフリクト残ゼロ）
git status --porcelain
git log --oneline -3

# 2. 依存・型・lint
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3. focused vitest（apps/web package 内から --root=../.. 形式。SSOT §8）
cd apps/web
mise exec -- pnpm exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/__tests__/env.spec.ts \
  apps/web/src/lib/fetch/transport.spec.ts \
  apps/web/src/lib/fetch/authed.spec.ts \
  'apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts' \
  'apps/web/app/(member)/profile/page.spec.tsx' \
  'apps/web/app/api/auth/magic-link/route.route.spec.ts' \
  'apps/web/app/api/auth/magic-link/verify/route.route.spec.ts'
cd ../..

# 4. 診断スクリプト構文
bash -n scripts/diagnose-profile-session.sh
```

## 7. 完了条件（DoD: Definition of Done, CONST_005 必須）

| ID | 条件 | 検証 |
| --- | --- | --- |
| DoD-T01-1 | merge commit が work branch に存在し、`git diff origin/dev...HEAD` に観測性 18 ファイルの差分が含まれる | `git log` / `git diff --stat` |
| DoD-T01-2 | `ApiTransportError` / `describeTransport` / `getEnvironmentResolution` / `environmentExplicit` / safe-fetch transport ログ / `FetchAuthedError` transport 引数が本 branch のコードに存在する | grep（§6 手順 1 後に目視 or `git grep ApiTransportError`） |
| DoD-T01-3 | §6 手順 3 の focused vitest（7 spec）が**すべて PASS**（AC-1） | §6 手順 3 |
| DoD-T01-4 | `pnpm typecheck` / `pnpm lint` が exit 0 | §6 手順 2 |
| DoD-T01-5 | `bash -n scripts/diagnose-profile-session.sh` が PASS | §6 手順 4 |
| DoD-T01-6 | `git diff origin/dev...HEAD -- apps/api` が空（AC-7） | `git diff` |
| DoD-T01-7 | push / PR は実施していない（CONST_002・user-gated） | `git status` / `gh pr list` |

## 8. ロールバック手順

```bash
# merge commit を取り消す（merge 直後・未 push のため reset で安全に戻せる）
git reset --hard origin/dev
# T02/T03 着手後に T01 だけ戻したい場合（履歴保持が必要なとき）
git revert -m 1 <merge-commit-sha>
```

revert 後は観測性・fail-closed が branch から消え、T02/T03 の前提が失われるため、T02/T03 の差分も同時に revert すること（Phase 8 §rollback 参照）。

## 9. 後続タスク・先送り項目

CONST_007 に違反する先送りは無し。T02（env field-tolerant）/ T03（transport chain）は本タスク完了後に並列着手する。T04 は独立。

## 10. PR 作成方針（実行は別プロンプト）

CONST_002 により本仕様書作成プロンプトでは PR を作成しない。user-gated で base=`dev` の PR を作成する。**本 WF の PR が観測性ブランチの成果を dev へ届ける**（`fix/profile-session-staging-localhost-endpoint` の個別 PR は立てない）旨を PR 本文に明記する（SSOT §6 / Phase 13）。
