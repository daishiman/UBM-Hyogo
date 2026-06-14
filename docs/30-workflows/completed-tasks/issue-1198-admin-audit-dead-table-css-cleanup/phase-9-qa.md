# Phase 9: 品質保証 — issue-1198 admin-audit dead table CSS cleanup

dead CSS 3 ブロック削除（純減）の品質を機械検証で担保する。本サイクルで実装し、機械検証で品質を確認した。

## 1. 削除確認の PASS 基準（[FB-UI-02-1]）

| 観点 | PASS 基準 |
| --- | --- |
| 旧セレクタの消失 | `.admin-audit-filter` / `.admin-audit-table-scroll` / `.admin-audit-table` が `globals.css` で **grep 0 件**（git delete 相当の純減＝定義の完全消失） |
| 差分の性質 | `git diff` が **削除行のみ**・追加 0 行（純減）。3 ブロック以外への波及なし |
| 参照ゼロの証跡 | 削除前に 3 セレクタの `.tsx`/`.ts` 参照が 0 件であることを grep 証跡化（AC-1） |

> PASS の核心は「純減（delete only）」であること。追加行が 1 行でも混入したら FAIL とし、原因を切り分ける。

## 2. line budget / link / mirror parity の観点

| 観点 | 基準 | 確認手段 |
| --- | --- | --- |
| line budget | `globals.css` は **純減のみ**（≒17 行減・追加 0）。他ファイルの行数変動なし | `git diff --stat apps/web/src/styles/globals.css`（`+0` を確認） |
| link | 削除対象は CSS クラス定義のみ。doc / index のリンク切れは発生しない（参照リンク変更なし） | index.md / shared-context.md の参照リンク無変更を確認 |
| mirror parity | `.agents/skills` ↔ `.claude/skills` の skill mirror は本タスクで未変更（CSS のみ）。parity 維持 | mirror 差分が空であることを確認（CSS 変更は mirror 非対象） |

## 3. 検証コマンドの実行計画と期待値（shared-context §4 正本）

| 順 | AC | コマンド | 期待値 |
| --- | --- | --- | --- |
| 1 | AC-1 | `grep -rn "admin-audit-filter\|admin-audit-table" apps/web/src apps/web/app --include="*.tsx" --include="*.ts"` | **0 行**（コンポーネント参照ゼロ・削除前証跡） |
| 2 | AC-2 | `grep -n "admin-audit-filter\|admin-audit-table-scroll\|admin-audit-table" apps/web/src/styles/globals.css` | **0 件**（削除後・定義消失） |
| 3 | AC-2/3 | `grep -n "admin-audit-guide\|admin-audit-card\|admin-audit-timeline\|admin-audit-applied-filters" apps/web/src/styles/globals.css` | **ヒット維持**（カード系保持） |
| 4 | AC-3 | `rg -n "\.tbl\b|tbl" apps/web/src/styles/globals.css apps/web/src apps/web/app --glob "*.{css,tsx,ts}"` | **0 件維持**（現行ベースライン。`.tbl` 前提は stale） |
| 5 | AC-4 | `mise exec -- pnpm typecheck` | PASS（CSS 削除は型無影響） |
| 6 | AC-4 | `mise exec -- pnpm lint` | PASS |
| 7 | AC-4 | `mise exec -- pnpm verify:tokens` | in sync / HEX **0 違反** |
| 8 | AC-5 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx` | 全 PASS（dead CSS 非依存・回帰なし） |
| 9 | AC-6 | `git diff --stat apps/web/src/styles/globals.css` | 削除行のみ・追加 0・他ファイル非変更 |

## 4. 既知の偽陽性（grep 解釈の注意）

| ヒット | 解釈 | 扱い |
| --- | --- | --- |
| `apps/web/playwright/tests/admin-schema-conflicts-audit.spec.ts` の `name: 'admin-audit-filtered.png'` | Playwright **スクリーンショット出力ファイル名**であり CSS クラス参照ではない | AC-1 では `.tsx`/`.ts` 対象だが playwright は別ディレクトリ。参照判定に含めない（[shared-context.md](shared-context.md) §2） |
| `globals.css` 自身の定義行 | CSS **定義**であって「参照」ではない | AC-1 の `--include` で `.css` を除外しているため非対象 |

## 5. QA 判定方針

- 上記 9 検証がすべて期待値を満たせば PASS。
- いずれか FAIL の場合は削除範囲の逸脱（`.admin-audit-guide` 巻き込み / `.tbl` 誤削除 / 追加行混入）を疑い、[shared-context.md](shared-context.md) §7 リスク表の対策に従って切り分ける。
- local実装時点で実行済み。commit / PR は user-gated。

## 完了条件

- [ ] 削除確認 PASS 基準（grep 0 件＝純減）を明記（[FB-UI-02-1]）
- [ ] line budget（純減のみ）/ link / mirror parity の観点を記載
- [ ] 検証コマンド 9 件の実行計画と期待値を表で確定（shared-context §4 と一致）
- [ ] grep 偽陽性（Playwright スクショ名 / CSS 定義行）の扱いを明記
- [ ] local実装時点で実行済み・commit / PR は user-gated である旨を記録
