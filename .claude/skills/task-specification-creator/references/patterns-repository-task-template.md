# Repository / NON_VISUAL タスク向けテンプレ補強

UBM-Hyogo `02b-parallel-meeting-tag-queue-and-schema-diff-repository` Phase 12 close-out で抽出された苦戦知見を、`task-specification-creator` のテンプレ運用に組み込むためのガイド。

- 同期日: 2026-04-27
- 一次ソース: `docs/30-workflows/completed-tasks/02b-parallel-meeting-tag-queue-and-schema-diff-repository/outputs/phase-12/skill-feedback-report.md`
- 関連: `aiworkflow-requirements` の `references/lessons-learned-02b-schema-diff-and-tag-queue.md`

---

## 1. NON_VISUAL タスクガード（Phase 11）

### 適用判定
タスク種別が以下のいずれかなら **NON_VISUAL**:
- `repository`（D1/KV/R2 アクセス層のみ）
- `type-only`（型定義 / zod schema のみ）
- `cli` / `script`（CLI ツールやスクリプトのみで UI なし）
- `migration`（DB マイグレーション SQL のみ）

### NON_VISUAL の場合の Phase 11 雛形差し替え
- screenshot 系成果物（`screenshot-*.png`, `screenshot-plan.json`）は **不要扱い**（compliance-check で許容）
- 代替成果物: `non-visual-evidence.md`（型チェック PASS / unit test PASS の証跡サマリ）
- `manual-test-checklist.md` は CLI 実行・API 呼び出し・SQL 実行の手順に置換

### 仕様書生成時のチェック
1. Phase 1 の `task-classification` セクションに `visual: false` を明示
2. Phase 11 雛形を NON_VISUAL 版で差し替え
3. compliance-check の Phase 11 行に「NON_VISUAL: PASS（screenshot 不要）」を出力

---

## 2. 状態遷移 repository 向け ALLOWED 表（Phase 2 必須）

状態列を持つ repository（attendance, queue, status 系）では、Phase 2 設計成果物に **ALLOWED 表** を必須セクションとする。

### ALLOWED 表のフォーマット
| from | to | 条件 | 担当メソッド |
| --- | --- | --- | --- |
| `pending` | `present` | 出席記録 | `markPresent()` |
| `pending` | `absent` | 欠席記録 | `markAbsent()` |
| `present` | `pending` | 取消（管理者のみ） | `revertAttendance()` |
| `*` | `*` | 上記以外は禁止 | — |

### Phase 6 異常系 4 軸テンプレ
状態遷移系 repository の異常系テストは以下 4 軸を必須:
1. **D1 失敗**: prepare/bind 失敗、binding 不在
2. **状態遷移**: ALLOWED 表外の遷移、idempotency
3. **認可**: caller role 不整合、admin-only への一般 caller
4. **race**: 同時 enqueue/resolve、二重投入、版数競合

---

## 3. 公開 API signature 表（Phase 12 必須）

repository 系タスクでは Phase 12 `implementation-guide.md` に **公開 API signature 表** を必須セクションとする。

### フォーマット例
| メソッド | signature | 副作用 | 備考 |
| --- | --- | --- | --- |
| `enqueue(input)` | `(input: EnqueueInput) => Promise<{id: string}>` | INSERT | idempotency-key 必須 |
| `resolve(id, by)` | `(id: string, by: AdminId) => Promise<void>` | UPDATE | not-found 時はエラー |
| `getLatestVersion()` | `() => Promise<SchemaVersion \| null>` | read-only | `ORDER BY synced_at DESC` |

---

## 4. Phase 12 Step 2 再判定ガード（spec_created / docs_only からの実装混入対策）

タスク metadata で `type: spec_created` または `type: docs_only` 宣言下でも実装ファイルが付随した場合の再判定手順:

### Step 2 再判定チェックリスト
1. `git diff main...HEAD` で実装ファイル（`apps/`, `packages/` 配下の `.ts`/`.tsx` 等）が含まれているか確認
2. 実装ありなら metadata の `type` を `implementation` に再評価
3. Phase 4-6 雛形を実装版に差し替え（test 必須、failure-cases 必須）
4. compliance-check に「Step 2 再判定: spec_created → implementation」を 1 行記録
5. system spec 反映の同一wave同期対象に追加

### 適用例（02b 実例）
- 当初: `type: docs_only`
- 実装混入を検知: `apps/api/src/repository/` 配下に 7 ファイル + テスト
- 再判定: `type: implementation` に変更し通常 close-out（PASS）

---

## 関連参照

- `references/phase-11-guide.md` の VISUAL 判定ロジック
- `references/phase-11-12-guide.md` の compliance-check フォーマット
- `references/patterns-phase12-sync.md` の同一wave同期手順
- `aiworkflow-requirements/references/lessons-learned-02b-schema-diff-and-tag-queue.md` の苦戦知見
