# メンバープロフィール Google Form 回答未反映の調査と恒久修正

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。本タスクは「動作させる／修正する」を目的とし、データ反映パイプラインのコード修正・fail-silent ガード追加・復旧手順を含むため実装仕様書として作成する。

## メタ情報

| 項目 | 値 |
|------|-----|
| TASK_ID | `TASK-MEMBER-FORM-DATA-REFLECTION-001` |
| workflow slug | `member-profile-google-form-data-reflection` |
| 作成日 | 2026-06-10 |
| ブランチ | `fix/member-profile-google-form-data-reflection` |
| implementation_mode | `new`（恒久バグ修正・新規ガード追加。2026-06-10 ローカル実装済み、runtime 復旧操作のみ user-gated） |
| task 分類 | **VISUAL**（公開メンバー詳細ページの表示が空→反映に変わる。Phase 11 で staging before/after の視覚証跡を取得） |
| workflow_state | `implemented_local_runtime_pending` |
| related_issue | null（staging 観察起点） |
| 正本順位 | SCOPE（本 index）> phase-1..3 設計 > `specs/01-api-schema.md` / `specs/03-data-fetching.md` > プロトタイプ |

---

## 1. 背景と問題

staging の公開メンバー詳細ページ `https://ubm-hyogo-web-staging.daishimanju.workers.dev/members/b0db428f-7dc0-4898-83f5-df31c7a04d69` で、会員が Google Form に実際に入力したにもかかわらず、**氏名・写真・ビジネス概要・タグ・パーソナル全項目（趣味／最近の関心／座右の銘／その他の活動）が全て空表示（"—"）** になっている。

ユーザー報告: 「Google Form にて情報を様々入力していたにもかかわらず、全然情報が入力されていない状態」。

---

## 2. 根本原因（staging 実データで確定）

### 2.1 確定根拠（staging D1 read-only 調査 2026-06-10）

| # | 事実 | 根拠（staging `ubm-hyogo-db-staging` 実クエリ） |
|---|------|------|
| RC-1 | 対象メンバー `b0db428f` の `member_responses` は存在し `revision_id='00000006'` だが **`answers_json='{}'`（空）** | `SELECT answers_json FROM member_responses WHERE response_id='ACYDBNjm...'` → `{}` (len=2) |
| RC-2 | `response_fields` は 16 件あるが **全て `__extra__:<questionId>` 形式（unmapped）**。known stableKey（`fullName` 等）は **0 件** | `SELECT GROUP_CONCAT(stable_key) ...` → `__extra__:048f9714,__extra__:0b24e585,...`（16件全て） |
| RC-3 | **`schema_questions` テーブルが全体で 0 行（空）** ← 🔴 根本原因 | `SELECT revision_id, COUNT(*) FROM schema_questions GROUP BY revision_id` → `results: []` |
| RC-4 | 会員の生回答自体は D1 に届いている（`response_fields` 16件 + `raw_answers_json`） | RC-2 の 16 件 `__extra__:` 行 |

### 2.2 因果連鎖（コード裏取り済み）

```
schema_questions が空（RC-3）
   ↓
response sync の questionIdToStableKey map（apps/api/src/index.ts:175-186）が
listFieldsByVersion(revisionId) で schema_questions を引くが 0 行 → 常に空 map
   ↓
mapFormResponse（packages/integrations/google/src/forms/mapper.ts:179-187）で
全 questionId が questionIdToStableKey[qid] === undefined → unmappedQuestionIds に push
answersByStableKey は {} のまま
   ↓
member_responses.answers_json = "{}"、known response_fields 0 件、
全16件が __extra__:<qid> として保存（schema_diff_queue 行き）
   ↓
公開メンバー詳細 API（apps/api/src/view-models/public/public-member-profile-view.ts:111-142）が
schema_questions の visibility=public を visibilityIndex に積むが、これも空 →
全フィールドが `if (!meta) continue` で skip
   ↓
公開詳細ページ全項目が空表示（"—"）
```

### 2.3 fail-silent の問題（恒久リスク）

