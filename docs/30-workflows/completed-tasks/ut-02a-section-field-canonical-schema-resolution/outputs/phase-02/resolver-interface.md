# Resolver Interface

Planned interface:

```ts
interface MetadataResolver {
  resolveSectionKey(stableKey: string, context?: ResolveContext): Result<SectionKey, ResolveError>;
  resolveFieldKind(stableKey: string, context?: ResolveContext): Result<FieldKind, ResolveError>;
  resolveLabel(stableKey: string, context?: ResolveContext): Result<string, ResolveError>;
}
```

`stable_key` is a required input to the resolver. AC-2 does not ban this reference; it bans old label/kind/section guessing in `builder.ts`.

