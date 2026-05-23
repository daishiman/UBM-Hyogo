# integration-fixes-i04-homepage-cta-implementation

**[実装区分: 実装仕様書]** — コード変更を伴う

## 概要

GitHub issue [#767](https://github.com/daishiman/UBM-Hyogo/issues/767) に対応する task-spec workflow。
issue は CLOSED だが、初期コード調査で **未実装** を確認したため、Phase 1-13 をフル昇格して実装した。

## 背景

`parallel-06-public-pages` で HomePage 移植時に prototype L136-149 の "FOR MEMBERS" dark variant CTA section の移植が漏れていた。
親 spec ([parallel-i04-homepage-cta/spec.md](../ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i04-homepage-cta/spec.md)) では in-place fix で完結予定だったが、台帳に登録されないまま issue がクローズされたため未完了状態のままになっている。

## 実装対象（初期コード調査 → 現在）

| Path | 現状 | 必要な変更 |
|------|------|-----------|
| `apps/web/src/components/public/CallToActionCTA.tsx` | 作成済み | dark variant CTA component |
| `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` | 作成済み | component test 9 件 |
| `apps/web/src/lib/constants/form.ts` | 作成済み | `FORM_RESPONDER_URL` SSOT |
| `apps/web/app/page.tsx` | mount 済み | MemberGrid section の後に常時表示 |
| `apps/web/src/styles/legacy-public.css` | style 追加済み | dark variant style |

## 参照正本

| 種類 | パス |
|------|------|
| 親 spec | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i04-homepage-cta/spec.md` |
| 未タスク仕様書 | `docs/30-workflows/unassigned-task/integration-fixes-i04-homepage-cta.md` |
| prototype 正本 | `docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx:136-149` |
| 既存類似実装 | `apps/web/src/components/public/RegisterCallout.tsx`（参考のみ・共通化はしない） |
| design token | `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md` |
| 固定値 | `CLAUDE.md` の `responderUrl` |

## メタ情報

- `implementation_mode`: `new`
- task 分類: **UI task / VISUAL**（HomePage に visible section を追加）
- 不変条件: #5（D1 直接アクセス禁止）— HomePage は既に public API 経由のため影響なし
- スコープ: 1 サイクルで完了（CONST_007 準拠・先送りなし）

## Phase 進捗

| Phase | 名称 | 状態 |
|-------|------|------|
| 1 | 要件定義 | completed |
| 2 | 設計 | completed |
| 3 | 設計レビュー | completed |
| 4 | テスト作成（RED） | completed |
| 5 | 実装（GREEN） | completed |
| 6 | テスト拡充 | completed |
| 7 | カバレッジ確認 | completed |
| 8 | リファクタリング | completed |
| 9 | 品質保証 | completed |
| 10 | 最終レビュー | completed |
| 11 | 手動テスト（VISUAL） | completed |
| 12 | ドキュメント更新 | completed |
| 13 | PR作成 | blocked（user 承認待ち） |

## 制約

- 既存 API のみ利用（新規 endpoint 禁止）
- OKLch token 正本（HEX 直書き禁止・`verify-design-tokens` CI gate）
- D1 直接アクセス禁止（不変条件 #5）
- 新規 test ファイルは `*.spec.tsx` のみ（不変条件 #8）
- issue #767 は CLOSED のまま（ユーザー明示指示）
- コミット・PR・push は Phase 13 で user 明示承認後のみ
