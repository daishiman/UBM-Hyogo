# Phase 8: リファクタリング (DRY 化)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 自動生成 skill ledger の gitignore 化 (skill-ledger-a1-gitignore) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | リファクタリング (DRY 化) |
| 作成日 | 2026-04-28 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |

## 目的

Phase 5 の実装ランブックが完了した直後に走らせるべき「重複/冗長な hook ガードの整理」と「`.gitignore` の skill-auto-generated section 整列」のリファクタリング手順を仕様書として確定し、Phase 9 品質保証に「同じ概念のガードが複数箇所に並ぶ」「`.gitignore` 内に類似 glob が散在する」状態を持ち越さないようにする。本ワークフロー自体は docs-only / spec_created に閉じるため、本 Phase は将来 Phase 5 別 PR で実装が走った後に参照される refactor 指針として記述する。

## 実行タスク

1. lefthook 配下 (`lefthook.yml` / `.lefthook/post-commit/*` / `.lefthook/post-merge/*`) の hook script を横断確認し、「tracked canonical を上書きしないガード」が複数箇所で重複していないかを洗い出す（完了条件: 重複候補が表化されている）。
2. hook script の guard 冪等化パターン（`[ -f path ] && exit 0` / `git ls-files --error-unmatch path 2>/dev/null && exit 0`）を 1 箇所のヘルパー（提案: `.lefthook/lib/skip-if-tracked.sh`）に集約する Before/After を提示する（完了条件: 共通化対象 1 件以上が記述されている）。
3. `.gitignore` 内の skill-auto-generated section（A-1 で追加される 4 系列 glob）が、既存セクション（node / build / IDE 等）と区別された専用ブロックとして整列しているか確認する（完了条件: section header コメントとブロック順序が確定）。
4. Phase 5 ランブック §Step 1 の glob 列挙順序（`indexes/keywords.json` → `indexes/index-meta.json` → `indexes/*.cache.json` → `LOGS.rendered.md`）が `.gitignore` 実体・hook 内ガード・ドキュメントの 3 箇所すべてで一致するか確認する（完了条件: 順序ドリフト 0）。
5. artifacts.json の `outputs` path と各 phase-NN.md の参照 path の一致を確認する（完了条件: navigation drift 0）。
6. outputs/phase-08/main.md に Before/After テーブル・重複ガード抽出表・section 整列ルールを集約する（完了条件: 1 ファイルにすべて記述されている。なお本ワークフローでは spec_created のため記述は「NOT EXECUTED — docs-only / spec_created」プレースホルダで可）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-02.md | base case 設計（lane 1〜4 / state ownership） |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-05.md | 実装ランブック（Step 1〜4） |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md | runbook 正本 |
| 必須 | lefthook.yml | hook 正本 |
| 必須 | doc/00-getting-started-manual/lefthook-operations.md | hook 運用ガイド |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-08.md | DRY 化 phase の構造参照 |

## Before / After 比較テーブル（リファクタ対象）

> 詳細は `outputs/phase-08/main.md` を参照。本仕様書には観点と代表例のみ記載する。
> 依存成果物は Phase 2 の base case 設計、Phase 6 の fail path、Phase 7 の coverage map とし、Phase 8 はこれらの重複・表記揺れを整理して Phase 9 へ渡す。

### hook ガード（冪等性整理）

| 対象 | Before（想定） | After | 理由 |
| --- | --- | --- | --- |
| post-commit ガード | 各 skill ごとに `[ -f indexes/keywords.json ] && exit 0` がインライン重複 | `.lefthook/lib/skip-if-tracked.sh <path>` ヘルパー呼び出しに集約 | 重複ガードの一元化 / canonical 上書き禁止の責務集約 |
| post-merge ガード | post-commit と同等のガードがコピー&ペーストで存在 | 同ヘルパー呼び出しで統一 | DRY / 修正点を 1 箇所に局所化 |
| 存在チェックロジック | `test -f` と `[ -e ]` の表記揺れ | `[ -f path ]` に統一 | 表記揺れ解消 |
| tracked 判定 | hook 内に `git ls-files` 直書き重複 | ヘルパー内 1 箇所 | tracked / untracked 判定の単一情報源化 |

