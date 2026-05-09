# Phase 3: 設計レビュー（4-condition gate）

| 項目 | 値 |
|------|-----|
| レビュー日 | 2026-05-08 |
| 対象 | sub-task 2a / 2b / 2c / 2d |

## 4-condition gate（Stage 全体）

| # | 条件 | 判定 | 根拠 |
|---|------|------|------|
| C1 | 単一責務（CONST_007） | OK | 4 sub-task は `route × test 種別` で直交。重複なし |
| C2 | 不変条件遵守 | OK | 既存 fixture 再利用 / 新 endpoint なし / D1 直接アクセスなし / token 直書きなし |
| C3 | 受け入れ基準が観測可能 | OK | 全シナリオが `page.route()` または zod parse で機械検証可能 |
| C4 | 依存（Stage 1）が明示 | OK | index.md「依存」+ phase-2 R2 で `signSession()` 活性化を Stage 1 完了条件として記載 |

---

## sub-task 別 GO / NO-GO

### 2a — `admin-requests.spec.ts`

| 観点 | 判定 |
|------|------|
| endpoint 実在 | OK（`apps/api/src/routes/admin/requests.ts:194,254`） |
| UI route 実在 | OK（`apps/web/app/(admin)/admin/requests/`） |
| シナリオ 5 件すべて mock 戦略あり | OK（phase-2 §2.2a 表） |
| race 検証の決定論性 | OK（mock counter で観測） |
| **判定** | **GO** |

### 2b — `admin-identity-conflicts.spec.ts`

| 観点 | 判定 |
|------|------|
| endpoint 実在 | OK（`identity-conflicts.ts:38,54,91` の 3 endpoint すべて） |
| UI route 実在 | OK（`apps/web/app/(admin)/admin/identity-conflicts/`） |
| confirm dialog primitive 利用想定 | 暫定 OK（プロトタイプ正本に ConfirmDialog 想定。Phase 4 で実装確認） |
| DB 整合 assertion を API mock で完結 | OK（D1 直接アクセス禁止と整合） |
| **判定** | **GO**（dialog 実装が異なる場合は Phase 4 で selector 調整） |

### 2c — `admin-member-delete.spec.ts`

| 観点 | 判定 |
|------|------|
| endpoint 実在 | OK（`member-delete.ts:44`、audit は `audit.ts:144`） |
| UI route 実在 | OK（`apps/web/app/(admin)/admin/members/`） |
| 二段確認 UI 存在 | **要確認**（Phase 4 で `apps/web/src/components/admin/` 内 component を実装/確認） |
| cascade preview UI | **要確認**（実装未確定なら Phase 2 R6 に従い skip + 持越し） |
| audit 連動 | OK（mock で間接検証） |
| **判定** | **GO（条件付き）** — 二段確認 / preview が未実装なら 2c-1, 2c-2 を skip + Stage 3 持越し |

### 2d — Contract test 拡張

| 観点 | 判定 |
|------|------|
| 対象 7 endpoint 全て実装済 | OK（index.md inventory） |
| zod schema を share できるか | **要確認**（route 内 inline schema の場合は切り出し PR を別 Stage で分離） |
| 既存 contract test 構造との整合 | OK（`apps/api/src/audit-correlation/__tests__/contract.test.ts` と同構造） |
| **判定** | **GO（条件付き）** — schema 切り出しが必要な場合は Phase 4 で先行 PR を分割 |

---

## Stage 全体の verdict

> **GO（条件付き）**

### 条件

1. Stage 1（fixture `signSession()` 活性化）が完了していること。
2. 2c の二段確認 UI / cascade preview UI が実装済または Phase 4 で実装可能であること。実装困難な場合は当該シナリオを **skip + 注釈** で残し、Stage 3 に持越し。
3. 2d で zod schema が share 不可な場合、**schema 切り出しを別 PR で先行**してから contract test 本体を実装する。

---

## Open Questions（後続タスクへの申し送り）

| # | 問い | 受け先 |
|---|------|--------|
| Q1 | `requireAdmin` middleware が member 認証 cookie に対して 403 を返すか、`/login` redirect か | Phase 4（実装確認） |
| Q2 | `/admin/identity-conflicts/:id/merge` の response に統合先 `mergedMemberId` フィールドが含まれるか | API 実装読みまたは Phase 4 で実装側を fix |
| Q3 | `/admin/members/:id/delete` request body の `reason` は必須か optional か | `apps/api/src/routes/admin/member-delete.ts` の zod schema 確認 |
| Q4 | audit endpoint の sort 順（新しい順 / 古い順） | `audit.ts:144` 実装読み |
| Q5 | cascade preview 用 endpoint は存在するか（`GET /admin/members/:id/delete-preview` 等） | API ルート探索（現時点では未確認） |
| Q6 | 2d contract test を `apps/api` 配下と `apps/web` 配下のどちらに置くか | 既存 contract test 配置（`apps/api/src/audit-correlation/__tests__/contract.test.ts`）に倣い `apps/api` 側に集約推奨 |

---

## API endpoint 実在性サマリ（unchanged-API constraint チェック）

> 結論: **本 Stage で必要な endpoint は全て実装済み**。API 変更を要求するブロッカーは検出されず、UI-only mock への fallback は不要。

| sub-task | 必要 endpoint | 実装 | 備考 |
|----------|--------------|------|------|
| 2a | GET / POST /admin/requests* | OK | `requests.ts:194,254` |
| 2b | GET / POST(merge,dismiss) /admin/identity-conflicts* | OK | `identity-conflicts.ts:38,54,91` |
| 2c | POST /admin/members/:id/delete, GET /admin/audit | OK | `member-delete.ts:44`, `audit.ts:144` |
| 2c (補助) | GET /admin/members/:id/delete-preview | **未確認** | preview UI が API 駆動の場合のみ要確認（Q5） |
| 2d | 上記 7 endpoint | OK | shape は Phase 4 で確認 |

---

## 完了判定

Phase 3 は GO（条件付き）。Phase 4 以降の実装タスクは本ドキュメントの Open Questions を起点に着手すること。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-2
- phase: 3
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_verified

## 目的

Stage 2 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

