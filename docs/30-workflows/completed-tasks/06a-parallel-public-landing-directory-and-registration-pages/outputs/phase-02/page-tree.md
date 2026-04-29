# page-tree.md — apps/web/app 構造

## ファイル構成

```
apps/web/app/
├── layout.tsx                          # 既存: html/body root
├── error.tsx                           # 新規: 共通エラー boundary（Server / Client mix）
├── not-found.tsx                       # 新規: 共通 404
├── styles.css                          # 既存
├── (public)/
│   ├── layout.tsx                      # 既存: passthrough（将来 AppHeader 配置）
│   ├── page.tsx                        # 新規: / (RSC)
│   ├── members/
│   │   ├── page.tsx                    # 新規: /members (RSC)
│   │   ├── _components/
│   │   │   ├── MembersFilterBar.client.tsx  # 新規: Client (URL query 連動)
│   │   │   └── MemberList.tsx          # 新規: Server (density 別 render)
│   │   └── [id]/
│   │       └── page.tsx                # 新規: /members/[id] (RSC + notFound())
│   └── register/
│       └── page.tsx                    # 新規: /register (RSC)
├── (member)/                            # 06b 担当
└── (admin)/                             # 06c 担当
```

## ライブラリ / コンポーネント

```
apps/web/src/
├── components/
│   ├── ui/                             # 既存 15 種 (Avatar/Button/Chip/Drawer/Field/Input/KVList/LinkPills/Modal/Search/Segmented/Select/Switch/Textarea/Toast)
│   ├── feedback/
│   │   └── EmptyState.tsx              # 新規: 共通空状態
│   └── public/                         # 新規: 公開層 placeholder
│       ├── Hero.tsx
│       ├── StatCard.tsx
│       ├── MemberCard.tsx
│       ├── Timeline.tsx
│       ├── ProfileHero.tsx
│       └── FormPreviewSections.tsx
└── lib/
    ├── fetch/
    │   └── public.ts                   # 新規: fetchPublic<T>
    └── url/
        ├── members-search.ts           # 新規: zod schema + helpers
        └── __tests__/
            └── members-search.test.ts  # 新規: U-01〜U-06
```

## Server / Client 境界

| component | 種別 | 理由 |
| --- | --- | --- |
| `app/layout.tsx` | Server | html/body root |
| `app/(public)/layout.tsx` | Server | passthrough |
| `app/(public)/page.tsx` | Server | データ fetch のみ |
| `app/(public)/members/page.tsx` | Server | searchParams parse + fetch |
| `app/(public)/members/_components/MembersFilterBar.client.tsx` | Client | useRouter / useSearchParams で URL 更新 |
| `app/(public)/members/_components/MemberList.tsx` | Server | density 別 render（pure） |
| `app/(public)/members/[id]/page.tsx` | Server | notFound() で 404 |
| `app/(public)/register/page.tsx` | Server | form-preview fetch |
| `Toast/Modal/Drawer (UI primitive)` | Client | 状態を持つ |
| `Hero/StatCard/MemberCard/Timeline/ProfileHero/FormPreviewSections` | Server | pure render |
| `EmptyState` | Server | pure render（onClear callback はリンク化で Server 対応） |

## 不変条件への対応

- #1: stableKey 経由のみ参照（直書き禁止 lint）
- #5: D1 import を apps/web 配下で禁止（fetchPublic 経由のみ）
- #6: window.UBM 参照ゼロ
- #8: density / sort / tag / q / zone / status を URL query 正本
- #9: `/no-access` ルート未作成
- #10: revalidate で 04a への呼び出し回数を抑制
