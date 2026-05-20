# Phase 13: コミット / PR / リリース承認

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 13 / 13 | 前 | 12 | 次 | なし |
| 状態 | blocked_pending_user_approval |

## 0. 前提
- Phase 11 evidence 全件配置済み + Phase 12 compliance PASS
- 本 Phase はユーザー明示承認後にのみ実行する（CONST_002）
- base ブランチは `dev`（CLAUDE.md 既定）。`main` への push は本タスク対象外

## 1. ブランチと commit 戦略

```bash
# 想定 branch 名（既存運用と整合）
git checkout -b feat/issue-274-public-pages-ogp-sitemap-robots dev

# 同期
git fetch origin dev
git rebase origin/dev  # コンフリクト時は CLAUDE.md の sync-merge ガイドに従う

# 段階 commit（任意）。1 commit でも可
git add apps/web/src/lib/seo/
git commit -m "feat(issue-274): add site-metadata SEO helper"

git add apps/web/app/sitemap.ts apps/web/app/robots.ts apps/web/app/opengraph-image.tsx
git commit -m "feat(issue-274): add sitemap / robots / opengraph-image metadata routes"

git add apps/web/app/layout.tsx apps/web/app/page.tsx apps/web/app/\(public\)/
git commit -m "feat(issue-274): wire per-page OG / twitter metadata for public routes"

git add apps/web/playwright/tests/public-metadata.spec.ts apps/web/src/lib/seo/__tests__/
git commit -m "test(issue-274): playwright smoke + unit tests for SEO metadata"

git add docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/
git commit -m "docs(issue-274): task workflow Phase 1-13"
```

## 2. 品質検証（push 前）

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build
```

3 回までの自動修復ループは CLAUDE.md「PR作成の完全自律フロー」§実行順序 step 6 に従う。

## 3. push と PR

```bash
git push -u origin feat/issue-274-public-pages-ogp-sitemap-robots

gh pr create --base dev --title "feat(issue-274): public pages OGP / sitemap / robots" --body "$(cat <<'EOF'
## Summary
- 公開 4 ルート（`/`, `/members`, `/members/[id]`, `/register`）に SNS シェア用 OGP / Twitter card metadata を追加
- `app/sitemap.ts` / `app/robots.ts` / `app/opengraph-image.tsx` (Next.js Metadata Routes) を新規実装
- `apps/web/src/lib/seo/site-metadata.ts` に env 駆動の SEO helper を追加（`getPublicEnv()` 経由、`process.env` 直参照なし）

## References
Refs #274

## Test plan
- [x] `pnpm --filter @ubm-hyogo/web typecheck` PASS
- [x] `pnpm --filter @ubm-hyogo/web lint` PASS
- [x] `pnpm --filter @ubm-hyogo/web test apps/web/src/lib/seo` PASS（unit）
- [x] `pnpm --filter @ubm-hyogo/web build` PASS
- [x] `curl /sitemap.xml` で static + dynamic URL を確認
- [x] `curl /robots.txt` で ENVIRONMENT 分岐を確認
- [x] `/opengraph-image` が 1200x630 PNG を返す
- [x] Playwright smoke `playwright/tests/public-metadata.spec.ts` PASS
- [x] 公開 4 ルートで `<meta property="og:*">` / `<meta name="twitter:*">` が出力される

## Evidence
`docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/outputs/phase-11/evidence/` を参照

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## 4. リリース承認（dev → main は別タスク）
- 本 PR が `dev` にマージされれば staging 自動デプロイ
- production への昇格は `dev → main` の別 PR で扱う（本タスク対象外）

## 5. DoD
- [ ] PR が `dev` に対して作成され URL が返る
- [ ] CI required status check 全 PASS
- [ ] `outputs/phase-11/` evidence が PR description から辿れる
- [ ] ユーザーが PR URL を確認できる状態


## 目的
Phase 13 の責務を完了し、後続 Phase が参照できる検証可能な入力を作る。


## 実行タスク
- [ ] Phase 11 / 12 evidence が揃っていることを確認する
- [ ] ユーザー承認後にのみ commit / push / PR を実行する
- [ ] PR body に evidence と `Refs #274` を記載する


## 参照資料
| 種別 | パス | 用途 |
| --- | --- | --- |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set と workflow 登録先の確認 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 公開導線・SEO/metadata 関連の即時参照 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 台帳との依存整合確認 |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/create-workflow.md` | Phase 1-13 生成・検証フロー |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Phase 12 strict / 4条件 / same-wave sync gate |
| Phase 13 template | `.claude/skills/task-specification-creator/references/phase-template-phase13.md` | user approval / PR gate |
| Repository policy | `CLAUDE.md` | commit / push / PR user-gated rule |
| Evidence root | `docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/outputs/phase-11/` | PR body evidence source |


## 成果物
- user-approved commit / PR URL / CI result（承認前は未生成）


## 依存 Phase 参照
- Phase 1 の成果物を参照する
- Phase 2 の成果物を参照する
- Phase 5 の成果物を参照する
- Phase 6 の成果物を参照する
- Phase 7 の成果物を参照する
- Phase 8 の成果物を参照する
- Phase 9 の成果物を参照する
- Phase 10 の成果物を参照する
- Phase 11 の成果物を参照する
- Phase 12 の成果物を参照する


## 完了条件
- [ ] 上記成果物が作成または更新されている
- [ ] 参照資料との矛盾がない
- [ ] 次 Phase が必要とする入力が本文または成果物に明記されている
