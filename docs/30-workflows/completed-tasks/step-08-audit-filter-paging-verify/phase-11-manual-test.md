# Phase 11: 手動テスト（再現コマンド実行・NON_VISUAL）

**[実装区分: 実装仕様書（verify_existing）]**

## 0. NON_VISUAL 宣言（冒頭明記）

| 項目 | 内容 |
|------|------|
| タスク種別 | `taskType: implementation` / `implementation_mode: verify_existing` / `visualEvidence: NON_VISUAL` |
| 非視覚的理由 | `/(admin)/admin/audit` は元監査 spec で「✅ OK - 改善不要」と判定済みで、本タスクは **UI/UX を一切変更しない**（`apps/` 差分ゼロ）。新規描画・レイアウト変更がないため新規スクリーンショットは証跡として無意味であり、既存 visual snapshot（`admin-audit-{desktop,tablet,mobile}`）を流用する |
| 代替証跡 | 既存自動テストの回帰結果（web component 423 行スイート + api contract 303 行スイート）＋ 監査主張の再現コマンド実行結果。実地 GUI 操作の代わりに**ローカル再現コマンド実行**で監査結論を裏付ける |
| 固定フレーズ | **UI/UX 変更なしのため Phase 11 スクリーンショット不要** |

> **UI/UX 変更なしのため Phase 11 スクリーンショット不要。**

## 1. 証跡メタ情報（Feedback4 準拠）

| 項目 | 値 |
|------|----|
| 証跡の主ソース | web component スイート `AuditLogPanel.component.spec.tsx`（423 行）+ api contract スイート `audit.contract.spec.ts`（303 行） |
| 補助証跡 | `page.page.spec.ts`（14 行）/ E2E `admin-schema-conflicts-audit.spec.ts`（151 行）/ visual snapshot `admin-audit-{desktop,tablet,mobile}`（流用・新規撮影なし） |
| スクリーンショットを作らない理由 | UI/UX 変更ゼロ・`apps/` 差分ゼロのため新規描画がなく、既存 visual baseline を流用すれば足りる。新規撮影は冗長で証跡価値がない（NON_VISUAL） |
| 実行環境 | worktree ローカル（Node 24 / pnpm 10 を `mise exec --` で保証）。実地 admin GUI 操作は不可なため、ローカル再現コマンド実行で代替する |
| Phase 11 実行時の正本ファイル名 | `outputs/phase-11/manual-test-result.md`（NON_VISUAL + verify_existing の canonical 出力先） |
| screenshots ディレクトリ | **作らない**（`outputs/phase-11/screenshots/.gitkeep` は完了条件で削除を確認する） |

## 2. 事前準備

```bash
# worktree 直後の esbuild darwin mismatch 予防（FB-MSO-002）
mise exec -- pnpm install
```

## 3. 再現コマンド検証表（監査主張の再現）

> 監査主張（filter 検索 / cursor paging / PII masking / 400 分岐 / JST 変換）を、GUI 操作ではなく既存テストの再現コマンド実行で確認する。各行の「実結果」は実行後に転記する。

