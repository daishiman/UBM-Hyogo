# 実装ガイド — 監査ログ 日本語化 + フィルタ段階開示 + カード整列

> ステータス: `completed`。本ワークフローは `implemented_local_evidence_captured`。Part 1（中学生レベル）+ Part 2（開発者レベル）+ 視覚証跡で構成する。6 canonical PNG は staging authenticated capture として user-gated。

---

## Part 1 — 中学生レベルの説明（専門用語なし・例え話）

### なぜ必要か

「監査ログ」という管理者向けの画面があります。これは図書館でいう「貸出記録ノート」のようなもので、「いつ・誰が・どの本を借りたか／返したか」を全部書き残しておくページです。サイトでも同じように「いつ・誰が・どんな操作をしたか」を記録しています。

ところが今のこの画面は、記録ノートの見出しや項目名が **英語の暗号のような言葉**（`action`、`actorEmail`、`targetType`、`admin.member.status_updated` など）のまま書いてあります。図書館の貸出記録が全部アルファベットの記号で書いてあったら、司書さん以外には何のことか分かりませんよね。実際、エンジニアでない管理者からは「英語ばかりで何を見ればいいか分からない」という声が出ました。これが直したい問題です。

### 何をするか

記録する内容（中身のデータ）は一切減らしません。**言葉の見せ方と、絞り込みボタンの並べ方だけ**を変えて、誰でも読めるようにします。

1. **言葉を日本語にする**: `action` を「操作の種類」、`admin.member.status_updated` を「会員ステータスを更新」のように、英語の暗号を日本語のやさしい言葉に置き換えます。万が一まだ日本語訳が用意されていない操作が出てきたら、情報が消えないように元の英語をそのまま出します（穴あきにしない安全装置）。
2. **絞り込みを 2 段にする**: よく使う絞り込み（操作の種類・実行者・期間・表示件数）だけを最初から見えるようにして、めったに使わない絞り込み（対象の種類・対象ID・一括処理ID）は「詳細な絞り込み」という**引き出し**にしまいます。引き出しは普段は閉じていて、必要なときだけ開けます。すでにその引き出しの中の条件を使っているときは、最初から開いた状態で見せます（使っている条件を隠さない）。
3. **カードの並びをそろえる**: 絞り込み条件の小さな札（チップ）がはみ出して改行で崩れないように、きれいに折り返して並べます。説明カードの枠もそろえて見やすくします。

これで、図書館の貸出記録ノートが「日本語で・大事な見出しが前に・整理整頓された状態」になり、誰でもぱっと読めるようになります。

### 変えない約束

- データを取ってくる仕組み（サーバ側 / API）は **一切変えません**。見せ方の言葉だけ日本語にします。絞り込みボタンの裏側で使う合言葉（`action` などの英語の名前）はサーバとの約束ごとなので、そのまま英語で残します。
- 色は決められた「色のパレット」からだけ使います（自分で勝手な色コードを書きません）。
- もともと出来ていたこと（検索・リセット・ページめくり・個人情報の伏せ字・詳細の中身表示・親切なエラー文）は全部そのまま動きます。

---

## Part 2 — 開発者レベルの説明

### 概要

`/admin/audit` の表現層（`apps/web/src/components/admin/` + `apps/web/src/styles/globals.css`）のみを再構成する。データ取得（`safeServerFetch` 経由の `GET /admin/audit`）・shared 型・API・D1・Google Form schema は不変（AC-9）。英語キー名の UI 露出を用語集 SSOT による日本語ラベルへ平易化し、8 項目フラットのフィルタを「常時 5 項目 + `<details>` 詳細 3 項目」へ段階開示し、`.chip-row` / glossary グリッド / card meta グリッドを整列する。`<input name>`（= query param キー）は英語のまま維持して API 契約を守る。

### 変更ファイル一覧（6 実装ファイル）

