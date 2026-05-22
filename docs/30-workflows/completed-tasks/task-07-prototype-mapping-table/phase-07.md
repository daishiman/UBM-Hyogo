# Phase 7: テスト設計 — task-07 prototype-mapping-table

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-07-prototype-mapping-table |
| phase | 7 / 13 |
| wave | w2-par |
| mode | parallel |
| 作成日 | 2026-05-07 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

[実装区分: ドキュメントのみ]
判定根拠: 本タスクの成果物は `docs/00-getting-started-manual/specs/09a-prototype-map.md` の新規作成のみで、アプリケーションコード変更・schema 変更・依存追加を伴わない。CONST_004 の例外条件（純粋にドキュメントで完結）に該当するため docs-only として作成。

## 目的

task-07 §6 のテスト方針を本タスクの検証戦略として確定する。markdown 構造検証 / 行範囲整合 / 派生ルール網羅 / 不採用記述 の 4 軸を Phase 8 のテスト実装に渡す。

## テスト軸

### 7.1 markdown 構造検証

| 検証項目 | 方法 | 期待値 |
|---------|------|--------|
| §3 routes 行が 19 行 | `bash scripts/verify-09a-prototype-line-ranges.sh` | exactly 19 |
| §6 行範囲台帳が 25 行以上 | `grep -cE "^\| .* \| .*\\.jsx \| L[0-9]" specs/09a-prototype-map.md` | 25+ |
| 各 jsx ファイル名が出現 | `grep -c "pages-public.jsx" ...` | 5+ |
| §3.1〜§3.4 サブセクション存在 | `grep -cE "^### 3\\." specs/09a-prototype-map.md` | 4 |
| §5.1〜§5.8 サブセクション存在 | `grep -cE "^### 5\\.[1-8]" specs/09a-prototype-map.md` | 8 |

### 7.2 行範囲整合（task-07 §6.2）

```bash
F=docs/00-getting-started-manual/specs/09a-prototype-map.md
PROTO=docs/00-getting-started-manual/claude-design-prototype

# LandingPage L4-L154 が実体と矛盾しないか
sed -n '4p;154p' "$PROTO/pages-public.jsx"

# bulk count
grep -oE '\| (`[^`]+\.jsx`|`[^`]+/[^`]+\.jsx`) \| L[0-9]+-L[0-9]+' "$F" | wc -l
```

### 7.3 派生ルール網羅（task-07 §6.3）

§5.1〜§5.8 が phase-3 §3 と 1:1 対応していることを目視 + grep。

### 7.4 不採用記述（task-07 §6.4）

`grep -c "不採用" specs/09a-prototype-map.md` → 4+

## 参照資料

- task-07 §6（6.1, 6.2, 6.3, 6.4）

## 依存 Phase 成果物参照

- Phase 5 / 6 outputs

## 多角的チェック観点

- 検証は全て read-only な grep / sed / wc で完結する（CI 化可能）
- 行範囲は prototype の実体と矛盾しないことを sed で確認
- 検証スクリプトは Phase 8 で `scripts/verify-09a-prototype-line-ranges.sh` として実装

## サブタスク管理

- [ ] 7.1 markdown 構造検証ルール記録
- [ ] 7.2 行範囲整合検証ルール記録
- [ ] 7.3 派生ルール網羅検証ルール記録
- [ ] 7.4 不採用記述検証ルール記録
- [ ] outputs/phase-07/main.md にまとめる

## 成果物

- outputs/phase-07/main.md

## 完了条件

- [ ] 4 軸の検証ルールが grep / sed / wc コマンドで定義される
- [ ] 各軸の期待値（19 exactly / 25+ / 4+ / 8）が記録される

## 次 Phase への引き渡し

Phase 8 へ、検証ルールセットをスクリプト実装入力として渡す。
