# Phase 10: 最終レビュー

**[実装区分: 実装仕様書]**（VISUAL UI task）

## メタ情報

| key | value |
|---|---|
| workflow_id | `admin-meetings-card-ux-clarity` |
| phase | 10 / 13 |
| created_at | 2026-06-10 |
| taskType | implementation |
| 対象 branch | `feat/admin-meetings-card-ux-clarity` |
| 関連 AC | AC-1〜AC-10（全件 充足判定） |
| 関連ルール | unassigned-task-guidelines（MINOR → 未タスク化） |
| SSOT | `../../shared-context.md` §10 / §11 |

## 目的

Phase 5 実装 + Phase 8 リファクタ + Phase 9 品質保証の成果に対し、**AC-1〜AC-10 の充足を判定**し、レビューで検出した MINOR 指摘を unassigned-task-guidelines に従って未タスク化する。あわせて baseline OOS-1〜OOS-4 を未タスク候補として記録する。本タスクは表現層改修であり、視覚 AC（AC-1/AC-2 の見た目）は Phase 11 staging screenshot（user-gated）で最終確認する。

## AC-1〜AC-10 充足判定

| AC | 内容 | 判定 | 根拠 / evidence |
|---|---|---|---|
| AC-1 | カードが影＋境界線/余白で視覚分離（くっつき解消） | 充足（視覚は Phase 11） | `.admin-timeline gap:var(--ubm-space-3)` + `.ui-card--flat` 境界線実体化。見た目は staging screenshot で人手確認 |
| AC-2 | 見出し（日付/タイトル/バッジ）が整列・hover/focus-visible | 充足（視覚は Phase 11） | `.admin-timeline__heading` flex 行 + `:hover`/`:focus-visible`。screenshot で確認 |
| AC-3 | 展開内 3 セクションが見出し付きサブカード分離 | 充足 | `.admin-detail-section` 化 + 見出し追加。DR-1（heading role）で構造検証 GREEN |
| AC-4 | 出席者が 1人1行の行リスト（区切り・削除右寄せ） | 充足 | `.admin-attendee-row`（space-between）。DR-3 で class/testid 構造検証 GREEN |
| AC-5 | 出席者見出しに人数 `(N名)` 表示 | 充足 | DR-2 で `(1名)`/`(2名)` を `attended.size` 反映として assert GREEN |
| AC-6 | 既存 testid/aria/role/select/button/input 保持・既存 vitest 全 PASS | 充足 | C7 grep（testid 削除 0）+ 既存 4 spec PASS |
| AC-7 | 色/spacing/radius/shadow は `var(--ubm-*)` 経由・HEX 0・verify:tokens green | 充足 | C4 verify:tokens green + C5 HEX 0 grep |
| AC-8 | apps/api 変更 0（diff 空）・D1/Form 不変 | 充足 | C6 `git diff dev -- apps/api` 0 行 |
| AC-9 | typecheck / lint green | 充足 | C1 / C2 exit 0 |
| AC-10 | 追加テスト PASS・jsdom で視覚を assert していない（構造のみ） | 充足 | DR-1〜DR-3 / TL-1 GREEN。Phase 4 で視覚 assert 排除を設計 |

> AC-1 / AC-2 の「見た目」側面は jsdom では検証不能のため、Phase 11 staging screenshot（user-gated）での人手判定を最終根拠とする。それ以外（AC-3〜AC-10 の構造・gate）は local で機械判定済み。

## MINOR 指摘（unassigned-task-guidelines 準拠）

レビューで検出した MINOR は、**本 PR スコープ（CONST_007: 1 PR 1 責務）を逸脱するため未タスク化**するルールを確認した。本サイクルで実装に取り込まず、未タスク候補として記録する。

| ID | MINOR 指摘 | 種別 | 未タスク化判断 |
|---|---|---|---|
| M-01 | 出席者見出し文字列変更（`出席者`→`出席者 (N名)`）が既存 spec query に当たらないかの再確認 | 確認事項 | Phase 4 で「既存 spec は heading 文字列に非依存」と調査済み・解決済（未タスク化不要） |
| MR-01 | `.admin-detail-section` の他 admin 画面適用 | scope 拡張 | OOS-1 と同一 → baseline へ集約（未タスク化＝OOS-1） |
| MR-02 | 出席者行の交互背景（zebra）による更なる可読性向上 | UX 強化 | 今回は単一 surface-bg + 行境界で十分。zebra は OOS-4 系将来 UX として未タスク化候補 |

