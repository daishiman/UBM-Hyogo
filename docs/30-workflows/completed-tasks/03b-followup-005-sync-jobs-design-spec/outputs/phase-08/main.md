# Phase 8: database-schema.md の参照更新 + indexes drift 解消

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 8 / 13 |
| Phase 名称 | database-schema.md の参照更新 + indexes drift 解消 |
| 作成日 | 2026-05-02 |
| 前 Phase | 7 (03a / 03b task spec の参照差し替え) |
| 次 Phase | 9 (indexes 再生成 + drift 検証) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| Issue | #198（CLOSED, クローズドのまま docs 整備） |

## 目的

`.claude/skills/aiworkflow-requirements/references/database-schema.md` の `sync_jobs` 節を、Phase 6 で作成した `docs/30-workflows/_design/sync-jobs-spec.md` を正本とする参照型記述に書き換える。indexes の正規 evidence は Phase 9 で取得し、本 Phase では database-schema 参照化の差分確認だけを行う。

## 実行タスク

1. `database-schema.md` の `sync_jobs` 節を確認
2. `metrics_json` 説明を `_design/sync-jobs-spec.md` 参照に書き換え
3. `job_type` enum / lock TTL 記述を同様に参照型に書き換え
4. indexes 正規再生成を Phase 9 へ委譲
5. `verify-indexes-up-to-date` gate は Phase 13 後の PR evidence として扱う
6. Phase 4 で定義した verify suite を全件実行し evidence を保存

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | 編集対象（`sync_jobs` 節） |
| 必須 | docs/30-workflows/_design/sync-jobs-spec.md | 正本参照先 |
| 必須 | .github/workflows/verify-indexes.yml | CI gate 仕様 |
| 必須 | outputs/phase-04/verify-suite.md | verify suite 設計（Phase 4 成果物） |

## 実行手順（ステップ別）

### ステップ 1: `sync_jobs` 節の現状確認

`.claude/skills/aiworkflow-requirements/references/database-schema.md` を Read し、`sync_jobs` 節（cursor high-water mark 説明等を含む）の現行記述を `outputs/phase-08/before-snapshot.md` に保存。

### ステップ 2: `metrics_json` 説明の書き換え

該当節の `metrics_json` 説明を以下のフォーマットに書き換える:

```markdown
- `metrics_json`: 正本仕様は [docs/30-workflows/_design/sync-jobs-spec.md](../../../../docs/30-workflows/_design/sync-jobs-spec.md) を参照
```

（相対パスは `database-schema.md` の実位置から `_design/` への正しい階層に合わせること）

### ステップ 3: `job_type` enum / lock TTL の参照化

- `job_type` enum を列挙していた箇所を「正本: `_design/sync-jobs-spec.md`」に置換
- lock TTL（10 分）の記述を「正本: 同上」に置換

### ステップ 4: indexes 再生成

```bash
mise exec -- pnpm indexes:rebuild
git status --porcelain .claude/skills/aiworkflow-requirements/indexes
```

期待: 仮検証として drift 有無を確認する。正規 evidence は Phase 9 の `outputs/phase-09/indexes-rebuild.log` に保存する。

### ステップ 5: CI gate 確認

PR 上の `verify-indexes-up-to-date` job は Phase 13 後に確認する。本 Phase では CI pass を完了条件にしない。

### ステップ 6: verify suite 全実行

Phase 4 で定義した 4 系統の検査をすべて実行:

| 検査 | コマンド | 期待 |
| --- | --- | --- |
| grep | `rg -n "job_type|metrics_json|lock_acquired_at" docs/30-workflows .claude/skills apps/api/src/jobs` | 定義は `_design/sync-jobs-spec.md` のみ、他は参照 / 説明 |
| indexes | `mise exec -- pnpm indexes:rebuild && git status --porcelain` | 差分なし |
| cross-ref | `rg -n "_design/sync-jobs-spec.md" docs/30-workflows .claude/skills` | 03a / 03b / database-schema.md 全てで命中 |
| typecheck | `mise exec -- pnpm typecheck` | エラーなし（schema 変更なしで不変） |

各結果を `outputs/phase-08/verify-results.md` に集約。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | database-schema sync summary |
| ドキュメント | outputs/phase-08/before-snapshot.md | 編集前の `sync_jobs` 節スナップショット |
| ドキュメント | outputs/phase-08/verify-results.md | 4 系統検査結果 |
| データ | outputs/phase-08/indexes-probe.log | 任意の indexes 仮検証ログ |
| 編集差分 | .claude/skills/aiworkflow-requirements/references/database-schema.md | `sync_jobs` 節参照化 |
| 編集差分 | .claude/skills/aiworkflow-requirements/indexes/* | rebuild 結果（差分があれば） |
| メタ | artifacts.json | Phase 8 を completed に更新 |

## 統合テスト連携

- 本タスクは implementation / NON_VISUAL の仕様書作成であり、D1 DDL・API 挙動は変更しない。TS ランタイム正本と既存 consumer の参照化は本 wave で実施済み。
- 統合テストの実行は Phase 11 の NON_VISUAL evidence（cross-reference / job_type coverage / indexes drift）で代替する。
- 実装や schema drift が見つかった場合は、本タスク内で吸収せず別 follow-up に分離する。

## 完了条件

- [ ] `database-schema.md` の `sync_jobs` 節が `_design/sync-jobs-spec.md` を参照する形に置き換わっている
- [ ] indexes の正規 evidence を Phase 9 へ委譲している
- [ ] CI の `verify-indexes-up-to-date` gate を Phase 13 後の evidence として扱っている
- [ ] verify suite 4 系統すべてが期待結果に合致している
- [ ] 03a / 03b / `database-schema.md` 全てから `_design/sync-jobs-spec.md` への参照が張られている
- [ ] schema 変更なしのため typecheck がエラーなしで通る

## DoD（implementation / NON_VISUAL）

- `database-schema.md` 編集差分がレビュー可能な形でコミットされている
- indexes drift 正規確認は Phase 9 で実施
- 全参照リンクが解決可能（相対パス整合）
- 本タスク全 Phase（4〜8）の `outputs/phase-XX/main.md` が揃っている

## 次 Phase

- 次: 9（indexes 再生成 + drift 検証）
- 残課題があれば `unassigned-task` または別 follow-up として切り出すこと
- ブロック条件: indexes drift / CI gate red / 参照リンク切れ
