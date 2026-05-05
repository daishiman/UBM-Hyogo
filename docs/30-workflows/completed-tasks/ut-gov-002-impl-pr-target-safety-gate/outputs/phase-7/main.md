# Phase 7 — カバレッジ確認（main）

## Status

spec_created

## 1. 目的

Phase 4 のテストマトリクス T-1〜T-5、Phase 6 の失敗ケース FC-1〜FC-8、index.md の AC-1〜AC-9、検証コマンド（actionlint / yq / grep / `gh run view --log` / `gh api`）、VISUAL evidence の **5 軸を交差させて、観点 coverage AC 9/9 = 100% を `outputs/phase-7/coverage.md` で宣言する**。本タスクは implementation だが、coverage 表は「観点 × テスト × 失敗ケース × 証跡」のクロス表として扱う。

## 2. 入力の継承

| 入力 | 用途 |
| --- | --- |
| `outputs/phase-4/test-matrix.md` §2 | T-1〜T-5（同 repo PR / fork PR / labeled / workflow_dispatch audit / re-run） |
| `outputs/phase-6/failure-cases.md` §1 | FC-1〜FC-8（MAJOR 7 / MINOR 1） |
| `outputs/phase-3/review.md` §3 / §4 | 5 箇条 / S-1〜S-6（VISUAL × AC 表の根拠） |
| `index.md` | AC-1〜AC-9（観点 coverage の分母） |
| `outputs/phase-5/runbook.md` Step 4〜7 | 検証コマンド × FC マトリクスの根拠 |

## 3. 成果物

- `outputs/phase-7/main.md`（本書）
- `outputs/phase-7/coverage.md`（3 マトリクス + カバレッジ穴の追補方針 + M-1〜M-3 + AC 9/9 = 100% 宣言）

## 4. 3 マトリクスの責務

| マトリクス | 軸 | 担保する観点 |
| --- | --- | --- |
| (1) シナリオ × FC | T-1〜T-5 × FC-1〜FC-8 | 各 FC が少なくとも 1 シナリオでカバーされていること |
| (2) コマンド × FC | actionlint / yq / grep / gh × FC-1〜FC-8 | 各 FC が少なくとも 1 コマンド（または運用確認）でカバーされていること |
| (3) VISUAL × AC | UI / branch protection / 各 run × AC-1〜AC-9 | VISUAL evidence が AC を網羅すること（特に AC-4 / AC-5） |

## 5. 完了条件

- [x] 3 マトリクスが coverage.md に記述される。
- [x] 全 FC が ≥ 1 シナリオ + ≥ 1 コマンド（または運用確認）でカバーされる。
- [x] カバレッジ穴ゼロ、または穴の追補先（test-matrix / failure-cases / Phase 12）が明示される。
- [x] M-1〜M-3（最低限実走必須）が選定される。
- [x] 観点 coverage AC 9/9 = 100% 宣言が記述される。
- [x] artifacts.json の Phase 7 status が `spec_created` で同期される（既同期）。

## 6. 次 Phase への引き継ぎ

- Phase 8 リファクタリングは coverage 結果（特にカバレッジ穴があれば before-after.md でカバーする差分を明示）を入力として使う。
- Phase 9 quality-gate G-1（AC 9/9 PASS）は本書の AC 9/9 = 100% 宣言を直接根拠化する。
- Phase 11 manual smoke は M-1〜M-3 を最低限実走必須として参照する。
