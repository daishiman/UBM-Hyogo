# Phase 2 — アーキテクチャサマリ

## レイヤ構成

```
Cloudflare Workers (apps/web Next.js Server Component)
  └─ page.tsx
       ├─ fetchPublicOrNotFound (lib/fetch/public.ts) ← service-binding / HTTP fallback
       ├─ PublicMemberProfileZ.parse (zod fail-close)
       ├─ toMemberDetailProps (lib/adapters/member-detail.ts) ← visibility filter / unknown skip
       └─ <MemberDetail /> (components/public/MemberDetail.tsx)
            ├─ ProfileHero
            ├─ MemberTags
            ├─ MemberDetailSections (legacy section bridge)
            └─ attendance inline render
```

## 境界

| 層 | 副作用 | エラー扱い |
|----|--------|-----------|
| page.tsx | fetch / parse | 404 → notFound() / その他 → throw → error.tsx |
| adapter | なし (pure) | throw しない / logger 呼ばない |
| MemberDetail | DOM render | client error → boundary |

## データフロー

1. `params.id` を `encodeURIComponent` で escape して API path 構築
2. `fetchPublicOrNotFound` が service-binding（CF Workers）または HTTP fallback（local/CI）で fetch
3. response を `PublicMemberProfileZ.parse` で fail-close 検証
4. adapter で normalize (visibility=public のみ / unknown kind skip / 空 section 除外)
5. `<MemberDetail>` が既存 primitive を組み立てて描画
