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

## 6. Governance YAML フロントマター契約（不可逆 mutation タスク）

`gh api -X PUT` / `wrangler deploy` / `d1 migrations apply` / `gh secret set` 等の不可逆 mutation を
含む unassigned-task は、ファイル冒頭 YAML フロントマターに次 4 フィールドを **必須化** する。
詳細は [closed-issue-canonical-workflow-recovery.md](closed-issue-canonical-workflow-recovery.md) §3、
AI 実行可否分類は [non-visual-irreversible-task-rules.md](non-visual-irreversible-task-rules.md) §0 を参照。

```yaml
---
governance_mutation_user_gate: true
mutation_commands:
  - "gh api -X PUT repos/<owner>/<repo>/branches/<branch>/protection"
  - "wrangler deploy --config apps/api/wrangler.toml --env production"
read_only_evidence_allowed_pre_gate: true
user_approval_marker: outputs/phase-13/user-approval-<task-id>-<timestamp>.md
---
```

| field | 必須 | 内容 |
| --- | --- | --- |
| `governance_mutation_user_gate` | ✅ | `true` 固定。AI が user 承認なしに mutation 実行禁止 |
| `mutation_commands` | ✅ | 不可逆 command literal 一覧（partial wildcard / placeholder 禁止） |
| `read_only_evidence_allowed_pre_gate` | ✅ | `true`: read-only 操作のみ AI 事前実行可 |
| `user_approval_marker` | ✅ | user 承認文言を逐語保存する物理パス |

> 不可逆 mutation を **含まない** docs-only / NON_VISUAL タスクではフロントマター 4 フィールドは
> 任意。`governance_mutation_user_gate: false` を明示すると audit script が緩和路線で評価する。

---

## 軽量フォーマット例外（親 spec.md 配下の sub-task）

`improvements/<workflow-name>/<group>/index.md` と `spec.md` が親側に存在する sub-task は、
リスク・検証・スコープが親 spec に集約されているため、未タスクファイル側では
`## 1. なぜ / ## 2. 何を / ## 3. 苦戦 / ## 4. AC / ## 5. 参照資料` の 5 セクション軽量
フォーマットを許容する。重複記載を避け、親 spec 側の SSOT を壊さないことが目的。

### 前提条件（必須）

- `## 5. 参照資料` から **親 `spec.md` への明示リンク** が必須（相対パス可、リンク切れ禁止）
- 親側 `index.md` / `spec.md` に「リスクと対策」「検証方法」「スコープ（含む/含まない）」が
  実体として存在すること（grep / 目視で確認）
- 親側が削除・移動された場合は、軽量フォーマットを通常 4 セクションへ昇格させる
  （親リンク切れ = SSOT 崩壊なので例外失効）

### 適用例

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/`
配下に親 `index.md` + `parallel-i02..i07/spec.md` が存在し、リスク・検証・スコープが
親側で集約管理されているため、以下 6 ファイルは 5 セクション軽量フォーマットを採用:

- `docs/30-workflows/unassigned-task/integration-fixes-i02-admin-error-type-unify.md`
- `docs/30-workflows/unassigned-task/integration-fixes-i03-dialog-refresh-order.md`
- `docs/30-workflows/unassigned-task/integration-fixes-i04-homepage-cta.md`
- `docs/30-workflows/unassigned-task/integration-fixes-i05-login-loading-and-error-focus.md`
- `docs/30-workflows/unassigned-task/integration-fixes-i06-root-error-focus.md`
- `docs/30-workflows/unassigned-task/integration-fixes-i07-profile-loading-skeleton.md`

### audit script 連携

`scripts/audit-unassigned-tasks.js` 実装時は、ファイル冒頭または `## 5. 参照資料` 内に
親 `spec.md` への relative link が含まれる場合、4 セクション必須チェックを skip し
軽量 5 セクション（`## 1. なぜ` / `## 2. 何を` / `## 3. 苦戦` / `## 4. AC` / `## 5. 参照資料`）の
存在確認に切替える分岐を設ける。

---

## 7. 検証スクリプト連携

