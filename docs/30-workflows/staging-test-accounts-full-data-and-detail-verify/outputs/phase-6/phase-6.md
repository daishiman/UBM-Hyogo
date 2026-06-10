# Phase 6: テスト拡充（fail path / 回帰 guard）

[実装区分: 実装仕様書] / Task: TASK-STAGING-TEST-ACCOUNTS-FULL-DATA-001

> Phase 4 の happy/正常系を Green にした後、**fail path・回帰 guard・negative（漏洩防止）** を追加して、将来の退行（profile 縮退・visibility 漏洩・drift）を機械的に止める。新規 test ファイルは作らず既存 spec に追記（不変条件 #8）。`STABLE_KEY` 定数経由（不変条件 #7）。

## 6.0 拡充の観点（何を守るか）

| 観点 | 守る退行 | 配置 spec |
|------|----------|-----------|
| 全項目入力の回帰 | 09 の空 optional が誤って response_fields / API view に「空文字行」として出る | contract.spec / build-seed-sql.spec |
| エッジ堅牢性 | 10 の特殊文字/絵文字が SQL エスケープ崩れ・JSON 破損する | contract.spec / build-seed-sql.spec |
| 冪等性 | seed→cleanup→seed の再適用で件数ドリフト・残骸 | contract.spec |
| committed drift | catalog 変更後に生成物再生成を忘れる | contract.spec（byte 一致・既存 it 強化） |
| 公開漏洩 | member/admin 項目が公開 view（response_fields / adapter sections）へ流出 | contract.spec / member-detail.spec |

## 6.1 Lane A: contract.spec.ts 回帰 guard 追加（AC-5, AC-9）

対象: `apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts`（`setupD1`/`execAll`/`env.db.prepare` 再利用）

| テスト名 | 入力 | 期待値 | 観点 |
|----------|------|--------|------|
| `09 の空 optional は response_fields に空文字行すら作らない` | seed 適用後 `SELECT COUNT(*) FROM response_fields WHERE response_id='TEST-RES-09' AND stable_key IN ('motto','hobbies','recentInterest','otherActivities')` | `c === 0`（行が「空文字 value で存在」ではなく **不在**であること。`responseFieldRows` の `Object.hasOwn` フィルタ仕様の固定） | 全項目入力回帰 |
| `09 の必須 public は欠落しない` | `SELECT COUNT(*) FROM response_fields WHERE response_id='TEST-RES-09' AND stable_key IN ('businessOverview','selfIntroduction')` | `c === 2`（空にするのは optional のみ・必須は保持。Phase 3 R 対策） | 全項目入力回帰 |
| `10 の特殊文字 value_json が JSON.parse 可能で破損しない` | `SELECT value_json FROM response_fields WHERE response_id='TEST-RES-10' AND stable_key='urlOthers'` | `JSON.parse(value_json)` が throw せず、`%#&<>` を含む元値を保持 | エッジ堅牢性 |
| `10 の絵文字 selfIntroduction がコードポイント単位で保持される` | `SELECT value_json FROM response_fields WHERE response_id='TEST-RES-10' AND stable_key='selfIntroduction'` | `JSON.parse(value_json)` が `🌊` 等の絵文字を含み、`[...str].length` が途中切れしていない | エッジ堅牢性 |
| `seed→cleanup→seed 後も response_fields の TEST 行数が初回と一致` | seed→COUNT(A)→cleanup→COUNT(0)→seed→COUNT(B) | `A === B` かつ cleanup 後 0（`response_id LIKE 'TEST-RES-%'`） | 冪等性 |
| `cleanup 後 member/admin の answers_json も残骸を残さない` | cleanup 後 `SELECT COUNT(*) FROM member_responses WHERE response_id LIKE 'TEST-RES-%'` | `c === 0`（answers_json に member/admin を入れても cleanup スコープが responseId 基準で全消去・既存 cleanup SQL で担保） | 冪等性 |

## 6.2 Lane A: build-seed-sql.spec.ts negative / 回帰追加（AC-5）

対象: `apps/api/src/testing/test-accounts/__tests__/build-seed-sql.spec.ts`（`sqlFragment` 再利用）

| テスト名 | 入力 | 期待値 | 観点 |
|----------|------|--------|------|
| `全 member の response_fields は 31 キー以外を生成しない` | `buildSeedSql()` | member/admin 5 キー（birthDate/ubmJoinDate/challenges/publicConsent/rulesConsent）について、**全 responseId** で `sqlFragment(resId, key)` を `not.toContain`。`TEST-RES-01`..`TEST-RES-10` をループ。 | 公開漏洩防止 |
| `10 の '（シングルクォート）が '' にエスケープされる` | `buildSeedSql()` | 既存 `[TEST] 山田''太郎😀` の `toContain` に加え、profile 側で `'` を含めた場合も `''` 化を確認 | エッジ堅牢性 |
| `生成 SQL に裸の INSERT INTO が無い（既存退行 guard 維持）` | `buildSeedSql()` | `not.toMatch(/(^|\n)INSERT INTO /)`（既存 L14 を 10 件拡充後も維持） | 退行 guard |

