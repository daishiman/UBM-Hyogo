# Phase 12 — implementation-guide

**[実装区分: 実装 / 状態: implemented_local_evidence_captured]**

本ガイドは 2 部構成。Part 1 は中学生でも分かる言葉で「何をするのか」を説明し、Part 2 は開発者向けに型・シグネチャ・ファイルパス・検証コマンドを示す。

---

## Part 1 — やさしい説明（専門用語なし）

### 背景

会員サイトには「会員の登録一覧」があります。ときどき、**同じ人が間違えて 2 回登録してしまう**ことがあります。たとえば、メールアドレスを変えてもう一度フォームを出してしまったときなどです。すると、名簿に同じ人が 2 人いるように見えてしまいます。

この画面は、その「**同じ人かもしれない 2 件**」を自動で見つけて、係の人に教えてくれる係さんのようなものです。

### 要約（たとえ話）

学校で「出席名簿に同じ名前が 2 回書いてあるかも」と気づいたら、先生に知らせる係を想像してください。

- 係さん（このシステム）は、**名前と仕事が同じ登録が 2 つ**あったら「同じ人かも？」と教えてくれます。
- 係さんが見つけたら、最後に決めるのは**人間**です。
  - 「同じ人だから 1 つにまとめる」＝ **統合**（まとめても、書いた内容は消えません。つながりが分かるようになるだけ）。
  - 「よく見たら別の人だった」＝ **別人として確定**（これからはこの組み合わせを『同じ人かも』と出さないようにします）。

ところが今までは、この係さんの言葉が英語まじりの難しい言葉（merge / source / target など）で、係の人が「これ、何のボタン？」と困っていました。そこで**全部やさしい日本語に直し**、「このページで何ができるか」を最初に 3 行で説明する案内も付けます。

さらに、本物のデータには今のところ「同じ人かも」が 1 件もないので、係の人が**練習できません**。そこで、練習用の「同じ人かも」を **5 組（5 パターン）だけ** お試し環境に入れられる仕組みも作ります。練習が終わったら、お試しデータはきれいに片付けられます（本番には絶対に入りません）。

### 実装ステップ（やさしい順番）

1. 左メニューの名前を分かりやすく直す（「開催日」→「開催・出席管理」、「Identity重複」→「会員の重複確認」）。
2. 画面の英語の言葉を全部やさしい日本語にする。
3. 画面の一番上に「このページでできること」を 3 行で説明する案内を足す。
4. 練習用の「同じ人かも」5 組を、お試し環境に入れたり片付けたりできる仕組みを作る。

### 検証コマンド（やさしい説明）

- 「言葉がちゃんと日本語になっているか」を自動でチェックするテストを走らせます。
- 「練習データがちょうど 5 組できるか」を自動でチェックします。
- 色のルール（決められた色だけ使う）を守っているかチェックします。

### 既知の制限（やさしい説明）

- いまは「名前と仕事が同じ」ときだけ「同じ人かも」と教えます。電話番号や住所での照合は、今回はやりません（別の宿題）。
- 「開催・出席管理」のページの中身そのものは今回は直しません（メニューの名前だけ）。

---

## Part 2 — 開発者向け

### 背景

`/admin/identity-conflicts`（`apps/web/app/(admin)/admin/identity-conflicts/page.tsx`）は、`apps/api/src/services/admin/identity-conflict-detector.ts` の `detectConflictCandidates`（`norm(fullName) + norm(occupation)` の NFKC 完全一致・別 member_id）で検出された候補を表示する。現状 UI は英語・技術用語（merge/source/target/email/matched/name/affiliation/canonical/PII/redaction）を露出し、非エンジニア管理者には機能が伝わらない。また実データに重複が無く操作を体験できない。

### 要約

UI 表現層のみで日本語化（API/型/D1 不変・adapter 層で吸収）し、専用 staging seed で 5 組の重複候補を demonstrate する。`matchedFields` の API 値 `"name"|"affiliation"` は glossary 経由で `氏名`/`職業` にマップする。

### 実装ステップ（concern 別・型/シグネチャ/パス）

#### concern 1 — サイドバー（`apps/web/src/components/shell/shell-config.ts`）

