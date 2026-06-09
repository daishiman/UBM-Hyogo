# Phase 10: 最終レビューゲート

> 本 phase-10.md は最終レビューゲートの判定仕様である。今回サイクルで Phase 5〜9 の local 実装・focused tests と Phase 11 local screenshots は完了済み。authenticated staging screenshot と PR は user-gated として分離する。

---

## 0. ゲートの目的

Phase 4〜9（テスト作成 / 実装 / テスト拡充 / カバレッジ / リファクタ / 品質保証）の完了後、AC-1〜AC-10 が証跡で裏取りできるかを確定し、Phase 11（VISUAL 手動検証）へ進めてよいかを判定する。判定は **AC 充足表 + proto 整合チェック + blocker/MAJOR/MINOR 分類** の 3 段で行う。

---

## 1. AC 充足判定様式（AC ↔ 証跡 対応表）

各 AC は、対応する自動テスト（spec）またはコード grep gate のいずれかで「機械的に裏取り可能」であること。Phase 11 視覚証跡は補強であり、ここでの PASS 根拠は spec/grep を一次とする。

| AC | 充足条件（PASS） | 一次証跡（spec / grep） | 補強証跡（Phase 11） |
| -- | ---------------- | ----------------------- | -------------------- |
| AC-1 | Hero が avatar(xl)・氏名・nickname・occupation・location + ubmZone / ubmMembershipType / location / hometown chip を表示。空項目は chip 非表示 | `ProfileHero.spec.tsx`（hometown 有/無、空 chip 非表示、`size="xl"` 検証） | `member-detail-full.png` |
| AC-2 | BUSINESS OVERVIEW が businessOverview 本文（空時 "—"）+ skills + canProvide をサブ見出し付き表示。skills/canProvide 空はブロック非表示 | `BusinessOverviewSection.spec.tsx`（divider 分岐 / "—" フォールバック） | `member-detail-full.png` |
| AC-3 | TAGS + SNS/WEB が tags chip 群（空時「タグ未設定」）と url リンク pill 群を表示 | `MemberTags.spec.tsx` / `MemberLinks.spec.tsx` + adapter `links`（url kind のみ・空値除外） | `member-detail-full.png` |
| AC-4 | PERSONAL が hobbies / recentInterest / motto / otherActivities の KVList 4 行を表示 | `PersonalSection.spec.tsx`（4 行常時 / 空値 "—" / `data-stable-key`） | `member-detail-full.png` |
| AC-5 | MESSAGE が selfIntroduction を accent-soft 引用カード（serif）で表示。空時セクション非表示 | `MessageCard.spec.tsx`（空→`null` / serif・accent-soft 構造） | `member-detail-full.png` / `member-detail-message-hidden.png` |
| AC-6 | 表示順が proto 準拠（戻る→Hero→[BUSINESS OVERVIEW │ TAGS+SNS]→PERSONAL→MESSAGE→参加履歴） | `MemberDetail.spec.tsx`（子要素の DOM 出現順アサート） | `member-detail-full.png` |
| AC-7 | 固定割当外の public field（urlOthers / 将来追加項目）が「その他」フォールバックに表示され取りこぼさない | `member-detail.spec.ts`（other-fallback ケース：未割当 public field が `other` に流れる） | `member-detail-sparse.png` 不要（adapter 単体で裏取り） |
| AC-8 | member/admin visibility 項目（birthDate / ubmJoinDate / challenges / publicConsent / rulesConsent / responseEmail）が公開ページに出ない | `member-detail.spec.ts`（visibility filter ケース：`visibility!=="public"` 除外） | — |
| AC-9 | `TEST-MEM-01` seed が visibility=public 全項目を持ち、`buildSeedSql` 出力に全 stableKey の response_fields 行が含まれる | `build-seed-sql.spec.ts`（TEST-MEM-01 全 stableKey 行生成 / 後方互換 / field_count 整合） | `member-detail-full.png`（staging apply 後） |
| AC-10 | API endpoint surface 不変・D1 schema 不変・Form schema 不変・HEX 直書き 0 | `git diff` で `apps/api/src/routes/` / migration / form schema に変更 0 件 + `verify-design-tokens` green + HEX grep 0 件 | — |

> **判定ルール**: AC ごとに「一次証跡が green（PASS）」であることをゲート owner が確認する。一次証跡が存在しない・fail している AC は当該 AC を未充足とみなし、その重大度（下記 §2）に応じて差し戻す。

---

## 2. blocker / MAJOR / MINOR 判定基準

