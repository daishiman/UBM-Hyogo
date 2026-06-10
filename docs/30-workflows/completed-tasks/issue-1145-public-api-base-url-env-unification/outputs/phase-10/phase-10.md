# Phase 10: 最終レビュー — AC 判定 / blocker

> **[実装区分: 実装仕様書]** NON_VISUAL

## 1. メタ情報

| 項目 | 内容 |
| ---- | ---- |
| Phase | 10（最終レビュー） |
| 入力 | Phase 1-9 全成果物 + 実装結果 |
| 出力 | 本 `phase-10.md`（AC-1〜AC-9 判定 / blocker 判定 / MINOR 記録） |
| 段階 | implemented_local_evidence_captured（判定手順仕様。判定列は実装後に確定） |

## 2. AC 判定テーブル（AC-1〜AC-9 を 1 件ずつ判定）

各 AC の判定根拠（検証コマンド / 証跡）を明示する。判定列は **implemented_local_evidence_captured 時点では「PASS」** とし、本サイクル本サイクルで PASS を記録済み。

| AC | 内容 | 判定根拠（検証手段） | 判定 |
| -- | ---- | -------------------- | ---- |
| AC-1 | env.ts の旧キー schema 行 / 型フィールド（PublicFetchEnv・ApiBaseEnv）/ getPublicFetchEnv fallback 削除 | `grep -n 'PUBLIC_API_BASE_URL' apps/web/src/lib/env.ts \| grep -v NEXT_PUBLIC_` = 0 行 | PASS |
| AC-2 | getApiBaseEnv() 関数 + ApiBaseEnv 型削除（consumer 0 件確認後）/ env.spec 対応テスト削除 | `grep -rn 'getApiBaseEnv\|ApiBaseEnv' apps/` = 0 件（Phase 9 QG-2） | PASS |
| AC-3 | public.ts の getBaseUrl()/getServiceBinding() の `?? env.PUBLIC_API_BASE_URL` 削除 + コメント更新 | `grep -n 'PUBLIC_API_BASE_URL' apps/web/src/lib/fetch/public.ts \| grep -v NEXT_PUBLIC_` = 0 行 | PASS |
| AC-4 | apps/web の wrangler.toml(3) / .dev.vars.example(1) / playwright.config.ts(1) / playwright.admin-schema-diff.config.ts(1) の旧キー削除 | 各ファイル `grep -v NEXT_PUBLIC_` = 0 行 | PASS |
| AC-5 | apps/og の member-source.ts（OgEnv + fetchViaBaseUrl）/ wrangler.toml(3) を NEXT_PUBLIC_API_BASE_URL へ rename | `grep -rn 'PUBLIC_API_BASE_URL' apps/og/ \| grep -v NEXT_PUBLIC_` = 0 行 かつ `grep -rn 'NEXT_PUBLIC_API_BASE_URL' apps/og/` > 0（rename 成立） | PASS |
| AC-6 | spec 群 11 ファイルの seed/assert/テスト名を NEXT_PUBLIC_ へ移行・各テストの意図（transport 選択 / fallback 経路）保持 | Phase 9 QG-6〜11 targeted vitest 全 green + テスト名 grep で旧キー 0 | PASS |
| AC-7 | `grep -rn 'PUBLIC_API_BASE_URL' apps/ \| grep -v NEXT_PUBLIC_` = 0 件（repo 全体） | Phase 9 QG-1（主 gate） | PASS |
| AC-8 | web/og typecheck・web lint・targeted vitest 全 green / base URL 解決挙動回帰なし | Phase 9 QG-3〜11 | PASS |
| AC-9 | 親不変条件遵守（API surface のみ・D1 直接なし・process.env 直接参照増やさない・OKLch 不変） | Phase 9 §5 4 項目 | PASS |

## 3. blocker 判定基準

以下のいずれかが成立した場合 **blocker（実装やり直し）**:

- AC-7 が 0 件にならない（旧キー残存 = 単一化未達。タスクの根本目的が未達成）。
- AC-2 が 0 件にならない（getApiBaseEnv / ApiBaseEnv 残存 = 削除不完全）。
- AC-8 の typecheck / lint が exit 非 0（型結合破壊 = 削除順序ミス）。
- targeted vitest に red がある（base URL 解決 / transport 選択の挙動回帰）。
- AC-9 のいずれか違反（親不変条件破り）。

上記が **すべて非該当** のとき blocker なし → Gate-B（implementation_review）通過候補。

### blocker 判定結果（PASS）

| 項目 | 状態 |
| ---- | ---- |
| AC-7 = 0 件 | PASS |
| AC-2 = 0 件 | PASS |
| typecheck / lint exit 0 | PASS |
| targeted vitest red 0 | PASS |
| AC-9 違反 0 | PASS |
| **総合 blocker 判定** | PASS（blocker なし / あり） |

## 4. MINOR 指摘の記録（未タスク化候補）

実装後レビューで blocker 未満の改善余地が見つかった場合、ここに MINOR として記録し、本タスクのスコープには含めず **未タスク化候補（detection / unassigned-task）** とする。implemented_local_evidence_captured 時点で予見される候補:

| ID | 指摘候補 | 重大度 | 扱い |
| -- | -------- | ------ | ---- |
| MINOR-1 | `apps/og` の `NEXT_PUBLIC_` 接頭辞は非 Next.js Worker では意味的に違和（D-4 で許容済） | 情報 | 未タスク化しない（ユーザー判断で許容済・命名一貫性優先） |
| MINOR-2 | 他 env キー（`INTERNAL_API_BASE_URL` / `AUTH_URL`）にも将来 2 命名併存が起きうる | 低 | 本タスクスコープ外。実装後に再発があれば detection で未タスク化候補に回す |
| MINOR-3 | wrangler vars 変更は再 deploy が必要（staging / production 反映） | 情報 | Phase 13 = user-gated（deploy）で扱う。blocker ではない |

> 実装後に新規 MINOR が出た場合は本表に追記し、未タスク化は close-task / detection フローへ委譲する（本仕様書では起票しない）。

## 5. 完了条件（PASS）

- [x] AC-1〜AC-9 を 1 件ずつ判定（全 PASS）
- [x] blocker 判定（blocker なし）
- [x] MINOR 指摘を記録（未タスク化候補として整理）

> 2026-06-08 本サイクル実装後に実測 PASS。上記チェックは完了済み。

## 6. 参照資料

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| AC 正本 | 本 workflow `index.md` §4 | AC-1〜AC-9 |
| 品質ゲート | 本 workflow `outputs/phase-9/phase-9.md` | QG-1〜11 / 親不変条件確認 |
| 設計判断 D-4 | 本 workflow `index.md` §3 | apps/og rename semantics 許容 |
| env アクセス不変条件 | `CLAUDE.md`「apps/web env アクセス不変条件（task-02 wrangler-env-injection）」 | accessor 経由のみ / `process.env.*` 直接禁止 |
