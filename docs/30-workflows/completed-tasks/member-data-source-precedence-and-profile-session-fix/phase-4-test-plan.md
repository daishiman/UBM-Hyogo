---
workflow_id: member-data-source-precedence-and-profile-session-fix
phase: 4
name: テスト作成
status: completed
updated: 2026-06-09
---

# Phase 4 — テスト計画（member-data-source-precedence-and-profile-session-fix）

> 正本は `_shared-context.md`（特に §10b CORR-1..8）と `phase-2-design.md`。
> 本 Phase は各 Lane の test suite と expected result（RED→GREEN）を確定させる。
> 新規 test は **`*.spec.ts` のみ**（不変条件 #6 / CLAUDE.md #8。`*.test.*` 禁止）。

---

## 0. TDD RED 前の整合確認（FB-01 / FB-SDK-07-4 / VSCPKR-03）

| 確認項目 | Phase 1-3 の決定 | 本 Phase での扱い | 整合 |
|----------|------------------|-------------------|------|
| repository ファイル命名 | camelCase 多数派（Phase 1 §7）→ `memberFieldOverrides.ts` | spec ファイルも `memberFieldOverrides.spec.ts` | ✅ |
| use-case 純関数命名 | kebab-case（`field-precedence.ts`） | `field-precedence.spec.ts` | ✅ |
| admin route 命名 | kebab-case → `member-fields.ts` | `member-fields.contract.spec.ts`（既存 `*.contract.spec.ts` 命名に合流） | ✅ |
| stableKey 表記 | camelCase 文字列リテラル（`STABLE_KEY.fullName === "fullName"`・Phase 1 §5.10） | テスト fixture も camelCase で書く | ✅ |
| enum 値 | `UbmZoneZ=["0_to_1","1_to_10","10_to_100"]` / `UbmMembershipTypeZ=["member","non_member","academy"]` / consent=`["consented","declined","unknown"]` | 正規化マップの期待値に使用 | ✅ |
| admin field editor の state | `MemberFieldEditor` の編集値は **internal state**（`effectiveValue` prop で初期化・再同期）。Phase 2 §8 | RED は internal state 操作前提で書く（VSCPKR-03） | ✅ |
| `MeSessionResponse` shape | Lane E は `/me` の外形契約を変えない（R-1） | session-guard test は status code のみ検証・body shape 不変 | ✅ |
| 境界値文字列の実文字数 | enum/consent は固定リテラルのため文字数依存なし | length コメント不要 | N/A |
| Vitest 起動前依存整合（FB-MSO-002） | `pnpm install` + esbuild バイナリ整合は worktree 直後に確認 | Phase 4 開始前チェック（§7） | ✅ |

> private method テスト方針（Feedback P0-09-U1-1）: 本タスクに private method テストは無い（全て純関数 export / repository export / route contract）。該当なしを明記する。

---

## 1. Lane 別 test suite と RED→GREEN

### Lane A — データモデル基盤（NON_VISUAL）

| # | spec file（新規） | 対象 | RED（実装前） | GREEN（実装後） |
|---|-------------------|------|---------------|-----------------|
| A-1 | `apps/api/src/repository/memberFieldOverrides.spec.ts` | `upsertOverride` / `listOverridesByMemberId` / `listOverridesByMemberIds` / `deleteOverride` | import 不能（ファイル未存在）→ RED | in-memory D1 fixture で upsert→list が往復し、conflict で更新、delete で消える |
| A-2 | `apps/api/src/repository/identities.spec.ts`（既存に追記 or 新規） | `markSeedImported` / `getSeedProvenance` | 関数未 export → RED | 初回 mark で seed_source 記録、2 回目 mark は no-op（import-once 根拠 / AC-3） |

**A-1 ケース表**:

