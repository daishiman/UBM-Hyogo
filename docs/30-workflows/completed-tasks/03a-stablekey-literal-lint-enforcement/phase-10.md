# Phase 10: リリース準備

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 10 / 13 |
| Phase 名称 | リリース準備（段階リリース / rollback / 通知 / AC-7 同期） |
| 作成日 | 2026-05-01 |
| 前 Phase | 9 (セキュリティ・品質ゲート) |
| 次 Phase | 11 (NON_VISUAL evidence) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

ESLint custom rule 「stableKey 直書き禁止」を `error` で本番投入する前に、既存コードベースに対する false positive のリスクを段階的に検証し、rollback 経路と stakeholder 通知を確立する。
03a workflow の AC-7 ステータスを「規約のみ」→「lint 静的検査で fully enforced」に昇格させるタイミングを release tag と同期させる。

## 段階リリース 3 段階

| 段階 | モード | 期間 | GO 条件 | 観測項目 |
| --- | --- | --- | --- | --- |
| ① warning | `severity: 'warn'` で merge / dry-run | 即時 | Phase 9 の 4 ゲート全 PASS | `pnpm lint --max-warnings=0` を **強制しない**まま warning 件数を計測。既存コードで warning 0 件であること |
| ② monitor | warning モードで 1 週間運用 | 7 日間 | 期間中に false positive 発見 0 件、もしくは allow-list 追加で吸収 | PR ごとの warning 推移、レビュアー review コメントに「false positive」記録なし |
| ③ error | `severity: 'error'` へ昇格、CI gate を blocking 化 | tag 切替時 | 段階 ② で false positive 0 件、AC-7 を fully enforced 表記に更新可能 | merge 後 1 PR で CI が想定通り PASS |

## Rollback 経路

| 段階 | rollback 操作 | 影響範囲 |
| --- | --- | --- |
| ① warning | `eslint.config.*` 内の rule 行を削除して PR | warning 出力消滅のみ。実害なし |
| ② monitor | 同上 + 観測ログ（`outputs/phase-12/skill-feedback-report.md`）を `Reject` 記録に更新 | warning 出力消滅、AC-7 ステータス据え置き |
| ③ error | `severity: 'error'` を `'warn'` に戻す or rule 行を削除して revert PR | CI blocking 解除。allow-list / dummy fixture は残してよい |

> rollback PR は **rule 削除のみで戻せる** 設計を維持する。lint 設定以外（ソース改変、test 削除）を巻き込まないこと。

## ステークホルダー通知（CHANGELOG エントリ案）

`docs/30-workflows/LOGS.md` および monorepo CHANGELOG（存在する場合）に以下を投入する。

```markdown
### 2026-05-DD — task-03a stableKey literal lint enforcement
- **影響範囲**: `packages/*` `apps/*` の app code（test / fixture / seed は対象外）
- **概要**: stableKey 文字列リテラルの直書きを ESLint custom rule で禁止。
- **allow-list**:
  - `packages/shared/src/zod/field.ts`
  - `packages/integrations/google/src/forms/mapper.ts`
  - その他 Phase 2 で確定する正本モジュール一覧（`outputs/phase-02/allow-list-spec.md`）
- **段階**: ① warning → ② 1 週間監視 → ③ error 昇格（本 entry は ③ 時点で error 昇格を宣言）
- **AC-7**: 「規約のみ」→ **「lint 静的検査で fully enforced」** に更新
- **rollback**: `eslint.config.*` から rule 行を削除する PR で完全復帰（影響: lint 出力のみ）
- **参照**: `docs/30-workflows/03a-stablekey-literal-lint-enforcement/`
```

## 03a workflow AC-7 同期手順

1. `docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/implementation-guide.md` の AC-7 行を編集
2. 表記を `規約 + 単体テストで担保（lint 未導入）` → `ESLint custom rule "stableKey 直書き禁止" で fully enforced` に更新
3. 同 commit で本 workflow の `metadata.workflow_state` を `completed` に昇格（段階 ③ 適用後の release tag と同期）
4. `index.md` の AC マトリクスにも反映

> 段階 ① / ② の間は AC-7 表記を変更しない。release tag が `error` 段階へ移行したタイミングで一括同期する。

## GO / NO-GO チェック

| 項目 | 確認 | 状態 |
| --- | --- | --- |
| Phase 1〜9 すべて completed | artifacts.json | □ |
| AC-7 昇格対象の 03a 仕様書パスが存在する | ls | □ |
| allow-list が `outputs/phase-02/allow-list-spec.md` で確定 | 該当 | □ |
| dummy fixture 命名規約が Phase 9 で固定 | phase-09.md | □ |
| 4 ゲート（typecheck / lint / test / build）全 PASS 設計 | phase-09.md | □ |
| L4 intentional violation 手順が Phase 11 へ引き継ぎ済 | phase-09.md → phase-11.md | □ |
| rollback PR は rule 削除のみで戻せる | 本 phase | □ |
| CHANGELOG エントリ案が固定 | 本 phase | □ |
| 段階 ① → ② → ③ GO 条件が定量化 | 本 phase | □ |

## NO-GO 条件

- 段階 ① で既存コードベースに warning が 1 件以上出る → allow-list を Phase 4 へ差戻し再設計
- false positive が monitor 期間で発見 → ② を延長、設計次第で rule 述語を絞る
- AC-7 同期対象 03a 仕様書が rename / 移動されていた場合 → 03a 側の運用に合わせ legacy stub 対応

## 実行タスク

- [ ] 段階リリース 3 段階の GO 条件を `outputs/phase-10/main.md` に明記
- [ ] rollback 手順を `outputs/phase-10/rollback-plan.md` に記録
- [ ] CHANGELOG エントリ案を `outputs/phase-10/changelog-draft.md` に下書き
- [ ] AC-7 同期手順を 03a workflow と相互リンクで記録

## 完了条件

- [ ] 段階 ①〜③ GO 条件と観測項目が定量化済み
- [ ] rollback が rule 削除のみで戻る設計
- [ ] CHANGELOG エントリ案が固定
- [ ] AC-7 同期タイミングと release tag 連動を記録

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 10 を completed
- [ ] GO の場合 Phase 11 起動許可、NO-GO の場合は ブロック理由と recovery を記録

## 次 Phase

- 次: Phase 11 (NON_VISUAL evidence)
- 引き継ぎ: L4 intentional violation の取得計画 / allow-list snapshot 取得対象

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-09/main.md | 品質 gate 入力 |
| 必須 | docs/30-workflows/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/outputs/phase-12/implementation-guide.md | AC-7 同期対象 |

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-10/main.md` | release stage / rollback / AC-7 sync summary |

## 統合テスト連携

Phase 11 は本 Phase の warning / monitor / error stage 境界を使い、`fully enforced` の主張が error mode evidence 後だけになることを確認する。
