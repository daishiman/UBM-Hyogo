# Phase 7: ACマトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-utgov001-references-reflect-001 |
| Phase 番号 | 7 / 13 |
| Phase 名称 | ACマトリクス |
| 作成日 | 2026-05-01 |
| 前 Phase | 6 |
| 次 Phase | 8 |
| 状態 | spec_created |

## 目的

AC-1〜AC-8を、検証コマンド、成果物、依存関係に結びつける。

## 実行タスク

1. ACごとの検証方法を定義する。
2. ACごとの成果物を定義する。
3. BLOCKED時の扱いを定義する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| index | index.md | AC一覧 |
| Phase 4 | phase-04.md | 検証コマンド |
| Phase 6 | phase-06.md | 異常系 |

## 実行手順

| AC | 検証 | 成果物 |
| --- | --- | --- |
| AC-1 | jqでcontexts配列確認 | phase-05/current-facts.md |
| AC-2 | rgで反映先確認 | phase-02/reflection-design.md |
| AC-3 | diff -qrでmirror確認 | phase-09/quality-gate.md |
| AC-4 | documentation changelogでGET由来明記 | phase-12/documentation-changelog.md |
| AC-5 | `Refs #303` grep | phase-13/change-summary.md |
| AC-6 | NON_VISUAL evidence 3点 | phase-11/* |
| AC-7 | Phase 12 6成果物存在確認 | phase-12/* |
| AC-8 | Phase 13 blocked記録 | phase-13/pr-creation-result.md |

## 統合テスト連携

Phase 9でACごとにPASS / FAIL / BLOCKEDを確定する。

## 多角的チェック観点

- ACが検証不能な文章だけになっていないか。
- BLOCKEDをPASSとして扱っていないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | AC表作成 | pending |
| 2 | 検証成果物対応 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC検証表 |

## 完了条件

- [ ] AC-1〜AC-8が全て成果物に紐づく
- [ ] BLOCKEDの扱いが明記されている
- [ ] 本Phase内の全タスクを100%実行完了

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] `outputs/phase-07/ac-matrix.md` を作成
- [ ] `artifacts.json` の Phase 7 状態を更新

## 次Phase

Phase 8: DRY化