- response sync は schema_questions が空でも **エラーを出さず "成功" 扱い** で終わる。全 answer を unmapped にして黙って完了する。
- cron 設定（`apps/api/wrangler.toml`）は schema sync が `0 18 * * *`（1日1回）、response sync が `*/15`（15分毎）。**schema sync 初回成功前に response sync が走ると、全会員が空反映になる順序依存**がある。
- 本番経路（`index.ts:175`）の qidMap は `schema_questions` の D1 lookup に完全依存しており、schema_questions が空／`question_id` 欠落のとき silent に全滅する。

### 2.4 表現層は健全（無罪）

- `apps/web` の公開詳細ページ（`app/(public)/members/[id]/page.tsx`、`MemberDetail.tsx` 他）は受け取ったデータを正しく描画し、空判定 `"—"` も正しい。**データが届けば正しく表示される**。表現層のコード変更は本タスクのスコープ外。

---

## 3. スコープ

### 含む（1 サイクル内で完了 — CONST_007）

- **Lane A**: `questionId → stableKey` 解決の **schema_questions 非依存化（堅牢化）**。`deriveStableKey`/`STABLE_KEY_BY_LABEL` を `mapper` から公開し、本番 qidMap（`index.ts`）と client デフォルト qidMap（`client.ts`）を「schema_questions lookup → 空/欠落なら raw form items から `deriveStableKey(item.title)` で fallback」する対称ロジックへ修正する。
- **Lane B**: response sync の **fail-silent 検知ガード**。qidMap が空／sync 1 件あたりの known 解決率が著しく低い（全 unmapped）場合に warning ログ + `SYNC_ALERTS`（Analytics Engine）記録を行い、運用が黒箱で空反映に気づけるようにする。
- **Lane C**: **復旧 runbook + 診断**。staging（および production）で `schema_questions` 充足を確認する診断手順、schema sync → response sync fullSync の復旧手順、既存 `__extra__:` 行のクリーンアップ要否判断を文書化する。

### 含まない（スコープ外）

- 公開メンバー詳細ページ（`apps/web` 表現層）のコード変更（表現層は健全 = 無罪）。
- 新規 D1 migration による schema 変更（`schema_questions` 等のテーブル定義変更）。fail-silent 検知は既存 `SYNC_ALERTS` dataset を再利用する。
- Google Form schema 変更・cron 間隔変更。
- commit・PR・deploy・staging への mutation 適用（user-gated）。ローカル実コード実装と focused tests は 2026-06-10 に同一サイクルで完了。

---

## 4. 受け入れ基準（AC）

### 全体
- **AC-G1**: 全 phase 仕様書が CONST_005 必須項目（変更ファイル・シグネチャ・入出力・テスト・実行コマンド・DoD）を満たす。
- **AC-G2**: 新規 D1 migration・Google Form schema 変更・cron 間隔変更を含まない。
- **AC-G3**: 全 Lane が 1 サイクル内完了スコープ（先送り無し）。

### Lane A（qidMap 堅牢化＝schema_questions 非依存化）
- **AC-A1**: `deriveStableKey` と `STABLE_KEY_BY_LABEL` が `packages/integrations/google/src/forms/mapper.ts` から named export される。
- **AC-A2**: `apps/api/src/index.ts` の `questionIdToStableKey` が、`schema_questions` lookup 結果が空または `question_id` 未充足のとき、`raw` form items から `deriveStableKey(item.title)` を用いた fallback map を返す。
- **AC-A3**: `packages/integrations/google/src/forms/client.ts` のデフォルト `qidMapFn`（84-91）と `defaultQuestionIdMap`（65-73）が `item.title` 生値ではなく `deriveStableKey(item.title)` を用いる（schema 側 `mapFormSchema` と対称）。
- **AC-A4**: `mapFormResponse` に正しい qidMap が渡れば、`answersByStableKey` に known stableKey（`fullName` 等）が解決される（unit test で実証）。

