# Phase 4: テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |

## 目的

workflow yml 変更タスクのため新規 unit test は不要。代替として、hard gate 化が機能することを確認する **検証シナリオ**（dry-run + 実 push 検証）を設計する。

## テスト方針

| カテゴリ | 採否 | 理由 |
| --- | --- | --- |
| 新規 unit test | ✗ | yml 編集のみ。テスト対象コードなし |
| coverage 計測 | ✓ | リポジトリ全体の coverage 維持を `bash scripts/coverage-guard.sh` で確認 |
| yml lint | ✓ | `yamllint` / `actionlint` で構文確認 |
| dry-run シナリオ | △ | 1 file の test を一時 skip して push し、`coverage-gate` job が **fail** することを確認（実施は Phase 11 で user 判断） |
| ポジティブ確認 | ✓ | 通常状態で push し、`coverage-gate` job が **pass** することを確認 |

## 検証シナリオ詳細

### シナリオ 1: ポジティブ確認（必須）

1. yml diff 適用後、本タスクブランチへ push
2. `gh run watch` で `coverage-gate` job が PASS することを確認
3. `gh run view <id> --log` で coverage-guard の exit 0 を確認

### シナリオ 2: ネガティブ dry-run（任意 / Phase 11 で user 判断）

1. `apps/web` 配下の小さい test ファイルを 1 件 `it.skip()` 化したコミットを別ブランチに作成
2. push して `coverage-gate` job が **fail** することを確認
3. 確認後、当該コミットを revert（main にはマージしない）

> ネガティブ dry-run は破壊的でないが CI 時間を消費するため、Phase 1 GO 判定時に実施可否を決め、`outputs/phase-1/go-no-go-decision.md` に記録する。

## 検証コマンド一覧

```bash
yamllint .github/workflows/ci.yml
# actionlint があれば
which actionlint && actionlint .github/workflows/ci.yml || echo "actionlint not installed (optional)"

grep -nE "continue-on-error" .github/workflows/ci.yml
gh workflow view ci.yml | head -80

bash scripts/coverage-guard.sh
```

## カバレッジ AC

- 本タスクの差分は yml のみのためコード差分由来の coverage 影響はない。
- ただし apps/api / apps/web / packages/* 全パッケージの全 metric ≥80% 維持を `bash scripts/coverage-guard.sh` exit 0 で確認すること。

## 成果物

- `outputs/phase-4/phase-4-test-design.md`（検証シナリオ + コマンド集）

## 完了条件

- [ ] 検証シナリオ 1（必須）/ 2（任意）の手順記載
- [ ] yamllint / grep / coverage-guard のコマンド明記
- [ ] coverage Statements / Branches / Functions / Lines ≥80%（全パッケージ）維持の AC 明記

## タスク 100% 実行確認【必須】

- [ ] テスト方針の採否理由がすべて記述されている
- [ ] dry-run の user 判断ゲートが明示されている

## 次 Phase

Phase 5（実装 / yml 編集）。