| 区分 | パス | 内容 |
| --- | --- | --- |
| 編集 | `apps/web/src/components/admin/auditGlossary.ts` | `AUDIT_ACTION_LABELS` / `AUDIT_TARGET_TYPE_LABELS` / `AUDIT_FIELD_LABELS` + `describeAuditAction` / `describeAuditTargetType` / `describeAuditField` 追加（C1） |
| 編集 | `apps/web/src/components/admin/AuditLogPanel.tsx` | フォームラベル日本語化 + 2 層段階開示（`<details className="admin-audit-filter-advanced">`）+ datalist placeholder 日本語化（C1/C2） |
| 編集 | `apps/web/src/components/admin/AuditLogCard.tsx` | action / targetType 日本語表示 + `auditId` ラベル日本語化（C1/C3） |
| 編集 | `apps/web/src/components/admin/auditAppliedFilters.ts` | チップ label / value を describe helper 経由で日本語化（C1） |
| 編集 | `apps/web/src/components/admin/AuditPurposeGuide.tsx` | 用語集グリッド整列に伴う軽微調整（C3・必要時のみ） |
| 編集 | `apps/web/src/styles/globals.css` | `.chip-row` wrap / `.admin-audit-glossary` / `.admin-audit-card__meta` 整列 + `.admin-audit-filter-advanced`（details）追加（C3） |
| 新規（test） | `apps/web/src/components/admin/__tests__/auditGlossary.spec.ts` 等 | describe helper / ラベルマップ / raw fallback / 日本語ラベル / details 段階開示 |
| **変更なし** | `apps/api/**` / `packages/shared/**` | AC-9（diff 0 件・query param キー不変） |

### glossary SSOT：TypeScript シグネチャ（feature ローカル → AC-6 / AC-10 充足）

`auditGlossary.ts` に以下のラベルマップ型と 3 つの describe helper を追加する。helper は throw せず、未登録時に raw fallback を返して情報欠落を防ぐ。

```ts
// 操作コード → 日本語ラベル（生コード非表示の正本）
export const AUDIT_ACTION_LABELS: Readonly<Record<string, string>> = {
  "attendance.add": "出席を追加",
  "admin.member.status_updated": "会員ステータスを更新",
  // ... SSOT §4 C1 の全エントリ
};
// 対象種別 → 日本語ラベル
export const AUDIT_TARGET_TYPE_LABELS: Readonly<Record<string, string>> = {
  meeting: "開催日",
  member: "会員",
  admin_member_note: "管理メモ",
  tag: "タグ",
};
// フィールド（query param キー） → 表示ラベル
export const AUDIT_FIELD_LABELS: Readonly<Record<string, string>> = {
  action: "操作の種類",
  actorEmail: "実行者（メール）",
  targetType: "対象の種類",
  targetId: "対象ID",
  from: "期間（開始）",
  to: "期間（終了）",
  batchId: "一括処理ID",
  limit: "表示件数",
};

// helper: 登録あれば日本語、未登録は raw fallback（情報欠落防止）
export const describeAuditAction = (code: string): string =>
  AUDIT_ACTION_LABELS[code] ?? code;
export const describeAuditTargetType = (code: string | null): string =>
  code == null ? "—" : (AUDIT_TARGET_TYPE_LABELS[code] ?? code);
export const describeAuditField = (key: string): string =>
  AUDIT_FIELD_LABELS[key] ?? key;
```

`AuditLogPanel.tsx` は各 `FormField` の `label` を `describeAuditField(key)` 経由で表示し、`<input name>` には query param キー（英語）を渡す。`AuditLogCard.tsx` は `describeAuditAction(item.action)` / `describeAuditTargetType(item.targetType)` で表示し、`auditId` ラベルは「ログID」へ。`auditAppliedFilters.ts` のチップは `describeAuditField` / `describeAuditAction` / `describeAuditTargetType` を通して日本語化する。

### globals.css 追加 / 調整クラス

色は全て `var(--ubm-color-*)` 経由。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止（AC-8）。新規 token は追加しない。配置は `@layer components` 末尾。

