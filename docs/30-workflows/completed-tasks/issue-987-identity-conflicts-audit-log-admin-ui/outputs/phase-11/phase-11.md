# Phase 11: 手動テスト（NON_VISUAL）

**[実装区分: 実装仕様書]**

## 0. NON_VISUAL 宣言

| 項目 | 内容 |
| --- | --- |
| タスク種別 | implementation（API repository / route の監査記録追加） |
| 視覚カテゴリ | **NON_VISUAL** |
| 非視覚的理由 | UI 新規実装ゼロ。`/admin/audit`（`apps/web/app/(admin)/admin/audit/page.tsx` / `apps/web/src/components/admin/AuditLogPanel.tsx`）は既存の action 自由入力フィルタ + actorEmail / targetType / targetId / 期間フィルタを持つため、`action=identity.dismiss` が audit_log に書かれた瞬間に**追加実装なし**で時系列閲覧・フィルタが可能になる。新規画面・新規コンポーネント・レイアウト変更・色 / トークン変更はいずれも発生せず、視覚的な画面差分が存在しない |
| 代替証跡 | D1 lane focused Vitest 結果（`identity-conflict.repository.spec.ts` / `identity-conflicts.contract.spec.ts` / `audit.contract.spec.ts`）+ 本フェーズの手動 DoD 確認手順（staging、user-gated） |
| screenshot | **作成しない**。視覚差分がないため `screenshots/.gitkeep` も作らない |

---

## 1. 3 層評価

| 評価層 | 適用 | 内容 / N/A 理由 |
| --- | --- | --- |
| Semantic（テスト結果） | ✅ 中心 | dismiss → `audit_log` 記録、`/admin/audit` の action / actorEmail / targetId フィルタ通過を contract spec で検証。これが本タスクの主証跡 |
| Visual（screenshot / pixel diff） | ❌ N/A | UI 新規実装ゼロ・既存画面の視覚差分なし。撮影対象が存在しない |
| AI UX（操作性 / 導線評価） | ❌ N/A | 新規導線・新規操作なし。既存 `/admin/audit` のフィルタ操作性は本タスクのスコープ外（変更していない） |

---

## 2. 証跡の主ソース（自動テスト）

| spec | 想定ケース数 | 検証内容 |
| --- | --- | --- |
| `apps/api/src/repository/__tests__/identity-conflict.repository.spec.ts` | dismiss audit 系 | dismiss 後 `audit_log` に `action='identity.dismiss'` 行 1 件、`target_id=target`・`actor_email` 配線値、reason 生 PII が audit payload に出ないことを検証 |
| `apps/api/src/routes/admin/identity-conflicts.contract.spec.ts` | route dismiss audit 系 | dismiss endpoint が `identity.dismiss` audit row を actor email 付きで記録することを検証 |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | identity.dismiss フィルタ | `action=identity.dismiss` + `targetType=member` + `targetId` フィルタで dismiss 行が返ることを検証 |
| merge 回帰 | 既存ケース維持 | `identity.merge` 記録に影響なし（green 維持） |

> 実行コマンドは `outputs/phase-9/phase-9.md` §2 を正とする。件数は実装時に確定し、本表は最低限の網羅軸を示す。

---

## 3. 手動 DoD 確認手順（staging / user-gated）

staging に反映された後、admin 認証下で 1 回実施する。Cloudflare 系操作・認証込みの runtime 確認は **user-gated**（CLAUDE.md シークレット運用ポリシー）。

1. admin としてログインし `/admin/identity-conflicts` で任意の conflict に対し **dismiss** を実行する。
2. `/admin/audit?action=identity.dismiss` を開き、当該 dismiss イベントが**時系列**で表示されることを確認する。
3. `actorEmail` フィルタに実行 admin のメールを入力 → 当該行が残ること、`targetId` フィルタに dismiss 対象の member id を入力 → 当該行が残ることを確認する。
4. 当該 audit payload に dismissal metadata のみが表示され、reason 生値や PII（responseEmail 等）が出ていないことを確認する。

### 期待 evidence（user-gated・pending）

| 種別 | 出力先 | 内容 |
| --- | --- | --- |
| 手動テスト結果 | `outputs/phase-11/manual-smoke-log.md` | 上記 4 手順の実施結果（PASS / NG）。現時点は user-gated pending。screenshot は添付しない（NON_VISUAL） |

---

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| manual test plan | outputs/phase-11/phase-11.md | present |
| manual smoke log | outputs/phase-11/manual-smoke-log.md | template present（runtime execution pending user-gated / staging。PASS 根拠には含めない） |
| screenshot | （N/A） | not applicable（NON_VISUAL — 視覚差分なし。`.gitkeep` も作らない） |

> manual-test メタ: 証跡の主ソースは §2 の自動 contract spec（identity-conflicts + audit、合計 5〜7 ケース想定）。手動 staging runtime は user-gated pending として PASS 根拠から分離する。screenshot を作らない理由は本フェーズ §0 NON_VISUAL 宣言の通り「UI 新規実装ゼロ・既存 `/admin/audit` 活用・視覚差分なし」。

---

## 5. スコープ外の発見事項（未タスク候補 — Phase 12 連携）

| 候補 | 扱い | 理由 |
| --- | --- | --- |
| `AuditLogPanel` に `identity.dismiss` / `identity.merge` のプリセット選択肢を追加 | 未タスク候補 | 既存 action 自由入力で閲覧可能。UX 改善であり根本解決に不要（Phase 10 §4 と整合） |
| `audit_log` INSERT 共通ヘルパ抽出 | no-op（未タスク化しない） | Phase 8 判断: 重複 2 箇所・batch 全体は共通化不可・投機的抽象化 |
| identity.dismiss の staging runtime smoke 自動化 | 未タスク候補（任意） | 本タスクは contract spec で担保。runtime smoke は別途 user-gated ops 領域 |

---

## 6. 参照

- 前段: `outputs/phase-9/phase-9.md`（品質保証 / テスト実走コマンド）、`outputs/phase-10/phase-10.md`（acceptance criteria / consumer wiring）
- 後段: `outputs/phase-12/`（未タスク検出・compliance-check）、`outputs/phase-13/phase-13.md`（PR / external ops — user-gated）
- consumer（既存・変更なし）: `apps/web/app/(admin)/admin/audit/page.tsx` / `apps/web/src/components/admin/AuditLogPanel.tsx`
