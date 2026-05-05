# Phase 4: verify suite 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 4 / 13 |
| Phase 名称 | verify suite 設計 |
| 作成日 | 2026-05-02 |
| 前 Phase | 3 (実装計画) |
| 次 Phase | 5 (既存定義棚卸し) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| Issue | #198（CLOSED, クローズドのまま docs 整備） |

## 目的

`sync_jobs` の `job_type` enum / `metrics_json` schema / lock TTL を `docs/30-workflows/_design/sync-jobs-spec.md` に集約する implementation / NON_VISUAL タスクの **検証手段（verify suite）** を Phase 5 以降の実作業に先立って確定する。

本 Phase は実ファイルを書き換えず、検証コマンド列・検査項目・evidence 配置先を `outputs/phase-04/main.md` に固定する。

## 実行タスク

1. grep ベース検証コマンドの確定（参照箇所の網羅）
2. indexes drift 検証の確定（`mise exec -- pnpm indexes:rebuild` 差分なし）
3. cross-ref 検証の確定（`_design/sync-jobs-spec.md` への片側リンクが 03a / 03b / database-schema.md 全てから張られている）
4. typecheck の前後比較（schema 変更なし = 差分ゼロ）の確認方針
5. evidence ファイル配置設計（`outputs/phase-04/verify-suite.md`）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-005-sync-jobs-design-spec.md | 正本タスク指示書 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | sync_jobs 節 |
| 必須 | apps/api/src/jobs/sync-forms-responses.ts | 実装側 job_type / metrics_json / lock TTL の根拠 |
| 必須 | .github/workflows/verify-indexes.yml | `verify-indexes-up-to-date` gate 仕様 |
| 任意 | docs/30-workflows/_design/ | 集約先ディレクトリ（Phase 6 で作成） |

## 実行手順（ステップ別）

### ステップ 1: grep 検証コマンドの確定

`outputs/phase-04/main.md` に以下を記載する:

```bash
rg -n "job_type|metrics_json|lock_acquired_at" \
   docs/30-workflows .claude/skills apps/api/src/jobs
```

- 期待: Phase 7 / 8 完了時点で「定義の重複」が docs 側から消え、参照リンクのみが残る
- 出力スナップショットを `outputs/phase-04/grep-baseline.txt` に保存

### ステップ 2: indexes drift 検証

```bash
mise exec -- pnpm indexes:rebuild
git status --porcelain .claude/skills/aiworkflow-requirements/indexes
```

- 期待: Phase 8 終了時点で `git status` 出力が空
- evidence: `outputs/phase-04/indexes-drift-policy.md`

### ステップ 3: cross-ref 検証

| 参照元 | 参照先 | 検査方法 |
| --- | --- | --- |
| 03a sync task spec | `docs/30-workflows/_design/sync-jobs-spec.md` | `rg -n "_design/sync-jobs-spec.md" docs/30-workflows` で 1 件以上 |
| 03b 関連 task spec | 同上 | 同上 |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 同上 | 同上 |

### ステップ 4: typecheck 前後比較

- 本タスクは schema 変更を伴わない implementation / NON_VISUAL のため、`mise exec -- pnpm typecheck` の結果が main 比で不変であることを確認する
- evidence: `outputs/phase-04/typecheck-invariance.md`

### ステップ 5: evidence ファイル配置設計

`outputs/phase-04/` 配下に以下を Phase 5 以降で生成する設計とする:

| ファイル | 由来 Phase |
| --- | --- |
| main.md | Phase 4 |
| verify-suite.md | Phase 4 |
| grep-baseline.txt | Phase 5 でも更新 |
| indexes-drift-policy.md | Phase 8 で確認 |
| typecheck-invariance.md | Phase 8 で確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | verify suite 全体方針 |
| ドキュメント | outputs/phase-04/verify-suite.md | 検査項目テーブル |
| メタ | artifacts.json | Phase 4 を completed に更新 |

## 統合テスト連携

- 本タスクは implementation / NON_VISUAL の仕様書作成であり、D1 DDL・API 挙動は変更しない。TS ランタイム正本と既存 consumer の参照化は本 wave で実施済み。
- 統合テストの実行は Phase 11 の NON_VISUAL evidence（cross-reference / job_type coverage / indexes drift）で代替する。
- 実装や schema drift が見つかった場合は、本タスク内で吸収せず別 follow-up に分離する。

## 完了条件

- [ ] grep 検証コマンドが `main.md` に記載されている
- [ ] indexes drift 検証手順が確定している
- [ ] cross-ref 検証マトリクスが確定している
- [ ] typecheck 不変性検証方針が記載されている
- [ ] evidence ファイル配置が表で確定している

## DoD（implementation / NON_VISUAL）

- 仕様ファイル（main.md / verify-suite.md）が `outputs/phase-04/` に存在する
- 参照リンクがすべて有効（リンク切れなし）
- indexes drift がない（本 Phase は仕様のみのため、`indexes:rebuild` の差分は出ない想定）

## 次 Phase

- 次: 5 (既存定義棚卸し — 03a / 03b / 実装の 3 面差分抽出)
- 引き継ぎ事項: verify suite の grep / indexes / cross-ref / typecheck 4 系統の検査項目
- ブロック条件: verify-suite.md 未作成 / 検査コマンド未確定
