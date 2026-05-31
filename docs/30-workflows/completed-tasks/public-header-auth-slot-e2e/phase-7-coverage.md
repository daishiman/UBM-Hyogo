# Phase 7 — カバレッジ

## 1. routes × states × DOM selector matrix

| route \ state | guest | member | admin |
|---------------|-------|--------|-------|
| `/`           | TC-G01: `data-auth-state="guest"` + `auth-cta` visible / `member-cta` count=0 | TC-M01: `data-auth-state="member"` + `member-cta` visible | TC-A01: `data-auth-state="admin"` + `member-cta` + `admin-cta` visible |
| `/members`    | TC-G02 同上 | TC-M02 同上 | TC-A02 同上 |
| `/register`   | TC-G03 同上 | TC-M03 同上 | TC-A03 同上 |
| `/privacy`    | TC-G04 同上 | TC-M04 同上 | TC-A04 同上 |
| `/terms`      | TC-G05 同上 | TC-M05 同上 | TC-A05 同上 |
| `/profile`    | TC-G06: `/login` redirect | TC-M06: `data-auth-state="member"` + `a[href="/profile"]` | TC-A06: `data-auth-state="admin"` |
| `/admin`      | TC-G07: `/login` redirect | TC-M07: `/login` redirect | TC-A07: `data-auth-state="admin"` + `public-return` visible |

## 2. DOM 契約属性カバレッジ

| 属性 / selector | カバー TC |
|-----------------|-----------|
| `data-auth-state="guest"` | TC-G01〜TC-G05（5 TC） |
| `data-auth-state="member"` | TC-M01〜TC-M06（6 TC） |
| `data-auth-state="admin"` | TC-A01〜TC-A07（7 TC） |
| `data-role="auth-cta"` | TC-G01（guest 限定可視確認） |
| `data-role="member-cta"` | TC-M01 / TC-A01（可視）+ TC-G01（不在） |
| `data-role="admin-cta"` | TC-A01（可視）+ TC-G01 / TC-M01（不在） |
| `data-role="public-return"` | TC-A07（可視）+ TC-R03（admin shell 専用） |
| header root selector chain | 21 TC すべて |

## 3. redirect カバレッジ

| 起点 state | route | redirect 期待 | カバー TC |
|------------|-------|----------------|-----------|
| guest | `/profile` | `/login` | TC-G06 |
| guest | `/admin` | `/login` | TC-G07 |
| member | `/admin` | `/login` | TC-M07 |

## 4. fail-path カバレッジ

| 種別 | カバー TC |
|------|-----------|
| 無効 cookie | TC-F01 |
| expired JWT | TC-F02 |
| literal regression | TC-R01 |
| selector scope regression | TC-R03 |

## 5. 数値サマリ

| 指標 | 値 |
|------|----|
| TC 総数 | 21 (matrix) + 4 (fail/regression) = **25 TC** |
| routes 網羅 | 7 / 7 = 100% |
| states 網羅 | 3 / 3 = 100% |
| `data-auth-state` literal 網羅 | 3 / 3 = 100% |
| `data-role` 値 網羅 | 4 / 4 = 100% |
| redirect ケース網羅 | 3 / 3 = 100% |

## 6. coverage 未達領域

| 領域 | 未達理由 | 対応 |
|------|----------|------|
| Mobile viewport | 親 workflow の DOM 契約は viewport-agnostic | 本 workflow では非対象（既存 `mobile-webkit` project は契約検証外） |
| 多言語 | プロジェクト i18n 未実装 | 対象外 |
| 視覚的回帰 | NON_VISUAL 区分のため対象外 | `staging-visual` 系は別 workflow |
