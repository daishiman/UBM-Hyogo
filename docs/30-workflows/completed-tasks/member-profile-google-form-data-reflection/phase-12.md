# Phase 12: ドキュメント更新（6 成果物）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 12 / 13 |
| TASK_ID | `TASK-MEMBER-FORM-DATA-REFLECTION-001` |
| task 分類 | **VISUAL**（Phase 11 の before/after screenshot 参照を implementation-guide に明記する） |
| 前提 | Phase 11 完了（3 層評価枠組み・capture 計画確定。実 capture は user-gated pending） |
| 成果物配置 | `outputs/phase-12/`（6 成果物・全件出力必須） |

## 目的

実装（Lane A/B）と復旧 runbook（Lane C）の内容を、6 成果物として文書化する。本 phase は **6 成果物の実体ファイルを作成し、aiworkflow-requirements 正本同期と検証結果を固定する**。VISUAL のため、Phase 11 の screenshot 参照を implementation-guide に必ず含める。

## 実行タスク

Phase 12 開始時の最初の作業として、`outputs/artifacts.json` と各 `phase-*.md` の artifact 名を 1:1 で突合し、不一致があれば着手前に修正する（[Feedback 2]）。

### Task 12-1: 実装ガイド作成（`implementation-guide.md`・2 パート構成）

| パート | 対象読者 | 必須内容 |
|--------|---------|---------|
| Part 1 | 初学者・中学生レベル | 日常の例え話で「なぜ必要か → 何をするか」を説明。専門用語なし |
| Part 2 | 開発者・技術者 | 型・API シグネチャ・コード例・エラーハンドリング・エッジケース・定数一覧 |

**Part 1 の骨子（例え話）**: 「会員が記入用紙（Google Form）に書いた答えを、図書館の整理棚（D1）にしまうとき、答えと棚のラベルを対応づける早見表（schema_questions / qidMap）が空っぽだと、答えはどの引き出しにも入らず『書いてないこと』にされてしまう。今回は、早見表が空でも記入用紙そのものから引き出し名を作り直す仕組み（raw form fallback）を足し、さらに早見表が空のときに黙って捨てず警報を鳴らす仕組み（fail-silent 検知）を付けた」。

**Part 2 の必須要素**:

- 根本原因: schema_questions 空（RC-3）→ qidMap 空 → 全 answer unmapped → `answers_json={}` + `response_fields` 全 `__extra__:` → 公開詳細 fail-silent 空表示。
- Lane A 主要シグネチャ（index.md §6・phase-2 §2 と一致させる。実装後に `grep` で identifier drift を確認）:

```typescript
// packages/integrations/google/src/forms/mapper.ts — named export
export function deriveStableKey(label: string | undefined): string;
export const STABLE_KEY_BY_LABEL: Record<string, string>;

// schema_questions 非依存 fallback（client.ts or mapper.ts に配置）
function rawFormToStableKeyMap(raw: RawForm): Record<string, string>;

// apps/api/src/index.ts — schema 優先 + raw fallback マージ
questionIdToStableKey: async (raw: RawForm) => Promise<Record<string, string>>;
//   return { ...fromRaw, ...fromSchema }
```

- Lane B サマリー拡張（fail-silent 検知）:

```typescript
interface ResponseSyncSummary {
  // 既存 ...
  qidMapSize: number;             // questionIdToStableKey の entry 数
  fullyUnmappedResponses: number; // known 0 件で処理された response 数
}
```

- エラーハンドリング: qidMap 空 / 全 unmapped を warning + `SYNC_ALERTS`（`kind="qid_map_empty"` / `"all_responses_unmapped"`）で可視化。**sync は中断しない**（AC-B3）。
- エッジケース: schema sync 済み環境では `{...fromRaw, ...fromSchema}` で従来挙動維持。schema_questions 空でも raw fallback で反映。

**視覚証跡（VISUAL 必須）**: implementation-guide に Phase 11 の screenshot 参照を以下のとおり明記する（4 か所一致の 1 つ）:

