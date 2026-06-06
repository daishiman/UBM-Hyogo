# test-accounts-seed-spec

[実装区分: 実装仕様書]

> ユーザー依頼（2026-06-03）: 「メンバーと管理者にテストアカウントを作成。メンバー10アカウント、管理者3アカウントを作成し、様々なパターンで網羅的にテストできるものに対応する。テスト用とわかるようにしておく。コードで作成する。」
> 本仕様書はこの依頼を **コード（seed 生成）で確実に実装するための実装仕様書** として作成し、automation-30 改善サイクルで実コード・生成物・focused tests まで同一 wave で実装した。commit / push / PR / 実 D1 への seed 適用のみ user-gated とする。

---

## メタ情報

| 項目 | 値 |
|------|-----|
| Task ID | TASK-TEST-ACCOUNTS-SEED-001 |
| Feature 名 | test-accounts-seed |
| Task type | implementation |
| implementation_mode | new |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_local_evidence_captured |
| canonical_root | docs/30-workflows/test-accounts-seed-spec |
| 対象パッケージ | apps/api（正本）, scripts（適用CLI）, apps/web/playwright（E2Eログイン補助） |
| D1 直接アクセス | apps/api に閉じる（不変条件 #5 遵守。apps/web から D1 binding 禁止） |

---

## 真の論点（要件レビュー一次結論）

1. **真の論点**: 「テストアカウントを作る」ことではなく、**会員/管理者ドメインの状態空間（ログイン可否ゲート × 公開ディレクトリ可視性 × 付帯データ）を網羅した、テスト用と一目で判別でき、冪等に投入/撤去できる seed 基盤を、単一の正本(SSOT)から決定論的に生成すること**。
2. **依存関係・責務境界**: アカウントの「定義（SSOT カタログ）」と「物理投入（seed SQL 適用）」と「E2E ログイン（JWT mint）」を分離する。SSOT は 1 つ、生成物（SQL/cleanup/manifest）は SSOT から決定論的に派生し、drift guard で同期を保証する。D1 投入は apps/api ドメインに閉じる。
3. **価値とコストの不均衡**: 最大の価値は「網羅パターンの SSOT 化」。最大コストは「member は identities/responses/status/tags/attendance/photo の複数テーブルにまたがる」点。→ ハンドメイド SQL ではなく **カタログ→SQL ジェネレータ + drift guard** で重複コストを排除する。
4. **改善優先順位**: (1) SSOT カタログ + ジェネレータ → (2) 冪等 seed/cleanup SQL（committed 生成物） + drift guard spec → (3) 適用 CLI（local/staging、production 禁止） → (4) E2E ログイン補助（manifest 経由・疎結合）。
5. **4条件評価**: 価値性=テスト網羅の土台を1コマンドで用意 / 実現性=既存 seed パターン(issue-399)・既存 signSessionJwt・既存 setupD1 を再利用し新規 API ゼロ / 整合性=SSOT→派生で drift 構造排除・D1 境界遵守 / 運用性=`TEST-` prefix + `.invalid` ドメイン + `seed:test-accounts` actor で cleanup が安全に対象限定。

---

## スコープ

### 含む（今回サイクル 1 で完了させる）

- 10 メンバー + 3 管理者の **テストアカウント SSOT カタログ**（TypeScript）。
- カタログから **冪等 seed SQL / cleanup SQL / manifest JSON** を生成する純粋ジェネレータ。
- 生成物（committed）と **drift guard spec**（再生成して byte 一致を検証）。
- seed を **ローカル D1 / staging D1** に適用・撤去する CLI（production は禁止）。
- E2E が任意のテストアカウントとして認証できる **storage-state mint 補助**（manifest 経由・apps/web/playwright）。
- カタログ不変条件・ゲーティング期待値・冪等性を検証する **vitest spec（`*.spec.ts`）**。

### 含まない（理由付き・先送りではない明示的除外）

- **commit・PR・staging/production への実投入**（CONST_002 / CONST_006。実コードは本 wave で実装済み。production seed apply は CLI が拒否する）。
- **Google Form 実回答の取り込み**（テストアカウントは form sync を経由せず D1 へ直接 seed する。実フォーム schema をコードに固定しない不変条件 #1 を尊重し、answers_json は stable_key の最小集合のみ使用）。
- **R2 への写真バイナリ実アップロード**（member_photos はメタデータ行のみ投入。バイナリ実体は別関心。理由: seed は D1 行の網羅が目的であり、R2 実体は描画 e2e の別タスクで扱う。manifest にプレースホルダ object_key を記録）。
- **新規 D1 テーブル / マイグレーション / API エンドポイントの追加**（既存 schema・既存 surface のみ利用。不変条件 #5・UI prototype alignment 不変条件 #1 を遵守）。

