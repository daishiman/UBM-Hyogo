# Implementation Guide

## Part 1: 中学生にもわかる説明

### なぜこれが必要か

ネットの会員紹介ページを作ったとき、「他の人から見たらどんなふうに表示されるか」を、本物の会員さんに見せる前に自分で確かめたくなります。
たとえば、新しい自己紹介カードのテンプレートを作ったら、まず自分でダミーのカードに名前・仕事・趣味・SNS のリンクなどを全部書き込んでみて、「ちゃんと並ぶかな」「文章が長すぎたらはみ出さないかな」を確認しますよね。それと同じことを、Web ページでやります。

今回の困りごとはこうです。ステージング（練習用の本番そっくり環境）に「テスト用のダミー会員」を 10 人ぶん作ってあるのに、その中身（職業・趣味・自己紹介・SNS リンクなど）がほとんど空っぽでした。だから紹介ページを開いても、何も書かれていないスカスカのページが出てしまいました。
調べてみると、ページの作り（見た目の部品）はすでに完成していて、空っぽだったのは **ダミー会員の中身のデータだけ** でした。だから直すのは「ページ」ではなく「ダミーのデータ」が中心です。

### 何をするか

たとえるなら、空欄だらけのプロフィール用紙 10 枚に、現実っぽい内容を全部書き込む作業です。
1 枚ずつ手書きすると間違えるので、「台本（カタログ）」という 1 つのファイルに 10 人ぶんの内容をまとめて書きます。台本を直すと、データベースに入れる命令書（seed）が機械（ジェネレータ）で自動的に作り直されます。

しかも、ただ全員に同じことを書くのではなく、わざと **3 種類のパターン** を作ります。

- **フル**: 全部の項目をびっしり埋めた理想の会員（例: 1 番・6 番・7 番）。
- **全項目入力**: 趣味や座右の銘などをわざと空欄にした会員（例: 9 番）。空欄のときにページが崩れず、`—`（ダッシュ）で上手に表示できるかを確かめます。
- **エッジ（極端）**: すごく長い文章、絵文字、特殊な記号、全部の SNS リンクを入れた会員（例: 10 番）。極端な内容でも壊れないかを確かめます。

こうすると、紹介ページを 1 回見るだけで「ふつう」「空欄あり」「極端」の 3 パターンを一望できます。

### 見せていい情報・見せない情報

会員の情報には「みんなに見せていい情報（public）」と「ログインした会員だけが見られる情報（member）」と「管理者だけの情報（admin）」の 3 段階があります。
たとえば自己紹介や仕事は public、生年月日や「今こんなことで困っている」という相談ごとは member、同意のチェックは admin です。
今回、生年月日などの member/admin の情報も **データとしては入れます**（あとでログイン後の画面で確認できるように）。でも **公開ページには絶対に出しません**。プライバシーを守る大事なルールなので、公開ページの作りは今回いじりません。

### 確認方法

まず、台本から作り直した命令書が、いま保存してある命令書と 1 文字も違わないか（ズレていないか＝drift していないか）を自動でチェックします。
次に、メモリ上の仮データベースに命令書を流し込んで、「公開していい 5 人ぶんの情報が、ちゃんと公開ページ用に取り出せる」「member/admin の秘密の情報は公開ページに漏れない」をテストで確かめます。
最後に、本物そっくりの練習環境（staging）にデータを入れて、`/members/TEST-MEM-06` などのページを実際にブラウザで開き、画面写真（スクリーンショット）を撮って目で確かめます。ただし、この「データを入れる」「写真を撮る」はユーザーが OK を出してから（user-gated）やります。

## Part 2: 開発者向け技術詳細

### Scope

