# Phase 2: 設計

`[実装区分: 実装仕様書]` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## 2.1 要件レビュー思考法（3系統）

### 真の論点

> dismiss 完了を待たずに row を消す optimistic UX を、**API 変更ゼロ・hook 変更ゼロ**で、merge 側 rollback と責務混線せず実現する。

現象（dismiss だけ反応が遅い）ではなく、主問題は「**操作種別ごとの row 可視性 state の所有権と分離**」。これを誤ると 1 つの `optimistic` boolean に merge / dismiss を相乗りさせ、片方の rollback がもう片方の error surface を巻き込む（issue 苦戦箇所が警告する failure mode）。

### 因果・責務境界

- **状態所有権**: row の可視性は **row 自身（component-local）** が所有する。親 list（page.tsx Server Component）は所有しない（#988 と同一原則）。
  - 強化ループ: 各操作種別（merge / dismiss）が独立した optimistic boolean を持つ → 片方の rollback が他方に波及しない。
  - バランスループ: optimistic で消した row は dismiss `onSuccess`（`setStage("idle")`）+ server list 後追いで server truth に収束。
- **責務分離（本タスクの核心）**:
  - `stage`（dialog 表示）と `optimisticDismissed`（row 可視性）を**別 state**。
  - `optimisticMerged`（merge 可視性）と `optimisticDismissed`（dismiss 可視性）を**別 state**。
  - 3 つを 1 union / 1 boolean に混ぜると、rollback 時にどの操作を復元するかが曖昧になる。
  - **合流は render guard でのみ行う**: `if (optimisticMerged || optimisticDismissed) return null;`。state は分離・guard で OR 統合。

### 価値とコスト

- 初回価値: dismiss 操作の体感速度を merge と対称化（同一画面内の非対称解消）。
- 最大コスト部品: rollback 時の **理由（`dismissReason`）保持**。`.catch` で optimistic state だけ戻し、`dismissReason` は触らない構造でコストを最小化。
- 将来層（混同しない）: row fade animation は別 followup。本タスクには含めない。

### 4条件評価

| 条件 | 評価 |
| --- | --- |
| 価値性 | 大量 conflict を処理する管理者の dismiss 体感コストを下げる。AC-1..3 で定義済 |
| 実現性 | 単一 component の `useState` 1 個 + ハンドラ差し替え + render guard 1 行。1 サイクルで実装可能な厚み |
| 整合性 | row 可視性の所有権が row に閉じる。merge state と分離。API/hook/page 不変。責務境界が矛盾なく閉じる |
| 運用性 | 既存 vitest/playwright スイートに追記。dismiss `onSuccess` + server truth で収束。監査運用破綻なし |

## 2.2 コンポーネント設計

### 状態モデル

```text
既存:
  stage: "idle" | "merge-confirm" | "merge-final" | "dismiss"
  optimisticMerged: boolean   // merge を楽観的に確定し row を非表示（#988）
  mergeReason: string
  dismissReason: string

新規:
  optimisticDismissed: boolean   // dismiss を楽観的に確定し row を非表示（本タスク）
```

### 状態遷移（dismiss 経路）

```text
[idle] --別人マーク--> [dismiss（理由入力 dialog）]
   |                          |
   |                   別人として確定 click
   |                          v
   |          optimisticDismissed = true（即時）→ dismissMutation.trigger()
   |                          |
   |        ┌─────────────────┴──────────────────┐
   |   success                                 reject (.catch)
   |        |                                      |
   | onSuccess: setStage("idle")         optimisticDismissed = false
   | + setDismissReason("")              （row 復元 / dismissReason 保持）
   |        |                                      |
   | row は消えたまま                     dismissError が inline 表示・再操作可能
   |   (optimisticDismissed=true 維持)    （stage は "dismiss" 維持）
```

### render guard 統合

```text
既存:  if (optimisticMerged) return null;
新規:  if (optimisticMerged || optimisticDismissed) return null;
```

> state は分離、guard でのみ OR 合流。これにより「merge / dismiss のどちらで消えたか」を state で識別でき、rollback の責務が明確になる。

## 2.3 既存コンポーネント再利用可否（FB-SDK-07-1）

| 検討対象 | 再利用可否 | 判断 |
| --- | --- | --- |
| `optimisticMerged` pattern（#988） | 再利用（対称適用） | dismiss 用に `optimisticDismissed` を新設し、`onMerge` と同型の構造を `onDismiss` に適用。新規 UI primitive 不要 |
| `useAdminMutation`（dismissMutation） | 再利用（変更なし） | `onSuccess` が既に `setStage("idle")` / `setDismissReason("")` を実行。optimistic は component 側 state で完結 |
| 既存 dismiss dialog markup（stage === "dismiss"） | 再利用（変更なし） | dialog 表示は `stage` が制御。row 可視性のみ optimistic state で制御 |
| `errorMessage()` / `dismissError` | 再利用（変更なし） | rollback 後の inline error 表示にそのまま利用 |

> 新規 UI 実装ゼロ。既存 primitive + 既存 dismiss markup で品質・アクセシビリティ（`role="alert"` / `aria-live`）を既存レベルで担保。

## 2.4 ロック変数の解放経路テーブル（正常 / エラー / キャンセル）（STATE-DETAIL-01）

`optimisticDismissed` は merge 側 `optimisticMerged` と同じく「rollback 専用解放」設計。

| 経路 | `optimisticDismissed` の終状態 | 理由 |
| --- | --- | --- |
| 正常（success） | `true` 維持 | row は消えたまま。`onSuccess` が stage/理由を整理し、server list が後追い整合 |
| エラー（reject） | `.catch` で `false` | row 復元。`dismissError` を inline 表示し再操作可能 |
| キャンセル（`cancelDismiss`） | 変化なし（`false` のまま） | optimistic 発火前なので state 操作不要。既存 `cancelDismiss`（`setStage("idle")` / `setDismissReason("")`）は不変 |

> merge と異なり「`optimisticDismissed` を true にしたまま放置すると次操作不能」という lock 不具合は起きない（row が消えるため再操作対象が消滅し、success/rollback いずれかで確定する）。reject 経路の `false` 復帰のみが解放責務。

## 2.5 ボタンのラベル・遷移先・state リセット範囲（STATE-DETAIL-02）

| ボタン | ラベル | 遷移 | state リセット範囲 |
| --- | --- | --- | --- |
| 「別人として確定」（dismiss 実行） | 既存維持 | optimistic hide → trigger | `setOptimisticDismissed(true)`（理由は保持） |
| 「キャンセル」（dismiss dialog） | 既存維持 | stage → idle | `setStage("idle")` / `setDismissReason("")`（既存不変） |

> rollback は「再試行」相当（`dismissReason` 保持）。`onSuccess` の理由 clear は success 専用で、rollback とは経路が分離している。

## 2.6 SubAgent lane / validation path

| lane | 担当 Phase | 並列性 |
| --- | --- | --- |
| backbone（自作） | Phase 1-3 + index/artifacts | 直列（CONST_001） |
| lane A | Phase 4-7（test → impl → 拡充 → coverage） | 並列 |
| lane B | Phase 8-11（refactor → QA → final → VISUAL） | 並列 |
| lane C | Phase 12（strict 7）+ Phase 13 | 並列 |
| validation | spec validators / gate-metadata / index drift | 直列（最後） |

## 2.7 完了条件

- 状態モデル・状態遷移・render guard 統合・解放経路・再利用方針が確定していること。
- 「state 分離 / guard で OR 合流」という核心設計が Phase 3 レビューで承認可能な粒度で記述されていること。
