# Phase 13: PR 作成 — issue-870-apps-api-security-headers

> 実装区分: 実装仕様書 / NON_VISUAL / implementation_mode: new / 状態: implemented_local_evidence_captured
> 前 Phase: [phase-12-documentation.md](phase-12-documentation.md) / 次 Phase: なし（最終 Phase）

## 重要: ユーザー明示承認後のみ実行

**このファイルに記載された commit / push / PR 作成コマンドは、ユーザーが明示的に承認した場合のみ実行する。**
仕様書フェーズ（本タスク）では実行禁止。Phase 11 手動テスト（vitest 証跡）完了後に、
ユーザーから「PR 出して」「PR 作成」等の明示指示を受けた時点で本フローを開始する。

---

## 13-1. base ブランチと PR 規約

| 項目 | 値 | 根拠 |
|------|-----|------|
| base ブランチ | `dev` | CLAUDE.md 規約「既定の PR base ブランチは `dev`」 |
| `main` への PR | production リリース時の `dev → main` 時のみ | CLAUDE.md 規約「`main` への PR は production リリース時のみ」 |
| issue 参照 | `Refs #870` のみ（`Closes #870` 禁止） | issue #870 は CLOSED のまま維持。close しない |
| PR タイトル形式 | `feat(api): security headers middleware (nosniff/HSTS/CORS)` | 変更の主旨を端的に表現 |

---

## 13-2. 品質検証 4 コマンド（PR 作成前に必ず実行）

```bash
# 1. 依存インストール
mise exec -- pnpm install --force

# 2. 型チェック
mise exec -- pnpm typecheck

# 3. リント
mise exec -- pnpm lint

# 4. PR 事前確認スクリプト（gate-metadata / phase12 compliance / indexes drift を一括検証）
bash scripts/verify-pr-ready.sh
```

全コマンドが exit 0 になるまで修正を繰り返す（最大 3 回自動修復を試みる）。
失敗パターンの対処法は `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` を参照する。

---

## 13-3. PR 作成前チェックリスト

```bash
# 未コミット変更がないこと
git status --porcelain

# PR に含まれるファイル一覧を取得
git diff dev...HEAD --name-only
```

確認ポイント:

- [ ] `git status --porcelain` が空（未コミット変更なし）
- [ ] `git diff dev...HEAD --name-only` に以下の変更対象ファイルが含まれている:
  - `apps/api/src/middleware/security-headers.ts`（新規）
  - `apps/api/src/middleware/__tests__/security-headers.spec.ts`（新規）
  - `apps/api/src/index.ts`（修正）
  - `apps/api/src/env.ts`（修正）
  - `apps/api/wrangler.toml`（修正）
- [ ] `apps/web/src` が変更ファイル一覧に含まれていない
- [ ] `outputs/phase-12/implementation-guide.md` の主要見出しが PR 本文に反映されている
- [ ] `outputs/phase-11/screenshots/` が存在しない（NON_VISUAL のためスクリーンショットなし）

---

## 13-4. `.claude/commands/ai/diff-to-pr.md` フローとの整合

PR 作成は CLAUDE.md §PR作成の完全自律フロー および `.claude/commands/ai/diff-to-pr.md` に従って実行する。

```
1. 現在ブランチと変更状況を確認
2. git fetch origin dev → ローカル dev を fast-forward 同期
3. 作業ブランチに戻り dev をマージ（コンフリクトは自律解消）
4. 品質検証 4 コマンドを実行（失敗時は最大 3 回自動修復）
5. git status --porcelain で未コミット変更がないことを確認
6. git diff dev...HEAD --name-only でファイル一覧を取得
7. implementation-guide.md を参照して PR 本文を作成
8. gh pr create --base dev で PR を作成
```

---

## 13-5. PR 本文テンプレート

```markdown
## 概要

`apps/api`（Hono on Cloudflare Workers）の全 route に対し、
API 用途のセキュリティヘッダと CORS allowlist を Hono middleware として一元適用する。

Refs #870

## 変更内容

- `apps/api/src/middleware/security-headers.ts` 新規追加
  - `securityHeaders()`: nosniff / HSTS / Referrer-Policy / 条件付き no-store を付与
  - `corsFromEnv()`: `ALLOWED_ORIGINS` 環境変数ベースの CORS allowlist middleware
  - `parseAllowedOrigins()`: カンマ区切り文字列のパーサー
- `apps/api/src/middleware/__tests__/security-headers.spec.ts` 新規追加（TC-01〜TC-10）
- `apps/api/src/index.ts` 修正: app 生成直後に `app.use("*", securityHeaders())` / `app.use("*", corsFromEnv())` を追加
- `apps/api/src/env.ts` 修正: `Env` 型に `ALLOWED_ORIGINS?: string` を追加
- `apps/api/wrangler.toml` 修正: staging / production vars に `ALLOWED_ORIGINS` を追加

## テスト

- TC-01〜TC-10: 10 tests passed（`security-headers.spec.ts`）
- D1 lane 回帰: public route の Cache-Control 保持確認（`index.contract.spec.ts`）

## 不変条件の確認

- 既存 `Cache-Control`（`form-preview` / `stats` の `public, max-age=60`）を上書きしていない
- `apps/web/src` への変更なし
- D1 schema 変更なし
- 既存 endpoint の I/O shape 変更なし
- `*.test.ts` suffix 使用なし（`*.spec.ts` のみ）

## スクリーンショット

なし（NON_VISUAL: API backend middleware のみの変更）
```

---

## 13-6. Gate-C 更新（PR 作成後）

PR 作成完了後、`artifacts.json` の `Gate-C` を以下に更新する。

```json
{
  "gate_id": "Gate-C",
  "status": "passed",
  "passed_at": "<PR 作成日時 ISO8601>",
  "evidence_path": "docs/30-workflows/completed-tasks/issue-870-apps-api-security-headers/phase-13-pr.md",
  "approver": "daishiman",
  "notes": "external_ops: PR #<PR番号> 作成完了。base: dev。Refs #870。"
}
```

---

## 13-7. DoD（Definition of Done）

- [ ] ユーザーの明示承認を確認済み
- [ ] 品質検証 4 コマンド全て exit 0
- [ ] `git status --porcelain` が空
- [ ] PR が `gh pr create --base dev` で作成された
- [ ] PR タイトルに機能概要、本文に `Refs #870` が含まれている
- [ ] PR 本文に `outputs/phase-12/implementation-guide.md` の内容が反映されている
- [ ] PR 本文にスクリーンショットセクションが**ない**（NON_VISUAL）
- [ ] `artifacts.json` の `Gate-C` が `passed` に更新された
- [ ] PR URL をユーザーに報告した
