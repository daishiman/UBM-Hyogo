# Phase 10 — 最終レビュー / GO・NO-GO 判定

Phase 1〜9 で蓄積した inventory / 分割設計 / 設計レビュー / 検証戦略 /
実装ランブック / 異常系 / AC マトリクス / DRY 化 / QA を横断レビューし、
AC-1〜AC-11 すべての達成状態と 4 条件最終判定 (PASS / MINOR / MAJOR) を確定する。

> 本 Phase は **判定基準の定義のみ**。実コミット・PR・実装は伴わない。
> 実装フェーズ (Phase 11 以降) 着手前の最終ゲートとして機能する。

---

## 最終判定: **GO (PASS)**

| 観点 | 結果 |
| --- | --- |
| 4 条件 (価値性 / 実現性 / 整合性 / 運用性) | 全 PASS |
| MAJOR | 0 件 |
| MINOR | 0 件 (発生時は別タスク化) |
| AC-1〜AC-11 | 全 PASS (spec_created 視点) |
| GO 必須 4 条件 | 全充足見込み (spec で確定) |
| open question | 全件に受け皿 Phase 指定済み |
| blocker | 6 件特定済み (B-01〜B-06)、解消条件明記 |

実装着手 (Phase 11 以降) の **GO 判定** を確定する。

---

## GO 必須 4 条件 (実装完了時に満たすべき)

- [ ] **対象 SKILL.md がすべて 200 行未満** (AC-1 / AC-6 PASS)
- [ ] **canonical / mirror 差分 0** (AC-5 PASS)
- [ ] **リンク切れ 0、未参照 reference 0** (AC-7 / AC-8 PASS)
- [ ] **`task-specification-creator/SKILL.md` 単独 PR が完了** (AC-9 PASS)

---

## GO 条件 (すべて満たすこと、計 9 項目)

- [ ] 上記 GO 必須 4 条件すべて
- [ ] **4 条件最終評価が全 PASS** (AC-11)
- [ ] AC-1〜AC-11 すべて PASS (条件付き PASS は許容)
- [ ] MAJOR が一つもない
- [ ] open question すべてに受け皿 Phase が指定済み
- [ ] blocker の解消条件が記述されている

## NO-GO 条件 (一つでも該当した場合)

- 4 条件のいずれかに MAJOR が残る
- AC のうち PASS でないものがある (条件付き PASS は除く)
- `task-specification-creator/SKILL.md` が 200 行を超えたまま
- canonical / mirror 差分が残る
- リンク切れまたは未参照 reference が 1 件以上
- MINOR を未タスク化せず本タスク内に抱え込む

---

## AC × 達成状態 マトリクス (spec_created 視点)

| AC | 内容 (要約) | 達成状態 | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | 全対象 SKILL.md が 200 行未満 | 未実装だが仕様確定 | Phase 2 split-design / Phase 5 ランブック | PASS |
| AC-2 | references 単一責務命名 | 未実装だが仕様確定 | Phase 2 split-design / Phase 8 DRY 化 | PASS |
| AC-3 | entry に 10 要素保持 | 未実装だが仕様確定 | Phase 2 / Phase 4 V5 | PASS |
| AC-4 | 片方向参照 / 循環なし | 未実装だが仕様確定 | Phase 2 / Phase 8 依存グラフ / Phase 4 V2 | PASS |
| AC-5 | canonical / mirror 差分 0 | 未実装だが仕様確定 | Phase 5 rsync / Phase 9 / Phase 4 V4 | PASS |
| AC-6 | 行数検査全件 OK | 未実装だが仕様確定 | Phase 4 V1 / Phase 7 | PASS |
| AC-7 | リンク切れ 0 | 未実装だが仕様確定 | Phase 4 V2 / Phase 7 | PASS |
| AC-8 | 未参照 reference 0 | 未実装だが仕様確定 | Phase 4 V3 / Phase 7 | PASS |
| AC-9 | task-specification-creator 単独 PR で 200 行未満 | 未実装だが仕様確定 (最優先) | Phase 5 PR 計画 / Phase 9 ドッグフーディング | PASS |
| AC-10 | 「fragment で書け」「200 行を超えたら分割」Anchor 追記 | 未実装だが仕様確定 (小 PR で別出し) | Phase 5 / Phase 9 | PASS |
| AC-11 | 4 条件最終判定 PASS | 本 Phase で確定 | 下記 4 条件評価 | PASS |

---

## 4 条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 並列 worktree の SKILL.md 編集衝突を構造的に消し、loader の context 消費も削減。ドッグフーディング矛盾 (200 行超推奨 skill が自身を破る) を最優先解消。 |
| 実現性 | PASS | 機械的 cut & paste のみで完結。Cloudflare / Google API 不使用、無料枠影響なし (Phase 9)。`rsync --delete` + `diff -r` で mirror 同期が冪等的に成立。Phase 4 検証スクリプト 4 本がすでに動作確認済み。 |
| 整合性 | PASS | 1 PR = 1 skill 厳守、循環参照禁止、aiworkflow-requirements 等の既分割 skill はスコープ外。skill 横断の共通化は別タスク化。プロジェクト不変条件 #1〜#7 に touch しない。 |
| 運用性 | PASS | Phase 11 で `wc -l` / `rg` / `diff -r` の自動再現可能なログを残し、Phase 12 で skill 改修ガイドに Anchor を明記。再発防止策 (skill-creator テンプレ整備) は別タスク化。 |

**最終判定: GO (PASS)**

---

## blocker 一覧