| ケース | 入力 | 期待 |
|--------|------|------|
| upsert 新規 | `{memberId:m1, stableKey:"fullName", valueJson:'"確定名"', updatedBy:"admin@x"}` | row 1 件・value_json=`'"確定名"'` |
| upsert 既存（conflict） | 同 member/key で value_json 変更 | row 1 件のまま value_json 更新・updated_at 更新 |
| upsert 明示クリア | value_json=null | row 存在・value_json IS NULL |
| listByMemberId | m1 に 3 key | 3 行（stable_key 単位） |
| listByMemberIds（batch） | [m1,m2] それぞれ override 有 | 全 member の行を 1 query で返す（N+1 防止確認） |
| deleteOverride | m1/fullName | 該当 row 物理削除・他 key は残る |

**A-2 ケース表（import-once provenance）**:

| ケース | 前提 | 操作 | 期待 |
|--------|------|------|------|
| 初回 seed mark | identity 有・seed_source IS NULL | `markSeedImported(m1,"sheets","2026-..")` | seed_source="sheets" / seed_imported_at 設定 |
| 二重 mark no-op | seed_source="sheets" 済 | `markSeedImported(m1,"forms",...)` | seed_source は "sheets" のまま（`WHERE seed_source IS NULL` で no-op） |
| getSeedProvenance 未取込 | seed_source NULL | get | `{seedSource:null, seedImportedAt:null}` |
| getSeedProvenance 取込済 | seed_source="forms" | get | `{seedSource:"forms", seedImportedAt:"..."}` |

> migration 適用は user-gated（§6）。spec はテーブル/列が存在する前提（in-memory D1 に 0027 SQL を apply するヘルパー）で書く。

---

### Lane B — 取込是正（NON_VISUAL）

| # | spec file | 対象 | RED | GREEN |
|---|-----------|------|-----|-------|
| B-1 | `apps/api/src/jobs/mappers/sheets-to-members.spec.ts`（既存があれば追記） | `mapSheetRows`（DB_FIELD_MAP / CONSENT_MAP / zone-status 正規化 / 出力 shape） | 旧 map（`"氏名"` 等）前提のテストが新ヘッダーで unmapped → RED | 実ヘッダー 33 列が全て stableKey にマップ・consent 実値ヒット・zone/status enum 化・`SheetSeedRow` shape を返す |
| B-2 | `apps/api/src/jobs/sync-sheets-to-d1.spec.ts`（既存があれば追記） | import-once ガード + `seedMemberFromSheetRow` 経由の `response_fields` 書込 | 旧 `upsertMembers`（存在しない列 INSERT）前提テスト → RED | 既存 identity 有→skip / 無→identity+response+response_fields+consent+provenance を書く |
| B-3 | `apps/api/src/jobs/sync-forms-responses.spec.ts`（既存に追記） | 新規 identity 作成時に `markSeedImported(...,"forms",...)` を 1 回呼ぶ / 既存再回答は import-once でブロックしない | provenance mark 呼び出しが無い → RED | 新規作成パスで mark 1 回・既存再回答は従来通り snapshot 更新 |
| B-4 | `packages/integrations/google/src/forms/mapper.spec.ts`（既存に追記） | `STABLE_KEY_BY_LABEL` の `"X（Twitter）URL"`→urlX / `"その他のSNS・URL"`→urlOthers | 旧 label（`"X URL"`）テスト → RED | 実ヘッダー label で urlX/urlOthers が一致（slug fallback しない） |

**B-1 詳細ケース表**:

