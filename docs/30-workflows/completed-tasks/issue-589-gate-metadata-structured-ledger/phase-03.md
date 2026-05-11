# Phase 3: 詳細レビュー / PASS·MINOR·MAJOR 判定 / Phase 4 GO 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| Source | `outputs/phase-3/phase-3.md` |
| 区分 | レビュー（実装なし。Phase 1-2 SSOT の妥当性 / 抜け漏れ / simpler alternative の最終確認） |
| 想定所要 | 0.25 人日 |

## 目的

Phase 1-2 で確定した SSOT・AC・モジュール配置・CI workflow を「PASS / MINOR / MAJOR」で判定し、MAJOR があれば Phase 1 or 2 へ戻し、MINOR は追跡テーブルに記録、PASS なら Phase 4 着手を GO とする。

## 実行タスク

1. **判定基準**

   | 区分 | 判定例 |
   | --- | --- |
   | PASS | schema フィールド・refine ロジック・validator 振る舞い・CI workflow が一貫しており、AC-1..AC-7 を満たす最小実装が見える |
   | MINOR | 命名揺れ / コメント不足 / dev 体験の小改善（Phase 5 中に解決可） |
   | MAJOR | schema が AC を満たせない / CI workflow が PR で発火しない / dependency owner 空欄 / 後方互換破壊 |

2. **PASS 判定対象（Phase 1-2 セクションごと）**

   | 対象 | 判定 | 理由 |
   | --- | --- | --- |
   | Phase 1 §2 schema フィールド表 | PASS | AC-1..AC-3 と 1:1 対応、refine 必要箇所が明示済み |
   | Phase 1 §3 validator 振る舞い | PASS | AC-4..AC-5 を満たし、後方互換（gates[] 不在 = WARN/skip）が明示 |
   | Phase 1 §4 AC-1..AC-7 | PASS | Phase 4 で TC-1..TC-N に 1:1 マッピング可能 |
   | Phase 2 §1 モジュール配置 | PASS | concern 数 2 で単一 phase ファイル基準内 |
   | Phase 2 §4 dependency matrix | PASS | owner / co-owner すべて埋まっている |
   | Phase 2 §5 CI workflow | PASS | trigger paths / steps / required status が確定 |
   | Phase 2 §6 validation matrix | PASS | 6 コマンド × 実行 phase が固定 |

3. **MINOR 追跡テーブル（phase-template-core.md §MINOR 追跡テーブル）**

   | MINOR ID | 指摘内容 | 解決予定Phase | 解決確認Phase | 備考 |
   | --- | --- | --- | --- | --- |
   | DOC-M-01 | `gate_id` 正規表現の Phase 5 実装時に JSDoc で正規表現の意図（カテゴリ階層を許容）を残す | Phase 5 | Phase 7 | コードレビュー時に確認 |
   | DOC-M-02 | validator stdout 集計フォーマットを Phase 11 evidence 用に固定（例: `OK: N WARN: N ERROR: N`） | Phase 5 | Phase 11 | NON_VISUAL evidence で参照 |
   | TEST-M-01 | `evidence_path` 実体確認の path traversal テスト（`../../../etc/passwd` 等の正規化）を Phase 4 TC に含める | Phase 4 | Phase 9 | Phase 7 セキュリティレビューと連動 |

4. **MAJOR 判定の不在確認**
   - schema が AC を満たせない: 不在（AC-1..AC-3 と schema フィールド表が 1:1 対応）。
   - CI workflow が PR で発火しない: 不在（trigger `paths` に `**/artifacts.json` が含まれる）。
   - dependency owner 空欄: 不在（Phase 2 §4 で全行に owner / co-owner を記載）。
   - 後方互換破壊: 不在（`gates[]` 不在を WARN/skip にすることで historical 保護）。