### `.gitignore` セクション整列

| 対象 | Before（想定） | After | 理由 |
| --- | --- | --- | --- |
| section header | A-1 glob が末尾に追記され既存ブロックと未分離 | `# === skill auto-generated (do not commit) ===` ヘッダー付き専用ブロック | grep / レビューでの可読性 |
| glob 列挙順序 | runbook 順と差異 | runbook §Step 1 と同順 | 順序ドリフト 0 |
| 末尾 newline | 末尾 newline 有無の表記揺れ | 末尾 newline 1 つで終端 | POSIX text file 規約 |
| コメント | A-1 由来である旨が未記載 | `# managed by docs/30-workflows/skill-ledger-a1-gitignore/phase-05.md` を併記 | 由来の追跡性 |

### 用語・命名

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| derived artifact 呼称 | 「派生物」「自動生成」「auto-generated」混在 | 「派生物 (derived artifact / skill auto-generated)」で全 Phase 統一 | 用語ドリフト 0 |
| canonical 呼称 | 「正本」「canonical」混在 | 「正本 (canonical)」併記で統一 | Phase 1〜3 と整合 |

## 重複コードの抽出箇所

| # | 重複候補 | 抽出先 | 他 hook 転用可否 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | tracked 判定 (`git ls-files --error-unmatch`) | `.lefthook/lib/skip-if-tracked.sh` | 可 | A-1 / B-1 / T-6 すべてで利用可 |
| 2 | 存在チェック (`[ -f path ]`) | 同上ヘルパー内関数 | 可 | 同上 |
| 3 | log prefix (`[skill-ledger]`) | hook 共通 echo helper | 限定的 | hook 群でのみ |
| 4 | error exit code 0/1 規約 | コメントで規約化 | 可 | hook 全般 |

## navigation drift の確認

| チェック項目 | 確認方法 | 期待結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-NN.md の成果物 path | 目視 + grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` 表 × 実 phase-NN.md ファイル名 | `ls phase-*.md` と突合 | 完全一致 |
| Phase 10 出力 path | 本 Phase で正規化判定 | `outputs/phase-10/main.md` に統一し、artifacts.json / index.md も同一表記に揃える |
| phase-NN.md 内の `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| 原典 unassigned-task 参照 | 実在確認 | 実在 |

## 共通化パターン

- hook script: shebang `#!/usr/bin/env bash` + `set -eu` + ヘルパー source の 3 行プレリュードに統一。
- ガード順序: 「tracked 判定 → 存在チェック → 再生成」の順固定。
- glob 順序: `keywords.json` → `index-meta.json` → `*.cache.json` → `LOGS.rendered.md`（runbook §Step 1 順）。
- 用語: 「派生物 (derived artifact)」「正本 (canonical)」「冪等ガード (idempotent guard)」を全 Phase で固定。

## 削除対象一覧

- 旧 `.git/hooks/*` 手書き hook 残骸（lefthook 正本化以降）。
- runbook 例示由来の特定 skill パスべた書き。
- 重複した `# auto-generated` コメントが他セクションに混入している場合の冗長コメント。

## 実行手順

### ステップ 1: hook script 横断確認
- `lefthook.yml` および `.lefthook/` 配下の post-commit / post-merge を grep し、重複ガードを表化。

### ステップ 2: ヘルパー集約 Before/After 提示
- `.lefthook/lib/skip-if-tracked.sh` を新設する場合の関数 signature を Phase 5 ランブックに同期。

### ステップ 3: `.gitignore` セクション整列ルール記述
- header / 順序 / 末尾 newline / コメントの 4 観点で確定。

### ステップ 4: navigation drift 確認
- artifacts.json と各 phase-NN.md の path 整合（Phase 10 は `outputs/phase-10/main.md` に統一）。

