# Phase 10: 最終レビュー / GO・NO-GO 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SKILL.md の Progressive Disclosure 分割 (skill-ledger A-3) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-28 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke) |
| 状態 | spec_created |
| タスク分類 | docs-only / spec_created / NON_VISUAL（specification-design / final review gate） |

## 目的

Phase 1〜9 で蓄積した inventory / 分割設計 / 設計レビュー / 検証戦略 / 実装ランブック / 異常系 / AC マトリクス / DRY 化 / QA を横断レビューし、AC-1〜AC-11 すべての達成状態と 4 条件最終判定（PASS / MINOR / MAJOR）を確定する。**Phase 10 では実行せず判定基準の定義のみを行う**。実装フェーズ着手前に必要な blocker を一覧化し、ロールバック手順を最終確認する。本タスク特有の GO 条件として **`task-specification-creator/SKILL.md` の単独 PR による 200 行未満化完了** を必須化する。

## 依存境界

- 入力: Phase 7 AC マトリクス、Phase 8 DRY 化結果、Phase 9 QA 結果、index.md AC-1〜AC-11。
- 出力: `outputs/phase-10/go-no-go.md`（GO/NO-GO 判定 / blocker / ロールバック）。
- 非対象: 実コミット・PR・実装。Phase 10 は判定基準の定義のみ。

## 実行タスク

1. AC-1〜AC-11 を spec_created 視点で 4 列（AC / 達成状態 / 仕様確定先 / 判定）評価する（完了条件: 11 件すべてに判定が付与）。
2. 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定を確定する（完了条件: PASS / MINOR / MAJOR が一意に決定）。
3. blocker 一覧テンプレート（発生時の escalation 先付き）を作成する（完了条件: 5 件以上、各 blocker に解消条件と escalation 先が紐付き）。
4. ロールバック手順を最終確認する（完了条件: 1 PR = 1 skill 単位で revert 可能なことが手順化）。
5. GO / NO-GO 判定基準を確定し `outputs/phase-10/go-no-go.md` に記述する（完了条件: GO 4 条件 + NO-GO 条件が網羅）。
6. open question を Phase 11 / 12 へ送出する（完了条件: 受け皿 Phase が指定）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md | AC-1〜AC-11 / 完了判定 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-07.md | AC マトリクス |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-08.md | DRY 化 / スコープ境界 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-09.md | QA（無料枠 / 1 PR = 1 skill / ドッグフーディング） |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-12/implementation-guide.md | ロールバック戦略 |

## GO / NO-GO 判定基準（最終）

> spec_created 段階では「仕様が Phase 1〜9 で具体的に確定し、実装可能粒度に分解されているか」で判定する。実装そのものは未着手。

### GO 条件（すべて満たすこと）

- [ ] **対象 SKILL.md がすべて 200 行未満**（AC-1 / AC-6 PASS）
- [ ] **canonical / mirror 差分 0**（AC-5 PASS）
- [ ] **リンク切れ 0、未参照 reference 0**（AC-7 / AC-8 PASS）
- [ ] **`task-specification-creator/SKILL.md` 単独 PR が完了**（AC-9 PASS）
- [ ] **4 条件最終評価が全 PASS**（AC-11 PASS）
- [ ] AC-1〜AC-11 すべて PASS（条件付き PASS は許容）
- [ ] MAJOR が一つもない
- [ ] open question すべてに受け皿 Phase が指定済み
- [ ] blocker の解消条件が記述されている

### NO-GO 条件（一つでも該当）

- 4 条件のいずれかに MAJOR が残る
- AC のうち PASS でないものがある（条件付き PASS は除く）
- `task-specification-creator/SKILL.md` が 200 行を超えたまま
- canonical / mirror 差分が残る
- リンク切れまたは未参照 reference が 1 件以上
- MINOR を未タスク化せず本タスク内に抱え込む

## AC × 達成状態 マトリクス（spec_created 視点）

