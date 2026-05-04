# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Mode | serial |
| 作成日 | 2026-05-04 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |
| Source Issue | #438（CLOSED 状態のままタスク仕様書化）|

---

## 目的

`aiworkflow-requirements` skill の `indexes/` 配下から、UT-07B-FU-03 で導入された
**D1 migration runbook + `scripts/d1/*.sh` + CI gate `.github/workflows/d1-migration-verify.yml`**
の所在を逆引きできるようにする最小差分のスコープを固定する。
references 本文や skill 全体構造への波及を一切起こさず、indexes 3 ファイル + 自動再生成のみに閉じることが本タスクの単一責務である。

---

## 実行タスク

1. UT-07B-FU-03 の close-out 出力（`outputs/phase-12/unassigned-task-detection.md` / `skill-feedback-report.md` / `system-spec-update-summary.md`）を読み、
   逆引き対象となる artifact の正本パスを確定する
2. 既存 `.claude/skills/aiworkflow-requirements/indexes/{resource-map,quick-reference,topic-map}.md` を読み、
   D1 / migration / runbook 系トピックの現行記載粒度を確認する
3. `references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` の存在と id / path を確認する
4. 変更対象ファイル一覧と「触らないファイル」境界を確定する
5. AC（受け入れ条件）を 4〜6 件に整理する
6. 4 条件（価値性・実現性・整合性・運用性）を仮判定する

---

## CONST_005 必須項目

### 変更対象ファイル一覧

| 種別 | パス | 変更種別 |
| --- | --- | --- |
| 手動編集 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 1〜2 行追記（D1 migration runbook + `scripts/d1/*.sh` + CI gate `d1-migration-verify.yml` 行）|
| 手動編集 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 1 行追記（`bash scripts/cf.sh d1:apply-prod`）|
| 自動再生成 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | `pnpm indexes:rebuild` で更新 |
| 触らない | `.claude/skills/aiworkflow-requirements/references/**` | 本文書き換え禁止 |
| 触らない | `apps/api/migrations/**` / `scripts/d1/**` / `scripts/cf.sh` | D1 migration 仕様変更は scope 外 |

### 関数または構造（追記対象の構造）

- `resource-map.md` のクイックルックアップ表（`タスク種別 / 最初に読む / 必要に応じて読む`）に
  「UT-07B-FU-03 production migration apply runbook（D1 migration / `scripts/d1` / `d1-migration-verify` gate）」行を 1 行追加
- `quick-reference.md` の所定セクション（D1 / migration / cloudflare 系の既存セクション、または末尾の新セクション）に
  `bash scripts/cf.sh d1:apply-prod` を 1 行で追加
- `topic-map.md` は `generate-index.js` の自動生成に任せる（手書きしない）

### 入出力

- 入力: 既存 indexes 3 ファイル + UT-07B-FU-03 references の正本パス
- 出力: 差分パッチ（手書き 2 ファイル + 自動再生成 1 ファイル）+ `outputs/phase-01/main.md`（本 Phase 成果物）

### テスト方針（ローカル実行コマンド）

