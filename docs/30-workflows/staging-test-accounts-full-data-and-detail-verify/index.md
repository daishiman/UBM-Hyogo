# staging-test-accounts-full-data-and-detail-verify

[実装区分: 実装仕様書]

> ユーザー依頼（2026-06-09）: 「ステージング環境で、（Google Form 全項目で）テストアカウントを作っているが、各項目に情報が入力されていない。これらの情報を入力するようにしておいてほしい。どのような形で表示されるのか見ておきたい。この項目が今回表示している詳細ページに記述がない場合は、それも反映できるようにページの方を改善してほしい。」（参照: 実フォーム回答スプレッドシート 33 列 / `https://ubm-hyogo-web-staging.daishimanju.workers.dev/members/TEST-MEM-06`）
>
> 本仕様書はこの依頼を **コード（テストアカウント seed データ拡充 + 公開詳細ページ表示検証）で実装するための実装仕様書** として作成し、今回の改善サイクルで local 実装・seed 再生成・focused tests・typecheck・lint まで完了した。commit / push / PR / 実 staging D1 への seed apply / authenticated staging スクリーンショットのみ user-gated とする。

---

## メタ情報

| 項目 | 値 |
|------|-----|
| Task ID | TASK-STAGING-TEST-ACCOUNTS-FULL-DATA-001 |
| Feature 名 | staging-test-accounts-full-data-and-detail-verify |
| Task type | implementation |
| implementation_mode | new |
| taskClassification | UI |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |
| canonical_root | docs/30-workflows/staging-test-accounts-full-data-and-detail-verify |
| 対象パッケージ | apps/api（テストアカウント SSOT/seed・正本）, apps/web（公開詳細ページ表示検証/ギャップ修正）, scripts（staging 適用 CLI） |
| D1 直接アクセス | apps/api に閉じる（不変条件 #5 遵守。apps/web から D1 binding 禁止） |
| relatedIssue | null |

---

## ユーザー判断（2026-06-09 AskUserQuestion 確定事項）

| 論点 | 確定 | 帰結 |
|------|------|------|
| 公開詳細ページの member/admin 可視性項目（生年月日・UBM参加時期・現在の課題・掲載同意・規約同意）の扱い | **現状維持（public 項目のみ表示）** | プライバシー設計（visibility=public/member/admin の3層）を尊重。公開詳細ページに表示するのは visibility=public の項目のみ。member/admin 項目はデータとしては投入するが公開ページには出さない。タイムスタンプ・メールアドレスは system field で公開対象外。 |
| テストアカウントへのデータ投入範囲 | **全テストアカウント(01-10)を全項目で埋める** | TEST-MEM-01〜10 すべてに Google Form 31 stable_key のデータを投入する。member/admin 項目は公開ページには出さず、visibility row で二重防御する。 |

---

## 真の論点（要件レビュー一次結論）

