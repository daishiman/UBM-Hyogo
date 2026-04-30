# task-07c-attendance-visual-smoke

```yaml
issue_number: 313
```

| 項目 | 値 |
|------|-----|
| タスクID | 07c-followup-002-attendance-visual-smoke |
| タスク名 | attendance UI visual smoke evidence |
| 分類 | 改善（品質） |
| 対象機能 | /admin/meetings 出席候補/追加/重複/削除 |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | 07c Phase 11 NON_VISUAL 判定 |
| 発見日 | 2026-04-30 |

## 概要

`/admin/meetings` で attendance candidates、add、duplicate、delete のブラウザ visual smoke を取得し、screenshot / Playwright trace を evidence として保存する。

## 背景

07c は API-only / NON_VISUAL として Phase 11 を Vitest smoke evidence で完了した。
duplicate add 時の 409 が UI 側で disabled state なのか toast なのかは未検証であり、
candidates panel の絞り込み（削除済み member / 登録済み member の除外）も実ブラウザでは確認していない。
実ブラウザ screenshot は 08b Playwright E2E または 09a staging smoke に委譲する判断としたが、
visual evidence の欠落を follow-up として可視化しておく必要がある。

## 完了条件

- candidates panel が削除済み member と登録済み member を表示しないことを screenshot で確認
- duplicate add が 409 toast / disabled state のいずれで扱われるかを visual で確定
- delete 後に attendance state が更新されることを screenshot 連番 or Playwright trace で記録
- 取得した evidence を `outputs/phase-11` 相当のパスに保存し、07c の NON_VISUAL 判定を解消する

## 詳細仕様

- 実行手段: 08b Playwright E2E スイート、または 09a staging smoke の手動取得
- 対象画面: `/admin/meetings`（attendance candidates panel / add modal / duplicate flow / delete confirm）
- 期待 evidence:
  - candidates panel 表示状態（削除済み member 非表示）
  - duplicate add 時の UI 反応（toast or disabled）
  - delete 後の state 更新
- 失敗時の扱い: API 差分が無い限り 07c 本体の再オープンは不要。08b / 09a の作業範囲として処理する

## 学び / 苦戦箇所

- 07c は API-only として Phase 11 を Vitest smoke で完了したが、duplicate add の 409 が UI 側で disabled state なのか toast なのかは未検証のまま残った
- screenshot / Playwright trace を 08b に委譲する判断基準（API 差分なし・UI 振る舞いは別タスクで確認）の明文化が課題だった
- NON_VISUAL 判定を採用する場合でも、follow-up として visual evidence の欠落を unassigned-task に積む運用フローが必要と判明した
- candidates panel の絞り込みロジックは API 側 unit test で担保したが、UI で実際に該当 member が出ないことの保証は別 layer（E2E）に依存する

## 依存

- 06c Admin UI
- 07c Attendance Audit API
- 08b Playwright E2E

## 参照

- 07c Phase 11 NON_VISUAL 判定 evidence
- `docs/30-workflows/` 配下の 08b / 09a タスク仕様
- `outputs/phase-11/` evidence 保存規約
