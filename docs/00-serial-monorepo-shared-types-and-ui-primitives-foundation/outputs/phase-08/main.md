# Phase 8 成果物: DRY 化

## Package Alias Before/After

| Before（候補） | After（採用） | 理由 |
|--------------|-------------|------|
| @app/shared | @ubm-hyogo/shared | プロジェクト名 prefix で明示 |
| @app/api | @ubm-hyogo/api | 同上 |
| @app/web | @ubm-hyogo/web | 同上 |
| @app/integrations-google | @ubm-hyogo/integrations-google | 同上 |

## UI Primitives 命名（16-component-library.md 完全準拠）

| Before（NG） | After（採用） |
|------------|-------------|
| Tag / Pill | Chip |
| IconButton | Button（icon prop で表現） |
| ConfirmModal | Modal（content で表現） |
| Toggle | Switch |
| RadioGroup | Segmented |
| Notice | Toast |
| KVTable | KVList |
| SocialLinks | LinkPills |

採用 15 種: Chip / Avatar / Button / Switch / Segmented / Field / Input / Textarea / Select / Search / Drawer / Modal / Toast / KVList / LinkPills

## 型 Alias Before/After

| Before | After | 理由 |
|--------|-------|------|
| string（メンバーID） | MemberId | responseId と混同防止 |
| string（回答ID） | ResponseId | 同上 |
| string（メール） | ResponseEmail | system field 識別 |
| string（フィールドID） | StableKey | questionId 直書き禁止 |

## Path 規約

| Before（NG） | After（採用） |
|------------|-------------|
| apps/web/components/ | apps/web/src/components/ |
| apps/web/lib/ | apps/web/src/lib/ |
| apps/api/index.ts | apps/api/src/index.ts |

## ESLint Rule 命名

| Before | After | 担当ファイル |
|--------|-------|-----------|
| forbid-d1 | no-d1-from-web | .eslintrc/rules/no-d1-from-web.ts（placeholder） |
| no-localstorage | no-localstorage-in-primitives | .eslintrc/rules/no-localstorage-in-primitives.ts（placeholder） |

## Endpoint

| Before | After |
|--------|-------|
| GET /health | GET /healthz（k8s/Cloudflare 慣習） |