1. **真の論点**: 「テストアカウントに情報を入れる」ことの本質は、**公開ディレクトリ掲載対象のテストアカウント詳細ページが Google Form 全項目（visibility=public）を実データで描画し、各項目の表示形態を staging で目視確認できる状態を、既存の SSOT カタログ（`catalog.ts`）から決定論的に再生成して達成すること**。ユーザーが空ページを見た真因は API でも詳細ページ構造でもなく、**TEST-MEM-06 等の seed プロフィールが空だったこと**（commit `66d18af1b` で詳細ページは既に全 public 項目を 5 セクション描画できる構造になっている）。
2. **依存関係・責務境界**: 「アカウントの定義（SSOT カタログ）」→「seed 生成物（SQL/manifest）」→「D1 投入」→「公開詳細ページ描画」の一方向フロー。データ投入は apps/api / scripts に閉じ、表示は apps/web が API 経由で描画する。**API 契約・D1 schema・Google Form schema は一切変更しない**（既存 surface のみ）。
3. **価値とコストの不均衡**: 最大の価値は「全 public 項目の表示形態を実データで一望できること」。最大コストは「10 アカウント × 31 項目の現実的ダミーデータ作成」だが、SSOT カタログの per-member `profile` を拡充するだけで済み、build-seed-sql は既に TEST-MEM-01 の全 public 項目描画を成立させている（member_field_visibility seeding 含む）ため、ジェネレータ本体の構造変更コストは最小。
4. **改善優先順位**: (1) Lane A: `catalog.ts` の 10 メンバー `profile` を全項目で拡充 + seed 生成物再生成 + focused tests → (2) Lane B: 公開詳細ページが全 public 項目を full/all-fields/edge データで正しく描画することの検証 + 表示ギャップがあれば最小修正 + fixture/spec 更新 → (3) Lane C: staging 適用手順 + authenticated 目視確認（実行は user-gated）。
5. **4条件評価**: 価値性=全 public 項目の表示確認土台を 1 コマンド再生成で用意 / 実現性=既存 catalog・build-seed-sql・公開詳細5セクション描画を再利用し新規 API/D1/Form 変更ゼロ / 整合性=SSOT→生成物 drift guard・visibility 3層の二重防御維持・D1 境界遵守 / 運用性=`TEST-` prefix + `.invalid` ドメインで cleanup 安全・冪等再投入。

---

## スコープ

### 含む（今回サイクル 1 で完了させる）

- **Lane A（apps/api・主作業）**: `apps/api/src/testing/test-accounts/catalog.ts` の TEST-MEM-01〜10 の per-member `profile` を Google Form 31 stable_key の現実的ダミーデータで拡充（member/admin 可視性項目 birthDate / ubmJoinDate / challenges、admin consent もデータとして投入）。`build-seed-sql.ts` は全31 `response_fields` と `member_field_visibility` を生成する。生成物（`test-accounts-seed.sql` / `test-accounts-cleanup.sql` / `test-accounts.manifest.json`）は再生成済み。
- **Lane A テスト**: catalog 完全性 spec（10 アカウントの profile キー網羅・表示バリエーション意図の固定）、build-seed-sql spec（per-member 全 stable_key 分の `response_fields` 行 + `schema_questions` visibility 行が生成されること）、drift guard contract spec の更新。
- **Lane B（apps/web・検証 + ギャップ修正）**: 公開詳細ページ（`/members/[id]`）が visibility=public の全 29 項目を full/all-fields/edge データで正しく 5 セクション（Hero / ビジネス概要 / タグ+SNS / パーソナル / メッセージ）+ 参加履歴に描画することを検証。**表示漏れ・全項目入力描画・kind ルーティングのギャップが見つかれば最小差分で修正**（adapter `member-detail.ts` / 各 public コンポーネント）。`apps/web/src/fixtures/public-member-profile.ts` を新データに整合する richer fixture へ更新し、adapter/コンポーネント spec を追補。
- **Lane C（scripts・適用手順）**: 再生成 → `scripts/seed-test-accounts.sh --env staging --action apply` → `/members/TEST-MEM-06` 等で目視確認 → スクリーンショット取得、までの手順を DoD / Phase 11 手動テストとして記述（**実行は user-gated**）。

### 含まない（理由付き・先送りではない明示的除外）

- **commit・PR・push・実 staging D1 への seed apply・authenticated staging スクリーンショット撮影**（CONST_002 / CONST_006。実行は user 明示承認後）。
- **公開詳細ページへの member/admin 可視性項目（生年月日・UBM参加時期・現在の課題・同意状況）の表示追加**（ユーザー判断「現状維持」。visibility 設計を上書きしない。これらの**表示確認はログイン後 `/profile`（member）/ `/admin`（admin）で行える**＝データ投入により別画面で確認可能だが、公開ページの code 変更対象外）。
- **新規 D1 テーブル / migration / API endpoint / Google Form schema の追加・変更**（既存 schema・既存 surface のみ。不変条件 #5・UI prototype alignment 不変条件 #1 遵守）。
- **Google Form 実回答（スプレッドシート）の本番 sync 取り込み**（テストアカウントは form sync を経由せず D1 へ直接 seed する既存方式を踏襲。実スプレッドシートの messy データ取り込みは別関心・別タスク）。