> CONST_007 確認: 上記「含まない」はいずれも **今回サイクルで完了させると整合性的に破綻する／本質的に別関心** の項目のみ。分量・複雑さを理由とした先送りは含まない。全「含む」項目は実装プロンプト 1 サイクルで完了可能なスコープに収めている。

---

## アーキテクチャ（責務分離）

```
                ┌──────────────────────────────────────────────┐
                │ SSOT: apps/api/src/testing/test-accounts/     │
                │   catalog.ts  ← 10 member + 3 admin の全属性  │
                └───────────────┬──────────────────────────────┘
                                │ (pure)
                ┌───────────────▼──────────────────────────────┐
                │ build-seed-sql.ts  → { seedSql, cleanupSql,   │
                │                        manifest }             │
                └───────┬───────────────────────┬──────────────┘
        (committed 生成物)│                       │(drift guard spec が再生成して byte 一致検証)
        ┌────────────────▼─────────┐   ┌─────────▼──────────────────────────┐
        │ migrations/seed/          │   │ apps/api/.../__tests__/*.spec.ts    │
        │  test-accounts-seed.sql   │   │  catalog 不変条件 / ゲーティング期待 │
        │  test-accounts-cleanup.sql│   │  / build 出力 drift / in-memory D1  │
        │  test-accounts.manifest.json│ └─────────────────────────────────────┘
        └────────┬──────────────────┘
   ┌─────────────▼────────────┐         ┌──────────────────────────────────────┐
   │ scripts/seed-test-        │         │ apps/web/playwright/scripts/           │
   │   accounts.sh (local/     │         │  mint-test-account-storage-state.ts    │
   │   staging 適用・撤去)     │         │  (manifest を読み JWT mint・E2E ログイン)│
   └───────────────────────────┘         └──────────────────────────────────────┘
```

- **D1 境界**: seed の物理投入・カタログ・ジェネレータ・drift spec はすべて apps/api / scripts に閉じる。apps/web/playwright は **manifest JSON（id/email/role/loginable）のみ** を読み、D1 には触れない（不変条件 #5 遵守）。

---

## テスト用判別規約（「テスト用とわかるように」への回答）

| 軸 | 規約 | 目的 |
|----|------|------|
| member_id | `TEST-MEM-01` 〜 `TEST-MEM-10` | prefix `TEST-` で一意に判別 |
| admin_id | `TEST-ADM-01` 〜 `TEST-ADM-03` | 同上 |
| response_id | `TEST-RES-01` 〜 | 同上 |
| meeting session_id | `TEST-MTG-01` 〜 `TEST-MTG-03` | 同上 |
| email | `test-mem-01@test.ubm-hyogo.invalid` / `test-adm-01@test.ubm-hyogo.invalid` | RFC 2606 予約 TLD `.invalid` で **実在せず配信不能**＝事故防止 + 判別 |
| actor 列 | `created_by` / `updated_by` / `assigned_by` / `uploaded_by` / `updated_by` = `seed:test-accounts` | seed 由来を明示し cleanup の対象限定に使う |
| 表示名 | answers_json `fullName` 等の先頭に `[TEST]` を付与 | 画面上でも一目でテスト用と判別 |

- **cleanup の対象限定**: `member_id LIKE 'TEST-%'` / `note_id LIKE 'TEST-%'` / `session_id LIKE 'TEST-%'` / `email LIKE '%@test.ubm-hyogo.invalid'` / `updated_by = 'seed:test-accounts'` のいずれかにマッチする行のみを削除する（実会員データを誤削除しない）。

---

## アカウント網羅マトリクス（SSOT の中身）

### メンバー 10 件（ログイン可否ゲート × 公開可視性 × 付帯データを網羅）