## 6.3 Lane B: member-detail.spec.ts negative / 回帰追加（AC-6）

対象: `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts`

| テスト名 | 入力（fixture） | 期待値 | 観点 |
|----------|------------------|--------|------|
| `member/admin stableKey が sections/linkSections に絶対出ない（network）` | full + partial（consent(admin) / responseEmail(member) / birthDate 等を含めた section を混入） | `[...sections, ...linkSections].flatMap(s=>s.fields)` のどの field も `stableKey ∈ {publicConsent,rulesConsent,responseEmail,birthDate,ubmJoinDate,challenges}` に該当しない | 公開漏洩防止 |
| `partial: 空 optional でも personal 行数が固定（4 件）で消えない` | partial（motto/hobbies 等を fields から除外） | `result.personal.length === PERSONAL_KEYS.length`（=4）。欠落キーは `value===null` で存在 | 全項目入力回帰 |
| `partial: business が空でも example を投げず空文字を返す` | partial（business を全項目入力） | `result.business.canProvide === ""` 等が throw せず空文字（`valueFor` の未定義 → `""`） | 全項目入力回帰 |
| `edge: 長文 businessOverview が trim 以外で切り詰められない` | edge | `result.business.businessOverview` の長さが入力（trim 後）と一致（adapter は要約しない＝表示層の責務） | エッジ堅牢性 |
| `edge: 全 SNS URL kind が links に全件残る（脱落なし）` | edge（URL 系 11 キーを kind:url で配置） | `result.links.length` が URL field 数と一致し、各 `href` が非空 | エッジ堅牢性 |
| `不正な visibility 値混入時も public 以外は除外される（fail-safe）` | full のコピーで 1 field を `visibility:"member"` に改竄 | その field が `sections`/`linkSections` に出ない（adapter L166 二重防御の回帰固定） | 公開漏洩防止 |

> component spec（`apps/web/src/components/public/__tests__/*.spec.tsx`）が存在する場合のみ、partial/edge を渡した描画スナップショット/role 検証を追補（全項目入力の `—` fallback・長文 wrap）。存在しなければ adapter spec で AC-6 を担保（Phase 4 §4.5 と整合）。

## 6.4 committed 生成物 drift guard（AC-4・既存 it の意味づけ強化）

contract.spec の既存 it「committed seed artifacts match the generator byte-for-byte」（L52-56）は、catalog 拡充後に **gen を実行しないと必ず Red になる** drift guard。Phase 6 では追加コード不要だが、以下を運用 guard として明記する:

- catalog.ts を編集したら **必ず** `node --import tsx scripts/gen-test-accounts-seed.mjs` を実行する。
- CI / verify-pr-ready は `--check` 相当で drift 0 を強制（gen-test-accounts-seed.mjs L14-32 の `--check` パス）。
- byte 一致 it は `buildSeedSql()` / `buildCleanupSql()` / `buildManifestJson()` の 3 生成物を同時検証するため、cleanup / manifest の再生成漏れも捕捉する。

## 6.5 実行コマンド

```bash
pnpm exec vitest run apps/api/src/testing/test-accounts --config=vitest.config.ts
pnpm exec vitest run apps/api/migrations/seed/__tests__/test-accounts-seed.contract.spec.ts --config=vitest.d1.config.ts
pnpm exec vitest run apps/web/src/lib/adapters/__tests__/member-detail.spec.ts --config=vitest.config.ts
node --import tsx scripts/gen-test-accounts-seed.mjs --check   # drift 0
```

## 完了条件

1. fail path / 回帰 guard を contract.spec（全項目入力不在・エッジ JSON 健全性・seed→cleanup→seed 冪等）、build-seed-sql.spec（全 responseId で member/admin キー negative・エスケープ・裸 INSERT guard）、member-detail.spec（漏洩 negative・personal 行数固定・全 SNS 脱落なし・fail-safe visibility）に追加する方針を固定した。
2. member/admin 項目が公開 view（response_fields / adapter sections・linkSections）へ流出しない negative test を Lane A / Lane B 両側に配置した（二重防御の回帰固定）。
3. committed 生成物 drift guard（byte 一致 + `--check`）の運用を明記した。
4. 全テストは `*.spec.{ts,tsx}` のみ・`STABLE_KEY` 定数経由（不変条件 #7/#8）。Phase 7（カバレッジ確認）へ進む。