> CONST_007 確認: 上記「含まない」はいずれも **今回サイクルで完了させると整合性的に破綻する／ユーザー判断で除外／本質的に別関心** の項目のみ。分量・複雑さを理由とした先送りは含まない。全「含む」項目（Lane A/B/C）は今回のlocal実装 1 サイクルで完了可能なスコープに収めている。

---

## アーキテクチャ（責務分離）

```
  ┌─────────────────────────────────────────────────────────────┐
  │ SSOT: apps/api/src/testing/test-accounts/catalog.ts          │
  │   TEST-MEM-01..10 の per-member profile（31 stable_key 拡充）│  ← Lane A
  └──────────────────────────┬──────────────────────────────────┘
                             │ (pure) build-seed-sql.ts
  ┌──────────────────────────▼──────────────────────────────────┐
  │ migrations/seed/  test-accounts-seed.sql / cleanup.sql /     │  ← Lane A（生成物 + drift guard）
  │                   test-accounts.manifest.json                │
  └──────────────────────────┬──────────────────────────────────┘
       scripts/seed-test-accounts.sh --env staging --action apply │  ← Lane C（user-gated）
  ┌──────────────────────────▼──────────────────────────────────┐
  │ staging D1: member_responses / response_fields /             │
  │             schema_questions(visibility) / member_status …   │
  └──────────────────────────┬──────────────────────────────────┘
   GET /public/members/:id（既存・無変更）                        │
  ┌──────────────────────────▼──────────────────────────────────┐
  │ apps/web 公開詳細ページ: adapter member-detail.ts →          │  ← Lane B（検証 + ギャップ修正）
  │   Hero / BusinessOverview / Tags+Links / Personal / Message  │
  └─────────────────────────────────────────────────────────────┘
```

- **D1 境界**: catalog / ジェネレータ / seed / 適用 CLI はすべて apps/api / scripts に閉じる。apps/web は `fetchPublicOrNotFound` 経由の API 取得のみで D1 binding に触れない（不変条件 #5）。

---

## 真因確定（調査結果サマリー）

| 観察された症状 | 真因 | 帰結 |
|---------------|------|------|
| `/members/TEST-MEM-06` が空・項目が出ない | **TEST-MEM-06 の seed `profile` が occupation/ubmZone 程度しか入っていない**（catalog.ts の「最小公開」定義）。API も詳細ページ構造も無罪。 | Lane A でデータ投入。 |
| 「項目が詳細ページに記述がない」可能性 | commit `66d18af1b` で公開詳細ページは **visibility=public の全 29 項目を 5 セクションで描画済み**。表示漏れは原則存在しない見込み。 | Lane B で full/all-fields/edge データに対し描画を**検証**し、万一のギャップのみ最小修正。 |
| member/admin 項目が公開ページに出ない | **visibility 設計（意図的）**。ユーザー判断「現状維持」。 | 公開ページ code 変更なし。データは投入し別画面で確認可能。 |

---

## Google Form 33 列 → 内部マッピング（投入対象の正本）

