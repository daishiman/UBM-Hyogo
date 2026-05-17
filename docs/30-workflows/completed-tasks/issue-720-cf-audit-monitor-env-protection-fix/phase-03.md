# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (タスク分解) |
| 状態 | completed |

## 目的

Phase 2 の 3 成果物 (workflow-diff / secret-migration-plan / environment-separation-adr) を独立観点でレビューし、GO / NO-GO 判定を確定する。NO-GO の場合は Phase 2 に差し戻す。

## レビュー観点

### 1. workflow-diff.md レビュー

| 観点 | 期待 | 確認方法 |
| --- | --- | --- |
| 最小差分 | 削除行は L39 のみ | diff サンプルを目視確認 |
| インデント | 削除後も jobs 内 children のインデントが崩れない | yaml lint / actionlint |
| 参照名不変 | secrets / vars 参照が全て同名 | grep `secrets\.` / `vars\.` で参照名列挙 |
| 副作用なし | `concurrency`, `permissions`, `cron`, step 構成不変 | 削除前後 yaml 全文 diff |

### 2. secret-migration-plan.md レビュー

| 観点 | 期待 | 確認方法 |
| --- | --- | --- |
| 全数性 | 参照されている secret 5 件 / variable 9 件すべて列挙 | workflow yaml の `secrets\.` / `vars\.` 出現箇所と照合 |
| user-gate | 投入コマンドが「user 承認後に実行」と明記 | doc 内文言確認 |
| 1Password 経由 | `gh secret set --body "$(op read ...)"` 形式 | コマンド例の引用確認 |
| 投入順序 | repo secret 投入 → workflow merge → dry_run → 6h success の順 | 不変条件節の有無 |
| 監視系限定 | 複製対象が read-only token のみ | token の権限種別確認 |

### 3. environment-separation-adr.md レビュー

| 観点 | 期待 | 確認方法 |
| --- | --- | --- |
| Context 明確 | issue-720 の根本原因が記述されている | doc 内 Context 節 |
| Decision 具体性 | 「監視系: environment 指定なし / deploy 系: environment 指定あり」が明文化 | doc 内 Decision 節 |
| Consequences の pro/con | repo-level secret surface 拡大の con が記述 | doc 内 Consequences 節 |
| 緩和策 | read-only token 限定原則が記述 | doc 内 Decision 節 |
| status | `proposed` → `accepted` に昇格判断 | 本 Phase 03 で判定 |

## レビュー結果テンプレート

本 `phase-03.md` に以下の形で記録する。

```markdown
# Phase 3 design review

## 1. workflow-diff.md
- 判定: GO / CONDITIONAL / NO-GO
- 指摘: (具体的な指摘リスト)
- 対応: (Phase 2 差し戻し or Phase 4 に進む)

## 2. secret-migration-plan.md
- 判定: GO / CONDITIONAL / NO-GO
- 指摘: ...

## 3. environment-separation-adr.md
- 判定: GO / CONDITIONAL / NO-GO → accepted に昇格
- 指摘: ...

## 総合判定
- 全体: GO / NO-GO
- 次 Phase: 4 (タスク分解)
- 差し戻し条件: (NO-GO の場合のみ)
```

## レビュー時のリスク確認

| リスク | レビューで確認する論点 |
| --- | --- |
| repo secret 投入漏れ | 5 + 9 のすべてが secret-migration-plan に列挙されているか |
| 参照名変更で差分が広がる | workflow-diff が「L39 削除のみ」になっているか |
| ADR が抽象的すぎて将来の判断に使えない | 「監視系 = environment 指定なし」「deploy 系 = environment 指定あり」が明示されているか |
| 1Password 経由注入の手順が抜けて平文 commit リスクが残る | secret-migration-plan のコマンド例がすべて `op read op://...` 経由か |
| production env 側 secret の削除を性急に行う設計になっていないか | secret-migration-plan で「当面維持」が明記されているか |

## 実行タスク

- [ ] Phase 2 成果物 3 件を読み込み観点ごとにチェック
- [x] `phase-03.md` を設計レビュー主成果物として作成
- [ ] GO 判定なら environment-separation-adr.md の status を `accepted` に書き換え
- [ ] NO-GO 判定なら Phase 2 への差し戻し条件を明示

## 完了条件

- [x] `phase-03.md` が設計レビュー主成果物として作成されている
- [ ] 3 成果物それぞれに対する判定が記録されている
- [ ] 総合判定 (GO / NO-GO) が記録されている
- [ ] NO-GO の場合は Phase 2 差し戻し条件、GO の場合は Phase 4 着手条件が明記されている

## 次 Phase

- GO の場合: Phase 4 (タスク分解)
- NO-GO の場合: Phase 2 に戻り設計を再度修正
