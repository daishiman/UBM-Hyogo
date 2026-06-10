---
workflow_id: member-data-source-precedence-and-profile-session-fix
phase: 10
name: 最終レビュー
status: completed
decision: APPROVED_FOR_IMPLEMENTATION
updated: 2026-06-09
---

# Phase 10 — 最終レビュー（member-data-source-precedence-and-profile-session-fix）

> 目的: AC-1..AC-9（SSOT §8）の 1 対 1 充足判定、blocker 判定、MINOR 指摘の Phase 12 未タスク化候補列挙、
> 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終評価を行う。
> 本ワークフローは**実装仕様書**であり、AC は「実装時に検証」と明記する（spec 段階では設計到達点を判定）。

---

## 1. AC-1..AC-9 充足判定（1 対 1）

| AC | 内容 | 充足を保証する設計成果物 | spec 段階判定 | 実装時の検証手段 |
|----|------|--------------------------|---------------|------------------|
| **AC-1** | 実ヘッダー33列が正しい stableKey にマップされ `response_fields` に格納（unmapped 0）| Phase 2 §2.3 `DB_FIELD_MAP` 全是正 + `seedMemberFromSheetRow` が `upsertKnownField` で response_fields へ書く（CORR-1 構造修正）| ✅ 設計到達 | `sheets-to-members.spec.ts`（全ラベル）+ `sync-sheets-to-d1.spec.ts`（response_fields 書込）+ 実機 SELECT（Phase 9 §5）|
| **AC-2** | `"同意する（掲載OK）"` → `public_consent=consented`、表記揺れ網羅 | Phase 2 §2.3 `CONSENT_MAP` 実値追加（lowerCase 照合）| ✅ 設計到達 | `sheets-to-members.spec.ts`（consent 真理値）|
| **AC-3** | Sheets seed は未登録 member のみ取込（import-once）+ provenance 記録 | Phase 2 §2.2 import-once ガード（`findIdentityByEmail`）+ §1.3 `markSeedImported`（NULL のみ set）| ✅ 設計到達 | `sync-sheets-to-d1.spec.ts`（既存 skip / 未登録 seed）+ `identities.spec.ts`（no-op 分岐）|
| **AC-4** | Form 再回答は snapshot 更新するが L1 override 済みフィールドの表示は override 維持（DEC-4）| Phase 2 §2.4（Form は override 非 touch）+ §3 projection が override 最優先 | ✅ 設計到達 | `field-precedence.spec.ts`（C1/C2）+ 実機（override→Form 再回答→値維持・Phase 9 §5 AC-5）|
| **AC-5** | admin 編集 → `member_field_overrides` 保存 → 一覧/詳細/マイページ最優先 + 再同期で消えない | Phase 2 §4 `PUT /admin/member-fields` + §1 テーブル（sync が touch しない）+ §3 projection | ✅ 設計到達 | `member-fields.contract.spec.ts`（upsert/clear/audit）+ projection spec + 実機再同期 |
| **AC-6** | `/members`・`/members/[id]`・`/profile` が L1>L2/L3 マージ済み projection を表示・外形契約不変 | Phase 2 §3.2/§3.3/§3.4（3 経路が `field-precedence` を呼ぶ・shape 不変）| ✅ 設計到達 | `list-public-members.spec.ts` / `get-public-member-profile.spec.ts` / `builder.spec.ts`（shape 不変アサート）|
| **AC-7** | `/profile` 汎用エラー解消・会員未登録（管理者等）に適切分岐・500 で詰まらない | Phase 2 §5（session-guard 例外分類 + web 3 分岐 + 401→login 案内）| ✅ 設計到達（真因 A/B 両対応・fail-safe）| `session-guard.spec.ts` + `me/index.contract.spec.ts` + web profile spec + **staging 実機ログ切り分け（Gate-B user-gated・R-4）** |
| **AC-8** | `apps/web` から D1 直接アクセス追加なし・新規 read は既存 transport 経由 | Phase 1 §5.9（`fetchAuthed`/`safeServerFetch`）+ Phase 9 §3 lint-boundaries gate | ✅ 設計到達 | `pnpm lint`（lint-boundaries）+ grep gate |
| **AC-9** | 新規/変更コードは `*.spec.ts` で RED→GREEN・typecheck/lint/vitest 緑・HEX 0 | Phase 7（coverage）+ Phase 9（gate 一式）| ✅ 設計到達 | Phase 9 §4 一括 DoD + `verify:tokens` |

> spec 段階の「✅ 設計到達」= 後続実装者が迷わず GREEN にできる設計が揃っている、の意。実値検証は実装時 / 実機（user-gated）で行う。

---

## 2. blocker 判定

| 項目 | 判定 |
|------|------|
| 設計の循環依存 | なし（Lane A → B/C-1/E 並列 → C-2 → D・Phase 3 §2）|
| 不変条件衝突 | なし（CLAUDE.md #1/#4/#5/#7 整合・Phase 3 §4）|
| 外形契約破壊リスク | なし（public read endpoint shape 不変・AC-6）|
| 未解決でブロックする論点 | なし（Phase 3 §5 R-1..R-5 すべて決定済）|
| 実機依存（user-gated）| AC-7 の staging transport 真因特定（R-4）と migration apply は user-gated だが、**設計は両真因で UX が壊れない fail-safe で完結**しているため blocker ではない |

→ **blocker 0。実装フェーズ（Phase 4 RED → Phase 5 GREEN）へ進行可（APPROVED_FOR_IMPLEMENTATION）。**

---

## 3. MINOR 指摘（Phase 12 未タスク化候補・unassigned-task-guidelines 準拠）