| # | 監査主張 | 再現コマンド | 前提条件 | 期待結果 | 実結果（実行後） |
|---|---------|-------------|---------|---------|-----------------|
| R-1 | filter 検索（7 項目が defaultValue 反映・GET submit で URL 同期 / FR-1） | `mise exec -- pnpm --filter @ubm-hyogo/web test` | `pnpm install` 済み | `AuditLogPanel.component.spec.tsx` の filter form ケースが PASS（action/actorEmail/targetType/targetId/from/to/limit 復元・`action="/admin/audit"` GET） | （実測） |
| R-2 | cursor paging（`buildAuditHref` が filter 保持で cursor 付与・`nextCursor=null` で「次のページはありません」/ FR-2） | `mise exec -- pnpm --filter @ubm-hyogo/web test` ＋ `mise exec -- pnpm --filter @ubm-hyogo/api test` | 同上 | UI: `buildAuditHref` / nextCursor=null 描画ケース PASS。API: `listFiltered({limit:limit+1})` で nextCursor 判定ケース PASS | （実測） |
| R-3 | PII masking（`maskAuditJson` が key/value 両パターンで再帰マスク・raw PII を可視 DOM に出さない / FR-3） | `mise exec -- pnpm --filter @ubm-hyogo/web test` ＋ `mise exec -- pnpm --filter @ubm-hyogo/api test` | 同上 | UI: `maskAuditJson`/`maskAuditText` マスクケース PASS。API: `redactAuditPayload`/`redactString` 二段防御ケース PASS | （実測） |
| R-4 | 400 分岐（不正 email / limit 範囲外 / 不正 cursor / 不正 date range / from>=to を 400 / FR-4） | `mise exec -- pnpm --filter @ubm-hyogo/api test` | 同上 | `audit.contract.spec.ts` の各 400 ケース PASS・正常時 `AdminAuditListResponseZ` 準拠ケース PASS | （実測） |
| R-5 | JST 変換（`jstLocalToUtcIso`/`jstInputToUtcIso` が datetime-local→UTC ISO・from=start/to=end-exclusive / FR-5） | `mise exec -- pnpm --filter @ubm-hyogo/web test` ＋ `mise exec -- pnpm --filter @ubm-hyogo/api test` | 同上 | UI: `jstLocalToUtcIso` 変換ケース PASS。API: `jstInputToUtcIso(from,false)`=start・`(to,true)`=end-exclusive ケース PASS | （実測） |

## 4. コード変更ゼロ・不変条件の再現確認

```bash
# コード変更ゼロ（NFR-5 / AC-4）
git status --short -- apps packages    # 空であること
git diff -- apps packages              # 空であること
git status --short                     # workflow docs + aiworkflow sync のみ

# 品質ゲート（AC-3）
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

| 確認項目 | コマンド | 期待結果 | 実結果（実行後） |
|---------|---------|---------|-----------------|
| `apps/` / `packages/` 差分ゼロ | `git status --short -- apps packages` + `git diff -- apps packages` | 出力空 | PASS（`outputs/phase-11/evidence/apps-diff-zero.log`） |
| 差分範囲 | `git status --short` | workflow docs + `.claude/skills/aiworkflow-requirements/` 同期のみ | PASS（`outputs/phase-11/evidence/changed-files.log`） |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 | （実測） |
| lint | `mise exec -- pnpm lint` | exit 0 | （実測） |

## 5. coverage map との突合（Phase 9 連携）

- §3 の R-1〜R-5 が全 PASS であれば、Phase 9 §1 の FR-1〜FR-6 coverage map が実 PASS で裏付けられる。
- ケース名差異・未カバーが見つかった場合は Phase 9 §2 の NR-N へ記録し、Phase 6（テスト追補）または Phase 12（scope boundary 再判定）へ差し戻す。
- 監査結論「✅ OK - 改善不要」が再現コマンド実行で再確認できれば、回帰保証の固定が完了する。

## 6. 完了条件（Phase 11 DoD）

- [ ] 冒頭に NON_VISUAL 宣言（タスク種別 / 非視覚的理由 / 代替証跡）を明記した。
- [ ] 固定フレーズ「UI/UX 変更なしのため Phase 11 スクリーンショット不要」を記載した。
- [ ] 証跡メタ情報（§1）に主ソース（web 423 行 + api 303 行）とスクリーンショットを作らない理由を明記した（Feedback4）。
- [ ] 再現コマンド検証表（§3）に filter 検索 / cursor paging / PII masking / 400 分岐 / JST 変換の R-1〜R-5 を前提・期待・実結果欄付きで作成した。
- [ ] コード変更ゼロ・不変条件の再現確認（§4）を記載した。
- [ ] Phase 11 実行時の正本出力先が `outputs/phase-11/manual-test-result.md` である旨を明記した。
- [ ] `outputs/phase-11/screenshots/.gitkeep` を作らない／既存があれば削除済みであることを確認した（screenshots ディレクトリ不要）。