| ケース | AC | 入力 | 期待 |
|--------|----|------|------|
| ラベル実ヘッダー一致 | AC-1 | header=§5.1 の 33 列、1 行に全項目 | 31 stableKey + submittedAt/responseEmail が全て map・unmapped 0 |
| 既存一致維持 | AC-1 | `生年月日`/`出身地`/`メールアドレス`/`タイムスタンプ` | birthDate/hometown/responseEmail/submittedAt に map（regression） |
| consent 掲載OK | AC-2 | `ホームページへの掲載に同意しますか？="同意する（掲載OK）"` | publicConsent=`consented`（lowerCase で `"同意する（掲載ok）"` にヒット） |
| consent 規約 | AC-2 | `勧誘ルール・免責事項への同意="同意する"` | rulesConsent=`consented` |
| consent 未知 | AC-2 | `"検討中"` | `unknown`（fallback） |
| zone 正規化 | AC-1/CORR-5 | `UBM区画="0→1"` | answersByStableKey.ubmZone=`"0_to_1"` |
| zone 正規化（他値） | CORR-5 | `"1→10"` / `"10→100"` | `"1_to_10"` / `"10_to_100"` |
| status 正規化 | CORR-5 | `UBM参加ステータス="会員"` | ubmMembershipType=`"member"` |
| 出力 shape | — | 1 行 | `SheetSeedRow`（responseEmail/submittedAt/responseId/answersByStableKey/publicConsent/rulesConsent/extraByLabel） |
| 必須欠落 skip | — | submittedAt or email 欠落 | skipped に reason 記録・rows に含まれない |
| 未知ヘッダー | — | map に無い列に値 | extraByLabel に raw label で格納 |

**B-2 詳細ケース表**:

| ケース | AC | 前提 | 期待 |
|--------|----|------|------|
| import-once skip | AC-3 | `findIdentityByEmail` が既存 identity を返す | seed をスキップ・skipped に `import-once` reason・D1 write 0 |
| 新規 seed 書込 | AC-1 | identity 無 | createMemberWithStatus + upsertResponse + upsertKnownField(×31 程度) + setConsentSnapshot + markSeedImported が呼ばれる |
| response_fields に書く | AC-1/AC-6 | 新規 seed | `response_fields` を read すると stableKey 単位の行が存在（表示経路が読める） |
| provenance | AC-3 | 新規 seed | seed_source="sheets" が記録される |

---

### Lane C — 表示プレシデンス純関数 + admin override 書込 API（NON_VISUAL）

#### C-1: 純関数 `field-precedence.ts`（branch 100% 目標）

`apps/api/src/use-cases/_shared/field-precedence.spec.ts`（新規）。

**`resolveFieldValue(stableKey, overrides, responseFields)` branch 網羅表**:

| # | override に key | override 値 | response に key | response 値 | 期待 | branch |
|---|----------------|-------------|-----------------|-------------|------|--------|
| 1 | 有 | `'"A"'` | 有 | `'"B"'` | `'"A"'` | override 優先（L1>L2/L3） |
| 2 | 有 | `null`（明示クリア） | 有 | `'"B"'` | `null` | override null は clear（`?? null`） |
| 3 | 無 | — | 有 | `'"B"'` | `'"B"'` | response fallback |
| 4 | 無 | — | 無 | — | `null` | どちらも無 |
| 5 | 有 | `'"A"'` | 無 | — | `'"A"'` | override-only key |

**`mergeFieldProjection(fields, overrides)` branch 網羅表**:

| # | fields | overrides | 期待結果 | branch |
|---|--------|-----------|----------|--------|
| 1 | `[{fullName,'"B"'}]` | `{fullName:'"A"'}` | `[{fullName,'"A"',source:"override"}]` | override 上書き |
| 2 | `[{fullName,'"B"'}]` | `{}` | `[{fullName,'"B"',source:"response"}]` | response 維持 |
| 3 | `[{fullName,'"B"'}]` | `{fullName:null}` | `[]`（除外） | null=明示クリア=delete |
| 4 | `[]` | `{nickname:'"N"'}` | `[{nickname,'"N"',source:"override"}]` | override-only key 追加 |
| 5 | `[{a,'"x"'},{b,'"y"'}]` | `{a:null,c:'"z"'}` | `[{b,...response},{c,...override}]` | 複合（clear + 追加 + 維持） |

**`toOverrideMap(rows)`**:

| # | 入力 | 期待 |
|---|------|------|
| 1 | `[{stable_key:"fullName",value_json:'"A"'}]` | `Map{fullName=>'"A"'}` |
| 2 | `[{stable_key:"x",value_json:null}]` | `Map{x=>null}`（key 存在・値 null） |
| 3 | `[]` | 空 Map |

#### C-2: list/detail/builder への適用