本サイクルは「catalog(SSOT) の per-member profile 拡充 → 生成物 (committed) 再生成 → drift guard / contract spec → 公開詳細ページ表示検証 / 最小ギャップ修正 → user-gated staging apply + 目視」の一連を実装する。
編集対象は `apps/api/src/testing/test-accounts/`（catalog / build-seed-sql / spec）、`apps/api/migrations/seed/`（生成物 + contract spec）、`apps/web/src/lib/adapters/`・`apps/web/src/components/public/`・`apps/web/src/fixtures/`（検証 + ギャップ時のみ最小修正）、`scripts/`（適用手順）に限定する。
**新規 D1 テーブル / migration / API endpoint / Google Form schema は追加しない**（既存 schema・既存 surface のみ）。D1 への物理投入・catalog・ジェネレータ・適用 CLI はすべて apps/api / scripts に閉じ、apps/web は `fetchPublicOrNotFound` 経由の API 取得のみで D1 binding に触れない（不変条件 #5）。

### catalog データ構造（Lane A）

`apps/api/src/testing/test-accounts/catalog.ts` の各 member は per-member `profile` を持つ。`build-seed-sql.ts` がこの `profile` を `answersFor` で読み、`response_fields` 行へ展開する。型シグネチャは次のとおり（既存定義の踏襲・本 wave で確定）。

```ts
// apps/api/src/testing/test-accounts/catalog.ts
import { STABLE_KEY, type StableKey } from "@ubm-hyogo/shared/zod/field";

export interface TestMemberAccount {
  memberId: `TEST-MEM-${string}`;
  responseId: `TEST-RES-${string}`;
  email: `${string}@test.ubm-hyogo.invalid`;
  fullName: string;                          // 先頭に [TEST] を付与
  occupation: string;
  ubmZone: string | null;                    // enum 値（例: "0_to_1" / "1_to_10" / "10_to_100"）
  ubmMembershipType: string | null;          // enum 値（例: "member"）
  publicConsent: "consented" | "declined" | "unknown";
  rulesConsent: "consented" | "declined" | "unknown";
  publishState: "public" | "member_only" | "hidden";
  isDeleted: boolean;
  tags: readonly string[];
  attendance: readonly string[];
  // 本タスクで拡充する per-member profile（Google Form 31 stable_key の現実的ダミー）
  profile: Partial<Record<StableKey, string>>;
}
```

per-member `profile` の代表例（TEST-MEM-06・フル・ユーザー目視対象）:

```ts
profile: {
  [STABLE_KEY.nickname]: "ろくちゃん",
  [STABLE_KEY.location]: "兵庫県淡路市",
  [STABLE_KEY.birthDate]: "1985-07-07",            // member 可視性（データのみ・公開ページ非表示）
  [STABLE_KEY.occupation]: "製造業 / 代表取締役",
  [STABLE_KEY.hometown]: "兵庫県洲本市",
  [STABLE_KEY.ubmJoinDate]: "2023-04",              // member 可視性（データのみ）
  [STABLE_KEY.businessOverview]: "淡路島で精密部品の製造業を営んでいます。…",
  [STABLE_KEY.skills]: "機械設計、CAD、原価計算",
  [STABLE_KEY.challenges]: "DX 人材の採用に悩んでいます",  // member 可視性（データのみ）
  [STABLE_KEY.canProvide]: "ものづくり全般の相談、工場見学",
  [STABLE_KEY.hobbies]: "釣り、キャンプ",
  [STABLE_KEY.recentInterest]: "生成AIの製造現場活用",
  [STABLE_KEY.motto]: "段取り八分",
  [STABLE_KEY.otherActivities]: "地元商工会青年部",
  [STABLE_KEY.urlWebsite]: "https://example.com/roku",
  [STABLE_KEY.urlFacebook]: "https://facebook.com/roku",
  // … 全 SNS URL（urlInstagram / urlThreads / urlYoutube / urlTiktok / urlX / urlBlog / urlNote / urlLinkedin）
  [STABLE_KEY.urlOthers]: "Podcast: https://example.com/roku-radio",
  [STABLE_KEY.selfIntroduction]: "淡路島から、ものづくりで地域を元気にします。よろしくお願いします。",
}
```

