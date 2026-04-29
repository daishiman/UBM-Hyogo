# task-skill-ledger-t6-plan-c-static-research — 案 C（hook 廃止 + 完全静的化）の影響範囲調査

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | task-skill-ledger-t6-plan-c-static-research |
| 作成日 | 2026-04-29 |
| 起点 | docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md (U-3) |
| 種別 | research / docs-only / NON_VISUAL |
| 優先度 | LOW |
| 状態 | unassigned |
| GitHub Issue | 未起票（本タスクで起票予定） |

## 背景

T-6 では base case D（hook を冪等化して残す）を採用したが、運用ノイズ（hook 起因の競合・部分書込み）が再発した場合に備え、案 C（hook を廃止し `pnpm indexes:rebuild` を CI / 手動運用に一本化）を将来オプションとして整理する必要がある。Phase 3 の代替案評価では深掘りされず、影響範囲が未確定のまま留まっている。

## スコープ

### 含む

- 案 C を採用した場合に変更となる箇所の洗い出し（`lefthook.yml` / `package.json` scripts / CI workflow / runbook）
- 採用した場合の作業量見積もり（M / L のレンジ）
- 廃止後に置換される手動 / CI トリガーの設計案
- 採用判定に必要な計測指標（hook 起因 incident 件数 / 月など）

### 含まない

- 案 C の実装そのもの
- hook 配信・lefthook の置換ツール選定
- A-1 / A-2 / B-1 の再設計

## 受入条件

- AC-1: 廃止対象 hook と置換コマンドの対応表が作成されている。
- AC-2: 採用判定指標と閾値案がドキュメント化されている。
- AC-3: `references/skill-ledger-gitignore-policy.md` にリンクして比較表が引ける。
- AC-4: 調査レポートを `docs/30-workflows/unassigned-task/` 配下または `references/` に配置する位置決めが終わっている。

## 苦戦箇所（記入予定枠）

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 調査着手時に記入 |
| 原因 | 調査着手時に記入 |
| 対応 | 調査着手時に記入 |
| 再発防止 | 調査着手時に記入 |

## 参照

- `docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-03.md`
- `docs/30-workflows/skill-ledger-t6-hook-idempotency/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/aiworkflow-requirements/references/skill-ledger-gitignore-policy.md`
