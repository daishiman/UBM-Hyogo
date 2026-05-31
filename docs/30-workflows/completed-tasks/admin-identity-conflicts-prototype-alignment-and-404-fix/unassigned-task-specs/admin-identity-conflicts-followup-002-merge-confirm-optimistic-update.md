# Admin Identity Conflicts FU-002 — merge confirm の optimistic update - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-identity-conflicts-followup-002-merge-confirm-optimistic-update |
| タスク名 | merge confirm を optimistic update 化 (FU-AIDC-004) |
| 分類 | UX 改善 (post-MVP) |
| 対象機能 | `/admin/identity-conflicts` の merge 二段階 confirm |
| 優先度 | 低 |
| 見積もり規模 | 小 |
| ステータス | consumed_by_issue_988_workflow / implemented_local_evidence_captured |
| 発見元 | admin-identity-conflicts-prototype-alignment-and-404-fix Phase 12 unassigned-task-detection (FU-AIDC-004) |
| 発見日 | 2026-05-27 |
| canonical workflow | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/` |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

現状の merge 操作は二段階 confirm 後に server round-trip 完了まで spinner を表示する。`IdentityConflictRow.tsx` 内 mutation は `useAdminMutation` 経由で動作するが、UI 上は server 応答待ちでブロックされる。プロトタイプ整合の本サイクル (admin-identity-conflicts-prototype-alignment-and-404-fix) では UX 仕様の変更を行わず、optimistic update への移行は Phase 12 detection で FU-AIDC-004 として独立スコープ化された。

### 1.2 問題点・課題

- merge 完了まで該当 row が disable 状態となり、複数 conflict をまとめて処理する運用で時間がかかる
- spinner 表示中の re-fetch トリガが粗く、楽観的 UI 更新 + rollback 設計が未整備

### 1.3 放置した場合の影響

- 機能要件は不変だが運用効率に直結する UX 劣位が継続
- 大量 conflict 滞留時に管理コストが膨らむ

---

## 2. 何を達成するか（What）

### 2.1 目的

merge 完了を待たずに該当 row を一覧から非表示にし、server エラー時のみ rollback で再表示する。

### 2.2 最終ゴール

- merge 成功時: ユーザー操作直後に row が消える（server round-trip を待たない）
- merge 失敗時: row が復元し、エラー toast / inline error が出る
- 既存 contract spec / E2E spec が全 green

### 2.3 スコープ

#### 含むもの

- `useAdminMutation` (features/admin) の optimistic option 利用または mutation 後 invalidate の最小差分
- `IdentityConflictRow.tsx` の state 更新タイミング差し替え
- rollback 経路の focused vitest 追加

#### 含まないもの

- merge endpoint 自体の変更
- dismiss 側の optimistic 化（必要なら別 followup）

### 2.4 成果物

- `IdentityConflictRow.tsx` diff + focused vitest
- Playwright e2e に rollback シナリオ追加

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス | 役割 |
| --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | merge 呼び出し本体 |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | optimistic option 提供有無の確認 |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | rollback シナリオ |

### 3.2 検証手順

1. `useAdminMutation` の optimistic 対応有無を確認
2. 不足する場合は hook を最小拡張（他 admin mutation との非互換が出ない形）
3. row 単位の state 差し替えを実装
4. focused vitest（成功 / 失敗 / rollback）
5. Playwright で操作即座の UI 反映を確認

---

## 4. 受け入れ基準

### 機能要件

- [ ] merge 操作直後に row が一覧から消える
- [ ] server error 時に row が復元しエラー表示が出る
- [ ] dismiss 側既存挙動は不変

### 品質要件

- [ ] focused vitest 全 green
- [ ] Playwright e2e 全 green
- [ ] legacy `@/lib/useAdminMutation` 未参照

### ドキュメント要件

- [ ] §6 苦戦箇所の追記

---

## 5. CONST 制約

- 不変条件 #1: 既存 API のみ利用
- 不変条件 #10: legacy useAdminMutation 不使用
- OKLch トークン正本化

---

## 6. 苦戦箇所・予測される困難 【必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | rollback 時の race condition で複数 row が誤って復元する |
| 原因 | optimistic 適用順序と server 応答順序の不一致 |
| 対応 | 操作 ID ベースで rollback 対象を限定する |
| 再発防止 | rollback の per-id 仕様を hook level で固定 |

| 項目 | 内容 |
| --- | --- |
| 症状 | server エラー時の toast 表示と inline error の責務分界が曖昧 |
| 原因 | 既存 admin mutation のエラー UI 表現が混在 |
| 対応 | 既存 `AdminSectionErrorClient` パターンに従い inline error 優先、toast は補助 |
| 再発防止 | UX 仕様を本 spec §3 に明記 |

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| `useAdminMutation` の API 変更が他画面に波及 | 中 | 中 | hook 拡張は backward compatible に限定 |
| optimistic UX が dismiss と非対称になる | 低 | 中 | dismiss 側も別 followup で対応するか spec で判断 |

---

## 8. 関連リソース

- 親サイクル: `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/`
- 既存実装: `apps/web/src/components/admin/IdentityConflictRow.tsx`
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/988

---

## 9. 備考

- post-MVP の UX 改善であり、機能要件不変。
- 2026-05-30: `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/` へ昇格し、`IdentityConflictRow.tsx` の component-local optimistic state と focused tests で実装済み。commit / push / PR / Issue close は user-gated。
