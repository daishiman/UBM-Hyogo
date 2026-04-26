# Monorepo Layout

```
ubm-hyogo/                          # pnpm workspace root
├── apps/
│   ├── web/                        # @ubm-hyogo/web
│   │   ├── app/                    # 既存 Next.js app dir
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── styles.css
│   │   ├── src/                    # Wave 0 新規追加
│   │   │   ├── app/
│   │   │   │   ├── (public)/page.tsx
│   │   │   │   ├── (member)/layout.tsx
│   │   │   │   └── (admin)/layout.tsx
│   │   │   ├── components/
│   │   │   │   └── ui/             # UI primitives 15 種
│   │   │   │       ├── Chip.tsx
│   │   │   │       ├── Avatar.tsx
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Switch.tsx
│   │   │   │       ├── Segmented.tsx
│   │   │   │       ├── Field.tsx
│   │   │   │       ├── Input.tsx
│   │   │   │       ├── Textarea.tsx
│   │   │   │       ├── Select.tsx
│   │   │   │       ├── Search.tsx
│   │   │   │       ├── Drawer.tsx
│   │   │   │       ├── Modal.tsx
│   │   │   │       ├── Toast.tsx
│   │   │   │       ├── KVList.tsx
│   │   │   │       ├── LinkPills.tsx
│   │   │   │       ├── icons.ts
│   │   │   │       └── index.ts    # barrel export
│   │   │   └── lib/
│   │   │       └── tones.ts        # zoneTone / statusTone
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── api/                        # @ubm-hyogo/api
│       ├── src/
│       │   ├── index.ts            # Hono: /healthz + /health + sync
│       │   └── sync/
│       ├── wrangler.toml
│       └── package.json
├── packages/
│   ├── shared/                     # @ubm-hyogo/shared
│   │   ├── src/
│   │   │   ├── index.ts            # barrel (ids + 4 層 + runtimeFoundation)
│   │   │   └── types/
│   │   │       ├── ids.ts          # MemberId/ResponseId/ResponseEmail/StableKey
│   │   │       ├── schema/index.ts
│   │   │       ├── response/index.ts
│   │   │       ├── identity/index.ts
│   │   │       └── viewmodel/index.ts
│   │   └── package.json
│   └── integrations/
│       ├── src/                    # @ubm-hyogo/integrations (既存)
│       └── google/                 # @ubm-hyogo/integrations-google (新規)
│           ├── src/
│           │   ├── forms-client.ts # FormsClient interface
│           │   └── index.ts
│           └── package.json
├── docs/
├── scripts/
├── package.json                    # root (test script 追加)
├── pnpm-workspace.yaml             # packages/integrations/* 追加
├── tsconfig.json
└── vitest.config.ts                # 新規追加
```