| Screenshot | Path | Status |
|------------|------|--------|
| 復旧前（空表示） | `../phase-11/screenshots/member-detail-before-recovery.png` | pending（user-gated） |
| 復旧後（反映表示） | `../phase-11/screenshots/member-detail-after-recovery.png` | pending（user-gated） |

### Task 12-2: システム仕様更新サマリ（`system-spec-update-summary.md`・Step 1 + 条件付き Step 2）

| Step | 本タスクでの扱い | 内容 |
|------|----------------|------|
| Step 1-A | 必須 | 完了タスク記録 + 関連ドキュメントリンク + 変更履歴 + LOGS.md ×2 + topic-map.md |
| Step 1-B | 必須 | 実装状況テーブル更新（`implemented_local`（実装ローカル GREEN）/ staging 復旧は user-gated pending） |
| Step 1-C | 必須 | 関連タスクテーブル更新（本仕様内の関連タスク・未タスク候補のステータス更新） |
| Step 2 | **該当** | **新規 interface 追加あり**。`rawFormToStableKeyMap`（新規関数）・`deriveStableKey` / `STABLE_KEY_BY_LABEL` の named export 公開・`ResponseSyncSummary` の `qidMapSize` / `fullyUnmappedResponses` フィールド拡張は新規/変更 interface に該当するため、Step 2（aiworkflow-requirements 側 system spec）の更新を行う |

**Step 2 更新対象**: `api-*.md`（sync パイプライン契約に qidMap fallback と fail-silent サマリーを追記）/ `database-*.md`（schema_questions ↔ response qidMap の依存関係を「fallback で疎結合化」と注記）。`deriveStableKey` / `rawFormToStableKeyMap` / `qidMapSize` / `fullyUnmappedResponses` を current facts として記録する。

### Task 12-3: ドキュメント更新履歴（`documentation-changelog.md`）

- Step 1-A / 1-B / 1-C / Step 2 の結果を個別に明記（「該当なし」も記録）。
- workflow-local 同期と global skill sync を別ブロックで記録する（[Feedback BEFORE-QUIT-003]）。
- index 再生成（`generate-index.js`）の実行記録を含める。

### Task 12-4: 未タスク検出（`unassigned-task-detection.md`・0 件でも必須）

`current` / `baseline` を分離して記録する。Phase 3 §3 の MINOR 追跡を引き継ぐ。

| ID | 内容 | 分類 | 扱い |
|----|------|------|------|
| TECH-M-02 | 旧 `__extra__:<qid>` 行のクリーンアップ | baseline | fullSync 再投入で known 行が追加されるが旧 `__extra__:` 行は別 PK で残存。表示 API は known stableKey のみ参照するため**表示には無害**。クリーンアップは別タスク化候補として未タスク記録（current gap ではない） |
| TECH-M-01 | `rawFormToStableKeyMap` の配置先確定 | — | Phase 5 で配置確定済みのため close（未タスクではない） |

「関連タスク差分確認」セクションを設け、既存 workflow（`member-data-source-precedence-and-profile-session-fix`＝member_responses 個別列 INSERT 失敗の別問題）との重複がないことを確認する（[FB-CANCEL-004-2]）。

### Task 12-5: スキルフィードバックレポート（`skill-feedback-report.md`・改善点なしでも必須）

| 観点 | 記録候補 |
|------|---------|
| テンプレート改善 | VISUAL で「before/after の状態対比」を扱う場合の screenshot 命名（`<component>-<before|after>-<context>.png`）ガイドの明文化候補 |
| ワークフロー改善 | fail-silent 系バグの真因確定に「staging 実データ read-only クエリ → 因果連鎖のコード裏取り」を Phase 1 標準手順化する候補 |
| ドキュメント改善 | 復旧 runbook を Lane（コード）と分離した独立成果物として扱う構成の再利用化候補 |

### Task 12-6: コンプライアンスチェック（`phase12-task-spec-compliance-check.md`）

- canonical 9 headings（共通骨格）逐語チェックを root evidence として残す。
- implementation-guide 内の識別子（`deriveStableKey` / `rawFormToStableKeyMap` / `qidMapSize` / `fullyUnmappedResponses`）を実装後に現行コードで `grep` 確認し identifier drift がないことを記録する（[Feedback W1-02b-3]）。
- `artifacts.json` / `outputs/artifacts.json` の parity（`implemented_local_runtime_pending` + `phase13_blocked` 同値）を確認する。

