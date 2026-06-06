# Implementation Guide

## Part 1: 中学生にもわかる説明

### なぜこれが必要か

新しいお店を開いたら、本物のお客さんに来てもらう前に「ちゃんと動くか」を自分たちで確かめたくなります。
でも本物のお客さんの情報で練習すると、間違って消したり書き換えたりして大事故になります。
そこで、練習専用の「ダミーのお客さんカード」を10枚と「ダミーの店員証」を3枚、自分たちで用意します。
このカードには必ず `[TEST]` という大きな札を貼って、本物のカードと絶対に混ざらないようにします。
本物のお客さんの会員サイトでも同じで、ログインできる人・できない人、名簿に載る人・載らない人など、いろんなパターンを練習用に前もって作っておくのがこの作業です。

### 何をするか

まず、13枚のダミーカード（メンバー10 + 管理者3）の中身を1つの「台本（カタログ）」にまとめて書きます。
台本には「この人はログインできる」「この人は名簿に載る」といった設定を、一人ひとり書き込みます。
次に、その台本を読んで自動で「データを入れる命令書（seed）」「データを消す命令書（cleanup）」「名簿の早見表（manifest）」を作る機械（ジェネレータ）を用意します。
人間が一枚ずつ手書きすると間違えるので、台本さえ直せば命令書も自動で作り直される仕組みにします。
最後に、その命令書をローカル環境のデータベースに入れたり消したりするボタン（CLI）と、テストが好きなダミーカードでログインできる補助（mint）を用意します。

### テスト用と分かるようにする工夫

ダミーカードには3種類の「テスト用の印」を付けます。
1つ目は名前（ID）で、`TEST-MEM-01` のように先頭に `TEST-` を必ず付けます。
2つ目はメールアドレスで、`test-mem-01@test.ubm-hyogo.invalid` のように、世界中のどこにも届かない `.invalid` という決まったドメインを使います。だから間違えて本物のメールが飛ぶ心配がありません。
3つ目は「誰が作ったか」の記録欄で、すべて `seed:test-accounts` と書きます。後で片付けるとき、この印が付いた行だけを安全に消せます。

### 確認方法

台本から作り直した命令書が、今コミットしてある命令書と1文字も違わないか（drift していないか）を自動でチェックします。
さらに、メモリ上の仮データベースに命令書を流し込んで「ログインできる人が7人、できない人が3人、名簿に載る人が5人」という期待どおりかをテストで確かめます。
入れる→消す→入れる をくり返しても件数が変わらないこと（冪等）も確認します。
画面の見た目は変えないので、写真（スクリーンショット）ではなく自動テストで確認します。

## Part 2: 開発者向け技術詳細

### Scope

本サイクルでは「カタログ(SSOT) → 生成物(committed) → drift guard → 適用CLI → E2E mint」の一連を実装する。
編集・新規作成するファイルは `apps/api/src/testing/test-accounts/` 配下、`apps/api/migrations/seed/` 配下、`scripts/` 配下、`apps/web/playwright/scripts/` 配下に限定する。
新規 D1 テーブル / マイグレーション / API エンドポイントは追加しない（既存 schema・既存 surface のみ）。
D1 への物理投入・カタログ・ジェネレータ・drift spec はすべて apps/api / scripts に閉じ、apps/web/playwright は manifest JSON のみを読む（不変条件 #5 遵守）。
Google Form 実回答の取り込みと R2 写真バイナリの実アップロードは本サイクルのスコープ外（answers_json は stable_key 最小集合、member_photos はメタ行のみ）。

### データ構造

カタログの各エントリは TypeScript の interface で表現する。`TestMemberAccount` / `TestAdminAccount` の代表シグネチャは次のとおり（型は本 wave で確定する設計案）。

```ts
// apps/api/src/testing/test-accounts/catalog.ts
export interface TestMemberAccount {
  memberId: `TEST-MEM-${string}`;
  responseId: `TEST-RES-${string}`;
  email: `${string}@test.ubm-hyogo.invalid`;
  fullName: string;                 // 先頭に TEST を付与
  occupation: string;
  ubmZone: string | null;
  publicConsent: 'consented' | 'declined' | 'unknown';
  rulesConsent: 'consented' | 'declined' | 'unknown';
  publishState: 'public' | 'member_only' | 'hidden';
  isDeleted: boolean;
  notificationOptOut: boolean;
  tags: readonly string[];          // 既存 tag_definitions の tag_id を再利用
  attendance: readonly string[];
  photo?: { source: 'admin' | 'self'; processingStatus: 'none' | 'completed'; hasThumb: boolean };
}

export interface TestAdminAccount {
  adminId: `TEST-ADM-${string}`;
  email: `${string}@test.ubm-hyogo.invalid`;
  displayName: string;
  active: boolean;
}
```

