# system-spec-update-summary — `docs/00-getting-started-manual/specs/` への提案差分

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | `implementation` / `NON_VISUAL`（artifacts.json metadata） |
| 方針 | 本 PR では 08a の現状を aiworkflow-requirements 索引へ同期し、specs 本体の詳細追記は提案として本書に列挙 |
| 反映タイミング | coverage gate 解消（UT-08A-01）後、09a / 09b の release runbook 内で specs 本体へ反映想定 |

## 0. 同 wave で同期した正本索引

| パス | 内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 08a を partial / NON_VISUAL として登録し、AC-6 gate 未達と UT-08A-01 を明示 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 08a API contract / repository / authz tests の即時導線を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | API test hardening タスク種別の entry を追加 |

## 1. 変更提案一覧

### 1-1. `docs/00-getting-started-manual/specs/01-api-schema.md`

| 提案 | 内容 |
| --- | --- |
| 追記 | view-model schema の正本は `packages/shared` 配下である旨を明記（Phase 8 で集約済み） |
| 追記 | endpoint 一覧に対し、各 endpoint が contract / authz / repository いずれの suite 配下にテストを持つかの参照表 |

### 1-2. `docs/00-getting-started-manual/specs/09-ui-ux.md`

| 提案 | 内容 |
| --- | --- |
| 追記 | a11y は **08b（フロント a11y 対応タスク）** の担当である旨を明記し、08a スコープ外であることを併記 |

### 1-3. `docs/00-getting-started-manual/specs/13-mvp-auth.md`

| 提案 | 内容 |
| --- | --- |
| 追記 | `AuthGateState` を contract test の観測対象として扱う例を追記（gate-state contract spec の signature を suffix 規約とともに掲載） |
| 追記 | `/me/profile` への PUT/PATCH を mount しない不変条件 (#11) を再確認し、**lint test と contract 404 test の二重防御**で担保している旨を明記 |

### 1-4. `docs/00-getting-started-manual/specs/16-component-library.md` *(該当ファイルがある場合)*

| 提案 | 内容 |
| --- | --- |
| 追記 | テストファイルの suffix 規約: `*.contract.spec.ts` / `*.authz.spec.ts` / `*.repo.spec.ts` / `*.type.spec.ts` / `*.lint.spec.ts` |
| 補足 | 既存 `*.test.ts` は段階的に rename（別 PR）。本 task では混在を許容 |

> 注: 16-component-library.md が現リポジトリに未存在の場合、本提案は **no-op**（spec 命名が確定した時点で適用）。

## 2. 変更不要の specs

以下は本 task で参照したが変更提案はない:

- `00-overview.md`
- `02-auth.md`
- `03-data-fetching.md`
- `04-types.md`
- `05-pages.md`
- `08-free-database.md`
- `11-admin-management.md`

## 3. specs 直下以外への波及（参考）

| パス | 提案 |
| --- | --- |
| `docs/30-workflows/08a-.../outputs/phase-05/test-signatures.md` | suffix 規約は本 task 内で確定済み。spec 反映時に source として参照 |
| `apps/api/.eslintrc` 系 | profile 編集 endpoint 追加禁止の custom rule（Phase 9 で提案、09b で配置） |

## 4. 未反映の理由

AC-6 coverage gate が PARTIAL のため、`docs/00-getting-started-manual/specs/` 本体へ「08a 完了済み」として反映するのは早い。現時点では正本索引に partial 状態と formalized follow-up を同期し、詳細仕様本体は UT-08A-01 解消後に更新する。
