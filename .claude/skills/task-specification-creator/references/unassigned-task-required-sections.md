# Unassigned Task Required Sections — 未タスクテンプレ必須セクション

`docs/30-workflows/unassigned-task/task-*.md` を生成するときに **必ず含める 4 セクション**を定義する。
出典: `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-12/`
（implementation-guide.md / unassigned-task-detection.md / skill-feedback-report.md）

## 概要

未タスク化したファイルが「タスク仕様書として実行可能」であるためには、以下の 4 セクションが
不可欠である。これらが欠けると後続実装者が再ヒアリングを要し、Phase 1 着手が遅延する。

| # | セクション | 必須性 | 目的 |
| --- | --- | --- | --- |
| 1 | 苦戦箇所【記入必須】 | ✅ 必須 | 過去タスクで詰まった具体ポイントを記録し、再発防止情報を後続実装に申し送る |
| 2 | リスクと対策 | ✅ 必須 | 着手前に把握すべき技術リスクと回避策を共有 |
| 3 | 検証方法 | ✅ 必須 | 完了判定の客観基準を提示（コマンド / チェック / 期待結果） |
| 4 | スコープ（含む / 含まない） | ✅ 必須 | 越境を防ぎ、派生未タスクの正しい切り出しを担保 |

## 1. 苦戦箇所【記入必須】

実装上の苦戦ポイントを **具体的なファイル名・行・症状** で残す。
「特になし」は禁止（再現性が落ちる）。

### 記述要件

- 対象ファイル / モジュールを **絶対パス** で示す
- 症状（typecheck エラー / runtime error / ロジックの罠）を 1 文で示す
- 参考リンク（PR / Issue / 関連 LOGS fragment）を貼る

### 例

```markdown
## 苦戦箇所【記入必須】

- 対象: `apps/api/src/routes/members.ts`
- 症状: D1 binding が undefined になり 500 を返す。`wrangler.toml` の `d1_databases.binding`
  と Hono context の参照名がドリフトしていた
- 参照: docs/30-workflows/.../LOGS/20260420-101530-feat-members-api-a1b2.md
```

## 2. リスクと対策

着手前に潜在的なリスクを列挙し、各リスクに対して **具体的な対策**を併記する。

### 記述要件（2 列以上を許容）

実運用では「リスク / 対策」の **2 列形式**で十分実用に耐えることを 04c / 05a タスクで確認済み。
影響度（高/中/低）列は任意拡張とし、**監査スクリプト（`scripts/audit-unassigned-tasks.js` 未実装）に
影響列を必須化させない**。本書は 2 列を最低要件、3 列を推奨拡張として扱う。

| 列 | 必須 | 内容 |
| --- | --- | --- |
| リスク | ✅ 必須 | 何が起き得るか（例: 並列 worktree で D1 migration 衝突） |
| 対策 | ✅ 必須 | 事前確認コマンド / 設計上の回避策 / fallback 手順 |
| 影響 | 任意 | 高 / 中 / 低（優先度判断が必要な場合のみ追加） |

### 例（2 列形式・最低要件）

```markdown
## リスクと対策

| リスク | 対策 |
| --- | --- |
| D1 migration の番号衝突 | Phase 1 で `wrangler d1 migrations list` を実行し既存番号を確認 |
| OpenNext build の memory OOM | `NODE_OPTIONS="--max-old-space-size=4096"` を CI に追加 |
```

### 例（3 列形式・優先度を扱う場合の拡張）

```markdown
## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| Auth.js JWT と API verifier のドリフト | 高 | Phase 2 で session 型と encode/decode 契約を ADR 化 |
| OAuth client redirect URI 取得遅延 | 中 | Phase 5 で runbook 化し事前申請する |
```

## 3. 検証方法

完了判定の **客観的な検証手順**を明示する。曖昧な「目視確認」は禁止。

### 記述要件

- 実行コマンド（コピペで動く形）
- 期待結果（exit code / 出力サンプル / artifact のパス）
- 失敗時の切り分け手順への導線

### 例

```markdown
## 検証方法

### 単体検証

\`\`\`bash
mise exec -- pnpm --filter @repo/api typecheck
mise exec -- pnpm --filter @repo/api test
\`\`\`

期待: 全 PASS、coverage 80% 以上

### 統合検証

\`\`\`bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env staging
\`\`\`

期待: 新規 migration が `applied` 列で確認できる
```

## 4. スコープ（含む / 含まない）

タスクの境界を **含む / 含まない** の 2 列で固定する。
implicit な拡大解釈を防ぎ、派生未タスクの切り出しを正しく行うため。

### 記述要件

- 含む: 本タスクで完了させる項目
- 含まない: スコープ外として明示する項目（理由付き）。後続未タスクとして登録する場合はリンクを貼る

### 例

```markdown
## スコープ

### 含む

- `apps/api/src/routes/members.ts` の D1 binding 修正
- 単体テスト追加（`apps/api/src/routes/__tests__/members.test.ts`）

### 含まない

- 管理画面 UI の更新（→ 別タスク `task-admin-members-ui-001.md` で対応）
- D1 schema 変更（→ migration 番号衝突回避のため、本タスクでは触らない）
```

## 5. テンプレート

新規未タスクファイル末尾にこの 4 セクションを必ず追加する。

```markdown
## 苦戦箇所【記入必須】

- 対象:
- 症状:
- 参照:

## リスクと対策

<!-- 最低 2 列（リスク / 対策）。影響列は優先度判断が必要な場合のみ任意で追加 -->

| リスク | 対策 |
| --- | --- |
|        |      |

## 検証方法

### 単体検証

\`\`\`bash
\`\`\`

期待:

### 統合検証

\`\`\`bash
\`\`\`

期待:

## スコープ

### 含む

-

### 含まない

-
```

## 6. 検証スクリプト連携

`scripts/audit-unassigned-tasks.js` / `scripts/verify-unassigned-links.js` は本書の 4 セクションを
required field として検査する想定。実装は F-1 タスクで対応予定。

## 関連リンク

- 出典: `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-12/`
- 既存ガイド: `references/unassigned-task-guidelines.md`
- 検出ガイド: `references/unassigned-task-detection-guide.md`
- 品質基準: `references/unassigned-task-quality-standards.md`
