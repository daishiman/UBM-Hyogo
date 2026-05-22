# skill-feedback-report.md

本タスク完了を踏まえ、関連 skill 2 件に改善提案を 1 件以上ずつ提示する。

## 1. task-specification-creator への提案

### 提案: 「派生ルール正本転記」パターンを phase-template に組み込む

#### 背景

task-21 は admin 8 routes のうち 4 routes がプロトタイプ未掲載で、phase-3 §5.x の派生ルールを 09g に正本転記する必要があった。現状の phase-template には「派生ルールの正本転記」という構造が無く、「構造 contract 転記」「派生抜粋」「link のみ」のどれを採用するか個別判断していた。

#### 改善内容

phase-2（設計）テンプレートに以下のサブセクションを追加することを提案:

```
## 派生ルール正本転記計画
- 派生元参照: <親 workflow phase-N §X>
- 転記方式: 全文転記 / 抜粋 + link / link のみ
- 派生注記の固定形: `> 派生元: <ref>`
- 新 primitive 生成可否
```

#### 効果

- UI prototype alignment 系 task で派生 §の表現がブレない
- AC-X として「派生注記 N 件」が quantitative 化しやすい
- 09g 同様の repair で AC 化すべき項目が事前に揃う

## 2. aiworkflow-requirements への提案

### 提案: UI prototype alignment 系 task workflow の skill indexes 同期判定基準を明文化する

#### 背景

task-21 のような docs-only / 仕様書追記タスクは、aiworkflow-requirements skill の `quick-reference.md` / `resource-map.md` / `references/task-workflow-active.md` を更新するべきか毎回判断する必要がある。今回は「workflow 構造を変えない」ため N/A 判定にしたが、判定基準が明文化されていないため属人的になりやすい。

#### 改善内容

skill 内に「同期判定基準」セクションを追加することを提案:

| 変更種別 | indexes 同期 | 理由 |
| --- | --- | --- |
| 新規 reference 追加 | 必要 | 検索可能性の確保 |
| 既存 spec の AC repair（構造変更なし） | 不要 | resource-map に新規 path が無い |
| 新規 task workflow 起票 | 必要 | task-workflow-active に追記 |
| 既存 task workflow 内の phase output 追加 | 不要 | active task の状態は workflow 内に保持 |
| topic / anchor の追加 | 必要 | topic-map 更新 |

#### 効果

- 各タスクで判定が決定論的になる
- skill drift 検出 / verify-indexes-up-to-date gate（CI）と運用が整合する
- docs-only タスクで余計な indexes 更新を避ける

## まとめ

- task-specification-creator: phase-2 テンプレに「派生ルール正本転記計画」追加
- aiworkflow-requirements: skill indexes 同期判定基準セクション追加

両提案は本タスク（task-21）の経験を一般化したもの。後続の UI prototype alignment 系 task で再利用される。