| # | Form 列ラベル | stable_key | visibility | 公開詳細表示 | 投入 |
|---|--------------|-----------|-----------|:---:|:---:|
| 1 | お名前（フルネーム） | fullName | public | ✅ Hero | ✅ |
| 2 | あだ名・ニックネーム | nickname | public | ✅ Hero | ✅ |
| 3 | お住まい | location | public | ✅ Hero | ✅ |
| 4 | 生年月日 | birthDate | member | ✗（会員のみ） | ✅(データ) |
| 5 | 職業・仕事内容 | occupation | public | ✅ Hero | ✅ |
| 6 | 出身地 | hometown | public | ✅ Hero chip | ✅ |
| 7 | UBM区画 | ubmZone | public | ✅ Hero badge | ✅ |
| 8 | UBM参加ステータス | ubmMembershipType | public | ✅ Hero badge | ✅ |
| 9 | UBMに入会・参加した時期 | ubmJoinDate | member | ✗（会員のみ） | ✅(データ) |
| 10 | ビジネス概要 | businessOverview | public | ✅ ビジネス概要 | ✅ |
| 11 | 得意分野・スキル | skills | public | ✅ ビジネス概要 | ✅ |
| 12 | 現在の課題・相談したいこと | challenges | member | ✗（会員のみ） | ✅(データ) |
| 13 | 提供できること・協力できること | canProvide | public | ✅ ビジネス概要 | ✅ |
| 14 | 趣味・好きなこと | hobbies | public | ✅ パーソナル | ✅ |
| 15 | 最近ハマっていること | recentInterest | public | ✅ パーソナル | ✅ |
| 16 | 座右の銘 | motto | public | ✅ パーソナル | ✅ |
| 17 | 仕事以外の活動 | otherActivities | public | ✅ パーソナル | ✅ |
| 18 | ホームページ URL | urlWebsite | public | ✅ SNS/Web | ✅ |
| 19 | Facebook URL | urlFacebook | public | ✅ SNS/Web | ✅ |
| 20 | Instagram URL | urlInstagram | public | ✅ SNS/Web | ✅ |
| 21 | Threads URL | urlThreads | public | ✅ SNS/Web | ✅ |
| 22 | YouTube URL | urlYoutube | public | ✅ SNS/Web | ✅ |
| 23 | TikTok URL | urlTiktok | public | ✅ SNS/Web | ✅ |
| 24 | X（Twitter）URL | urlX | public | ✅ SNS/Web | ✅ |
| 25 | ブログ URL | urlBlog | public | ✅ SNS/Web | ✅ |
| 26 | note URL | urlNote | public | ✅ SNS/Web | ✅ |
| 27 | LinkedIn URL | urlLinkedin | public | ✅ SNS/Web | ✅ |
| 28 | その他のSNS・URL | urlOthers | public | ✅ SNS/Web(other) | ✅ |
| 29 | 自己紹介・一言メッセージ | selfIntroduction | public | ✅ メッセージ | ✅ |
| 30 | ホームページへの掲載に同意 | publicConsent | admin | ✗ | ✅(既存) |
| 31 | 勧誘ルール・免責事項への同意 | rulesConsent | admin | ✗ | ✅(既存) |
| - | タイムスタンプ | （system: submittedAt） | - | ✗ | - |
| - | メールアドレス | （system: responseEmail） | - | ✗ | - |

> 公開詳細表示=✅ の 29 項目（fullName..selfIntroduction の public 群 + tags + photo + attendance）が staging 目視確認の対象。member/admin の 5 項目はデータ投入のみ。

---

## テストアカウント表示バリエーション・マトリクス（Lane A 設計の正本）

> 既存の login-gating / publish-state マトリクス（test-accounts-seed-spec）は**壊さず**、`profile` データのみ拡充する。公開ディレクトリ掲載 5 件（01,06,07,09,10）が公開詳細ページ描画の主対象。

