---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 3
phase_name: 設計レビュー
task_id: issue-1192-admin-account-profile-dedicated-ux
---

# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | `issue-1192-admin-account-profile-dedicated-ux` |
| レビュー対象 | `phase-1-requirements.md` / `phase-2-design.md` |
| 判定 | **GO**（Phase 4 以降へ進行可） |

## 目的

Phase 1-2 の設計を 4 条件（矛盾なし・漏れなし・整合性あり・依存関係整合）で検証し、後続タスク仕様書（Phase 4-13）がコード実装可能な粒度になっていることを確認して設計を凍結する。

## 4条件評価（一次結論）

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 分岐 (b) はコード事実（`resolveSession` の member identity 必須）と一意に整合。元 Issue の (a)/(c) は到達不能状態であり、採らない判断と前提検証が矛盾しない |
| 漏れなし | PASS | AC-1〜AC-9 が「表示あり / 表示なし / degrade 不変 / 不変条件 / 検証コマンド」を覆う。変更ファイル 4 件で AC 全件に対応が引ける（対応表は phase-4 で固定） |
| 整合性あり | PASS | 新規 primitive なし（不変条件 #3）・HEX なし（#2）・D1 非接触（#4）・FormField 対象外（admin panel input ではない）・`*.spec.tsx` 命名（#8）に整合 |
| 依存関係整合 | PASS | `/me` の `isAdmin` は実装済み API surface（新 endpoint 不要）。`SectionCard` / `ButtonLink` は PR #1213 で landed 済み。外部依存・合意待ちゼロ |

## 対象モジュール・想定変更ファイル群の俯瞰（後続 Phase の実装可能粒度の担保）

```
apps/web/app/(member)/profile/
├── page.tsx                              # 編集: import 1 行 + 条件描画 1 行
├── page.spec.tsx                         # 編集: isAdmin true/false の 2 系テスト追加
└── _components/
    ├── AdminAccessNotice.tsx             # 新規: 静的 server component（props なし）
    └── AdminAccessNotice.component.spec.tsx        # 新規: focused spec
```

- 依存方向: `page.tsx → AdminAccessNotice → (SectionCard / ButtonLink)`。逆依存・循環なし。
- 影響半径: `/profile` route のみ。shell / middleware / api / shared 非接触。

## 因果ループ

- 「管理者導線が無い → 管理者が `/profile` と `/admin` を行き来できない → 場当たりの認証分岐が web に生える」という悪化ループを、api 所有権を保ったまま表現層 1 コンポーネントで断つ。本設計は認証境界に触れないため、fail-closed を崩す逆流は発生しない。

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| `SectionCard` が `data-testid` rest 透過しない実装だった場合 | テスト selector 不成立 | Phase 2 D-1 に fallback 明記済み（accessible name query へ寄せる）。Phase 5 実装時に実コードを Read して確定 |
| 成功パス page-level テストのための `MeProfileResponse` fixture が型不整合 | typecheck fail | Phase 4 で `me-types.ts` / `@ubm-hyogo/shared` の実型から fixture を定義し、typecheck を通る最小 fixture を仕様化 |
| 管理者 staging 実機 screenshot がログイン必須で取得不可 | VISUAL 証跡不足 | two-tier evidence: jsdom render を一次証跡、認証 runtime screenshot は user-gated pending（Phase 11 で明記） |
| 非管理者描画への意図しない DOM 差分 | member 体験の巻き込み | 条件描画 `{isAdmin ? ... : null}` の null 側は DOM 出力ゼロ。AC-3 を falsy render の querey null assertion で固定 |

## 命名衝突検査

| 名称 | 検査 | 結果 |
| --- | --- | --- |
| `AdminAccessNotice` | リポジトリ全体 grep（`apps/` / `docs/` / `.claude/`） | 0 件・衝突なし |
| `profile-admin-access-notice`（data-testid） | `apps/web` grep | 0 件・衝突なし |
| `issue-1192-admin-account-profile-dedicated-ux`（workflow slug） | `docs/30-workflows/` 配下 | 0 件・衝突なし（completed-tasks の親 WF とも非重複） |

## 判定

**GO**。Phase 1-3 の設計書は凍結し、Phase 4 以降のタスク仕様書作成（テスト計画 → 実装手順 → 検証）へ進む。再設計が必要な未確定事項は残っていない。

## 実行タスク

1. 4 条件評価・リスク評価・命名衝突検査の実施（本書・完了）。
2. Phase 4 へ AC ↔ テスト対応表の作成を引き継ぐ。

## 参照資料

| 資料 | 用途 |
| --- | --- |
| `phase-1-requirements.md` | AC 正本 |
| `phase-2-design.md` | シグネチャ・DOM 契約正本 |
| `CLAUDE.md` 重要な不変条件 / UI prototype alignment 不変条件 | 整合性評価の基準 |
| `.claude/skills/aiworkflow-requirements/` | システム正本仕様との整合確認 |

## 成果物

- 本ファイル（Phase 3 設計レビュー）。

## 統合テスト連携

- リスク表の fixture リスクを Phase 4 テスト計画の前提条件として引き継ぐ。

## 完了条件

- [x] 4 条件評価が全 PASS
- [x] 変更ファイル俯瞰と依存方向が明記され、後続 Phase が実装可能な粒度である
- [x] 命名衝突 0 件
- [x] GO 判定が記録されている
