[実装区分: 実装仕様書]

# Phase 4: テスト戦略（NON_VISUAL 検証戦略）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | 7 |
| Mode | serial |
| 作成日 | 2026-05-04 |
| 前 Phase | 3 (設計レビューゲート) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | completed |
| Source Issue | #438 |
| 区分 | implementation / NON_VISUAL / scale: small |

---

## 目的

本タスクは aiworkflow-requirements skill の `indexes/` 3 ファイル（resource-map.md / quick-reference.md / topic-map.md）に対する**ドキュメント追記**であり、実行可能なコード変更は伴わない。
したがって従来の unit / integration / e2e テストは存在せず、代替として **「検証 = テスト」** を以下 3 軸で定義する。

1. **静的検証 (grep)**: 追記された文字列が指定 path に存在することを `grep` で機械検証
2. **再生成検証 (rebuild)**: `pnpm indexes:rebuild` 実行で `topic-map.md` が drift なしに再生成されること
3. **CI gate ローカル検証**: `verify-indexes-up-to-date` job 相当のチェックがローカルで PASS すること

これらをまとめて Phase 7 の AC マトリクスに 1:1 で接続する。

---

## 実行タスク

1. 検証 3 軸（grep / rebuild / CI gate）のケース表を作成
2. 各検証ケースで「実行コマンド / 期待出力 / 失敗時の戻り Phase」を確定
3. Phase 6 異常系（rebuild 失敗 / CI gate fail / 文言重複）への入口を明示
4. AC ↔ 検証コマンドの 1:1 対応を Phase 7 へ引き継ぐ叩き台とする

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 追記対象（D1 runbook + scripts + workflow 所在） |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 追記対象（`bash scripts/cf.sh d1:apply-prod` 1 行） |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | rebuild 対象（自動再生成） |
| 必須 | `.github/workflows/verify-indexes.yml` | CI gate 正本 |
| 必須 | `scripts/d1/` 配下 | 逆引き対象の本体 |
| 参考 | `.claude/skills/aiworkflow-requirements/SKILL.md` | skill 概要 |
| 参考 | `package.json` | `indexes:rebuild` script 定義 |

---

## 検証 suite 設計（3 軸）

### 軸 1: Static grep 検証（追記文言の存在確認）

| ID | 検証対象 | 実行コマンド | 期待値 |
| --- | --- | --- | --- |
| G-01 | resource-map に D1 migration runbook 所在追記 | `grep -c "d1-migration" .claude/skills/aiworkflow-requirements/indexes/resource-map.md` | `>= 1` |
| G-02 | resource-map に `scripts/d1/` 所在追記 | `grep -c "scripts/d1" .claude/skills/aiworkflow-requirements/indexes/resource-map.md` | `>= 1` |
| G-03 | resource-map に `.github/workflows/d1-migration-verify.yml` 所在追記 | `grep -c "d1-migration-verify.yml" .claude/skills/aiworkflow-requirements/indexes/resource-map.md` | `>= 1` |
| G-04 | quick-reference に `bash scripts/cf.sh d1:apply-prod` が 1 行存在 | `grep -c "scripts/cf.sh d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | `>= 1` |
| G-05 | topic-map に D1 関連トピックが反映されている | `grep -ci "d1" .claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `>= 1` |

> grep が 0 を返す（または exit 1）した場合、該当 G-id は fail と判定。Phase 5 の実装ランブックへ戻る。

### 軸 2: Indexes rebuild 検証

