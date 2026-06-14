# Phase 13: PR作成 — issue-1198 admin-audit dead table CSS cleanup

> **ステータス: blocked（user-gated / Gate-C pending）**
> commit / push / PR 作成は **user の明示承認後のみ**実行する（CONST_002）。local 実装と検証は完了済みで、以下は承認後にそのまま使える PR 雛形である。

## 1. CLOSED issue 取り扱い（最重要・reopen 禁止）

| 項目 | 値 |
| --- | --- |
| GitHub Issue | [#1198](https://github.com/daishiman/UBM-Hyogo/issues/1198)（**CLOSED のまま維持**） |
| PR 本文の issue 参照 | **`Refs #1198` のみ**（`Closes #1198` / `Fixes #1198` は **禁止**＝マージで reopen を誘発しない） |
| reopen | **しない**（closed issue canonical workflow recovery 方針） |

> ⚠️ `Closes`/`Fixes`/`Resolves` 系キーワードは GitHub が自動で issue を reopen→close 操作に巻き込むため、CLOSED issue では使用しない。必ず `Refs #1198` 表記に限定する。

## 2. ブランチ / base

| 項目 | 値 |
| --- | --- |
| 想定ブランチ | `docs/issue-1198-admin-audit-dead-table-css-cleanup` |
| base | `dev` |
| 作成コマンド（承認後） | `gh pr create --base dev` |

> 実装区分は実装仕様書だが diff は CSS 削除（純減）のみで極小。ブランチ prefix は workflow 既定の `docs/` を踏襲する（CSS dead code cleanup・機能追加なし）。

## 3. PR 本文ドラフト（雛形・承認後に確定）

```markdown
## 変更概要

`/admin/audit` のカード型タイムライン化（#1202）で未参照化した旧テーブル系 dead CSS 3 ブロックを `apps/web/src/styles/globals.css` から削除する。削除のみ（純減 ≒17 行・追加 0）で、描画は不変（NON_VISUAL：削除対象 CSS は未適用）。

Refs #1198

### 削除セレクタ（3 ブロック）

| 対象 | Before | After |
| --- | --- | --- |
| `.admin-audit-filter` | 残置（0 参照） | 削除済み（→ `.admin-audit-applied-filters` へ移行済み） |
| `.admin-audit-table-scroll` | 残置（0 参照） | 削除済み |
| `.admin-audit-table` | 残置（0 参照） | 削除済み（→ `.admin-audit-card` / `.admin-audit-timeline` へ移行済み） |

## AC チェック

- [ ] AC-1: 削除前に 3 セレクタの `.tsx`/`.ts` 参照 0 件を grep 証跡化
- [ ] AC-2: `globals.css` から 3 ブロック削除（`.admin-audit-guide` 以降は保持）
- [ ] AC-3: `.tbl` と新規カード系 CSS は無変更
- [ ] AC-4: typecheck / lint / verify:tokens すべて PASS（HEX 0 違反）
- [ ] AC-5: 監査ログ focused Vitest（AuditLogPanel.component / AuditLogCard）回帰なし全 PASS
- [ ] AC-6: diff は `globals.css` の純減のみ・apps/api / D1 / Form 無変更

## 検証結果

| 検証 | コマンド | 結果 |
| --- | --- | --- |
| 削除前参照ゼロ | `grep -rn "admin-audit-filter\|admin-audit-table" apps/web/src apps/web/app --include="*.tsx" --include="*.ts"` | （承認後に記入：0 行） |
| 旧セレクタ消失 | `grep -n "admin-audit-filter\|admin-audit-table-scroll\|admin-audit-table" apps/web/src/styles/globals.css` | （承認後に記入：0 件） |
| カード系保持 | `grep -n "admin-audit-guide\|admin-audit-card\|admin-audit-timeline\|admin-audit-applied-filters" apps/web/src/styles/globals.css` | （承認後に記入：ヒット維持） |
| typecheck | `mise exec -- pnpm typecheck` | （承認後に記入） |
| lint | `mise exec -- pnpm lint` | （承認後に記入） |
| tokens | `mise exec -- pnpm verify:tokens` | （承認後に記入：in sync） |
| focused Vitest | `vitest run ... AuditLogPanel.component AuditLogCard` | （承認後に記入：全 PASS） |
| diff stat | `git diff --stat apps/web/src/styles/globals.css` | （承認後に記入：純減） |

## スコープ外（別 Issue 候補）

- OOS-1: 監査ログ total 件数表示（apps/api 変更が必要・別 Issue）
- OOS-2: 監査ログ CSV/JSON エクスポート（新規 endpoint が必要・別 Issue）

## スクリーンショット

NON_VISUAL（削除対象 CSS は未適用＝描画は 1px も変わらないため不要）。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 4. 承認後の実行手順（CONST_002 ゲート通過後）

1. ブランチ `docs/issue-1198-admin-audit-dead-table-css-cleanup` を確認（または作成）。
2. Phase 9 の検証 9 件を実行し PASS を確認、PR 本文の検証結果欄を実値で埋める。
3. `git add apps/web/src/styles/globals.css`（+ Phase 12 で consumed 化した unassigned-task / workflow docs）。
4. commit メッセージ末尾に `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` を付与。
5. `gh pr create --base dev`（本文は §3 ドラフト・`Refs #1198` のみ）。

> commit メッセージ本文でも `Closes`/`Fixes` を使わない（`Refs #1198` のみ）。

## 5. 完了条件

- [ ] commit / PR は user 明示承認後のみ実行（CONST_002）を明記
- [ ] CLOSED issue のため PR 本文は `Refs #1198` のみ（`Closes #1198` 禁止・reopen しない）を明記
- [ ] 想定ブランチ `docs/issue-1198-admin-audit-dead-table-css-cleanup` / base `dev` を確定
- [ ] PR 本文ドラフト（変更概要 / AC チェック / 検証結果欄 / OOS-1・OOS-2）を雛形化
- [ ] local 実装・検証は完了済み。commit / push / PR は **user 承認待ち（Gate-C pending）**
