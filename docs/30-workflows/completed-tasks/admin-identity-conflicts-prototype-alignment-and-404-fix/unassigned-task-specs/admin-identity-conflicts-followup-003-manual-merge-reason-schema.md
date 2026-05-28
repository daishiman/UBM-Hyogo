# Admin Identity Conflicts FU-003 — manualMergeReason schema 拡張 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | admin-identity-conflicts-followup-003-manual-merge-reason-schema |
| タスク名 | identity-conflicts schema に `manualMergeReason` 任意フィールド追加 (FU-AIDC-005) |
| 分類 | schema 拡張 (admin-managed data) |
| 対象機能 | identity merge 操作の任意理由記録 |
| 優先度 | 低 |
| 見積もり規模 | 中 |
| ステータス | 未実施 |
| 発見元 | admin-identity-conflicts-prototype-alignment-and-404-fix Phase 12 unassigned-task-detection (FU-AIDC-005) |
| 発見日 | 2026-05-27 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`/admin/identity-conflicts` の merge 操作時、運用者が「なぜこの 2 つを同一人物と判断したか」の根拠を任意で残せると、後日の監査・問合せ対応に役立つ。現状 `identity_conflict_dismissals` には dismiss 理由を残す経路があるが、merge 側にはコメント / 理由フィールドが存在しない。

親サイクル detection で FU-AIDC-005 として独立スコープ化。schema 変更は CLAUDE.md「Google Form schema 外データは admin-managed として分離」「schema 変更は independent PR」の方針に従う。

### 1.2 問題点・課題

- merge 操作の根拠情報が server log と admin 記憶のみで、検索性が低い
- 監査調査時に「なぜこの merge が正しかったのか」を後追いで再現できない

### 1.3 放置した場合の影響

- ガバナンス上の説明責任が UI 上で果たせない
- merge 後に問合せが入った際の調査コストが高い

---

## 2. 何を達成するか（What）

### 2.1 目的

merge 操作時に optional の `manualMergeReason` テキスト（最大 500 文字程度）を記録できるようにし、後段の audit UI（FU-001）で表示できる土台を整える。

### 2.2 最終ゴール

- D1 migration で `member_identities` または専用テーブルに `manual_merge_reason` カラム追加
- merge endpoint が body で `reason` を受け取り、未指定時は null
- merge UI の confirm modal に optional textarea 追加
- 既存 contract spec / E2E が全 green

### 2.3 スコープ

#### 含むもの

- D1 migration ファイル新規作成（破壊的変更なし、null 許容）
- `apps/api/src/routes/admin/identity-conflicts.ts` merge endpoint body schema 拡張（任意フィールド）
- `apps/web/src/components/admin/IdentityConflictRow.tsx` confirm modal の textarea 追加
- contract spec / focused vitest 追加

#### 含まないもの

- audit UI 上の表示（FU-001 で扱う）
- dismiss 側の reason 拡張（既存テーブルにあるため対象外）
- Google Form schema 変更

### 2.4 成果物

- migration ファイル（D1）
- backend / frontend diff
- contract spec / focused vitest

---

## 3. どのように実行するか（How）

### 3.1 想定 surface

| パス | 役割 |
| --- | --- |
| `apps/api/migrations/00XX_identity_manual_merge_reason.sql` | D1 migration 新規 |
| `apps/api/src/routes/admin/identity-conflicts.ts` | merge endpoint body schema 拡張 |
| `apps/api/src/routes/admin/identity-conflicts.contract.spec.ts` | contract spec 追加 |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | confirm modal の optional textarea |
| `apps/web/src/components/admin/__tests__/` | focused vitest |

### 3.2 検証手順

1. migration 設計（カラム配置先 / null 許容 / index 要否）
2. zod schema 拡張（optional, max 500）
3. backend / frontend 実装 + spec
4. `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production` は user-gated
5. `bash scripts/verify-pr-ready.sh`

---

## 4. 受け入れ基準

### 機能要件

- [ ] merge endpoint が optional `reason` を受け取る
- [ ] 未指定時は従来挙動（null 保存）
- [ ] confirm modal で textarea が表示され、空欄でも merge 可能
- [ ] PII raw（responseEmail 等）が `reason` に紛れ込まない（hint テキスト or バリデーション）

### 品質要件

- [ ] D1 migration が破壊的変更を含まない（null 許容のみ）
- [ ] contract spec / focused vitest / Playwright 全 green
- [ ] FormField 経由（不変条件 #9）

### ドキュメント要件

- [ ] §6 苦戦箇所の追記
- [ ] migration ファイルに purpose コメント

---

## 5. CONST 制約

- 不変条件 #1: 既存 API のみ拡張（最小差分）
- 不変条件 #4: admin-managed データとして分離（Google Form schema 外）
- 不変条件 #5: D1 直接アクセスは `apps/api` に閉じる
- 不変条件 #9: FormField 経由
- Cloudflare CLI ルール: `scripts/cf.sh` 経由必須

---

## 6. 苦戦箇所・予測される困難 【必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | カラム配置先（`member_identities` 拡張 vs 専用 audit テーブル）の判断が遅延 |
| 原因 | merge は複数 row 統合のため、どの row に reason を持たせるかが自明でない |
| 対応 | 専用 `identity_merge_audit` テーブル新設を第一案、`member_identities.last_merge_reason` 拡張を第二案として spec 比較 |
| 再発防止 | 設計判断を spec §3 に残し、FU-001 との整合性を確認 |

| 項目 | 内容 |
| --- | --- |
| 症状 | reason に PII が混入する |
| 原因 | 自由記述のため email / 電話番号がそのまま貼られる可能性 |
| 対応 | 入力時に「PII を含めない」hint を表示、保存前に簡易 redaction（@含む文字列を警告）を実装 |
| 再発防止 | PII redaction grep gate に reason カラムを含める |

| 項目 | 内容 |
| --- | --- |
| 症状 | migration apply が staging / production で順序ずれ |
| 原因 | local apply のみで staging を飛ばし、production で失敗 |
| 対応 | staging apply → snapshot 確認 → production apply の 3 段順序を spec で固定 |
| 再発防止 | migration runbook を spec §3 に併記 |

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| migration の null 許容崩し | 高 | 低 | migration レビュー時に NOT NULL を強制しない |
| PII 混入 | 中 | 中 | hint + redaction + grep gate |
| audit UI (FU-001) と schema 形状不一致 | 中 | 中 | FU-001 設計と並行で確認 |

---

## 8. 関連リソース

- 親サイクル: `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/`
- 関連 FU: FU-001 (audit log admin UI 表示)
- API route: `apps/api/src/routes/admin/identity-conflicts.ts`
- D1 migrations: `apps/api/migrations/`
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/989

---

## 9. 備考

- 本タスクは schema 変更を含むため、FU-001 と独立 PR として進める前提。
- migration apply は production への影響があり、staging で 1 段確認してから本番投入。