```bash
# 1. indexes 自動再生成
mise exec -- pnpm indexes:rebuild

# 2. 逆引き経路の存在確認
rg "d1-migration-verify|scripts/d1|d1:apply-prod" \
  .claude/skills/aiworkflow-requirements/indexes

# 3. CI gate `verify-indexes-up-to-date` 相当のローカル再現
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes \
  || echo "再生成差分が残っている（commit 対象）"

# 4. 静的検証
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

`pnpm indexes:rebuild` 実行直後に再度 rebuild した結果が no-op（差分ゼロ）になれば、
CI gate `verify-indexes-up-to-date` がローカルで通る状態と判定する。

### ローカル実行コマンド（再生成のみ）

```bash
mise exec -- pnpm indexes:rebuild
```

### DoD（Definition of Done）

- [ ] `indexes/resource-map.md` から D1 migration runbook + `scripts/d1/*.sh` + `.github/workflows/d1-migration-verify.yml` の所在に到達できる
- [ ] `indexes/quick-reference.md` から `bash scripts/cf.sh d1:apply-prod` の使い方 1 行が見える
- [ ] `topic-map.md` が `pnpm indexes:rebuild` で再生成済みであり、再 rebuild 後に追加差分が出ない
- [ ] `references/` 本文に書き換えが入っていない（drift 範囲を indexes に閉じている）
- [ ] 手書き追記が合計 2〜3 行 / 2 ファイルの最小差分である
- [ ] `verify-indexes-up-to-date` 相当のローカル検証が PASS
- [ ] 機密値（API token / Account ID 等）が記述に含まれていない

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` | 本タスク発見元 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` | feedback#5（same-wave sync candidate）|
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | 追記対象 |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 追記対象 |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 自動再生成対象 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` | references 側の正本（参照のみ）|
| 参考 | `.github/workflows/verify-indexes.yml` | drift gate 実体 |
| 参考 | `.github/workflows/d1-migration-verify.yml` | 逆引き対象 CI gate |
| 旧スタブ | `docs/30-workflows/unassigned-task/task-ut-07b-fu-05-aiworkflow-skill-d1-runbook-reverse-index.md` | クローズアウト対象 |

---

## 実行手順

### ステップ 1: 上流 close-out の AC 引き継ぎ確認

- UT-07B-FU-03 の Phase 12 が完了し、references が main に merge 済みであることを確認する
- `references/workflow-ut-07b-fu-03-production-migration-apply-runbook-artifact-inventory.md` の id / path を取得する

### ステップ 2: 現行 indexes の粒度調査

- `rg "d1|migration|runbook" .claude/skills/aiworkflow-requirements/indexes` で既存記載を抽出
- 既存セクションの語彙（`scripts/d1`, `cf.sh d1:apply-prod`, `d1-migration-verify`）と整合する追記表現を仮置きする

### ステップ 3: AC 列挙

- AC-1: `resource-map.md` のクイックルックアップ表に UT-07B-FU-03 行が 1 行追加されている
- AC-2: その追加行から `scripts/d1/*.sh` / `.github/workflows/d1-migration-verify.yml` / production migration runbook の 3 artifact に到達できる
- AC-3: `quick-reference.md` に `bash scripts/cf.sh d1:apply-prod` 1 行が含まれる
- AC-4: `topic-map.md` が再生成済みで、再 rebuild が no-op
- AC-5: `references/**` の本文に diff が出ていない
- AC-6: 機密値（API token / Account ID 等）が追記に含まれない

### ステップ 4: 4 条件 仮判定

| 条件 | 問い | 判定（仮）|
| --- | --- | --- |
| 価値性 | indexes 経由で D1 runbook artifact を再発見できるようになるか | PASS（feedback#5 を formalize する直接効果）|
| 実現性 | 2 ファイル 2〜3 行の追記で完了するか | PASS（小規模・skill 構造に手を入れない）|
| 整合性 | references / topic-map / verify-indexes gate と矛盾しないか | TBD（Phase 2 で自動再生成挙動を確認）|
| 運用性 | 失敗時に indexes だけを差し戻せる経路が明確か | PASS（references / D1 仕様に波及しない）|

---

## 多角的チェック観点（不変条件）

- 不変条件 #5（apps/web → D1 直接禁止）: 本タスクは indexes 追記のみで apps/web のアクセス境界に触れない
- 不変条件 #6（GAS prototype 昇格禁止）: D1 runbook は本番運用ツールであり、GAS prototype と独立している
- skill DRY: references の同一情報を indexes に重複展開しない（指し示すパスのみを 1 行で書く）
- 機密管理: `bash scripts/cf.sh d1:apply-prod` のラッパー名のみ記載し、token / account id 値は書かない

---

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 追記する文言案・挿入位置・自動再生成設計を具体化 |
| Phase 3 | 既存 indexes との重複・整合・artifact inventory 対応をレビュー |
| Phase 5 | 実装ランブック（手追記 + `pnpm indexes:rebuild`）の手順固定 |
| Phase 11 | `verify-indexes-up-to-date` 相当のローカル検証 evidence |
| Phase 12 | 旧スタブ `unassigned-task/task-ut-07b-fu-05-...md` のクローズアウトと skill-feedback#5 の resolved マーク |

---

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | UT-07B-FU-03 close-out の AC 引き継ぎ確認 | 1 | completed | references id / path を確定 |
| 2 | indexes 3 ファイルの現行粒度調査 | 1 | completed | rg ベース |
| 3 | 変更対象ファイル一覧の確定 | 1 | completed | CONST_005 必須項目 |
| 4 | AC-1〜AC-6 列挙 | 1 | completed | Phase 7 マトリクスの base |
| 5 | 4 条件仮判定 | 1 | completed | Phase 10 で最終判定 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-01/main.md` | scope / 変更対象ファイル / AC-1〜AC-6 / 4 条件仮判定 / open question |
| メタ | `artifacts.json` | Phase 1 を completed に更新 |

---

## 完了条件

- [ ] `outputs/phase-01/main.md` が AC-1〜AC-6 を含めて書かれている
- [ ] 上流 UT-07B-FU-03 の references id / path が確定済み
- [ ] CONST_005 必須項目（変更対象ファイル / 関数または構造 / 入出力 / テスト方針 / ローカル実行コマンド / DoD）が全項目埋まっている
- [ ] 4 条件が「PASS / TBD」のいずれかで仮判定済み
- [ ] open question が 3 件未満

---

## タスク 100% 実行確認【必須】

- 全実行タスクが completed
- `outputs/phase-01/main.md` が指定パスに配置済み
- 完了条件 5 件すべてにチェック
- 上流 UT-07B-FU-03 が main 未 merge の場合は本タスクをブロックし、本 Phase で NO-GO 候補としてマーク
- artifacts.json の phase 1 を completed に更新

---

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: 変更対象ファイル一覧 / AC-1〜AC-6 / 4 条件仮判定 / open question / blocker 一覧
- ブロック条件: 上流 UT-07B-FU-03 references が未 merge、または既存 indexes に重複記載が見つかり「追記 vs 上書き」が決まらない場合は次 Phase に進まない

---

## 真の論点

- `resource-map.md` の表に追記するか、quick-reference の専用セクションに置くか（情報重複の最小化観点）
- `quick-reference.md` の「Cloudflare 系 / D1 系」既存セクションに混ぜるか、UT-07B-FU-03 専用ブロックを 1 つ追加するか
- `bash scripts/cf.sh d1:apply-prod` の表記は `scripts/cf.sh` のラッパー責務に従い CLI 直叩きを避ける旨を 1 行注記すべきか

---

## 依存境界

- 本タスクが触る: `.claude/skills/aiworkflow-requirements/indexes/{resource-map,quick-reference,topic-map}.md`
- 本タスクが触らない: `references/**` 本文 / D1 migration 実装 / `scripts/d1/*.sh` / `scripts/cf.sh` / `.github/workflows/d1-migration-verify.yml` の中身

---

## 価値とコスト

- 初回価値: skill 利用者が D1 migration runbook + scripts + CI gate を index 経由で逆引きできるようになり、references 全文検索を不要にする
- 初回で払わないコスト: skill 全体構造改修 / 他 workflow の reverse index / references 本文整備
