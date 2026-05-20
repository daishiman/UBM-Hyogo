# Phase 1: 要件定義

> Source issue: [#777](https://github.com/daishiman/UBM-Hyogo/issues/777)（OPEN のまま仕様書化）
> Parent unassigned spec: `docs/30-workflows/unassigned-task/serial-05-step-03-followup-003-schema-diff-history-view.md`
> taskType: `implementation`
> visualEvidence: `VISUAL`
> workflow_state: `CONTRACT_READY_IMPLEMENTATION_PENDING`
> task classification: code task (admin UI 追加 + read-only API helper)
> 実装区分: **実装仕様書**（CONST_005 必須項目すべてを含む / CONST_007 1サイクル完了スコープ）

---

## 1. 真の論点（Why）

### 1.1 現状

- `apps/web/src/components/admin/SchemaDiffPanel.tsx` は Google Form schema と D1 stableKey alias の **未解決差分** のみを描画する。
- resolve mutation 経由で確定した alias は監査ログ（`apps/api/src/routes/admin/audit.ts` の `action=schema_diff.alias_assigned` レコード）に記録されるが、UI から到達できない死蔵状態。
- 「誰がいつどの question を どの stableKey に resolve したか」を admin が確認する手段は D1 直接 query しか存在せず、運用上 API 担当者に問い合わせるしか無い。

### 1.2 課題

| # | 課題 | 影響 |
|---|---|---|
| C-1 | 履歴閲覧 UI 不在 | 誤 resolve（typo な stableKey 確定 等）を発見しても操作主体・時刻に遡れない |
| C-2 | 監査要件（個人情報保護方針 / 会員管理規程）に対するトレーサビリティ不足 | 監査ログは API レイヤに存在するが UI 経路 0 |
| C-3 | followup-004（rollback / undo）の前提欠落 | rollback 起点を選択する UI が無く先行着手不能 |
| C-4 | 運用振り返り input 不足 | 月次 resolve 頻度・操作者偏りの定量化が手動 query 依存 |

### 1.3 why now

- serial-05 step-03 が `implemented` で着地し、Phase 12 `unassigned-task-detection.md` §3 で本タスクが後続候補として明示 unconsumed のまま放置されている。
- parallel-09 で shared primitive（Pagination / FormField / Breadcrumb / EmptyState）が完成済みのため、新規 primitive を増やさずに UI を組める。
- followup-004 (rollback) を先行着手する前に、起点 UI 基盤を本タスクで提供する必要がある。

### 1.4 why this way

- **既存 endpoint surface 維持の不変条件**を最優先し、`apps/api/src/routes/admin/audit.ts` の既存 `action` filter + cursor pagination をそのまま再利用する（案 A）。
- 新規 D1 column / 新規 endpoint は追加しない。schema 領域専用 history endpoint（案 B）は payload 不足が Phase 5 で判明した場合のみの fallback とする。
- 履歴は単調増加するため offset pagination ではなく **cursor pagination** を選択。1 ページ 50 件は admin dashboard 他 list 系（members / requests）と整合。
- shared primitive のみで構成し、CLAUDE.md「プロトタイプ正本順位」「OKLch トークン正本化」「`*.spec.tsx` 固定」不変条件を満たす。

---

## 2. P50 チェック結果（起票時点 snapshot）

| 項目 | 結果 |
|---|---|
| current branch / origin/dev に履歴閲覧 UI が存在する | No（`/(admin)/admin/schema/history` route 不在を確認） |
| `fetchSchemaAliasHistory()` helper が存在する | No（`apps/web/src/lib/admin/api.ts` に未実装） |
| 既存 audit endpoint が `action=schema_diff.alias_assigned` を filter 可能 | Yes（`ListAuditQueryZ.action` で受理 / `AdminAuditListResponseZ` で返却） |
| shared primitive (Pagination / FormField / Breadcrumb / EmptyState) が parallel-09 で提供済み | Yes（前提として利用可能） |
| 前提タスク完了 | Yes（serial-05 step-03 = resolve mutation 実装済み / parallel-09 = primitive 提供済み） |

---

## 3. 背景

### 3.1 既存資産

- `apps/api/src/routes/admin/audit.ts`:
  - 受理 query: `action` / `actorEmail` / `targetType` / `targetId` / `from` / `to` / `cursor` / `limit(1-100, default 50)`
  - 返却 item: `auditId / actorId / actorEmail / action / targetType / targetId / maskedBefore / maskedAfter / parseError / createdAt`
  - cursor encoding: `encodeAuditCursor({ createdAt, auditId })` → base64url JSON
  - response shape: `{ ok, items[], nextCursor, appliedFilters }`（zod 検証済み）
- `apps/web/src/lib/admin/api.ts`: mutation helper 群が定義済み。本タスクで read-only helper `fetchSchemaAliasHistory()` を追加する。
- `apps/api/src/routes/admin/schema.ts`: resolve mutation の実装。本タスクでは原則 **触らない**（案 B 昇格時のみ）。
- `apps/web/src/components/admin/SchemaDiffPanel.tsx`: 既存 diff UI。本タスクは隣接 route として独立した `SchemaDiffHistoryPanel` を新設し、SchemaDiffPanel 本体は変更しない（Breadcrumb 経由で導線を貼るのみ）。

### 3.2 audit payload と表示項目の対応（案 A 前提）

| UI 表示項目 | audit log source | 備考 |
|---|---|---|
| 操作日時 | `createdAt`（ISO 文字列） | そのまま表示。Phase 11 で表示形式（JST 表記 vs ISO）を最終確認 |
| 操作者 email | `actorEmail`（lowercase 正規化済み） | filter input 側も `toLowerCase()` で正規化 |
| before stableKey | `maskedBefore.stableKey` | resolve mutation が記録する payload に依存。Phase 5 着手時に実 record を grep で確認 |
| after stableKey | `maskedAfter.stableKey` | 同上 |
| question text (label) | `maskedAfter.questionText` または `maskedBefore.questionText` | resolve mutation 経由で payload に含まれる前提 |

`maskedBefore` / `maskedAfter` のいずれかに必要項目が欠落していた場合は **案 B（新 endpoint）へ昇格** し、`apps/api/src/routes/admin/schema.ts` に `/admin/schema/history` を追加して schema 専用 payload を返す。判定タイミングは Phase 5 着手時 spec 確認。

---

## 4. 機能要件

- **F-1**: `/(admin)/admin/schema/history` を独立 route として新設し、admin 認証必須・session 由来の actor をログ記録対象とする。
- **F-2**: 履歴一覧を `createdAt` 降順で表示し、各行に「操作日時 / 操作者 email / before stableKey / after stableKey / question text」を表示する。
- **F-3**: filter input を 3 種提供:
  - 操作者 email（部分一致でなく完全一致。`apps/api/src/routes/admin/audit.ts` の `actorEmail` query は email 文字列で渡す）
  - 期間 from / to（JST 入力可能、`apps/api/src/routes/admin/audit.ts` の `jstInputToUtcIso` 既存挙動に従う）
  - question text 部分一致（client-side filter で対応。後述）
- **F-4**: cursor pagination を 50 件単位で実装。`次の 50 件` ボタンで `nextCursor` を query に乗せて再 fetchし、一覧はページ単位で置換する。`前の 50 件` は cursor stack を UI 状態で保持して戻る。
- **F-5**: 履歴 0 件時は `EmptyState` primitive で「該当する履歴がありません」を表示。
- **F-6**: shared primitive のみで構成: `Pagination` / `FormField` / `Breadcrumb` / `EmptyState`。新規 primitive を追加しない。
- **F-7**: fetch エラー時は client component 内で fail-soft に扱い、`role="alert"` で「履歴の取得に失敗しました」を表示する。既存 items がある場合は保持し、初回取得失敗時は retry 可能な空状態として表示する。
- **F-8**: `data-page="admin-schema-history"` を root に付与し、E2E / Playwright で identification 可能にする。
- **F-9**: question text 部分一致は API endpoint で対応していない場合があるため、**client-side filter** として現 page 内 50 件に対して `String.prototype.includes()` で適用する。API 側 filter 追加は本タスクでは行わない（案 A 維持）。

---

## 5. 非機能要件

| 観点 | 要件 |
|---|---|
| a11y | filter input は `FormField` 経由で label / error / helpText を統一。table は `<table>` semantic + `<th scope="col">`。Pagination primitive の既存 a11y を引き継ぐ |
| デザイン整合 | OKLch token のみ。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（`verify-design-tokens` gate 通過）。差分強調は `--color-warning` / `--color-info` 系 token を使用 |
| パフォーマンス | 50 件 / page 固定。`apps/web/src/lib/admin/api.ts` は同一 origin client helper のため、route page は thin server wrapper とし、初回取得と以降の pagination は client component (`SchemaDiffHistoryPanel`) が同じ helper で実行する |
| セキュリティ | admin middleware (`requireAdmin`) で session 認証必須。`apps/web` から D1 直接アクセス禁止（不変条件 #5）。`/api/admin/audit` 経由のみ |
| 互換性 | 既存 audit endpoint の zod schema (`AdminAuditListResponseZ`) を変更しない。response shape 変更による既存 audit UI への regression を避ける |
| テスト | Vitest + Testing Library。component spec は filter / pagination / 空状態 / fetch エラー連携の 4 観点。helper spec は成功 / appliedFilters echo / cursor 引継ぎ / HTTP エラーの 4 ケース |
| test suffix | `*.spec.tsx` / `*.spec.ts` のみ（CLAUDE.md 不変条件 #8、lefthook `block-test-suffix` 通過） |
| admin UI 標準 | form input は `FormField` 経由（CLAUDE.md 不変条件 #9） |
| admin mutation 経路 | 本タスクは read-only のため `useAdminMutation` 不要（CLAUDE.md 不変条件 #10 対象外） |

---

## 6. スコープ確定（CONST_007）

### 含む（in-scope / 1サイクル内完了）

- `apps/web/src/components/admin/SchemaDiffHistoryPanel.tsx` 新規（client component）
- `apps/web/app/(admin)/admin/schema/history/page.tsx` 新規（thin server wrapper / search params を client component へ渡す）
- `apps/web/app/(admin)/admin/schema/page.tsx` への Breadcrumb / link 追加（最小差分）
- `apps/web/src/lib/admin/api.ts` への `fetchSchemaAliasHistory()` 追加
- component spec + helper unit spec
- `docs/00-getting-started-manual/specs/11-admin-management.md` への履歴閲覧 UI 仕様追記（Phase 12）
- `outputs/phase-12/unassigned-task-detection.md` §3 の consumed 更新（Phase 12）

### 含まない（out-of-scope / 先送りなし宣言）

| 項目 | 既存分離先 |
|---|---|
| rollback / undo UI | followup-004（別タスクで既に分離済み） |
| bulk resolve UI | followup-002（別タスクで既に分離済み） |
| 履歴 CSV / TSV export | さらに後続（本仕様で起票しない） |
| D1 schema 変更 / 新 column | **禁止**（不変条件 #5 / serial-05 step-03 ガード） |
| 新 API endpoint 追加 | 原則禁止。案 B 昇格は Phase 5 で payload 不足判明時のみ |
| `useAdminMutation` 経路の hook 追加 | 本タスクは read-only のため対象外 |
| `verify-design-tokens` 以外の CI gate 改修 | 既存 gate に依存するのみ |

---

## 7. 受入条件（AC）

artifacts.json と同期。詳細は同 file 参照。

- AC-1 〜 AC-12 を充足することを Phase 9 / Phase 10 / Phase 11 で検証する。
- AC-12（`outputs/phase-12/unassigned-task-detection.md` §3 consumed 更新）は Phase 12 で実施。

---

## 8. 依存関係

| 種別 | 対象 | 関係 |
|---|---|---|
| 前提 | serial-05 step-03 (resolve mutation 実装) | 完了済み |
| 前提 | parallel-09 (shared primitive Pagination / FormField / Breadcrumb / EmptyState) | 完了済み |
| 後続前提 | followup-004 (rollback / undo) | 本タスク完了で UI 起点が提供される |
| 独立 | followup-002 (bulk resolve) | 互いに blocking なし |

---

## 9. ユビキタス言語

| 用語 | 定義 |
|---|---|
| schema alias resolve | admin が Google Form 上の question を D1 上の stableKey に確定する操作。`apps/api/src/routes/admin/schema.ts` の resolve mutation 経由 |
| audit log | `apps/api/src/routes/admin/audit.ts` が返す監査ログ list。本タスクは `action=schema_diff.alias_assigned` で filter した sub-set を「履歴」として描画 |
| schema diff history view | 本タスクで新設する `/(admin)/admin/schema/history` UI の総称 |
| cursor pagination | `encodeAuditCursor({ createdAt, auditId })` が返す opaque base64url 文字列を query に乗せて連続閲覧する pagination 方式。offset 番号は使わない |
| before / after stableKey | resolve 前後の stableKey 値。audit log payload (`maskedBefore` / `maskedAfter`) から抽出する |
| 案 A / 案 B | endpoint 戦略の選択肢。案 A = 既存 `/admin/audit` 再利用（既定）/ 案 B = `/admin/schema/history` 新設（payload 不足時 fallback） |
