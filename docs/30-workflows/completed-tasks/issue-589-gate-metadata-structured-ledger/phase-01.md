# Phase 1: 要件定義 / P50 既存実装不在チェック / Acceptance Criteria 確定 / GO 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| Source | `outputs/phase-1/phase-1.md` |
| 区分 | 設計（実装なし。schema フィールド・validator 振る舞い・CI gate 仕様の SSOT を確定） |
| 想定所要 | 0.25 人日 |

## 目的

Issue #549 の自由文 `gateConditions[]` を構造化 `gates[]` ledger に置き換えるため、(a) 既存実装が repo 内に不在であることを P50 チェックで確認し、(b) schema フィールドの正本仕様と validator の振る舞いを SSOT として確定し、(c) Phase 4 以降の test-first / 実装で参照する acceptance criteria を AC-1 ... AC-7 として番号付きで定義する。

## 実行タスク

1. **Step 0: P50 既存実装チェック（必須）**
   - `rg --files packages/shared/src/gate-metadata/ scripts/gate-metadata/ 2>&1` が「No files were found」を返すこと（既存ディレクトリ不在）。
   - `rg 'metadata\.gates\b' docs/30-workflows packages apps scripts 2>&1` が hit 0（schema 利用なし）。
   - `rg 'gate-metadata' .github/workflows package.json 2>&1` が hit 0（既存 CI gate / npm script なし）。
   - `git log --oneline --all -- packages/shared/src/gate-metadata 2>&1` が空（過去にも実装履歴なし）。
   - これらにより greenfield 実装であることを確定する（既存 hardening / formalize の follow-up ではない）。

2. **schema フィールド SSOT 化**

   | フィールド | 型 | 必須 | 制約 |
   | --- | --- | --- | --- |
   | `gate_id` | string | 必須 | 正規表現 `^Gate-[A-Z](-[A-Z0-9]+)*$`（例: `Gate-A`, `Gate-B-RUNTIME`） |
   | `status` | enum | 必須 | `pending` / `passed` / `failed` / `waived` の 4 値 |
   | `passed_at` | string \| null | 条件付き必須 | ISO8601 datetime。`status === passed` の時のみ非 null 必須。それ以外は null 許容 |
   | `evidence_path` | string | 必須 | repo root からの相対パス。`status === passed` の時は実体存在を validator が確認する |
   | `approver` | string | 必須 | GitHub username（例 `daishiman`）または `CODEOWNERS:<group>` 形式 |
   | `notes` | string | 任意 | 自由記述。validator は内容を検証しない |

3. **validator の振る舞い SSOT 化**
   - 入力: `docs/30-workflows/**/artifacts.json` 配下の全ファイル（root と `outputs/` mirror の双方）。
   - 各ファイルから `metadata.gates`（型: array）を取得。**フィールド不在は WARN/skip**（historical artifacts 後方互換）。**存在するが配列でない場合は ERROR**。
   - 各 entry を `GateEntrySchema.parse()` に通し、失敗を集約。
   - `status === passed` の entry に対し `fs.existsSync(evidence_path)` を確認。不在は ERROR。
   - exit code: 0（全 OK / WARN のみ）/ 1（ERROR が 1 件以上）。stdout に集計（`OK: N / WARN: N / ERROR: N`）。

4. **Acceptance Criteria（番号付き / Phase 4 以降の test-first 基準）**
   - **AC-1**: `GateEntrySchema` は §2 表の 6 フィールドを正しく型付けし、不正値（gate_id 正規表現外 / status 列挙外 / passed_at 非 ISO8601）を `parse()` で reject する。
   - **AC-2**: `status === passed` で `passed_at === null` の entry は refine で reject される。
   - **AC-3**: `status !== passed`（pending/failed/waived）で `passed_at === null` の entry は許容される。
   - **AC-4**: CLI validator は `docs/30-workflows/**/artifacts.json` を再帰走査し、`metadata.gates` 不在ファイルを WARN として skip、配列でない場合は ERROR とする。
   - **AC-5**: CLI validator は `status === passed` の `evidence_path` 実体不在を ERROR で検知し、exit 1 を返す。
   - **AC-6**: `.github/workflows/verify-gate-metadata.yml` が `**/artifacts.json` 変更 PR で発火し、`pnpm gate-metadata:validate` を実行する。branch protection の required status check 化は user approval 後に分離する。
   - **AC-7**: Issue #549 の `artifacts.json` と `outputs/artifacts.json` に `gates[]` 4 件（Gate-A: passed / Gate-B/C: pending / Gate-D: waived）が backfill され、validator が exit 0 を返す。

5. **spec-extraction-map**

   | aiworkflow-requirements 上 SSOT | current code anchor | 本タスクで追加する SSOT |
   | --- | --- | --- |
   | gate 履歴の機械検証要件 | （不在） | `.claude/skills/aiworkflow-requirements/references/gate-metadata.md` 新規 |
   | Phase 12 compliance check の自動化 | `.claude/skills/task-specification-creator/references/phase12-checklist-definition.md`（編集前） | 同 file に「gate-metadata validator green」項目追記 |
   | zod schema 採用パターン | `apps/web/src/lib/env.ts` | `packages/shared/src/gate-metadata/schema.ts` で同パターン継承 |

