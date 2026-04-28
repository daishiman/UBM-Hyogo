# Phase 2 — dependency matrix

## 凡例

- `✓`: import 許可
- `X`: import 禁止（dep-cruiser + ESLint で検出）
- `—`: 自分自身（不適用）
- 空欄: 該当なし（実用上 import しない）

## 02c domain 内 + 共有資産

| from \\ to | adminUsers | adminNotes | auditLog | syncJobs | magicTokens | brand | db | sql | _setup | admin.fixture |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| adminUsers | — |  |  |  |  | ✓ | ✓ | ✓ |  |  |
| adminNotes |  | — |  |  |  | ✓ | ✓ | ✓ |  |  |
| auditLog |  |  | — |  |  | ✓ | ✓ | ✓ |  |  |
| syncJobs |  |  |  | — |  |  | ✓ | ✓ |  |  |
| magicTokens |  |  |  |  | — | ✓ | ✓ | ✓ |  |  |
| _setup |  |  |  |  |  |  | ✓ | ✓ | — | ✓ |
| admin.fixture |  |  |  |  |  | ✓ |  |  |  | — |

## 並列タスクからの import

| from | adminUsers | adminNotes | auditLog | syncJobs | magicTokens | brand | db | _setup |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 02a domain (members/identities/status/responses/responseSections/responseFields/fieldVisibility/memberTags) | X | X | X | X | X | ✓ | ✓ | ✓ |
| 02b domain (meetings/attendance/tagDefinitions/tagQueue/schemaVersions/schemaQuestions/schemaDiffQueue) | X | X | X | X | X | ✓ | ✓ | ✓ |

## 下流 task からの import（apps/api 内、許可）

| from | adminUsers | adminNotes | auditLog | syncJobs | magicTokens |
| --- | --- | --- | --- | --- | --- |
| 03a / 03b（forms 同期） |  |  | (✓ 任意) | ✓ |  |
| 04c（admin backoffice API） | ✓ | ✓ | ✓ |  |  |
| 05a（OAuth + admin gate） | ✓ |  | (✓ 任意) |  |  |
| 05b（Magic Link） |  |  | (✓ 任意) |  | ✓ |
| 07c（admin workflow） |  | ✓ | ✓ |  |  |
| 08a（contract test） | ✓ | ✓ | ✓ | ✓ | ✓ |

## apps/web からの import（**全禁止**）

| from \\ to | adminUsers | adminNotes | auditLog | syncJobs | magicTokens | brand | db | sql | _setup | D1Database 型 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `apps/web/**` | **X** | **X** | **X** | **X** | **X** | **X** | **X** | **X** | **X** | **X** |

すべての列で `X`。

- 検出 #1: dep-cruiser rule `no-web-to-d1-repository`（severity: error）
- 検出 #2: dep-cruiser rule `no-web-to-d1-binding`（severity: error）
- 検出 #3: ESLint `no-restricted-imports` で apps/web 内、即時 lint error

## cross-domain（02a ↔ 02b ↔ 02c）domain ファイルの相互 import

| from \\ to | 02a domain | 02b domain | 02c domain |
| --- | --- | --- | --- |
| 02a domain | ✓ (同 domain 内) | **X** | **X** |
| 02b domain | **X** | ✓ (同 domain 内) | **X** |
| 02c domain | **X** | **X** | ✓ (同 domain 内) |

検出: dep-cruiser rule `repo-no-cross-domain-2a-to-2b` / `repo-no-cross-domain-2b-to-2c` / `repo-no-cross-domain-2c-to-2a`

**`_shared/` および `__tests__/_setup.ts` は cross-domain rule の対象外**（共有資産）。

## builder（02a）→ adminNotes 経路の禁止（不変条件 #12）

02a の `_shared/builder.ts`（PublicMemberProfile / MemberProfile を組み立てる）は **adminNotes を import してはならない**。これは:

1. dep-cruiser の `repo-no-cross-domain-2a-to-2c` rule で構造的に禁止
2. type test で `PublicMemberProfile.adminNotes` プロパティの不在を確認
3. builder の API は `(rows: ResponseRow[]) => PublicMemberProfile` のように **adminNotes を引数で受けない**

## まとめ

- `apps/web/*` 行は repository / `_shared/` / `__tests__/` / `D1Database` 全列 X
- 02a ↔ 02b ↔ 02c の domain ファイルは相互 import 禁止（AC-11）
- `_shared/` / `__tests__/_setup.ts` は片方向（02a/02b/02c → `_shared/`）の共有資産として全 ✓
- builder 経路（02a）は adminNotes を絶対に import しない（不変条件 #12）
