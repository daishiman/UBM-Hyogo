# Phase 2: 設計 — task-07 prototype-mapping-table

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-07-prototype-mapping-table |
| phase | 2 / 13 |
| wave | w2-par |
| mode | parallel |
| 作成日 | 2026-05-07 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

[実装区分: ドキュメントのみ]
判定根拠: 本タスクの成果物は `docs/00-getting-started-manual/specs/09a-prototype-map.md` の新規作成のみで、アプリケーションコード変更・schema 変更・依存追加を伴わない。CONST_004 の例外条件（純粋にドキュメントで完結）に該当するため docs-only として作成。

## 目的

`09a-prototype-map.md` の章立て（§1〜§7）と、§2 / §3 / §6 各表の列名を確定する。task-07 §0.7 と §4.1〜§4.6 を本フェーズで設計詳細として固める。

## 実行タスク

1. 章立て案（§1 位置づけ / §2 primitives mapping / §3 routes mapping / §4 shell / §5 派生ルール / §6 行範囲台帳 / §7 改訂履歴）を確定する。完了条件: 7 章構成が outputs/phase-02/main.md に記録される。
2. §2 列名 `| prototype component | source | 本番実装 path（task-10） | RSC-safe | 備考 |` を確定する。
3. §3 列名 `| route | prototype-file | line-range | 主 component | derivation-rule | 備考 |` を確定する。
4. §6 列名 `| 用途 | path | line range |` を確定する。
5. §3 routes mapping 19 行（公開 6 / 会員 2 / 管理 8 / 共通 3）の row 設計を行う。
6. §2 primitives mapping 13 row + §4 shell 4〜6 row + §6 台帳 25+ row の row 数目標を設計する。

## 参照資料

- docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-07-w2-par-prototype-mapping-table.md §0.7, §4.1, §4.2, §4.3, §4.4, §4.6
- prototype jsx 5 ファイル

## 章立て（task-07 §4.1 を継承）

```
1. 位置づけ
   1.1 本ファイルの責務（視覚的ソース・オブ・トゥルース）
   1.2 行範囲の読み方（パス + L<start>-L<end>）
   1.3 prototype に存在「しない」画面の扱い
2. UI primitives × 本番 component mapping (13+)
3. 全 19 routes mapping
   3.1 公開層 (6 routes)
   3.2 会員層 (2 routes)
   3.3 管理層 (8 routes)
   3.4 共通 (3 routes)
4. shell / chrome mapping (Sidebar / Topbar / MinimalBar)
5. 派生ルール（プロトタイプ未掲載画面）5.1〜5.8
6. 行範囲台帳（全 mapping の line range 一覧）
7. 改訂履歴
```

## §2 primitives mapping（task-07 §4.2 を 13+ row として転記）

主要 row: Chip, Avatar, Button, Switch, Segmented, Field/Input/Textarea/Select, Search, Drawer, Modal, Toast, KVList, LinkPills, zone/statusTone helpers。AvatarStoreProvider の localStorage 部分は不採用と明記。

## §3 routes mapping（task-07 §4.3 を 19 行として転記）

| 層 | 行数 | 内訳 |
|----|------|------|
| 公開 | 6 | `/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms` |
| 会員 | 2 | `/login`, `/profile` |
| 管理 | 8 | `/(admin)/admin`, members, tags, meetings, schema, requests, identity-conflicts, audit |
| 共通 | 3 | `error.tsx`, `global-error.tsx`, `not-found.tsx`（`loading.tsx` は §5.8 派生対象に記載し、§3 route count には含めない） |

## §6 行範囲台帳（task-07 §4.6 を 25+ row）

primitives 13 + pages-public 4 + pages-member 3 + pages-admin 4 + app shell 4 = 28 行を最低ラインとする。

## 依存 Phase 成果物参照

- Phase 1: `outputs/phase-01/main.md`（要件・列名・受信シグネチャ）

## 多角的チェック観点

- 列名は grep キーとして固定（後続 task が逆引き検索可能）
- §3 19 routes と §6 行範囲は最終マッチで矛盾しないこと
- §5 8 パターンが phase-3 §3 と 1:1 で対応すること

## サブタスク管理

- [ ] 章立て確定
- [ ] §2 列名 / §3 列名 / §6 列名 確定
- [ ] 19 routes 行設計
- [ ] outputs/phase-02/main.md にまとめる

## 成果物

- outputs/phase-02/main.md

## 完了条件

- [ ] 章立て 7 章が記録される
- [ ] 列名 3 種が記録される
- [ ] §3 19 行 / §2 13 行 / §6 25 行の row 数目標が記録される
- [ ] §5 派生ルール 8 パターンの転記方針が記録される

## 次 Phase への引き渡し

Phase 3 へ、章立て・列名・row 数目標を設計レビュー入力として渡す。