| # | spec file | 対象 | RED | GREEN |
|---|-----------|------|-----|-------|
| C-2a | `apps/api/src/use-cases/public/list-public-members.spec.ts`（既存に追記） | override が SUMMARY_KEYS projection に効く | override 未マージ → RED | `fullName` 等が override 値で出る・override 無 member は response 値 / **外形 shape 不変**（keys 同一・AC-6） |
| C-2b | `apps/api/src/use-cases/public/get-public-member-profile.spec.ts`（既存に追記） | detail の fields が merged projection | override 未適用 → RED | override 値で上書き・公開フィルタ（EXISTS/consent/publish）は不変 |
| C-2c | `apps/api/src/repository/_shared/builder.spec.ts`（既存があれば追記/新規） | `buildMemberProfile` / `buildAdminMemberDetailView` の fields に override マージ | override 未適用 → RED | /me/profile と admin detail で override 反映・admin view の source 区別 |

#### C-3: admin override 書込 endpoint contract

`apps/api/src/routes/admin/member-fields.contract.spec.ts`（新規）。`createAdminMemberFieldsRoute()` を `new Hono().route("/admin", ...)` でラップして request（既存 `audit.contract.spec.ts:471` パターン）。

| # | method/path | 前提 | 入力 | 期待 status / body |
|---|-------------|------|------|--------------------|
| C3-1 | `GET /admin/member-fields/:memberId` | identity 有・response_fields 有 | — | 200・`{memberId, fields:[{stableKey,label,overrideValue,responseValue,effectiveValue,hasOverride}]}`（strict） |
| C3-2 | `GET /admin/member-fields/:memberId` | identity 無 | — | 404 |
| C3-3 | `GET` 認証無し | requireAdmin 失敗 | — | 401/403（既存 requireAdmin 挙動） |
| C3-4 | `PUT /admin/member-fields/:memberId` | identity 有 | `{fields:[{stableKey:"fullName",value:"確定名"}]}` | 200・`{memberId, updated:1}`・override 行が書かれる |
| C3-5 | `PUT` クリア | override 有 | `{fields:[{stableKey:"fullName",value:null}]}` | 200・override value_json=null（projection で除外） |
| C3-6 | `PUT` identity 無 | — | 任意 body | 404 |
| C3-7 | `PUT` 不正 stableKey | — | `{fields:[{stableKey:"__bogus__",value:"x"}]}` | 422/400（zod enum reject） |
| C3-8 | `PUT` 空 fields | — | `{fields:[]}` | 422/400（`.min(1)` reject） |
| C3-9 | `PUT` audit append | identity 有 | 正常 PUT | `auditLogProvider.append` が action `admin.member.field_override` で 1 回（before/after に stableKey・actor=admin email） |
| C3-10 | `PUT` member_status 非干渉 | — | 正常 PUT | consent/publish_state は変化しない（AC-5 / member_status は別責務） |

---

### Lane D — Web UI（VISUAL）

| # | spec file | 対象 | RED | GREEN |
|---|-----------|------|-----|-------|
| D-1 | `apps/web/src/components/admin/MemberFieldEditor.spec.tsx`（新規） | フィールド編集フォーム（`FormField` 経由・`useAdminMutation` PUT） | コンポーネント未存在 → RED | initial 値 = `effectiveValue`・編集→PUT body 生成・「同期値に戻す」で value=null・effectiveValue prop 変更で internal state 再同期 |
| D-2 | `apps/web/app/(member)/profile/...`（Lane E と共有・§Lane E） | — | — | — |

**D-1 ケース表（VSCPKR-02 / Feedback STATE-DETAIL-03）**:

| ケース | 期待 |
|--------|------|
| 初期表示 | 各 stableKey の input が `effectiveValue` で初期化（internal state） |
| 値編集 | input 変更で internal state 更新（外部 prop ではない・VSCPKR-03） |
| 保存 | trigger 時に `{fields:[{stableKey,value}]}` を PUT（変更分のみ） |
| 同期値に戻す | value=null を送る |
| effectiveValue prop 再同期 | prop 変更で input 値が追従（`useEffect([effectiveValue])`・STATE-DETAIL-03） |
| `window.api` mock | `Object.defineProperty(window,...)` を使用・`vi.stubGlobal("window",...)` 禁止（VSCPKR-02） |

