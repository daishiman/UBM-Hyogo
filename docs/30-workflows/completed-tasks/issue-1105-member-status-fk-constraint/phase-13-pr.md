# Phase 13 — PR 作成（user-gated）

- 区分: 実装仕様書（**NON_VISUAL / implemented_local_evidence_captured**）
- PR base ブランチ: `dev`（CLAUDE.md PR フロー既定）
- branch: `docs/issue-1105-member-status-fk-constraint-spec`
- issue: [#1105](https://github.com/daishiman/UBM-Hyogo/issues/1105)（**CLOSED**・PR で reopen / close しない）

---

## 重要な境界（最優先・必読）

- **PR は user の明示承認後のみ作成する。本 wave では PR を一切作成しない。** 以下は実装 landed + 承認後 wave で用いる計画である。
- 本タスクは local migration + test 追加済み。PR は D1 contract test / typecheck / lint / sequence guard の確認後、ユーザー明示承認がある場合のみ作成する。
- remote D1 apply / commit / push / PR は user-gated。
- issue #1105 は **CLOSED を維持**する。PR 本文に「本 PR は #1105 を reopen / close しない」を明記する（follow-up 由来の独立 spec のため、issue 状態は変更しない）。

## 想定 PR タイトル案

```
feat(api): member_status.member_id への FK 制約導入で orphan を DB レベルで構造的に禁止 (#1105)
```

## PR 本文骨子

### 背景（issue #1105）

親 workflow `admin-member-detail-status-404-fix` は、`member_identities` 行はあるが `member_status` 行が欠落した **orphan 会員**で admin の会員詳細 / status 系エンドポイントが 404 になる問題を、backfill（`0025_backfill_member_status.sql`）と `ensureMemberStatusRow`（ingest 時の既定行保証）で止血した。ただしこれはアプリ／データ層の止血であり、**DB レベルで orphan を構造的に禁止する FK 制約は依然不在**だった（follow-up-002 / #1105）。

### 調査結論（baseline 未実装・現行コードへの最適化）

- **baseline 未実装**: 本サイクル開始時点で `member_status` の FK 制約は他タスクで一切導入されていなかった。現在は `0026_member_status_fk_constraint.sql` を追加済み。
- **issue 陳腐化 → 現行最適化 3 点**:
  1. backfill は issue body の `0024` ではなく実在は **`0025_backfill_member_status.sql`**（`0024` prefix は `0024_member_photos_variants.sql` が占有）。新 FK migration は **`0026_member_status_fk_constraint.sql`**。
  2. **FK 前例ゼロ**: migrations 全体に FK 宣言・`PRAGMA foreign_keys` が皆無 → 本リポジトリ初の FK 構造パターン。D1 上の PRAGMA 実効性検証（AC-6）の必要性が補強される。
  3. §5.2 NOTE「INDEX/VIEW 棚卸し」を具体化: `idx_member_status_public`（`0002` L81-82）が再構築（DROP/RENAME）で消失するため、FK migration 末尾で**同一定義の INDEX 再作成が必須**（AC-9 として明文化）。

### 変更概要

| ファイル | 種別 | 役割 |
|---------|------|------|
| `apps/api/migrations/0026_member_status_fk_constraint.sql` | **新規** | FK 付き `member_status` 再構築 migration（新テーブル作成 → 全カラム明示移行 → 旧 DROP → RENAME → `idx_member_status_public` 再作成）。`member_id → member_identities(member_id)` の FK を宣言 |
| `apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts` | **新規** | FK 有効性 / 既存データ不変 / 冪等 / INDEX 再作成の D1 contract test（TC-1 .. TC-9） |
| `apps/api/src/repository/__tests__/notificationOutbox.repository.spec.ts` | **更新** | FK 導入後の opt-out gate fixture が親 `member_identities` を満たすよう seed を補正 |
| `apps/api/src/repository/__tests__/memberNotificationPreference.repository.spec.ts` | **更新** | notification opt-out repository fixture が親 `member_identities` を満たすよう seed を補正 |
| `apps/api/src/routes/admin/member-notification-pref.contract.spec.ts` | **更新** | admin notification pref PATCH fixture が親 `member_identities` を満たすよう seed を補正 |
| `apps/api/src/sync/backfill.contract.spec.ts` | **更新** | backfill 不変条件 fixture の既存 `member_status` 行に親 `member_identities` を追加 |
| `apps/api/src/routes/admin/tags-queue.contract.spec.ts` | **更新** | tag queue fixture の `member_status` seed に親 `member_identities` を追加 |
| `apps/api/src/workflows/tagQueueResolve.contract.spec.ts` | **更新** | tag queue resolve fixture の `member_status` seed に親 `member_identities` を追加 |
| `apps/api/src/routes/auth/session-resolve.contract.spec.ts` | **更新** | FK 導入後に成立しない orphan `member_status` auto-link fixture を現行不変条件へ補正 |
| `apps/api/src/repository/__tests__/_setup.ts` | **更新** | Miniflare D1 migration 適用を worker 内 1 回にし、full D1 regression の socket exhaustion を防止 |

- SQLite は `ALTER TABLE ... ADD CONSTRAINT` で FK を後付けできないため、テーブル再構築 migration を用いる。
- `apps/web` は **無変更（diff 0）**。FK は DB 内部の整合性保証であり UI に影響しない。
- `apps/api/migrations/sequence-exceptions.json` は 0026 が新規 unique prefix のため編集不要。

### 受入条件（AC）

| AC | 内容 |
|----|------|
| AC-1 | 再構築後の `member_status` が `member_id` に `member_identities(member_id)` への FK を持つ |
| AC-2 | `PRAGMA foreign_keys = ON` 下で、存在しない `member_identities` を指す `member_status` INSERT が拒否される |
| AC-3 | 既存の正常 `member_status` データ（全カラム）が移行後も欠落・改変なく保持される |
| AC-4 | migration が冪等であり再適用で重複・破壊が発生しない |
| AC-5 | backfill 0025 適用済み（orphan ゼロ）を前提に移行が FK 違反で失敗しない |
| AC-6 | Cloudflare D1 上で `PRAGMA foreign_keys` の有効性（接続単位 ON 要否）が検証・文書化されている |
| AC-7 | 既存挙動の非回帰: 正常会員の詳細 / status / 一覧レスポンスが従来と同一 |
| AC-8 | `apps/web` は無変更（diff 0） |
| AC-9 | `idx_member_status_public` が再構築後も同一定義で存在する |

### DoD（Definition of Done）

1. `0026_member_status_fk_constraint.sql` が追加され、FK 付き定義へ再構築される。
2. D1 contract test が全 GREEN（FK 違反拒否 / 正常許容 / 既存データ不変 / 冪等 / INDEX 再作成）。
3. `mise exec -- pnpm verify:d1-migrations` が pass（sequence guard）。
4. `apps/web` diff 0。
5. AC-1〜AC-9 をすべて満たす。

### 検証コマンド結果欄（実装 wave で記入）

```
$ mise exec -- pnpm --filter @ubm-hyogo/api typecheck                      → PASS
$ mise exec -- pnpm --filter @ubm-hyogo/api lint                           → PASS（同一 tsc command）
$ mise exec -- pnpm verify:d1-migrations                                   → PASS（33 migrations / 5 documented duplicate prefix groups）
$ mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
    apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts → PASS（1 file / 6 tests）
$ mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
    apps/api/src/repository/__tests__/notificationOutbox.repository.spec.ts → PASS（1 file / 13 tests）
$ mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts \
    --no-file-parallelism --maxWorkers=1 apps/api                         → PASS（109 files / 937 tests）
$ git diff --name-only dev...HEAD | grep '^apps/web/'                      → PASS（出力 0 行 / AC-8）
$ git diff --stat                                                          → migration 1 + spec 1 + existing D1 fixtures + setup harness（apps/api 内のみ）
```

> remote D1 binding 上の `PRAGMA foreign_keys` 実効性（AC-6 補完）は staging 操作を要するため user-gated。runbook 記録は close-out wave で追記する。

### スクリーンショット

UI/UX 変更なしのため不要（NON_VISUAL・`apps/web` diff 0）。`outputs/phase-11/screenshots/` は作成しない。

---

## PR 作成手順（実装 landed + 承認後）

1. `git fetch origin dev` → ローカル `dev` を fast-forward 同期。
2. 作業ブランチ `docs/issue-1105-member-status-fk-constraint-spec` に `dev` をマージ（コンフリクト時は CLAUDE.md 既定方針）。
3. `mise exec -- pnpm install --force` / `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `bash scripts/verify-pr-ready.sh`。
4. `git add -A` → commit（末尾に `Co-Authored-By` 行）。
5. `gh pr create --base dev` で作成（本文は本骨子 + `outputs/phase-12/implementation-guide.md` 反映）。
6. PR 本文に「issue #1105 は CLOSED 維持（本 PR で reopen / close しない）」を明記する。

🤖 Generated with [Claude Code](https://claude.com/claude-code)
