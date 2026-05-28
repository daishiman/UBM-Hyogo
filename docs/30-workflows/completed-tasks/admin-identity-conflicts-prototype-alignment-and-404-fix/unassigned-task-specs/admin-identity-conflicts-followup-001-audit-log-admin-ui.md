# Admin Identity Conflicts FU-001 — merge / dismiss 監査ログ admin UI 表示 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-identity-conflicts-followup-001-audit-log-admin-ui |
| タスク名 | merge / dismiss 監査ログの admin UI 表示 (FU-AIDC-002) |
| 分類 | UI 追加実装 (admin/audit 拡張 or 専用 view 新設) |
| 対象機能 | identity-conflicts の merge / dismiss 操作監査ログの可視化 |
| 優先度 | 中 |
| 見積もり規模 | 中 |
| ステータス | 未実施 |
| 発見元 | admin-identity-conflicts-prototype-alignment-and-404-fix Phase 12 unassigned-task-detection (FU-AIDC-002) |
| 発見日 | 2026-05-27 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`/admin/identity-conflicts` の merge / dismiss 操作は、`apps/api/src/routes/admin/identity-conflicts.ts` 経由で D1 (`identity_conflict_dismissals` / `member_identities` / `identity_aliases`) を更新する際、server log（`logger.info` tag 経由）に actor / conflictId / action を記録している。しかし admin UI 側にはこの履歴を確認する surface が存在せず、誰がいつ merge / dismiss したのかを Cloudflare ログ tail でしか追えない状態にある。

親サイクル (admin-identity-conflicts-prototype-alignment-and-404-fix) の Phase 12 detection で FU-AIDC-002 として独立スコープ化された。理由は「admin/audit 既存ページ拡張」または「専用 audit view 新設」のいずれを選ぶかの UI 設計が未確定であり、本サイクルの prototype 整合スコープに含めると単一責務原則違反となるため。

### 1.2 問題点・課題

- 監査証跡が admin 操作画面から辿れず、運用調査の都度 Cloudflare ログを掘る必要がある
- merge / dismiss の誤操作（誤った conflict を merge 等）の事後検出が困難
- `/admin/audit` 既存ページとの責務分界が不明確（identity-conflicts 専用 tab とするか、汎用 audit に conflictId フィルタを足すかの設計判断が必要）

### 1.3 放置した場合の影響

- 運用者が監査調査を Cloudflare ログ tail に依存し続け、調査コストが高止まり
- identity 統合は会員データに対する破壊的操作であり、UI 上の事後証跡欠如はガバナンス上のリスク

---

## 2. 何を達成するか（What）

### 2.1 目的

merge / dismiss 操作履歴を admin UI から時系列に閲覧でき、actor / conflictId / timestamp / action 種別でフィルタ可能な状態を実現する。

### 2.2 最終ゴール

- merge / dismiss 操作が時系列リストで admin UI 上に表示される
- conflictId / actor / action 種別でフィルタが利く
- 既存 API `apps/api/src/routes/admin/identity-conflicts.ts` を拡張する場合は最小差分（list endpoint 追加）に留め、merge / dismiss endpoint 自体は不変
- D1 schema 変更は最小（既存テーブル参照のみで成立する場合は新規 schema 追加なし）

### 2.3 スコープ

#### 含むもの

- 監査ログ表示先の決定（`/admin/audit` 拡張 or `/admin/identity-conflicts/audit` 新設）
- list endpoint 設計（`GET /api/admin/identity-conflicts/audit` 想定）
- 表示 UI（AdminPageHeader + table primitive で他 admin ページと整合）
- フィルタ UI（actor / conflictId / action）

#### 含まないもの

- merge / dismiss 操作自体の UX 変更（FU-AIDC-004 で独立扱い）
- D1 schema の破壊的変更（既存 `identity_conflict_dismissals` で不足する情報があれば、追加カラムは Spec 内で議論し別 PR）
- Google Form schema 変更（不変条件）

### 2.4 成果物

