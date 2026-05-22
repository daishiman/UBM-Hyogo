# Phase 1: 要件定義 — task-07 prototype-mapping-table

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-07-prototype-mapping-table |
| phase | 1 / 13 |
| wave | w2-par |
| mode | parallel |
| 作成日 | 2026-05-07 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

[実装区分: ドキュメントのみ]
判定根拠: 本タスクの成果物は `docs/00-getting-started-manual/specs/09a-prototype-map.md` の新規作成のみで、アプリケーションコード変更・schema 変更・依存追加を伴わない。CONST_004 の例外条件（純粋にドキュメントで完結）に該当するため docs-only として作成。

## 目的

task-07 の §0 自己完結コンテキスト・§2 ゴール/非ゴール・§0.5 不変条件・§0.6 上流シグネチャ・§0.7 下流シグネチャを取り込み、要件として確定する。`taskType: docs-only`、`visualEvidence: NON_VISUAL` を成立させる根拠を明文化する。

## 実行タスク

1. 上位ゴール（prototype 5 ファイル 2,026 行 → `09a-prototype-map.md` 1:1 mapping）を確定する。完了条件: ゴール 5 件と非ゴール 4 件が記録される。
2. 入力 / 出力（C: 1 ファイル新規、R: 7 ファイル参照）を確定する。完了条件: 変更対象表が記録される。
3. 不変条件 6 項目を取り込む。完了条件: 凍結正本 / 新規 primitive 禁止 / 不採用記述が明記される。
4. 上流シグネチャ（19 routes / 派生ルール 8 パターン / component 開始行）と下流シグネチャ（§3 列名固定・§2 列名固定・§6 列名固定）を確定する。完了条件: 列名 grep キーが記録される。

## 参照資料

- docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-07-w2-par-prototype-mapping-table.md（§0, §2, §3）
- docs/00-getting-started-manual/claude-design-prototype/app.jsx (251 行)
- docs/00-getting-started-manual/claude-design-prototype/primitives.jsx (272 行)
- docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx (472 行)
- docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx (373 行)
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx (658 行)
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md §3

## 依存 Phase 成果物参照

- Phase 1: `phase-01.md`, `outputs/phase-01/main.md`

## 実行手順

- 対象 directory: `docs/30-workflows/task-07-prototype-mapping-table/`
- 本仕様書作成ではアプリケーションコード、commit、push、PR 作成を行わない。
- mapping 表作成は Phase 5 の実装計画に従い、検証は Phase 8 のスクリプトで実施。

## 多角的チェック観点

- prototype は凍結正本として扱い、本タスクで改変しない（不変条件 #1）
- 新規 primitive を生やさない（不変条件 #2）
- token 値・props/state は本タスク非責務（#4, #5）
- 行範囲は `L<start>-L<end>` 形式で grep 一意検索可能（#6）

## サブタスク管理

- [ ] task-07 §0 を読み、自己完結コンテキストを記録
- [ ] §2 ゴール / 非ゴールを記録
- [ ] §3 変更対象ファイル表（C/R）を記録
- [ ] §0.7 下流シグネチャ（列名 3 種）を記録
- [ ] outputs/phase-01/main.md に上記を集約

## 成果物

- outputs/phase-01/main.md

## 完了条件

- [ ] taskType: docs-only / visualEvidence: NON_VISUAL の根拠が明記される
- [ ] ゴール 5 件 / 非ゴール 4 件が記録される
- [ ] 不変条件 6 項目が記録される
- [ ] 列名 3 種（§2 / §3 / §6）が grep キーとして記録される
- [ ] 19 routes と 派生ルール 8 パターンが受信シグネチャとして記録される

## 次 Phase への引き渡し

Phase 2 へ、確定した要件・列名・19 routes・派生ルール 8 パターンを設計入力として渡す。
