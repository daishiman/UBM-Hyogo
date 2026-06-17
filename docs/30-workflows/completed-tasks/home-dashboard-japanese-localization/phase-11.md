# Phase 11 — 手動テスト（VISUAL implemented_local_evidence_captured・capture local_fullpage_present_staging_pending）

> 本 Phase は `_shared-context.md`（SSOT）§5 視覚証跡の扱い・§1 マッピングを正本として参照する。
> タスク種別は VISUAL（見た目が変わる）だが、workflow_state=implemented_local_evidence_captured（ローカル実装・証跡取得済み）のため
> ローカル実スクリーンショット取得済み。staging 反映と追加 staging capture は **user-gated**。Phase 11 evidence は local evidence（local PASS）。

## 目的

ホーム画面の英語表記日本語化・eyebrow 削除の **実装後に手動で確認すべき項目**を計画として確定する。
本サイクルでコード実装とローカル capture を完了し、capture-metadata の `status=local_fullpage_present_staging_pending` を正とする。
実装後にこの計画に沿って 3 層評価（Semantic / Visual / AI UX）を実施し、ローカル実スクリーンショットを取得済み。

## 成果物

### VISUAL 宣言（証跡の主ソース）

- **タスク種別 = VISUAL**（ホーム画面の見た目が変わる）。
- **workflow_state = implemented_local_evidence_captured** のため、実 capture は `local_fullpage_present_staging_pending`。
- ローカル実スクリーンショット取得済み。staging 反映と追加 staging capture は **user-gated**。
- 本 Phase の証跡の主ソースは **local evidence**（`screenshot-plan.json` / `phase11-capture-metadata.json`・PNG 3 件）。
  ローカル実画像のみを置き、staging 画像は捏造しない（SSOT §5）。

### 手動テスト計画（実装後に確認）

| 評価層 | 確認観点 | 対象 |
| --- | --- | --- |
| Semantic | 統計4ラベルが日本語で意味が通る／同期バッジが「自動で最新化」 | Stats（SSOT §1.A/B） |
| Semantic | eyebrow 削除後も各セクションの日本語見出しで内容が伝わる | Hero/About/区画/Timeline/CTA/Featured |
| Visual | eyebrow 削除後の見出し上端余白が崩れない（section-heading が先頭で揃う） | About/Featured/Timeline |
| Visual | CTA heading の margin-top 調整後、copy 先頭に過剰余白が出ない | CallToActionCTA |
| Visual | 日本語表記の可読性・行長・折返しが自然（1280px / モバイル幅） | ホーム全体 |
| AI UX | 非エンジニアが見て「最終データ更新」「自動で最新化」を直感理解できるか | Stats |
| AI UX | 英語 overline 消失でノイズが減り、視線誘導が日本語見出しに集中するか | ホーム全体 |

### 計画スクリーンショット（ローカル取得済み・追加 staging は承認後）

| canonical name | 内容 | 状態 |
| --- | --- | --- |
| `home-localized-full.png` | ホーム全体（日本語化・eyebrow 削除後・1280px） | local_fullpage_present_staging_pending |
| `home-localized-stats.png` | 統計カード4枚（ラベル日本語 + 自動で最新化バッジ） | local_fullpage_present_staging_pending |
| `home-localized-about.png` | About/区画カード（overline 削除後の見出し上端余白確認） | local_fullpage_present_staging_pending |

### 関連成果物
- `outputs/phase-11/main.md` — 手動テストの方針・local evidence の根拠。
- `outputs/phase-11/manual-test-result.md` — 3 層評価の計画（local evidence・local PASS）。
- `outputs/phase-11/manual-test-checklist.md` — 実装後の手動確認チェックリスト。
- `outputs/phase-11/ui-sanity-visual-review.md` — VISUAL 宣言 + UI sanity 観点。
- `outputs/phase-11/screenshot-plan.json` — キャプチャ計画（参照のみ・作成済）。
- `outputs/phase-11/phase11-capture-metadata.json` — capture メタ（参照のみ・作成済）。

## 統合テスト連携

- Semantic 層の一部（ラベル日本語・eyebrow 不在・`topTags` 補完）は Phase 6 の focused vitest（T1〜T6）で構造的に先行検証される。
  手動テストはその上に立って、jsdom が評価できない **視覚（余白・可読性・コントラスト）** を補完する。
- Visual 層（F6 CSS 削除後の余白）は jsdom 非評価のため、実装後のローカルスクリーンショットで確定する。
- 本 Phase の evidence inventory は local PASS（PNG 3 + DOM verification PASS）であり、追加 staging は user-gated とする。

## 完了条件

- [ ] ui-sanity-visual-review.md 冒頭に VISUAL 宣言（種別=VISUAL / implemented_local_evidence_captured / local fullpage present / staging・crop は user-gated）が明記されている
- [ ] manual-test-result.md のメタに「証跡の主ソース」と「ローカルスクリーンショット取得済み / staging user-gated」が明記されている
- [ ] 3 層評価（Semantic / Visual / AI UX）の確認観点が計画として記述されている
- [ ] manual-test-checklist.md に実装後の手動確認チェックリスト（`- [ ]`）が記載されている
- [ ] Phase 11 evidence inventory が local evidence（PNG 3・staging pending）で記録され、捏造画像が無い