| key | login可 | public_consent | rules_consent | publish_state | is_deleted | 付帯データ | 検証意図 |
|-----|--------|----------------|---------------|---------------|-----------|-----------|----------|
| TEST-MEM-01 | ✅ | consented | consented | public | 0 | photo(admin), tags(business+skill+region), attendance×2, opt_in | 完全公開・理想会員 |
| TEST-MEM-02 | ✅ | declined | consented | member_only | 0 | tags(business), attendance×1 | ログイン可だが公開ディレクトリ非掲載（public_consent declined） |
| TEST-MEM-03 | ✅ | consented | consented | hidden | 0 | photo(admin), tags(skill) | 管理者により hidden（公開同意済でも非掲載） |
| TEST-MEM-04 | ❌ | unknown | declined | member_only | 0 | minimal | ログインゲート: rules_declined |
| TEST-MEM-05 | ❌ | consented | consented | public | 1 | deleted_members 行, hidden_reason | ログインゲート: deleted（公開ゲートも除外） |
| TEST-MEM-06 | ✅ | consented | consented | public | 0 | なし（tags/photo/attendance 0） | 最小データの公開会員（空状態の描画） |
| TEST-MEM-07 | ✅ | consented | consented | public | 0 | tags(全6カテゴリ), attendance×3, notification_opt_out=1 | タグ多数・通知オプトアウト |
| TEST-MEM-08 | ❌ | unknown | unknown | member_only | 0 | minimal | 新規未同意（rules_consent unknown ≠ consented でログイン不可） |
| TEST-MEM-09 | ✅ | consented | consented | public | 0 | photo(self, thumb+processing completed), attendance×2 | 本人アップロード写真（source=self） |
| TEST-MEM-10 | ✅ | consented | consented | public | 0 | 長い日本語名・絵文字/特殊文字・全URL系キー・tags・photo | エッジ描画（長文・特殊文字・全フィールド埋め） |

- **ログイン可 7 件**: 01,02,03,06,07,09,10 ／ **ログイン不可 3 件**: 04(rules_declined), 05(deleted), 08(unknown)。
- **公開ディレクトリ掲載 5 件**（public_consent=consented ∧ publish_state=public ∧ is_deleted=0）: 01,06,07,09,10。
- **member_only 3 件**: 02,04,08 ／ **hidden 1 件**: 03 ／ **deleted 1 件**: 05。

### 管理者 3 件（active 状態を網羅）

| key | active | 用途 |
|-----|--------|------|
| TEST-ADM-01 | 1 | 主管理者（全 admin 画面の正常系） |
| TEST-ADM-02 | 1 | 副管理者（複数 admin・actor 区別） |
| TEST-ADM-03 | 0 | 無効化済み管理者（admin 剥奪 / 403 forbidden 経路） |

### 会議 3 件（出席の参照先）

| session_id | title | held_on |
|------------|-------|---------|
| TEST-MTG-01 | [TEST] 2026年度 第1回 定例会 | 2026-04-12 |
| TEST-MTG-02 | [TEST] 2026年度 第2回 定例会 | 2026-05-10 |
| TEST-MTG-03 | [TEST] 2026年度 第3回 定例会 | 2026-06-14 |

### タグ

- 既存 `tag_definitions`（`0004_seed_tags.sql` で投入済の `tag_b_food` 等 41 件）を **再利用して assign する**。新規タグ定義は作らない（tag master 汚染防止）。

---

## 変更対象ファイル一覧（CONST_005）

