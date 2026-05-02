# Phase 4: テスト戦略 — ut-09a-exec-staging-smoke-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-exec-staging-smoke-001 |
| phase | 4 / 13 |
| wave | Wave 9 |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

実 staging 環境で実行する smoke / sync validation について、自動化テスト・手動 smoke・
evidence 取得の役割分担と、各 AC の検証戦略を確定する。

## 実行タスク

1. UI smoke を Playwright staging profile（自動）と手動 smoke のどちらで満たすか AC 単位で割り当てる。
2. Forms sync の正常系・異常系（重複 409, lock 状態, schema mismatch）の検証ケースを列挙する。
3. `bash scripts/cf.sh` 経由 tail 取得期間（30 分相当）の妥当性確認方法を定める。
4. evidence ファイル単体での自動検証（path 存在 / size / 形式）を追加するか判断する。

## 参照資料

- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md
- apps/web 配下の playwright 設定（実在確認）
- apps/api 配下の sync endpoint 実体
- .claude/skills/task-specification-creator/scripts/validate-phase-output.js

## テスト戦略

### Layer 1: 自動 smoke（Playwright staging）

- 対象 AC: AC-2 の screenshot / report
- 範囲: 公開トップ / ログイン導線 / プロフィール / 管理画面 / 認可境界
- 失敗時: trace を保存し、原因分析後に再実行か手動 fallback に切替

### Layer 2: 手動 smoke

- 対象 AC: Playwright 未整備時の AC-2 fallback、AC-1 placeholder 置換確認
- 取得物: スクリーンショット（PII redaction 済）+ `manual-smoke-log.md`

### Layer 3: Forms sync 検証

- 対象 AC: AC-3
- ケース: schema sync, responses sync, 重複 sync (409 想定), lock 状態
- evidence: `sync-jobs-staging.json`（`sync_jobs` テーブル dump）

### Layer 4: Workers 観測

- 対象 AC: AC-4
- 取得物: `wrangler-tail.log`（redacted）または取得不能理由

### Layer 5: artifacts parity 検証

- 対象 AC: AC-5
- 手段: `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation`
- 期待: artifacts parity PASS

### Layer 6: 09c blocker 更新検証

- 対象 AC: AC-6
- 手段: `references/task-workflow-active.md` の diff 確認

## 統合テスト連携

- 08b Playwright scaffold が前提（不在時は手動 fallback を選択）
- U-04 Forms sync の audit ledger schema と整合

## 多角的チェック観点

- ハッピーパスのみで PASS にしない
- 取得不能を PASS と扱わない（理由を必ず evidence に残す）
- redaction 漏れがないかレビュー観点に含める

## サブタスク管理

- [ ] 各 AC に Layer を割り当てる
- [ ] Forms sync 異常系ケースを列挙する
- [ ] `bash scripts/cf.sh` 経由 tail 取得不能時の代替を定義する
- [ ] evidence path 自動検証スクリプトを採用するか決定する
- [ ] outputs/phase-04/main.md を作成する

## 成果物

- outputs/phase-04/main.md

## 完了条件

- AC-1〜AC-6 がいずれかの Layer で検証可能になっている
- 異常系ケースが列挙されている
- 取得不能時の fallback が明記されている

## タスク100%実行確認

- [ ] AC ↔ Layer の割当に漏れがない
- [ ] 自動 / 手動の役割分担が明確である
- [ ] redaction ルールが含まれている

## 次 Phase への引き渡し

Phase 5 へ、AC ↔ Layer 割当、異常系ケース、取得不能時 fallback を渡す。