> 公開一覧/詳細/profile が merged projection を表示することは Lane C の API test（C-2a/b/c）で担保する。Lane D の web 側は「admin 編集 UI が PUT を正しく送る」ことを focused に検証し、公開表示の merge は API 契約レベルで保証する（AC-6）。

---

### Lane E — /profile セッションエラー修正（NON_VISUAL）

| # | spec file | 対象 | RED | GREEN |
|---|-----------|------|-----|-------|
| E-1 | `apps/api/src/middleware/session-guard.spec.ts`（既存があれば追記/新規） | DB 例外時の status 分類（CORR-2） | DB 例外が 500 で正しく分類されることを未保証 → RED | session 未解決→401 / identity or status 無→401（既存維持）/ DB lookup が throw→500（握り潰さない） |
| E-2 | `apps/api/src/routes/me/index.contract.spec.ts`（新規） | `/me` 200 / `/me/profile` 404（PROFILE_UNAVAILABLE） | — | session 通れば `/me`=200・`buildMemberProfile` null で `/me/profile`=404 `{code:"PROFILE_UNAVAILABLE"}` |
| E-3 | `apps/web/app/(member)/profile/page.tsx` の分岐（web spec・既存 profile page spec に追記） | エラーコード別文言分岐（CORR-2） | 全失敗が「時間をおいて」汎用に倒れる → RED | `MEMBER_SESSION_404`→会員未登録案内 / `MEMBER_SESSION_FAILED`→接続失敗文言 / default(500)→汎用 |

**E-1 ケース表（session-guard）**:

| ケース | 前提 | 期待 status | body |
|--------|------|-------------|------|
| 未解決 | resolveSession→null | 401 | `{code:"UNAUTHENTICATED"}` |
| identity 無 | resolveSession→user・identity null | 401 | `{code:"UNAUTHENTICATED"}`（memberId 非露出・#11） |
| status 無 | identity 有・status null | 401 | `{code:"UNAUTHENTICATED"}` |
| deleted | status.is_deleted=1 | 410 | `{code:"DELETED",authGateState:"deleted"}` |
| 正常 | identity+status 有 | next() 実行・user/ctx set | — |
| DB 例外 | `findIdentityByMemberId` が throw | 500（握り潰さず Hono onError へ） | — |

**E-3 ケース表（web profile page・FetchAuthedError mock）**:

| ケース | meResult.error.code | 期待描画 |
|--------|---------------------|----------|
| 会員未登録 | `MEMBER_SESSION_404` | 「会員情報が見つかりませんでした」+ 再ログイン action（`/login?redirect=/profile`） |
| transport 失敗 | `MEMBER_SESSION_FAILED` | 「ただいま接続できません」+ retry |
| 500 | `MEMBER_SESSION_500` | 「セッション情報を取得できませんでした」+ retry（default） |
| 正常 | ok | profile 描画（authenticated root） |

> web profile page の spec は repo root が vitest root のため `--root ../..` 必須（§7）。`AuthRequiredError`（401）は redirect されるため SectionError 分岐の対象外（rethrowOn で再 throw → `redirect("/login...")`）。

---

## 2. 実行コマンド（targeted・全件 run 回避 / FB-UI-02-2）

### API（`cd apps/api`）
```bash
mise exec -- pnpm vitest run \
  src/repository/memberFieldOverrides.spec.ts \
  src/repository/identities.spec.ts \
  src/jobs/mappers/sheets-to-members.spec.ts \
  src/jobs/sync-sheets-to-d1.spec.ts \
  src/jobs/sync-forms-responses.spec.ts \
  src/use-cases/_shared/field-precedence.spec.ts \
  src/use-cases/public/list-public-members.spec.ts \
  src/use-cases/public/get-public-member-profile.spec.ts \
  src/repository/_shared/builder.spec.ts \
  src/routes/admin/member-fields.contract.spec.ts \
  src/routes/me/index.contract.spec.ts \
  src/middleware/session-guard.spec.ts
```