## 参照資料

| 参照 | パス | 用途 |
|------|------|------|
| Phase 11 screenshot 計画 | `phase-11.md` / `outputs/phase-11/phase11-capture-metadata.json` | implementation-guide の視覚証跡参照 |
| 主要シグネチャ | `index.md` §6・`phase-2.md` §2/§3 | Part 2 / Step 2 の current facts |
| MINOR 追跡 | `phase-3.md` §3 | 未タスク検出（TECH-M-01/02） |
| Step 2 対象 spec | `.claude/skills/aiworkflow-requirements/references/api-*.md` / `database-*.md` | system spec 更新 |
| Phase 12 ガイド | task-specification-creator `references/phase-12-documentation-guide.md` | 6 成果物体裁 |

## 実行手順

1. `outputs/artifacts.json` ↔ phase spec の artifact 名を突合（[Feedback 2]）。
2. Task 12-1: implementation-guide（Part 1/2 + 視覚証跡）作成。
3. Task 12-2: system-spec-update-summary（Step 1-A/B/C + Step 2 該当）作成。
4. Task 12-3: documentation-changelog 作成。
5. Task 12-4: unassigned-task-detection（current/baseline 分離）作成。
6. Task 12-5: skill-feedback-report 作成。
7. Task 12-6: phase12-task-spec-compliance-check 作成 + parity 確認。
8. `generate-index.js`（aiworkflow-requirements / task-specification-creator）実行。

## 統合テスト連携

- implementation-guide の Part 2 コード例は、Phase 4-7 の test 名・シグネチャと一致させる。
- Step 2 の current facts（新規 interface）は Phase 10 final-review で確定した実装と 1:1 で対応させる。

## 多角的チェック観点（AIが判断）

- **責務境界**: Task 1（実装ガイド）と Task 2（仕様更新）の境界を守る。実装ガイドは「使い方の説明」、仕様更新は「正本 spec への新規 interface 反映」。
- **整合性**: VISUAL の screenshot canonical 名を 4 か所（phase-11 / screenshot-plan / capture-metadata / implementation-guide）で一致させる。
- **運用性**: 旧 `__extra__:` 行クリーンアップは「無害な残存」として未タスク化し、本サイクルのスコープを軽量に保つ。

## サブタスク管理

| ID | 内容 | 成果物 |
|----|------|--------|
| P12-1 | 実装ガイド（2 パート + 視覚証跡） | `implementation-guide.md` |
| P12-2 | system spec 更新（Step 1 + Step 2 該当） | `system-spec-update-summary.md` |
| P12-3 | changelog | `documentation-changelog.md` |
| P12-4 | 未タスク検出（current/baseline） | `unassigned-task-detection.md` |
| P12-5 | skill feedback | `skill-feedback-report.md` |
| P12-6 | compliance check | `phase12-task-spec-compliance-check.md` |

## 成果物

- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 完了条件

- [x] 6 成果物すべての実体ファイルが `outputs/phase-12/` に存在する（0 件・改善点なしでも出力必須）
- [x] implementation-guide が Part 1（中学生レベル例え話）+ Part 2（型・API・コード例）構成である
- [x] implementation-guide に Phase 11 の before/after screenshot 参照（canonical 名）が含まれている
- [x] system-spec-update-summary が Step 2 該当（`rawFormToStableKeyMap` / named export / サマリー型拡張）を記録している
- [x] unassigned-task-detection が TECH-M-02 を current/baseline 分離で記録している
- [x] screenshot canonical 名が 4 か所で一致する設計になっている
- [x] `artifacts.json` / `outputs/artifacts.json` parity 確認手順が記載されている

## タスク100%実行確認【必須】

- [x] Task 12-1〜12-6 の作成計画を確定した
- [x] 6 成果物の役割・必須内容を定義し、実体作成した
- [x] VISUAL の screenshot 参照方針を明記した

## 次Phase

Phase 13（PR 作成）— user 明示承認後のみ。base=dev。