| クラス | 役割 | 主トークン |
| --- | --- | --- |
| `.chip-row` | 適用フィルタチップ行を `display:flex; flex-wrap:wrap; gap:var(--ubm-space-2)` で整列 | `--ubm-space-2` |
| `.admin-audit-glossary` | 用語集グリッドの `minmax(170px,1fr)` を整列が破綻しない値へ調整・行高さ揃え | `--ubm-space-*` |
| `.admin-audit-card__meta` | カード meta グリッドを truncate 安全な構成へ | `--ubm-space-*` |
| `.admin-audit-filter-advanced` | フィルタ 2 層用 `<details>` のスタイル（summary / 展開時 grid） | `--ubm-space-*` / `--ubm-radius-*` |

### テスト

| テスト | 観点 | AC |
| --- | --- | --- |
| `auditGlossary.spec.ts`（新規） | 3 ラベルマップ / 3 describe helper / 未登録 raw fallback（action は raw、targetType=null は「—」） | AC-6 / AC-3 |
| `auditAppliedFilters.spec.ts`（新規/追従） | チップ label / value 日本語化・英語キー名露出ゼロ | AC-4 |
| `AuditLogPanel.component.spec.tsx`（新規/追従） | 日本語ラベル表示・details 段階開示（詳細フィルタ値ありで `open`）・`<input name>` 英語維持 | AC-1 / AC-2 / AC-9 |
| `AuditLogCard.spec.tsx`（新規/追従） | action / targetType 日本語表示・未登録 raw fallback・auditId ラベル日本語 | AC-3 / AC-5 |

### 検証コマンド（_shared-context §9）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens                       # HEX/arbitrary color 0 件
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/auditGlossary.spec.ts \
  apps/web/src/components/admin/__tests__/auditAppliedFilters.spec.ts \
  apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx \
  apps/web/src/components/admin/__tests__/AuditLogCard.spec.tsx
git diff --name-only -- apps/api packages/shared      # 空であること（AC-9）
pnpm verify:phase12-compliance docs/30-workflows/completed-tasks/admin-audit-log-japanese-clarity-and-filter-collapse
node --import tsx scripts/gate-metadata/validate.ts
```

### エッジケース

| ケース | 期待挙動 |
| --- | --- |
| 未登録 action コード | `describeAuditAction` が raw コードを返す（throw しない・情報欠落防止）。出現時は Phase 12 baseline（OOS-4）として SSOT 追記候補に記録 |
| `targetType=null` | `describeAuditTargetType(null)` が「—」を返す（カード meta が崩れない） |
| query param キー | `<input name>` は英語維持。UI ラベルのみ日本語化（AC-9・API 契約） |
| 詳細フィルタに値あり | `<details>` が `open` 既定で展開され、適用中の高度条件を隠さない |
| 詳細フィルタ値なし | `<details>` は閉じた状態で初見負荷を下げる |
| 適用チップ多数 | `.chip-row` の `flex-wrap` で折り返し、はみ出さない |
| mobile 幅 | フォーム2層・カード・チップが 1 カラムで成立（AC-7） |

---

## 視覚証跡（Phase 11 screenshot canonical 名）

VISUAL タスクのため、下記 6 canonical screenshot を `outputs/phase-11/screenshots/` に取得する（`outputs/phase-11/screenshot-plan.json` と一致）。現時点では PNG 実体は未取得（staging capture user-gated）。

| # | canonical 名 | 検証 AC |
| --- | --- | --- |
| ① | `audit-page-full.png` | AC-1 / AC-4 / AC-7 |
| ② | `audit-filter-collapsed.png` | AC-1 / AC-2（詳細な絞り込みが閉じた初期状態） |
| ③ | `audit-filter-expanded.png` | AC-2（詳細な絞り込みを展開） |
| ④ | `audit-timeline-cards-ja.png` | AC-3 / AC-5 / AC-7 |
| ⑤ | `audit-applied-filters-chips.png` | AC-4 / AC-7 |
| ⑥ | `audit-page-mobile.png` | AC-7 |

> 実 capture は staging 認証済み admin 画面で取得（user-gated）。capture script は `try { } finally { browser.close(); server.close(); }` を厳守（FB-MSO-003）。