- list endpoint contract spec（`apps/api/src/routes/admin/identity-conflicts.contract.spec.ts` 追記）
- admin UI ページ実装 + focused vitest
- Playwright visual baseline 3 枚（mobile / tablet / desktop）

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス | 役割 |
| --- | --- |
| `apps/api/src/routes/admin/identity-conflicts.ts` | list endpoint 追加（最小差分） |
| `apps/web/app/(admin)/admin/identity-conflicts/audit/page.tsx` または `/admin/audit/page.tsx` 拡張 | UI 表示 |
| `apps/web/src/components/admin/AdminPageHeader.tsx` | header primitive |
| D1 既存テーブル | `identity_conflict_dismissals` 等で audit 情報が取得可能か事前確認 |

### 3.2 検証手順

1. UI 配置方針を決定（既存 `/admin/audit` の構造を読み、責務分界を判定）
2. list endpoint の入出力契約を contract spec で先に固定
3. UI を AdminPageHeader + primitive で実装し、Tailwind 直書き 0 件を維持
4. focused vitest + Playwright visual baseline
5. `bash scripts/verify-pr-ready.sh` で gate 通過

---

## 4. 受け入れ基準

### 機能要件

- [ ] merge / dismiss 履歴が admin UI 上で時系列に確認できる
- [ ] conflictId / actor / action でフィルタが利く
- [ ] 既存 merge / dismiss endpoint の挙動は不変

### 品質要件

- [ ] AdminPageHeader + primitive 整合（Tailwind 直書き 0）
- [ ] D1 直接アクセス 0（不変条件 #5）
- [ ] legacy `@/lib/useAdminMutation` 未参照（不変条件 #10）
- [ ] contract spec / focused vitest / Playwright visual baseline 全 green

### ドキュメント要件

- [ ] 親サイクルへの後方リンクを spec に明記
- [ ] §6 苦戦箇所の追記

---

## 5. CONST 制約

- 不変条件 #1: 既存 API のみ拡張、新 endpoint は最小差分
- 不変条件 #5: D1 直接アクセスは `apps/api` に閉じる
- 不変条件 #9: FormField 経由（input が必要な場合）
- 不変条件 #10: legacy useAdminMutation 不使用
- OKLch トークン正本化（HEX 直書き禁止）

---

## 6. 苦戦箇所・予測される困難 【必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | `/admin/audit` 既存ページ拡張か専用 view 新設かの判断が遅延する |
| 原因 | 既存 audit ページは別系統イベントを扱っており、identity-conflicts 専用フィルタを混在させると一覧性が落ちる可能性 |
| 対応 | 事前に `/admin/audit/page.tsx` の現行構造を読み、`actorType` / `eventType` の分離可否を 1 PR 内で判定する |
| 再発防止 | 設計判断の根拠を spec §3 に残す |

| 項目 | 内容 |
| --- | --- |
| 症状 | 既存 `identity_conflict_dismissals` テーブルで actor / timestamp が不足し、schema 追加が必要になる |
| 原因 | dismiss のみ row が残り、merge は member_identities への更新で痕跡が薄い |
| 対応 | server log の構造化済みフィールドから D1 への昇格が必要かを Phase 4 設計時に判定 |
| 再発防止 | logger tag → D1 列の整合表を spec に残す |

| 項目 | 内容 |
| --- | --- |
| 症状 | UI 上 actor 表示の PII 取扱いで責任分界が曖昧 |
| 原因 | actor は admin email を含むため raw 表示の可否を確認する必要 |
| 対応 | `responseEmail` PII redaction ルールと同じ扱いを採用 |
| 再発防止 | PII redaction grep gate を test に組み込む |

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| schema 変更を要する設計に倒れる | 中 | 中 | schema 追加が必要なら別 PR に分離 |
| `/admin/audit` 既存ページの UX 退行 | 中 | 低 | 拡張時は visual baseline regression を取る |
| list endpoint pagination 設計の抜け | 中 | 中 | offset/limit + 上限 200 を spec で固定 |

---

## 8. 関連リソース

- 親サイクル: `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/` (移動後パス)
- 既存 audit: `apps/web/app/(admin)/admin/audit/page.tsx`
- API route: `apps/api/src/routes/admin/identity-conflicts.ts`
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/987

---

## 9. 備考

- 本タスクは設計判断（既存 audit 拡張 vs 専用 view 新設）が先行するため、Phase 1-3 の比重が大きい想定