充填レベルの方針（表示バリエーション・マトリクス）:

| key | 充填 | 意図 |
| --- | --- | --- |
| TEST-MEM-01 / 06 | フル（29 public 全 + member/admin データ） | 全項目フル描画の基準形・ユーザー目視対象（06） |
| TEST-MEM-07 | フル + タグ多数（全 6 カテゴリ） | タグ密集時のレイアウト堅牢性 |
| TEST-MEM-09 | 全項目入力（motto / hobbies / otherActivities / recentInterest / 一部 SNS を空） | `—` fallback / 条件付き非表示の検証 |
| TEST-MEM-10 | エッジ（長文日本語 / 絵文字 `🌊⚓️` / 特殊文字 `%#&<>` / 全 URL 系キー） | 長文 wrap / エスケープ / 全 SNS pill の堅牢性 |
| TEST-MEM-02/03/04/05/08 | 中（必須 + 主要 optional） | 非掲載。/profile・/admin での確認用にデータ投入 |

> 必須（fullName / location / occupation / ubmZone / ubmMembershipType / businessOverview）は **全 member で必ず充填**する。空にするのは optional のみ（09 用）。

### build-seed-sql 確認ポイント（Lane A・必要時のみ編集）

- `answersFor(member)` が `profile` の全キーを `response_fields`（および `answers_json`）行に展開すること。TEST-MEM-01 で全 public 項目描画が staging で成立済 → この展開と `schema_questions` の visibility seeding は **既に汎用**。今回のlocal実装冒頭で `build-seed-sql.ts` を読み、汎用なら無変更、member 固有のハードコードがあれば全 stable_key を回す形へ最小一般化する。
- consent は `member_status` 生成側で扱う（UPSERT_COLUMNS は consent 非更新の不変条件 #4 を遵守。既存どおり）。

### 生成物再生成（Lane A）

```bash
node --import tsx scripts/gen-test-accounts-seed.mjs
```

で `test-accounts-seed.sql` / `test-accounts-cleanup.sql` / `test-accounts.manifest.json` を上書き再生成し、committed 版と byte 一致させる（drift guard contract spec が強制）。

### 公開詳細 adapter（Lane B・検証主体）

`apps/web/src/lib/adapters/member-detail.ts` は API レスポンスの stableKey 駆動で 5 セクション（Hero / ビジネス概要 / タグ+SNS / パーソナル / メッセージ）へ再構成する。検証観点の型イメージ:

```ts
// apps/web/src/lib/adapters/member-detail.ts（既存・契約イメージ）
type PublicMemberDetailView = {
  hero: { fullName: string; nickname?: string; location?: string; occupation?: string;
          hometown?: string; ubmZone?: string; ubmMembershipType?: string };
  business: { businessOverview?: string; skills?: string; canProvide?: string };
  links: ReadonlyArray<{ kind: string; url: string }>;   // 投入された SNS のみ
  personal: { hobbies?: string; recentInterest?: string; motto?: string; otherActivities?: string };
  message: { selfIntroduction?: string };
  // member/admin（birthDate / ubmJoinDate / challenges / publicConsent / rulesConsent）は
  // この view に含めない（visibility=public 二重防御）。
};
```

検証フロー（verify_existing 主体）:

1. adapter が visibility=public 全項目を KIND_ROUTE 通りにセクション割当することを fixture（full/all-fields/edge）で確認。
2. 各 public component が全項目入力（09）で破綻しないこと（PersonalSection の空 KV / MessageCard の空非表示 / BusinessOverviewSection の条件付き）を確認。
3. エッジ（10）で長文 wrap・特殊文字エスケープ・全 SNS pill 描画を確認。
4. **ギャップ発見時のみ最小差分修正**（adapter の KIND_ROUTE / ASSIGNED_DETAIL_KEYS、または `MemberDetailSections` の other fallback）。新規 primitive・新規 HEX・新規 endpoint は作らない。

