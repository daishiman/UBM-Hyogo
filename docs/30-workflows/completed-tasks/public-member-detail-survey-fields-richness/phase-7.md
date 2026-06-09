# Phase 7: テストカバレッジ確認

> **[実装区分: 実装仕様書]**。Phase 6 までで実装した「変更ファイル・変更関数・変更ブロック」に対象を限定してカバレッジを計測し、今サイクルの新規/変更コードが十分に網羅されていることを実測で確認する（FB-BEFORE-QUIT-002 / Feedback 5 準拠）。**全ファイル一律のカバレッジ指定はしない。** 既存の未変更行をカバレッジ目標に含めない。

---

## 1. カバレッジ対象範囲（変更スコープに限定）

今サイクルで新規作成・編集したファイルの「変更した関数・ブロック」のみを計測対象とする。未変更の既存行・型宣言のみのファイルは対象外として明示する。

### Lane A: apps/web（adapter + components）

| 区分 | ファイルパス | カバレッジ対象の関数 / ブロック |
|------|------|------|
| 編集 | `apps/web/src/lib/adapters/member-detail.ts` | `toMemberDetailProps`（セクション再構成の振り分けループ）/ 振り分け述語（hero.hometown 抽出・business・personal・message・links・other-fallback の各分岐）/ visibility filter / url 空除外 / unknown-kind once 通知 |
| 新規 | `apps/web/src/components/public/BusinessOverviewSection.tsx` | businessOverview 空→"—" 分岐 / skills 有無の divider 分岐 / canProvide 有無の divider 分岐 |
| 新規 | `apps/web/src/components/public/PersonalSection.tsx` | KVList 4 行固定描画 / value 空→"—" / `data-stable-key` 焼き込み |
| 新規 | `apps/web/src/components/public/MessageCard.tsx` | message 空→`null` 早期 return / accent-soft + serif 構造描画 |
| 編集 | `apps/web/src/components/public/ProfileHero.tsx` | hometown chip 有無分岐 / 空 chip 非表示（zone/status/location/hometown）/ Avatar `size="xl"` 適用 |
| 編集 | `apps/web/src/components/public/MemberDetail.tsx` | proto 順の組み立て / `message` 有無で MessageCard 出し分け / `other.length>0` で MemberDetailSections 出し分け |
| 編集 | `apps/web/src/components/public/MemberDetailSections.tsx` | other フォールバック renderer への転用部分（`other` セクション群の KV 描画。空セクション非表示分岐） |
| 編集（最小） | `apps/web/src/components/public/MemberLinks.tsx` | props 形状を新 `links`（`{stableKey,label,href}`）へ調整した部分（empty→`null` 分岐 / pill 描画） |

### Lane B: apps/api（seed builder）

| 区分 | ファイルパス | カバレッジ対象の関数 / ブロック |
|------|------|------|
| 編集 | `apps/api/src/testing/test-accounts/build-seed-sql.ts` | `answersFor`（member.profile マージ + 必須 3 項目 + notificationOptOut 後方互換分岐）/ `responseFieldRows`（`Object.keys(answersFor(member))` 可変生成）/ `searchTextFor`（profile 主要テキスト連結の追加分岐がある場合） |
| 編集 | `apps/api/src/testing/test-accounts/catalog.ts` | `TestMemberAccount.profile?` 追加部分（型宣言のみ＝実行コードなし。**カバレッジ対象外**だが TEST-MEM-01 の全項目 profile が build-seed-sql spec 経由で間接的に到達することを確認） |

### 対象外（明示）

| ファイルパス | 対象外理由 |
|------|------|
| `apps/web/src/components/public/MemberTags.tsx` | 隣接配置のみで内部ロジック非変更。既存 spec のカバレッジ維持を確認するに留める |
| `apps/web/src/components/public/MemberActivity.tsx` | 参加履歴は流用（renderValue 共通化は Phase 8 のリファクタ対象。本 Phase では振る舞い非変更ゆえカバレッジ目標に含めない） |
| `apps/web/src/styles/globals.css` | CSS（実行コードなし）。原則追加なし。表示は Phase 11 視覚で確認 |
| `apps/api/src/testing/test-accounts/catalog.ts` の型宣言行 | `profile?` 型追加は宣言のみ |
| `apps/web/app/(public)/members/[id]/page.tsx` の mount 行 | Server Component の mount は Phase 11 視覚。adapter/component 本体で網羅 |

---

## 2. カバレッジ計測対象と目標（変更関数ごと）

### 2.1 adapter（`member-detail.ts` の `toMemberDetailProps` 振り分け）

