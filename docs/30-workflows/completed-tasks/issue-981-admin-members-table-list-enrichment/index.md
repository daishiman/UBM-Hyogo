---
workflow_id: issue-981-admin-members-table-list-enrichment
workflow_state: implemented_local_evidence_captured
created_at: 2026-05-29
owner: daishiman
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
implementation_mode: new
parent_workflow: admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign
source_issue: 981
source_issue_state: CLOSED
branch: docs/issue-981-admin-members-table-list-enrichment
base_branch: dev
---

# issue-981 — admin members list の zone / tags / occupation を MembersTable に実データ描画

> Branch: `docs/issue-981-admin-members-table-list-enrichment` / Base: `dev`
> 実装区分: **実装仕様書** (CONST_004 デフォルト)
> 状態: `implemented_local_evidence_captured`（本ワークフローで `MembersTable` 実装と focused test まで完了。staging visual / commit / PR は user-gated）
> 作成日: 2026-05-29
> task type: `UI task` / `VISUAL_ON_EXECUTION`
> implementation_mode: `new`（UI lane は新規描画追加。データ層は `verify_existing`＝既実装）
> 並列実行: 単一コンポーネント変更のため Lane 分割なし（Phase 5 は直列）

## 実装区分の判定根拠（CONST_004）

- **判定: 実装仕様書**（docs-only ではない）。
- 根拠: Issue #981 の受入条件 AC-2「`MembersTable` の zone chip / tag pill / occupation が実データ描画」は **コード変更（`apps/web` の React コンポーネント + spec）なしには達成不可能**。「改善する」「実データ描画」という目的が含意するため CONST_004 の判断基準により実装仕様書とする。

## Issue #981 の現状最適化（根本問題の再定義）

> GitHub 実確認の結果、**Issue #981 は 2026-05-29 時点で CLOSED**。本ワークフローは Issue を再オープン/クローズせず、現コードに最適化したスコープで仕様書化する（GitHub Issue 本文の編集・state 変更は不要）。

dev tip（`7e559a9d3`）の実コードを精査した結果、Issue #981 の元スコープのうち **データ層は別タスク #968 で既に実装済み**で、**UI 描画のみが未対応**であることが判明した。Issue を現コードへ最適化した受入条件の達成状況は以下:

| 元 AC | 内容 | 現状 | 帰結 |
| --- | --- | --- | --- |
| AC-1 | list response に zone / tags[] / occupation が含まれ zod parse pass | ✅ 実装済（#968） | スコープ外（回帰確認のみ） |
| AC-2 | `MembersTable` の zone chip / tag pill / occupation が実データ描画 | ❌ **未対応**（placeholder「—」/列なし） | **本ワークフローの主スコープ** |
| AC-3 | list endpoint P95 +50ms 以内（N+1 不可） | ✅ 実装済（`json_group_array` 相関サブクエリ） | スコープ外（変更なし＝劣化なし） |
| AC-4 | list 行 tag pill は disabled 維持（followup-002 境界） | 該当（list の tag pill は表示のみ・write なし） | 本ワークフローで遵守 |
| AC-5 | apps/api / apps/web typecheck green | API は ✅。web は本変更で担保 | 本ワークフローで担保 |
| AC-6 | 既存 admin filter regression 無し | filter ロジック非変更 | 本ワークフローで担保 |

### 既実装の根拠（P50 チェック / verify_existing）

- API list endpoint: `apps/api/src/routes/admin/members.ts`（GET `/admin/members`）の SELECT が `json_group_array(json_object('code', td.code, 'label', td.label))` で tags を相関サブクエリ取得（N+1 回避済）。response mapping で `occupation` / `ubmZone` / `ubmMembershipType` を `answers_json` から派生して返却済。
- shared schema: `packages/shared/src/zod/viewmodel.ts` の `AdminMemberListItemZ` に `occupation` / `ubmZone` / `ubmMembershipType` / `tags: {code,label}[]` が optional で定義済。
- contract test: `apps/api/src/routes/admin/members.contract.spec.ts`（"prototype list fields are additively derived" ケース）が enrichment フィールドを assert 済。
- ⇒ **API / schema 変更は不要**。`MembersTable` から `m.occupation` / `m.ubmZone` / `m.ubmMembershipType` / `m.tags` を**参照するだけで実データ描画可能**。

## 真の論点（要件レビュー思考法）

