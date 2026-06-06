# Phase 13 — PR作成

## 0. 状態

| 項目 | 値 |
|------|-----|
| 状態 | **pending_user_approval** |
| PR base | `dev` |
| commit / push / PR 作成 | **すべて user-gated**（ユーザー明示承認後のみ実行） |
| staging 適用 / seed 実投入 | **すべて user-gated**（本タスクでは実行しない） |

> 本タスクは `implemented_local_evidence_captured` であり、PR 作成はユーザー明示承認を得てから実行する。実コード・focused evidence は本 wave で完了済み。commit / push / PR / staging 適用 / seed 実投入はいずれも user-gated。

---

## 1. ブランチ / base

- 作業ブランチ: `feat/test-accounts-seed`（spec のみのコミットを別 PR にする場合は `docs/test-accounts-seed-spec`）
- PR base: `dev`（既定。production リリースではないため `main` は使わない）

---

## 2. PR タイトル（案）

```
feat(api): テストアカウント seed 基盤（member 10 + admin 3）を SSOT カタログから決定論生成
```

---

## 3. 含めるファイル一覧

### 本 wave で追加/編集する実コード（index.md「変更対象ファイル一覧」より）

| パス | 種別 |
|------|------|
| `apps/api/src/testing/test-accounts/catalog.ts` | 新規 |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | 新規 |
| `apps/api/src/testing/test-accounts/index.ts` | 新規 |
| `apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts` | 新規 |
| `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | 新規 |
| `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts` | 新規 |
| `apps/api/migrations/seed/test-accounts-seed.sql` | 新規（生成物） |
| `apps/api/migrations/seed/test-accounts-cleanup.sql` | 新規（生成物） |
| `apps/api/migrations/seed/test-accounts.manifest.json` | 新規（生成物） |
| `scripts/seed-test-accounts.sh` | 新規 |
| `scripts/gen-test-accounts-seed.mjs` | 新規 |
| `apps/web/playwright/scripts/mint-test-account-storage-state.ts` | 新規 |
| `apps/api/package.json` | 編集（`seed:test-accounts` / `seed:test-accounts:gen` 追加） |
| `package.json`（root） | 編集（ルートパススルー追加） |

### 本 workflow spec 一式

| パス |
|------|
| `docs/30-workflows/test-accounts-seed-spec/index.md` |
| `docs/30-workflows/test-accounts-seed-spec/outputs/phase-1/phase-1.md` 〜 `phase-13/phase-13.md` |
| `docs/30-workflows/test-accounts-seed-spec/outputs/phase-11/manual-test-result.md` |
| `docs/30-workflows/test-accounts-seed-spec/outputs/phase-12/*`（strict 7） |
| `docs/30-workflows/test-accounts-seed-spec/outputs/artifacts.json` |

> spec のみを先行 PR とし実コードを別 PR にするか、両者を 1 PR に束ねるかはユーザー承認時に確定する。

---

## 4. PR 本文テンプレ（案）

```markdown
## Summary
- member 10 + admin 3 + meeting 3 のテストアカウントを SSOT カタログ（catalog.ts）から決定論的に生成
- ログイン可否ゲート 7/3・公開ディレクトリ掲載 5 を網羅。全 ID `TEST-` prefix / email `@test.ubm-hyogo.invalid` でテスト用と一目判別
- カタログ→{seed SQL, cleanup SQL, manifest} の純粋ジェネレータ + drift guard（再生成 byte 一致）
- 適用 CLI は local/staging のみ受理し production を構造的に拒否。E2E は manifest 経由で D1 非接触

## Changes
- apps/api/src/testing/test-accounts/{catalog,build-seed-sql,index}.ts + __tests__
- apps/api/migrations/seed/{test-accounts-seed.sql,test-accounts-cleanup.sql,test-accounts.manifest.json} + drift spec
- scripts/{seed-test-accounts.sh,gen-test-accounts-seed.mjs}
- apps/web/playwright/scripts/mint-test-account-storage-state.ts
- apps/api/package.json / package.json（seed スクリプト追加）

## Test plan
- [ ] mise exec -- pnpm typecheck
- [ ] mise exec -- pnpm lint
- [ ] node --import tsx scripts/gen-test-accounts-seed.mjs --check（drift 0）
- [ ] pnpm exec vitest run apps/api/src/testing/test-accounts --config=vitest.config.ts && pnpm exec vitest run apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts --config=vitest.d1.config.ts
- [ ] bash scripts/verify-pr-ready.sh

## Notes
- NON_VISUAL（UI 変更なし）。スクリーンショットなし
- seed 実投入（local/staging）・staging mint は user-gated。production への seed 適用は構造的に禁止

## Related
- Spec: docs/30-workflows/test-accounts-seed-spec/

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 5. 作成コマンド（ユーザー承認後のみ）

```bash
gh pr create --base dev \
  --title "feat(api): テストアカウント seed 基盤（member 10 + admin 3）を SSOT カタログから決定論生成" \
  --body "$(cat <<'EOF'
... 上記本文 ...
EOF
)"
```

---

## 6. ゲート（PR 作成前チェック）

- [x] Phase 9 の local 検証コマンドが全 green
- [ ] `node --import tsx scripts/gen-test-accounts-seed.mjs --check` の drift 0（生成物 byte 一致）
- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` が §3 の想定ファイルのみ
- [ ] スクリーンショット専用セクションを PR 本文に作らない（NON_VISUAL）
- [ ] ユーザー明示承認後に `gh pr create` を実行
