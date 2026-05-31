# Phase 3: 設計レビュー（Gate-A）

> workflow: `issue-981-admin-members-table-list-enrichment`
> 判定: **Phase 4 へ進行可（PASS）**

## 1. レビュー観点

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| スコープ妥当性 | ✅ | AC-2 のみが現コードで未対応。データ層は #968 完了済（P50 確認済）。1 サイクル完結（CONST_007） |
| 既存 API 不変 | ✅ | `apps/api` / D1 / shared schema 変更なし。UI は既存 optional フィールド参照のみ |
| 既存部品再利用 | ✅ | `Chip` / `zoneTone` / `statusTone` / `MemberStateChipRow` 再利用。新規 primitive ゼロ（[FB-SDK-07-1]） |
| プロトタイプ正本整合 | ✅ | `pages-admin.jsx` L223-276 に列構成・chip 種別・`+N`・未タグを一致 |
| design token | ✅ | HEX 直書きゼロ。token 変数 + `Chip` data-tone のみ |
| props/state 境界 | ✅ | external props のみ。internal state 追加なし（[VSCPKR-03]） |
| 呼び出し側互換 | ✅ | `MembersTableProps` 不変。`MembersClientShell` 改修不要 |
| 命名規則整合 | ✅ | TC-MT 連番・camelCase tone・`*.spec.tsx`（Phase 1 で抽出済） |
| テスト戦略 | ✅ | 既存 TC-MT-01〜05 維持 + 描画 assert 追加。RED→GREEN 可能（props 注入のみ） |

## 2. リスクと軽減

| リスク | 影響 | 軽減策 |
| --- | --- | --- |
| `member_only`/`hidden` 情報欠落 | 中 | Option A 採用（publishState chip 維持）。zone/type chip を additive 追加 |
| zone/type の raw 値が UX 的に不親切 | 低 | プロトタイプも raw 描画。ラベル辞書化は未タスク候補（Phase 12） |
| tag 多数行の横幅膨張 | 低 | 最大2件 + `+N` で制限（プロトタイプ準拠） |
| 既存 a11y test 破壊 | 低 | chip は `<span>`、occupation は `<span>`。table 構造は不変。axe 再実行で担保 |
| 全件テスト SIGKILL | 低 | targeted run（MembersTable.spec のみ）で回避（[FB-UI-02-2]） |

## 3. 4 条件評価

- 価値性: ◯（drawer を開かず list で区画/タグ/職業を把握。親 hold 解消）
- 実現性: ◯（既存部品で実装可。新規依存ゼロ）
- 整合性: ◯（API 不変・プロトタイプ正本準拠・責務境界 UI 層に閉）
- 運用性: ◯（既存 spec 拡張で回帰 guard。CI gate 既存で担保）

## 4. MINOR 指摘（Phase 12 判定）

- M-1: zone/membershipType の人間可読ラベル辞書（例 `0_to_1` → 「0〜1名規模」）。Issue #981 AC / prototype が raw 値描画を要求するため、本サイクルでは実装せず新規未タスクも作成しない。
- M-2: tag pill の overflow `+N` ホバーで全タグ tooltip 表示。同サイクル内で `title` 付与 + TC-MT-17 により解消する。

> MINOR は機能影響なしだけで不要判定しない。M-1 は Issue #981 の明示 AC / prototype raw 表示との整合性を理由に no-task、M-2 は同サイクル実装で close する。

## 判定

**Gate-A PASS。Phase 4（テスト計画）へ進行する。**

## 完了条件

- [ ] 全レビュー観点が PASS
- [ ] リスクと軽減策が記録された
- [ ] MINOR 指摘が Phase 12 判定対象として登録された
- [ ] Gate-A 判定が記録された
</content>
