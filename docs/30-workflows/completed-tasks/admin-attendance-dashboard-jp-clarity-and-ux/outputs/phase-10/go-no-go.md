# Phase 10 — GO / NO-GO 判定

> ステータス: `spec_created`。source-level GO 判定基準を固定する。VISUAL screenshot 6 PNG は `pending_visual_capture`（user-gated）。

---

## 1. GO 条件（全充足で Phase 11 へ進行）

以下 5 ブロックすべてが充足したときのみ GO とする。1 つでも未充足なら NO-GO。

### ブロック A: 4 条件（価値性 / 実現性 / 整合性 / 運用性）

| 条件 | GO 基準 | 判定手段 |
| --- | --- | --- |
| 価値性 | 英語表記・専門語 → 平易日本語で、非エンジニアの会員・管理者が「何の数字か・どう読むか」を迷わず把握できる | AC-1〜AC-3 + Phase 11 visual |
| 実現性 | 既存 12 ファイルの文字列置換 + 軽微 CSS + テスト追従で 1 サイクル完了（新規 component/primitive/endpoint なし） | AC-6 / AC-7 / 実装 diff |
| 整合性 | 責務が apps/web 表現層に閉じ、DOM contract（testid/role/aria キー）と契約（formatDelta/PRESETS/ZONE_HELP）を保持 | AC-7 / AC-8 / change-map |
| 運用性 | `verify-design-tokens` + focused vitest（追従 + 回帰）+ 残存 grep + （必要時）Playwright で回帰保護が成立 | AC-5 / AC-9 / Phase 9 |

### ブロック B: AC 全充足

| 基準 | GO 条件 |
| --- | --- |
| AC-1〜AC-10 | 全 10 件が `outputs/phase-10/main.md` の確認手段で充足。未充足 0 件 |

### ブロック C: token gate PASS

| 基準 | GO 条件 |
| --- | --- |
| `verify-design-tokens`（AC-5） | attendance 配下で HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が **0 件**・新規 token 0。1 件でも検出で NO-GO |

検証コマンド（token-audit §1）:
```bash
bash -lc 'grep -rnE "#[0-9a-fA-F]{3,6}|bg-\[#|text-\[#" apps/web/src/features/admin/attendance && echo "FAIL" || echo "PASS"'
mise exec -- pnpm verify:tokens
```

### ブロック D: 英語・専門語残存ゼロ（本タスク中核ゲート）

| 基準 | GO 条件 |
| --- | --- |
| AC-1/AC-2/AC-3 | 画面表示・aria-label に `PRIMARY`/`TREND`/`DETAIL`/`TOP10`/`ADMIN / DASHBOARD`/`3M`/`6M`/`1Y`/`CSV`/`セッション`/`ユニーク`/`トレンド`/`区画`/`出席回数帯` が **0 件**。定数キー由来のヒットは許容 |

検証コマンド（token-audit §4）:
```bash
bash -lc 'grep -rnE "PRIMARY|TREND|DETAIL|TOP ?10|ADMIN / DASHBOARD|3M|6M|1Y|CSVエクスポート|セッション|ユニーク|トレンド|区画|出席回数帯" apps/web/src/features/admin/attendance apps/web/app/\(admin\)/admin/dashboard/attendance && echo "FAIL" || echo "PASS"'
```

### ブロック E: 既存機能温存

| 基準 | GO 条件 |
| --- | --- |
| AC-10 | フィルタ（期間プリセット / 累計出席回数チェック）・表計算ファイル書き出し（旧 CSV・URL/ダウンロード挙動不変）・ドリルダウン modal・各テーブル内容・要フォロー details 展開・SafeResult 単位 degrade がすべて挙動不変。回帰 0 件 |

---

## 2. NO-GO 条件と戻り先

| NO-GO トリガ | 戻り先 Phase |
| --- | --- |
| ブロック A の整合性 / 実現性が崩れる（API/D1/shared 型に diff 発生 = AC-7 違反） | Phase 2（設計）または Phase 5（実装） |
| AC-1〜AC-10 のいずれか未充足 | 該当 AC の検証 Phase（機能=Phase 5 / テスト=Phase 6 / token=Phase 9） |
| token gate FAIL（HEX 検出 / 新規 token） | Phase 9（品質保証）→ Phase 5/8 |
| 英語・専門語残存 grep でヒット（画面表示） | Phase 5（実装）または Phase 8（残骸除去） |
| 既存機能の回帰検出 | Phase 5（実装）または Phase 6（テスト拡充） |

---

## 3. Phase 11 進行条件

| # | 条件 |
| --- | --- |
| 1 | ブロック A〜E がすべて GO |
| 2 | AC-1〜AC-4 が Phase 11 の 6 canonical screenshot 名にマップ済み（`outputs/phase-10/main.md` §1） |
| 3 | MINOR M-1〜M-4 が非 blocker として記録済み（M-4/M-3 完全置換は unassigned 化候補として申し送り済み） |

---

## 4. Phase 13 blocked 条件（厳守）

| # | 条件 |
| --- | --- |
| 1 | GO 判定が出ても **commit / PR / push はユーザーの明示承認後のみ実行**する。 |
| 2 | 承認がない限り Phase 13 は **blocked** のまま維持する。 |
| 3 | 実装 diff とローカル検証結果は存在する。staging capture・PR は user-gated。PNG 未取得時は PR 本文の screenshot セクションを pending と明記する。 |

> 本タスクは relatedIssue=null（staging 観察起点）。base ブランチは `dev`。production リリースを伴わないため `--base main` は使用しない。
