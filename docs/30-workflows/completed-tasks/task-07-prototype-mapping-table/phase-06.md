# Phase 6: 実装レビュー観点 — task-07 prototype-mapping-table

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-07-prototype-mapping-table |
| phase | 6 / 13 |
| wave | w2-par |
| mode | parallel |
| 作成日 | 2026-05-07 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

[実装区分: ドキュメントのみ]
判定根拠: 本タスクの成果物は `docs/00-getting-started-manual/specs/09a-prototype-map.md` の新規作成のみで、アプリケーションコード変更・schema 変更・依存追加を伴わない。CONST_004 の例外条件（純粋にドキュメントで完結）に該当するため docs-only として作成。

## 目的

Phase 5 で作成した `09a-prototype-map.md` を、列名固定 / 行範囲 grep 一意 / 不採用 4+ / 派生ルール 8 完全網羅の 4 観点でレビューする。

## 実行タスク

1. 列名固定レビュー: §2 / §3 / §6 の表ヘッダが Phase 2 の確定列名と 1 字も違わないことを確認。
2. 行範囲 grep 一意性レビュー: `grep -oE 'L[0-9]+-L[0-9]+' specs/09a-prototype-map.md | sort -u` で重複が許容され、各行範囲が prototype 実体と矛盾しないことを確認。
3. 不採用記述レビュー: `grep -c "不採用" specs/09a-prototype-map.md` で 4+ を確認。対象 4 件: TweaksPanel / AvatarStoreProvider / data-theme="warm" / data-theme="cool"。
4. 派生ルール 8 完全網羅レビュー: §5.1〜§5.8 すべての小節が存在し、phase-3 §3 と 1:1 対応することを確認。

## レビュー観点（task-07 §6 を継承）

| 観点 | 検証コマンド | 期待値 |
|------|-------------|--------|
| §3 routes 行数 | `bash scripts/verify-09a-prototype-line-ranges.sh` | exactly 19 |
| §6 行範囲台帳 | `grep -cE "^\| .* \| .*\\.jsx \| L[0-9]" specs/09a-prototype-map.md` | 25+ |
| jsx ファイル名出現 | `grep -c "pages-public.jsx" specs/09a-prototype-map.md` | 5+ |
| 不採用記述 | `grep -c "不採用" specs/09a-prototype-map.md` | 4+ |
| 派生ルール小節 | `grep -cE "^### 5\\.[1-8]" specs/09a-prototype-map.md` | 8 |

## 参照資料

- task-07 §6 テスト方針
- Phase 5 で作成した `09a-prototype-map.md`

## 依存 Phase 成果物参照

- Phase 5 outputs / `09a-prototype-map.md`

## 多角的チェック観点

- 列名 grep キーが後続 task で機械抽出可能か
- 行範囲が prototype 実体と矛盾しないか（sed 実体確認）
- §5 末尾段落「新規 primitive を生やさない」が 8 パターン全てに付記されているか

## サブタスク管理

- [ ] 列名固定レビュー
- [ ] 行範囲 grep 一意性レビュー
- [ ] 不採用記述 4+ レビュー
- [ ] 派生ルール 8 完全網羅レビュー
- [ ] outputs/phase-06/main.md 作成

## 成果物

- outputs/phase-06/main.md

## 完了条件

- [ ] §2 / §3 / §6 列名が確定列と完全一致
- [ ] §3 19 routes 行 / §6 25+ 行が成立
- [ ] 不採用記述 4+ 確認
- [ ] §5 派生ルール 8 パターン完全網羅確認

## 次 Phase への引き渡し

Phase 7 へ、レビュー済み `09a-prototype-map.md` を渡す。