| パス | 種別 | 役割 |
|------|------|------|
| `apps/api/src/testing/test-accounts/catalog.ts` | 新規 | SSOT カタログ（10 member + 3 admin + 3 meeting + 規約定数） |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | 新規 | カタログ→{seedSql, cleanupSql, manifest} の純粋ジェネレータ |
| `apps/api/src/testing/test-accounts/index.ts` | 新規 | 公開エクスポート |
| `apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts` | 新規 | カタログ不変条件検証 |
| `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | 新規 | 生成 SQL 構造 / manifest 検証 |
| `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts` | 新規 | committed 生成物 drift guard + in-memory D1 投入後のゲーティング期待値検証 |
| `apps/api/migrations/seed/test-accounts-seed.sql` | 新規(生成物) | 冪等 seed SQL |
| `apps/api/migrations/seed/test-accounts-cleanup.sql` | 新規(生成物) | 冪等 cleanup SQL |
| `apps/api/migrations/seed/test-accounts.manifest.json` | 新規(生成物) | id/email/role/loginable/public の manifest |
| `scripts/seed-test-accounts.sh` | 新規 | local/staging 適用・撤去 CLI（production 禁止） |
| `scripts/gen-test-accounts-seed.mjs` | 新規 | カタログ→生成物の書き出し（drift guard が参照する正規再生成経路） |
| `apps/web/playwright/scripts/mint-test-account-storage-state.ts` | 新規 | manifest を読み JWT mint（任意テストアカウントで E2E ログイン） |
| `apps/api/package.json` | 編集 | scripts に `seed:test-accounts` / `seed:test-accounts:gen` 追加 |
| `package.json`（root） | 編集 | ルートからの `seed:test-accounts` パススルー追加 |

---

## Phase 構成

| Phase | 名称 | 状態 | 出力先 |
|-------|------|------|--------|
| 1 | 要件定義 | completed | outputs/phase-1/phase-1.md |
| 2 | 設計 | completed | outputs/phase-2/phase-2.md |
| 3 | 設計レビュー | completed | outputs/phase-3/phase-3.md |
| 4 | テスト作成 | completed | outputs/phase-4/phase-4.md |
| 5 | 実装 | completed | outputs/phase-5/phase-5.md |
| 6 | テスト拡充 | completed | outputs/phase-6/phase-6.md |
| 7 | カバレッジ確認 | completed | outputs/phase-7/phase-7.md |
| 8 | リファクタリング | completed | outputs/phase-8/phase-8.md |
| 9 | 品質保証 | completed | outputs/phase-9/phase-9.md |
| 10 | 最終レビュー | completed | outputs/phase-10/phase-10.md |
| 11 | 手動テスト | completed (NON_VISUAL) | outputs/phase-11/phase-11.md, manual-test-result.md |
| 12 | ドキュメント更新 | completed | outputs/phase-12/*（strict 7） |
| 13 | PR作成 | pending_user_approval | outputs/phase-13/phase-13.md |

> 本仕様書は **implemented_local_evidence_captured** であり、各 Phase ファイルは「実装方針」と「本 wave で取得した local evidence」を兼ねる。commit / push / PR と実 D1 への seed apply は user-gated。

---

## 不変条件（CLAUDE.md / プロジェクト規約より）

1. D1 直接アクセスは apps/api に閉じる（apps/web から D1 binding 禁止）。seed・カタログ・ジェネレータは apps/api/scripts。E2E は manifest JSON 経由のみ。
2. 新規 test ファイルは `*.spec.ts` のみ（`*.test.ts` 禁止。lefthook `block-test-suffix` / CI `verify-test-suffix`）。
3. 新規 D1 schema / migration / API endpoint を追加しない（既存 surface のみ）。
4. 実フォーム schema をコードに固定しすぎない（answers_json は stable_key 最小集合）。consent キーは `publicConsent` / `rulesConsent` に統一。
5. シークレット非混入: `STAGING_AUTH_SECRET` 等は 1Password / env 経由。mint 出力（cookie/token）は stdout/log に出さない・`.gitignore` 配下に出力。
6. production への seed 適用は CLI で構造的に禁止（`--env production` を拒否）。

---

## DoD（Definition of Done・実装プロンプト向け完了条件）

1. `apps/api/src/testing/test-accounts/` の catalog/build/index が存在し、`mise exec -- pnpm typecheck` が通る。
2. `node --import tsx scripts/gen-test-accounts-seed.mjs` で生成した 3 ファイルが committed 版と byte 一致（drift guard spec PASS）。
3. in-memory D1（setupD1）に seed SQL を適用後、ゲーティング期待値（ログイン可 7 / 不可 3、公開掲載 5）が spec で検証され PASS。
4. seed → cleanup → seed の冪等性が spec で PASS（重複実行で件数不変、cleanup 後 0 件）。
5. `mise exec -- pnpm lint` が通り、HEX 直書き等の規約違反 0。
6. `scripts/seed-test-accounts.sh --env local` でローカル D1 に投入でき、`--cleanup` で撤去でき、`--env production` は拒否される（手順記載・実行は user-gated）。
7. `bash scripts/verify-pr-ready.sh`（phase12-compliance / gate-metadata / indexes drift）が通る。

---

## 参照ドキュメント

| 参照 | パス | 内容 |
|------|------|------|
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | Google OAuth / Magic Link / responseEmail |
| MVP 認証 | `docs/00-getting-started-manual/specs/13-mvp-auth.md` | ログイン3条件 / 公開3条件 / SessionJwtClaims |
| 会員権限 | `docs/00-getting-started-manual/specs/06-member-auth.md` | gateReason 4値 / 権限3階層 |
| D1 構成 | `docs/00-getting-started-manual/specs/08-free-database.md` | D1 無料構成 |
| 既存 seed 先例 | `apps/api/migrations/seed/issue-399-admin-queue-staging-seed.sql` | seed/cleanup/syntax spec パターン |
| stable_key | `packages/shared/src/zod/field.ts` | answers_json の stable_key 31 種 |
| JWT 署名 | `packages/shared/src/auth.ts` | `signSessionJwt(secret, {memberId,email,isAdmin,...})` |
| E2E mint 先例 | `apps/web/playwright/scripts/mint-staging-storage-state.ts` | storage-state JWT mint |
