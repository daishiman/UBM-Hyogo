[実装区分: 実装仕様書]

# Phase 10: リリース準備

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 10 / 13 |
| Phase 名称 | リリース準備（merge 順序 / rollback / AC-7 同期） |
| 作成日 | 2026-05-03 |
| 前 Phase | 9 (セキュリティ・品質ゲート) |
| 次 Phase | 11 (NON_VISUAL evidence) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| Issue | #393 (CLOSED) |

## 目的

14 ファイル・148 件の stableKey literal 置換を **family 別 commit** で `feature/* → dev → main` に投入し、
親 03a workflow の **AC-7（lint 静的検査で fully enforced 化可能）** を strict CI gate 昇格可能 state に更新する準備を整える。
本タスクは strict CI gate 昇格そのものは行わず、**「昇格可能性の証明」と「AC-7 status 更新計画」のみ** を担う。

## merge 順序

| # | 対象 | merge 先 | タイミング | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 本タスク（family A〜G 統合 PR、本仕様書 PR） | `dev` | 設計 PR 完了直後 | spec のみ。コード変更なし |
| 2 | family A〜G 実装 PR（実装 wave、別 wave） | `dev` | 設計 PR merge 後の実装 wave | 7 commits × 1 PR、または family ごとに分割可 |
| 3 | 親 03a workflow の `outputs/phase-12/implementation-guide.md` AC-7 表記更新 | `dev` | 上記 #2 merge 後 | 「lint 静的検査で fully enforced」表記に更新 |
| 4 | strict CI gate 昇格 PR（`.github/workflows/*.yml` で `--strict` を blocking 化） | `dev` | 上記 #3 と同 wave | 別 wave で実施 |
| 5 | `dev → main` リリース PR | `main` | 上記すべて merge 後 | tag 付与 |

> 本 PR（#393 対応）は **#1 設計 PR** および **#2 実装 PR** をスコープに含めることが可能。実装と設計の分離は wave 設計の判断とする。

## family 統合 vs 分割の判断基準

| 戦略 | 適用条件 | trade-off |
| --- | --- | --- |
| **family 統合 PR**（推奨）: 14 ファイルを 1 PR で 7 commits に分け投入 | family 内で circular dependency なし、合計 diff < 600 行 | レビュー一括、revert 単位は family 単位 |
| family 分割 PR（fallback）: family ごとに 7 PR | typecheck が family 統合で fail する場合 | レビュー回数増、CI 走行回数増 |

## family commit 順序（推奨）

依存関係（shared → integrations → api → web）順に commit する。

| # | family | 対象ファイル | 依存 |
| --- | --- | --- | --- |
| 1 | G (shared) | `packages/shared/src/utils/consent.ts` | 起点（依存なし） |
| 2 | A (sync) | `apps/api/src/jobs/mappers/sheets-to-members.ts`, `apps/api/src/jobs/sync-sheets-to-d1.ts` | shared / integrations |
| 3 | B (repository) | `apps/api/src/repository/_shared/builder.ts`, `apps/api/src/repository/publicMembers.ts` | shared |
| 4 | C (admin routes) | `apps/api/src/routes/admin/members.ts`, `apps/api/src/routes/admin/requests.ts` | shared |
| 5 | D (public) | `apps/api/src/use-cases/public/list-public-members.ts`, `view-models/public/public-member-list-view.ts`, `view-models/public/public-member-profile-view.ts` | shared |
| 6 | E (web profile) | `apps/web/app/profile/_components/RequestActionPanel.tsx`, `StatusSummary.tsx` | shared |
| 7 | F (web public) | `apps/web/src/components/public/MemberCard.tsx`, `ProfileHero.tsx` | shared |

各 commit 単体で `mise exec -- pnpm typecheck` PASS を維持する。

## Rollback 戦略

| 段階 | rollback 操作 | 影響範囲 |
| --- | --- | --- |
| 単一 family の不具合発覚 | 該当 family の commit のみ `git revert` | 1〜4 ファイル分の literal が legacy 直書きに戻るのみ |
| 複数 family 影響の障害 | 統合 PR 全体を `git revert -m 1 <merge_commit>` | 14 ファイル全 revert、stableKey literal 148 件復活、親 03a workflow AC-7 据え置き |
| AC-7 表記更新後の rollback | 親 workflow の AC-7 行を「規約 + 単体テスト担保」に戻す | 表記のみ revert、strict CI gate 状態は別 wave で扱う |

> **設計原則**: 14 ファイル変更は `import` 追加 + リテラル → 参照式の置換のみで構成し、ロジック変更は含めない。これにより **revert 安全性が保証される**。

