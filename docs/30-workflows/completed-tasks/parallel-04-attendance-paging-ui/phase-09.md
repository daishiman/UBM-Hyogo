# Phase 9: 受入確認

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 9 / 13 |
| 前 Phase | 8 (ドキュメント更新) |
| 次 Phase | 10 (リファクタ) |
| 状態 | completed |

## 目的

実装完了後、AC-1〜AC-9 が満たされていることを検証する。

## AC 検証マトリクス

| AC | 検証方法 | 結果 |
| --- | --- | --- |
| AC-1 初回 default 50 件 render | Unit U1 / DOM 確認 | PASS |
| AC-2 hasMore=true でボタン表示 | Unit U1 | PASS |
| AC-3 button click で cursor 含む fetch | Unit U2/U3 | PASS |
| AC-4 nextCursor=null で button 非表示 | Unit U4 | PASS |
| AC-5 fetch 失敗で role="alert" | Unit U5 | PASS |
| AC-6 loading 中 disabled + text | Unit U6 | PASS |
| AC-7 items=[] で empty message | Unit U7 | PASS |
| AC-8 cursor opaque 扱い | コード review + Unit U8 | PASS |
| AC-9 OKLch tokens のみ | CI gate `verify-design-tokens` | PASS |

## 検証コマンド実行記録

```bash
mise exec -- pnpm typecheck   # PASS
mise exec -- pnpm lint        # PASS
mise exec -- pnpm --filter @ubm-hyogo/web test -- AttendanceList  # PASS
mise exec -- pnpm --filter @ubm-hyogo/web test -- profile         # PASS
```

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/acceptance.md | 受入記録 |

## 完了条件

- [x] AC-1〜AC-9 全件 PASS

## 次 Phase

- 次: 10 (リファクタ)