> MINOR → 未タスク化ルール: 本 PR の責務（`/admin/meetings` 表現層の視覚情報設計修正）を超える指摘は、その場で実装せず baseline（§ 下表）または follow-up Issue 候補として記録する。重大度が MINOR を超える（機能破壊・contract 破壊・security）場合のみ本 PR で即修正する。本サイクルではそのような MAJOR 指摘は検出されなかった。

## baseline OOS（未タスク候補として記録）

shared-context §11 の未タスク候補を最終レビュー時点の baseline として再掲・確認する。いずれも本 PR スコープ外で、follow-up タスク/Issue 化の候補。

| ID | 内容 | 理由 | 実施場所 |
|---|---|---|---|
| OOS-1 | 他 admin 一覧（members/tags/audit/schema/requests/identity）への共通 primitive DOM 適用 | 各画面で DOM/テストが異なり 1 PR では CONST_007 抵触 | 別タスク（同 primitive を使う follow-up） |
| OOS-2 | 開催日カードの色設計見直し（コントラスト/階調） | ユーザーが今回「色は置いておく」と明示 | 別タスク（色トークン調整） |
| OOS-3 | 右スライドドロワー化（一覧と編集の完全分離） | 今回「インライン展開維持」を選択 | 将来 UX 検討 |
| OOS-4 | 出席者のチップ/タグ集約表示 | 今回「行リスト」を選択 | 将来 UX 検討 |

## 参照資料

- `../../shared-context.md` §10（DoD）/ §11（未タスク候補）/ §12（4 条件 verdict）
- `../phase-1/phase-1.md`（AC-1〜AC-10 定義）
- `../phase-9/phase-9.md`（QA チェック結果＝AC 充足の機械根拠）
- unassigned-task-guidelines（MINOR → 未タスク化ルール）

## 実行手順

1. AC-1〜AC-10 充足判定表を Phase 9 の QA 結果と照合し、各 AC に evidence を紐付ける。
2. 視覚 AC（AC-1/AC-2）は Phase 11 screenshot 待ち（user-gated）として「視覚は Phase 11」と明記。
3. レビュー検出 MINOR を列挙し、未タスク化 or 解決済を判定する。
4. baseline OOS-1〜OOS-4 を未タスク候補として再掲・確認する。
5. MAJOR（機能/contract/security 破壊）指摘が無いことを確認する。

## 統合テスト連携

- AC 充足判定の構造側根拠（DR-1〜DR-3 / TL-1 + 既存 4 spec）は Phase 9 C3 の GREEN に依存する。
- 視覚側根拠（AC-1/AC-2）は Phase 11 staging screenshot に委ねる（user-gated）。

## 多角的チェック観点（AIが判断）

- **AC full-coverage**: 10 AC すべてに判定と evidence があるか。視覚 AC は Phase 11 委譲を明示。
- **MINOR の過剰実装回避**: MINOR をその場で実装し PR を肥大化させていないか（CONST_007）。
- **未タスク化の漏れ**: scope 拡張 MINOR が baseline OOS と重複集約されているか。
- **MAJOR の見落とし**: contract/security/機能破壊が MINOR に紛れていないか。

## サブタスク管理

| ID | 状態 | 完了条件 |
|---|---|---|
| RV-1 | 仕様確定 | AC-1〜AC-10 充足判定表が evidence 付きで完備 |
| RV-2 | 仕様確定 | MINOR が unassigned-task-guidelines で処理（未タスク化/解決済） |
| RV-3 | 仕様確定 | baseline OOS-1〜OOS-4 が未タスク候補として記録 |

## 成果物

- AC-1〜AC-10 充足判定テーブル
- MINOR 指摘一覧と未タスク化判断
- baseline OOS-1〜OOS-4 記録
- 本 Phase 10 仕様書

## 完了条件

- [ ] AC-1〜AC-10 充足判定がテーブル化され各 AC に evidence が紐付く
- [ ] 視覚 AC（AC-1/AC-2）の Phase 11 委譲（user-gated）が明記
- [ ] MINOR → 未タスク化ルール（unassigned-task-guidelines）を確認した旨が記載
- [ ] baseline OOS-1〜OOS-4 が未タスク候補として記録
- [ ] MAJOR 指摘が無いことを確認

## タスク100%実行確認【必須】

- [ ] AC-1〜AC-10 充足判定テーブルがある
- [ ] MINOR 指摘を unassigned-task-guidelines 準拠で記載
- [ ] MINOR → 未タスク化ルールを確認した旨を明記
- [ ] baseline OOS-1〜OOS-4 を未タスク候補として記録
- [ ] 視覚 AC の Phase 11（user-gated）委譲を明示

## 次Phase

- `../phase-11/phase-11.md`（手動テスト / VISUAL — screenshot-plan・3 層評価・evidence inventory）
