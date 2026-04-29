# skill feedback report

本タスク（03b）を Phase 1〜12 で実行した経験から、`task-specification-creator` skill と
sync 系実装支援への改善案をまとめる。

## 1. task-specification-creator への提案

### 1.1 並列 wave で共有モジュールの owner を index.md に明示

- 現状: 並列タスク（03a / 03b）が `_shared/ledger.ts` / `_shared/sync-error.ts` を共同保守する設計だが、index.md の dependency matrix に「owner」列がない。
- 提案: dependency matrix に **owner / co-owner** 列を追加し、共有モジュールの責任所在を spec 段階で固定する。

### 1.2 PII 配慮 checklist のテンプレ標準化

- 現状: Phase 9 の secret-hygiene.md で PII redact を扱うが、テンプレ側にチェック項目がなく、各タスク独自で書き起こしている。
- 提案: `_templates/phase-template-app.md` の Phase 9 節に「PII redact checklist」を標準セクション化:
  - log に responseEmail / responseId / questionId が出ない
  - metrics_json に PII を入れない
  - archive / 保管期間の記載
  - Cloudflare Secrets / GitHub Secrets / GitHub Variables / 1Password の使い分け

### 1.3 consent 正規化ルールの spec 集約

- 現状: 本タスクの `extract-consent.ts` で `'同意する' / '同意します' / 'yes'` 等の文字列マッチ表をローカル定義している。複数の sync / API task が同じ規則を独自に持つとドリフトしやすい。
- 提案: `specs/01-api-schema.md` または新規 `specs/consent-normalization.md` に正本化し、各 task はそこから参照する構造にする。

### 1.4 共通 ledger（sync_jobs）の挙動を `_design/` で集約

- 現状: 03a / 03b ともに `sync_jobs` を使うが、`job_type` enum / `metrics_json` schema / lock TTL を各タスクが微妙に違う形で扱う。
- 提案: `_design/sync-jobs-spec.md` を切り、`job_type` enum, `metrics_json schema (zod or JSON Schema)`, lock TTL の正本を共有する。各タスクはそこを差分参照のみで進める。

## 2. sync 系実装スキル（仮）への提案

### 2.1 Cloudflare Workers sync ジョブの「最低限テンプレ」を spec に持つ

- runResponseSync のような sync entry には、毎回以下が必要:
  - lock 取得 / 解放（`acquireSyncLock` / `releaseSyncLock`）
  - cursor 読み書き（`readLastCursor` / `metrics_json` への保存）
  - per sync write cap（無料枠保護）
  - try / catch で `start()` / `succeed()` / `fail()` ledger 書き込み
- これらが各 sync task で重複しているため、`_shared/createSyncRunner` のようなユーティリティを spec 段階で要請するとよい。

### 2.2 fixture ディレクトリ構造の統一

- 本タスクでは `apps/api/src/jobs/__fixtures__/` に fixture を配置したが、03a / 08b と命名規則が揃っていない。
- 提案: `__fixtures__/forms-list-{scenario}.json` のような命名規則を `_templates/` に明文化。

## 3. orchestration / phase 進行への提案

### 3.1 Phase 11 の「UI 無しタスク」運用ガイドライン

- 本タスクは UI を持たず、Phase 11 の手動 smoke は curl/wrangler 証跡のみとなる。
- 提案: Phase 11 テンプレに「UI 無しタスクの場合は証跡テンプレ整備で完了とし、staging 値埋めを後続オペに委ねる」ルートを明記。

### 3.2 Phase 12 成果物の明確な必須セット

- 「6 成果物」と書かれているが main.md を含めて 7 ファイル必要なのか、main.md は別カウントなのかが phase-12.md の本文と outputs 表で読み手に揺れる。
- 提案: テンプレに「Phase 12 成果物 = main.md + 6 ファイル」と明確に書き、artifacts.json の outputs 配列も 7 件で固定する。

## 4. 既に取り入れて良かった点（記録）

- AC マトリクス（AC ↔ test ↔ code）を Phase 7 で必須化したことで、Phase 10 のレビューが速かった。
- `mise exec --` 強制ルールを CLAUDE.md に集約したことで、Node バージョン不整合の事故が出なかった。
- `scripts/cf.sh` ラッパー方針により、wrangler の OAuth トークン残留事故を回避できた。

---

## 提案の優先度

| # | 提案 | 優先度 | 影響範囲 |
|---|------|--------|---------|
| 1.1 | owner 列の追加 | 高 | 並列 wave 全般 |
| 1.2 | PII checklist テンプレ化 | 高 | 全 wave（Phase 9） |
| 1.3 | consent 規則の spec 集約 | 中 | sync / API 系 |
| 1.4 | sync_jobs spec の `_design/` 化 | 中 | sync 系 |
| 2.1 | createSyncRunner ユーティリティ要請 | 中 | sync 系 |
| 2.2 | fixture 命名規則 | 低 | 全タスク |
| 3.1 | UI 無しタスクの Phase 11 ルート | 高 | テンプレ |
| 3.2 | Phase 12 成果物の数明確化 | 中 | テンプレ |