| key | publish/掲載 | profile 充填方針 | 表示検証の意図 |
|-----|-------------|-----------------|----------------|
| TEST-MEM-01 | public・掲載 | **フル**（全 31 stable_key 充填・全 SNS） | 理想会員・全項目フル描画 |
| TEST-MEM-02 | member_only・非掲載 | フル（公開ページには出ないが /profile 確認用） | declined-public のデータ確認 |
| TEST-MEM-03 | hidden・非掲載 | フル | hidden のデータ確認 |
| TEST-MEM-04 | member_only・非掲載・login不可 | 中程度 | gating 維持下のデータ |
| TEST-MEM-05 | deleted・非掲載 | 中程度 | deleted のデータ |
| TEST-MEM-06 | **public・掲載**（ユーザー参照） | **フル**（全項目） | **ユーザー目視対象**・全項目フル描画 |
| TEST-MEM-07 | public・掲載 | フル + **タグ多数**（全6カテゴリ） | タグ密集 + 全項目描画 |
| TEST-MEM-08 | member_only・非掲載・login不可 | 中程度 | unknown-consent のデータ |
| TEST-MEM-09 | **public・掲載** | **全項目入力 + 本人写真** | 画像あり詳細ページ + 全項目描画 |
| TEST-MEM-10 | **public・掲載** | **エッジ**（長文日本語・絵文字/特殊文字・全 URL 系キー埋め） | 長文/特殊文字/全 SNS 描画の堅牢性 |

- **公開掲載 5 件の充填**: 01=フル, 06=フル, 07=フル+タグ多数, 09=全項目入力, 10=エッジ。→ フル・全項目入力・エッジの 3 パターンを公開ページで一望できる。
- 非掲載 5 件（02,03,04,05,08）も `profile` を投入（/profile・/admin での確認用）。

---

## 変更対象ファイル一覧（CONST_005）

