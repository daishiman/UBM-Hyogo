[実装区分: 実装仕様書]

# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-04 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | completed |
| Source Issue | #438 |
| 区分 | implementation / NON_VISUAL / scale: small |

---

## 目的

Phase 5 の正常系 runbook（S-1〜S-8）が想定どおりに動かないケースを 3 系統で網羅し、各ケースで「症状 / 原因仮説 / リカバリ手順 / 検証コマンド / 戻り Phase」を 1:1 で固定する。
本タスクは NON_VISUAL であり影響範囲は indexes ファイル 3 つに閉じるが、CI gate `verify-indexes-up-to-date` が PR を block する経路があるため、リカバリ手順の整備が品質保証の中核となる。

---

## 実行タスク

1. 異常系 3 系統（rebuild 失敗 / CI gate fail / 文言重複）の症状表を作成
2. 各系統で原因仮説 / リカバリ手順 / 検証コマンドを確定
3. 不変条件 #5 / CONST_005 への異常系での影響を再確認
4. Phase 7 AC マトリクスに「異常系で AC が崩れない」cross-check を引き継ぐ

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-04.md | 検証 3 軸ケース表 |
| 必須 | phase-05.md | 実装ランブック / sanity check |
| 必須 | `.github/workflows/verify-indexes.yml` | CI gate の正本仕様 |
| 必須 | `package.json` | `indexes:rebuild` script 定義 |
| 参考 | `.claude/skills/aiworkflow-requirements/indexes/` | 編集対象 3 ファイル |

---

## Failure Cases 網羅表

### 系統 1: `pnpm indexes:rebuild` 失敗

| ID | 症状 | 原因仮説 | リカバリ手順 | 検証コマンド |
| --- | --- | --- | --- | --- |
| F-RB-01 | rebuild が non-zero exit | rebuild script が依存する skill metadata の parse 失敗 | resource-map / quick-reference の Markdown 構文（表 / リスト / コードブロック）を strict に確認し、安全な anchor 末尾に追記し直す | `mise exec -- pnpm indexes:rebuild` exit 0 |
| F-RB-02 | rebuild は exit 0 だが topic-map に D1 トピックが現れない | resource-map の追記行が rebuild script の探索パターンに合致していない | 既存 D1 関連行のフォーマットを参照し、同形に揃える（例: 既存 entry が `\| D1 ... \|` 形式ならテーブル行に揃える） | `grep -i "d1" .claude/skills/aiworkflow-requirements/indexes/topic-map.md` |
| F-RB-03 | rebuild が冪等でない（毎回差分が出る） | rebuild が timestamp / 並び順を非決定的に出力 | rebuild script 側のバグ可能性が高い。Phase 3 へ戻り設計者と相談（本タスク scope 外） | `pnpm indexes:rebuild && pnpm indexes:rebuild && git status --porcelain .claude/skills/aiworkflow-requirements/indexes/` |
| F-RB-04 | `mise: command not found` | mise 未導入 / PATH 未通し | CLAUDE.md の「開発環境セットアップ」節に従い `mise install` を実行 | `mise --version` |

### 系統 2: CI gate `verify-indexes-up-to-date` fail

| ID | 症状 | 原因仮説 | リカバリ手順 | 検証コマンド |
| --- | --- | --- | --- | --- |
| F-CI-01 | PR 上で `verify-indexes-up-to-date` が red | rebuild 結果を commit していない | ローカルで `pnpm indexes:rebuild` 実行 → `git add .claude/skills/aiworkflow-requirements/indexes/topic-map.md` → 追加 commit / push | CI 再走で green |
| F-CI-02 | rebuild 済みなのに CI gate が red | CI 側の Node / pnpm バージョン不一致 | `.mise.toml` の Node 24.15.0 / pnpm 10.33.2 とローカル整合を確認 → mise 経由で再実行 | `mise exec -- node -v && mise exec -- pnpm -v` |
| F-CI-03 | resource-map の文言が CI 検査で fail | CI 側に resource-map の lint / schema 検査がある可能性 | `.github/workflows/verify-indexes.yml` の job 定義を読み、検査対象を特定して文言を整える | workflow ログ参照 |
| F-CI-04 | CI が「indexes drift detected」を報告 | rebuild の冪等性違反（F-RB-03 と同根）または編集 → rebuild 順序逆転 | ローカルで rebuild → status clean を確認 → push | `git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes/`（rebuild 後 / commit 後） |

### 系統 3: 既存文言と重複

| ID | 症状 | 原因仮説 | リカバリ手順 | 検証コマンド |
| --- | --- | --- | --- | --- |
| F-DUP-01 | resource-map に D1 関連 entry が既存 | 別 PR で先行追加済み | 既存 entry の内容を読み、本タスクの追記対象（runbook / scripts/d1 / d1-migration-verify.yml）が**全て**含まれているかを確認。不足があれば**既存行を拡張**する。完全に網羅済みなら本タスクの M-1 は noop と判定し、Phase 7 AC を「既存達成」として close | `grep -n -i "d1" .claude/skills/aiworkflow-requirements/indexes/resource-map.md` |
| F-DUP-02 | quick-reference に `d1:apply-prod` が既存 | 同上 | 既存 1 行の文字列が `bash scripts/cf.sh d1:apply-prod` を含むかを確認。含むなら M-2 は noop。含まないなら**置換**ではなく**末尾追記**で AC-2 grep を満たす | `grep -c "scripts/cf.sh d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes/quick-reference.md` |
| F-DUP-03 | M-1 / M-2 適用後に同義行が 2 行存在 | 重複検出を skip して追記してしまった | 後から追加した行を `git restore` で巻き戻し、既存行を拡張する戦略へ切替 | `grep -c "scripts/d1" .claude/skills/aiworkflow-requirements/indexes/resource-map.md` >= 1 かつ重複行なし |

