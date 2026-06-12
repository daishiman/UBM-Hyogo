# System spec update summary

**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

本タスクが正本仕様（`docs/00-getting-started-manual/specs/`）および skill に与える影響。

## Step 1 — 完了記録（正本 spec 影響判定）

| spec file | 影響 | 更新要否 | 根拠 |
|-----------|------|---------|------|
| `docs/00-getting-started-manual/specs/00-overview.md` | 機能数・スコープ不変 | **不要** | 既存 `/admin/meetings` route の表現層 CSS/wrapper 整備のみ。新規機能なし |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | API endpoint surface 不変 | **不要** | meetings / attendance の endpoint・レスポンス shape を一切変更しない（shared-context §1 CONST 1 / §8） |
| `docs/00-getting-started-manual/specs/02-auth.md` | 認証フロー不変 | **不要** | admin auth 経路を変更しない |
| `docs/00-getting-started-manual/specs/08-free-database.md` | D1 schema / migration 不変 | **不要** | D1 直接アクセスなし（CONST 2）。schema 追加なし |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | MVP 認証方針 不変 | **不要** | meetings は admin 機能で MVP 認証 scope 外 |
| `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch token / primitive 不変（既存 `var(--ubm-*)` のみ参照） | **不要** | 新規色・新規 token を追加しない（CONST 3）。新設は CSS primitive クラスのみで token は既存範囲 |

### Step 1 総括

**N/A（本サイクルでは specs/ の正本更新を伴わない）**

理由:

1. 表現層 CSS 改修は既存 `var(--ubm-*)` トークンの実体化・適用であり、design language の正本（`design-tokens.md` / `claude-design-prototype/`）は既に確立済。新規 token を増やさない。
2. 新設するのは `.admin-detail-section*` / `.admin-attendee-row*` という **CSS クラス（実装詳細）**であり、正本 spec が宣言する API/schema/auth/token のいずれにも該当しない。
3. `/admin/meetings` 機能の **存在** は既に admin route 一覧に内包されており追加宣言不要。

## Step 2 — 新規インターフェース判定

**N/A**

- 本タスクは `implemented_local_evidence_captured` であり、公開する新規 I/F（API endpoint / 関数 export / 型 export）を **追加しない**。
- 新設する `.admin-detail-section*` / `.admin-attendee-row*` は **CSS クラスであり公開 API インターフェースではない**（TypeScript の型 / 関数 export ではない）。したがって新規インターフェース宣言の対象外。
- 既存 endpoint surface・既存 `useAdminMutation` ハンドラ・既存 data-testid/aria/role を維持する（contract 保持）。

## aiworkflow-requirements skill への影響

- 影響は **admin UI 表現層のみ**。API / D1 / Google Form schema への影響はゼロ。
- same-wave 同期を実施:
  - `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` に本 workflow root を追加
  - `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` に同上追加
  - `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` に entry 追加
  - `.claude/skills/aiworkflow-requirements/references/workflow-admin-meetings-card-ux-clarity-artifact-inventory.md` を新規作成
  - `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` に追記

## 不変条件への影響

| CLAUDE.md / CONST 不変条件 | 影響 | 対応 |
|--------------------|------|------|
| #5 D1 直接アクセス禁止 | 影響なし | apps/web から binding を触らない（CONST 2） |
| #9 admin form input は FormField 経由 | 影響なし | 新規 `<input>` を直書きしない（CONST 6） |
| #10 admin mutation hook 統一 | 影響なし | 既存 `useAdminMutation` ハンドラ維持 |
| UI prototype alignment invariant #1（既存 API のみ） | 影響なし | endpoint surface 不変・`git diff dev -- apps/api` 空（AC-8） |
| UI prototype alignment invariant #2（OKLch token 正本） | 影響なし | HEX 直書き 0 / `var(--ubm-*)` 経由・`verify:tokens` green（AC-7） |
| UI prototype alignment invariant #3（primitive 増やしすぎない） | 準拠 | 既存 BEM 実体化が主・汎用 primitive は最小限 2 系統のみ新設 |

## skill feedback への影響

`skill-feedback-report.md` で扱う（本ファイルは正本 spec / 新規 I/F 判定のみに集中）。