`scripts/audit-unassigned-tasks.js` / `scripts/verify-unassigned-links.js` は本書の 4 セクションを
required field として検査する想定。§6 governance YAML フロントマター契約も同 script の
検査対象とし、`MISSING_GOVERNANCE_CONTRACT` / `CONTRACT_INCONSISTENT` /
`MISSING_USER_APPROVAL_MARKER` を fail 種別として扱う。実装は F-1 タスクで対応予定。

## 8. 単一ファイル proto-spec フォーマット（Phase 1-13 を持たないタスク種候補）

`docs/30-workflows/unassigned-task/<slug>.md` を Phase 1-13 構造に展開する前段として、
**単一ファイルの proto-spec**（タスク種候補 / tasking 前の検討票）として配置することを正式に許容する。
出典: `parallel-02-prototype-css-rules-port`（2026-05-18）の派生未タスク運用知見。

### 適用条件

- まだ Phase 1（要件定義）に進む前で、対象スコープが「タスク化すべきか」自体の判断段階にある
- 親 workflow root が確定しているが、子タスクとして単独 directory（`phase-01-requirements.md` … `phase-13.md`）化するほどの粒度がない
- 中身が固まったら **本格 Phase 1-13 spec** または親 workflow 内の追加 phase ファイルに昇格する前提

### 必須セクション（軽量 7 セクション）

| # | セクション | 必須 | 内容 |
| --- | --- | --- | --- |
| 1 | メタ情報 | ✅ | `## メタ情報` 見出し下に親 workflow / Issue / status (`proto` / `consumed` / `superseded`) / 作成日 |
| 2 | 目的 | ✅ | 1-3 行で「なぜタスク化候補なのか」 |
| 3 | スコープ | ✅ | 含む / 含まない（最小 1 列 + 1 列） |
| 4 | 依存関係 | ✅ | 親 workflow root へのリンク / 先行タスク / 関連 PR |
| 5 | 苦戦箇所・知見 | ✅ | 検討中に得た知見・回避すべきパターン |
| 6 | 受け入れ基準 | ✅ | 「本格 spec へ昇格する条件」または「破棄する条件」 |
| 7 | 参照 | ✅ | 関連 spec / reference / Issue / lessons-learned |

Phase 1-13 形式の必須 4 セクション（§1-§4 苦戦 / リスク / 検証 / スコープ）とは別系統。
proto-spec は「タスク種候補」であり、`scripts/audit-unassigned-tasks.js` 連携では
**header に `status: proto` または `## メタ情報` 表に `種別: proto-spec` を含む** ことで
4 セクション必須チェックを skip し、軽量 7 セクションの存在確認に切替える。

### 本格 spec への昇格パス

```
unassigned-task/<slug>.md (proto)
   │
   │  受け入れ基準を満たす
   ▼
either:
  (A) 親 workflow に phase ファイル追加（既存 workflow 内 task）
  (B) 新規 workflow root 生成（docs/30-workflows/<new-workflow>/phase-01..phase-13）
   │
   ▼
unassigned-task/<slug>.md status を `consumed` に書き換え、
canonical_workflow: <昇格先 path> を YAML フロントマターに追記し、
本ファイルは履歴として保持（削除しない）
```

### 破棄パス

タスク化不要と判定された場合は status を `superseded` または `rejected` に変更し、
理由（rationale）を `## メタ情報` 表に 1 行で残してから保持。物理削除はしない。

### 落とし穴

| 症状 | 修正 |
| --- | --- |
| proto-spec のまま長期放置 | 4 週間以上 `proto` 状態のものは Phase 12 unassigned-task-detection で再評価対象 |
| `## メタ情報` 見出しが複数（yaml block と表の重複） | 1 つに統一 |
| 昇格後に `consumed` への書き換え漏れ | aiworkflow indexes / changelog 同 wave 更新 |
| proto-spec を Phase 1-13 形式に展開せず本格タスクとして commit | `governance_mutation_user_gate` 等の必須 YAML が欠落 → audit fail |

## 関連リンク

- 出典: `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-12/`
- 既存ガイド: `references/unassigned-task-guidelines.md`
- 検出ガイド: `references/unassigned-task-detection-guide.md`
- 品質基準: `references/unassigned-task-quality-standards.md`
- proto-spec 出典: `parallel-02-prototype-css-rules-port` 2026-05-18 派生未タスク運用
