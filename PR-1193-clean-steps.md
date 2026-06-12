# PR #1193 — クリーンな PR にするための手順と commit 一覧

> 対象ブランチ: `feat/admin-requests-queue-rename-and-publish-dependency` → base `dev`
> 確認日時点の状態: **OPEN / mergeable=CONFLICTING (DIRTY)** ・ origin/dev に対し behind 2 / ahead 9
> ※ main へのマージ・dev→main リリースは**未実施**。このブランチの PR は #1193 一本のみ。

---

## 1. このブランチに載っている commit（origin/dev..HEAD・実測）

| commit | 種別 | 内容 |
|--------|------|------|
| `39885462b` | feat | `/admin/requests` を「会員からの申請」へ命名平易化 + 申請中バッジ + テスト申請 seed（本機能） |
| `5d6b61dc6` | merge | origin/dev 取込 |
| `fe746f11c` | merge | dev 取込（skill-index union を sync:resolve で解消） |
| `23a386713` | docs | dev sync-merge 解消知見を aiworkflow / task-spec skill へ反映 |
| `036e7065c` | merge | origin/dev 取込（#1179） |
| `66133869b` | fix(api) | dev sync 後の static-manifest `sourceSpecHashDrift` を `regenerate:static-manifest` で解消 |
| `7c37150e4` | fix(admin) | `MembersTable` の `pendingRequestTypes` 未定義クラッシュを `?? []` で防御 + 回帰テスト |
| `9b4107933` | merge | origin/dev 取込（#1185） |
| `61821dd55` | merge | origin/dev 取込（#1194 ほか） |

---

## 2. クリーンな PR にするための手順（再現レシピ）

### Step 1. 最新 dev を取り込む（現在 behind 2 → 0 にする）
```bash
git fetch origin dev
git merge origin/dev --no-edit
```
- skill-index 系（`indexes/*.md` / `keywords.json` / `references/task-workflow-active.md`）でコンフリクトが出たら：
```bash
pnpm sync:resolve            # union 解消 + keywords --ours + indexes:rebuild
git diff --name-only --diff-filter=U   # 空になることを確認
git add -A && git commit --no-edit
```

### Step 2. CI で落ちやすい3点を事前検証
```bash
# 2-1. static-manifest drift（取込で 01-api-schema.md が動いた時のみ）
pnpm verify:static-manifest || pnpm regenerate:static-manifest

# 2-2. 型 / Lint
pnpm typecheck
pnpm lint

# 2-3. PR pre-flight（phase12-compliance / gate-metadata / indexes drift）
bash scripts/verify-pr-ready.sh
```

### Step 3. push
```bash
git push          # pre-push hook（coverage / gate-metadata / indexes-drift / phase12 / esbuild）が走る
```

### Step 4. PR の required checks を確認（base=dev）
dev の required: `ci` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate`
```bash
gh pr checks 1193 --required
gh pr view 1193 --json mergeable,mergeStateStatus -q '"\(.mergeable) \(.mergeStateStatus)"'
```

---

## 3. 既知の落とし穴（このブランチで実際に踏んだもの）

1. **static-manifest `sourceSpecHashDrift`**: `git merge` も `sync:resolve` も検知しない。CI の `ci` job でのみ fail。→ `pnpm regenerate:static-manifest`。
2. **`MembersTable` undefined.map クラッシュ**: `safeServerFetch` は zod parse せず型アサーションのみのため schema の `.default([])` が効かない。`(m.pendingRequestTypes ?? []).map()` で表示層防御。
3. **focused vitest はルートからフルパス**: `mise exec -- pnpm exec vitest run apps/web/src/.../X.spec.tsx`（package 相対 filter は include glob に非マッチ）。
4. **並行開発で dev が頻繁に進む**: push の度に CONFLICTING が再発しうる。マージ直前にもう一度 Step 1 を回す。

---

## 4. 注意（このセッションの訂正）

- 本ブランチの PR は **#1193 のみ**。`dev → main` のリリース PR は**作成していない**。
- **main へは何もマージしていない**。main への昇格は別フロー（`gh pr create --base main --head dev`）で、main の required は dev より厳しい（`playwright-smoke / smoke (chromium)` / `verify-design-tokens` / `audit-correlation-verify` が追加）。
