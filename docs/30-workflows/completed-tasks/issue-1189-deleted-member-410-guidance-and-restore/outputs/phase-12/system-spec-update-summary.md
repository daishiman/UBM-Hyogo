# Phase 12: システム仕様更新サマリー（system-spec-update-summary）

## 本 wave での判定

本 wave は `apps/web` 表現層のみを実装した。`apps/api` / D1 schema / Google Form / API response contract は変更していない。
したがって domain 正本仕様への新規 interface 追加は不要。ただし workflow 台帳は implemented workflow として aiworkflow-requirements へ同一 wave 同期する。

## Step 1-A: システム仕様（specs/）反映判定

| 項目 | 判定 | 根拠 |
|------|------|------|
| `specs/01-api-schema.md` 等への API 変更反映 | **不要** | `POST /admin/members/:memberId/restore` は既存 endpoint の UI 配線のみ。request/response/status code 不変 |
| `specs/02-auth.md` / `13-mvp-auth.md` への反映 | **不要** | 410 返却体系は不変。変更は web 表現層の文言/CTA のみ |
| D1 / Google Form 仕様 | **不要** | schema 変更ゼロ |
| task-workflow 台帳 | **必要・実施** | `implemented_local_evidence_captured` workflow として aiworkflow `references/task-workflow-active.md` / changelog / artifact inventory へ同期 |

## Step 1-B: skill references 反映判定

| 項目 | 判定 | 根拠 |
|------|------|------|
| `task-specification-creator` reference 追記 | **不要** | Implementation Target Physical Existence Gate / Same-Wave Implementation Evidence Reclassification Gate が既に該当 drift を禁止している |
| `aiworkflow-requirements` reference 追記 | **実施** | workflow active ledger と artifact inventory を追加し、正本索引から本 workflow に到達可能にする |

## Step 1-C: indexes 反映

| 項目 | 判定 |
|------|------|
| `mise exec -- pnpm indexes:rebuild` | 実行済み PASS。topic-map / keywords を再生成 |
| Progressive Disclosure 起点 | `quick-reference.md` / `resource-map.md` に 1189 workflow root・artifact inventory・focused evidence 導線を追加済み |

## Step 2: 正本仕様への新規 interface 追加判定

**判定: 不要。**

根拠:

1. `ProfileSessionErrorDisplay` 型は既存フィールド（`actionHref`/`actionLabel`）の利用で完結し型変更なし。
2. restore API は既存資産で、契約（200 `{id,restoredAt}` / 404 / 409 `member_not_deleted`）に手を入れない。
3. D1 schema・Google Form 仕様・consent キー・system field の扱いに変更なし。
