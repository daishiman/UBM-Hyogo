# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-verify-indexes-up-to-date-ci |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | - |
| 実行種別 | serial |
| 作成日 | 2026-04-28 |
| 上流 | Phase 5 |
| 下流 | Phase 7 |
| 状態 | completed |

## 目的

`verify-indexes-up-to-date` の **fail 経路** が想定通り動作することを保証する。
特に false positive / false negative の両方向のリスクを洗い出し、再現手順と期待挙動を確定する。

## failure case 一覧

| # | 失敗種別 | 想定経路 | 期待挙動 |
| --- | --- | --- | --- |
| F-01 | 意図的 references 編集 + indexes 未再生成 | 開発者の再生成忘れ | drift 検出 → fail |
| F-02 | lockfile drift | `pnpm-lock.yaml` 不整合 | install step で fail（drift 判定前） |
| F-03 | generate-index.js のネットワーク要求 | 想定外の外部呼び出し | 設計上発生してはならない（検証） |
| F-04 | indexes だけを直接編集した PR | 同一ブランチ の手動書換 | drift 0 で PASS（合理的扱い） |
| F-05 | non-deterministic 出力（mtime） | 出力 timestamp 混入 | 起こってはならない（検証） |
| F-06 | non-deterministic 出力（順序） | readdir 順序揺れ | 起こってはならない（検証） |
| F-07 | generate-index.js 自身の例外 | script bug | rebuild step で fail |
| F-08 | concurrent push の競合 | 同 PR 連続 push | concurrency group で in-progress cancel |
| F-09 | 巨大 references による timeout | references 過大 | timeout-minutes: 10 で fail |
| F-10 | submodule / LFS 経由の references | 想定外 storage | 現状なし（保留） |

## 各 case の詳細

### F-01: references を意図的に変更し indexes 未再生成

- **再現手順**:
  1. `.claude/skills/aiworkflow-requirements/references/<任意>.md` を 1 行追記
  2. `pnpm indexes:rebuild` を **実行せず** commit & push
  3. `verify-indexes-up-to-date` job を待つ
- **期待挙動**: exit 1
- **fail ログサンプル**:
  ```
  ::error::index drift detected. Run 'pnpm indexes:rebuild' locally and commit the result.
  --- changed files ---
  .claude/skills/aiworkflow-requirements/indexes/<対象>.json
  --- git status ---
   M .claude/skills/aiworkflow-requirements/indexes/<対象>.json
  ```

### F-02: lockfile drift

- **再現手順**: `package.json` の dependency を編集し `pnpm-lock.yaml` を更新せず push
- **期待挙動**: `Install dependencies` step で `ERR_PNPM_OUTDATED_LOCKFILE` により fail
- **意義**: drift 判定より前段で止まるため、本 gate の責務は侵さない。`ci.yml` 側でも fail し冗長保護される

### F-03: generate-index.js のネットワーク要求

- **検証手順**: `node --experimental-permission --allow-fs-read=. .claude/skills/aiworkflow-requirements/scripts/generate-index.js` 等で外部 fetch を grep 確認
- **期待挙動**: ネットワーク呼び出しなし（純粋にローカル FS 操作のみ）
- **代替**: `grep -E "(fetch|http|net)" .claude/skills/aiworkflow-requirements/scripts/generate-index.js` で empty を確認
- **意義**: CI 上で外部依存があると flaky になる → 純粋関数性を担保

### F-04: indexes だけを直接編集した PR

- **再現手順**: `.claude/skills/aiworkflow-requirements/indexes/<対象>.json` を手動編集し、references 側は変更せず push
- **期待挙動**: `pnpm indexes:rebuild` 実行後に手動編集が **上書きされる** 場合 → drift 検出 → fail
- **合理的扱い**: indexes は generated artifact であり手書き禁止。fail することで人間に再生成経路を強制
- **fail ログ**: F-01 と同形

### F-05: non-deterministic 出力（mtime / 実行時刻 / 絶対パス）

- **検証手順**:
  ```bash
  pnpm indexes:rebuild
  cp -r .claude/skills/aiworkflow-requirements/indexes /tmp/run1
  sleep 2
  pnpm indexes:rebuild
  diff -r /tmp/run1 .claude/skills/aiworkflow-requirements/indexes
  ```