ジェネレータが書き出す manifest JSON の形（`test-accounts.manifest.json`）は次のとおり。E2E mint はこの JSON のみを読む。

```json
{
  "generatedAt": "2026-06-03T10:30:00.000Z",
  "members": [
    { "memberId": "TEST-MEM-01", "email": "test-mem-01@test.ubm-hyogo.invalid", "fullName": "[TEST] 公開 ログイン 太郎", "loginable": true, "publicListed": true, "isDeleted": false, "storageStateName": "test-mem-01.storageState.json" }
  ],
  "admins": [
    { "adminId": "TEST-ADM-01", "email": "test-admin-01@test.ubm-hyogo.invalid", "displayName": "[TEST] 管理者 有効1", "active": true, "storageStateName": "test-adm-01.storageState.json" }
  ]
}
```

### 実装ステップ

1. **catalog**: `apps/api/src/testing/test-accounts/catalog.ts` に member 10 + admin 3 + meeting 3 + 規約定数を定義する。アカウント網羅マトリクス（index.md）の login/public/付帯データの組み合わせをそのまま反映する。
2. **build**: `apps/api/src/testing/test-accounts/build-seed-sql.ts` を純粋関数として実装し、catalog から `{ seedSql, cleanupSql, manifest }` を決定論的に生成する。`apps/api/src/testing/test-accounts/index.ts` で公開エクスポートする。
3. **gen script**: `scripts/gen-test-accounts-seed.mjs` が build を呼び、3 生成物を書き出す。`--check` フラグ時は書き出さず committed 版との byte 一致を検証して差分があれば exit 1。
4. **committed 生成物**: `apps/api/migrations/seed/test-accounts-seed.sql`（冪等 seed）/ `test-accounts-cleanup.sql`（冪等 cleanup）/ `test-accounts.manifest.json` をコミット対象として書き出す。
5. **drift spec**: `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts` で build 出力と committed 生成物の byte 一致を検証し、in-memory D1（setupD1）へ seed 適用後にゲーティング期待値（ログイン可 7 / 不可 3、公開掲載 5）と seed→cleanup→seed の冪等性を検証する。catalog 不変条件は `__tests__/catalog.spec.ts`、生成 SQL 構造 / manifest は `__tests__/build-seed-sql.spec.ts` で検証する。
6. **CLI**: `scripts/seed-test-accounts.sh` で local/staging の D1 に適用・撤去する。`--env production` は構造的に拒否する（不変条件 #6）。
7. **mint**: `apps/web/playwright/scripts/mint-test-account-storage-state.ts` が manifest を読み、`signSessionJwt`（`packages/shared/src/auth.ts`）で任意テストアカウントの storage-state を mint する。出力（cookie/token）は stdout/log に出さず `.gitignore` 配下へ書き出す。

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- node --import tsx scripts/gen-test-accounts-seed.mjs --check
mise exec -- pnpm exec vitest run apps/api/src/testing/test-accounts --config=vitest.config.ts && pnpm exec vitest run apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts --config=vitest.d1.config.ts
bash scripts/verify-pr-ready.sh
```

### 既知制限

写真は member_photos のメタデータ行のみ投入し、R2 へのバイナリ実体はアップロードしない（manifest にプレースホルダ `object_key` を記録するのみ・R2 実体は描画 e2e の別タスク）。
staging D1 への実投入と、E2E mint の `STAGING_*` 認証シークレット配線は user-gated（local は本サイクルで完結、staging 実投入はユーザー承認後）。
新規 D1 schema / migration / API endpoint は追加しない。既存 `tag_definitions`（`0004_seed_tags.sql`）を再利用して assign し、tag master を汚染しない。
本サイクルは implemented_local_evidence_captured であり、実コード差分・vitest 実行は完了済み。commit・PR は user-gated。

### 設定可能パラメータ

| パラメータ | 既定値 | 用途 |
| --- | --- | --- |
| `TEST_ACCOUNT_PREFIX` | `"TEST-"` | member_id / admin_id / response_id / session_id の判別 prefix |
| `TEST_EMAIL_DOMAIN` | `"test.ubm-hyogo.invalid"` | RFC 2606 予約 TLD。実在せず配信不能で事故防止 |
| `TEST_SEED_ACTOR` | `"seed:test-accounts"` | created_by / updated_by / assigned_by / uploaded_by の actor 値。cleanup 対象限定に使用 |
| `TTL` | `600`（秒） | mint storage-state JWT の有効期限（10 分） |