| AC | 内容（要約） | 達成状態 | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | 全対象 SKILL.md が 200 行未満 | 未実装だが仕様確定 | Phase 2 split-design / Phase 5 ランブック | PASS |
| AC-2 | references 単一責務命名 | 未実装だが仕様確定 | Phase 2 split-design | PASS |
| AC-3 | entry に 10 要素保持 | 未実装だが仕様確定 | Phase 2 / Phase 4 | PASS |
| AC-4 | 片方向参照 / 循環なし | 未実装だが仕様確定 | Phase 2 / Phase 8 依存グラフ | PASS |
| AC-5 | canonical / mirror 差分 0 | 未実装だが仕様確定 | Phase 5 rsync / Phase 9 | PASS |
| AC-6 | 行数検査 全 OK | 未実装だが仕様確定 | Phase 4 / Phase 7 | PASS |
| AC-7 | リンク切れ 0 | 未実装だが仕様確定 | Phase 4 / Phase 7 | PASS |
| AC-8 | 未参照 reference 0 | 未実装だが仕様確定 | Phase 4 / Phase 7 | PASS |
| AC-9 | task-specification-creator 単独 PR で 200 行未満 | 未実装だが仕様確定（最優先） | Phase 5 PR 計画 / Phase 9 ドッグフーディング | PASS |
| AC-10 | 「fragment で書け」「200 行を超えたら分割」Anchor 追記 | 未実装だが仕様確定（小 PR で別出し） | Phase 5 / Phase 9 | PASS |
| AC-11 | 4 条件最終判定 PASS | 本 Phase で確定 | 下記 4 条件評価 | PASS |

## 4 条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 並列 worktree の SKILL.md 編集衝突を構造的に消し、loader の context 消費も削減。ドッグフーディング矛盾（200 行超推奨 skill が自身を破る）を最優先解消。 |
| 実現性 | PASS | 機械的 cut & paste のみで完結。Cloudflare / Google API 不使用、無料枠影響なし（Phase 9）。`rsync --delete` + `diff -r` で mirror 同期が冪等的に成立。 |
| 整合性 | PASS | 1 PR = 1 skill 厳守、循環参照禁止、aiworkflow-requirements 等の既分割 skill はスコープ外。skill 横断の共通化は別タスク化。プロジェクト不変条件 #1〜#7 に touch しない。 |
| 運用性 | PASS | Phase 11 で `wc -l` / `rg` / `diff -r` の自動再現可能なログを残し、Phase 12 で skill 改修ガイドに Anchor を明記。再発防止策（skill-creator テンプレ整備）は別タスク化。 |

**最終判定: GO（PASS）**

## blocker 一覧テンプレート