### packages（`cd packages/integrations/google`）
```bash
mise exec -- pnpm vitest run src/forms/mapper.spec.ts
```

### web（`cd apps/web`、`--root ../..` 必須）
```bash
mise exec -- pnpm vitest run \
  'app/(member)/profile' \
  src/components/admin/MemberFieldEditor.spec.tsx \
  --root ../..
```

### migration 検証（user-gated）
```bash
bash scripts/cf.sh d1 migrations list <db>   # 0027 が表示されること（適用後）
# 列存在確認 SQL（Phase 6 §補助 command にも記載）:
#   SELECT name FROM pragma_table_info('member_identities') WHERE name IN ('seed_source','seed_imported_at');
#   SELECT name FROM sqlite_master WHERE type='table' AND name='member_field_overrides';
```

---

## 3. expected result サマリー（RED→GREEN）

| Lane | RED 件数（想定 fail）| GREEN 後 |
|------|----------------------|----------|
| A | A-1（6 ケース）+ A-2（4 ケース）= 10 | 全 pass |
| B | B-1（11）+ B-2（4）+ B-3（2）+ B-4（2）= 19 | 全 pass・既存 sheets/forms spec の旧 map 期待値は新ヘッダーへ更新（Phase 6 §既存テスト影響参照） |
| C | C-1 `resolveFieldValue`（5）+ `mergeFieldProjection`（5）+ `toOverrideMap`（3）+ C-2a/b/c + C-3（10） | 全 pass・純関数 branch 100% |
| D | D-1（6） | 全 pass |
| E | E-1（6）+ E-2 + E-3（4） | 全 pass |

---

## 4. テスト fixture 方針

- in-memory D1: 既存 spec が使う test ctx helper（`ctx({DB})` + better-sqlite3 / Miniflare D1 のいずれか・既存 repository spec の方式に合流）を再利用。0027 migration の DDL を beforeEach で apply。
- `findIdentityByEmail` 等の repository 関数は B-2 / C-3 では**実 D1 fixture**で検証（mock しない・SQL 整合まで確認）。Lane D の web は `window.api` を `Object.defineProperty` で mock（VSCPKR-02）。
- contract test は `Hono` app を直接 request（`app.request("/admin/member-fields/m1", {...})`）。auditLogProvider は fake provider を DI（既存 `member-status.contract.spec.ts` の provider middleware 注入パターン）。

---

## 5. 受入条件との対応

| AC | 担保する test |
|----|---------------|
| AC-1 | B-1（ラベル/正規化）+ B-2（response_fields 書込） |
| AC-2 | B-1（consent 実値） |
| AC-3 | A-2（provenance）+ B-2（import-once skip） |
| AC-4 | C-1（resolveFieldValue override 優先）+ B-3（Form 再回答が override を touch しない） |
| AC-5 | C-3（PUT override）+ C-2c（admin view 反映） |
| AC-6 | C-2a（list 外形不変）+ C-2b（detail）+ C-2c（builder） |
| AC-7 | E-1（session-guard 分類）+ E-3（web 分岐） |
| AC-8 | web spec は `fetchAuthed`/`safeServerFetch` 経由のみ（D1 直接 import が無いことを grep gate・Phase 9） |
| AC-9 | 全 spec が `*.spec.ts(x)`・typecheck/lint/HEX 0 は Phase 9 で gate |

---

## 6. user-gated 項目（本 Phase では実行しない）

- migration の実 apply（`bash scripts/cf.sh d1 migrations apply`）。
- staging 実機での `/me` レスポンス status 切り分け（Lane E phase-1 残課題・Gate-B 時）。
- commit / PR / deploy。

---

## 7. Phase 4 開始前チェック（FB-MSO-002）

```bash
mise exec -- pnpm install            # worktree 直後の依存整合
pnpm verify:vitest-runtime           # arch / worktree isolation / esbuild version の 3 verify
```
esbuild darwin バイナリ mismatch が出たら上記で復旧してから vitest を起動する。
