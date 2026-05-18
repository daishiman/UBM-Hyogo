# Phase 1 — 要件定義

## 1. 背景

task-27 (UI MVP W9 SOLO MVP 3-Layer Task Mapping) は docs-only / NON_VISUAL タスクで、Phase 11 evidence は `manual-test-result.md` / `manual-smoke-log.md` / `link-checklist.md` などのテキスト証跡で代替している。

Phase 12 では `outputs/phase-12/phase12-task-spec-compliance-check.md` 内 `## 4. Phase 11 evidence file inventory` 表に `| classification | path | status |` 形式で証跡を列挙し、`status` 列に `present` を記載する運用となっている。

しかし現状の `scripts/lib/phase12-compliance/verify-compliance-file.ts` は **canonical heading の有無のみ**を検査するため、表内で `present` と書かれていても実体ファイルが存在しないまま CI gate（`verify-phase12-compliance`）を通過する運用ホールが残る。

## 2. 課題

| 課題 | 詳細 |
| --- | --- |
| 宣言と実体の drift | `present` 宣言と実体ファイル存在を機械突合する手段が無い |
| docs-only 代替証跡の網羅不足 | `manual-test-result.md` / `manual-smoke-log.md` / `link-checklist.md` のパターンが validator 側で明示されていない |
| 既存 validator との責務未分離 | `validate-phase11-canonical-evidence-paths.js` は JSON manifest 専用で、Phase 12 compliance check markdown は対象外 |

## 3. 達成すべき成果

- `phase12-task-spec-compliance-check.md` の Phase 11 evidence 表で `present` と宣言された **全 path** について、対応するファイルが workflow root 配下に物理的に存在することを検証する自動チェック
- docs-only / NON_VISUAL タスクで頻出する代替証跡 3 パターンが validator の test fixture で網羅されている
- 不一致が 1 件でもあれば CI gate `verify-phase12-compliance` が fail

## 4. 機能要件（FR）

- **FR-1**: parser は `## 4. Phase 11 evidence file inventory` または `## Phase 11 evidence file inventory` の直下 markdown table を抽出する
- **FR-2**: 表は `| <任意ラベル> | <evidencePath> | <status> |` の 3 列 + ヘッダ + 区切り行を許容（4 列以上の場合は左 3 列のみ採用）
- **FR-3**: `status` の正規表記は `present` / `pending` / `n/a` の 3 値。それ以外は `unknown` として fail 扱い
- **FR-4**: `status === "present"` の各 path について `fs.existsSync(resolve(workflowRoot, evidencePath))` を実行
- **FR-5**: missing が 1 件以上発生した場合、`ComplianceCheckResult` を `{ ok: false, reason: "missing-evidence", details: "missing evidence: <path>, <path>..." }` で返す
- **FR-6**: evidence 表が存在しない／空の場合は warning ではなく fail（`reason: "missing-evidence"`、`details: "phase-11 evidence inventory empty or missing"`）
- **FR-7**: 表内に重複 path がある場合は 1 回のみ検査（重複自体は fail にしない）

## 5. 非機能要件（NFR）

- **NFR-1**: 単一 markdown file の parse は 50ms 以内で完了すること（現実的な workflow root 数前提）
- **NFR-2**: Node 24 の標準 API のみで実装（外部 markdown parser 依存禁止）
- **NFR-3**: 既存 `verify-compliance-file.ts` の canonical heading 検査と直列実行され、heading missing 時には evidence existence チェックを skip する（heading missing fail を優先）

## 6. 受け入れ条件（AC）

| AC ID | 内容 |
| --- | --- |
| AC-1 | `pnpm test scripts/__tests__/verify-phase12-compliance.spec.ts` で `pass` fixture が green |
| AC-2 | 新規 `fail-missing-evidence` fixture（`present` 宣言 1 件以上が実体不在）が red |
| AC-3 | docs-only 3 点（`manual-test-result.md` / `manual-smoke-log.md` / `link-checklist.md`）を網羅したケースが green |
| AC-4 | `pnpm verify:phase12-compliance` を本タスク自身の workflow root で実行して exit 0 |
| AC-5 | 既存 `pass` / `fail-missing-file` / `fail-missing-heading` fixture が依然として期待通りの結果を返す（regression なし） |

## 7. スコープ外

- `pull_request` トリガー復活（MVP-PAUSE 維持）
- `required_status_checks` への正式追加
- evidence ファイルの内容妥当性検証
