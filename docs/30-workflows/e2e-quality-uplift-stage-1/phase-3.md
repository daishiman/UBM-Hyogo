# Phase 3: 設計レビュー（4-condition gate）

> workflow: `e2e-quality-uplift-stage-1` / レビュー日: 2026-05-08

## 1. レビュー観点

| 観点 | 定義 |
|------|------|
| 価値性 | 検出する failure-mode が top-5 critical に該当し、現状未捕捉であること |
| 実現性 | 既存 fixture / page object / mock 機構のみで実装可能、production code 改修不要 |
| 整合性 | 不変条件（INV-3 / INV-PUB / INV-API-ONLY / INV-PROTO）と CLAUDE.md ポリシーに矛盾しないこと |
| 運用性 | flakiness 制御 / CI 実行時間影響 / 新規依存ゼロ / 後続 stage への引継ぎが明確 |

## 2. サブタスク 1a — Public-flow email leak assertion

| 観点 | 評価 | 根拠 |
|------|------|------|
| 価値性 | GO | INV-3（`responseEmail` system field）違反は最重大プライバシー regression。現状 spec で未捕捉 (`public-flow.spec.ts:9-42` に email 系 assertion なし)。 |
| 実現性 | GO | 既存 page object（`HomePage` / `MembersListPage` / `MemberDetailPage`）と sentinel 定数のみで成立。新規 fixture / endpoint 不要。 |
| 整合性 | GO | INV-API-ONLY / INV-PROTO に抵触なし。production code 不変。 |
| 運用性 | 条件付 GO | `/@/` probe が footer 等で false positive を生む可能性。対処: sentinel-only に縮退できる構造で実装。CI 時間増は < 0.5s 想定（既存 desktop flow に append）。 |

**verdict: GO**

| 残課題 | フェーズ |
|--------|---------|
| sentinel が seed されない場合の vacuous-test 化リスクは「regression-guard 価値あり」として受容 | Phase 1 §5 に記録済 |
| `/@/` probe の許可リスト要否は dynamic 観測で決定 | Phase 8 |

## 3. サブタスク 1b — Pending-sticky race assertion

| 観点 | 評価 | 根拠 |
|------|------|------|
| 価値性 | GO | 「pending が再訪問で消える」は実害大の UX/state regression。MVP 認証方針（`13-mvp-auth.md`）下で profile 編集経路は critical。既存 TC-E-01 / 03 は post-submit 直後しか見ておらず未捕捉。 |
| 実現性 | 条件付 GO | `GET /api/me` の mock 用 response shape が未確認（Phase 1 §1b-5 / Phase 2 §8）。Phase 4 で実装ソース確認後に shape 確定が必要。 |
| 整合性 | GO | `apps/web` から API mock のみ、D1 直接アクセスなし。INV-API-ONLY 遵守。既存 `page.route` 用法（`profile-visibility-request.spec.ts:11`）と一貫。 |
| 運用性 | GO | round-trip は `/` 軽量 page、CI 時間増 < 1s/spec 想定。`mockMeWithPending` は spec 内 inline で他 spec を汚染しない。 |

**verdict: 条件付 GO**

| 条件 | 解消フェーズ |
|------|------------|
| Phase 4 入口で `GET /api/me` の actual shape を確認し、`pendingRequests` フィールド名/型を確定 | Phase 4 |
| shape 確認結果が想定と乖離する場合、Phase 2 §3 の round-trip 設計を再評価（最悪 1b は依存 gate として分離） | Phase 4 入口 gate |

## 4. ワークフロー全体 verdict

| 項目 | 結果 |
|------|------|
| 1a | **GO** |
| 1b | **条件付 GO**（Phase 4 で shape 確定） |
| Stage 1 全体 | **GO（1a 即着手 / 1b は Phase 4 shape gate 通過後）** |

## 5. リスクレジスタ（レビュー後）

| ID | リスク | 重大度 | 対応 |
|----|--------|-------|------|
| R-1 | `responseEmail` fixture seed 未整備で 1a が vacuous | 中 | Phase 1 §5 で受容、後続 stage で seed 拡張 |
| R-2 | `/@/` probe の false positive | 低 | sentinel-only に縮退できる実装構造（Phase 5） |
| R-3 | `/api/me` shape 乖離で 1b 不成立 | 中 | Phase 4 shape gate / 1b を依存 gate として明示 |
| R-4 | `auth.ts` `signSession` placeholder が残ると memberPage が実体的に未認証扱い | 中 | 本サイクルで `@ubm-hyogo/shared` の `signSessionJwt()` に接続し、Stage 2 の placeholder 0 件 gate と整合 |

## 6. 後続フェーズ入口条件

| Phase | 入口条件 |
|-------|---------|
| Phase 4 | 1a: 即着手可 / 1b: `GET /api/me` shape 確認完了 |
| Phase 5 | Phase 4 で test 計画が確定 |
| Phase 6 | spec 編集の差分が `index.md` 受け入れ条件と整合 |

## 7. 承認

| ロール | 結果 | 日付 |
|-------|------|------|
| spec author（self-review, solo dev） | GO（1a） / 条件付 GO（1b） | 2026-05-08 |
| reviewer | n/a（solo 運用ポリシー: required reviewers 0） | — |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-1
- phase: 3
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented_local

## 目的

Stage 1 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 12 evidence に反映し、Phase 11 は実行ログ・skip count・runner version として分離する。

## 統合テスト連携

- NON_VISUAL implementation phase は Playwright assertion 差分、spec completeness、grep gate、artifact parity を検証する。
- E2E runtime 実行結果は outputs/phase-11/evidence に保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- apps/web/playwright/tests/public-flow.spec.ts、profile-visibility-request.spec.ts、profile-delete-request.spec.ts の assertion 差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E lines >=80%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