- L86 `meeting` の `label`: `開催日` → `開催・出席管理`。
- L91 `identity` の `label`: `Identity重複` → `会員の重複確認`。
- `id` / `href` / `icon` 不変（route / active 判定 / テスト互換）。
- test: `apps/web/src/components/shell/__tests__/shell-config.spec.ts` のラベルアサート更新。

#### concern 2/3 — ページ・行・アナウンス（[shared-context §5](../../shared-context.md)）

- `apps/web/app/(admin)/admin/identity-conflicts/page.tsx`: eyebrow/title/description/empty/card/breadcrumb/aria-label を §5.2 の日本語へ。ページ冒頭に `IdentityConflictGuide` を差込。
- `apps/web/src/components/admin/IdentityConflictRow.tsx`: §5.3 の文言置換。`matchedFields` を `matchedFieldLabel(field)` 経由で日本語 badge 化。内部 conflictId は一覧から退避（`title`/aria 補助または `<details>`）。
- `apps/web/src/components/admin/identityConflictAnnouncements.ts`: §5.6 の aria-live 文言更新（機能維持）。

#### 新規 helper（型/シグネチャ）

- `apps/web/src/features/admin/identity-conflicts/identityConflictGlossary.ts`:
  ```ts
  export const MATCHED_FIELD_LABELS: Record<string, string> = { name: "氏名", affiliation: "職業" };
  export const matchedFieldLabel = (field: string): string => MATCHED_FIELD_LABELS[field] ?? field; // throw しない・未登録は原文 fallback
  ```
- `apps/web/src/components/admin/IdentityConflictGuide.tsx`: ページ冒頭に 3 点の平易説明を描画する presentational component（既存 primitive のみ・新規 primitive を生やさない・色は `var(--ubm-color-*)`）。

#### concern 4 — 専用 staging seed（NON_VISUAL・[shared-context §6](../../shared-context.md)）

- `apps/api/src/testing/identity-conflicts/catalog.ts`: 重複ペア 5 組（TEST-MEM-21..30）の SSOT。
- `apps/api/src/testing/identity-conflicts/build-seed-sql.ts`: catalog → seed/cleanup SQL の pure builder。想定公開関数 `buildIdentityConflictSeedSql(catalog): { seedSql: string; cleanupSql: string }`（pure・throw しない）。
- `scripts/gen-identity-conflict-seed.mjs`: builder を呼び `apps/api/migrations/seed/identity-conflict-staging-seed.sql` / `identity-conflict-cleanup.sql` を出力。
- `scripts/seed-identity-conflicts.sh`: local/staging 限定の適用ラッパー（`seed-test-accounts.sh` 同型・production ガード）。
- `apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts`: 生成物 drift 0 / idempotent（INSERT OR REPLACE）/ 行数 contract。
- 採番: member_id `TEST-MEM-21..30` / response_id `TEST-RES-21..30` / email `test-dup-21..30@test.ubm-hyogo.invalid` / actor `seed:identity-conflicts`。期待候補数 = ちょうど 5。

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/shell-config.spec.ts \
  apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx \
  apps/web/src/components/admin/__tests__/IdentityConflictGuide.spec.tsx \
  apps/web/src/features/admin/identity-conflicts/__tests__/identityConflictGlossary.spec.ts
node scripts/gen-identity-conflict-seed.mjs
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/migrations/seed/__tests__/identity-conflict-seed.contract.spec.ts
```

### 既知制限

- 検出は「氏名 AND 職業」の NFKC 完全一致のみ。電話・住所の第二段階検出は API/D1 変更を伴うため別タスク（baseline）。
- `/admin/meetings` ページ本体 UX はスコープ外（サイドバー命名のみ）。
- 3 件以上の一括統合 UI は現行 2 件ずつで未対応（baseline）。

## 視覚証跡

VISUAL だが **implemented_local_evidence_captured のため screenshot は pending_implementation**。撮影 canonical 名は [phase11-capture-metadata.json](../phase-11/phase11-capture-metadata.json) を参照（`sidebar-meetings-label-renamed.png` / `identity-conflicts-empty-jp.png` / `identity-conflicts-list-jp.png` / `identity-conflicts-merge-confirm-jp.png` / `identity-conflicts-dismiss-jp.png`）。撮影はコード landed 後の local/staging build 上で実施可能だが、staging seed apply / authenticated runtime capture を伴うため user-gated（Phase 13）。
