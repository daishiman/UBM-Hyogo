# Phase 1: 要件定義

## メタ情報
| 項目 | 値 |
| --- | --- |
| Planned output | `outputs/phase-1/phase-1.md` |
| taskType | implementation |
| visualEvidence | VISUAL |

## 目的
Issue #372 AC を確定し、GO/NO-GO 判定を行う。Issue 元では「実 evidence 出現後に着手」とされるため、本 Phase で「N 件超え会員が一定数存在する evidence」または「ユーザーによる先行着手判断」を文書化する。

## AC（Acceptance Criteria）確定
- AC-1: ページング endpoint 新設（`GET /me/attendance` / `GET /admin/members/:memberId/attendance`）または `MemberProfile.attendanceMeta` 追加。
- AC-2: repository に optional `limit` / `cursor` 引数（`findByMemberId(id, {limit, cursor})`）。`findByMemberIds(ids)` は無変更。
- AC-3: 既存 read path テスト regression なし。
- AC-4: VISUAL evidence — profile / admin で「もっと見る」が機能する Playwright スモーク。

## 参照資料
- `outputs/phase-1/phase-1.md`
- 親 Issue #372 / 起票元仕様書（index.md 参照資料一覧）

## 成果物
- `outputs/phase-1/phase-1.md`
- `outputs/phase-1/go-no-go-decision.md`（evidence 有無 / ユーザー判断記録）
- `outputs/phase-1/ac-check-list.md`

## 完了条件
- AC が4項全て記録され、GO/NO-GO 判定が記録されている。NO-GO の場合は Phase 2 以降を保留扱いとする（spec は完成させる）。

## 実行タスク
- [ ] D1 production の `member_attendance` 件数分布を SQL `SELECT COUNT(*) c, member_id FROM member_attendance GROUP BY member_id ORDER BY c DESC LIMIT 50` で取得し、上位件数を evidence に記録する。
- [ ] evidence が閾値（任意の N=100 件超え会員 ≥ 1）に満たない場合は、ユーザーに着手可否を確認する。

## 統合テスト連携
- 本 Phase は判定のみ。`apps/api` の vitest はまだ走らせない。
