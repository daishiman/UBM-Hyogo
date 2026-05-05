# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-02a-section-field-canonical-schema-resolution |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 2+ |
| Mode | sequential |
| 作成日 | 2026-05-01 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending |

## 目的

AC-1〜AC-10 を「成果物（実装ファイル / unit test / migration / implementation-guide.md）」「不変条件 #1/#2/#3/#5」「Phase 6 で抽出した F-1〜F-5 failure case」「03a / 04a / 04b 契約への影響」の 4 軸でトレースし、`outputs/phase-07/ac-matrix.md` に表形式で完全な追跡可能性を確立する。Phase 9 品質保証 / Phase 10 最終レビュー / Phase 13 PR template の判定根拠として機能する。

## 前 Phase からの引き継ぎ

- Phase 6 で確定した F-1〜F-5 failure case と mitigation
- Phase 6 で確定した structured log / CI gate 入力 JSON shape
- Phase 5 で確定した採用方式（D1 column / static manifest / hybrid のいずれか）

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | index.md AC-1〜10 | AC 本文 | matrix の縦軸 |
| 上流 | Phase 6 F-1〜F-5 | failure × mitigation | matrix の failure 列 |
| 並列 | 03a / 04a / 04b 仕様書 | 契約 IF | 影響欄の入力 |
| 下流 | Phase 9 / 10 / 13 | matrix 行 | gate 判定根拠 |

## AC × 成果物 × 不変条件 × failure × 03a/04a/04b 影響

`outputs/phase-07/ac-matrix.md` には以下のスキーマで完全な表を作成する。本 phase 仕様書には抜粋のみを示す。

### マトリクス列定義

| 列 | 内容 |
| --- | --- |
| AC | AC-1〜AC-10 |
| 成果物 | 実装ファイル / unit test / migration / implementation-guide.md のうち該当するもの |
| 不変条件 | #1 / #2 / #3 / #5 のうち該当するもの |
| 関連 failure | Phase 6 の F-1〜F-5 |
| 03a 影響 | StableKey alias queue interface 変更要否 |
| 04a 影響 | `/public/*` view contract 変更要否 |
| 04b 影響 | `/me/*` view contract 変更要否 |
| 検証 Phase | Phase 9 / 11 のいずれで pass を確認するか |

### 抜粋（必須行）

