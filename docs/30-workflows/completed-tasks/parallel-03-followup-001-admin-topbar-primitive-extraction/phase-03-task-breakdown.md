---
phase: 3
title: Task breakdown — 単一責務 step 分解
workflow_id: parallel-03-followup-001-admin-topbar-primitive-extraction
status: spec_created
---

# Phase 3 — Task breakdown

[実装区分: 実装仕様書]

## 1. step 一覧（実装順）

| step | 内容 | 対象ファイル | 種別 | 依存 |
| --- | --- | --- | --- | --- |
| S-01 | AdminTopbar primitive 本体を作成（props 設計 + 既定描画 + data-* 契約 + token class 移植） | `apps/web/src/components/layout/AdminTopbar.tsx` | 新規 | なし |
| S-02 | `(admin)/layout.tsx` の inline `<header>`（L35-46）を `<AdminTopbar />` に置換 + import 追加 | `apps/web/app/(admin)/layout.tsx` | 編集 | S-01 |
| S-03 | AdminTopbar 単体 spec を作成（既定描画 / slot 注入 / data-* / token class / axe） | `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` | 新規 | S-01 |
| S-04 | 既存 `(admin)/layout.spec.tsx` を無修正で pass 確認（regression gate） | `apps/web/app/(admin)/layout.spec.tsx` | 検証のみ（変更なし） | S-02 |
| S-05 | quality gate 実行（typecheck / lint / build / verify-design-tokens / vitest 2 spec / axe）と evidence 取得 | — | 検証 | S-01..S-04 |

## 2. 単一責務の確認

- S-01: primitive 定義（プレゼンテーション責務の集約）。
- S-02: 呼び出し側の差し替え（layout から表示責務を除去）。
- S-03: primitive の契約検証（単体テスト責務）。
- S-04: 既存 integration 契約の非回帰検証。
- S-05: 品質ゲート。

各 step は 1 ファイル（または 1 検証関心）に閉じており、SRP を満たす。

## 3. 並列 / 直列

- S-01 → (S-02, S-03 は S-01 完了後に並列可) → S-04（S-02 後） → S-05（全完了後）。
- 実装規模は小。単一 PR / 単一サイクルで完了する（CONST_007 遵守。先送り step なし）。

## 4. ロールバック単位

- 各 step は独立コミット可能だが、S-02（layout 置換）は S-01（primitive 追加）と同一コミットにする（中間状態で `<AdminTopbar>` が未定義参照にならないため）。