`apps/web/src/fixtures/public-member-profile.ts` を full/all-fields/edge 3 形態に対応する richer fixture へ更新し、`apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` が全 public 項目描画 + 全項目保持 + member/admin 非漏洩を検証する。

### エラーハンドリング / エッジケース

- **全項目入力（09）**: optional 欠落時、adapter は当該キーを view から除外し、コンポーネントは `—` fallback または条件付き非表示にする。必須欠落は許容しない（catalog で必須を必ず充填）。
- **エッジ（10）**: 長文は CSS の折返し、特殊文字 `%#&<>` は JSX のデフォルトエスケープ、絵文字は UTF-8 のまま保持。SQL escape は build-seed-sql の生成段で担保し contract spec で検証。
- **visibility 漏洩**: member/admin 項目が公開 view に出ないことを adapter spec と contract spec の二重防御で assert。
- **drift**: 再生成忘れは contract spec の byte 一致 assert で fail。

### 検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
node --import tsx scripts/gen-test-accounts-seed.mjs            # 生成物再生成（drift guard）
pnpm exec vitest run apps/api/src/testing/test-accounts --config=vitest.config.ts
pnpm exec vitest run apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts --config=vitest.d1.config.ts
pnpm exec vitest run apps/web/src/lib/adapters/__tests__/member-detail.spec.ts --config=vitest.config.ts
bash scripts/verify-pr-ready.sh
# user-gated:
scripts/seed-test-accounts.sh --env staging --action apply
```

### 設定可能パラメータ / 定数

| パラメータ | 既定値 | 用途 |
| --- | --- | --- |
| `TEST_ACCOUNT_PREFIX` | `"TEST-"` | member_id / response_id の判別 prefix |
| `TEST_EMAIL_DOMAIN` | `"test.ubm-hyogo.invalid"` | RFC 2606 予約 TLD。実在せず配信不能で事故防止 |
| `TEST_SEED_ACTOR` | `"seed:test-accounts"` | created_by / updated_by の actor 値。cleanup 対象限定に使用 |
| `STABLE_KEY` | 31 種（`packages/shared/src/zod/field.ts`） | profile キーの正本。literal 直書き禁止（lint-stablekey-literal） |

### 既知制限（user-gated・本サイクル非実行）

- staging D1 への実投入（`scripts/seed-test-accounts.sh --env staging --action apply`）と authenticated / staging スクリーンショット撮影は user-gated。
- production への seed 適用は `scripts/seed-test-accounts.sh` の CLI ガードで構造的に禁止（`--env production` 拒否）。
- Google Form 実回答（スプレッドシート）の本番 sync 取り込みは別関心・別タスク（テストアカウントは form sync を経由せず D1 へ直接 seed する既存方式を踏襲）。
- 本サイクルは **implemented_local_evidence_captured** であり、実コード差分・seed 再生成・vitest 実行は完了済み。staging apply・commit / PR は user-gated 実行へ委ねる。

## 視覚証跡

visualEvidence: **VISUAL_ON_EXECUTION**（visualEvidenceStatus = `staging_visual_pending_user_gate`）。

本タスクの視覚証跡は Phase 11（`outputs/phase-11/phase-11.md` / `manual-test-result.md`）に定義した公開詳細ページのスクリーンショット EV-01..08 である。implemented_local_evidence_captured の現時点では **未取得（PNG 0）**。local 実装と検証は完了済みだが、staging への seed apply と authenticated / staging スクリーンショット撮影が user-gated であるため runtime 画像は未取得。

- 予約スクリーンショット（pending）: `member-detail-test-mem-06-full.png` ほか EV-01..08（`outputs/phase-11/phase-11.md` §4）。
- capture metadata: 全件 `status=staging_visual_pending_user_gate`。
- 代替証跡（実行まで）: Phase 4 / 6 で設計する adapter/component spec と contract spec（fixture 駆動・staging データ非依存）。