| ID | blocker | 種別 | 解消条件 | escalation 先 |
| --- | --- | --- | --- | --- |
| B-01 | A-1（gitignore）完了 | 上流タスク | task-skill-ledger-a1-gitignore (Issue #129) が `completed` または受け皿が成立 | skill-ledger wave 管理 |
| B-02 | A-2（fragment）完了 | 上流タスク | task-skill-ledger-a2-fragment (Issue #130) が `completed`、render script が利用可能 | skill-ledger wave 管理 |
| B-03 | 並列で同 SKILL.md を編集する他タスク不在 | 環境前提 | 着手時点で対象 skill ごとに announce、競合タスクが無いことを目視確認 | skill 改修担当の self-coordination |
| B-04 | Phase 1 inventory が確定 | 内部前提 | `outputs/phase-01/main.md` に 200 行超 SKILL.md 一覧が記述 | 本タスク Phase 1 担当 |
| B-05 | `task-specification-creator/SKILL.md` 単独 PR の準備 | 実装前提 | Phase 5 ランブックで PR 計画が単独に分離されている | 本タスク Phase 5 担当 |
| B-06 | mirror 配置（`.agents/skills/<skill>/`）の存在確認 | 環境前提 | canonical 全 skill に対応する mirror が存在 | mirror セットアップ担当 |

> B-01 / B-02 が未完了の場合、本タスク Phase 11 着手は NO-GO。

## ロールバック手順の最終確認

1. **PR 単位 revert**: 1 PR = 1 skill 原則により、対象 skill の分割を `git revert <commit>` で 1 コミット粒度に戻せる。
2. **mirror 同期の戻し**: revert 後に `rsync -av --delete .claude/skills/<skill>/ .agents/skills/<skill>/` を再実行し `diff -r` で 0 を確認。
3. **Anchor 追記の独立 revert**: AC-10 の Anchor 追記は分割本体とは別 PR にしているため、単独で revert 可能。
4. **検証**: revert 後に `wc -l` で行数を再計測し、元の状態（200 行超）に戻ったことを確認（意図通りの巻き戻し）。
5. **影響範囲**: 他 skill / 他 PR には波及しない（1 PR = 1 skill 原則）。

## MINOR 判定の未タスク化方針

- 本タスク Phase 10 では **MINOR 判定なし**（4 条件すべて PASS）。
- 仮に Phase 11 / 12 で MINOR が発生した場合のルール:
  1. MINOR は **必ず未タスク化** する（本タスク内で抱え込まない）。
  2. `docs/30-workflows/unassigned-task/` 配下に新規 .md を作成し、原典として登録。
  3. Phase 12 の `unassigned-task-detection.md` に該当 ID を記載。
  4. skill 横断の共通 reference 抽出（Phase 8 で別タスク化したもの）は再発防止策として skill-creator テンプレ整備にまとめる。

## open question の Phase 振り分け

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | skill 横断の共通 reference 抽出 | Phase 12 unassigned-task-detection | 別タスク化 |
| 2 | skill-creator テンプレへの 200 行制約組込み | Phase 12 unassigned-task-detection | 別タスク化（再発防止策） |
| 3 | loader doctor 提供有無の最終確認 | Phase 11 manual smoke | 引き渡し |
| 4 | `.agents/skills/` mirror セットアップ漏れの検出 | Phase 11 manual smoke | 引き渡し |

## 実行手順

### ステップ 1: AC マトリクス再評価

- Phase 7 を基に 11 件すべてに達成状態を付与。

### ステップ 2: 4 条件最終判定

- Phase 3 の base case を継承し、Phase 9 QA 結果で再確認。

### ステップ 3: blocker 一覧作成

- 上流タスク 2 件 + 環境前提 2 件 + 内部前提 2 件 = 6 件以上。

### ステップ 4: ロールバック手順最終確認

- 5 ステップで revert → mirror 戻し → 検証を記述。

### ステップ 5: GO / NO-GO 判定確定

- `outputs/phase-10/go-no-go.md` に GO 9 条件 / NO-GO 6 条件を記述。

### ステップ 6: open question を次 Phase へ送出

## 多角的チェック観点

- 価値性: ドッグフーディング矛盾の解消が GO 条件として明記されているか。
- 実現性: 無料枠影響なしと 1 PR = 1 skill が GO 判定の前提として一貫しているか。
- 整合性: 不変条件（プロジェクト #1〜#7、skill-ledger 内 3 件）に touch しないことが再確認されているか。
- 運用性: ロールバックが 1 コミット粒度で完結するか。
- 認可境界: 本タスクは Secret / API を扱わないため認可境界の追加チェック不要。
- 判定の客観性: PASS / MINOR / MAJOR の判定が Phase 7〜9 の成果物にトレース可能か。

## 統合テスト連携

docs-only / spec_created のためアプリ統合テストは対象外。GO / NO-GO は Phase 4 の検証設計、Phase 9 の QA、Phase 11 の smoke 証跡が揃うことを前提に判定する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定 / AC マトリクス / 4 条件 / blocker / ロールバック |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] AC-1〜AC-11 全件に達成状態が付与
- [ ] 4 条件最終判定が PASS
- [ ] blocker 一覧に 5 件以上、各々に解消条件 + escalation 先が紐付き
- [ ] ロールバック手順が 5 ステップ以上で記述
- [ ] GO 9 条件 + NO-GO 6 条件が網羅
- [ ] MINOR 未タスク化方針が明文化
- [ ] open question すべてに受け皿 Phase 指定
- [ ] **GO 必須 4 条件**（200 行未満 / mirror 差分 0 / リンク切れ 0 + 未参照 0 / task-specification-creator 単独 PR 完了）が明示

## タスク 100% 実行確認【必須】

- 実行タスク 6 件すべて `spec_created`
- 成果物 `outputs/phase-10/go-no-go.md` 配置予定
- AC × 4 条件 × blocker × ロールバック × MINOR × GO/NO-GO × open question の 7 観点すべて記述
- ドッグフーディング検証（AC-9）が GO 必須条件として明示
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke)
- 引き継ぎ事項:
  - GO 判定（spec_created 段階）
  - blocker 6 件（実装着手前に再確認必須）
  - 検証コマンド（Phase 7 由来）→ Phase 11 で実測ログ取得
  - open question #3 / #4 を Phase 11 で消化
  - ロールバック手順 → Phase 13 PR description に転記
- ブロック条件:
  - 4 条件のいずれかが MAJOR
  - AC で PASS でないもの（条件付き PASS は除く）が残る
  - `task-specification-creator` 単独 PR の計画が崩れる
  - blocker B-01 / B-02（上流タスク）が未完了
