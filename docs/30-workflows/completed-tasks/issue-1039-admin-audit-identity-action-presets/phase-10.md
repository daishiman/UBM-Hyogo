# Phase 10: 最終レビュー

> **[実装区分: 実装仕様書]**。Phase 9 の全品質 gate PASS を前提として、受入条件（AC-1..5）の充足を最終判定する。MINOR 指摘は Phase 12 未タスク化ルールに従って処理する。blocker が 0 件であることを確認して Phase 11 へ進行可とする。

---

## AC 充足判定表（issue #1039 受入条件と Phase 1 定義の照合）

| AC ID | 受入条件（Phase 1 定義） | 充足確認方法 | 判定 | 備考 |
|-------|------------------------|-------------|------|------|
| AC-1 | `/admin/audit` の action フィルタ付近に `identity.merge` / `identity.dismiss` を選べる UI（HTML5 `<datalist>`）がある | `AuditLogPanel.component.spec.tsx` の「`<datalist id="audit-action-presets">` が存在し、`identity.merge` / `identity.dismiss` の 2 option を持つ」テストケースが PASS。`grep -n 'list="audit-action-presets"\|datalist' apps/web/src/components/admin/AuditLogPanel.tsx` で属性と要素を確認 | — | Phase 4/5 で RED→GREEN 確認済みを記録 |
| AC-2 | プリセット選択後も URL query は既存 `action=<value>` 契約を維持し、reload / SSR 初期表示で選択状態が復元される | `page.page.spec.ts` の「`?action=identity.dismiss` → Input `defaultValue` が復元される」テストケースが PASS。`buildAuditHref` が **無変更**（`action` query key 保持）であることを `git diff` で確認 | — | server component / `name="action"` / URL query 契約の不変を確認 |
| AC-3 | 既存の任意 action 入力（例: `member.delete`, `schema.alias.rollback_notification`）が退化しない | `AuditLogPanel.component.spec.tsx` の「自由入力 `<Input name="action">` が維持される（`list` 付与後も任意文字列入力が可能）」テストケースが PASS | — | datalist は提示のみで入力制約を課さない（native `<input list>` 仕様）ことを確認 |
| AC-4 | cursor pagination の next URL が action filter を保持する | 既存 `buildAuditHref` 関連テストの非退化（**無変更**）を確認。`buildAuditHref(values, nextCursor)` が `action` を保持することを既存 spec で担保 | — | `buildAuditHref` 無変更ゆえ退化リスク無し |
| AC-5 | `AuditLogPanel` component tests と `/admin/audit` page tests が green | `mise exec -- pnpm vitest run apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx apps/web/app/(admin)/admin/audit/page.page.spec.ts`（リポジトリルートから実行）が全 PASS。`pnpm typecheck` / `pnpm lint` PASS を併せて証拠とする | — | targeted run（Phase 1 §7）。全件 `pnpm test` は不要 |

**判定凡例**: PASS / FAIL / pending（runtime 依存で Phase 11 以降に持ち越し）

---

## MINOR 指摘の処理ルール（unassigned-task-guidelines）

最終レビュー中に発見した指摘事項は以下の基準で処理する。

| 種別 | 基準 | 処理 |
|------|------|------|
| **blocker** | AC 未充足・不変条件違反（既存 API surface 変更 / D1 schema 変更 / Google Form 仕様変更 / `apps/web` から D1 直接アクセス）・型安全性の欠損・OKLch トークン違反（HEX 直書き） | 即時修正（Phase 10 内で修正して再判定）。Phase 11 には進めない |
| **MINOR** | 機能に影響しない改善（コメント精度・変数名・将来の定数化余地） | Phase 12 `unassigned-task-detection` セクションで記録。blocker として扱わない |
| **runtime 依存** | staging 認証下での実画面 screenshot 取得（admin session 必須） | **user-gated 残課題**。AC は component / page test の PASS で一次充足とし、screenshot は Phase 11 user-gated で取得 |

### 本タスクの MINOR 判定（確定）

| 指摘候補 | 判定 | 理由 |
|---------|------|------|
| datalist の 2 値（`identity.merge` / `identity.dismiss`）を共有定数（例 `IDENTITY_AUDIT_ACTIONS`）として切り出す | **未タスク化しない（YAGNI で却下）** | 提示候補は 2 件のみで、API 正本（`identity-merge.ts:147` / `identity-conflict.ts:250`）との同期も発生頻度が低い。`AuditLogPanel.tsx` 内 inline literal で十分。早期抽象化はかえって参照経路を増やすため却下する |
| MINOR=「Phase 3 で吸収済み」 | — | 設計上の指摘（命名規則・Input `list` 透過・契約不変）は Phase 3 の設計判断で解消済み。Phase 10 時点での新規 MINOR は上記 1 件のみで、それも未タスク化しない |

