# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-self-service-api-endpoints |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 の module 配置・zod schema・dependency matrix に対して **3 つ以上の alternative** を出し、PASS-MINOR-MAJOR で判定する。本人本文編集禁止（不変条件 #4）と他人 memberId 露出禁止（不変条件 #11）を満たさない案を MAJOR で却下する。

## 実行タスク

- alternative 案 3 つを記述
- 各案について PASS / MINOR / MAJOR 判定
- 採用案を確定し Phase 4 への引き継ぎ事項を記述

## Alternative 案

### Alternative A: 採用（Phase 2 案）

- 4 endpoint を Hono 単一ルーターに集約
- session middleware で memberId を context 注入、path に :memberId を含めない
- visibility/delete request は admin_member_notes.type で表現

判定: **PASS**

理由: 不変条件 #4 / #11 / #12 すべてを構造的に保証。Phase 2 の dependency matrix が成立。

### Alternative B: PATCH /me/profile を許可

- 会員が自分の profile を UI から差分編集できるように `PATCH /me/profile` を作る
- 本文 D1 上書きを `profile_overrides` テーブルに格納

判定: **MAJOR (却下)**

理由: 不変条件 #4 違反。spec 07-edit-delete.md「本文正本は Google Form」と矛盾。spec 13-mvp-auth.md「MVP でやらないこと: D1 profile_overrides ベース」と矛盾。

### Alternative C: visibility/delete request 専用テーブル新設

- `member_self_requests` を新設し、admin_member_notes と分離
- 02c のスコープに新テーブル追加が必要

判定: **MINOR (代替提案として保留)**

理由: 機能的には成立するが、02c の AC が `admin_member_notes` 範囲で閉じる前提で確定済み。新テーブルは 07a/c の queue 処理 workflow に追加負荷。MVP では type 列で十分。将来的に request の状態遷移が複雑化したらこの案を再検討。

### Alternative D: path に :memberId を含める（管理者と共用エンドポイント化）

- `GET /members/:memberId/profile` に統合し、session の memberId と path の memberId を比較

判定: **MAJOR (却下)**

理由: 不変条件 #11 の前段（他人 memberId 露出禁止）に対する攻撃面拡大。path 改ざんで 403 と 404 を観測することにより memberId の存在判別が可能になる。`/me/*` で path に memberId を持たない方が安全。

## 判定サマリー

| 案 | 判定 | 採否 |
| --- | --- | --- |
| A (Phase 2) | PASS | 採用 |
| B (PATCH 許可) | MAJOR | 却下 |
| C (専用テーブル) | MINOR | 保留 |
| D (path 共用) | MAJOR | 却下 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/07-edit-delete.md | 本文編集禁止の正本 |
| 必須 | docs/00-getting-started-manual/specs/13-mvp-auth.md | MVP でやらないこと |
| 必須 | docs/00-getting-started-manual/specs/11-admin-management.md | admin_member_notes 利用 |
| 参考 | docs/00-getting-started-manual/specs/06-member-auth.md | 認可境界 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用案 A を test matrix の入力にする |
| Phase 6 | 却下案 B / D が出現していないことを authz test で確認 |
| Phase 8 | DRY 化で middleware 共通化 |

## 多角的チェック観点（不変条件マッピング）

- #4: PATCH 系 endpoint の不在を構造で保証（Alternative B 却下）
- #11: path に memberId を含めない（Alternative D 却下）
- #12: visibility/delete request 投入時も MemberProfile に notes を返さない（Alternative C 保留時もこの不変条件は維持）

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Alternative A〜D 記述 | 3 | pending | outputs/phase-03/main.md |
| 2 | PASS-MINOR-MAJOR 判定 | 3 | pending | 判定根拠を不変条件 # で説明 |
| 3 | 採用案確定 | 3 | pending | A 採用 |
| 4 | Phase 4 引き継ぎ | 3 | pending | test matrix の入力 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | Phase 3 主成果物 |
| メタ | artifacts.json | Phase 3 を completed に更新 |

## 完了条件

- [ ] alternative 3 案以上が記述されている
- [ ] 各案に PASS / MINOR / MAJOR 判定がある
- [ ] 不変条件違反案が MAJOR で却下されている
- [ ] 採用案 A が Phase 4 へ引き継がれている

## タスク100%実行確認【必須】

- 全実行タスク completed
- 全成果物配置済み
- 全完了条件チェック
- artifacts.json の Phase 3 を completed に更新

## 次 Phase

- 次: 4 (テスト戦略)
- 引き継ぎ事項: 採用案 A の 4 endpoint × middleware を verify suite に展開
- ブロック条件: 採用案未確定なら次 Phase に進まない
