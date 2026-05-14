# Phase 3 — 設計レビュー

## 判定

**PASS** — Phase 4 へ進む。

## チェック項目

| 項目 | 結果 |
|------|------|
| SSOT（task-08）に影響を与えない設計か | ✅ Yes |
| bridge（task-09 @theme inline）に影響を与えない設計か | ✅ Yes |
| consumer のみの変更で完結するか | ✅ Yes |
| 命名齟齬（fg-muted）の解消方針が明確か | ✅ `text-text-3` 統合 |
| visual regression 0 を保証する手段があるか | ✅ task-18 baseline |
| grep gate で再発防止できるか | ✅ task-18 verify-design-tokens |
| 副次対象（global-error/not-found/loading）の扱いが明確か | ✅ Phase 5 で grep 確認 |
| 命名一貫性（既存 utility との整合）| ✅ `text-<bridge>` / `bg-<bridge>` 形式に統一 |

## MINOR 指摘

なし。

## 未タスク候補（Phase 12 で formalize）

- `apps/web/src/features/admin/**` の同種 arbitrary value（grep で 30+ 箇所）→ 別 task（horizontal migration）
- `apps/web/src/features/admin/components/_dashboard/KpiCard.tsx` の `STATUS_TEXT_CLASS` 色マップ object → utility 化候補
- task-08 SSOT に `--ubm-color-fg-muted` を alias として追加するかの議論（不要との結論で良いが議論ログを残す）