### Lane B（fail-silent 検知ガード）
- **AC-B1**: response sync 実行時、`questionIdToStableKey` map が空（0 entry）の場合に warning レベルのログと `SYNC_ALERTS` への 1 レコードを記録する。
- **AC-B2**: 1 response の処理で全 answer が unmapped（known 0 件かつ raw answer 1 件以上）になった場合を検知し、unmapped 件数を sync サマリーに含める。
- **AC-B3**: 検知ガードは sync 本体の成功/失敗判定を破壊しない（既存挙動を回帰させない）。閾値・挙動（中断するか warning のみか）は Phase 2 で確定し本文に明記する。

### Lane C（復旧 runbook + 診断）
- **AC-C1**: `schema_questions` 充足診断手順（cf.sh read-only クエリ + 期待値）を runbook に記載する。
- **AC-C2**: 復旧手順（schema sync 実行 → schema_questions 検証 → response sync fullSync → answers_json / response_fields known 検証 → 詳細ページ確認）を順序付きで記載する。
- **AC-C3**: 既存 `__extra__:` 行のクリーンアップ要否判断（fullSync 再投入で known 行が追加されるが旧 `__extra__:` 行が残る場合の扱い）を記載する。
- **AC-C4**: runbook は `cf.sh` ラッパー経由（`wrangler` 直呼び禁止 / 不変条件）を厳守する。

---

## 5. 変更対象ファイル一覧

| パス | 種別 | Lane | 変更概要 |
|------|------|------|---------|
| `packages/integrations/google/src/forms/mapper.ts` | 編集 | A | `deriveStableKey` / `STABLE_KEY_BY_LABEL` を named export |
| `packages/integrations/google/src/forms/client.ts` | 編集 | A | デフォルト `qidMapFn`(84-91) と `defaultQuestionIdMap`(65-73) を `deriveStableKey` 経由へ |
| `apps/api/src/index.ts` | 編集 | A | `questionIdToStableKey`(175-186) に schema_questions 空時の raw form fallback を追加 |
| `apps/api/src/jobs/sync-forms-responses.ts` | 編集 | B | qidMap 空検知・全 unmapped 検知・`SYNC_ALERTS` 記録・サマリー拡張 |
| `packages/integrations/google/src/forms/mapper.spec.ts` | 新規/編集 | A | `deriveStableKey` export・fallback マッピングの unit test |
| `packages/integrations/google/src/forms/client.spec.ts` | 新規/編集 | A | デフォルト qidMap が正規化 stableKey を返す test |
| `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | 新規/編集 | B | 空 qidMap 検知・全 unmapped 検知・サマリー・回帰 test |
| `apps/api/src/forms/build-qid-map.ts`（抽出先は Phase 5 で確定） | 新規 | A | `index.ts` のインライン closure を `buildQuestionIdToStableKey` 純関数として抽出（単体テスト可能化） |
| `apps/api/src/forms/build-qid-map.spec.ts` | 新規 | A | schema_questions 空時 raw fallback の test。**既存 `apps/api/src/index.spec.ts` は別 workflow（admin-audit mount 回帰）専用のため非接触** |
| `docs/30-workflows/.../runbooks/` or `docs/30-workflows/runbooks/` | 新規 | C | 復旧 runbook + 診断クエリ集 |

> 実ファイルパス・関数名・既存 spec の有無は Phase 1（要件定義）の inventory で `grep`/`ls` により最終確定する。上表は設計時点の候補。

---

## 6. 主要シグネチャ（設計）

```typescript
// packages/integrations/google/src/forms/mapper.ts — named export 追加
export function deriveStableKey(label: string | undefined): string;
export const STABLE_KEY_BY_LABEL: Record<string, string>;

// packages/integrations/google/src/forms/client.ts — 共有 helper（schema_questions 非依存 fallback）
function rawFormToStableKeyMap(raw: RawForm): Record<string, string>;
//   for each item with questionId: map[qid] = deriveStableKey(item.title)

// apps/api/src/forms/build-qid-map.ts — index.ts のインライン closure を純関数抽出（単体テスト可能化）
//   1. schema_questions lookup 結果（schemaRows）を受け取る
//   2. lookup が空 or question_id 未充足なら raw form items から deriveStableKey fallback をマージ
//   3. schema 優先 `{ ...fromRaw, ...fromSchema }`
export function buildQuestionIdToStableKey(
  raw: RawForm,
  schemaRows: ReadonlyArray<{ questionId: string | null; stableKey: string }>,
): Record<string, string>;

