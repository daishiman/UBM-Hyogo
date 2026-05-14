# Phase 3: 設計レビュー

## 1. 4 条件評価

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | ◯ | task-18 で実装した CI gate が「何を守るか」を 19 routes × 5 軸で可視化することで、後続タスクが矛盾なく test を追加できる |
| 実現性 | ◯ | 既存 spec / 既存 baseline / 既存 selector を整理する文書化のみ。code 変更ゼロ |
| 整合性 | ◯ | matrix の SSOT は `full-smoke.spec.ts` の `ROUTES[]` に固定。token は 09b JSON に委譲 |
| 運用性 | ◯ | matrix は spec 追加時に行を増やすだけで保守できる。CI gate job 名は task-18 と整合 |

## 2. 因果ループ（強化）

```
CI gate（task-18）が green であれば 19 routes が壊れない
        ↓
matrix が現状の覆い範囲を可視化
        ↓
覆い不足（残り 15 routes の visual / 共通 3 の observability 等）が顕在化
        ↓
future task として明示的に切り出される
        ↓
徐々に coverage が広がる
```

## 3. 因果ループ（バランス）

```
matrix が肥大化しすぎると保守コスト増
        ↓ (これに対する制動)
本タスクでは 19 routes × 5 軸の単一表で抑え、軸別詳細は最小化する
```

## 4. レビュー結果

### MAJOR

なし。

### MINOR

- M1: `error.tsx` / `loading.tsx` の observability が脆い（既存 fixture 不在の可能性）。
  対応: Phase 6 で既存 spec を grep し、observability が確立できない場合は matrix 行を `N/A + future task` で埋め、Phase 12 で unassigned-task 候補化する。
- M2: token 軸の runtime 観測は `getComputedStyle` 経由で flaky になりやすい。
  対応: matrix の token 列は「verify-design-tokens に委譲」を基本ルールとし、smoke spec での runtime 観測は副次扱い。

### NOTE

- N1: 19 行に統一するため、`/login?state=sent` / `/login?state=unregistered` の query state variant は `/login` 行内の sub-row として扱う（行数は 19 を保つ）。
- N2: `(public)` / `(admin)` の route group 表記は URL ではなく source group 列のみで使用。

## 5. Phase 4 進行可否

**Go**: 設計上の致命欠陥なし。MINOR は Phase 6/12 で吸収可能。
