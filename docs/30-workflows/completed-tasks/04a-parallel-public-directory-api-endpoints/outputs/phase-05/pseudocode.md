# Pseudocode（04a 公開ディレクトリ）

## _shared/public-filter.ts
```ts
export interface PublicWhereParams {
  readonly publicConsent: 'consented';
  readonly publishState: 'public';
  readonly isDeleted: 0;
}
export const buildPublicWhereParams = (): PublicWhereParams => ({
  publicConsent: 'consented',
  publishState: 'public',
  isDeleted: 0,
});
export const isPublicStatus = (s: { publicConsent: string; publishState: string; isDeleted: boolean }): boolean =>
  s.publicConsent === 'consented' && s.publishState === 'public' && !s.isDeleted;
```

## _shared/search-query-parser.ts
```ts
export const DEFAULT_PUBLIC_MEMBER_QUERY = {
  q: '', zone: 'all', status: 'all', tags: [],
  sort: 'recent', density: 'comfy', page: 1, limit: 24,
} as const;

const SortZ = z.enum(['recent', 'name']);
const DensityZ = z.enum(['comfy', 'dense', 'list']);

const PublicMemberQueryZ = z.object({
  q: z.string().max(200).default(''),
  zone: z.string().default('all'),
  status: z.string().default('all'),
  tags: z.array(z.string()).default([]),
  sort: SortZ.default('recent'),
  density: DensityZ.default('comfy'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(24),
});

export const parsePublicMemberQuery = (raw: Record<string, string | string[] | undefined>) => {
  const result = PublicMemberQueryZ.safeParse({
    ...raw,
    tags: Array.isArray(raw.tag) ? raw.tag : raw.tag ? [raw.tag] : [],
  });
  const data = result.success ? result.data : DEFAULT_PUBLIC_MEMBER_QUERY;
  return { ...data, limit: Math.min(Math.max(data.limit, 1), 100) }; // AC-11 clamp
};
```

## _shared/pagination.ts
```ts
export interface PaginationMeta {
  total: number; page: number; limit: number;
  totalPages: number; hasNext: boolean; hasPrev: boolean;
}
export const buildPaginationMeta = (
  total: number, page: number, limit: number,
): PaginationMeta => {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    total, page, limit, totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};
```

## _shared/visibility-filter.ts
```ts
export interface VisibilityIndex { readonly stableKey: string; readonly visibility: 'public' | 'members_only' | 'admin_only'; }
export const keepPublicFields = <F extends { stableKey: string }>(
  fields: F[],
  index: ReadonlyMap<string, VisibilityIndex>,
): F[] => fields.filter(f => index.get(f.stableKey)?.visibility === 'public');
```

## use-cases/public/get-public-member-profile.ts
```ts
export const getPublicMemberProfile = async (memberId: string, deps: Deps) => {
  const status = await deps.statusRepo.getStatus(memberId);
  if (!status || !isPublicStatus(toStatusView(status))) {
    throw new ApiError({ code: 'UBM-1404' });
  }
  const member = await deps.memberRepo.findMemberById(memberId);
  if (!member) throw new ApiError({ code: 'UBM-1404' });
  const response = await deps.responseRepo.findCurrentResponse(memberId);
  const fields = await deps.fieldsRepo.listFieldsByResponseId(response.responseId);
  const sections = await deps.sectionsRepo.listSectionsByResponseId(response.responseId);
  const tags = await deps.tagsRepo.listTagsByMemberId(memberId);
  const schemaFields = await deps.schemaRepo.listFieldsByVersion(response.revisionId);
  return toPublicMemberProfile({ member, response, fields, sections, tags, schemaFields, status });
};
```

## view-models/public/public-member-profile-view.ts
```ts
export const toPublicMemberProfile = (src: ProfileSource): PublicMemberProfile => {
  // 二重チェック
  if (!isPublicStatus(src.status)) throw new ApiError({ code: 'UBM-1404' });

  const visIndex = new Map(src.schemaFields.map(f => [String(f.stableKey), f]));
  const sectionMap = new Map<string, MemberProfileSection>();
  for (const sec of src.sections) {
    sectionMap.set(sec.section_key, { key: sec.section_key, title: sec.section_title, fields: [] });
  }
  for (const f of src.fields) {
    const meta = visIndex.get(f.stable_key);
    if (!meta || meta.visibility !== 'public') continue; // AC-3
    const sec = sectionMap.get(meta.sectionKey);
    if (!sec) continue;
    sec.fields.push({
      stableKey: meta.stableKey,
      label: meta.label,
      value: parseAnswer(f.value_json),
      kind: meta.kind,
      visibility: 'public',
      source: 'forms',
    });
  }
  const safe = {
    memberId: src.member.member_id as MemberId,
    summary: buildSummary(src.fields, visIndex),
    publicSections: [...sectionMap.values()].filter(s => s.fields.length > 0),
    tags: src.tags.map(t => ({ code: t.code, label: t.label, category: t.category })),
  };
  delete (safe as Record<string, unknown>).responseEmail;
  delete (safe as Record<string, unknown>).rulesConsent;
  delete (safe as Record<string, unknown>).adminNotes;
  return PublicMemberProfileZ.parse(safe);
};
```

## routes/public/member-profile.ts
```ts
export const memberProfileRoute = (app: Hono<{ Bindings: Env; Variables: Variables }>) => {
  app.get('/members/:memberId', async (c) => {
    const memberId = c.req.param('memberId');
    const profile = await getPublicMemberProfile(memberId, c.var.deps);
    c.header('Cache-Control', 'no-store');
    return c.json(profile, 200);
  });
};
```
