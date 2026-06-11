# Phase 13 — PR作成

[実装区分: 実装仕様書] / Task: TASK-STAGING-TEST-ACCOUNTS-FULL-DATA-001

## 0. 状態

| 項目 | 値 |
|------|-----|
| 状態 | **pending_user_approval** |
| PR base | `dev` |
| commit / push / PR 作成 | **すべて user-gated**（ユーザー明示承認後のみ実行） |
| staging 適用 / seed 実投入 | **すべて user-gated**（本タスクでは実行しない） |
| authenticated / staging スクリーンショット | **すべて user-gated**（implemented_local_evidence_captured・PNG pending） |

> 本タスクは `implemented_local_evidence_captured`（VISUAL_ON_EXECUTION）。本 wave は実装仕様書（Phase 1-13 + strict 7）の作成に閉じる。**local実装は完了済み**。PR 作成は、今回のlocal実装がコード実装・seed 再生成・focused tests を完了し、ユーザー明示承認を得てから実行する。本 Phase は実行手順を記述するが **実行しない**。

---

## 1. ブランチ / base

- 作業ブランチ（案）: `feat/staging-test-accounts-full-data-and-detail-verify`
- PR base: `dev`（既定。production リリースではないため `main` は使わない）
- CLAUDE.md「PR作成の完全自律フロー」に準拠（base=dev・diff-to-pr 仕様）。

---

## 2. 実行順序（diff-to-pr 準拠・ユーザー承認後のみ）

1. 現在ブランチと変更状況を確認。`dev` 直上なら差分主題から `feat/` ブランチを自律作成。
2. `git fetch origin dev` → ローカル `dev` を `origin/dev` に fast-forward 同期。
3. 作業ブランチへ `dev` をマージ。コンフリクトは CLAUDE.md の既定方針で自律解消し `git add` / `git commit`。
4. 品質検証（次の 4 コマンド）:
   - `pnpm install --force`
   - `pnpm typecheck`
   - `pnpm lint`
   - `bash scripts/verify-pr-ready.sh`
5. 失敗時は最大 3 回まで自動修復しコミット。
6. `git status --porcelain` で未コミット確認 → 残りは `git add -A` で全件コミット。
7. `git diff dev...HEAD --name-only` で PR 対象ファイル一覧を取得（漏れなし確認）。
8. `.claude/commands/ai/diff-to-pr.md` と `outputs/phase-12/implementation-guide.md` を参照して PR 本文作成 → `gh pr create --base dev`。

---

## 3. 含めるファイル一覧

### 本 wave の workflow spec（implemented_local_evidence_captured・先行 or 同梱）

| パス |
|------|
| `docs/30-workflows/staging-test-accounts-full-data-and-detail-verify/index.md` |
| `docs/30-workflows/staging-test-accounts-full-data-and-detail-verify/_shared-context.md` |
| `docs/30-workflows/staging-test-accounts-full-data-and-detail-verify/artifacts.json` |
| `docs/30-workflows/staging-test-accounts-full-data-and-detail-verify/outputs/artifacts.json` |
| `outputs/phase-1/phase-1.md` 〜 `outputs/phase-13/phase-13.md` |
| `outputs/phase-11/manual-test-result.md` |
| `outputs/phase-12/*`（strict 7） |

### 今回のlocal実装で追加/編集する実コード（index.md「変更対象ファイル一覧」より・本 wave 未変更）

