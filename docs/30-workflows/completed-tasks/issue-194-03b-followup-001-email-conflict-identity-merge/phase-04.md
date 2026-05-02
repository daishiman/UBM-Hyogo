# Phase 4: テスト戦略 — issue-194-03b-followup-001-email-conflict-identity-merge

## 実装区分

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-194-03b-followup-001-email-conflict-identity-merge |
| phase | 4 / 13 |
| wave | 04c-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| 更新日 | 2026-05-03 |
| taskType | implementation-spec / implemented |

## 目的

unit / integration / authorization / audit の verify suite を確定する。E2E は manual smoke
（Phase 11）に寄せる方針を理由つきで明記する。

## 実行タスク

1. テスト種別ごとに対象と目的を整理する。
2. 追加テストファイル一覧を実装結果と一致させる。
3. ローカル実行コマンドを Phase 5 と整合させる。

## 多角的チェック観点

- #1 / #3 / #5 / #11 / #13
- merge は不可逆に近いため integration suite を必須化
- non-admin で 403 が返ることを authorization suite で検証
- PII redaction の正常系を audit テストでカバー

## サブタスク管理

- [x] refs を確認する
- [x] AC と evidence path を対応付ける
- [x] blocker / approval gate を明記する
- [x] outputs/phase-04/main.md を作成する

## 成果物

- outputs/phase-04/main.md

## 完了条件

- 全 AC に対応する verify suite が存在する
- 追加テストファイル一覧が確定している（実装と一致）
- E2E を見送る背景が記録されている

## 追加セクション（Phase 4）

### verify suite

| 種別 | 対象 | 目的 | テストファイル | ケース数 |
| --- | --- | --- | --- | --- |
| unit | `detectConflictCandidates` | 第一段階判定式の境界条件（正/負/自己除外/NFKC/空欄） | `apps/api/src/services/admin/identity-conflict-detector.test.ts` | 5 |
| unit | `maskResponseEmail` (shared) | PII 部分マスク（#3） | `packages/shared` 既存 schema の inline assertion / integration テスト経由でも検証 | n/a |
| integration | `listIdentityConflicts` / `dismissIdentityConflict` / `parseConflictId` | name+affiliation 完全一致候補 / dismiss 後の再検出抑止 / alias 登録済除外 / conflictId パース | `apps/api/src/repository/__tests__/identity-conflict.test.ts` | 5 |
| integration | `mergeIdentities` / `resolveCanonicalMemberId` | atomic 書込（alias / merge_audit / audit_log） / 二重 merge / 不在 member / self-reference / PII redaction / canonical 解決 | `apps/api/src/repository/__tests__/identity-merge.test.ts` | 6 |
| 合計 | | | | **16 (all green)** |

### 主要ケース（実装テストと一致）

- 完全一致候補抽出: `name` + `affiliation` 一致のみ candidate
- 不一致除外: `name` のみ一致は候補化されない
- 自己除外: 同一 memberId は除外
- 正規化: `trim` + `NFKC`（半角/全角差を吸収）
- 空欄スキップ: name または affiliation が空ならスキップ
- merge atomic: `identity_aliases` / `identity_merge_audit` / `audit_log` の 3 テーブルが整合
- 二重 merge: `MergeConflictAlreadyApplied`（UNIQUE 抑止）
- 不在 member: `MergeIdentityNotFound`
- self-reference: `MergeSelfReference`
- PII redaction: `reason` 内のメール / 電話を `[redacted]` 置換
- canonical 解決: `resolveCanonicalMemberId(source) === target` / 未登録 memberId は passthrough
- list の name+affiliation 完全一致: source は最新 `lastSubmittedAt` 側
- dismiss 後の再検出抑止: 同一 (source, target) ペアは GET から除外
- `identity_aliases` 登録済 source の除外: list から消える
- `parseConflictId`: 正規 / 不正フォーマット の境界

### authorization / contract カバレッジの位置付け

- `requireAdmin` middleware 配下に mount 済み（`apps/api/src/index.ts: app.route("/admin", createAdminIdentityConflictsRoute())`）。
- non-admin → 401/403 / admin → 200 の振る舞いは `apps/api/src/middleware/require-admin.ts` の既存 middleware テストでカバーされている前提（共通 middleware の責務）。
- response shape の contract 検証は `packages/shared` の zod schema (`ListIdentityConflictsResponseZ` / `MergeIdentityResponseZ` / `DismissIdentityConflictResponseZ`) を単一情報源として利用する。

### 未追加テストと背景

- `apps/web/test/e2e/admin-identity-merge.spec.ts` (Playwright e2e):
  - 現状 e2e harness の DB seed が本タスクで必要な `response_fields(stable_key='fullName' | 'occupation')` seed と整合しない。
  - UI 経由の振る舞いは Phase 11 の manual smoke (VISUAL_ON_EXECUTION) に寄せる。
  - component 単位の振る舞い（二段階確認 stage / dismiss）は API 側 integration test がカバー済。

### ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec vitest run --no-coverage \
  apps/api/src/services/admin/identity-conflict-detector.test.ts \
  apps/api/src/repository/__tests__/identity-merge.test.ts \
  apps/api/src/repository/__tests__/identity-conflict.test.ts
# expected: 16 passed
```

### Fixture 設計

- `apps/api/src/repository/__tests__/_setup.ts` の in-memory D1 `TABLES` に
  `identity_aliases` / `identity_merge_audit` / `identity_conflict_dismissals` の 3 テーブル DDL を追加済。
- 各 integration test は `setupD1()` で fresh DB を構築、`member_responses` / `member_identities` /
  `response_fields` を最小 seed して候補成立条件を作る。

## タスク100%実行確認

- [x] この Phase の必須セクションがすべて埋まっている
- [x] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [x] 実装後も deploy / commit / push / PR は実行していない

## 次 Phase への引き渡し

Phase 5 へ、AC、blocker、evidence path、approval gate を渡す。