| 重大度 | 定義 | 例 | 対応 |
| ------ | ---- | -- | ---- |
| **blocker** | 不変条件違反 / AC の中核未達で、その状態を staging に出すとプライバシーや契約破壊が起きる | AC-8 visibility leak（member/admin 項目が公開表示）/ AC-10 endpoint・D1・Form schema 変更が混入 / HEX 直書き残存で `verify-design-tokens` fail | **即 FAIL**。原因 Phase（§4）へ差し戻し。修正まで Phase 11 進行禁止 |
| **MAJOR** | AC の機能未達だがプライバシー・契約破壊は無い | AC-1〜AC-7 のいずれかのセクション構造未実装 / proto 表示順崩れ / other-fallback 欠落で公開 field 取りこぼし / AC-9 seed が全項目を持たない | **FAIL**。原因 Phase へ差し戻し。修正後に再ゲート |
| **MINOR** | 今回サイクルの完了を阻害せず、別ワークフロー / バックログで回収可能 | visual baseline 自動更新の整備（M-1）/ 他公開テストメンバーの profile 充実度（M-2）/ proto の `vertical`・`split2` Hero レイアウト切替（既定 `hero` のみ実装で十分） | **PASS 可**。Phase 12 の未タスク検出で baseline 項目として記録（起票判断は Phase 12） |

> MINOR は Phase 12（`unassigned-task-detection.md`）で baseline として記録する。phase-3.md の M-1 / M-2 を引き継ぐ。今回サイクルでは起票必須化しない。

---

## 3. proto 整合チェック（5 セクション構成 / 表示順 / 空項目分岐）

`docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx` L338-470 / `specs/09e-screen-blueprints-public.md` §3 を正本に、以下を確認する。

### 3.1 5 セクション構成の存在

| # | proto セクション | 確認 data 属性 | PASS 条件 |
| - | ---------------- | -------------- | --------- |
| 1 | Hero | `data-component="profile-hero"` | eyebrow `MEMBER PROFILE` / Avatar xl / chip-row 存在 |
| 2 | BUSINESS OVERVIEW | `data-component="business-overview"` | eyebrow `BUSINESS OVERVIEW` / h-section `ビジネス概要` |
| 3 | TAGS + SNS/WEB | `data-component="tags-links"`（MemberTags + MemberLinks 内包） | tags chip 群 + links pill 群が同一カードに隣接 |
| 4 | PERSONAL | `data-component="personal-section"` | eyebrow `PERSONAL` / kv-list 4 行 |
| 5 | MESSAGE | `data-component="member-message"` | accent-soft + serif の引用カード |

### 3.2 表示順チェック（AC-6）

`MemberDetail.spec.tsx` で、DOM 上の出現順が次であることをアサート:

```
back → profile-hero → grid-2(business-overview, tags-links) → personal-section → member-message(有時) → member-detail-sections(other, 有時) → member-activity
```

### 3.3 空項目分岐チェック

| 項目 | 空のときの期待挙動 | 確認 spec |
| ---- | ------------------ | --------- |
| hometown 無 | Hero に hometown chip を出さない | `ProfileHero.spec.tsx` |
| businessOverview 無 | "—" を表示（ブロックは残す） | `BusinessOverviewSection.spec.tsx` |
| skills / canProvide 無 | 当該サブブロック（divider 含む）を出さない | `BusinessOverviewSection.spec.tsx` |
| personal 行値 無 | 行は出すが value は "—"（KVList 4 行常時） | `PersonalSection.spec.tsx` |
| selfIntroduction 無 | MESSAGE セクション全体を出さない（`null`） | `MessageCard.spec.tsx` |
| url 値 空文字 | links から除外 | `member-detail.spec.ts` |
| other 0 件 | フォールバックセクションを出さない | `MemberDetail.spec.tsx` |

---

## 4. ゲート PASS 条件と FAIL 時の差し戻し先

### 4.1 PASS 条件（全充足で Phase 11 進行可）

1. AC-1〜AC-10 の一次証跡がすべて green（§1）。
2. proto 整合チェック（§3.1〜§3.3）がすべて満たされる。
3. blocker 0 件・MAJOR 0 件。MINOR は記録のみで PASS を阻害しない。
4. targeted test（Lane A: adapter + public components / Lane B: build-seed-sql）が green。
5. 不変条件（API endpoint 不変 / D1 web 直アクセス無 / OKLch・HEX 0 / 新規 primitive 無 / visibility 二重防御 / stableKey 定数経由）違反 0 件。

### 4.2 FAIL 時の差し戻し先

| 失敗カテゴリ | 差し戻し Phase |
| ------------ | -------------- |
| adapter のセクション振り分け / visibility filter / other-fallback の不備（AC-7/AC-8） | Phase 5（実装）→ Phase 4 のテストが網羅していなければ Phase 4 |
| component のセクション構造・空項目分岐（AC-1〜AC-5） | Phase 5（実装） |
| 表示順崩れ（AC-6） | Phase 5（MemberDetail 組み立て） |
| seed の全項目化不足（AC-9） | Phase 5（Lane B build-seed-sql / catalog） |
| テスト網羅不足（証跡が一次にならない） | Phase 4（テスト作成）/ Phase 6（テスト拡充） |
| HEX 直書き残存・トークン違反（AC-10） | Phase 8（リファクタ）/ Phase 9（品質保証） |
| endpoint / D1 / Form schema 混入（AC-10・不変条件違反） | Phase 2（設計）に戻し、スコープ逸脱を排除 |

> 差し戻しは原因 Phase へ戻り、修正後に本ゲート（Phase 10）を再実行する。Phase 11 は本ゲート PASS 後にのみ着手する。
