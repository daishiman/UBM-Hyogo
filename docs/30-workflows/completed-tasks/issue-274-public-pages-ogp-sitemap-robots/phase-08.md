# Phase 8: 実装 — 公開 4 ルートの per-page metadata

## メタ情報
| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 | 前 | 7 | 次 | 9 |
| 状態 | completed |

## 目的
`/`, `/members`, `/members/[id]`, `/register` の各 page module に `metadata` export / `generateMetadata` 拡張を実装する。

## 8.1 変更対象ファイル

| ファイル | 種別 | 変更内容 |
| --- | --- | --- |
| `apps/web/app/page.tsx` | 編集 | `metadata` export 追加 |
| `apps/web/app/(public)/members/page.tsx` | 編集 | `metadata` export 追加 |
| `apps/web/app/(public)/members/[id]/page.tsx` | 編集 | 既存 `generateMetadata` を `buildPageMetadata` 経由に書き換え |
| `apps/web/app/(public)/register/page.tsx` | 編集 | `metadata` export 追加 |

## 8.2 各ファイル差分方針

### `apps/web/app/page.tsx`
```ts
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/site-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "ホーム",
  description: "UBM 兵庫支部会の活動紹介、メンバーディレクトリ、参加案内",
  path: "/",
});
```

### `apps/web/app/(public)/members/page.tsx`
```ts
export const metadata: Metadata = buildPageMetadata({
  title: "メンバー一覧",
  description: "UBM 兵庫支部会のメンバー紹介。職種・拠点・関心領域から探せます",
  path: "/members",
});
```

### `apps/web/app/(public)/members/[id]/page.tsx`
既存の `generateMetadata` を以下に置換（`notFound()` を maintain）:
```ts
export async function generateMetadata({ params }: MemberDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await fetchProfile(id);
  if (!profile) {
    return buildPageMetadata({
      title: "メンバーが見つかりません",
      description: "指定された UBM 兵庫支部会メンバーは公開されていません",
      path: `/members/${id}`,
      twitterCard: "summary",
    });
  }
  const occ = profile.summary.occupation;
  return buildPageMetadata({
    title: profile.summary.fullName,
    description: `${profile.summary.fullName}${occ ? `（${occ}）` : ""}の UBM 兵庫支部会プロフィール`,
    path: `/members/${id}`,
    twitterCard: "summary",
  });
}
```

### `apps/web/app/(public)/register/page.tsx`
```ts
export const metadata: Metadata = buildPageMetadata({
  title: "入会案内",
  description: "UBM 兵庫支部会への入会フォーム案内。Google Form に遷移します",
  path: "/register",
});
```

## 8.3 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web dev &
sleep 5
for path in / /members /register; do
  echo "=== $path ==="
  curl -s "http://localhost:3000$path" | grep -E 'og:title|og:description|og:image|twitter:card' | head -5
done
```

## 8.4 DoD
- 4 ルート全てに `<meta property="og:title">` / `og:description` / `og:image` / `<meta name="twitter:card">` が出力される
- `/members/[id]` の OG title が member の `fullName` を含む
- typecheck / lint PASS


## 実行タスク
- [ ] `/`, `/members`, `/register` に page metadata を追加する
- [ ] `/members/[id]` の `generateMetadata` を description / OGP / Twitter へ拡張する
- [ ] 公開 4 ルートの meta tag 出力を curl または Playwright で確認する


## 参照資料
| 種別 | パス | 用途 |
| --- | --- | --- |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set と workflow 登録先の確認 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 公開導線・SEO/metadata 関連の即時参照 |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 台帳との依存整合確認 |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/create-workflow.md` | Phase 1-13 生成・検証フロー |
| タスク仕様 skill | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Phase 12 strict / 4条件 / same-wave sync gate |
| 実装対象 | `apps/web/app/page.tsx` | `/` metadata |
| 実装対象 | `apps/web/app/(public)/members/page.tsx` | `/members` metadata |
| 実装対象 | `apps/web/app/(public)/members/[id]/page.tsx` | member detail metadata |
| 実装対象 | `apps/web/app/(public)/register/page.tsx` | `/register` metadata |


## 成果物
- 公開 4 ルート page metadata 差分


## 依存 Phase 参照
- Phase 1 の成果物を参照する
- Phase 2 の成果物を参照する
- Phase 5 の成果物を参照する
- Phase 6 の成果物を参照する
- Phase 7 の成果物を参照する


## 完了条件
- [ ] 上記成果物が作成または更新されている
- [ ] 参照資料との矛盾がない
- [ ] 次 Phase が必要とする入力が本文または成果物に明記されている