| 計測観点 | 目標 | 根拠 |
|------|------|------|
| line coverage（`toMemberDetailProps` + 振り分け述語） | ≥ 95% | pure 関数で分岐が直線的。spec で全セクション割当を網羅可能 |
| branch coverage（振り分け各分岐） | **100%** | 振り分けは AC-1〜AC-8 の中核。全 first-match 分岐 + other-fallback else 到達を必須とする |

カバレッジ確認対象の分岐（first-match 順）:

```
toMemberDetailProps — field 振り分け
├── field.visibility !== "public" → 除外（AC-8 二重防御）★必須到達
├── FieldKindZ.safeParse 失敗 → onUnknownKind once 通知 + skip
├── kind === "url"
│     ├── value 空文字 → links から除外 ★必須到達
│     └── value 有 → links 追加
├── stableKey ∈ BUSINESS_KEYS → business[key]（3 キーそれぞれ到達）
├── stableKey ∈ PERSONAL_KEYS → personal KV（renderValue 済み）
├── stableKey === MESSAGE_KEY → message
├── stableKey ∈ HERO_EXTRA_KEYS（hometown）→ hero.hometown 抽出 ★有/無 両到達
├── stableKey ∈ SUMMARY_KEYS → 破棄（summary が正本）
└── それ以外（未割当 public field） → other フォールバック ★必須到達（AC-7）

personal 4 行固定生成
├── PERSONAL_KEYS の field 存在 → value=renderValue 済み
└── PERSONAL_KEYS の field 不在 → value="—" の行を出す ★必須到達

hero summary コピー
└── profile.summary の 6 項目を直接コピー（hometown のみ手順 4 抽出値、無ければ ""）
```

> **other-fallback 分岐到達の確認**（AC-7）: 「BUSINESS/PERSONAL/MESSAGE/HERO_EXTRA/SUMMARY/url のいずれにも該当しない visibility=public field」を含む fixture を 1 件用意し、`other` 配列に集約されることを branch coverage 上で到達済みとする。

### 2.2 BusinessOverviewSection（新規）

| 計測観点 | 目標 | 根拠 |
|------|------|------|
| line coverage | ≥ 90% | dumb component。divider 分岐のみ |
| branch coverage | ≥ 90% | businessOverview 空→"—" / skills 有無 / canProvide 有無 の 3 分岐 |

```
BusinessOverviewSection
├── businessOverview === "" → "—" 表示 / 非空 → 本文
├── skills === "" → divider+小見出し非表示 / 非空 → 「得意分野・スキル」ブロック
└── canProvide === "" → divider+小見出し非表示 / 非空 → 「提供できること」ブロック
```

### 2.3 PersonalSection（新規）

| 計測観点 | 目標 | 根拠 |
|------|------|------|
| line coverage | ≥ 90% | KVList map のみ |
| branch coverage | ≥ 90% | value 空→"—" / 非空→値、`data-stable-key` 焼き込み |

```
PersonalSection
├── rows 4 行を kv-list で描画（hobbies/recentInterest/motto/otherActivities）
├── row.value === "" → "—"
└── 各 row に data-stable-key（不変条件 #1）★必須到達
```

### 2.4 MessageCard（新規）

| 計測観点 | 目標 | 根拠 |
|------|------|------|
| line coverage | ≥ 95% | 早期 return + 単一構造 |
| branch coverage | **100%** | message 空→`null` / 非空→accent-soft+serif の 2 分岐のみ。両到達必須 |

```
MessageCard
├── message === "" → return null（AC-5 セクション非表示）★必須到達
└── message 非空 → <section accent-soft><p serif>「{message}」</p></section> ★必須到達
```

### 2.5 ProfileHero（編集: hometown 追加）

| 計測観点 | 目標 | 根拠 |
|------|------|------|
| line coverage（変更ブロック） | ≥ 90% | chip-row + avatar の宣言的描画 |
| branch coverage（chip 有無） | ≥ 90% | zone / status / location / hometown の各空チェック分岐 |

```
ProfileHero — chip-row
├── ubmZone null/"" → zone chip 非表示 / 有 → 表示
├── ubmMembershipType null/"" → status chip 非表示 / 有 → 表示
├── location "" → location chip 非表示 / 有 → 表示
├── hometown "" → hometown chip 非表示 / 有 → 「出身 {hometown}」chip（data-key="hometown"）★有/無 両到達
└── Avatar size="xl" 適用（lg からの変更を確認）
```

### 2.6 MemberDetail（編集: 組み立て）

| 計測観点 | 目標 | 根拠 |
|------|------|------|
| line coverage（組み立て） | ≥ 85% | 出し分け 2 分岐 |
| branch coverage | ≥ 85% | message 有無 / other 有無 |