| パス | 種別 | レーン | 役割 |
|------|------|--------|------|
| `apps/api/src/testing/test-accounts/catalog.ts` | 編集 | A | TEST-MEM-01..10 の per-member `profile` を 31 stable_key で拡充 + 表示バリエーション設計 |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | 編集(必要時) | A | per-member profile から全 stable_key 分の `response_fields` / `schema_questions`(visibility) を生成（TEST-MEM-01 で成立済の汎用性を 10 件へ確認） |
| `apps/api/migrations/seed/test-accounts-seed.sql` | 再生成(生成物) | A | 冪等 seed（全 10 アカウントの profile 反映） |
| `apps/api/migrations/seed/test-accounts-cleanup.sql` | 再生成(生成物) | A | 冪等 cleanup |
| `apps/api/migrations/seed/test-accounts.manifest.json` | 再生成(生成物) | A | id/email/role/loginable/public manifest |
| `apps/api/src/testing/test-accounts/__tests__/catalog.spec.ts` | 編集 | A | profile キー網羅 + 表示バリエーション意図の固定 |
| `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts` | 編集 | A | response_fields / member_field_visibility 行の生成検証 |
| `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts` | 編集 | A | committed 生成物 drift guard + in-memory D1 投入後の公開項目検証 |
| `apps/web/src/lib/adapters/member-detail.ts` | 編集(ギャップ時のみ) | B | visibility=public 全項目のセクション割当・全項目入力の検証/修正 |
| `apps/web/src/components/public/*.tsx` | 編集(ギャップ時のみ) | B | 表示漏れ・全項目入力描画の最小修正 |
| `apps/web/src/fixtures/public-member-profile.ts` | 編集 | B | full/all-fields/edge を反映した richer fixture |
| `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | 編集 | B | 全 public 項目描画 + 全項目入力の回帰テスト |
| `apps/web/src/components/public/__tests__/*.spec.tsx` | 編集(必要時) | B | コンポーネント描画 spec 追補 |

> **新規ファイルは原則なし**（既存ファイルの拡充）。万一 Lane B でギャップ修正に新規コンポーネントが必要になった場合も既存 primitives のみ使用（不変条件: 新規 primitive を生やさない）。

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
| 11 | 手動テスト | pending_user_gate (VISUAL/staging pending) | outputs/phase-11/phase-11.md, manual-test-result.md |
| 12 | ドキュメント更新 | completed | outputs/phase-12/*（strict 7） |
| 13 | PR作成 | pending_user_approval | outputs/phase-13/phase-13.md |

> 本仕様書は **implemented_local_evidence_captured**（VISUAL_ON_EXECUTION）。local code / seed / tests は完了。staging apply・スクリーンショット・commit / push / PR は user-gated 実行に委ねる。

---

## 不変条件（CLAUDE.md / プロジェクト規約より）

1. D1 直接アクセスは apps/api に閉じる（apps/web から D1 binding 禁止）。seed・catalog・ジェネレータ・適用 CLI は apps/api / scripts。
2. 新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止。lefthook `block-test-suffix` / CI `verify-test-suffix`）。
3. 新規 D1 schema / migration / API endpoint / Google Form schema を追加・変更しない（既存 surface のみ）。
4. consent キーは `publicConsent` / `rulesConsent` に統一。`responseEmail` は system field。Google Form schema 外データは admin-managed として分離。
5. OKLch トークン正本（`apps/web/src/styles/tokens.css`）。HEX 直書き / `bg-[#xxx]` 禁止。Lane B の修正は既存トークン・既存 primitives のみ（CI `verify-design-tokens` green 維持）。
6. visibility=public の二重防御（adapter + API）を維持。member/admin 項目を公開ページへ漏らさない。
7. stableKey 参照は `STABLE_KEY` 定数経由（lint-stablekey-literal）。
8. production への seed 適用は CLI 構造で禁止（`--env production` 拒否）。

---

## DoD（Definition of Done・今回のlocal実装向け完了条件）

1. `catalog.ts` の TEST-MEM-01..10 が表示バリエーション・マトリクス通りに `profile` を持ち、`mise exec -- pnpm typecheck` が通る。
2. `node --import tsx scripts/gen-test-accounts-seed.mjs`（または既存 gen コマンド）で再生成した seed/cleanup/manifest が committed 版と byte 一致（drift guard spec PASS）。
3. in-memory D1（setupD1）に seed 適用後、公開掲載 5 件（01,06,07,09,10）の `GET /public/members/:id` 相当が visibility=public 全項目を返し、09 の空 optional が欠落・10 の長文/特殊文字が保持されることを spec で検証 PASS。
4. apps/web の adapter/コンポーネント spec が full/all-fields/edge fixture で全 public 項目描画 + 全項目保持 を検証 PASS。
5. `mise exec -- pnpm lint`（apps/api・apps/web）が通り、HEX 直書き等の規約違反 0。`verify-design-tokens` 相当 green。
6. `seed → cleanup → seed` の冪等性が spec で PASS。
7. `bash scripts/verify-pr-ready.sh`（phase12-compliance / gate-metadata / indexes drift）が通る。
8. （user-gated）`scripts/seed-test-accounts.sh --env staging --action apply` 後、`/members/TEST-MEM-06`（および 01/07/09/10）で全 public 項目が描画されることを目視確認しスクリーンショット取得。

---

## 参照ドキュメント

| 参照 | パス | 内容 |
|------|------|------|
| 前タスク（同ドメイン先例） | `docs/30-workflows/completed-tasks/public-member-detail-survey-fields-richness/` | 公開詳細 5 セクション化 + TEST-MEM-01 seed richness（本タスクはこの継続） |
| テストアカウント基盤 | `docs/30-workflows/test-accounts-seed-spec/` | catalog/build-seed-sql/適用 CLI の正本 |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | stable_key 31 種・visibility・consent マッピング |
| stable_key | `packages/shared/src/zod/field.ts` | `STABLE_KEY` 定数 31 種 |
| 公開詳細 adapter | `apps/web/src/lib/adapters/member-detail.ts` | stableKey 駆動セクション再構成 |
| catalog SSOT | `apps/api/src/testing/test-accounts/catalog.ts` | TEST-MEM-01..10 定義 |
| seed 適用 CLI | `scripts/seed-test-accounts.sh` | local/staging 適用・撤去（production 禁止） |
