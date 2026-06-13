# Phase 10: Final Review（最終レビュー）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-3-to-4-major-upgrade |
| 前提 | phase-09-quality-assurance.md（全 AC 検証済み） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| 目的 | 全 AC の最終判定・MINOR 指摘の未タスク化判断・blocker エスカレーション判定 |

## 最終レビューの位置づけ

Phase 4〜9 で実装・テスト・カバレッジ・リファクタリング・QA を終えた成果物を、Phase 1 の受入条件（AC-1〜AC-9）に照らして**合否を確定**する段階。本 Phase では新たな実装はせず、判定と申し送り（未タスク化 / エスカレーション）のみを行う。

> 本仕様書はあくまで「後続実装者が Phase 10 で何を判定するか」の判定基準を固定するものであり、判定の実行（実コマンド・実ログ採取）は後続の実装サイクルで行う。

## 受入条件（AC-1〜AC-9）最終判定テーブル

判定の枠組みは「観点 | 判定 | 根拠」とし、後続実装者は実行結果（コマンド出力・ログ）を根拠列に記入して PASS/FAIL を確定する。

| AC | 観点 | 判定基準（PASS の条件） | 根拠に記載するもの |
| --- | --- | --- | --- |
| AC-1 | バージョン更新の完了 | root の `vitest` / `@vitest/coverage-v8` が `^4.1.8`、`@vitejs/plugin-react` が `^5.2.0`、apps/api・apps/og の `vitest` が `^4.1.8` | 各 `package.json` の該当行 diff |
| AC-2 | lockfile 整合 / parity ×4 | vitest と coverage-v8 が同一 4.1.x（exact 一致）、vite が ^6/^7/^8 範囲、plugin-react の peer 警告なし | `pnpm why` ×4 の出力（`outputs/phase-11/version-parity.txt`） |
| AC-3 | 型チェック green | `mise exec -- pnpm typecheck` が exit 0 | typecheck ログ末尾 |
| AC-4 | lint green | `mise exec -- pnpm lint` が exit 0 | lint ログ末尾 |
| AC-5 | CI 5 shard 相当 + 補助 suite green | web / api-unit / api-d1 / packages / og + scripts / alerts / sentry-alerts / infra の全てで fail がゼロ | shard 別実行結果（件数・green） |
| AC-6 | deprecation 警告ゼロ | vitest 実行ログに未対応の deprecation 警告（v4.1 の `vitest/*` エントリポイント / spy `toBe*` 系 / `vi.mock` トップレベル外）が残っていない、または対応不要と分類記録されている | 警告 grep 結果 + Phase 8 の分類記録 |
| AC-7 | D1 直列化設計の維持 | `vitest.d1.config.ts` が `pool: "forks"` + `maxWorkers: 1`（`isolate: false` 不採用）で、port exhaustion なく完走 | api-d1 shard 完走ログ + config grep 結果 |
| AC-8 | skip 非増加 + obsolete snapshot 0 件 | skip 件数が Phase 4 baseline から増えておらず、obsolete snapshot が 0 件 | 前後の skip 件数比較 + obsolete grep 結果 |
| AC-9 | 破壊的変更の分類記録 | C1-C8（v4 版）の分類記録と対応差分が `outputs/` に残っている | outputs/ のファイル一覧と記録内容 |

> 全 AC が PASS で初めて Phase 11 へ進む。1 件でも FAIL があれば、該当 Phase（4〜9）へ差し戻すか、下記 blocker 判定へ進む。

## 破壊的変更カテゴリ（C1-C8 v4 版）対応の最終確認

| カテゴリ | 確認観点 | PASS 基準 |
| --- | --- | --- |
| C1 pool API 全面改修 | `vitest.d1.config.ts` の v4 等価書換 + `--minWorkers=1` 削除が完了 | d1 shard 完走 / config grep で `poolOptions` / `singleFork` / `minWorkers` 残存ゼロ |
| C2 coverage AST remapping | 閾値ゲートが green（実測ずれの範囲内調整のみ・証跡あり） | coverage:guard green / Phase 7 実測 diff 記録 |
| C3 mock/spy 挙動変更 | spy リセット・呼出順序・constructor 呼出前提テストの修正が完了 | 該当 spec が green |
| C4 snapshot 挙動変更 | 機械的差分の更新（diff 目視済み）+ obsolete 残骸清掃が完了 | 該当 spec green / obsolete 0 件 |
| C5 plugin-react × vite peer 整合 | root の plugin-react が `^5.2.0` で peer 警告なし | install ログに peer 警告 0 件 |
| C6 `test.exclude` デフォルト簡素化 | 実影響なし（自前全列挙済み）の記録 | 記録のみ（grep 不要） |
| C7 `@vitest/*` exact pin | vitest と coverage-v8 が完全同一バージョン | parity ログで一致 / 不一致エラー 0 件 |
| C8 削除/改名オプション残党 | `workspace` / `poolMatchGlobs` / `deps.inline` 等の未使用確認 | grep 結果 0 件の記録 |