```
MemberDetail
├── message !== "" → <MessageCard> 描画 / "" → 非描画 ★両到達
├── other.length > 0 → <MemberDetailSections sections={other}> / 0 → 非描画 ★両到達
└── proto 順（Hero→grid-2[business│tags+links]→personal→message→other→activity）
```

### 2.7 build-seed-sql（編集: 動的化）

| 計測観点 | 目標 | 根拠 |
|------|------|------|
| line coverage（`answersFor`/`responseFieldRows`） | ≥ 95% | 純テキスト生成。分岐は profile 有無のみ |
| branch coverage | **100%** | profile 指定 member / profile 未指定 member（後方互換）の 2 分岐両到達 |

```
answersFor(member)
├── member.profile あり → profile を基底に必須3項目(fullName/occupation/ubmZone)+notificationOptOut マージ ★TEST-MEM-01 で到達
└── member.profile なし → 従来の最小3項目+notificationOptOut（後方互換）★既存 member で到達

responseFieldRows
└── Object.keys(answersFor(member)) で member ごと可変行生成（TEST-MEM-01 は全 stableKey 行）

sqlString エスケープ
└── value 内の単一引用符 '' エスケープ（SQL injection 安全性）★profile 値に ' を含む fixture で到達
```

---

## 3. カバレッジ取得コマンド（targeted / --coverage）

> **メモリ制約（FB-UI-02-2）**: 全件 `pnpm test` ではなく、変更スコープに対する targeted run + `--coverage.include` でファイルを絞る。`mise exec --` 経由で Node 24 を保証する。

### Lane A: adapter

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --coverage \
  --coverage.include="src/lib/adapters/member-detail.ts" \
  src/lib/adapters/__tests__/member-detail.spec.ts
```

### Lane A: 新規/編集 components

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --coverage \
  --coverage.include="src/components/public/BusinessOverviewSection.tsx" \
  --coverage.include="src/components/public/PersonalSection.tsx" \
  --coverage.include="src/components/public/MessageCard.tsx" \
  --coverage.include="src/components/public/ProfileHero.tsx" \
  --coverage.include="src/components/public/MemberDetail.tsx" \
  --coverage.include="src/components/public/MemberDetailSections.tsx" \
  --coverage.include="src/components/public/MemberLinks.tsx" \
  src/components/public/__tests__
```

### Lane A: adapter + components まとめて（1 コマンド確認用）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --coverage \
  --coverage.include="src/lib/adapters/member-detail.ts" \
  --coverage.include="src/components/public/BusinessOverviewSection.tsx" \
  --coverage.include="src/components/public/PersonalSection.tsx" \
  --coverage.include="src/components/public/MessageCard.tsx" \
  --coverage.include="src/components/public/ProfileHero.tsx" \
  --coverage.include="src/components/public/MemberDetail.tsx" \
  --coverage.include="src/components/public/MemberDetailSections.tsx" \
  --coverage.include="src/components/public/MemberLinks.tsx" \
  src/lib/adapters/__tests__/member-detail.spec.ts \
  src/components/public/__tests__
```

### Lane B: build-seed-sql

```bash
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run \
  --coverage \
  --coverage.include="src/testing/test-accounts/build-seed-sql.ts" \
  src/testing/test-accounts/__tests__/build-seed-sql.spec.ts
