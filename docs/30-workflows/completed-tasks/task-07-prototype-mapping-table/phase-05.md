# Phase 5: 実装計画 — task-07 prototype-mapping-table

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-07-prototype-mapping-table |
| phase | 5 / 13 |
| wave | w2-par |
| mode | parallel |
| 作成日 | 2026-05-07 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

[実装区分: ドキュメントのみ]
判定根拠: 本タスクの成果物は `docs/00-getting-started-manual/specs/09a-prototype-map.md` の新規作成のみで、アプリケーションコード変更・schema 変更・依存追加を伴わない。CONST_004 の例外条件（純粋にドキュメントで完結）に該当するため docs-only として作成。

## 目的

Phase 4 の T1〜T7 を実行する具体的手順、行範囲機械抽出コマンド、章ごとの執筆順を確定する。

## 実行タスク

1. prototype 行数を `wc -l` で確認する。完了条件: app 251 / primitives 272 / pages-public 472 / pages-member 373 / pages-admin 658 が確認される。
2. component 開始行を `grep -nE '^const [A-Z]'` で機械抽出する。完了条件: 全 component 開始行が抽出される。
3. 行範囲（`L<start>-L<end>`）を確定する。完了条件: 各 component の終端 } を sed で確認する手順が記録される。
4. 執筆順 T1 → (T2 // T4) → T3 → T5 → T6 → T7 で記述する。
5. `09a-prototype-map.md` を `docs/00-getting-started-manual/specs/` 配下に新規作成する。

## 機械抽出コマンドセット

```bash
# 行数把握
wc -l docs/00-getting-started-manual/claude-design-prototype/{app,primitives,pages-public,pages-member,pages-admin}.jsx

# component 開始行
grep -nE '^const [A-Z]' \
  docs/00-getting-started-manual/claude-design-prototype/app.jsx \
  docs/00-getting-started-manual/claude-design-prototype/primitives.jsx \
  docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx \
  docs/00-getting-started-manual/claude-design-prototype/pages-member.jsx \
  docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx

# 終端確認 (例: LandingPage L4-L154)
sed -n '4p;154p' docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx
```

## 執筆順序

| 順 | サブタスク | 章 | 想定行数 |
|----|-----------|-----|---------|
| 1 | T1 | §1 位置づけ | 30-50 |
| 2 | T2 / T4（並列） | §2 / §4 | 80 / 30 |
| 3 | T3 | §3 routes mapping (19 行) | 70-100 |
| 4 | T5 | §5 派生ルール 5.1-5.8 | 80-120 |
| 5 | T6 | §6 行範囲台帳 (25+ row) | 50-80 |
| 6 | T7 | §7 改訂履歴 | 10-20 |

合計目標: 360〜500 行（task-07 §4.1）

## 参照資料

- task-07 §4.1〜§4.6, §7（実行コマンド）
- Phase 4 outputs

## 依存 Phase 成果物参照

- Phase 1〜4 の outputs

## 多角的チェック観点

- 行範囲は機械抽出（grep -nE '^const [A-Z]'）で確定し、手書き禁止
- 列名は Phase 2 で確定したものを 1 字も改変しない
- 不採用記述は §2 / §4 / §6 で重複明記する

## サブタスク管理

- [ ] 行数把握コマンド実行手順記録
- [ ] component 開始行抽出手順記録
- [ ] 執筆順序確定
- [ ] 09a-prototype-map.md 新規作成手順記録

## 成果物

- outputs/phase-05/main.md
- docs/00-getting-started-manual/specs/09a-prototype-map.md（実装本体・本 phase で作成）

## 完了条件

- [ ] `09a-prototype-map.md` が 360 行以上で新規作成される
- [ ] §2 13+ row / §3 19 row / §6 25+ row が成立する
- [ ] §5 派生ルール 8 パターンが phase-3 §3 から転記される
- [ ] §5 末尾に「新規 primitive を生やさない」段落が記載される
- [ ] 不採用記述 4 箇所（TweaksPanel, AvatarStoreProvider, data-theme warm, data-theme cool）が記載される

## 次 Phase への引き渡し

Phase 6 へ、作成済み `09a-prototype-map.md` をレビュー対象として渡す。
