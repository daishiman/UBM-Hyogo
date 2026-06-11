# Phase 2: 設計

[実装区分: 実装仕様書] / Task: TASK-STAGING-TEST-ACCOUNTS-FULL-DATA-001

## 2.1 トポロジー（SubAgent lane）

3 並列 lane。validation lane（typecheck/lint/contract/drift）は直列で締める。

```
Lane A (apps/api・主) ─┐
Lane B (apps/web)     ─┼─→ validation lane（直列: typecheck → lint → vitest → gen --check → verify-pr-ready）
Lane C (scripts/手順) ─┘
```

## 2.2 既存コンポーネント再利用可否（FB-SDK-07-1）

| 関心 | 再利用 | 新規 |
|------|--------|------|
| テストアカウント SSOT | `catalog.ts`（profile 拡充のみ） | なし |
| seed 生成 | `build-seed-sql.ts` / `gen-test-accounts-seed.mjs` | なし（構造変更は確認後・原則不要） |
| 公開詳細描画 | adapter + 9 public components（再利用・検証） | なし（ギャップ時のみ既存 primitives で最小修正） |
| fixture | `public-member-profile.ts`（拡充） | なし |
| 適用 CLI | `seed-test-accounts.sh` | なし |

> **新規 UI 実装ゼロ**で品質・アクセシビリティ・HIG 準拠を既存レベルで担保（再利用優先）。

## 2.3 Lane A 設計 — catalog.ts profile 拡充

### データ構造（per-member profile）

`catalog.ts` の各 member は `profile: Partial<Record<StableKey, string>>` 相当を持つ（build-seed-sql が `answersFor` で読む）。拡充方針:

```ts
// 例: TEST-MEM-06（フル・ユーザー目視対象）
profile: {
  [STABLE_KEY.nickname]: "ろくちゃん",
  [STABLE_KEY.location]: "兵庫県淡路市",
  [STABLE_KEY.birthDate]: "1985-07-07",          // member 可視性（データのみ）
  [STABLE_KEY.occupation]: "製造業 / 代表取締役",
  [STABLE_KEY.hometown]: "兵庫県洲本市",
  [STABLE_KEY.ubmJoinDate]: "2023-04",            // member 可視性（データのみ）
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
  // … 全 SNS URL
  [STABLE_KEY.urlOthers]: "Podcast: https://example.com/roku-radio",
  [STABLE_KEY.selfIntroduction]: "淡路島から、ものづくりで地域を元気にします。よろしくお願いします。",
}
```

- **ubmZone / ubmMembershipType**: 既存トップレベルフィールド（`profile` 外）に既に保持。enum 値（`0_to_1` 等 / `member` 等）で投入済。Lane A は enum を表示確認用に多様化（01=`0_to_1`,06=`0_to_1`,07=`1_to_10`,09=`10_to_100`,10=`1_to_10` 等）。
- **充填レベル**: 全 TEST-MEM-01..10 が Google Form 31 stable_key を保持する。公開掲載 5 件は 01/06=フル、07=フル+タグ多数、09=全項目入力+本人写真、10=エッジ（長文日本語・絵文字・特殊文字・全 URL 系キー）として表示バリエーションを持たせる。

### build-seed-sql 確認ポイント（実コード精査で確定・原則無変更）

> Phase 4-6 の実コード精査で確定した事実（当初の想定を補正）:

- `build-seed-sql.ts` は `answers_json` / `response_fields` に全31 stable_key を展開し、同じ revision 用の `schema_questions` 31 行と、member ごとの `member_field_visibility` 31 行を生成する。
- 公開 view は `schema_questions.visibility === "public"` のみを `publicSections` に採用するため、member/admin 項目（birthDate / ubmJoinDate / challenges / publicConsent / rulesConsent）はデータとして保持しつつ公開ページへ漏れない。→ **AC-3（データ投入）と AC-5（漏洩なし）を同時達成**。
- `schema_questions` seed は TEST-REV-ACCOUNTS の公開詳細 API が表示メタデータを取得するために必須。`member_field_visibility` は member 単位の visibility row として併せて投入する。
- consent は `member_status` に投入（UPSERT_COLUMNS は consent 非更新の不変条件 #4 を遵守。consent は build-seed-sql の member_status 生成側で扱う＝既存どおり）。

### 生成物再生成

`node --import tsx scripts/gen-test-accounts-seed.mjs`（既存 gen 経路）で `test-accounts-seed.sql` / `cleanup.sql` / `manifest.json` を上書き再生成。drift guard contract spec が committed 版と byte 一致を検証。

## 2.4 Lane B 設計 — 公開詳細ページ検証 + ギャップ修正

### 検証フロー（verify_existing 主体）

1. adapter `member-detail.ts` が visibility=public 全項目を KIND_ROUTE と stableKey override 通りにセクション割当することを richer fixture で確認。
2. `urlOthers` は paragraph 型だが「その他SNS・URL」として SNS/Web 側に出すため、先頭 URL を抽出して link として扱う。
3. エッジ（10）で長文 wrap・特殊文字エスケープ・全 SNS pill 描画を staging 目視で確認する。

### ギャップ修正方針（発見時のみ・最小差分）

- 表示漏れ（あるはずの public 項目がどのセクションにも出ない）→ adapter の KIND_ROUTE / ASSIGNED_DETAIL_KEYS を最小修正、または `MemberDetailSections`（other fallback）で拾う。
- 表示形態の見た目崩れ → 既存トークン・既存クラスで条件付き描画を調整。
- **新規 primitive・新規 HEX・新規 endpoint は作らない**。

### fixture / spec

- `public-member-profile.ts` を全 public 項目・タグ・出席・写真 URL・SNS/Web link を含む richer fixture へ更新（adapter spec が参照）。
- `member-detail.spec.ts`: 全 public 項目がセクション割当される回帰 + `urlOthers` link routing + member/admin 項目が public view に出ない二重防御。

## 2.5 Lane C 設計 — staging 適用手順（user-gated）

```
# 1. 生成物再生成（Lane A で実施済）
# 2. (user-gated) staging D1 へ適用
scripts/seed-test-accounts.sh --env staging --action apply
# 3. (user-gated) 目視確認
#    https://ubm-hyogo-web-staging.daishimanju.workers.dev/members/TEST-MEM-06
#    + TEST-MEM-01 / 07 / 09 / 10
# 4. (user-gated) スクリーンショット取得 → outputs/phase-11/evidence/
# 5. (任意) 撤去: scripts/seed-test-accounts.sh --env staging --action cleanup
```

## 2.6 状態所有権

| 状態 | 所有者 |
|------|--------|
| アカウント定義（profile データ） | `catalog.ts`（SSOT・apps/api） |
| seed 物理生成物 | `migrations/seed/*`（apps/api・catalog から派生） |
| D1 行 | staging D1（apps/api binding 経由のみ） |
| 表示 view | apps/web adapter + components（API 取得のみ・D1 非接触） |

## 2.7 ライブラリ選定

新規ライブラリ採用なし（既存 zod / vitest / 既存ジェネレータのみ）。

## 完了条件

- 3 lane の責務境界・データ構造・検証/修正フロー・状態所有権を固定。新規依存・新規 API なし。Phase 3 レビューへ。
