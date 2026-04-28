# Phase 6 — 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase | 6 / 13 |
| 状態 | completed |
| 上流 | Phase 5（実装ランブック） |
| 下流 | Phase 7（AC マトリクス） |

## 結論サマリ

`verify-indexes-up-to-date` の fail 経路 10 件（F-01〜F-10）を洗い出し、
false positive（決定論性破綻）と false negative（drift 検知漏れ）の両方向を
仕様化した。F-01（再生成忘れ）/ F-05〜F-06（決定論性）が最重要。
監視対象 path 引数（`-- .claude/skills/aiworkflow-requirements/indexes`）により
**監視外の差分は検出対象から外れる**ことを F-04 / F-11 で明示する。

## failure case 一覧（F-01〜F-11）

| # | 失敗種別 | 想定経路 | 期待挙動 |
| --- | --- | --- | --- |
| F-01 | 意図的 references 編集 + indexes 未再生成 | 開発者の再生成忘れ | drift 検出 → fail |
| F-02 | lockfile drift | `pnpm-lock.yaml` 不整合 | install step で fail（drift 判定前） |
| F-03 | generate-index.js のネットワーク要求 | 想定外の外部呼び出し | 設計上発生してはならない（grep 検証） |
| F-04 | indexes だけを直接編集した PR | 同一ブランチ の手動書換 | drift 検出 → fail（手書きを許容しない） |
| F-05 | non-deterministic 出力（mtime） | 出力 timestamp 混入 | 起こってはならない |
| F-06 | non-deterministic 出力（順序） | readdir 順序揺れ | 起こってはならない（sort で担保） |
| F-07 | generate-index.js 自身の例外 | script bug | rebuild step で fail（drift メッセージは出ない） |
| F-08 | concurrent push の競合 | 同 PR 連続 push | concurrency group で in-progress cancel |
| F-09 | timeout（巨大 references） | references 過大 | `timeout-minutes: 10` で fail |
| F-10 | submodule / LFS 経由の references | 想定外 storage | 現状なし（保留） |
| F-11 | 監視 path 外のファイルが drift | `apps/api` 配下の未コミット変更 | **検出対象外**（path 引数で限定） |

## 主要 case の詳細とログサンプル

### F-01: references を意図的に変更し indexes 未再生成

- 再現:
  1. `.claude/skills/aiworkflow-requirements/references/<任意>.md` を 1 行追記
  2. `pnpm indexes:rebuild` を **実行せず** commit & push
- 期待 exit: 1
- fail ログサンプル:
  ```
  ::error::index drift detected. Run 'pnpm indexes:rebuild' locally and commit the result.
  --- changed files ---
  .claude/skills/aiworkflow-requirements/indexes/<対象>.json
  --- git status ---
   M .claude/skills/aiworkflow-requirements/indexes/<対象>.json
  ```

### F-02: lockfile drift

- 再現: `package.json` の dependency を編集し `pnpm-lock.yaml` を更新せず push
- 期待 exit: 1（`Install dependencies` step）
- fail ログサンプル:
  ```
  ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile"...
  ```
- 意義: drift 判定より前段で止まるため、本 gate の責務を侵さない（ci.yml 側でも fail し冗長保護）

### F-04: indexes だけを直接編集した PR

- 再現: `.claude/skills/aiworkflow-requirements/indexes/<対象>.json` を手動編集し、references 側は変更せず push
- 期待 exit: 1（`pnpm indexes:rebuild` 後に手動編集が上書きされ drift 検出）
- 合理的扱い: indexes は generated artifact であり手書き禁止。fail することで再生成経路を強制
- fail ログ: F-01 と同形

### F-05: non-deterministic 出力（mtime / 実行時刻 / 絶対パス）

- 検証手順:
  ```bash
  pnpm indexes:rebuild
  cp -r .claude/skills/aiworkflow-requirements/indexes /tmp/run1
  sleep 2
  pnpm indexes:rebuild
  diff -r /tmp/run1 .claude/skills/aiworkflow-requirements/indexes
  ```
- 期待: diff なし
- 検証コマンド（grep）:
  ```bash
  grep -nE "Date\.now|toISOString|path\.resolve" \
    .claude/skills/aiworkflow-requirements/scripts/generate-index.js
  ```
  → 0 件であること（mtime / 実行時刻 / 絶対パスを出力しない）
- 不合格時: generate-index.js を修正（本タスク scope 外。別 issue 化、Phase 10 R-1 として申し送り）

### F-06: ファイル列挙順序

- 検証: macOS / Ubuntu の双方で生成して bytewise diff を取る
- 期待: 完全一致
- リスク: `fs.readdirSync` は OS 依存順序 → script 側で `.sort()` 必須
- 検証 grep: `grep -nE "readdirSync|readdir" .claude/skills/aiworkflow-requirements/scripts/generate-index.js | grep -v sort` で sort 後処理が無い行が出ないこと

### F-07: generate-index.js の例外

- 再現: references 配下に壊れた markdown（front-matter 欠損等）
- 期待 exit: 1（`Rebuild indexes` step、stack trace ログ出力）
- ログ識別: step 名 "Rebuild indexes" で fail。`::error::index drift` は **出ない**（区別可能）

### F-03: ネットワーク非依存性検証 runbook

```bash
# generate-index.js に外部 fetch / http が混入していないこと
grep -nE "(fetch|require\\(['\"]https?|node:https?|net\\.|axios)" \
  .claude/skills/aiworkflow-requirements/scripts/generate-index.js \
  || echo "OK: no network access"
```

期待: 0 件（empty）。CI 上で flaky になる外部依存を排除。

### F-08: concurrent push

- 再現: 同一 PR に 1 秒間隔で 2 回 push
- 期待: 旧 run が `cancel-in-progress: true` でキャンセル、新 run のみ完走
- 意義: 二重実行による flakiness 防止

### F-09: timeout

- 期待: 10 分で fail（`timeout-minutes: 10`）
- 意義: indexes 生成は通常 1 分以下。10 分超えは設計異常

### F-10: submodule / LFS（保留）

- 現状 references は通常ファイルのみ。submodule / LFS 構成は採用しておらず再現経路なし
- 将来 submodule 化された場合に再評価（保留扱い）

### F-11: 監視 path 外（drift 無視）

- `apps/web/` や `docs/` を編集して PR を出しても本 gate は green
- 担保: `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` の **path 引数**
- 意義: AC-7（監視範囲限定）の structural 担保。誤検出ゼロ

## false positive / false negative マッピング

| 種類 | 例 | 対策 |
| --- | --- | --- |
| false positive | F-05 / F-06 | Phase 4 TC-02 連続 2 回実行 + sort 担保 |
| false positive | OS 差（改行コード） | core.autocrlf / .gitattributes で改行統一（Phase 10 R-2） |
| false negative | indexes が壊れているのに drift なし PASS | F-04 で fail に倒れる仕様 |
| false negative | 未追跡（untracked）index 新規生成 | `git add -N` で intent-to-add 化し `git diff` 検出対象に含める |

## 実行タスク（completed）

- [x] F-01〜F-11 の表化（11 件）
- [x] F-01 / F-02 / F-05 / F-07 のログサンプル記載
- [x] FP / FN マッピング 4 行
- [x] F-03 ネットワーク非依存 grep runbook
- [x] F-10 保留理由明記

## 完了条件

- [x] failure case を表で網羅
- [x] 主要 4 ケースのログサンプルあり
- [x] FP / FN マッピングあり
- [x] F-03 grep が runbook 化
- [x] F-10 保留理由記載

## 次 Phase

Phase 7 へ failure case 11 件と期待ログを引き継ぐ。
