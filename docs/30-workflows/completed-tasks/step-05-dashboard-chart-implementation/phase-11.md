# Phase 11: Evidence 収集 / 実行ログ / VISUAL evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| 区分 | 検証実行 |
| visualEvidence | VISUAL_ON_EXECUTION |
| 想定所要 | 0.5 人日 |

## 目的

Phase 5 実装の動作証跡を canonical evidence path に収集する。VISUAL タスクのため screenshot を必須とし、加えて non-visual evidence（typecheck / lint / test / build / grep-gate ログ）も canonical 5 点を取得する。

## 4. Phase 11 evidence file inventory

`docs/30-workflows/step-05-dashboard-chart-implementation/outputs/phase-11/` 配下に下記を物理配置する。**status は `present` / `pending` / `n/a` のいずれか**（lowercase 必須）。

| # | Path | Status | 種別 | 取得手順 |
| --- | --- | --- | --- | --- |
| 1 | `outputs/phase-11/evidence/typecheck.log` | pending | text | mise exec -- pnpm typecheck 2>&1 | tee outputs/phase-11/evidence/typecheck.log |
| 2 | `outputs/phase-11/evidence/lint.log` | pending | text | mise exec -- pnpm lint 2>&1 | tee outputs/phase-11/evidence/lint.log |
| 3 | `outputs/phase-11/evidence/test.log` | pending | text | mise exec -- pnpm test apps/web --run -- StatusDistribution.spec.tsx 2>&1 | tee outputs/phase-11/evidence/test.log |
| 4 | `outputs/phase-11/evidence/build.log` | pending | text | mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee outputs/phase-11/evidence/build.log |
| 5 | `outputs/phase-11/evidence/grep-gate.log` | pending | text | HEX 直書き 0 件確認の grep 出力（下記コマンド） |
| 6 | `outputs/phase-11/screenshots/admin-dashboard-placeholder.png` | pending | image | `slices === undefined` 状態の admin dashboard screenshot |
| 7 | `outputs/phase-11/screenshots/admin-dashboard-chart.png` | pending | image | `slices` populated 状態の admin dashboard screenshot（手動 mock 経由 or visual snapshot から複製） |
| 8 | `outputs/phase-11/evidence/visual-diff-summary.txt` | pending | text | `pnpm e2e:visual --project=visual-chromium` の summary（snapshot 更新件数 / fail 件数） |
| 9 | `outputs/phase-11/evidence/a11y-aria-label.txt` | pending | text | DevTools / axe で `role="img"` + `aria-label` を確認した記録 |

すべての status を `present` にした後 Phase 12 へ進む。

## 5. grep-gate コマンド（#5 用）

```bash
{
  echo "=== HEX literal in StatusDistribution.tsx ===";
  grep -nE '#[0-9a-fA-F]{6}\b' apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx || echo "(no match)";
  echo "=== bg-[# / text-[# / fill=\"# in changed files ===";
  grep -nE 'bg-\[#|text-\[#|fill="#' apps/web/src/features/admin/components/_dashboard/StatusDistribution.tsx || echo "(no match)";
} 2>&1 | tee outputs/phase-11/evidence/grep-gate.log
```

期待出力: 両 grep ともに `(no match)`。

## 6. screenshot 取得手順

### admin-dashboard-placeholder.png

1. API が `byStatus` を返さない通常状態で `pnpm dev` 起動
2. admin アカウントでログイン → `/admin` 遷移
3. "公開ステータス" カードを含むビューポートで screenshot を撮影
4. `outputs/phase-11/screenshots/admin-dashboard-placeholder.png` に保存

### admin-dashboard-chart.png

1. Phase 6 の手動 mock 手順で `byStatus` 固定値を一時注入
2. dev server 再読み込み後 SVG bar chart 表示を screenshot
3. mock を **必ず revert**
4. `outputs/phase-11/screenshots/admin-dashboard-chart.png` に保存

> screenshot は `git add -f` で物理コミットする（`.gitignore` 対象外であることを確認）。

## 7. canonical evidence path 規約

`outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate}.log` を local PASS 5 点セットとして固定。screenshot は `outputs/phase-11/screenshots/` 配下。

## 実行タスク

- Phase 11: local evidence と VISUAL placeholder evidence を canonical path に保存する。

## 参照資料

- - `phase-05.md`
- - `phase-06.md`
- - `phase-07.md`

## 成果物

- - `outputs/phase-11/**` の evidence inventory を成果物にする。

## 統合テスト連携

- - focused Vitest、grep gate、screenshot placeholder inventory に接続する。

## 完了条件

- [ ] inventory 表の status が全件 `present` または `n/a`
- [ ] screenshot 2 件が物理配置されている
- [ ] grep-gate.log が "(no match)" で終わっている
- [ ] typecheck / lint / test / build の log が exit code 0 を示している
- [ ] mock 注入が revert されていることを `git status apps/web/src/lib/admin/` で確認

## 依存Phase trace

- Phase 1 / phase-01.md
- Phase 2 / phase-02.md
- Phase 5 / phase-05.md
- Phase 6 / phase-06.md
- Phase 7 / phase-07.md
- Phase 8 / phase-08.md
- Phase 9 / phase-09.md
- Phase 10 / phase-10.md
