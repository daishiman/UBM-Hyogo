# Phase 13: PR作成

[実装区分: 実装仕様書]

| 項目         | 値                                                                        |
| ------------ | ------------------------------------------------------------------------- |
| Task ID      | TASK-FIX-ADMIN-SCR-ERR-STG-FU-001-AUTH-ENV                                |
| Phase        | 13 / 13（PR作成）                                                         |
| 依存         | Phase 12                                                                   |
| 成果物       | outputs/phase-13/phase-13.md                                              |
| PR base      | `dev`（プロジェクト既定。`main` は production リリース時の `dev → main` のみ） |
| 実行可否     | **user の明示承認後のみ実施**。本仕様書作成フェーズでは commit / push / PR を実行しない |

## 0. 実行ゲート（最重要）

> **本 Phase の commit / push / PR 作成は、user の明示承認を得た後にのみ実施する。**
> 仕様書作成フェーズ（現サイクル）では一切実行しない。以下はすべて「承認後に従う手順」として記述する。
> また、本タスクのコード実装（`env.ts` / `auth.ts` / `auth.spec.ts` / `env.spec.ts`）が完了し、
> Phase 5〜12 が green であることが PR 作成の前提となる。

## 1. PR タイトル案

```text
fix(apps-web): auth.ts の env 参照を env.ts getAuthEnv() 経由へ統一（issue #862 根本対応）
```

> 親タスク（PR #849 / #877）が `fix(admin): server-fetch を getEnv 経由に統一` を踏襲し、対象 surface を
> `auth.ts` に拡張する命名とする。

## 2. PR 本文構成

### 2.1 背景（issue #862 最適化）

- 親タスク TASK-FIX-ADMIN-SCR-ERR-STG-001（PR #849 / #877）は staging `/admin` の Server Components render
  error（digest=167275886）を `server-fetch.ts` の `getEnv()` 経由化で解消したが、`apps/web/src/lib/auth.ts`
  には env 参照 3 経路混在（`process.env.*` 直接 / `getCloudflareContext().env` 直接 / `globalThis` override）が残存。
- issue #862（`type:improvement`・**CLOSED のまま**）を**現行コードに最適化**して根本対応する。
  issue 記載の対象パス `apps/web/src/auth.ts` は現存せず、実体は `apps/web/src/lib/auth.ts`（path drift 是正）。
- **issue #862 は再オープンしない**。PR 本文で「issue #862 の根本対応」として関連付ける（`Refs #862` を記載・`Closes` は使わない）。

### 2.2 変更内容

| ファイル                          | 変更                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apps/web/src/lib/env.ts`         | `EnvSchema` に google 系 4 key（`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`）を `.optional()` で追加。`AuthEnvSchema`（partial）と `getAuthEnv()`（safeParse partial + `API_SERVICE` binding 同梱）を新設。`AuthEnv` 型の所有権を `env.ts` へ移動 |
| `apps/web/src/lib/auth.ts`        | `getCloudflareContext` import / `cloudflareEnv()` / `processEnv()` を撤去し、`getAuthEnv()` へ委譲。`env()` を `{ ...getAuthEnv(), ...globalEnv() }` に変更。`requestEnv()` / `globalEnv()` は保持 |
| `apps/web/src/lib/auth.spec.ts`   | env mock を新経路（`getAuthEnv` / `readRawEnv` 経由）に整合させ、fail-closed / graceful フォールバックの回帰を固定 |
| `apps/web/src/lib/__tests__/env.spec.ts`    | 新規。`getAuthEnv()` の safeParse partial・binding 同梱・enum 不一致時 `{}` 返却を固定                 |

### 2.3 DoD（AC-1〜AC-8）

> Phase 10 の AC 達成判定テーブル（実装後確定）の結果を転記する。

- AC-1: `auth.ts` に `process.env.` 直接参照 0 件（grep gate）
- AC-2: `auth.ts` に `getCloudflareContext` 直接参照 0 件（import 含む・grep gate）
- AC-3: 全 env 参照が `getAuthEnv()` 経由
- AC-4: `EnvSchema` に auth 必須 key 網羅 + safeParse 成功
- AC-5: `pnpm typecheck` / `pnpm lint` pass、`auth.spec.ts` 全 40 ケース + `env.spec.ts` green
- AC-6: staging `/login` → OAuth/Magic Link → `/admin` runtime smoke pass（**user-gated**）
- AC-7: CLAUDE.md「apps/web env アクセス不変条件」と整合
- AC-8: invariant #11（fail-closed）回帰なし

### 2.4 deviation 記録への参照

- issue #862 字義（「`getEnv()` 戻り値経由」「zod throw を error boundary へ伝播」）からの deviation は
  `outputs/phase-3/phase-3.md` §2 に根拠付きで記録済み。本 PR では auth 境界の fail-closed（invariant #11）を
  優先し、`getEnv()`（throw）ではなく `getAuthEnv()`（safeParse partial）経由とする旨を本文に明記する。
- 詳細は `docs/30-workflows/fix-admin-scr-err-stg-fu-001-auth-env-via-getenv/outputs/phase-12/system-spec-update-summary.md`
  へのリンクを本文に含める。

### 2.5 スクリーンショット

- **NON_VISUAL タスクのため記載しない**（UI/UX 変更なし。Phase 11 §NON_VISUAL 宣言を参照）。
- `outputs/phase-11/` に画像は存在しないため、PR 本文にスクリーンショット専用セクションを設けない。

## 3. PR 作成手順（user 承認後）

> CLAUDE.md「PR作成の完全自律フロー」に準拠する。base は `dev`。

```bash
# 1. dev 同期
git fetch origin dev
git checkout dev && git merge --ff-only origin/dev

# 2. 作業ブランチへ dev 取り込み（コンフリクト時は CLAUDE.md 既定方針で解消）
git checkout <作業ブランチ>
git merge dev

# 3. 品質検証（4 コマンド）
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/verify-pr-ready.sh

# 4. 差分確認
git status --porcelain          # 空であること
git diff dev...HEAD --name-only # PR に含めるファイル一覧

# 5. PR 作成（base = dev を明示）
gh pr create --base dev --title "fix(apps-web): auth.ts の env 参照を env.ts getAuthEnv() 経由へ統一（issue #862 根本対応）" --body "<§2 構成で作成した本文>"
```

> production リリース（`dev → main`）時のみ `--base main` を明示する。本タスクは `dev` 止まり。

## 4. PR 作成前チェック

- [ ] コード実装（env.ts / auth.ts / auth.spec.ts / env.spec.ts）が完了し Phase 5〜12 が green
- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` が取得済（漏れなし確認）
- [ ] `outputs/phase-12/implementation-guide.md` の主要見出しが PR 本文に反映
- [ ] スクリーンショット専用セクションを設けていない（NON_VISUAL）
- [ ] issue #862 は CLOSED のまま（再オープンしない）。本文に `Refs #862` を記載
- [ ] **user の明示承認を取得済**

## 5. 完了条件（このPhaseの DoD）

- [x] PR base = `dev`（main は production リリース時のみ）を明記した
- [x] PR タイトル案・本文構成（背景=issue#862 最適化 / 変更=env.ts・auth.ts・test / DoD / deviation 参照）を作成した
- [x] スクリーンショットは NON_VISUAL のため記載しない旨を明記した
- [x] commit / push / PR は user 明示承認後のみ実施する旨を明記した（本フェーズでは実行しない）
- [x] issue #862 は CLOSED のまま `Refs #862` で関連付ける旨を明記した
