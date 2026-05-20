# Phase 4: 既存実装の調査と影響範囲確定

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 | 前 | 3 | 次 | 5 |
| 状態 | completed |

## 目的
変更対象の現状を最新コードで確認し、影響範囲（衝突可能性、命名衝突、既存 metadata 上書きの有無）を確定する。

## 4.1 実コマンドでの調査

```bash
# 既存 metadata route の有無
find apps/web/app -maxdepth 2 -type f \( -name "sitemap*" -o -name "robots*" -o -name "opengraph-image*" -o -name "twitter-image*" \)

# 既存 metadata 宣言の grep
grep -rn "export const metadata\|export async function generateMetadata\|openGraph\|MetadataRoute" apps/web/app apps/web/src/lib 2>/dev/null

# env helper 利用箇所
grep -rn "getPublicEnv\|getEnv\b" apps/web/src apps/web/app 2>/dev/null

# public/members API の現在の I/O
sed -n '1,80p' apps/api/src/routes/public/members.ts
```

## 4.2 既知の現状（2026-05-17 時点）
- `apps/web/app/layout.tsx`: `title: "UBM Hyogo"` / `description: "Runtime foundation for UBM Hyogo"` のみ → **書き換える**
- `apps/web/app/(public)/members/[id]/page.tsx`: `generateMetadata` は `title` のみ設定 → **拡張する**
- `apps/web/app/page.tsx` / `(public)/members/page.tsx` / `(public)/register/page.tsx`: metadata 未設定 → **新規追加**
- sitemap / robots / opengraph-image: 未存在 → **新規作成**

## 4.3 影響範囲リスク
| リスク | 影響先 | 対策 |
| --- | --- | --- |
| `next/og` の bundle が Workers size limit に触れる | build / deploy | `runtime = "edge"` を opengraph-image に明示。`apps/web/next.config.ts` に追加 webpack config 不要（Next.js 既定で resolve） |
| `INTERNAL_API_BASE_URL` 未設定の local dev で sitemap fetch fail | local dev | `try/catch` で static entries fallback、`console.warn` で観測 |
| `layout.tsx` の `title` 文字列が title 型 → object 型に変わり既存ページの上書き互換性が壊れる | 全ページ | template 型を使うため、既存ページが `metadata.title = "..."` を返している箇所を grep で確認し、文字列のままで OK（template が wrapping する） |
| robots staging で `Disallow: /` を入れると Playwright smoke が staging 環境では機能しない | E2E | smoke は local 起動 dev server で実行する前提（既存 `apps/web/playwright.config.ts` と整合） |

## 4.4 競合する PR / 進行中タスクの確認
```bash
gh pr list --search "sitemap OR robots OR opengraph" --state open --limit 10
git log --oneline --all -- 'apps/web/app/sitemap*' 'apps/web/app/robots*' 'apps/web/app/opengraph*' 2>/dev/null
```
- 想定: 該当 PR なし。あれば Phase 5 開始前に rebase 戦略を決める。

## 依存 Phase 参照
- Phase 1 の成果物を参照する
- Phase 2 の成果物を参照する
- Phase 3 の成果物を参照する


## 完了条件
- [ ] この Phase の成果物が作成または更新されている
- [ ] 参照資料との矛盾がない
- `outputs/phase-04/main.md` に grep 出力サンプル / 現状ファイル一覧 / 影響範囲表が記録されている


## 実行タスク
- [ ] metadata route と page metadata の現行有無を実測する
- [ ] env helper / public API / existing metadata の衝突範囲を洗い出す
- [ ] 競合 PR と履歴を確認して Phase 5 の開始条件を固定する


## 参照資料
| 種別 | パス | 用途 |
| --- | --- | --- |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set と workflow 登録先の確認 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 公開導線・SEO/metadata 関連の即時参照 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 台帳との依存整合確認 |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/create-workflow.md` | Phase 1-13 生成・検証フロー |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Phase 12 strict / 4条件 / same-wave sync gate |
| 現行 app tree | `apps/web/app/` | metadata route / page metadata 実在調査 |
| 現行 SEO helper 候補 | `apps/web/src/lib/` | helper 配置先調査 |
| GitHub | `gh pr list --search "sitemap OR robots OR opengraph"` | 競合 PR 調査 |


## 成果物
- `outputs/phase-04/main.md`（現行調査ログ・影響範囲）
