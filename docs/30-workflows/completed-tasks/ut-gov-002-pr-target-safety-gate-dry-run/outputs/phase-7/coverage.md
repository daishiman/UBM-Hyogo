# Phase 7 — カバレッジマトリクス（coverage）

## Status

spec_created

> 本書は **観点 coverage**（AC × 観点）を扱う。実走 coverage は後続実装タスクが Phase 9 quality-gate に集約する。

## 1. 入力の継承

- `outputs/phase-4/test-matrix.md` — T-1〜T-5、F-1〜F-4
- `outputs/phase-5/runbook.md` — Step 4 / 5 / 6 検査コマンド
- `outputs/phase-6/failure-cases.md` — FC-1〜FC-11
- `outputs/phase-3/review.md` — S-1〜S-5、NO-GO N-1〜N-3
- `index.md` — AC-1〜AC-9

## 2. 観点定義

| 観点群 | 内訳 | 出典 |
| --- | --- | --- |
| **T** dry-run シナリオ | T-1: same-repo PR build/test、T-2: fork PR build/test、T-3: fork PR triage、T-4: labeled trigger、T-5: scheduled / re-run | Phase 4 test-matrix.md §2 |
| **FC** 失敗ケース | FC-1〜FC-11 | Phase 6 failure-cases.md §2 |
| **S** security 観点 | S-1: secrets 棚卸し、S-2: GITHUB_TOKEN scope、S-3: `actions: write` 監査、S-4: SHA pin、S-5: triage allowlist | Phase 3 review.md §4 |
| **N** NO-GO 条件 | N-1: 親タスク継承欠落、N-2: UT-GOV-001 未適用、N-3: UT-GOV-007 未適用 | Phase 3 review.md §2 |

## 3. AC × 観点 2 次元マトリクス

凡例: ✓ = 該当観点で AC をカバー、空欄 = 非該当。

### 3.1 T 系（dry-run シナリオ）

| AC | T-1 | T-2 | T-3 | T-4 | T-5 |
| --- | :-: | :-: | :-: | :-: | :-: |
| AC-1（pull_request_target に PR head checkout / code exec が無い） |  |  | ✓ | ✓ |  |
| AC-2（untrusted build を pull_request 分離・contents: read） | ✓ | ✓ |  |  |  |
| AC-3（fork PR で token / secret 露出ゼロ） |  | ✓ | ✓ | ✓ | ✓ |
| AC-4（pwn request 非該当根拠） | ✓ | ✓ | ✓ | ✓ | ✓ |
| AC-5（permissions {} ＋ persist-credentials false） | ✓ | ✓ | ✓ | ✓ | ✓ |
| AC-6（親タスク Phase 2 §6 input 継承） |  |  |  |  |  |
| AC-7（docs-only / NON_VISUAL 固定） |  |  |  |  |  |
| AC-8（dry-run 実走非対象） |  |  |  |  |  |
| AC-9（単一 revert ロールバック） |  |  |  |  | ✓ |

### 3.2 FC 系（失敗ケース）

| AC | FC-1 | FC-2 | FC-3 | FC-4 | FC-5 | FC-6 | FC-7 | FC-8 | FC-9 | FC-10 | FC-11 |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| AC-1 | ✓ |  |  |  |  |  | ✓ | ✓ |  |  |  |
| AC-2 |  |  | ✓ |  |  |  |  |  |  |  | ✓ |
| AC-3 |  |  |  | ✓ | ✓ |  |  |  | ✓ | ✓ |  |
| AC-4 | ✓ |  |  | ✓ | ✓ | ✓ |  |  |  |  |  |
| AC-5 |  | ✓ | ✓ |  |  |  |  |  |  |  | ✓ |
| AC-6 |  |  |  |  |  |  |  |  |  |  |  |
| AC-7 |  |  |  |  |  |  |  |  |  |  |  |
| AC-8 |  |  |  |  |  |  |  |  |  |  |  |
| AC-9 |  |  |  |  |  |  |  |  |  |  |  |

### 3.3 S 系（security 観点）/ N 系（NO-GO）

| AC | S-1 | S-2 | S-3 | S-4 | S-5 | N-1 | N-2 | N-3 |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| AC-1 |  |  |  |  | ✓ |  |  |  |
| AC-2 |  | ✓ |  |  |  |  |  |  |
| AC-3 | ✓ |  | ✓ |  | ✓ |  |  |  |
| AC-4 | ✓ |  |  | ✓ | ✓ |  |  |  |
| AC-5 |  | ✓ | ✓ |  |  |  |  |  |
| AC-6 |  |  |  |  |  | ✓ |  |  |
| AC-7 |  |  |  |  |  |  |  |  |
| AC-8 |  |  |  |  |  |  |  |  |
| AC-9 |  |  |  |  |  |  | ✓ | ✓ |