- **期待挙動**: diff なし
- **混入リスク**: `Date.now()` / `new Date().toISOString()` / `path.resolve` の絶対パスを generate-index.js が出力していないこと
- **不合格時の対処**: generate-index.js を修正（本タスクスコープ外。別 issue 化）

### F-06: non-deterministic 出力（ファイル列挙順序）

- **検証手順**: macOS / Linux で同一 input から indexes を生成し diff
- **期待挙動**: 完全一致
- **混入リスク**: `fs.readdirSync` の OS 依存順序。sort 必須

### F-07: generate-index.js の例外

- **再現手順**: references 配下に壊れた markdown を置く（front-matter 欠損等）
- **期待挙動**: `Rebuild indexes` step で non-zero exit、stack trace がログ出力
- **意義**: drift 判定 step に到達しないため `::error::index drift` は出ない（区別可能）

### F-08: concurrent push の競合

- **再現手順**: 同一 PR に 1 秒間隔で 2 回 push
- **期待挙動**: 旧 run が `cancel-in-progress: true` でキャンセル、新 run のみ完走
- **意義**: 二重実行による flakiness 防止

### F-09: timeout

- **期待挙動**: 10 分で fail（`timeout-minutes: 10`）
- **意義**: indexes 生成は通常 1 分以下。10 分かかる時点で異常

## false positive / false negative マッピング

| 種類 | 例 | 対策 |
| --- | --- | --- |
| false positive | F-05 / F-06 | 決定論性を Phase 4 TC-02 で検証 |
| false negative | indexes が実は壊れているのに drift なしで PASS | F-04 で人間が壊した場合は fail に倒れる側で運用 |

## 実行タスク

1. F-01〜F-10 を `outputs/phase-06/main.md` に表で記載
2. F-01 / F-02 / F-05 / F-07 のログサンプルを記載
3. false positive / false negative マッピングを整理
4. F-03 のネットワーク非依存性を grep で確認するコマンドを runbook 化
5. F-10 の保留理由を明記

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 4 outputs | TC との突合 |
| 必須 | Phase 5 outputs | YAML 仕様（concurrency / timeout） |
| 必須 | .claude/skills/aiworkflow-requirements/scripts/generate-index.js | F-03 / F-05 / F-06 検証対象 |

## 実行手順

1. F-01 を最優先で再現し fail ログをスナップショット
2. F-05 / F-06 を Linux runner（GitHub Actions）と macOS（ローカル）で交差確認
3. F-03 を grep で 0 件確認
4. F-08 を draft PR の連続 push で実機確認

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | F-01〜F-09 ↔ AC のマッピング |
| Phase 11 | F-01 / F-08 を smoke evidence として再録 |
| Phase 9 | F-09 timeout 値の妥当性レビュー |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| 不変条件 | #1〜#7 | 触れない |
| secret 漏洩 | — | fail ログに secrets が出ない（そもそも未参照） |
| 決定論性 | — | F-05 / F-06 |
| timeout | — | F-09 |
| concurrency | — | F-08 |

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | F-01〜F-10 表 | completed | 10 件 |
| 2 | ログサンプル 4 種 | completed | F-01 / F-02 / F-05 / F-07 |
| 3 | FP / FN マッピング | completed | 2 種 |
| 4 | F-03 grep runbook | completed | ネットワーク非依存検証 |
| 5 | F-10 保留理由 | completed | submodule / LFS |

## 成果物

| パス | 説明 |
| --- | --- |
| outputs/phase-06/main.md | failure case 表 + ログサンプル + FP/FN マッピング |

## 完了条件

- [ ] failure case 10 件が表で網羅
- [ ] 主要 4 ケースのログサンプルあり
- [ ] FP / FN マッピングあり
- [ ] F-03 のネットワーク非依存が grep で確認可能
- [ ] F-10 の保留理由が記載

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 completed
- [ ] outputs/phase-06/main.md 配置済み
- [ ] artifacts.json の Phase 6 を completed

## 次 Phase

- 次: Phase 7 (AC マトリクス)
- 引き継ぎ事項: failure case 10 件 + 期待ログ
- ブロック条件: F-01 / F-05 / F-06 のいずれかが未検証なら Phase 7 に進めない
