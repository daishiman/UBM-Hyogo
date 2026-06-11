# Phase 10: Final Review（最終レビュー）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-2-to-3-major-upgrade |
| 前提 | phase-01〜phase-09 |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| 目的 | 全 AC の最終判定・MINOR 指摘の未タスク化判断・blocker エスカレーション判定 |

## 最終レビューの位置づけ

Phase 4〜9 で実装・テスト・カバレッジ・リファクタリング・QA を終えた成果物を、Phase 1 の受入条件（AC-1〜8）に照らして **合否を確定** する段階。本 Phase では新たな実装はせず、判定と申し送り（未タスク化 / エスカレーション）のみを行う。

> 本仕様書はあくまで「後続実装者が Phase 10 で何を判定するか」の判定基準を固定するものであり、判定の実行（実コマンド・実ログ採取）は後続の実装サイクルで行う。

## 受入条件（AC-1〜8）最終判定テーブル

判定の枠組みは「観点 | 判定 | 根拠」とし、後続実装者は実行結果（コマンド出力・ログ）を根拠列に記入して PASS/FAIL を確定する。

| AC | 観点 | 判定基準（PASS の条件） | 根拠に記載するもの |
| --- | --- | --- | --- |
| AC-1 | バージョン更新の完了 | root / apps/api / apps/og の `package.json` で `vitest` が `^3.2.6`、root の `@vitest/coverage-v8` が `^3.2.6` | 各 `package.json` の該当行 diff |
| AC-2 | lockfile 整合 | `pnpm-lock.yaml` で vitest が 3.2.6 系に解決され、`@vitest/coverage-v8` も同一バージョン | `pnpm why vitest` / `pnpm why @vitest/coverage-v8` 出力 |
| AC-3 | 型チェック green | `mise exec -- pnpm typecheck` が exit 0 | typecheck ログ末尾 |
| AC-4 | lint green | `mise exec -- pnpm lint` が exit 0 | lint ログ末尾 |
| AC-5 | CI 5 shard 相当 green | web / api-unit / api-d1 / packages / og の全 shard で fail がゼロ | shard 別実行結果（件数・green） |
| AC-6 | deprecation 警告ゼロ | vitest 実行ログに未対応の deprecation 警告（`deps.inline` / `workspace` 等）が残っていない | 警告 grep 結果（0 件） |
| AC-7 | D1 設計維持 | `vitest.d1.config.ts` の `pool: forks` / `singleFork: true` が維持され、port exhaustion なく完走 | api-d1 shard 完走ログ |
| AC-8 | skip 件数非増加 | テストの skip 件数がアップグレード前から増えていない | アップグレード前後の skip 件数比較 |

> 全 AC が PASS で初めて Phase 11 へ進む。1 件でも FAIL があれば、該当 Phase（4〜9）へ差し戻すか、下記 blocker 判定へ進む。

## 破壊的変更カテゴリ（C1〜C8）対応の最終確認

| カテゴリ | 確認観点 | PASS 基準 |
| --- | --- | --- |
| C1 エラー比較厳格化 | `toThrow`/`toThrowError`/`toEqual` の期待値修正が完了 | 該当 spec が green |
| C2 `vi.spyOn` 再利用 + `mockReset` | spy リセット前提テストの修正が完了 | 該当 spec が green |
| C3 fakeTimers 既定変更 | `nextTick`/`queueMicrotask` 依存箇所の `toFake` 明示が完了 | 該当 spec が green |
| C4 `deps.inline` 非推奨 | current config 未使用のため警告ゼロ | 警告 grep 0 件 |
| C5 `workspace` 非推奨 | current config 未使用のため警告ゼロ | 警告 grep 0 件 |
| C6 coverage `ignoreEmptyLines` | 閾値ゲートが green（実測ずれの範囲内調整のみ） | coverage gate green / 閾値低下なし |
| C7 `@vitest/*` 不一致警告 | vitest と coverage-v8 が完全同一バージョン | 不一致警告 0 件 |
| C8 test 第3引数オブジェクト非推奨 | 該当記法の有無を grep 確認、あれば修正 | 警告 0 件 / grep 結果記録 |

## MINOR 指摘 → 未タスク化ルールの確認

- Phase 10 レビュー前に `unassigned-task-guidelines`（task-specification-creator skill の未タスク判定基準）を確認し、MINOR 指摘を未タスク化するか即時修正するかを判断する。
- **本サイクルで修正できる MINOR は本サイクル内で修正する**（CONST_007 1サイクル完了原則）。先送りは原則しない。
- 1サイクル完了を破綻させない範囲外の改善（例: vitest 4.x 化 / vite の明示メジャーアップ）は、未タスク（baseline 候補）として Phase 12 の `unassigned-task-detection.md` に記録し、本 PR には含めない。
- MINOR 指摘は「指摘内容 | 即時修正 or 未タスク化 | 根拠」の形式で記録する。

## blocker 判定基準（エスカレーション）

Phase 3 のエスカレーション条件（CONST_007 例外の発火点）と整合させ、以下のいずれかを検知したら実装を止めてユーザーへエスカレーションする。

| blocker | 兆候 | アクション |
| --- | --- | --- |
| 大規模 fail | 単一の破壊的変更で数百件規模のテスト書き換えが必要（局所修正で収まらない） | 実装中断 → ユーザー確認（スコープ再設定の可否） |
| プロダクトコード巻き込み | プロダクトコード（`apps/*/src` / `packages/*/src`）の挙動変更なしには green にできない fail がある | 実装中断 → ユーザー確認（責務境界の例外可否） |
| 閾値低下 | coverage 閾値を実測ずれの範囲を超えて下げないと通らない | 実装中断 → ユーザー確認（品質低下の許容可否） |

> いずれも Phase 2/3 の調査では発生可能性は低い（C1〜C3 は期待値修正で解決する性質）。発火した場合のみ Phase 11 以降へ進まず停止する。

## 最終レビュー判定の記録形式

後続実装者は本 Phase の結論を以下のいずれかで記録する。

- **PASS**: 全 AC が PASS かつ blocker なし → Phase 11 へ進行。
- **CONDITIONAL**: MINOR 指摘ありだが即時修正で解消 → 修正後 PASS として進行。
- **BLOCKED**: blocker 検知 → 実装中断、ユーザーエスカレーション。

## 完了条件

- [ ] AC-1〜8 の最終判定テーブルが判定基準とともに記載されている
- [ ] 破壊的変更カテゴリ C1〜C8 の最終確認観点が記載されている
- [ ] MINOR 指摘 → 未タスク化ルール（unassigned-task-guidelines 確認）が記載されている
- [ ] blocker 判定基準（大規模 fail / プロダクトコード巻き込み / 閾値低下）が Phase 3 と整合して記載されている
- [ ] 最終レビュー判定の記録形式（PASS / CONDITIONAL / BLOCKED）が固定されている
