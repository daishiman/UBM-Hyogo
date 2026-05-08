# Phase 10: 品質ゲート — task-07 prototype-mapping-table

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-07-prototype-mapping-table |
| phase | 10 / 13 |
| wave | w2-par |
| mode | parallel |
| 作成日 | 2026-05-07 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

[実装区分: ドキュメントのみ]
判定根拠: 本タスクの成果物は `docs/00-getting-started-manual/specs/09a-prototype-map.md` の新規作成のみで、アプリケーションコード変更・schema 変更・依存追加を伴わない。CONST_004 の例外条件（純粋にドキュメントで完結）に該当するため docs-only として作成。

## 目的

CI 互換 / pre-push hook 互換の品質ゲート閾値で `09a-prototype-map.md` を判定する。

## 品質ゲート

| ゲート | コマンド | 閾値 |
|--------|---------|------|
| markdown lint error | `mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09a-prototype-map.md` | 0 |
| §3 routes 行 | `bash scripts/verify-09a-prototype-line-ranges.sh` | exactly 19 |
| §6 行範囲台帳 | `grep -cE "^\\| .* \\| .*\\.jsx \\| L[0-9]" 09a` | 25+ |
| 不採用記述 | `grep -c "不採用" 09a` | 4+ |
| §5.1-5.8 見出し | `grep -cE "^### 5\\.[1-8]" 09a` | 8 |
| ファイル行数 | `wc -l 09a` | 360+ |
| verifier exit | `bash scripts/verify-09a-prototype-line-ranges.sh` | exit 0 |

## 実行タスク

1. 全ゲートを順に実行し、PASS / FAIL を outputs/phase-10/main.md に記録する。
2. FAIL 時は Phase 5 / 6 へ差戻し、修正後再実行する。
3. 全 PASS で Phase 11 受け入れ検証へ移る。

## 参照資料

- task-07 §6, §8 DoD
- Phase 8 verifier

## 依存 Phase 成果物参照

- Phase 5〜9 outputs
- `docs/00-getting-started-manual/specs/09a-prototype-map.md`
- `scripts/verify-09a-prototype-line-ranges.sh`

## 多角的チェック観点

- ゲート実行は read-only（spec を改変しない）
- markdown lint は project ルールに従う（行末空白 / heading 階層 / table 構文）
- verifier exit code が CI で捕捉可能

## サブタスク管理

- [ ] markdown lint 実行 → 0 error
- [ ] grep 系 5 ゲート実行
- [ ] wc -l ゲート実行 → 360+
- [ ] verifier 実行 → exit 0
- [ ] outputs/phase-10/main.md レポート

## 成果物

- outputs/phase-10/main.md

## 完了条件

- [ ] 全 7 ゲート PASS
- [ ] FAIL があった場合の差戻し記録

## 次 Phase への引き渡し

Phase 11 へ、品質ゲート全 PASS の `09a-prototype-map.md` を渡す。
