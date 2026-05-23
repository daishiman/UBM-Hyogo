[実装区分: 実装仕様書]

# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-25-DERIV-01 |
| 前提 Phase | Phase 9（全検証 PASS） |
| 次 Phase | Phase 11（手動テスト NON_VISUAL 代替） |

## 目的

AC-1〜AC-12 と stub の完了条件 9 件を最終チェックし、Phase 11 / 12 / 13 へ進める基準を満たしているか確認する。

## AC チェックリスト（本タスク AC-1〜AC-12）

- [ ] AC-1: SOP 文書が `docs/30-workflows/runbooks/sa-key-rotation-sop.md` として確定している
- [ ] AC-2: ローテーション頻度 90 日が NIST SP 800-57 / Google IAM 推奨を根拠に明記
- [ ] AC-3: staging → production の上書き順序が SOP §5 と helper state guard で固定
- [ ] AC-4: stdin パイプ強制 + `HISTFILE=/dev/null` + `set +o history` が SOP §8 と helper TC-01/02/03 で確認
- [ ] AC-5: grace period 24〜48h + disable 後 7 日保持が SOP §5.7〜5.9 で明記
- [ ] AC-6: `wrangler tail` 60 秒 + UT-26 疎通テストが SOP §6 と state machine S2/S4 で明記
- [ ] AC-7: rollback 経路が `outputs/phase-13/rollback-runbook.md` 逆参照で記述（SOP §7）
- [ ] AC-8: 実値・JSON 内容・OAuth トークンが文書中に一切含まれていない（Phase 9 grep 0 件）
- [ ] AC-9: 完了記録テンプレが `runbooks/sa-key-rotation-records/TEMPLATE.md` に存在、SOP §9 で逆参照
- [ ] AC-10: helper が bats 24/24 PASS / shellcheck PASS
- [ ] AC-11: 完了記録テンプレに 8 必須フィールド（実施日 / 実施者 / 旧 fp / 新 fp / staging 検証 / production 検証 / disable / delete）あり
- [ ] AC-12: UT-25-DERIV-02 / UT-25-DEFER-01 とのスコープ重複チェックが Phase 12 unassigned-task-detection.md で実施

## stub 完了条件 9 件チェック（parent stub からの逆引き）

- [ ] 1. SOP 文書確定（AC-1 ↔）
- [ ] 2. 頻度 + 根拠（AC-2 ↔）
- [ ] 3. staging → production 順序（AC-3 ↔）
- [ ] 4. stdin 経由 + HISTFILE 併用（AC-4 ↔）
- [ ] 5. grace 24-48h + 7 日保持（AC-5 ↔）
- [ ] 6. 無停止性確認 wrangler tail 60s + UT-26（AC-6 ↔）
- [ ] 7. rollback 逆参照（AC-7 ↔）
- [ ] 8. 値非掲載（`op://` 参照のみ）（AC-8 ↔）
- [ ] 9. 完了記録テンプレ同梱（AC-9 ↔）

## 多角的チェック

| 観点 | 確認 |
| --- | --- |
| セキュリティ | 値が log / history / stdout / stderr に出ない |
| 運用性 | dry-run / state guard / 完了記録テンプレで再現性 |
| 整合性 | CLAUDE.md「Cloudflare CLI 実行ルール」「シークレット管理」と矛盾なし |
| 可逆性 | rollback 経路が UT-25 Phase 13 runbook を逆参照 |
| 観測性 | fingerprint で識別、値そのものは記録しない |

## MINOR-01 解決確認

- [ ] SOP §6 に「60 秒は MVP 暫定値、運用知見が溜まったら再評価」が注記されている
- [ ] Phase 12 unassigned-task-detection.md に再評価タスク候補が記録されている

## DoD

- [ ] AC-1〜AC-12 全件 ✓
- [ ] stub 完了条件 9 件全件 ✓
- [ ] MINOR-01 解決確認 ✓
- [ ] 多角的チェック 5 観点 ✓

## 次 Phase

Phase 11（手動テスト NON_VISUAL 代替証跡）