> いずれも本タスクの 1 サイクル完了（CONST_007）を妨げない。**実装をブロックしない**。
> Phase 12 で「current（本サイクルで解消）/ baseline（別タスク候補）」を判定する。

| ID | 指摘 | 区分 | 判断方針 |
|----|------|------|----------|
| **MINOR-1** | label マップを実ラベル直接記述で是正している（不変条件 #1 の「固定しすぎない」に対し将来のラベル変更耐性が弱い）| baseline 候補 | Phase 3 §3 で「汎用 alias テーブル駆動は YAGNI・本タスク非導入」確定済。将来 Form ラベル変更時の alias/questionId 駆動化は別タスク候補（起票は Phase 12 で要否判定）|
| **MINOR-2** | zone/status 値ドメイン正規化が本タスクと `members-search-filter-ux-and-api-fix`（MEMORY 記録）で重複し得る | baseline 候補 | Phase 3 §5 R-3 で「本タスクは取込成立の最小範囲・検索 UI 整形は当該タスク」と境界確定済。重複実装の収斂は当該タスク側で判断 |
| **MINOR-3** | 会員未登録ユーザー（管理者等）の `/profile` 体験が「401→/login + 案内文」に留まる（専用 `MEMBER_UNREGISTERED` 応答は未導入）| current で許容 | Phase 3 §5 R-1 で「`/me` 外形契約を変えない最小変更」確定。`MEMBER_SESSION_404` 分岐は将来の防御コードとして用意済。本サイクル内で UX 閉塞は解消 |
| **MINOR-4** | Sheets seed の `formId`/`revisionId`/`schemaHash` を固定値で埋める（schema_versions 連携なし）| current で許容 | Phase 3 §5 R-2 で確定（seed は表示用 snapshot のみ）。将来 seed の schema 連携が必要になれば別タスク |
| **MINOR-5** | web component coverage 目標を line ≥ 85% としており 100% ではない | current で許容 | behavior（dirty/clear/re-sync）被覆を優先・snapshot 量産回避（Phase 7 §1.3）|

> MINOR は **すべて Phase 3 で決定済の設計判断の裏返し**であり、新規の未解決事項ではない。Phase 12 では基本的に current（本サイクル設計内で解消・別起票不要）と判定する見込み。MINOR-1/MINOR-2 のみ将来タスク候補として記録に残す。

---

## 4. 4 条件 最終評価

| 条件 | 判定 | 根拠（Phase 3 §1 を実装設計到達で再確認）|
|------|------|------|
| **価値性** | ✅ 高 | 取込が現在 SQL レベルで全失敗（CORR-1）＝公開一覧に会員が出ない致命を Lane B が根治。Lane A/C で「管理者が表示を確定でき再同期で消えない」運用価値、Lane E で「マイページが開く」UX 回復。誰の/どのコストを下げるか明確（会員=表示される / 管理者=編集が消えない / 会員=ページが開く）|
| **実現性** | ✅ 適 | 全 Lane が既存 write 関数（`createMemberWithStatus`/`upsertResponse`/`upsertKnownField`/`setConsentSnapshot`）+ 既存 primitive（`FormField`/`useAdminMutation`/`SectionError`）の再利用で実装可能。新規は migration 1・repository 1・純関数 1・route 1・web component 1 に収まる。Phase 7 で coverage 対象が変更ブロックに限定され計測可能。新機構（別 provenance テーブル・汎用 alias）を作らない判断でコスト抑制 |
| **整合性** | ✅ 閉じている | 状態所有権（L1=admin-managed override / L2,L3=response 系 / projection=純関数 state 無し）が矛盾なく分離（Phase 2 §0）。projection を `field-precedence.ts` 1 箇所に集約し 3 経路が呼ぶ（CORR-8・Phase 8 §1 で duplicate 排除を保証）。CLAUDE.md 不変条件 #1/#4/#5/#7 整合（Phase 3 §4）|
| **運用性** | ✅ 破綻なし | import-once は identity 既存性 + provenance 列で冪等。再同期で override 消えない（DEC-4）。public read endpoint 外形契約不変（AC-6）で既存 consumer 非破壊。test は `*.spec.ts` で focused、HEX/D1境界/採番/test-suffix を gate 化（Phase 9 §3）。override 書込は audit_log に残す。migration apply・staging 実機・PR は user-gated で安全に分離 |

→ **4 条件すべて充足。実装フェーズへ進行可。**

---

## 5. 実装フェーズへの申し送り（Phase 4 以降）

- Phase 4（RED）: Phase 7 §2.4 真理値表（C1..C4 / M1..M5）と各 contract（404/200/clear/audit・import-once skip/seed・session-guard 例外分類）を RED で先に書く。
- Phase 5（GREEN）: Lane A（直列ゲート）→ B/C-1/E（並列 wave-1）→ C-2 → D（締め）の topology（Phase 2 §6）。
- Phase 8（リファクタ）: projection 判定が `field-precedence.ts` のみにある grep gate を緑に保つ。
- Phase 9（QA）: §4.1 一括 DoD コマンドを順に緑化。HEX 0 / test-suffix 0 / D1境界 PASS / 採番一意。
- Phase 11（VISUAL）: Lane D のみ VISUAL（admin member-fields editor / 公開一覧・詳細・/profile の merged 表示）。capture metadata `status=pending_runtime_visual`（implemented_local_runtime_pending のため PNG 0 で validator PASS）。
- user-gated: migration apply / staging 実機ログ（AC-7 真因特定・R-4）/ PR / deploy。

> 先送り禁止（CONST_007）: 全 Lane は 1 実装サイクル内で完了。MINOR-1/MINOR-2 のみ Phase 12 で将来タスク要否を判定（本サイクルのスコープ縮小には使わない）。
