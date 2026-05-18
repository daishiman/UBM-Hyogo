---
phase: 9
title: リスク — parallel-01 と globals.css 共有編集の merge 戦略
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-02-prototype-css-rules-port
status: spec_created
---

# Phase 9 — リスクと merge 戦略

[実装区分: 実装仕様書]

## 1. クリティカルリスク — parallel-01 との `globals.css` 共有編集

### 1.1 リスク内容

`parallel-01-globals-css-rhythm/` と本サブワークフロー `parallel-02-prototype-css-rules-port/` は、**同一ファイル `apps/web/src/styles/globals.css` を並列で編集**する。両者が独立した worktree / branch で進行する場合、merge 時に git の auto-merge が衝突する可能性がある。

### 1.2 衝突発生のパターン

| パターン | 確率 | 影響 |
|---------|------|------|
| 両方とも `@layer components` の末尾 (line 215 直前) に append | 中 | 隣接行編集で auto-merge が context をずらして失敗 |
| 両方が同じマーカー名を使用 | 低 (本件はマーカー prefix を分離) | 衝突＋意味的破壊 |
| parallel-01 が既存 parallel-09 ブロックの上にも追記 | 低 | line 番号の大幅シフトで本件側の挿入位置が狂う |

### 1.3 merge 戦略 (Mitigation)

#### A. マーカーコメントによる責務分離

| サブワークフロー | マーカー prefix | 配置順 |
|-----------------|---------------|--------|
| parallel-01 | `/* === parallel-01 ... === */` | 既存 parallel-09 末尾の直後 |
| parallel-02 (本件) | `/* === parallel-02 ... === */` | parallel-01 ブロックの直後 |

両者は **異なる行範囲を append** するため、git auto-merge が成功する確率を最大化できる。

#### B. 先着優先ルール

両サブワークフローが `dev` 取り込みを行うタイミングを次のように規定する:

1. 先に dev へ merge されたサブワークフローを基準とする
2. 後発サブワークフローは `dev` を pull した上で自分の変更を append
3. マーカーコメント前後が context として保持されているか git diff で確認

#### C. `.gitattributes` の `merge=union` 適用検討

```
apps/web/src/styles/globals.css merge=union
```

を `.gitattributes` に追加する案は **採用しない**。union merge は CSS の意味的順序を壊し、`@layer components` の閉じ括弧位置が破綻する恐れがある。代わりに上記マーカー方式で人手解消できる範囲に抑える。

#### D. `pnpm sync:resolve` への接続

CLAUDE.md「sync-merge コンフリクト解消の 3 層予防」に従い、`pnpm sync:resolve` 経路で本ファイルが衝突した場合は **手動解消** ルートに回す (resolver スクリプトは globals.css を自動結合の対象外として扱う)。手動解消手順は次の通り:

1. parallel-01 / parallel-02 双方の `(start) ... (end)` ブロックを残す
2. 重複している `[data-component="member-card"]` 等の selector があれば parallel-02 側を採用 (本件で specificity 整理済)
3. `@layer components { ... }` の閉じ括弧 `}` がファイル末尾に 1 個だけ存在することを確認

### 1.4 merge 検知のための pre-PR gate

PR 作成時に次を実行し、構造破綻を検知する:

```bash
# @layer components の閉じ括弧が 1 個だけあること
grep -c '^@layer components' apps/web/src/styles/globals.css   # 期待: 1
# parallel-02 のマーカー start/end が同数
grep -c 'parallel-02.*(start)' apps/web/src/styles/globals.css # 期待: 3
grep -c 'parallel-02.*(end)' apps/web/src/styles/globals.css   # 期待: 3
```

## 2. 副次リスク

### 2.1 emoji icon の OS / Browser 差

| リスク | 影響 | 対策 |
|--------|------|------|
| emoji glyph が OS 間で異なり visual snapshot に差分 | baseline 不安定化 | CI 環境 (linux + Chromium) で baseline 固定。local の人手検証は OS 差を許容 |
| emoji フォント未読込で `tofu` (□) 表示 | 装飾意図が伝わらない | 中期的に SVG `background-image` 置換を検討 (本件では emoji 採用、follow-up issue 化) |

### 2.2 `--ubm-dur-fast` / `--ubm-ease-standard` 未定義リスク

| リスク | 影響 | 対策 |
|--------|------|------|
| tokens.css に上記 token が未定義 | transition が機能しない | fallback `.15s` / `ease` を `var(--ubm-dur-fast, .15s)` 形式で常に併記 |

### 2.3 `aria-selected` を非 button 要素に付けるリスク

| リスク | 影響 | 対策 |
|--------|------|------|
| 将来 `<div>` 等に付与されると role 不一致 | a11y warning | markup 側で `<button>` 限定の運用ルールを Phase 4 で明示済 |

### 2.4 visibility marker のセマンティクス過拡張

| リスク | 影響 | 対策 |
|--------|------|------|
| `data-visibility` 値追加要求が頻発 | 規則のメンテ負荷増 | 値追加は本サブワークフロー外、新 sub-workflow で扱う |

## 3. ロールバック手順

Phase 5 §8 と同じ。マーカー範囲を `sed` 削除して PR revert する。
