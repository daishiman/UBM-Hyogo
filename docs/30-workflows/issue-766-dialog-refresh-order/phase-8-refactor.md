# Phase 8: リファクタ

## 1. リファクタ方針

本タスクは「副作用の呼び出し順序を spec 通りに固定する」最小変更を主眼とするため、付随リファクタは**実施しない**。

## 2. 抑止する変更

- mutation hook によるカプセル化 (issue 本文の「将来 followup」相当のため別タスク)
- `onSubmitted` callback の async 化
- dialog props 型の再設計
- error path での refresh 追加

## 3. 例外的に実施する小整理

- `RequestActionPanel.tsx` で `useRouter` import が未使用になった場合の import 削除 (lint clean のための必要最小整理)
- 同 file で `router` 変数が他で使われていない場合の変数削除

## 4. コメント方針

CLAUDE.md「コメントは WHY が非自明なときのみ」の原則に従い、`router.refresh()` 行に対してコメントを残す:

- 残すべきコメント例: `// issue #766: refresh は dialog 内で先発火し unmount 前に schedule する`
- 残してはいけないコメント例: `// refresh を呼ぶ` (WHAT のみで無価値)

`RequestActionPanel.onSubmitted` には「refresh は dialog 側に移譲」の意図コメントのみ残す。

## 5. DoD

- [ ] 余分なリファクタが含まれていない
- [ ] 必要最小限の import / 変数整理のみ
- [ ] コメントは WHY のみ
