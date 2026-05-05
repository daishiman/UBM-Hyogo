# Three View Parity Check

`buildPublicMemberProfile` / `buildMemberProfile` / `buildAdminMemberDetailView` は `defaultMetadataResolver` を共有する単一の `buildSections()` 呼び出しに集約されている。

## Same-source check

| view | call site | resolver |
| --- | --- | --- |
| public | `apps/api/src/repository/_shared/builder.ts` `buildPublicMemberProfile` | `defaultMetadataResolver` |
| member | `apps/api/src/repository/_shared/builder.ts` `buildMemberProfile` | `defaultMetadataResolver` |
| admin | `apps/api/src/repository/_shared/builder.ts` `buildAdminMemberDetailView` | `defaultMetadataResolver` |

差分は `allowedVisibilities` のみ。`sectionKey` / `fieldKind` / `label` は同一 stable_key について 3 view で完全一致する（resolver 経由のため構造的に保証）。

## Sample resolution

| stable_key | sectionKey | fieldKind | label |
| --- | --- | --- | --- |
| `fullName` | `basic_profile` | `shortText` | お名前（フルネーム） |
| `publicConsent` | `consent` | `consent` | ホームページへの掲載に同意しますか？ |
| `responseEmail` | `__system__` | `system` | 回答者メールアドレス |
| `q_section1_company_name` (drift) | `__unknown__` (隔離) | `unknown` | "" |

## Tests covering parity

- `metadata.test.ts` で resolver の単一性を直接検証
- `builder.test.ts > filters by allowedVisibilities and never duplicates fields` で view 間で同一フィールドが重複出力されない事を保証
- `__tests__/builder.test.ts`（既存）で 3 view 全てが PASS している