## 親 03a workflow AC-7 status 更新計画

対象ファイル: `docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/outputs/phase-12/implementation-guide.md`

### 更新差分（diff 計画）

| 項目 | Before（現状） | After（本タスク完了時） |
| --- | --- | --- |
| AC-7 表記 | `規約 + 単体テストで担保（lint 未導入は legacy literal 残存のため strict CI gate は未昇格）` | `legacy literal cleanup 完了、strict CI gate 昇格可能 state（実 strict 化は別 wave）` |
| `metadata.workflow_state` | `enforced_dry_run` | `enforced_dry_run` を維持（strict CI gate merge wave で `completed` 昇格） |
| 関連 evidence 参照 | （未記載） | `docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/outputs/phase-11/evidence/lint-strict-after.txt` を追加 |

### 更新タイミング

- **本 PR では実施しない**（本 PR は設計仕様 + 実装の置換のみ）
- 実装 PR merge 後、別 commit で **本 workflow の Phase 12 implementation 経由で更新**
- strict CI gate 昇格 PR（別 wave）で `enforced_dry_run → completed` に昇格

## ステークホルダー通知（CHANGELOG エントリ案）

```markdown
### 2026-05-DD — issue-393 task-03a stableKey literal legacy cleanup
- **影響範囲**: 14 ファイル / 148 件の stableKey literal を正本 supply module 経由参照へ置換
  - 正本: `packages/shared/src/zod/field.ts`, `packages/integrations/google/src/forms/mapper.ts`
  - family A〜G に分割（sync / repository / admin / public / web profile / web public / shared utils）
- **lint 結果**: `lint-stablekey-literal.mjs --strict` violation: 148 → **0**
- **stableKeyCount**: 31（本 PR で変動なし）
- **AC 達成**: AC-1〜AC-7 すべて PASS
- **後続**: strict CI gate 昇格 PR（`.github/workflows/*.yml` で blocking 化）を別 wave で予約
- **rollback**: family 別 commit 構成のため `git revert` で family 単位の安全な巻き戻し可能
- **参照**: `docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/`
```

## GO / NO-GO チェック

| 項目 | 確認 | 状態 |
| --- | --- | --- |
| Phase 1〜9 すべて completed | artifacts.json | □ |
| family A〜G の対象ファイル一覧確定（Phase 4） | `outputs/phase-04/file-list.md` | □ |
| 各 family の置換手順確定（Phase 5） | `outputs/phase-05/runbook.md` | □ |
| typecheck / lint / strict-lint / vitest 4 ゲート設計（Phase 9） | `outputs/phase-09/main.md` | □ |
| revert 戦略 family 単位で確定 | 本 phase | □ |
| 親 03a AC-7 更新 diff 計画確定 | 本 phase | □ |

## NO-GO 条件

- family 統合 PR で typecheck が fail し、family 分割でも解消しない → barrel export / circular dependency を Phase 4 へ差戻し
- `lint-stablekey-literal.mjs --strict` で予期せぬ violation（>0）→ Phase 5 runbook の該当 family を再設計
- 親 03a workflow の `outputs/phase-12/implementation-guide.md` が rename されている → path 確定 + AC-7 行特定し計画更新

## 実行タスク

- [ ] merge 順序 5 step を `outputs/phase-10/main.md` に明記
- [ ] family commit 順序 7 step を明記
- [ ] rollback 戦略 3 段階を明記
- [ ] 親 03a workflow AC-7 status 更新 diff 計画を明記
- [ ] CHANGELOG エントリ案を確定

## 完了条件

- [ ] merge 順序確定
- [ ] family commit 7 step 順序確定
- [ ] rollback が family 単位で完結する設計
- [ ] AC-7 更新 diff 計画明示
- [ ] CHANGELOG エントリ案固定

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 10 を completed
- [ ] GO の場合 Phase 11 起動許可、NO-GO の場合は ブロック理由と recovery を記録

## 次 Phase

- 次: Phase 11 (NON_VISUAL evidence)
- 引き継ぎ: family 別 evidence 取得対象 / AC-7 更新 diff 案

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-09/main.md` | 品質 gate 入力 |
| 必須 | `docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/outputs/phase-12/implementation-guide.md` | AC-7 更新対象 |

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-10/main.md` | merge 順序 / rollback / AC-7 sync summary |

## 統合テスト連携

Phase 11 は本 Phase の family 別 commit 粒度を `manual-smoke-log.md` で確認し、各 family 単体で typecheck / strict lint PASS することを evidence 化する。
