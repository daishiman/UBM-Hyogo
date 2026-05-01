# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 07c-followup-003-audit-log-browsing-ui |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-05-01 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (API / repository 実装) |
| 状態 | spec_created |

## 目的

Issue #314 の AC を、API contract、repository query、web UI、PII mask、timezone、visual evidence のテストへ分解する。

## 実行タスク

1. `outputs/phase-04/test-strategy.md` に TC-01 以降のテスト一覧を作る
2. repository test に複合 filter / cursor / date range / limit cap を追加する
3. API route test に admin gate、zod validation、empty/error を追加する
4. Web test に filter 保持、JSON 折り畳み、PII mask、read-only DOM を追加する
5. Playwright smoke に desktop / mobile screenshot と axe 相当の a11y 確認を置く

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 既存 test | apps/api/src/repository/__tests__/auditLog.test.ts | repository baseline |
| 既存 fixture | apps/api/src/repository/__fixtures__/admin.fixture.ts | audit seed |
| 既存 admin tests | apps/api/src/routes/admin/attendance.test.ts | admin gate / audit append |
| Playwright | apps/web/playwright/fixtures/auth.ts | admin auth smoke |

## 実行手順

### ステップ 1: API / repository test matrix

| TC | 観点 | 期待 |
| --- | --- | --- |
| TC-01 | `action=attendance.add` | 対象 action のみ |
| TC-02 | actorEmail / targetType / targetId | 単項目 filter が効く |
| TC-03 | JST from/to | UTC 境界で取りこぼしなし |
| TC-04 | limit > 100 | 400 または 100 cap |
| TC-05 | invalid cursor | 400 |
| TC-06 | non-admin | 401/403 |

### ステップ 2: Web / visual test matrix

| TC | 観点 | 期待 |
| --- | --- | --- |
| TC-11 | `/admin/audit` 初期表示 | table + filters |
| TC-12 | filter submit / pagination | query state 維持 |
| TC-13 | JSON collapsed | PII 非表示 |
| TC-14 | JSON expanded | masked PII のみ表示 |
| TC-15 | empty / API error | layout 崩れなし |
| TC-16 | DOM read-only | edit/delete/run ボタンなし |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | API test を先に red にする |
| Phase 6 | Web test / Playwright smoke を red にする |
| Phase 7 | AC matrix へ TC を紐付ける |
| Phase 11 | visual evidence の capture plan |

## 多角的チェック観点（AIが判断）

- PII mask は nested JSON を含める
- timezone は `2026-04-01 00:00` と `2026-04-30 23:59` の境界を fixture に含める
- UI の read-only は見た目だけでなく DOM query で検証する

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | test-strategy 作成 | pending | outputs/phase-04 |
| 2 | API / repository test | pending | apps/api |
| 3 | Web / visual test | pending | apps/web |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | Phase 4 サマリ |
| ドキュメント | outputs/phase-04/test-strategy.md | TC 一覧 |

## 完了条件

- [ ] AC-1〜AC-10 が TC に紐付く
- [ ] API / web / visual の失敗時戻り先が明確
- [ ] PII / timezone / read-only の negative test がある

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] main.md + test-strategy.md 配置
- [ ] artifacts.json の Phase 4 を completed に更新

## 次Phase

次: 5 (API / repository 実装)。

