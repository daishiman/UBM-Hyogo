[実装区分: 実装仕様書]

# Phase 10: 最終レビュー — 06c-B-admin-members-implementation-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members-implementation-execution |
| phase | 10 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

GO / NO-GO を判定し、blocker と CONST_005 必須項目セルフチェックを記録する。

## 実行タスク

1. Phase 1〜9 の AC、test、evidence、blocker を横断して GO / NO-GO を判定する。
2. 未実測 runtime evidence は `PENDING_RUNTIME_EVIDENCE` として分離し、PASS と書かない。
3. 08b / 09a へ委譲する visual evidence の開始条件を明記する。
4. commit / push / PR / deploy の user approval gate が維持されていることを確認する。

## CONST_005 必須項目セルフチェック

| 必須項目 | 記載 phase | 状態 |
| --- | --- | --- |
| 変更対象ファイル一覧（パス + 新規/編集/削除） | Phase 5 | [ ] |
| 主要関数・型・モジュールのシグネチャ | Phase 5 | [ ] |
| 入力・出力・副作用 | Phase 5 / 6 | [ ] |
| テスト方針（追加テストファイル・ケース） | Phase 4 | [ ] |
| ローカル実行・検証コマンド | Phase 5 / 9 | [ ] |
| DoD（ビルド成功・テストパス・想定動作確認手順） | Phase 5 / 9 / 11 | [ ] |

## 不変条件セルフチェック

- [ ] #4 本文編集禁止 — 更新系 endpoint を追加していない
- [ ] #5 apps/web D1 直参照禁止 — `fetchAdmin` 経由のみ、grep で 0 件
- [ ] #11 admin も他人本文編集不可 — admin 用 update endpoint 不在
- [ ] #13 audit_log 必須 — delete / restore で `auditAppend` を `DB.batch` 同梱

## GO / NO-GO 判定基準

- **GO**: AC マトリクス全件埋、failure case 全件責任 layer 紐付き、quality gate Q1〜Q7 全 pass、無料枠/secret/a11y チェック全通過、不変条件 #4/#5/#11/#13 違反なし
- **NO-GO**: 上記いずれか未充足

## blocker 一覧

| ID | 内容 | 解消条件 | owner / 入口 |
| --- | --- | --- | --- |
| B1 | 06b-A session resolver 未着地時は admin guard が dev token のみ | 06b-A 完了 | 06b-A workflow |
| B2 | audit_log migration 未適用 | 07-edit-delete 系 migration を staging / prod へ適用 | infra workflow |
| B3 | require-admin の admin role 判定基準未確定 | 11-admin-management.md の role table 確認 | spec doc |
| B4 | 検索 index 不足 | `members(zone)` / `member_tags(member_id, tag_id)` に複合 index | DB migration |

## 入出力・副作用

- 入力: Phase 1〜9 全成果
- 出力: GO/NO-GO 判定、blocker 一覧、CONST_005 セルフチェック結果
- 副作用: なし

## ローカル実行・検証コマンド

```bash
# Phase 9 の Q1〜Q7 を再実行して GO 判定の根拠とする
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run apps/api/src/routes/admin
```

## DoD

- [ ] CONST_005 必須項目 6 件のセルフチェックが全 pass
- [ ] 不変条件 4 件のセルフチェックが全 pass
- [ ] GO / NO-GO の結論が記録されている
- [ ] blocker と解消条件が記録されている

## 参照資料

- 本仕様書 Phase 1〜9
- `docs/00-getting-started-manual/specs/11-admin-management.md`

## 統合テスト連携

- 上流: Phase 1〜9 全成果物
- 下流: Phase 11 手動 smoke

## 多角的チェック観点

- #4 / #5 / #11 / #13 すべての不変条件で違反なし
- 上流タスク（06b-A）との依存解消順序

## サブタスク管理

- [ ] CONST_005 セルフチェック
- [ ] 不変条件セルフチェック
- [ ] AC 再点検
- [ ] blocker 一覧化
- [ ] GO / NO-GO 判定
- [ ] outputs/phase-10/main.md を作成する

## 成果物

- `outputs/phase-10/main.md`

## 完了条件

- [ ] GO / NO-GO が記録されている
- [ ] blocker と解消条件が記録されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装・deploy・commit・push・PR を行っていない
- [ ] CONST_005 必須項目が網羅されている

## 次 Phase への引き渡し

Phase 11 へ、判定結果と blocker、CONST_005 セルフチェック結果を渡す。
