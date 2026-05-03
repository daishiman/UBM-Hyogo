[実装区分: 実装仕様書]

# Phase 6: 異常系検証 — ut-web-cov-01-admin-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-01-admin-components-coverage |
| phase | 6 / 13 |
| 作成日 | 2026-05-03 |
| taskType | implementation |

## 目的

各 component の error / empty / authz-fail / validation エッジケース網羅性を Phase 5 実装結果に対して検証し、漏れを Phase 11 evidence で検知できる粒度に保つ。

## 変更対象ファイル一覧

| パス | 変更種別 |
| --- | --- |
| Phase 5 で編集した `__tests__/*.test.tsx` 7 ファイル | 必要に応じ追記（漏れ検出時のみ） |

## 異常系マトリクス

| component | error | empty | authz-fail | validation |
| --- | --- | --- | --- | --- |
| MembersClient | （pure-presentational のため対象外） | members=[] で「該当会員なし」表示 (既存) | hidden filter 切替時 push 引数確認 (既存) | filter 値の白リスト validation (既存) |
| TagQueuePanel | fetch reject → error toast (既存) | queue=[] で空メッセージ (既存) | 操作不可状態（status=rejected）で button disabled (Phase 5 追加) | search filter 値ガード (既存) |
| AdminSidebar | （対象外） | （対象外） | （対象外） | active path 判定 (既存) |
| SchemaDiffPanel | applyMutation 失敗 toast (既存) | suggested 配列空 (Phase 5 追加で defaultValue 確認) | active=null で submit 早期 return (Phase 5 追加) | 空白のみ stableKey reject (Phase 5 追加) |
| MemberDrawer | postMemberNote/restoreMember reject + fetch throw (Phase 5 追加 +3) | hidden 切替済み 状態の表示 (既存) | restore 不可 state (既存) | メモ空白 reject、url 欠落で anchor 非表示 (Phase 5 追加 +2) |
| MeetingPanel | createMeeting reject (既存) | sessions=[] (既存) | busy 中 disabled (Phase 5 追加) | attended 重複 prevent (Phase 5 追加) |
| AuditLogPanel | log fetch error (既存) | logs=[] empty (既存) | role!=admin 隠蔽 (既存) | kebab/snake/PHONE/array PII (Phase 5 追加 +3) |

## 主要シグネチャ確認

- mock 失敗パスは `vi.mocked(fn).mockRejectedValueOnce(new Error("..."))` で per-it 構成
- `expect(screen.getByRole("alert"))` または `screen.getByText(/エラー/)` で error 表示確認
- `expect(mockFn).not.toHaveBeenCalled()` で「呼ばれない」検証

## 入出力・副作用

- 入力: 失敗系 mock + invalid input
- 出力: error UI / empty UI / disabled state
- 副作用: 失敗時 router.push が呼ばれない、refresh が呼ばれない、API が再呼出されない

## テスト方針

- Phase 5 実装後にこのマトリクスで漏れを再確認
- 漏れ検出時はマトリクス該当行を更新し test を追加
- 実装漏れ 0 で Phase 7 へ移行

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --reporter=verbose
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

## 完了条件 (DoD)

- 上記マトリクスのすべてのセルに「既存」または「Phase 5 追加」マークが付く
- 各 component に happy / authz-fail / empty / mutation の最低 4 ケースが存在
- coverage 計測で Stmts/Lines/Funcs ≥85% / Branches ≥80% 達成

## サブタスク管理

- [ ] 異常系マトリクスを Phase 5 実装結果と突合
- [ ] 漏れあれば該当 it を追加
- [ ] outputs/phase-06/main.md 作成

## 次 Phase への引き渡し

Phase 7 へ、AC ↔ test ↔ evidence path の対応マトリクス整備を依頼する。

## Template Compliance Addendum

## 実行タスク

- 既存本文の目的、変更対象、テスト方針、ローカル実行コマンド、完了条件に従って本 Phase の作業を実行する。
- Phase completion は `artifacts.json` と `outputs/artifacts.json` の status、および該当 `outputs/phase-XX/main.md` で記録する。

## 参照資料

- `index.md`
- `artifacts.json`
- `outputs/phase-11/vitest-run.log`
- `outputs/phase-11/coverage-target-files.txt`

## 成果物/実行手順

- 成果物: `outputs/phase-06/main.md`
- 実行手順: 本 Phase の変更対象と検証コマンドを確認し、結果を outputs に記録する。

## 統合テスト連携

- 本タスクは apps/web component unit coverage hardening であり、外部 integration test は追加しない。
- 回帰確認は `pnpm --filter @ubm-hyogo/web test:coverage` の同一実行で担保する。