---

## リカバリフロー（系統横断）

```
[失敗発生]
   │
   ├─ rebuild fail (F-RB-*) ──→ Markdown 構文 / フォーマット整合を確認 → 再 Edit → 再 rebuild
   │
   ├─ CI gate fail (F-CI-*) ──→ ローカル rebuild → 差分 commit/push → CI 再走
   │
   └─ 重複検出 (F-DUP-*) ────→ 既存 entry 拡張へ戦略切替 → M-1/M-2 を最小 diff に縮退
```

各経路で 2 回再試行しても解消しない場合は Phase 3（設計レビュー）に戻り、追記方針自体を見直す。

---

## CI gate ローカル等価チェック

`verify-indexes-up-to-date` job の意図を local で再現するための最小手順。

```bash
# 1. clean な作業ツリーで rebuild
git stash --include-untracked   # 必要なら退避
mise exec -- pnpm indexes:rebuild

# 2. rebuild 結果が HEAD と一致していることを確認（gate と等価）
git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes/
echo "exit: $?"   # 期待: 0

# 3. 一致しない場合は rebuild の差分を commit してから push
git add .claude/skills/aiworkflow-requirements/indexes/
git commit -m "chore: rebuild aiworkflow-requirements indexes"
```

> 本タスクの正常系では「Edit → rebuild → 一括 commit」の順序を厳守すれば F-CI-* には陥らない。

---

## 不変条件再検証（異常系）

| 不変条件 | 異常系での確認 |
| --- | --- |
| 不変条件 #5（apps/web → D1 直接禁止） | F-RB-* / F-CI-* / F-DUP-* いずれの異常系でも apps/web のコードに変更が波及しないこと（変更範囲が `.claude/skills/aiworkflow-requirements/indexes/` に閉じる） |
| CONST_005（DoD 明示） | 異常系リカバリ後も最終成果物が「resource-map に 1〜2 行 / quick-reference に 1 行 / topic-map 自動再生成」の DoD を満たすこと |
| DRY | F-DUP-* で重複行を作らないこと |

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | F-RB-* / F-CI-* / F-DUP-* が AC-3 / AC-5 の判定を崩さないことを cross-check |
| Phase 9 | CI gate ローカル等価チェックを quality gate コマンド集に組み込み |
| Phase 12 | F-DUP-* リカバリで「既存 entry 拡張」を選んだ場合は docs 同期で追記内容を再確認 |

---

## 多角的チェック観点（不変条件）

- CONST_005（**主検証**）: 異常系全件で DoD（1〜2 行 / 1 行 / 自動再生成）が崩れないこと
- 不変条件 #5（**副検証**）: 異常系で apps/web / apps/api コードに変更が波及しないこと
- DRY: F-DUP-* で重複行を作らない（既存拡張戦略を優先）
- YAGNI: 異常系のために新たな script / hook を追加しない（既存 `pnpm indexes:rebuild` と CI gate のみで完結）

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | rebuild 失敗 4 ケース確定 | 6 | completed | F-RB-01〜F-RB-04 |
| 2 | CI gate fail 4 ケース確定 | 6 | completed | F-CI-01〜F-CI-04 |
| 3 | 重複検出 3 ケース確定 | 6 | completed | F-DUP-01〜F-DUP-03 |
| 4 | リカバリフロー 3 経路明示 | 6 | completed | フロー図 |
| 5 | CI gate ローカル等価チェック手順確定 | 6 | completed | 3 step |
| 6 | 不変条件 #5 / CONST_005 異常系再確認 | 6 | completed | 主検証 / 副検証 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure cases 表 / リカバリフロー / CI gate 等価チェック / 不変条件再検証 |
| メタ | artifacts.json | Phase 6 を completed に更新 |

---

## 完了条件

- [ ] failure cases 表が 3 系統 × 合計 11 ケース以上で記述されている
- [ ] 各ケースで `症状 / 原因仮説 / リカバリ手順 / 検証コマンド` の 4 列が埋まっている
- [ ] リカバリフローが 3 経路（rebuild / CI / 重複）で記述されている
- [ ] CI gate ローカル等価チェックが 3 step で確定
- [ ] 不変条件 #5 主検証 / CONST_005 副検証が異常系全件で再確認済み

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-06/main.md` が指定パスに配置済み
- 完了条件 5 件すべてにチェック
- artifacts.json の phase 6 を completed に更新

---

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ事項: failure cases 表 / リカバリフロー / CI gate 等価チェック手順
- ブロック条件: 系統 1〜3 のいずれかで symptom / recovery が未確定の場合は Phase 7 に進まない