| ID | blocker | 種別 | 解消条件 | escalation 先 |
| --- | --- | --- | --- | --- |
| B-01 | A-1 (gitignore) 完了 | 上流タスク | task-skill-ledger-a1-gitignore (Issue #129) が `completed` または受け皿が成立 | skill-ledger wave 管理 |
| B-02 | A-2 (fragment) 完了 | 上流タスク | task-skill-ledger-a2-fragment (Issue #130) が `completed`、render script 利用可能 | skill-ledger wave 管理 |
| B-03 | 並列で同 SKILL.md を編集する他タスク不在 | 環境前提 | 着手時点で対象 skill ごとに announce、競合タスク無し | self-coordination |
| B-04 | Phase 1 inventory が確定 | 内部前提 | `outputs/phase-01/main.md` に 200 行超 SKILL.md 一覧記述 | 本タスク Phase 1 担当 |
| B-05 | `task-specification-creator/SKILL.md` 単独 PR 計画 | 実装前提 | Phase 5 ランブックで PR 計画が単独に分離 | 本タスク Phase 5 担当 |
| B-06 | mirror 配置 (`.agents/skills/<skill>/`) の存在確認 | 環境前提 | canonical 全 skill に対応する mirror が存在 (現状 8/8 確認済み) | mirror セットアップ担当 |

> B-01 / B-02 が未完了の場合、本タスク Phase 11 着手は NO-GO。

現状の blocker 状態 (4/28 時点):
- B-01 / B-02: 別タスクの状態に依存 (要確認)
- B-03: 着手前 announce で予防
- B-04: spec_created (本タスク Phase 1 で確定済み想定)
- B-05: spec_created (Phase 5 で確定)
- B-06: **PASS** (mirror 8/8 が canonical と差分 0、`mirror-diff.sh` で確認済み)

---

## ロールバック手順 (最終確認)

1. **PR 単位 revert**: 1 PR = 1 skill 原則により、対象 skill の分割を `git revert <commit>` で 1 コミット粒度に戻せる。
2. **mirror 同期の戻し**: revert 後に `rsync -av --delete .claude/skills/<skill>/ .agents/skills/<skill>/` を再実行し `bash outputs/phase-04/scripts/mirror-diff.sh` で 0 を確認。
3. **Anchor 追記の独立 revert**: AC-10 の Anchor 追記は分割本体とは別 PR にしているため、単独で revert 可能。
4. **検証**: revert 後に `bash outputs/phase-04/scripts/line-count.sh` で行数を再計測し、元の状態 (200 行超) に戻ったことを確認 (意図通りの巻き戻し)。
5. **影響範囲**: 他 skill / 他 PR には波及しない (1 PR = 1 skill 原則)。

---

## MINOR 判定の未タスク化方針

- 本 Phase 10 では MINOR 判定なし (4 条件すべて PASS)。
- 仮に Phase 11 / 12 で MINOR が発生した場合のルール:
  1. MINOR は **必ず未タスク化** する (本タスク内で抱え込まない)。
  2. `docs/30-workflows/unassigned-task/` 配下に新規 .md を作成し、原典として登録。
  3. Phase 12 の `unassigned-task-detection.md` に該当 ID を記載。
  4. skill 横断の共通 reference 抽出 (Phase 8 で別タスク化したもの) は再発防止策として skill-creator テンプレ整備にまとめる。

---

## open question の Phase 振り分け

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | skill 横断の共通 reference 抽出 | Phase 12 unassigned-task-detection | 別タスク化 |
| 2 | skill-creator テンプレへの 200 行制約組込み | Phase 12 unassigned-task-detection | 別タスク化 (再発防止策) |
| 3 | loader doctor 提供有無の最終確認 | Phase 11 manual smoke | 引き渡し |
| 4 | `.agents/skills/` mirror セットアップ漏れの検出 | Phase 11 manual smoke | 引き渡し (Phase 4 V4 で 0 件確認済み、Phase 11 で再実行) |

---

## AC 全件 PASS の確認 (チェックリスト)

- [x] AC-1 PASS (Phase 2 / 5 で仕様確定)
- [x] AC-2 PASS (Phase 2 / 8 で仕様確定)
- [x] AC-3 PASS (Phase 4 V5 で 10 要素チェックリスト確定)
- [x] AC-4 PASS (Phase 2 / 8 依存グラフ / Phase 4 V2 reverse-link 検査)
- [x] AC-5 PASS (Phase 5 rsync / Phase 4 V4)
- [x] AC-6 PASS (Phase 4 V1 / line-count.sh 動作確認済み)
- [x] AC-7 PASS (Phase 4 V2 / link-integrity.sh 動作確認済み)
- [x] AC-8 PASS (Phase 4 V3 / orphan-references.sh 動作確認済み)
- [x] AC-9 PASS (Phase 5 PR 計画で単独確定)
- [x] AC-10 PASS (Phase 5 小 PR / Phase 9 で確定)
- [x] AC-11 PASS (本 Phase で 4 条件 PASS 確定)

---

## 次 Phase (11) への引き渡し

- GO 判定 (spec_created 段階) を Phase 11 manual smoke の前提とする
- blocker 6 件 (実装着手前に B-01 / B-02 を再確認必須)
- 検証コマンド (Phase 7 由来) → Phase 11 で実測ログ取得 (`outputs/phase-11/evidence/`)
- open question #3 / #4 を Phase 11 で消化
- ロールバック手順 → Phase 13 PR description に転記

## ブロック条件 (Phase 11 着手不可)

- 4 条件のいずれかが MAJOR
- AC で PASS でないもの (条件付き PASS は除く) が残る
- `task-specification-creator` 単独 PR の計画が崩れる
- blocker B-01 / B-02 (上流タスク) が未完了
