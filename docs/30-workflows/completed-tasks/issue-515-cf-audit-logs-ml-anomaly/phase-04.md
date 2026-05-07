# Phase 4: I/O 契約

## 目的

Classifier interface / CLI フラグ / env / GitHub Issue 出力の I/O 契約を確定する。

## I/O 契約

### Classifier interface（再掲・正本）

```ts
classify(event: AuditEvent): SeverityResult
```

- 入力: `AuditEvent`（`scripts/cf-audit-log/types.ts` に既存）
- 出力: `SeverityResult`（phase-03 で定義）
- 副作用: なし（純粋関数）。ログは呼出側 `analyze.ts` が出す

### CLI フラグ（`scripts/cf-audit-log/cli-args.ts` 拡張）

| フラグ | 型 | 既定 | 説明 |
| --- | --- | --- | --- |
| `--classifier` | `threshold`\|`ml` | `threshold` | 利用 classifier を強制指定（env より優先） |
| `--evaluate` | string (path) | undefined | 指定された JSONL dataset で offline replay を実行 |
| `--export-features` | string (path) | undefined | 取得 event を redacted feature に変換し JSONL 出力 |
| `--ml-model-path` | string (path) | undefined | ML モデルファイルパス（env `ML_MODEL_PATH` と同義） |

### Env

| env | 値 | 説明 |
| --- | --- | --- |
| `CF_AUDIT_CLASSIFIER` | `threshold`\|`ml` | classifier 切替（既定 `threshold`） |
| `ML_MODEL_PATH` | 絶対パス | 後続 production ML switch 用の予約 field。本サイクルの skeleton は設定有無にかかわらず threshold fallback |
| `CF_AUDIT_REDACT_SECRET` | 32 文字以上 | `actorRoleHash` の SHA-256 input prefix。未設定時はビルド時 default（test 環境のみ） |

### GitHub Issue 起票（`issue-reporter.ts` への影響）

- 既存形式は完全互換維持
- 追加: 本文末尾に `<!-- cf-audit-classifier: <classifierUsed>; version: <classifierVersion>; confidence: <n> -->` の HTML コメント 1 行を追加
- 追加: 人間可視部分にも `Classifier: <classifierUsed> version=<classifierVersion> confidence=<n>` を 1 行追加し、triage 時に判定器を確認できるようにする

### `analyze.ts` 副作用

- D1 insert 時に `classifier_used` / `classifier_version` / `confidence` 3 カラムを書き込む
- dry-run stdout は classifier metadata 付きの GitHub Issue body を生成し、最終行 JSON に `findings` 件数を出力する

### `offline-replay.ts` I/O

- 入力: JSONL dataset（1 行 = 1 `AuditEvent` + `expectedSeverity` ラベル）。redacted feature dataset は `analyze.ts --export-features` で別途生成し、feature leakage grep の対象にする
- 出力: phase-03 の JSON 形式（stdout または `--out=<path>`）

### `secret-leakage-grep.ts` I/O

- 入力: 検査対象 path（feature export / log）
- 検出パターン: 生 IP（`/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/` で `.0` 終端でないもの）/ 完全 UA（`Mozilla` + 完全文字列）/ メール（`@` 含む string）/ Token 形式（`[A-Za-z0-9_-]{30,}`）
- 検出時: stderr に該当行 / column / pattern を出し exit 1。未検出時 exit 0

## 完了条件

- [ ] CLI 4 フラグの型・既定値を確定
- [ ] env 3 個の意味を確定
- [ ] GitHub Issue 互換性を「人間可視部分変更なし」で確定
- [ ] D1 insert カラムを確定（classifier_used / classifier_version / confidence）

## 参照資料

- `index.md`
- `phase-03.md`

## 出力

- `outputs/phase-04/main.md`

## 統合テスト連携

- Phase 9 で各 I/O 境界の test ケース化

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- Phase 契約を確定する。
- skill 定義と正本仕様への整合を確認する。

| Task | 内容 |
| --- | --- |
| 04-1 | この Phase の契約を確定する |
| 04-2 | skill 定義と正本仕様への整合を確認する |

## 成果物/実行手順

- Phase 本文の出力パスへ成果物を配置する。
- 実装時は Phase 11 evidence と Phase 12 strict outputs に同期する。

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11 / Phase 12 の成果物を上流契約として参照する。
