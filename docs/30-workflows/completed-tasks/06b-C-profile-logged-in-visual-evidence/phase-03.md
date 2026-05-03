# Phase 3: 設計レビュー — 06b-C-profile-logged-in-visual-evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-C-profile-logged-in-visual-evidence |
| phase | 3 / 13 |
| wave | 6b-fu |
| 作成日 | 2026-05-03 |
| taskType | implementation-spec |

## 目的

Phase 2 設計を 30-method 観点で多角レビューし、漏れ・矛盾・リスクを除去して GO/NO-GO を判定する。

## 実行タスク

1. システム正本仕様（06-member-auth / 07-edit-delete）との整合をレビューする。
2. invariant #4 / #5 / #8 / #11 を selector / 命名 / 配置から再検査する。
3. staging 操作のリスク（誤って production を叩く / Magic Link 漏洩 / storageState 流出）を列挙する。
4. 06b-A / 06b-B との実依存順を再確認する。
5. GO / NO-GO 条件を確定する。

## 参照資料

- Phase 2 outputs/main.md
- `docs/00-getting-started-manual/specs/06-member-auth.md` §session, §logout
- `docs/00-getting-started-manual/specs/07-edit-delete.md` §self-service, §admin-restriction
- 30-method skill: `.claude/skills/automation-30/`

## 実行手順

### 3.1 30-method の中で本タスクに関連する観点

| 観点 | 検査内容 |
| --- | --- |
| 矛盾なし | 「read-only を実画面で確認する」目的と「Playwright spec/script 追加」の手段が矛盾していないこと |
| 漏れなし | M-08〜M-10 / M-14〜M-16 全てに evidence path が紐付いていること |
| 整合性 | DOM selector が `apps/web/app/profile/**` の現行 markup（`page.tsx`、`_components/`）と一致していること |
| 依存関係整合 | 06b-A の auth fixture 未導入時の代替手順が記載されていること |
| 安全性 | baseURL に production を渡す経路が遮断されていること（CI で `staging` 以外を reject） |
| 再現性 | 同じ storageState で異なる viewport の screenshot が安定して取れる手順か |
| 観測可能性 | DOM dump JSON で 0 件であることが後追い検証できるか |

### 3.2 リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| baseURL 誤指定で production を叩く | 重大 | capture script で `--base-url` が `staging` を含むかチェック、含まなければ exit 1 |
| storageState の git コミット | 重大（session token 流出） | `.gitignore` に `apps/web/playwright/.auth/*.json` を明示、CI で `git ls-files` チェック |
| screenshot に email が写る | 中 | redaction を screenshot 取得「前」に強制。spec 内で `await maskPII(page)` を beforeScreenshot fixture 化 |
| Playwright flaky | 低 | `domcontentloaded` 待機 + `waitForSelector('[data-testid="profile-root"]')` |
| 申請 UI の button が submit と誤検知 | 中 | selector で `[data-testid="request-action-panel"]` 配下を除外する |

### 3.3 GO / NO-GO

- GO 条件: 上記 7 観点と 5 リスクすべてに対策が記述されていること、Phase 2 設計表が更新されていること。
- NO-GO 条件: 上記いずれか未対応 / `apps/web/app/profile/**` への変更が設計に紛れている / production を叩く経路が残っている。

## 統合テスト連携

- Phase 4 へ: 観点・selector の最終形を引き渡す。
- 09a staging visual smoke へ: 本 spec を流用する場合の継承点を Phase 12 で記録。

## 多角的チェック観点

- 設計レビューが Phase 2 を上書きせず、別文書として残るか
- 30-method のうち本タスクに不要な観点（例: DB migration 反転）を除外できているか

## サブタスク管理

- [ ] 7 観点レビュー
- [ ] 5 リスク対策の確定
- [ ] GO / NO-GO 条件の確定
- [ ] outputs/phase-03/main.md にレビュー結果を記載

## 成果物

| 成果物 | パス |
| --- | --- |
| 設計レビュー結果 | `outputs/phase-03/main.md` |

## 完了条件

- [ ] 7 観点 × 5 リスクの表が埋まっている
- [ ] GO / NO-GO 条件が確定している
- [ ] Phase 2 設計に差し戻すべき項目がゼロ、または差し戻し記録が残っている

## タスク100%実行確認

- [ ] レビュー結果が Phase 2 と矛盾していない
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 4 へ、レビュー後の最終 selector / GO 条件 / リスク対策を引き渡す。