| AC | 成果物 | 不変条件 | failure | 03a | 04a | 04b | 検証 Phase |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | metadata.ts | #1 | F-1, F-4 | hook 提供 | — | — | Phase 9 (typecheck) |
| AC-2 | builder.ts | #1 | F-1 | — | — | — | Phase 9 (grep) |
| AC-3 | builder.ts / builder.test.ts | #1, #5 | F-2 | — | view 整合 | view 整合 | Phase 9 (test) / Phase 11 (parity) |
| AC-4 | metadata.ts / builder.test.ts | #2 | F-5 | allowlist 引取 | — | — | Phase 9 (test) |
| AC-5 | builder.ts / builder.test.ts | #1 | F-1 | — | view 整合 | view 整合 | Phase 9 (test) |
| AC-6 | metadata.ts / builder.ts | #1 | F-1, F-4 | drift 通知 IF | — | — | Phase 9 (CI gate) |
| AC-7 | metadata.ts | #1 | F-4 | hook 受領 | — | — | Phase 11 (drift log) |
| AC-8 | apps/api/migrations/* | #5 | F-3 | — | — | — | Phase 11 (migration log) |
| AC-9 | typecheck / lint / unit test | — | F-1〜F-5 | — | — | — | Phase 9 |
| AC-10 | outputs/phase-12/implementation-guide.md | #1, #2, #3, #5 | — | 契約引渡 | 契約引渡 | 契約引渡 | Phase 12 |

### 03a / 04a / 04b 契約への影響表

| 相手タスク | 引取契約 | 渡す契約 | 整合確認方法 |
| --- | --- | --- | --- |
| 03a | StableKey alias queue の `dryRun` / `apply` / 失敗通知 (`{stableKey, reason}`) interface（`packages/shared` 経由） | resolver 側 hook signature `(stableKey: string) => Result<AliasResolution, AliasError>` | Phase 9 typecheck + Phase 11 drift-detection-log.md |
| 04a | `/public/*` の section / field 露出形式（label / kind enum / section_key 文字列） | resolver 出力 → public view 整合（label が stable_key 文字列でない / kind が `consent` 含む 4 値 enum） | Phase 11 three-view-parity-check.md |
| 04b | `/me/*` の read-only 境界（同 schema） | resolver 出力 → me view 整合（admin-managed extension が漏れない） | Phase 11 three-view-parity-check.md |

## 実行タスク

- [ ] `outputs/phase-07/ac-matrix.md` に AC-1〜10 全行を完全表で記述
- [ ] AC ごとに不変条件 / failure / 03a/04a/04b 影響 / 検証 Phase を埋める
- [ ] 03a / 04a / 04b 契約への影響表を別セクションとして整備
- [ ] AC ごとの Definition of Done（検証コマンド or 観測ファイル）を併記
- [ ] 未トレース行（成果物無し / 検証 Phase 未定）が 0 件であることを cross check

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | index.md（AC セクション） | AC-1〜10 本文 |
| 必須 | phase-06.md | F-1〜F-5 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #1/#2/#3/#5 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | 03a / 04a / 04b 契約の正本 |
| 参考 | 03a 仕様書 / 04a 仕様書 / 04b 仕様書 | 影響欄の入力 |

## 実行手順

### ステップ 1: マトリクス雛形作成
- `outputs/phase-07/ac-matrix.md` を作成し、列定義（AC / 成果物 / 不変条件 / failure / 03a / 04a / 04b / 検証 Phase）の表ヘッダを敷く
- AC-1〜10 を行として並べ、抜粋表を雛形として埋める

### ステップ 2: AC ごとの行充填
- 各 AC について Phase 6 の F-1〜F-5 のうち関連するものを引用
- 03a / 04a / 04b 影響欄に「変更不要 / 引取 / 渡す」のいずれかを明記
- 検証 Phase（9 typecheck / 9 lint / 9 test / 11 evidence）を一意に決める

### ステップ 3: 03a / 04a / 04b 契約影響表の独立記述
- relations 表を別セクションとして整備し、契約名 / 形式 / 整合確認方法を明記
- 03a 未完成時の代替（generated static manifest baseline）も注記

### ステップ 4: 未トレース行 cross check
- 成果物列が空 / 検証 Phase 列が空 / 不変条件列が空 の行を抽出し 0 件にする
- F-1〜F-5 すべてが少なくとも 1 つの AC にぶら下がっていることを確認

### ステップ 5: Phase 9 / 10 への引渡し
- Phase 9 で gate 化する AC（AC-9 typecheck / lint / test、AC-6 CI gate）を marker として明示
- Phase 10 GO 判定で参照する行（AC-1〜AC-10 全行）を明示

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | AC × gate コマンド対応表の入力 |
| Phase 10 | GO / NO-GO 判定の根拠表 |
| Phase 11 | NON_VISUAL evidence ファイルとのマッピング |
| Phase 13 | PR template の change-summary 入力 |

## 多角的チェック観点

- 不変条件 **#1**: AC-1 / 2 / 3 / 5 / 6 / 7 で観測（schema をコードに固定しない）
- 不変条件 **#2**: AC-4 で観測（consent キー統一）
- 不変条件 **#3**: AC-1 で `field_kind=system` 専用パスとして観測（`responseEmail`）
- 不変条件 **#5**: AC-1 / 8 で観測（D1 直接アクセスは apps/api に閉じる）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | ac-matrix.md 雛形作成 | 7 | pending | 列定義固定 |
| 2 | AC-1〜10 行充填 | 7 | pending | 全 10 行 |
| 3 | 03a/04a/04b 契約影響表 | 7 | pending | 別セクション |
| 4 | 未トレース行 cross check | 7 | pending | 0 件達成 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | Phase 7 サマリ。matrix 概要 / 03a/04a/04b 影響要約 / 未トレース 0 件確認 |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 成果物 × 不変条件 × failure × 03a/04a/04b 影響 × 検証 Phase 完全表 |
| メタ | artifacts.json | phase 7 status を completed に更新 |

## 完了条件

- [ ] AC-1〜10 全行が 8 列すべて充填済み
- [ ] F-1〜F-5 が少なくとも 1 つの AC にトレースされている
- [ ] 03a / 04a / 04b 契約影響表が独立セクションとして存在
- [ ] 未トレース行 0 件
- [ ] Phase 9 / 10 が参照する marker が明示されている

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全成果物配置済み
- [ ] 完了条件すべてチェック
- [ ] 異常系（未トレース行 / 03a 影響欄空白 / 不変条件抜け）も網羅
- [ ] 次 Phase 引き継ぎ事項記述
- [ ] artifacts.json の phase 7 を completed

## 次 Phase

- 次: Phase 8 (DRY 化)
- 引き継ぎ: matrix から抽出される共通化候補（resolver helper の繰返し呼出 / row → canonical 変換の重複）
- ブロック条件: 未トレース行 > 0 なら Phase 8 不可
