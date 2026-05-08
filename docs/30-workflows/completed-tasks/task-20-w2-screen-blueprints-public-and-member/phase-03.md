# Phase 03 — 設計レビュー

実装区分: ドキュメントのみ仕様書（CONST_004 例外適用 — 純粋に markdown 2 件作成のみ）

## 0. 入力（phase-02 から引き継ぎ）

- 09e / 09f 章立て fixed schema
- 8 画面 prototype 行範囲 mapping
- mermaid template
- 9 series link format
- 変更対象ファイル表（C 2 件）

## 1. 代替案比較

### 案 A: 1 ファイル統合（09e 単独で公開 6 + 会員 2 を全部包含）

| 観点 | 評価 |
|------|------|
| 行数 | 900〜1,600 行（grep / lint で重い） |
| 並列性 | task-13 / task-14 が同一ファイルを編集すると衝突 |
| 後続実装の参照容易性 | NG（公開画面実装中に会員画面の §が混入） |
| 結論 | 不採用 |

### 案 B: 画面ごと分離（09e-1, 09e-2, ..., 09f-1, 09f-2 の 8 ファイル）

| 観点 | 評価 |
|------|------|
| 行数 | 各 100〜200 行と軽量 |
| 並列性 | 完全独立（ただし管理コスト増） |
| 9 series 番号体系 | 09e-N / 09f-N の 2 階層命名でファイル数膨張 |
| 後続 task-06 (09-ui-ux.md) の link 戦略 | 8 link 必要、リファクタコスト |
| 結論 | 不採用（粒度過剰） |

### 案 C: 公開・会員分離（09e + 09f の 2 ファイル）— **採用**

| 観点 | 評価 |
|------|------|
| 行数 | 完全 blueprint を優先し、行数は evidence inventory とする |
| 並列性 | task-11/12（公開） vs task-13/14（会員）で読み分けが natural |
| 9 series 番号体系 | 既存 09a/09b/09c/09d と一貫した 1 ファイル 1 文字命名 |
| 後続 task-06 link 戦略 | 2 link で十分 |
| 結論 | **採用**（元タスク §0.7 で既に C 案が指定済み） |

## 2. 採用案の前提リスクと緩和策

| リスク | 緩和策 |
|--------|--------|
| 画面漏れ（公開 6 + 会員 2 = 8） | phase-1 §3 の checklist で全件確認、Phase 7 AC マトリクスで AC-3 / AC-4 として grep 検証 |
| コピー原文ドリフト | `grep -F` でランダム文字列を pre-commit 検証（Phase 4 §6.4） |
| API 表ドリフト | 現行 API 正本 trace check（Phase 4） |
| 未掲載画面の独自 primitive 生成 | 09c primitive 組合せ限定の制約を 09e §冒頭で明記（AC-8） |
| 視覚値（HEX / oklch / px）混入 | 4 種 grep gate（Phase 4 §6.2） |
| login 5+1 状態欠落 | 09f §1.3 で `input/sent/unregistered/deleted/rules_declined/error` を grep（AC-6） |
| profile 4 領域欠落 | 09f §2 で `banner/summary/request/delete` を grep（AC-7） |
| mermaid 構文エラー | `^```mermaid$` block count + visual lint（Phase 9） |

## 3. 並列タスクとの調整（task-06 / 07 / 08 / 19 / 21 / 22）

### 3.1 編集競合マトリクス

| ファイル | 本タスク | task-06 | task-07 | task-08 | task-19 | task-21 | task-22 |
|---------|---------|---------|---------|---------|---------|---------|---------|
| `09e-screen-blueprints-public.md` | C（新規・owner） | — | — | — | — | — | — |
| `09f-screen-blueprints-member.md` | C（新規・owner） | — | — | — | — | — | — |
| `09-ui-ux.md` | R（link 先） | C（owner） | — | — | — | — | — |
| `09a-prototype-map.md` | R（link 先） | — | C（owner） | — | — | — | — |
| `09b-design-tokens.md` | R（link 先） | — | — | C（owner） | — | — | — |
| `09c-primitives.md` | R（link 先） | — | — | — | C（owner） | — | — |
| `09d-icons.md` | R（link 先） | — | — | — | — | — | C（owner） |
| `09g-screen-blueprints-admin.md` | — | — | — | — | — | C（owner） | — |
| `09h-shell-and-fixtures.md` | — | — | — | — | — | — | C（owner） |

衝突なし（本タスク owner ファイルは 09e / 09f のみ、他タスクは触らない）。

### 3.2 §番号 collision 対策

09b / 09c / 09d / 09a の §番号は並列タスクが本タスクと同時に確定するため、本タスク執筆時点で **§番号未確定の場合は placeholder（`09b §TBD`）で記述し、Phase 9 link check で全 placeholder の解決を確認**する。

placeholder 解決の責務分担:

- placeholder 起票: 本タスク（Phase 5 ランブック内）
- 解決値の供給: 各並列タスクの完了通知（merge 完了時の §番号確定値）
- 解決反映: 本タスク Phase 9 で軽微更新（PR 内 commit 追加 or 次サイクルの patch task）

### 3.3 並列実行ポリシー

本タスクは task-06 / 07 / 08 / 19 / 21 / 22 と完全並列実行可。同一ファイルへの編集は発生しないため、コミット粒度を分離して merge 順序の制約も持たない。

## 4. 設計レビュー結論

| 項目 | 結論 |
|------|------|
| 採用案 | **C 案（公開・会員分離 2 ファイル）** |
| 章立て | 09e: §1〜§6 + §99 / 09f: §1〜§2 + §99 |
| §X 共通 schema | X.1〜X.7 の 7 節 fixed |
| 視覚値 | 0 件 grep gate |
| API 表 | 現行 API 正本と一致 |
| 並列調整 | 競合なし、placeholder 戦略で §番号未確定を吸収 |

## 5. 次フェーズへの引き渡し

phase-04（テスト戦略）に渡す:

- 採用案 C（2 ファイル分離）の章立て確定
- リスク 8 項目と緩和策の対応 grep / count
- 並列タスクとの編集競合マトリクス（衝突 0）
- placeholder 戦略（§番号未確定吸収）