## 4. 重複カバレッジ整理（役割分担）

| AC | 主担保 | 副担保 | 役割分担 |
| --- | --- | --- | --- |
| AC-3 | T-2 / T-3（dry-run 動的） | FC-4 / FC-5 / FC-9 / FC-10、S-1 / S-3 / S-5 | T 系で「期待挙動」、FC 系で「失敗時検出」、S 系で「設計上の保証」 |
| AC-4 | 全 T | FC-1 / FC-4 / FC-5 / FC-6、S-1 / S-4 / S-5 | T 系で運用上の非該当、FC 系で侵入検出、S 系で監査根拠 |
| AC-5 | 全 T | FC-2 / FC-3 / FC-11、S-2 / S-3 | T 系で正常時、FC 系で違反検出、S 系で scope 設計 |

役割が重複していても、各観点群が異なるレイヤ（仕様 / 検出 / 監査）で AC を踏むため許容する。

## 5. メタ AC（AC-6 / AC-7 / AC-8）のカバレッジ

T / FC で踏まないが、本タスク全体の構造で担保される：

| AC | カバレッジ |
| --- | --- |
| AC-6（親タスク継承） | Phase 1 §1 / Phase 2 §1 / Phase 3 §0 / 本書 §1 / N-1（NO-GO 条件） |
| AC-7（docs-only / NON_VISUAL 固定） | `index.md` メタ情報 / `artifacts.json.metadata` / 全 phase 冒頭 Status |
| AC-8（dry-run 実走非対象） | `index.md` Decision Log / Phase 1 §5 非スコープ / Phase 4 test-matrix.md §4 注記 / Phase 5 runbook 冒頭 / Phase 13 |

## 6. カバレッジ穴

調査の結果、AC-1〜AC-9 すべてが少なくとも 1 観点で踏まれている。**カバレッジ穴ゼロ**。

| AC | カバー観点数 | 状態 |
| --- | :-: | --- |
| AC-1 | 5（T-3 / T-4 / FC-1 / FC-7 / FC-8 / S-5） | OK |
| AC-2 | 4（T-1 / T-2 / FC-3 / FC-11 / S-2） | OK |
| AC-3 | 9（T-2 / T-3 / T-4 / T-5 / FC-4 / FC-5 / FC-9 / FC-10 / S-1 / S-3 / S-5） | OK |
| AC-4 | 9（全 T / FC-1 / FC-4 / FC-5 / FC-6 / S-1 / S-4 / S-5） | OK |
| AC-5 | 8（全 T / FC-2 / FC-3 / FC-11 / S-2 / S-3） | OK |
| AC-6 | 1（N-1 + メタ参照） | OK |
| AC-7 | メタ参照のみ | OK |
| AC-8 | メタ参照のみ | OK |
| AC-9 | 3（T-5 / N-2 / N-3） | OK |

## 7. 最低限実走必須項目（M-1〜M-3）

> 「観点だけ揃って実走証跡がない」状態を防ぐため、後続実装タスクが Phase 9 quality-gate で **必ず実走証跡を残すべき** 3 項目を選定。

| ID | 内容 | 該当観点 | 証跡パス |
| --- | --- | --- | --- |
| **M-1** | same-repo PR の dry-run 実走（build/test が green、secrets 非参照） | T-1 / AC-2 / AC-5 | `outputs/phase-9/quality-gate.md` の "M-1" セクション |
| **M-2** | fork PR の dry-run 実走（build/test 起動、triage が PR head 非 checkout） | T-2 / T-3 / AC-1 / AC-3 / AC-4 | `outputs/phase-11/manual-smoke-log.md` の "M-2" セクション |
| **M-3** | `gh run view <id> --log \| grep -iE 'secret\|GITHUB_TOKEN\|aws_\|cloudflare_api_token\|op://'` が 0 件 | 全 T / FC-4 / FC-5 / AC-3 | `outputs/phase-9/quality-gate.md` の "M-3" セクション |

> M-1〜M-3 は Phase 9 quality-gate の MAJOR 0 件条件と並列の必須要件。

## 8. カバレッジ宣言

- 観点 coverage = **AC 9 / 9 = 100%**
- カバレッジ穴 = **0**
- 最低限実走必須 = **M-1 / M-2 / M-3**

## 9. 完了条件

- [x] AC × 観点の 2 次元マトリクスが §3 に作成されている。
- [x] カバレッジ穴がゼロ（§6）。
- [x] 最低限実走必須 M-1〜M-3 が §7 に選定されている。
- [x] 観点 coverage が AC 9/9 = 100% で §8 に宣言されている。
- [x] Phase 5 runbook を input として §1 で明示している。
