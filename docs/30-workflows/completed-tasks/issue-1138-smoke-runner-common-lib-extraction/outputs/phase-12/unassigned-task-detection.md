# Unassigned Task Detection — issue-1138-smoke-runner-common-lib-extraction

> 0 件でも出力必須。本タスク本体の成果物（共通 lib / 3 runner 移行 / lib test）は本サイクルで**仕様確定**し、実装は user-gated。current（今サイクルで起票すべき残課題）と baseline（YAGNI / 将来候補）を分離記録する。

## 設計タスク 4 パターン チェック（current = 今サイクルで起票すべき残課題）

| パターン | チェック観点 | 検出 |
| -------- | ------------ | ---- |
| 型 → 実装 | 仕様に定義した関数（lib 9 関数 / 薄ラッパー）に未実装の宣言が残らないか | **0 件**（成果物は本体スコープ内で仕様確定済み・実装は user-gated） |
| 契約 → テスト | 共通 lib 契約（array_key 分岐 / SMOKE_ prefix / trap 非保持）に対応する local test ケースが設計されているか | **0 件**（Phase 4/6 で AC-1〜AC-10 を lib test / 非退化 test に対応付け済み） |
| UI → component | UI route / component の不足 | **0 件**（NON_VISUAL・UI 変更なし） |
| 仕様書間差異 | Phase 1/2/5/10 と本 strict 7 の関数名 / array_key / MECE 境界の不整合 | **0 件**（識別子は phase-2.md と完全一致・`smoke_*` 9 関数で全 phase 統一） |

## ソース別 検出結果

| ソース | 検出 | 内容 |
| ------ | ---- | ---- |
| 元タスク仕様書（スコープ外） | 候補 2 件 | 下記 BASELINE-1/2（全て本体 AC 射程外・将来候補） |
| Phase 3/10 レビュー MINOR | 0 件（current） | レビューで current の起票必須課題なし |
| Phase 11 手動テスト発見 | 0 件 | 本サイクルの local test / shellcheck で追加課題なし |
| コードコメント TODO/FIXME | 0 件 | 新規 lib / test と移行済み runner に TODO/FIXME 追加なし |
| describe.skip 残存 | 0 件 | — |

→ **current（今サイクルで起票すべき残課題）= 0 件**。

## baseline（YAGNI / 将来候補・本体スコープと分離）

### BASELINE-1: attendance / admin-web の PASS/FAIL entry shape 統一

- 概要: 現状 attendance（reason 任意 + summary キー）・admin-web（record_check 単一形）・tag-bulk（contract+reason）で entry shape が 3 通り。これを共通 lib の単一 entry builder へ統一する余地。
- 今サイクル外の理由: 過剰共通化リスク（flag/分岐肥大・lib シグネチャ不安定化）。本タスクは Phase 2/3 で「entry shape が違う部分は runner 残置」を MECE 境界として確定済み（AC-5）。shape 統一は entry contract 自体の変更を伴い、NON_VISUAL 非退化の射程外。
- 実施時期 / 場所: 3 runner の entry contract を意図的に揃える別タスク（contract 変更を伴うため非退化リファクタとは別物）。

### BASELINE-2: 4 本目 runner 追加時の更なる共通化（`request_json` / cleanup 部品化）

- 概要: issue-1137（production bulk tag runtime smoke）等で 4 本目 runner が追加され、`request_json` / cleanup の重複が安定した時点で、HTTP request ラッパー・cleanup 部品を lib へ追加抽出する余地。
- 今サイクル外の理由: YAGNI。現状 request 系 / cleanup は 3 runner で contract / trap shape が固有であり、共通化メリットが小さい（Phase 2.4 MECE 境界・AC-5）。4 本目が安定するまで先行抽出は過剰設計。
- 実施時期 / 場所: 4 本目 runner 追加または共通機構の drift が再顕在化した時点で、本 lib への additive 抽出タスクとして別 Issue。

## 関連タスク差分確認（issue-1137 等との重複チェック）

| 関連タスク | 重複の有無 | 判定 |
| ---------- | ---------- | ---- |
| issue-1137（bulk tag production runtime smoke 拡張） | 重複なし | issue-1137 は production runner 経路の**追加**（機能拡張）。本タスクは既存 3 runner の**内部共通化**（NON_VISUAL refactor）。両者は直交し、本 lib は issue-1137 の 4 本目追加コストを下げる関係（YAGNI 解除トリガの一部） |
| issue-1081（bulk tag real D1 runtime smoke） | 重複なし | issue-1081 は 3 本目 runner（tag-bulk）の追加元（親タスク）。本タスクはその runner を含む 3 本を共通化する後続。runner contract は変更しない |
| 既存 unassigned-task 群 | 重複なし | `smoke-common` への参照は全コードベースで 0 件（`grep -rn smoke-common` 0）。本タスクが唯一の共通 lib 抽出タスク |

## 本体スコープの分離宣言

- BASELINE-1/2 は本タスク AC-1〜AC-10 の**射程外**であり、本体成果物（共通 lib / 3 runner 移行 / lib test）の先送りではない。本体は本 cycle で仕様確定済み（CONST_007・実装は user-gated）。
- current = 0 件のため本サイクルでの新規 Issue 起票はなし。baseline 候補は Phase 12 detection の 2 回検証一致を取った上で、必要なら user-gated で Issue 化する（本仕様書作成では起票しない）。