### ステップ 5: outputs/phase-08/main.md に集約
- spec_created 段階では「NOT EXECUTED — docs-only / spec_created」を明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | line budget / link 整合 / mirror parity 検証の前提として DRY 化済み state を渡す |
| Phase 10 | navigation drift 0 を GO/NO-GO の根拠に使用 |
| Phase 11 | hook ヘルパー集約後に 4 worktree smoke を実走 |
| Phase 12 | implementation-guide.md にヘルパー仕様を反映 |
| T-6 (task-skill-ledger-hooks) | ヘルパー本体を引き継ぎ実装 |

## 多角的チェック観点

- 価値性: hook 重複の解消で Phase 5 実装後の保守コストを下げる。
- 実現性: lefthook 既存運用と整合する範囲のリファクタに留める。
- 整合性: 不変条件 #5 を侵害しない（D1 を触らない）/ skill ledger 派生物 / 正本境界を維持。
- 運用性: ヘルパー 1 ファイル化で hook 修正点が局所化される。
- 責務境界: ヘルパーは「tracked → skip」「未存在 → 再生成」の 2 動詞に閉じる（canonical を書かない）。
- 用語ドリフト: 「派生物 / 正本 / 冪等ガード」3 用語の表記揺れ 0。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | hook script 横断 grep | 8 | spec_created | 重複洗い出し |
| 2 | ヘルパー集約 Before/After | 8 | spec_created | `skip-if-tracked.sh` 提案 |
| 3 | `.gitignore` section 整列 | 8 | spec_created | 4 観点 |
| 4 | 用語統一 | 8 | spec_created | 派生物 / 正本 / 冪等ガード |
| 5 | navigation drift 確認 | 8 | spec_created | Phase 10 path 表記揺れ含む |
| 6 | outputs/phase-08/main.md 作成 | 8 | spec_created | プレースホルダ可 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | リファクタ対象テーブル（対象 / Before / After / 理由） |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 検証コマンド

```bash
# hook 重複検出
grep -rn 'ls-files --error-unmatch\|test -f\|\[ -f ' lefthook.yml .lefthook 2>/dev/null

# .gitignore section ヘッダー確認
grep -n 'skill auto-generated' .gitignore

# navigation drift 検出（artifacts.json と outputs path）
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/skill-ledger-a1-gitignore
```

## 完了条件

- [ ] Before/After テーブルが 3 区分（hook ガード / `.gitignore` セクション / 用語）すべてで埋まっている
- [ ] 重複コード抽出が 4 件以上列挙されている
- [ ] navigation drift（artifacts.json / index.md / phase-NN.md / outputs path）が 0
- [ ] hook ヘルパー集約方針が記述されている
- [ ] `.gitignore` セクション整列ルール（header / 順序 / 末尾 newline / コメント）が確定
- [ ] outputs/phase-08/main.md がプレースホルダ含めて作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物が `outputs/phase-08/main.md` に配置予定（spec_created のためプレースホルダ）
- 用語ドリフト 0
- navigation drift 0
- artifacts.json の `phases[7].status` が `spec_created`

## 苦戦防止メモ

- hook ヘルパー集約は T-6（task-skill-ledger-hooks）と責務が重なる。本 Phase ではヘルパー *仕様* のみ確定し、実装は T-6 に委ねること。
- `.gitignore` の section 順序を変えると既存のローカル `.git/info/exclude` と衝突する場合があるので、section は **末尾追加** を原則とし、整列は section 内部で完結させる。
- Phase 10 outputs path 表記は `outputs/phase-10/main.md` に統一済みとして Phase 9 link 検証へ渡すこと。

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - DRY 化済みの hook ガード方針 / `.gitignore` section 整列ルール
  - Phase 10 出力 path の表記正規化結果
  - 用語統一済みの 3 用語（派生物 / 正本 / 冪等ガード）
- ブロック条件:
  - Before/After に空セルが残る
  - navigation drift が 0 にならない
  - hook ヘルパー集約方針が確定しない