| パス | 種別 |
|------|------|
| `apps/api/src/testing/test-accounts/catalog.ts` | 編集（profile 拡充） |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | 編集（必要時のみ） |
| `apps/api/migrations/seed/test-accounts-seed.sql` | 再生成（生成物） |
| `apps/api/migrations/seed/test-accounts-cleanup.sql` | 再生成（生成物） |
| `apps/api/migrations/seed/test-accounts.manifest.json` | 再生成（生成物） |
| `apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts` | 編集 |
| `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | 編集 |
| `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts` | 編集 |
| `apps/web/src/lib/adapters/member-detail.ts` | 編集（ギャップ時のみ） |
| `apps/web/src/components/public/*.tsx` | 編集（ギャップ時のみ） |
| `apps/web/src/fixtures/public-member-profile.ts` | 編集 |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | 編集 |

> spec のみを先行 PR とし実コードを別 PR にするか、両者を 1 PR に束ねるかはユーザー承認時に確定する。

---

## 4. PR タイトル（案）

```
feat(api): テストアカウント TEST-MEM-01..10 を Google Form 全項目で拡充し公開詳細ページ表示を検証
```

---

## 5. PR 本文テンプレ（案）

```markdown
## Summary
- テストアカウント TEST-MEM-01..10 の per-member profile を Google Form 31 stable_key の実データで拡充（catalog.ts SSOT）
- フル / 全項目入力 / エッジの表示バリエーション・マトリクスを設計（公開掲載 5 件 01/06/07/09/10）
- catalog → {seed SQL, cleanup SQL, manifest} を再生成し drift guard で byte 一致
- 公開詳細ページが visibility=public 全項目を full/all-fields/edge データで 5 セクション描画することを検証（ギャップは最小差分修正）。member/admin 項目は公開ページ非漏洩（二重防御維持）

## Changes
- apps/api/src/testing/test-accounts/catalog.ts（profile 拡充）+ __tests__
- apps/api/migrations/seed/{test-accounts-seed.sql, test-accounts-cleanup.sql, test-accounts.manifest.json}（再生成）+ contract spec
- apps/web/src/lib/adapters/member-detail.ts（ギャップ時のみ）/ components/public/*（ギャップ時のみ）/ fixtures/public-member-profile.ts + adapter spec

## Test plan
- [ ] mise exec -- pnpm typecheck
- [ ] mise exec -- pnpm lint
- [ ] node --import tsx scripts/gen-test-accounts-seed.mjs（drift 0）
- [ ] pnpm exec vitest run apps/api/src/testing/test-accounts --config=vitest.config.ts
- [ ] pnpm exec vitest run apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts --config=vitest.d1.config.ts
- [ ] pnpm exec vitest run apps/web/src/lib/adapters/__tests__/member-detail.spec.ts --config=vitest.config.ts
- [ ] bash scripts/verify-pr-ready.sh

## Screenshots
- /members/TEST-MEM-06（フル）/ 01 / 07（タグ多数）/ 09（全項目入力）/ 10（エッジ）
- ※ staging seed apply 後に取得（user-gated）。implemented_local_evidence_captured 時点では pending

## Notes
- 新規 API endpoint / D1 schema / migration / Google Form schema 変更なし（既存 surface のみ）
- seed 実投入（staging）・staging スクリーンショットは user-gated。production への seed 適用は構造的に禁止
- 公開詳細ページは public 項目のみ表示（現状維持）。member/admin 項目はデータ投入のみで公開非表示

## Related
- Spec: docs/30-workflows/staging-test-accounts-full-data-and-detail-verify/

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

> 上記「Screenshots」セクションは、staging apply + 撮影が user-gated 実行された後に EV-01..08 の参照を埋める。implemented_local_evidence_captured 時点で PNG が無い場合は、本文にスクリーンショット参照を空のまま残さず「（staging apply 後に取得・user-gated）」と注記する。

---

## 6. 作成コマンド（ユーザー承認後のみ）

```bash
gh pr create --base dev \
  --title "feat(api): テストアカウント TEST-MEM-01..10 を Google Form 全項目で拡充し公開詳細ページ表示を検証" \
  --body "$(cat <<'EOF'
... 上記本文 ...
EOF
)"
```

---

## 7. ゲート（PR 作成前チェック）

- [ ] コード実装（catalog 拡充・seed 再生成・apps/web 検証/修正・focused tests）が今回のlocal実装で完了している
- [ ] `node --import tsx scripts/gen-test-accounts-seed.mjs` の drift 0（生成物 byte 一致）
- [ ] `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` 全 green
- [ ] `git status --porcelain` が空
- [ ] `git diff dev...HEAD --name-only` が §3 の想定ファイルのみ
- [ ] スクリーンショットが取得済みなら本文に参照、未取得なら専用セクションを空で残さず注記
- [ ] ユーザー明示承認後に `gh pr create` を実行

## 完了条件

- PR base=dev・diff-to-pr 準拠の実行手順と本文案を記述した（本 wave）。
- 実行（commit / push / PR / staging apply / 撮影）はすべて user-gated で本 wave 未実行。