## MINOR 指摘 → 未タスク化ルールの確認

- **Phase 10 レビュー前に `unassigned-task-guidelines`（task-specification-creator skill の未タスク判定基準）を確認**し、MINOR 指摘を未タスク化するか即時修正するかを判断する。
- **本サイクルで修正できる MINOR は本サイクル内で修正する**（CONST_007 1サイクル完了原則）。先送りは原則しない。
- 1サイクル完了を破綻させない範囲外の改善（例: vitest 5.x 化 / vite の明示メジャーアップ = followup-002）は、未タスク（baseline 候補）として Phase 12 の `unassigned-task-detection.md` に記録し、本 PR には含めない。
- MINOR 指摘は「指摘内容 | 即時修正 or 未タスク化 | 根拠」の形式で記録する。

## blocker 判定基準（エスカレーション / phase-03 の 4 条件の最終確認）

Phase 3 のエスカレーション条件（CONST_007 例外の発火点）と整合させ、以下のいずれかを検知したら実装を止めてユーザーへエスカレーションする。

| blocker | 兆候（phase-03 対応条件） | アクション |
| --- | --- | --- |
| 大規模 fail | 単一の破壊的変更で**数百件規模**のテスト書き換えが必要（局所修正で収まらない）（条件1） | 実装中断 → ユーザー確認（スコープ再設定の可否） |
| プロダクトコード巻き込み | プロダクトコード（`apps/*/src` / `packages/*/src`）の挙動変更なしには green にできない fail がある（snapshot が実挙動変化を示す場合を含む）（条件2） | 実装中断 → ユーザー確認（責務境界の例外可否） |
| 閾値低下 | coverage 閾値を実測ずれの範囲（目安: shard あたり 2pt 級）を超えて下げないと通らない（条件3） | 実装中断 → ユーザー確認（品質低下の許容可否） |
| D1 直列化の再設計 | `maxWorkers: 1` 単独で port exhaustion が再発する、または D1 shard が実行環境を整えても完走しない | 実装中断 → ユーザー確認（直列化設計の再設計可否） |

> いずれも Phase 2/3 の調査では発生可能性は低い（C1/C5/C7 は確定済みの機械的修正、C2-C4 は期待値/snapshot 修正で解決する性質）。発火した場合のみ Phase 11 以降へ進まず停止する。

## 最終レビュー判定の記録形式

後続実装者は本 Phase の結論を以下のいずれかで記録する。

- **PASS**: 全 AC が PASS かつ blocker なし → Phase 11 へ進行。
- **CONDITIONAL**: MINOR 指摘ありだが即時修正で解消 → 修正後 PASS として進行。
- **BLOCKED**: blocker 検知 → 実装中断、ユーザーエスカレーション。

## 完了条件

- [ ] AC-1〜AC-9 の最終判定テーブルが判定基準とともに記載されている
- [ ] 破壊的変更カテゴリ C1-C8（v4 版）の最終確認観点が記載されている
- [ ] MINOR 指摘 → 未タスク化ルール（Phase 10 レビュー前の unassigned-task-guidelines 確認）が記載されている
- [ ] blocker 判定基準が phase-03 のエスカレーション 4 条件と整合して記載されている
- [ ] 最終レビュー判定の記録形式（PASS / CONDITIONAL / BLOCKED）が固定されている

---

## 目的

この Phase の目的は、上位 workflow `vitest-3-to-4-major-upgrade` の実装仕様を次の Phase へ矛盾なく引き渡すことである。既存本文の詳細記述を正本とし、本補助セクションは task-specification-creator validator 用の構造見出しを補う。

## 実行タスク

- 既存本文に記載された手順・表・チェック項目を、この Phase の実行タスクとして扱う。
- 実装前の `spec_created` 状態では、ここに列挙したタスクは実装サイクルで実行する。
- commit / push / PR / Issue mutation は Phase 13 の user gate まで実行しない。

## 参照資料

- `phase-09-quality-assurance.md`, `outputs/phase-11/manual-test-result.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル: `phase-10-final-review.md`
- 後続 Phase が参照する判断・コマンド・証跡パスの確定情報
- 実装サイクルで更新される場合は、`artifacts.json` と `outputs/artifacts.json` の parity を維持する。
