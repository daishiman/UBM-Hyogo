# Phase 10: リファクタ

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 10 / 13 |
| Phase 名称 | リファクタ |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 9 (受入確認) |
| 次 Phase | 11 (VISUAL evidence) |
| 状態 | completed |

## 目的

実装完了後の重複 / 冗長コードを最小限整理する。本タスクは小規模変更のため大規模リファクタは行わない。

## 10-1. 重複 router.refresh の整理判断

| 箇所 | 現状 | 判断 |
| --- | --- | --- |
| `RequestActionPanel.tsx:57-60` の `onSubmitted` callback 内 `router.refresh()` | 既存実装。dialog local refresh 追加後は重複発火点になる | **削除し、accepted response bridge state に再構成** |
| `VisibilityRequestDialog.tsx` 内 (新規) `router.refresh()` | 本 Phase で追加 | 保持 |
| `DeleteRequestDialog.tsx` 内 (新規) `router.refresh()` | 本 Phase で追加 | 保持 |

### 判断根拠

- Next.js 公式 docs は `router.refresh()` が current route を再取得すると説明するが、複数 refresh の de-duplicate は本タスクの根拠にしない
- refresh の責務は dialog success branch へ一本化し、parent は `QueueAccepted` を受けて server `pendingRequests` 到着まで banner を表示する bridge state のみを持つ
- これにより余分な request 可能性と責務重複を同時に除去する

### 代替案（採用しない）

- **採用 A: dialog ローカルに一本化し、`RequestActionPanel.tsx:57-60` の `router.refresh()` を削除**
  - メリット: 重複排除
  - デメリット: `RequestActionPanel` の `onSubmitted` が空関数になり意図不明確 / 既存テストの修正が必要
  - 判定: 採用

## 10-2. その他のリファクタ候補

| 候補 | 判定 | 理由 |
| --- | --- | --- |
| `useRouter()` 呼び出しを shared util に抽出 | 不採用 | React idiom に反する。dialog ごとに hook を呼ぶのが標準 |
| dialog の `onSubmit` を共通化 | 不採用 | desiredState / confirmed の差異があり、共通化は過剰抽象 |
| error handling 共通化（catch branch） | 不採用 | 本タスクスコープ外。別 task として切り出すべき |

## 10-3. リファクタなしの根拠

本タスクは小規模変更だが、二重 refresh の根拠が弱いため `RequestActionPanel` の責務を bridge state に整理した。共通 hook 抽出や dialog submit 共通化は過剰抽象のため実施しない。

## 実行タスク

- [ ] 重複 router.refresh の整理判断を記録する
- [ ] 他のリファクタ候補 3 件を不採用として記録する
- [ ] リファクタなしの根拠を文書化する
- [ ] `outputs/phase-10/refactor-summary.md` を作成する

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/refactor-summary.md | リファクタ判断（実施せず） |

## 完了条件

- [ ] 重複整理判断が記録されている
- [ ] リファクタなしの根拠が明示されている

## 次 Phase

- 次: 11 (VISUAL evidence)
- 引き継ぎ事項: リファクタなし方針