// apps/api/src/index.ts — questionIdToStableKey は buildQuestionIdToStableKey へ委譲
questionIdToStableKey: async (raw: RawForm) => Promise<Record<string, string>>;

// apps/api/src/jobs/sync-forms-responses.ts — fail-silent ガード（サマリー拡張）
interface ResponseSyncSummary {
  // 既存フィールド ...
  qidMapSize: number;        // questionIdToStableKey の entry 数
  fullyUnmappedResponses: number; // known 0 件で処理された response 数
}
```

---

## 7. Phase 構成

| Phase | 名称 | 主担当 | 成果物（`outputs/phase-N/`） |
|-------|------|--------|------------------------------|
| 1 | 要件定義 | 設計 | `requirements.md`, `spec-extraction-map.md`, `root-cause-evidence.md` |
| 2 | 設計 | 設計 | `design.md`（3 lane topology / 閾値 / validation matrix） |
| 3 | 設計レビュー | 設計 | `gate-decision.md` |
| 4 | テスト作成 | Lane A/B | `test-plan.md`（RED test 一覧） |
| 5 | 実装 | Lane A/B/C | `implementation-plan.md`（変更ファイル/差分方針） |
| 6 | テスト拡充 | Lane A/B | `test-additions.md` |
| 7 | カバレッジ確認 | Lane A/B | `coverage.md` |
| 8 | リファクタリング | Lane A/B | `refactor.md` |
| 9 | 品質保証 | 全 Lane | `qa.md` |
| 10 | 最終レビュー | 全 Lane | `final-review-result.md` |
| 11 | 手動テスト | Lane C | `manual-test-result.md`, `screenshots/`（staging before/after） |
| 12 | ドキュメント更新 | 全 Lane | 6 成果物（implementation-guide 他） |
| 13 | PR作成 | — | user 明示承認後のみ |

---

## 7.1 Phase 仕様書リンク

- [Phase 1: 要件定義](phase-1.md)
- [Phase 2: 設計](phase-2.md)
- [Phase 3: 設計レビュー](phase-3.md)
- [Phase 4: テスト作成](phase-4.md)
- [Phase 5: 実装](phase-5.md)
- [Phase 6: テスト拡充](phase-6.md)
- [Phase 7: カバレッジ確認](phase-7.md)
- [Phase 8: リファクタリング](phase-8.md)
- [Phase 9: 品質保証](phase-9.md)
- [Phase 10: 最終レビュー](phase-10.md)
- [Phase 11: 手動テスト](phase-11.md)
- [Phase 12: ドキュメント更新](phase-12.md)
- [Phase 13: PR作成](phase-13.md)

## 8. 不変条件

1. `apps/web` 表現層のコードは変更しない（健全 = 無罪）。表示が変わるのはデータ復旧の結果。
2. D1 schema 変更（migration）・Google Form schema 変更・cron 間隔変更を行わない（AC-G2）。
3. D1 直接アクセスは `apps/api` に閉じる。運用クエリは `bash scripts/cf.sh d1 ...` ラッパー経由（`wrangler` 直呼び禁止）。
4. consent キーは `publicConsent` / `rulesConsent` に統一（既存）。
5. `responseEmail` は system field（`response_fields` に保存しない）として扱う（既存 normalize-response の挙動を維持）。
6. commit・PR・deploy・staging mutation は user-gated。ローカル実コード実装・focused tests・正本同期は本タスクの同一サイクル内で実施する。

---

## 9. 参照資料

| 参照資料 | パス | 内容 |
|---------|------|------|
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | フォーム schema と項目定義（stableKey 正本） |
| データ取得仕様 | `docs/00-getting-started-manual/specs/03-data-fetching.md` | 同期フロー / SLA |
| Google Form 構造 | `docs/00-getting-started-manual/google-form/` | フォーム項目ラベル |
| システム仕様 | `.claude/skills/aiworkflow-requirements/references/` | 既存設計整合（database-* / api-* / error-handling） |
