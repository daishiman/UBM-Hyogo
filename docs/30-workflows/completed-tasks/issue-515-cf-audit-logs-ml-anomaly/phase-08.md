# Phase 8: エラーハンドリング / fallback / secret leakage 防止

## 目的

classifier 切替・モデルロード・feature 抽出・evaluation の各経路でのエラーハンドリングと fallback 戦略を確定する。

## エラー分類

| 経路 | エラー | 分類 | 対応 |
| --- | --- | --- | --- |
| `getClassifier` | env 値が `threshold`/`ml` 以外 | non-retryable | warn ログ + threshold fallback |
| `MLClassifier.constructor` | `ML_MODEL_PATH` 未指定 / 指定済み | expected | 本サイクルは skeleton のため常に threshold fallback、`version='ml@v0.0.0-skeleton-fallback'` |
| `MLClassifier.classify` | fallback 元 threshold が `null` | expected | `null` を返し NONE 相当として扱う |
| `extractFeatures` | `CF_AUDIT_REDACT_SECRET` 未設定（production） | non-retryable | throw（学習データ作成を阻止）。test 環境のみ default value 許可 |
| `extractFeatures` | timestamp parse 失敗 | non-retryable | throw（汚染データを feature dataset に入れない） |
| `offline-replay` | dataset 行 parse 失敗 | retryable per line | warn して該当行 skip、metrics の `parseErrors` 件数を返す |
| `secret-leakage-grep` | hit 検出 | non-retryable | exit 1（CI 失敗にする） |
| `analyze.ts` D1 insert | 新カラム書込失敗 | retryable | 既存 retry 機構に乗る（変更なし） |

## Secret leakage 防止の多層

1. **抽出時防御** (`extractFeatures`): redaction 関数を経由した値のみ返す。raw 値の露出経路をコードレベルで遮断
2. **検査時防御** (`secret-leakage-grep`): 出力 dataset / log を grep し、生 IP（`/24` 終端でない IPv4）/ メール / Token 形式 / 完全 UA を検出
3. **CI 時防御**: secret-leakage-grep を unit test 経由で fixture（**意図的に汚染した dataset**）に対し exit 1 する確認を含める
4. **設計時防御**: `RedactedFeatures` 型定義に raw field を一切含めない（型レベルで漏洩不能）

## Fallback の優先順位

```
ML 失敗 → threshold fallback → fallback も失敗（≒既存実装失敗）→ event を skip + error log
```

skip した event は D1 に書き込まず、stderr に `severity=NONE, reason=classifier-error` を残す（既存 #408 と同等動作）。

## 完了条件

- [ ] 9 経路のエラー分類を `outputs/phase-08/main.md` に表化
- [ ] secret leakage 防止 4 層を記述
- [ ] fallback 優先順位を記述
- [ ] production で `CF_AUDIT_REDACT_SECRET` 未設定が throw することを確認する test を Phase 9 で計画

## 出力

- `outputs/phase-08/main.md`

## 参照資料

- `index.md`
- `phase-03.md` ・ `phase-04.md` ・ `phase-06.md`

## 統合テスト連携

- Phase 9 で各エラー経路に対する test ケースを定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 08 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 08-1 | この Phase の契約を確定する |
| 08-2 | skill 定義と正本仕様への整合を確認する |

## 成果物/実行手順

- Phase 本文の出力パスへ成果物を配置する。
- 実装時は Phase 11 evidence と Phase 12 strict outputs に同期する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 の成果物を上流契約として参照する。