1. **真の論点**: 「データは届いているのに UI が placeholder のまま」という**描画ギャップ**の解消。データパイプラインの問題ではない。
2. **依存関係・責務境界**: データ取得（API/schema = 完了済・変更禁止）と描画（`MembersTable` = 本スコープ）の責務は分離済。本ワークフローは UI 層に閉じる。
3. **価値とコスト**: 価値＝admin が drawer を開かずに list 行で会員の区画/タグ/職業を「ざっと見」できる（親 workflow の hold 解消）。コスト＝単一コンポーネント + spec の小規模変更。既存 primitive（`Chip` / `zoneTone` / `statusTone`）再利用で新規 primitive ゼロ。
4. **改善優先順位**: AC-2 のみが残課題。1 サイクルで完結（CONST_007）。
5. **4 条件**: 価値性◯（drawer 往復削減）/ 実現性◯（既存部品で実装可）/ 整合性◯（API 不変・プロトタイプ正本準拠）/ 運用性◯（既存 spec 拡張で回帰 guard）。

## スコープ

### スコープ内

| 項目 | 内容 |
| --- | --- |
| occupation 描画 | `MembersTable` の「メンバー」列で氏名下に `m.occupation` を small text 描画（プロトタイプ `pages-admin.jsx` L240-243 準拠） |
| 区画 / ステータス chip | 「ステータス」列を「区画 / ステータス」へ整合し、`zoneTone(m.ubmZone)` の zone chip + `statusTone(m.ubmMembershipType)` の type chip を追加描画（既存 `MemberStateChipRow` は維持） |
| tag pill 描画 | 「タグ」列の placeholder「—」を `m.tags` の実データ pill（最大2件 + 超過 `+N`、空時「未タグ」warn chip）へ置換（プロトタイプ L251-258 準拠） |
| spec 拡張 | `MembersTable.spec.tsx` に occupation / zone chip / tag pill / 未タグ の描画 assert を追加。`mkMember` ファクトリを enrichment フィールド対応に拡張 |
| Playwright visual baseline | 既存 admin-members visual spec が存在する場合は enrichment 反映後の baseline 差分を VISUAL_ON_EXECUTION で取得（user-gated） |

### スコープ外（本サイクル内で対応しない）

| 項目 | 理由 | 実施場所 |
| --- | --- | --- |
| `/admin/members` API / D1 schema 変更 | データ層は #968 で実装済。CLAUDE.md 不変条件 #5・親 workflow invariant #1 | 変更不要 |
| list 行 tag pill の write（タグ編集） | followup-002（Issue #982）の境界。list の pill は表示のみ | Issue #982 |
| zone / membershipType の人間可読ラベル辞書化 | 現状は raw 値描画（プロトタイプも raw 描画）。ラベル整備は別 UX 改善 | 未タスク候補（Phase 12 で判定） |
| Avatar の画像ストレージ参照（hue 以外） | API list は photo URL を返さない。followup-003（Issue #983）境界 | Issue #983 |
| `MemberDrawer` の zone/occupation 表示 | 既に drawer で表示済（`MemberDrawer.tsx`） | 変更不要 |

> **CONST_007 適用判断**: 残課題は AC-2（UI 描画）のみで、単一コンポーネント + spec に閉じる。1 サイクルで完結し、先送り分離はゼロ。上表「スコープ外」は本 Issue #981 の責務外（別 Issue 既起票済 / データ層既実装）であり、「分量」を理由とした先送りではない。

## 不変条件（本ワークフロー固有）

1. **既存 API のみ接続**: `apps/api` 変更禁止。`MembersTable` は `AdminMemberListView["members"][number]` 既存型のフィールド参照のみ。新 endpoint・schema 変更禁止（CLAUDE.md #5・#1）。
2. **OKLch トークン正本**: 色は `apps/web/src/styles/tokens.css` の既存トークンのみ。`Chip` の `data-tone` 経由で `ui-chip` クラスが解決する。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（CI gate `verify-design-tokens`）。
3. **プロトタイプ正本順位**: `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` L223-276 の table 構成をデザイン正本とする。新規 primitive を生やさない（既存 `Chip` 再利用）。
4. **既存 primitive 再利用必須**: zone/type chip は `apps/web/src/lib/tones.ts` の `zoneTone()` / `statusTone()` + `apps/web/src/components/ui/Chip.tsx` を再利用。新規 chip コンポーネントを作らない（`MemberStateChip.tsx` と同一パターン）。
5. **テスト命名**: `*.spec.{ts,tsx}` のみ（CLAUDE.md #8）。`*.test.*` は CI で reject。
6. **D1 直接アクセス禁止**: `apps/web` から D1 binding 禁止（CLAUDE.md #5）。
7. **list tag pill 非編集**: list 行の tag pill は表示専用（AC-4。write は Issue #982 境界）。
8. **呼び出し側互換**: `MembersTableProps` のシグネチャは変更しない（`MembersClientShell` 側の改修を不要にする）。

## 正本順位（衝突時）

