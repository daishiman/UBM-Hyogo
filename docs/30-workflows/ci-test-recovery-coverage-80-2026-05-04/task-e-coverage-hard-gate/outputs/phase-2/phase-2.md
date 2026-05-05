# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |

## 目的

`.github/workflows/ci.yml` の `coverage-gate` job を soft gate（warn-only）から hard gate（fail on miss）へ遷移させる **最小差分 yml diff** を確定する。

## 対象 topology

| concern | target | 編集タイプ |
| --- | --- | --- |
| job 全体の失敗伝播 | `.github/workflows/ci.yml` `jobs.coverage-gate.continue-on-error` | キー削除 |
| step 単位の失敗伝播 | `.github/workflows/ci.yml` `jobs.coverage-gate.steps[].continue-on-error`（`Run coverage-guard`） | キー削除 |
| inline comment | line 58 `PR1/3` / line 62 / line 96 の `PR1/3 → PR3/3` 更新 | コメント更新 |
| 仕様書 cross-ref | `scripts/coverage-guard.sh` 冒頭コメント / `coverage-80-enforcement/outputs/phase-12/implementation-guide.md` | 参照更新 |

## 採用 yml diff（後続実装エージェント適用用）

```diff
   coverage-gate:
-    # 仕様: docs/30-workflows/coverage-80-enforcement/outputs/phase-12/implementation-guide.md
-    # PR1/3: continue-on-error: true (soft gate / 警告のみ)。PR3/3 で削除して hard gate 化する。
+    # 仕様: docs/30-workflows/coverage-80-enforcement/outputs/phase-12/implementation-guide.md
+    # PR3/3: hard gate 化済。coverage 80% 未達時は CI を fail させる。
+    # 履歴: PR1/3 (soft gate, warn-only) → PR2/3 (閾値整備) → PR3/3 (本変更, hard gate)
     name: coverage-gate
     runs-on: ubuntu-latest
     needs: [ci]
-    continue-on-error: true
     steps:
       - uses: actions/checkout@v4
```

```diff
       - name: Run coverage-guard
         if: steps.ready.outputs.value == 'true'
-        # PR1/3: step レベルの continue-on-error も付与（job 全体を success 化）。PR3/3 で削除して hard gate 化。
-        continue-on-error: true
         env:
           CI: 'true'
         run: bash scripts/coverage-guard.sh
```

## 検証 matrix

| validation | command | 期待 |
| --- | --- | --- |
| yml syntax | `yamllint .github/workflows/ci.yml` | exit 0 |
| key 削除確認 | `grep -nE "continue-on-error" .github/workflows/ci.yml` | `coverage-gate` job 範囲内に hit なし |
| workflow view | `gh workflow view ci.yml` | `coverage-gate` 定義に continue-on-error なし |
| coverage 維持 | `bash scripts/coverage-guard.sh` | exit 0 |
| dry-run（任意） | 1 file の test を skip して push | `coverage-gate` job が **fail** することを確認（実施可否は Phase 1 GO 判定で決める） |

## DI 境界 / 設計分割判断

- 本タスクは workflow yml の最小 diff のみで concern 1 つ。`phase-2-design.md` を分割しない。
- `coverage-guard.sh` は本タスクで本体ロジック変更なし。冒頭 comment のみ仕様書 cross-ref 更新（必要時）。

## simpler alternative 検討

| 案 | 採否 | 理由 |
| --- | --- | --- |
| `continue-on-error: ${{ github.ref != 'refs/heads/main' }}` で main のみ hard | ✗ | dev/feature でも fail させて regression を未然防止する原則に反する。元仕様 PR3/3 の意図とずれる |
| job レベルだけ削除し step は残す | ✗ | step レベル continue-on-error が残ると job が success と判定され hard gate にならない。両方削除が必須 |
| `if: failure()` + `exit 1` を別 step で追加 | ✗ | 冗長。最小 diff 原則に反する |
| 採用案: job + step の両方から `continue-on-error: true` を削除 | ✓ | 元仕様 PR3/3 と一致、最小差分 |

## OAuth / DB / IPC 等の追加要件

- 該当なし（workflow yml のみ変更、ランタイム / DB / 認証への影響なし）

## 成果物

- `outputs/phase-2/phase-2-design.md`（採用 yml diff + validation matrix を含む完成版）

## 完了条件

- [ ] yml diff が job レベル + step レベル両方をカバー
- [ ] validation matrix 5 項目を記載
- [ ] simpler alternative 4 案検討記録
- [ ] coverage Statements / Branches / Functions / Lines ≥80%（全パッケージ）の維持を AC として明記
- [ ] `bash scripts/coverage-guard.sh` exit 0 を validation 必須に追加

## タスク 100% 実行確認【必須】

- [ ] yml diff が逐語適用可能な粒度
- [ ] inline comment 更新内容明示

## 次 Phase

Phase 3（アーキテクチャ確認）。