```

> HTML レポートは各 package の `./coverage/index.html` で確認可能。CI のモノリポ全体 coverage gate（`scripts/coverage-guard.sh`）とは独立して、変更ファイル限定で確認する。全体 gate の閾値は変更しない。

---

## 4. concern × dependency edge の coverage 可視化表

adapter（振り分け責務）→ component（描画責務）→ seed（確認データ責務）の責務境界ごとに、どの edge をどの spec で覆うかを明示する。

| concern | dependency edge | カバレッジ確認方法 |
|------|------|------|
| visibility 二重防御 | adapter `visibility!=="public"` 除外 → component に member/admin field が渡らない | `member-detail.spec.ts`：member/admin field 混入 fixture で `hero/business/personal/message/other` いずれにも現れないことを assert（AC-8） |
| hometown 抽出 | adapter publicSections → `hero.hometown` → `ProfileHero` chip | `member-detail.spec.ts`（抽出）+ `ProfileHero.spec.tsx`（chip 有無描画）（AC-1） |
| business サブ見出し | adapter `business{overview,skills,canProvide}` → `BusinessOverviewSection` divider 分岐 | `BusinessOverviewSection.spec.tsx`：skills/canProvide 有無で divider 出し分け（AC-2） |
| personal 4 行固定 | adapter PERSONAL_KEYS 順生成 → `PersonalSection` KVList | `member-detail.spec.ts`（4 行・空→"—"）+ `PersonalSection.spec.tsx`（`data-stable-key`）（AC-4） |
| message accent カード | adapter `message` → `MessageCard` 空→null | `MessageCard.spec.tsx`：空→null / 非空→serif（AC-5） |
| url links 抽出 | adapter `kind==="url"` かつ非空 → `links` → `MemberLinks` pill | `member-detail.spec.ts`：url 空除外 + 非 url 除外 / `MemberLinks.spec.tsx`：pill 描画（AC-3） |
| other-fallback | adapter else → `other` → `MemberDetailSections` 汎用 KV | `member-detail.spec.ts`：未割当 public field が `other` に集約（AC-7） |
| proto 表示順 | adapter props → `MemberDetail` 組み立て順 | `MemberDetail.spec.tsx`：DOM 順序 assert（Hero→grid-2→personal→message→other→activity）（AC-6） |
| seed 全項目 | `catalog.TEST-MEM-01.profile` → `answersFor` → `responseFieldRows` → response_fields 行 | `build-seed-sql.spec.ts`：TEST-MEM-01 が visibility=public 全 stableKey の行を生成（AC-9） |
| seed 後方互換 | profile 未指定 member → `answersFor` 従来 3 項目 | `build-seed-sql.spec.ts`：既存 member は 3 項目のまま |

---

## 5. カバレッジ未達時の対応方針（Phase 6 への戻り判定基準）

| ケース | 判定 | 対応 |
|------|------|------|
| adapter 振り分け branch < 100% | **Phase 6 へ戻る** | 未到達分岐（特に other-fallback else / hometown 無 / url 空除外 / visibility 除外）の fixture を `member-detail.spec.ts` に追加してから再計測 |
| MessageCard branch < 100% | **Phase 6 へ戻る** | 空→null と 非空→serif の両ケースを `MessageCard.spec.tsx` に追加 |
| build-seed-sql branch < 100% | **Phase 6 へ戻る** | profile あり（TEST-MEM-01）/ profile なし（既存 member）の両 fixture を `build-seed-sql.spec.ts` で網羅 |
| component line < 90%（divider/chip 分岐） | Phase 6 で補完 | skills/canProvide/hometown の有無パターンを spec に追加 |
| 未到達行が「runtime/binding 依存で到達困難」 | 許容（記録） | 該当行に `// coverage: <理由>` を付し、本 Phase 完了条件に除外理由を記録（本タスクは pure 関数 + jsdom 描画ゆえ原則発生しない想定） |

> **戻り基準の明文化**: 「branch 100% を必須」とした 3 箇所（adapter 振り分け / MessageCard / build-seed-sql）のいずれかが未達なら Phase 6 のテスト拡充へ戻る。それ以外の line/branch 目標未達は Phase 6 で補完してから Phase 8 へ進む。

---

## 完了条件（Phase 7）

- [ ] adapter `toMemberDetailProps` 振り分けの **branch coverage 100%** を実測で確認している（visibility 除外 / url 空除外 / hometown 有無 / other-fallback else を含む全 first-match 分岐に到達）
- [ ] adapter の line coverage ≥ 95% を実測で確認している
- [ ] MessageCard の branch coverage **100%**（空→null / 非空→serif 両到達）を実測で確認している
- [ ] BusinessOverviewSection / PersonalSection / ProfileHero / MemberDetail の line/branch 目標（§2）を実測で確認している
- [ ] build-seed-sql `answersFor` / `responseFieldRows` の **branch coverage 100%**（profile 有/無 両到達）を実測で確認している
- [ ] §4 の concern × edge 表の各 edge が対応 spec で到達済みであることを確認している
- [ ] 未達分岐がある場合、§5 の判定に従い Phase 6 へ戻して補完済み、または除外理由を記録済みである
- [ ] §3 の targeted `--coverage` コマンドで計測しており、モノリポ全体 gate の閾値は変更していない

## メタ情報
workflow_state: `implemented_local_visual_present_staging_pending` / taskType: `implementation` / visualEvidence: `VISUAL`

## 目的
変更ファイル限定で adapter の振り分け分岐・各 component の空項目分岐・seed の後方互換分岐の coverage を実測し、AC-1〜AC-9 の中核分岐に未検証箇所がない状態にする。

## 実行タスク
- adapter / 新規 component / build-seed-sql の coverage を targeted で測定する。
- branch 100% 必須 3 箇所が未達なら Phase 6 へ戻して補完する。

## 参照資料
- `phase-6.md`
- `phase-2.md`（§3 振り分けアルゴリズム / §9 テスト設計概要）

## 成果物
- Phase 7 coverage 確認仕様

## 統合テスト連携
Phase 9 の品質ゲートは本 Phase の coverage 結果（特に adapter 振り分け branch 100%）を前提にする。