1. このワークフローの `phase-1-requirements.md` / `phase-2-design.md`
2. 親 workflow `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/`
3. `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md`
4. プロトタイプ `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`
5. `apps/web/src/styles/tokens.css`

## Phase 一覧

| Phase | File | 内容 |
| ----- | ---- | ---- |
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義（AC・スコープ・命名規則・P50 既実装確認） |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計（table 列マッピング・chip 描画ロジック・既存部品再利用） |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー（gate） |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画（vitest 追加ケース・Playwright マトリクス） |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順（`MembersTable.tsx` 差分・関数シグネチャ・実行コマンド・DoD） |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト拡充（a11y / 境界 / 未タグ） |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ確認（変更行 line/branch） |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ（chip 描画ヘルパー抽出判断） |
| 9 | [phase-9-qa.md](phase-9-qa.md) | 品質保証（typecheck / lint / build / verify-design-tokens） |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー（AC 充足判定） |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト + Playwright visual capture |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント更新（strict 7 outputs） |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成（user 明示承認後） |

## 変更対象ファイル（overview）

### 修正（in-place）

- `apps/web/src/features/admin/components/_members/MembersTable.tsx`
  - 「メンバー」列: 氏名下に occupation small text 追加
  - 「ステータス」列ヘッダ → 「区画 / ステータス」へ整合 + zone chip / type chip 追加
  - 「タグ」列: placeholder「—」→ tag pill 描画へ置換
- `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx`
  - `mkMember` を enrichment フィールド対応に拡張、occupation / zone chip / tag pill / 未タグ の assert 追加

### 新規（必要時のみ・Phase 8 で判定）

- `apps/web/src/features/admin/components/_members/MemberTagPills.tsx`（tag pill 描画ロジックを切り出す場合のみ。デフォルトは `MembersTable` 内に inline）

### 影響範囲（変更禁止だが参照する）

- `apps/web/src/components/ui/Chip.tsx`（`tone` / `dot` props 流用）
- `apps/web/src/lib/tones.ts`（`zoneTone()` / `statusTone()` / `ChipTone` 流用）
- `apps/web/src/features/admin/components/_members/MemberStateChip.tsx`（同一描画パターンの参照）
- `packages/shared/src/zod/viewmodel.ts`（`AdminMemberListItemZ` の enrichment フィールド型・参照のみ）
- `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx`（デザイン正本・参照のみ）

## 完了条件（DoD overview）

1. `MembersTable` が `m.occupation` / `m.ubmZone` / `m.ubmMembershipType` / `m.tags` を実データ描画し、placeholder「—」が tag 列から消える。
2. 空 tags 時は「未タグ」warn chip、tags 超過時は `+N` chip を描画。occupation / ubmZone / ubmMembershipType が undefined の行は当該要素を省略（エラーや空 chip を出さない）。
3. `pnpm --filter @ubm-hyogo/web test`（MembersTable.spec）全 PASS、a11y violations 0。
4. `pnpm typecheck` / `pnpm lint` / `pnpm build` 全 PASS。
5. `verify-design-tokens`（CI gate）PASS（HEX 直書き 0 件）。
6. Phase 12 strict 7 成果物が揃い、`gate-metadata:validate` ERROR=0 / `verify:phase12-compliance` PASS。
7. `MembersTableProps` シグネチャ不変（呼び出し側 `MembersClientShell` の改修不要）。

## 関連タスク

| Task | 状態 | 関連性 |
| ---- | ---- | ------ |
| `docs/30-workflows/completed-tasks/admin-ui-prototype-alignment-followup-003-admin-members-prototype-redesign/` | implemented_local_evidence_captured | 親 workflow。本 Issue #981 を Phase 12 で未タスク化した発生源。tag placeholder を hold した張本人 |
| `apps/api`（Issue #968 系 `/admin/members fetch+visual followup-001`） | merged | list response の zone/tags/occupation enrichment（データ層）を実装済 |
| Issue #982（fu-002 tag write） | CLOSED | list 行 tag pill の write 境界。本タスクは表示のみ（AC-4） |
| Issue #983（fu-003 photo R2） | CLOSED | avatar 画像ストレージ。本タスクは hue 描画のみ |

## メモ

- 本ワークフローは automation-30 改善サイクルで **Phase 1-13 仕様書に加えて実コードを同一 wave 反映済み**。実装済み範囲は `MembersTable` の occupation / zone / membership type / tag pill 描画と focused spec 拡張。commit / push / PR / staging deploy / authenticated staging visual は user-gated。
- Issue #981 は CLOSED（2026-05-29 GitHub 実確認）。Issue 本文の最適化（スコープ縮小）反映・state 変更は不要。
</content>
</invoke>
