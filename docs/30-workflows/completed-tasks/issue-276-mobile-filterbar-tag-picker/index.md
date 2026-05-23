# Workflow: issue-276-mobile-filterbar-tag-picker

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | issue-276-mobile-filterbar-tag-picker |
| 由来 Issue | https://github.com/daishiman/UBM-Hyogo/issues/276 |
| 親タスク | 06a-parallel-public-landing-directory-and-registration-pages |
| 前身 unassigned-task | `docs/30-workflows/unassigned-task/task-06a-followup-003-mobile-filterbar-tag-picker.md` |
| 分類 | feature（UI/UX 改善 + 軽微な API response 拡張） |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_runtime_pending |
| scope | public_members_mobile_filterbar_tag_picker |
| 優先度 | 中 |
| 作成日 | 2026-05-20 |
| 対象ブランチ | feature/issue-276-mobile-filterbar-tag-picker |
| Issue 状態 | open（仕様書は open のまま作成。close 状態は問題ではない） |
| coverage AC | 既定 workspace 閾値（Statements/Branches/Functions/Lines >=80%） |

## 目的（最上位）

`/members` 公開メンバー一覧の `MemberFilters` を改修し、

1. **tag 候補 picker（chip picker）** を追加して新規 tag 選択の発見性を上げる
2. **mobile レイアウト** を折りたたみ + sticky summary + clear-all で操作密度を改善
3. 選択済み tag が `MEMBERS_SEARCH_LIMITS.TAG_LIMIT` (=5) に達した際の **UI hint** を明示

URL `?tag=...&tag=...` の repeated query 不変条件は維持する（不変条件 #8）。

## スコープ

含む:
- `apps/web/src/components/public/MemberFilters.client.tsx` 改修
- tag candidate データの導出経路追加（Phase 1 で最終確定）
- mobile 折りたたみ / sticky summary / clear-all
- 選択済み tag 上限到達時の UI hint
- Playwright mobile viewport の E2E 追加
- Vitest component 単体テスト追加

含まない:
- tag 辞書編集 UI（admin タスク）
- member self-service tag 編集
- admin 側 MembersFilters の変更（`apps/web/src/features/admin/components/_members/MembersFilters.tsx`）

## 設計上の選択肢（Phase 1 で確定）

| 案 | 内容 | 採否（推奨） |
|----|------|------------|
| A | `PublicMemberListViewZ` に `topTags: { code, label, count }[]` を追加し API 側で集計 | **推奨**（既存 endpoint 内の response 拡張で済む。新 endpoint 追加・D1 schema 変更・Google Form 仕様変更のいずれにも該当しない） |
| B | 静的 tag 辞書を frontend に持たせる | 非推奨（Google Form schema 変更時に drift） |
| C | profile API を並列叩きして集計 | 非推奨（コスト過大、SSR タイムアウト懸念） |

CLAUDE.md「UI prototype alignment 不変条件 #1」との整合: 案 A は新 endpoint ではなく既存 endpoint の response field 追加であり禁止対象に該当しない。ただし `PublicMemberListViewZ` の strict 制約により破壊的変更となるため、Phase 4 のテスト fixture / consumer 全件更新を必須とする。

## Phase 一覧

| Phase | 名称 | ファイル |
|------|------|---------|
| 1 | 要件定義 / AC 確定 / API 拡張可否 | phase-01.md |
| 2 | 依存関係 / 影響範囲調査 | phase-02.md |
| 3 | アーキテクチャ設計 / コンポーネント分解 | phase-03.md |
| 4 | テスト作成（Vitest / Playwright） | phase-04.md |
| 5 | API 実装（topTags 集計） | phase-05.md |
| 6 | Web 実装（TagPicker / Mobile レイアウト） | phase-06.md |
| 7 | ローカル smoke 確認 | phase-07.md |
| 8 | レビュー（多角的） | phase-08.md |
| 9 | カバレッジ確認 | phase-09.md |
| 10 | リファクタリング | phase-10.md |
| 11 | スクリーンショット / 統合テスト evidence | phase-11.md |
| 12 | ドキュメント更新 / 仕様反映 | phase-12.md |
| 13 | PR 作成 | phase-13.md |

## 完了条件（workflow 全体）

- [ ] Phase 1-13 全 phase 完了
- [ ] coverage Statements/Branches/Functions/Lines >=80%（workspace 全体: `apps/api` / `apps/web` / `packages/*`）
- [ ] `bash scripts/coverage-guard.sh` exit 0
- [ ] Playwright mobile viewport で `/members?tag=ai&tag=design` のスクリーンショット取得
- [ ] PR が `dev` を base に作成され CI green
