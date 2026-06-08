# Phase 3: 設計レビュー（Gate-A）

## 判定: PASS（Phase 4 へ進行可）

Phase 1（要件定義）と Phase 2（設計）で、強制移行 + 物理削除の二段構成の contract（repository シグネチャ・route 分岐・SQL 戦略・error code・audit shape）が確定した。実装に必要な決定事項に未確定は残っていない。

## 3.1 レビュー観点と結論

| 観点 | 結論 | 根拠 |
|------|------|------|
| 問題は未解決か | YES（対応必要） | `apps/api/src` grep で強制移行実装 0。physical delete は 409 拒否のみ |
| Issue の現行コード最適化 | 完了 | O1-O5 を `index.md` / phase-1 §1.2 に明記。endpoint 方式確定・migration 不要 |
| 責務境界 | 明確 | route → repository。`apps/web` 非接触。schema 変更なし |
| AC-7 退化防止 | 設計で担保 | `migrateTo` 未指定は既存経路を完全保持。contract regression test 計画あり |
| 孤児化禁止 | 設計で担保 | `INSERT OR IGNORE`+`DELETE` で衝突吸収、移行後 `COUNT=0` 再検証後のみ削除 |
| 原子性 | 設計で担保 | 移行 SQL を `c.db.batch` で単一原子実行、部分移行残さない |
| 命名一貫性 | PASS | camelCase 関数 / snake_case error code / `admin.tag.<verb>` audit（既存に一致） |

## 3.2 設計上のリスクと対策（Phase 2 から継承）

| リスク | 対策 | 確認 Phase |
|--------|------|-----------|
| `(member_id,dest)` PK 衝突で部分移行 | `INSERT OR IGNORE`+`DELETE` 2 ステップ batch | Phase 4/6 test |
| 移行後 src 参照が残ったまま削除に進む | 削除前に `countMemberTagReferences(src)===0` 再検証、非 0 は `has_references` で中断 | Phase 4 test |
| 既存 409 拒否経路の退化 | `migrateTo` 未指定経路を不変保持、regression test 固定（AC-7） | Phase 6 test |
| 移行先誤指定で不可逆削除 | 移行前検証（not_found/inactive/same）+ runbook の逆移行手順 + user gate | Phase 12 runbook |
| `member_tags` 追加列の取りこぼし | Step 1 の `SELECT` 句を実 schema 確認後に確定 | Phase 5 実装 |

## 3.3 4 条件評価（一次結論）

- **価値性**: PASS — 誤付与 tag の参照を正しい tag へ寄せてから完全削除する運用需要を満たす。コスト最大部品は「不可逆削除の安全担保」で、runbook + user gate に分離。
- **実現性**: PASS — issue-1070 の physical delete + audit + contract test に完全な前例。migration 不要。SQL は標準的な `UPDATE`/`INSERT OR IGNORE`/`DELETE`。
- **整合性**: PASS — issue-1070 の 409 拒否経路を温存。参照ガードで孤児化禁止。状態所有権は repository に集約。
- **運用性**: PASS — audit に移行件数/src/dest/actor 記録。runbook に逆移行ロールバック。production は user gate。

## 3.4 強化ループ / バランスループ

- 強化ループ: 強制移行経路の提供 → 誤付与 tag のクリーンアップ容易化 → tag master の健全性向上 → 運用信頼。
- バランスループ: 不可逆削除リスク → user gate + runbook + 移行前検証 → 暴発抑制（過度な削除を防ぐ負のフィードバック）。

## 3.5 Gate-A 結論

設計は実装可能な粒度に達した。Phase 4（テスト作成）へ進む。実装契約（関数シグネチャ・route 分岐・SQL・error code・audit）は固定済み。
