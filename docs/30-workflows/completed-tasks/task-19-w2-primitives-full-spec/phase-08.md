# Phase 8: 品質保証（link 整合性 / token 名照合）

[実装区分: ドキュメントのみ]（CONST_004 例外: 純粋なドキュメント作成）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-19-w2-primitives-full-spec |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 品質保証（link 整合性 / token 名照合） |
| 作成日 | 2026-05-07 |
| 前 Phase | 7 (リファクタリング) |
| 次 Phase | 9 (最終レビュー) |
| 状態 | completed |
| task_kind | NON_VISUAL（pure-docs） |

## 目的

整形済み `09c-primitives.md` に対し、(1) 全 §X.6 link の **target contract** を task-07 / task-08 / task-20..22 に接続、(2) §X.5 token 参照名が placeholder でなく `--ubm-*` 名であること、(3) 09e / 09f / 09g の既存 screen blueprint 参照が current facts と矛盾しないことを検証する。09a / 09b の最終ファイルは並列 task-07 / task-08 の生成物であるため、task-19 単体では file-existence PASS 条件にしない。

## 実行タスク

- 09b（task-08）token 名と §X.5 参照名の照合
- 09a（task-07）行範囲 mapping と §X.1 JSX 転記行範囲の照合
- 09e / 09f / 09g（task-20/21/22）採用例 link の生存確認
- markdown link 構文の dead link 検査
- 並列タスク（task-07/08/20/21/22）が未完成の場合の placeholder link 整備

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/09c-primitives.md | 検証対象 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-08-w2-par-design-tokens-doc.md | task-08 token 値 contract |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-07-w2-par-prototype-mapping-table.md | task-07 mapping contract |
| 参照 | docs/00-getting-started-manual/specs/09e-public.md | task-20 採用例 link 先 |
| 参照 | docs/00-getting-started-manual/specs/09f-member.md | task-21 採用例 link 先 |
| 参照 | docs/00-getting-started-manual/specs/09g-admin.md | task-22 採用例 link 先 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/03-spec-source/task-19-w2-par-primitives-full-spec.md | §0.7 / §8 DoD |

## 実行手順

### ステップ 1: token 名照合（09b ↔ 09c §X.5）

```bash
# 09c で参照されている token 名を抽出
grep -ohE -- '--ubm-[a-z0-9-]+' docs/00-getting-started-manual/specs/09c-primitives.md \
  | sort -u > /tmp/09c-tokens.txt

# 09b で定義されている token 名を抽出
grep -ohE -- '--ubm-[a-z0-9-]+' docs/00-getting-started-manual/specs/09c-primitives.md \
  | sort -u > /tmp/09c-token-refs.txt

# 09c にあるが 09b に無い → fail（未定義 token 参照）
comm -23 /tmp/09c-tokens.txt /tmp/09b-tokens.txt
```

期待: 出力 0 行（全 token が 09b に定義済み）。1 行でもあれば Phase 5 戻り。

### ステップ 2: 09a 行範囲 mapping 照合

各 §X.1 ヘッダーの `(primitives.jsx Lx-Ly)` 行範囲を抽出し、task-07 source spec の mapping contract と一致することを確認。不一致時は task-07 owner と同期する。

### ステップ 3: 採用例 link 生存確認（09e / 09f / 09g）

```bash
# §X.6 内の link 先見出しを抽出
grep -E '09[efg]-[a-z]+\.md' docs/00-getting-started-manual/specs/09c-primitives.md
```

各 link 先 file が存在し、参照している `§X` 見出しが実在することを確認。並列タスク（task-20/21/22）未完成で対象 file 未作成の場合は **placeholder link**（`<!-- TODO: task-20 完了後に解決 -->`）を残し、Phase 9 の MINOR として追跡する。

### ステップ 4: markdown link 構文検査

```bash
mise exec -- pnpm lint:md docs/00-getting-started-manual/specs/09c-primitives.md
# あるいは
npx markdown-link-check docs/00-getting-started-manual/specs/09c-primitives.md
```

期待: dead link 0 件（placeholder TODO は除外）。

### ステップ 5: a11y 必須記述の最終確認

タスク正本 §0.5 不変条件 6/7 と DoD §8 に基づき:
- §1.4 / IconBtn 関連に `aria-label` 必須記述があるか
- §14.4 / §15.4 に `role="dialog" + aria-modal="true" + Esc + focus trap` 4 要素が揃うか
- §16 (Toast) に `aria-live` または `role="status"` 記述があるか

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 整形済みの 09c を入力として受領 |
| Phase 9 | DoD §8 全 9 項目チェックの基礎データ |
| 並列 task-07/08/20/21/22 | drift 検出時に同期通知 |

## 多角的チェック観点（AIが判断）

- 整合性: 09b token 名と §X.5 参照名が完全一致するか
- 完全性: 全 §X.6 が 09b / 09a / 09e/09f/09g 3 種類の link を持つか
- 安全性: a11y 不変条件 6/7 が漏れなく記述されているか
- 並列耐性: task-20/21/22 未完成時の placeholder 戦略が明示されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 09b token 名照合 | 8 | pending | comm -23 で 0 行 |
| 2 | 09a 行範囲照合 | 8 | pending | §2.X と Lx-Ly |
| 3 | 09e/09f/09g link 生存 | 8 | pending | placeholder 許容 |
| 4 | dead link 検査 | 8 | pending | markdown-link-check |
| 5 | a11y 必須記述確認 | 8 | pending | §1.4 / §14 / §15 / §16 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| レポート | outputs/phase-08/quality-report.md | 照合結果 / placeholder 一覧 |
| メタ | artifacts.json | Phase 8 状態更新 |

## 完了条件

- [ ] 09b 未定義 token を §X.5 が参照していない（comm -23 で 0 行）
- [ ] §X.1 行範囲が 09a §2.X と一致
- [ ] 09e/09f/09g 採用例 link が生存（または placeholder で追跡記録）
- [ ] dead link 0 件
- [ ] a11y 必須記述（aria-label / dialog 4 要素 / aria-live）が漏れなし
- [ ] coverage AC 適用外（pure-docs）

## タスク100%実行確認【必須】

- [ ] 5 サブタスク全て completed
- [ ] quality-report.md に検証コマンド出力が貼付済み
- [ ] 全完了条件にチェック
- [ ] placeholder link は MINOR 追跡テーブルに登録
- [ ] 次 Phase への引き継ぎ事項を記述
- [ ] artifacts.json の Phase 8 を verified に更新

## 次 Phase

- 次: 9 (最終レビュー)
- 引き継ぎ事項: DoD §8 全 9 項目の最終チェックリスト化と MAJOR/MINOR 判定
- ブロック条件: 09b 未定義 token 参照、または dead link が 1 件でも残れば次 Phase に進まない