| ID | 検証ステップ | 実行コマンド | 期待 |
| --- | --- | --- | --- |
| R-01 | rebuild 前の clean 状態を確認 | `git status --porcelain .claude/skills/aiworkflow-requirements/indexes/` | 追記したファイルのみ modified |
| R-02 | rebuild 実行 | `mise exec -- pnpm indexes:rebuild` | exit code 0 |
| R-03 | rebuild 後 topic-map が再生成され、resource-map / quick-reference の追記行と整合 | `git diff -- .claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 追記内容に対応する diff のみ |
| R-04 | rebuild 後に冪等性を確認（再実行で diff が増えない） | `mise exec -- pnpm indexes:rebuild && git diff --stat .claude/skills/aiworkflow-requirements/indexes/` | 1 回目と同一の diff stat |

### 軸 3: CI gate ローカル検証

| ID | 検証ステップ | 実行コマンド | 期待 |
| --- | --- | --- | --- |
| C-01 | `verify-indexes.yml` が参照する rebuild script を直接実行 | `mise exec -- pnpm indexes:rebuild` | exit 0 |
| C-02 | rebuild 後に未コミット差分が無い（CI gate と同等） | `git diff --quiet -- .claude/skills/aiworkflow-requirements/indexes/` 実行後 `echo $?` | `0` |
| C-03 | act 等のローカル CI runner が利用可能なら workflow をローカル走行 | `act -W .github/workflows/verify-indexes.yml -j verify-indexes-up-to-date`（任意） | success |

> C-03 は `act` 未導入環境では skip 可。C-01 + C-02 が CI gate と論理的に等価なため必須は C-01 / C-02 のみ。

---

## 検証データ（fixture 相当）

本タスクに D1 fixture は不要。以下「ファイル状態 fixture」を sanity の代替とする。

| ファイル | 期待状態 |
| --- | --- |
| `resource-map.md` | 追記前 = 既存内容 / 追記後 = D1 runbook + scripts + workflow の 3 entry が 1〜2 行で集約されている |
| `quick-reference.md` | 追記前 = 既存内容 / 追記後 = `bash scripts/cf.sh d1:apply-prod` が独立 1 行で存在 |
| `topic-map.md` | rebuild 後に D1 トピックが自動列挙されている |

---

## 既存 indexes との重複検出

| 項目 | 確認コマンド | 期待 |
| --- | --- | --- |
| resource-map に D1 関連行が既に存在 | `grep -n "d1" .claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 既存行があれば**重複追記しない**（追記対象を再検討して Phase 5 へ） |
| quick-reference に `d1:apply-prod` が既に存在 | `grep -n "d1:apply-prod" .claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 既存があれば本タスクの追記は noop（Phase 6 異常系参照） |

---

## AC マトリクス（基礎・Phase 7 で完成）

| AC | 内容 | 紐付く検証 ID |
| --- | --- | --- |
| AC-1 | resource-map から D1 runbook / scripts / workflow が逆引きできる | G-01 / G-02 / G-03 |
| AC-2 | quick-reference に `bash scripts/cf.sh d1:apply-prod` が存在 | G-04 |
| AC-3 | `pnpm indexes:rebuild` が exit 0 で完了する | R-02 |
| AC-4 | rebuild が冪等（再実行で diff 増分なし） | R-04 |
| AC-5 | `verify-indexes-up-to-date` 相当のローカル検証が PASS | C-01 / C-02 |

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | G-01〜G-05 / R-01〜R-04 / C-01〜C-02 の実行コマンドを sanity check に組み込む |
| Phase 6 | rebuild 失敗 / CI gate fail / 重複文言の異常系フローを設計 |
| Phase 7 | 本 Phase の AC マトリクス基礎を完成版へ昇格 |
| Phase 9 | typecheck / lint と同列で indexes 検証を quality gate に組み込む |

---

## 多角的チェック観点（不変条件）

- 不変条件 #1（実フォーム schema をコードに固定しすぎない）: 本タスクは indexes 文書のみの変更のため影響なし
- 不変条件 #5（apps/web → D1 直接禁止）: 追記内容は D1 runbook の**所在を案内するのみ**であり、apps/web から D1 binding を露出させない
- CONST_005: 変更対象ファイル / コマンド / DoD（完了条件）が表形式で明示されていること
- DRY: resource-map の D1 関連行は 1 箇所に集約し、quick-reference は実行コマンド 1 行のみに留める

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | grep 検証 G-01〜G-05 ケース表確定 | 4 | completed | 文言存在チェック |
| 2 | rebuild 検証 R-01〜R-04 ケース表確定 | 4 | completed | 冪等性含む |
| 3 | CI gate ローカル検証 C-01〜C-03 確定 | 4 | completed | C-03 は任意 |
| 4 | 既存 indexes 重複検出手順確定 | 4 | completed | Phase 6 異常系入口 |
| 5 | AC ↔ 検証 ID 対応の Phase 7 引き継ぎ | 4 | completed | AC-1〜AC-5 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | 検証 3 軸ケース表 / fixture 状態 / 重複検出 / AC マトリクス基礎 |
| メタ | artifacts.json | Phase 4 を completed に更新 |

---

## 完了条件

- [ ] grep 検証 G-01〜G-05 が全件記述済み
- [ ] rebuild 検証 R-01〜R-04 が全件記述済み（冪等性検証含む）
- [ ] CI gate 検証 C-01〜C-02 が必須として確定（C-03 は任意明記）
- [ ] 既存 indexes 重複検出手順が 2 項目で記述されている
- [ ] AC マトリクス基礎（AC-1〜AC-5 ↔ 検証 ID）が Phase 7 へ引き継ぎ可能な粒度

---

## タスク100%実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-04/main.md` が指定パスに配置済み
- 完了条件 5 件すべてにチェック
- artifacts.json の phase 4 を completed に更新

---

## 次 Phase

- 次: 5 (実装ランブック)
- 引き継ぎ事項: 検証 3 軸ケース表 / 重複検出手順 / AC マトリクス基礎
- ブロック条件: G / R / C のいずれかが未確定の場合は Phase 5 に進まない
