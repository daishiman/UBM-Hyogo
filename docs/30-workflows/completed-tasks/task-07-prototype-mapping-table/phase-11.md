# Phase 11: 受け入れ検証 — task-07 prototype-mapping-table

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-07-prototype-mapping-table |
| phase | 11 / 13 |
| wave | w2-par |
| mode | parallel |
| 作成日 | 2026-05-07 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

[実装区分: ドキュメントのみ]
判定根拠: 本タスクの成果物は `docs/00-getting-started-manual/specs/09a-prototype-map.md` の新規作成のみで、アプリケーションコード変更・schema 変更・依存追加を伴わない。CONST_004 の例外条件（純粋にドキュメントで完結）に該当するため docs-only として作成。

## 目的

task-07 §8 DoD 11 項目を全件チェックし、受け入れ判定を確定する。`docs-only / NON_VISUAL` の縮約テンプレを適用し、screenshot は不要、grep evidence で代替する。

## DoD 11 項目チェックリスト（task-07 §8）

- [ ] `09a-prototype-map.md` が 360 行以上で新規作成されている → `wc -l`
- [ ] §2 で 13+ primitives が mapping されている → row count grep
- [ ] §3 で 19 routes すべてが行されている（プロトタイプ忠実 9 + 未掲載 10）→ `grep -cE "^\\| \`/.*\` "`
- [ ] §4 で shell（Sidebar / Topbar / MinimalBar）の本番先が明示 → `grep "Sidebar\\|Topbar\\|MinimalBar"`
- [ ] §5 で派生ルール 8 パターン（5.1〜5.8）が phase-3 §3 と完全一致 → `grep -cE "^### 5\\.[1-8]"`
- [ ] §5 末尾に「新規 primitive を生やさない」段落が存在 → `grep "新規 primitive を生やさない"`
- [ ] §6 行範囲台帳が 25 行以上、`primitives.jsx` / `pages-*.jsx` / `app.jsx` の全主要 component を網羅
- [ ] 不採用記述（TweaksPanel / AvatarStoreProvider / data-theme warm/cool）が「不採用」と明記 → `grep -c "不採用"` 4+
- [ ] §3 表の route × component が phase-3 §2 の画面/API境界と齟齬なし（固定列に API 列は追加しない）
- [ ] markdown lint error 0 → `pnpm lint:md`
- [ ] 行範囲が実体 jsx と矛盾なし → `sed -n '<start>p;<end>p'` sample
- [ ] `09-ui-ux.md`（task-06 出力）からの link target として参照されている → `grep "09a-prototype-map" specs/09-ui-ux.md`

## NON_VISUAL evidence 縮約

screenshot を取らない代わりに以下 evidence で代替:

- grep / wc / sed の実行結果ログ（outputs/phase-11/main.md に貼付）
- `verify-09a-prototype-line-ranges.sh` exit 0 ログ
- markdown lint 0 error ログ

## 実行タスク

1. DoD 11 項目を 1 つずつ実行し、コマンド + 出力 + 判定を記録する。
2. 全 PASS で受け入れ判定 `accepted` に確定する。
3. 1 つでも FAIL があれば該当 Phase へ差戻し。

## 参照資料

- task-07 §8 DoD
- Phase 10 品質ゲート PASS ログ

## 依存 Phase 成果物参照

- Phase 5〜10 outputs

## 多角的チェック観点

- DoD は task-07 §8 と 1 字一句一致
- evidence は再現可能（コマンド + 出力をペア記録）
- NON_VISUAL のため screenshot 取得は不要

## サブタスク管理

- [ ] DoD 11 項目を 1 件ずつ実行
- [ ] 全 evidence を outputs/phase-11/main.md に集約
- [ ] 受け入れ判定 (accepted / rework) を記録

## 成果物

- outputs/phase-11/main.md

## 完了条件

- [ ] DoD 11 項目すべて PASS
- [ ] evidence ログ 11 件すべて記録

## 次 Phase への引き渡し

Phase 12 へ、受け入れ accepted の `09a-prototype-map.md` を渡す。
