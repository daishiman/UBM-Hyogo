# Phase 7: コードレビュー / Security / Correctness / Observability

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| Source | `outputs/phase-7/phase-7.md` |
| 区分 | レビュー（実装変更は MINOR の差し戻しのみ） |
| 想定所要 | 0.25 人日 |

## 目的

Phase 5 / Phase 6 の実装と backfill 結果を、(a) security（path traversal / 機密値混入）、(b) correctness（schema refine / refile glob）、(c) observability（stdout フォーマット）の 3 観点でレビューし、Phase 8 CI 統合の GO 判定を行う。

## 実行タスク

### 7.1 セキュリティレビュー

| 項目 | 確認内容 | 期待 |
| --- | --- | --- |
| path traversal | `evidence_path = "../../../etc/passwd"` を渡すと `isPathSafe()` が false → ERROR を返す | TC-18 GREEN |
| symlink 経由の repo 外参照 | `evidence_path` が repo 内 symlink → 外部実体を指す場合の挙動 | `fs.access()` は symlink target の存在を見る → 外部実体を指す symlink は CI 上で意図的に作りにくいため許容、ただし JSDoc に注意書き |
| 機密値混入 | schema に `notes` を任意で許容しているが validator は内容を grep しない | 機密混入リスクは PR レビュー側に委ねる（コードレビュー指摘事項として記録） |
| 依存追加の supply chain | 新規 runtime 依存を追加しないこと。既存 `zod` / `tsx` の利用範囲に収める | `package.json` / `pnpm-lock.yaml` の差分で確認 |

### 7.2 Correctness レビュー

| 項目 | 確認内容 |
| --- | --- |
| `GateIdSchema` 正規表現 | `^Gate-[A-Z](-[A-Z0-9]+)*$` が `Gate-A` / `Gate-A-RUNTIME` / `Gate-B-FOO-2` を許容し `gate-a` / `Gate.A` / `Gate-` を reject するか TC で確認 |
| refine ロジック | `status === passed && passed_at === null` のみ reject、他組合せは pass する TC-2..TC-10 で確認 |
| glob pattern | `docs/30-workflows/**/artifacts.json` が root と outputs/ mirror の両方を hit する |
| JSON parse error | `artifacts.json` 自体が不正 JSON の場合 ERROR + 継続 |
| empty `gates: []` | 空配列は WARN/skip ではなく OK 0 件として扱う（schema は配列長 >= 0 を許容） |

### 7.3 Observability レビュー

| 項目 | 確認内容 |
| --- | --- |
| stdout フォーマット | `[OK]` / `[WARN]` / `[ERROR]` 接頭辞 + ファイル相対パス + メッセージ。MINOR DOC-M-02 に整合 |
| 集計行 | 末尾に `OK: N WARN: N ERROR: N` を出力 |
| exit code | error > 0 → 1、それ以外 → 0 |
| CI ログ可読性 | ERROR は最後に集約せず、検出時点で出力（CI ログで grep しやすい） |

### 7.4 MINOR 追跡（Phase 3 から）

| MINOR ID | Phase 7 確認結果 |
| --- | --- |
| DOC-M-01 | `GateIdSchema` 上に「カテゴリ階層を許容する意図」JSDoc 追加済みか確認 |
| DOC-M-02 | stdout フォーマットが §7.3 に整合するか確認 |
| TEST-M-01 | TC-18 path traversal が GREEN か確認 |

### 7.5 Phase 8 GO 判定

- GO 条件: §7.1 / §7.2 / §7.3 全項目 PASS / MINOR 全件解決確認 / Phase 6 ローカル品質ゲート全 exit 0。
- NO-GO 条件: path traversal が検知されない / refine ロジックが TC-7 を reject しない / stdout 集計行が出ない。

## 変更対象ファイル

レビューのみ。MINOR 差し戻しが発生した場合は Phase 5 ファイルへ最小修正を入れる。

## 入出力・副作用

- 入力: Phase 5 / Phase 6 成果物。
- 出力: `outputs/phase-7/phase-7.md`（チェック表 + MINOR 解決確認）。
- 副作用: なし（差し戻し時のみ）。

## テスト方針

新規テスト追加なし。Phase 4 / Phase 5 で作った TC-1..TC-20 の green を再確認。

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/shared test gate-metadata
mise exec -- pnpm vitest run scripts/gate-metadata
mise exec -- pnpm gate-metadata:validate
```

## 統合テスト連携

- Phase 8 は本 Phase の GO 判定後に CI workflow を投入する。
- Phase 9 はワークスペース全体で再検証。

## 多角的チェック観点（AIが判断）

- **シンプルさ vs 厳格さ**: schema を過剰に厳格化（例: notes に最大長）すると将来の柔軟性を損なう。最小限の制約に留める方針を維持。
- **Performance**: docs/30-workflows 配下のファイル数は小さく、Node `fs.readdir` recursion で十分高速。追加 glob 依存は不要。

## サブタスク管理

- ST-1: §7.1 セキュリティ全項目チェック
- ST-2: §7.2 correctness 全項目チェック
- ST-3: §7.3 observability 全項目チェック
- ST-4: MINOR DOC-M-01 / DOC-M-02 / TEST-M-01 解決確認
- ST-5: Phase 8 GO 判定

## 成果物

- `outputs/phase-7/phase-7.md` にチェック表と判定根拠。

## 完了条件（DoD）

- [ ] §7.1 4 項目すべて PASS。
- [ ] §7.2 5 項目すべて PASS。
- [ ] §7.3 4 項目すべて PASS。
- [ ] MINOR 3 件すべて Phase 7 で解決確認済み。
- [ ] Phase 8 GO 判定根拠記録済み。

## タスク100%実行確認【必須】

- [ ] ST-1 ... ST-5 すべて完了
- [ ] `outputs/phase-7/phase-7.md` 生成済み
- [ ] Phase 8 着手 GO 判定済み

## 次Phase

[Phase 8: CI 統合](phase-08.md)

## 参照資料

- `docs/30-workflows/issue-589-gate-metadata-structured-ledger/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`