6. **gate 重複明記（CLAUDE.md / phase-template-core.md §Phase 1）**
   - 上流ブロッカー: 「zod が `packages/shared` 依存に含まれない」場合、Phase 2 / Phase 3 / NO-GO 条件の 3 箇所で重複明記する。
   - 現状は追加依存なし。既存 `zod` / `tsx` を利用し、validator の artifact walk は Node 標準ライブラリで実装する。

7. **GO/NO-GO 判定**
   - GO 条件: §1 P50 チェック全項目 hit 0 / §2 schema フィールド表確定 / §3 validator 振る舞い確定 / §4 AC-1 ... AC-7 確定 / zod 依存解決経路確定。
   - NO-GO 条件: ①既存 `metadata.gates` 利用が hit する（重複実装）/ ②`gate_id` 正規表現が既存 gate 命名と整合しない / ③validator が後方互換（gates[] 不在 = WARN/skip）を放棄してしまう / ④Phase 12 compliance template 更新経路が見えない。

## 変更対象ファイル

本 Phase は設計のみで実装ファイル変更なし。次フェーズ以降の前提を `outputs/phase-1/phase-1.md` に記録する。

## 入出力・副作用

- 入力: 起票元 `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-04.md` / 親 #549 `artifacts.json` / `apps/web/src/lib/env.ts` zod パターン / CLAUDE.md。
- 出力: `outputs/phase-1/phase-1.md`（決定事項 + AC-1 ... AC-7 列挙）。
- 副作用: なし（ドキュメント生成のみ）。

## テスト方針

本 Phase はテストコード追加なし。AC-1 ... AC-7 は Phase 4 で vitest テストケースに 1:1 マッピングする。

## ローカル実行・検証コマンド

```bash
# P50 既存実装不在の確認
rg --files packages/shared/src/gate-metadata/ scripts/gate-metadata/ 2>&1 || echo "OK: no files"
rg 'metadata\.gates\b' docs/30-workflows packages apps scripts 2>&1 || echo "OK: no usage"
rg 'gate-metadata' .github/workflows package.json 2>&1 || echo "OK: no ci/script"

# zod 依存の現状確認
grep '"zod"' packages/shared/package.json || echo "WARN: need to add zod dep in Phase 2"

# 親 #549 artifacts.json 構造確認
cat docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json | python3 -m json.tool > /dev/null && echo OK
```

## 統合テスト連携

- Phase 2 はモジュール配置（`packages/shared/src/gate-metadata/` と `scripts/gate-metadata/`）と CI workflow trigger を本 Phase の SSOT に整合させる。
- Phase 3 は AC-1 ... AC-7 の網羅性 / refine 妥当性 / 後方互換方針を最終レビューする。
- Phase 4 は AC-1 ... AC-7 を vitest テストケース TC-1 ... TC-N にマッピングする。

## 多角的チェック観点（AIが判断）

- **後方互換**: 既存 historical artifacts.json で `gates[]` 不在を WARN/skip にしないと CI が即時 fail し、無関係な PR を全件ブロックする。
- **schema の厳格さ**: `gate_id` 正規表現が緩すぎると将来「gate-a」「Gate.A」等の表記揺れが混入する。Phase 2 で extension パターンを最小限に固定。
- **path traversal 防止**: validator が `evidence_path` 実体確認時に `..` を許容すると repo 外を見れる。Phase 7 セキュリティレビューで対応。

## サブタスク管理

- ST-1: P50 既存実装不在チェック実行
- ST-2: schema フィールド表 + 制約確定
- ST-3: validator 振る舞い表確定
- ST-4: AC-1 ... AC-7 列挙
- ST-5: GO 判定根拠記録

## 成果物

- `outputs/phase-1/phase-1.md` に以下を記録:
  - 決定事項 1: P50 既存実装不在の grep 結果
  - 決定事項 2: schema フィールド 6 種の最終仕様表
  - 決定事項 3: validator 振る舞い（WARN/skip / ERROR / exit code 仕様）
  - 決定事項 4: AC-1 ... AC-7 列挙
  - 決定事項 5: spec-extraction-map
  - 決定事項 6: GO 判定根拠

## 完了条件（DoD）

- [ ] P50 既存実装不在の確認結果（rg 4 件分の hit 0）が記録されている。
- [ ] schema フィールド表（6 フィールド × 制約）が確定している。
- [ ] validator 振る舞い表（入力 / フィールド不在時挙動 / exit code）が確定している。
- [ ] AC-1 ... AC-7 が番号付きで列挙されている。
- [ ] spec-extraction-map に aiworkflow-requirements / phase12 template / zod パターンの 3 anchor が記録されている。
- [ ] GO/NO-GO 判定根拠が記載されている。

## タスク100%実行確認【必須】

- [ ] ST-1 ... ST-5 すべて完了
- [ ] `outputs/phase-1/phase-1.md` 生成済み
- [ ] Phase 2 着手 GO 判定済み

## 次Phase

[Phase 2: アーキテクチャ設計](phase-02.md)

## 参照資料

- `docs/30-workflows/issue-589-gate-metadata-structured-ledger/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`