5. **simpler alternative の検討記録**

   | 検討した代替案 | 採用判定 | 理由 |
   | --- | --- | --- |
   | JSON Schema (Ajv) | 不採用 | repo 既存パターン（apps/web の zod）と非整合。学習コスト + 依存追加が増える |
   | shell + jq による検証 | 不採用 | refine（`status===passed && passed_at !== null`）の表現が困難、テスト容易性も劣る |
   | TypeScript 型のみ（runtime 検証なし） | 不採用 | artifacts.json は手書き or 別 task が生成するため runtime parse が必須 |
   | zod schema + tsx CLI | **採用** | repo 既存パターン整合、refine 表現容易、focused vitest と相性良し |

6. **Phase 4 開始 GO 条件 / Phase 13 blocked 条件**
   - **Phase 4 GO**: §2 PASS 全行 / §3 MINOR は追跡対象 / §4 MAJOR 不在 / §5 simpler alternative 検討済み。
   - **Phase 13 blocked**: local implementation wave で AC-1..AC-7 のいずれかが green にならない場合 / `verify-gate-metadata` workflow が actionlint clean にならない場合 / Issue #549 backfill が validator で ERROR を出す場合。

## 変更対象ファイル

本 Phase はレビューのみで実装ファイル変更なし。

## 入出力・副作用

- 入力: Phase 1 / Phase 2 SSOT。
- 出力: `outputs/phase-3/phase-3.md`（PASS / MINOR / MAJOR 判定 + MINOR 追跡 + simpler alternative + GO 判定）。
- 副作用: なし。

## テスト方針

本 Phase はテストコード追加なし。MINOR の TEST-M-01 を Phase 4 のテストケースに必ず含める。

## ローカル実行・検証コマンド

```bash
# Phase 1 / 2 outputs 存在確認
test -f docs/30-workflows/issue-589-gate-metadata-structured-ledger/phase-01.md && echo OK
test -f docs/30-workflows/issue-589-gate-metadata-structured-ledger/phase-02.md && echo OK
```

## 統合テスト連携

- Phase 4 はここで PASS 判定された AC-1..AC-7 を網羅する vitest TC を作成する。
- Phase 7 は MINOR DOC-M-01 / TEST-M-01 をコードレビュー時に再確認する。
- Phase 11 は MINOR DOC-M-02（stdout フォーマット）を NON_VISUAL evidence に記録する。

## 多角的チェック観点（AIが判断）

- **MAJOR の見落とし**: schema の `evidence_path` を絶対パスで誤って書いた場合 validator が path traversal される → §3 TEST-M-01 で対応済み。
- **後方互換と CI gate の両立**: `gates[]` 不在を WARN/skip すると `verify-gate-metadata` workflow を追加しても historical PR をブロックしない → 設計上 OK。

## サブタスク管理

- ST-1: PASS 判定対象 7 行のチェック
- ST-2: MINOR 3 件の追跡テーブル化
- ST-3: MAJOR 不在の確認
- ST-4: simpler alternative 4 案の比較記録
- ST-5: GO 判定根拠記録

## 成果物

- `outputs/phase-3/phase-3.md` に判定結果を記録（gate-decision.md と兼用）。

## 完了条件（DoD）

- [ ] §2 PASS 判定 7 行が確定している。
- [ ] §3 MINOR 追跡テーブル（DOC-M-01 / DOC-M-02 / TEST-M-01）が記録されている。
- [ ] §4 MAJOR 不在の根拠が記録されている。
- [ ] §5 simpler alternative 4 案の検討結果が記録されている。
- [ ] Phase 4 GO 判定 / Phase 13 blocked 条件が記録されている。

## タスク100%実行確認【必須】

- [ ] ST-1 ... ST-5 すべて完了
- [ ] `outputs/phase-3/phase-3.md` 生成済み
- [ ] Phase 4 着手 GO 判定済み

## 次Phase

[Phase 4: テストファースト](phase-04.md)

## 参照資料

- `docs/30-workflows/issue-589-gate-metadata-structured-ledger/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`