> 結論: 本タスクの MINOR は **Phase 12 未タスク化対象 0 件**。

---

## partial_fix 確認

| 確認項目 | 確認方法 | 結果 |
|---------|---------|------|
| Phase 5 実装で「後回し」とした箇所（FIXME/TODO コメント）が残っていないか | `grep -n "TODO\|FIXME\|HACK" apps/web/src/components/admin/AuditLogPanel.tsx apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx apps/web/app/(admin)/admin/audit/page.page.spec.ts` | ヒット 0 件を期待。ヒットがあれば blocker か MINOR かを判断する |
| skip されたテストが残っていないか | `grep -n "\.skip\|it\.skip\|describe\.skip\|test\.skip" apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx apps/web/app/(admin)/admin/audit/page.page.spec.ts` | ヒット 0 件を期待 |
| `buildAuditHref` が無変更であること | `git diff dev...HEAD -- apps/web/src/components/admin/AuditLogPanel.tsx \| grep -n "buildAuditHref"` で関数本体に diff が無いこと | buildAuditHref 本体に変更が無いことを確認（AC-4） |
| 不変条件チェック（API surface / D1 / Google Form 不変） | `git diff dev...HEAD --name-only` に `apps/api/` / `migrations/` / Google Form schema 関連の変更が含まれないこと | UI 層（`apps/web`）のみの変更であることを確認 |

---

## runtime 依存残課題（user-gated）

本タスクは server / DB / R2 を変更しない純粋 UI 改修のため、provisioning 系の runtime ops は無い。残課題は staging 認証下での視覚証跡取得のみ。

| 残課題 ID | 内容 | 実行手順 | ゲート |
|----------|------|---------|--------|
| RT-UI-001 | staging 環境での実画面 screenshot 取得（datalist 候補提示 / `?action=...` SSR 復元） | staging deploy 後、admin session で `/admin/audit` を開き Phase 11 canonical 名で撮影 | Phase 11 user-gated（admin 認証必須） |

> 本タスクは Cloudflare bucket / secret / D1 migration を一切伴わない。`bash scripts/cf.sh` 系の ops は不要。

---

## ブロッカー判定サマリ

| 区分 | 件数 | 備考 |
|------|------|------|
| blocker（AC 未充足・不変条件違反） | — | Phase 10 実施時に記入（想定 0 件） |
| MINOR（Phase 12 未タスク化） | 0 | datalist 定数化候補は YAGNI で却下＝未タスク化しない |
| runtime 依存残課題（user-gated） | 1 件 | RT-UI-001（staging screenshot） |

**Phase 11 進行条件**: blocker 件数が **0** であること。runtime 依存残課題は Phase 11 user-gated のため進行を妨げない。

---

## 完了条件（Phase 10）

- [ ] AC-1..5 の全判定が記録されており、FAIL が 0 件
- [ ] `TODO`/`FIXME`/`.skip` の grep gate が実行済みで、blocker 件数が 0
- [ ] `buildAuditHref` が無変更であることを確認済み（AC-4）
- [ ] `apps/api` / `migrations` / Google Form schema に変更が無いこと（不変条件）を確認済み
- [ ] MINOR 指摘（datalist 定数化）が YAGNI で却下＝未タスク化しないことが明記されている
- [ ] runtime 依存残課題（RT-UI-001）が user-gated として記録されている
- [ ] blocker 0 件が確認されており Phase 11 進行可の判定が明記されている

## メタ情報
workflow_state: `implemented_local_evidence_captured` / taskType: `implementation` / visualEvidence: `VISUAL_ON_EXECUTION`

## 目的
AC-1..5 と blocker/MINOR/runtime gate の状態を最終判定する。

## 実行タスク
- AC 充足表を埋める。
- blocker 0 件を確認する。

## 参照資料
- `phase-1.md`（AC 定義 / inventory）
- `docs/30-workflows/completed-tasks/issue-987-identity-conflicts-audit-log-admin-ui/outputs/phase-12/implementation-guide.md`（親 #987）

## 成果物
- Phase 10 最終レビュー

## 統合テスト連携
Phase 11 は本 Phase の blocker 0 件判定を前提に実行する。
