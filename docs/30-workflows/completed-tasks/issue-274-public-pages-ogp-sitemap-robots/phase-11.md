# Phase 11: 検証 / Evidence 収集

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 | 前 | 10 | 次 | 12 |
| 状態 | completed |
| Visual 区分 | VISUAL（OG image 生成あり） |

## 目的
local PASS 5 点セット + smoke 実行ログ + curl evidence を `outputs/phase-11/evidence/` 配下に canonical path で配置する。

## 11.1 Evidence 配置（canonical path）

| パス | 内容 |
| --- | --- |
| `outputs/phase-11/evidence/typecheck.log` | `pnpm --filter @ubm-hyogo/web typecheck` 出力 |
| `outputs/phase-11/evidence/lint.log` | `pnpm --filter @ubm-hyogo/web lint` 出力 |
| `outputs/phase-11/evidence/test.log` | `pnpm --filter @ubm-hyogo/web test apps/web/src/lib/seo` 出力 |
| `outputs/phase-11/evidence/build.log` | `pnpm --filter @ubm-hyogo/web build` 出力 |
| `outputs/phase-11/evidence/grep-gate.log` | OG/sitemap/robots ファイル存在 grep + `process.env` 直接参照ゼロ確認 |
| `outputs/phase-11/evidence/curl-sitemap.xml` | `curl -s http://localhost:3000/sitemap.xml` |
| `outputs/phase-11/evidence/curl-robots.txt` | `curl -s http://localhost:3000/robots.txt` |
| `outputs/phase-11/evidence/curl-home-meta.txt` | `curl -s http://localhost:3000/ \| grep -E 'og:\|twitter:'` |
| `outputs/phase-11/evidence/curl-members-meta.txt` | 同上 `/members` |
| `outputs/phase-11/evidence/curl-register-meta.txt` | 同上 `/register` |
| `outputs/phase-11/evidence/playwright-smoke.log` | smoke spec 実行ログ |
| `outputs/phase-11/screenshots/og-image.png` | `/opengraph-image` を curl で保存した 1200x630 PNG |

## 11.2 実行コマンド一括

```bash
set -euo pipefail
OUT=docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/outputs/phase-11/evidence
mkdir -p "$OUT" "${OUT%/evidence}/screenshots"

mise exec -- pnpm --filter @ubm-hyogo/web typecheck 2>&1 | tee "$OUT/typecheck.log"
mise exec -- pnpm --filter @ubm-hyogo/web lint 2>&1 | tee "$OUT/lint.log"
mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/lib/seo 2>&1 | tee "$OUT/test.log"
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee "$OUT/build.log"

# grep gate
{
  echo "=== sitemap/robots/og file existence ==="
  ls apps/web/app/sitemap.ts apps/web/app/robots.ts apps/web/app/opengraph-image.tsx
  echo "=== process.env direct ref in seo helper (must be empty) ==="
  grep -rn "process\.env\." apps/web/src/lib/seo apps/web/app/sitemap.ts apps/web/app/robots.ts || echo "OK: no direct process.env"
} 2>&1 | tee "$OUT/grep-gate.log"

# dev server を別タブで起動した状態で curl
curl -s http://localhost:3000/sitemap.xml > "$OUT/curl-sitemap.xml"
curl -s http://localhost:3000/robots.txt  > "$OUT/curl-robots.txt"
curl -s http://localhost:3000/            | grep -E 'og:|twitter:' > "$OUT/curl-home-meta.txt"
curl -s http://localhost:3000/members     | grep -E 'og:|twitter:' > "$OUT/curl-members-meta.txt"
curl -s http://localhost:3000/register    | grep -E 'og:|twitter:' > "$OUT/curl-register-meta.txt"
curl -s http://localhost:3000/opengraph-image -o "${OUT%/evidence}/screenshots/og-image.png"

mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/public-metadata.spec.ts 2>&1 | tee "$OUT/playwright-smoke.log"
```

## 11.3 検証チェックリスト
- [x] `typecheck.log` exit 0
- [x] `lint.log` exit 0
- [x] `test.log` で 6+ ケース PASS
- [x] `build.log` exit 0
- [x] `grep-gate.log` で `process.env` 直接参照 0 件
- [x] `curl-sitemap.xml` が `<urlset>` を含み 3+ URL を返す
- [x] `curl-robots.txt` が `User-Agent: *` を含む
- [x] 公開 3 ルートの meta grep が `og:title` / `og:image` / `twitter:card` を返す
- [x] `og-image.png` が 1200x630 PNG として保存される
- [x] `playwright-smoke.log` で 7 ケース PASS

## 11.4 DoD
- 上記 evidence 全件配置 + チェックリスト全 PASS
- canonical path manifest を `outputs/phase-11/canonical-paths.json` に列挙


## 実行タスク
- [x] local PASS 5 点セットを evidence path に保存する
- [x] curl / Playwright / OG image artifact を保存する
- [x] canonical-paths.json で evidence manifest を固定する


## 参照資料
| 種別 | パス | 用途 |
| --- | --- | --- |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set と workflow 登録先の確認 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 公開導線・SEO/metadata 関連の即時参照 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 台帳との依存整合確認 |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/create-workflow.md` | Phase 1-13 生成・検証フロー |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Phase 12 strict / 4条件 / same-wave sync gate |
| Evidence guide | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | Phase 11 evidence conventions |
| Canonical paths | `.claude/skills/task-specification-creator/references/phase-11-guide.md` | local PASS 5 点セット |
| Workflow artifacts | `docs/30-workflows/issue-274-public-pages-ogp-sitemap-robots/artifacts.json` | Phase state / output path |


## 成果物
- `outputs/phase-11/evidence/`、`outputs/phase-11/screenshots/`、`outputs/phase-11/canonical-paths.json`


## 依存 Phase 参照
- Phase 1 の成果物を参照する
- Phase 2 の成果物を参照する
- Phase 5 の成果物を参照する
- Phase 6 の成果物を参照する
- Phase 7 の成果物を参照する
- Phase 8 の成果物を参照する
- Phase 9 の成果物を参照する
- Phase 10 の成果物を参照する


## 完了条件
- [x] 上記成果物が作成または更新されている
- [x] 参照資料との矛盾がない
- [x] 次 Phase が必要とする入力が本文または成果物に明記されている
