# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-backoffice-api-endpoints |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 の 18 endpoint と admin gate / audit middleware の設計に対して **3 つ以上の alternative** を出し、PASS / MINOR / MAJOR で判定する。本人本文編集禁止（#11）、admin_member_notes leak ゼロ（#12）、tag queue 経由（#13）、schema 集約（#14）、attendance 制約（#15）を満たさない案を MAJOR で却下する。

## Alternative 案

### Alternative A: 採用（Phase 2 案）

- 18 endpoint を `/admin/*` に集約し、router mount で admin gate を install
- 全 PATCH / POST / DELETE で audit_log helper を middleware から自動記録
- sync trigger は 202 + jobId 返却

判定: **PASS**

理由: 不変条件 #11 / #12 / #13 / #14 / #15 を構造で保証。Phase 2 の dependency matrix が成立。

### Alternative B: PATCH /admin/members/:memberId/profile を許可

- 管理者が会員本文を一時的に編集できる救済 endpoint を追加

判定: **MAJOR (却下)**

理由: 不変条件 #11 違反（spec 11「他人プロフィール本文を直接編集しない」）。spec 07「current response を D1 差分で上書きしない」と矛盾。救済が条件を満たす場合は Google Form 再回答誘導 + admin notes で対応する。

### Alternative C: タグ直接編集を許可（PATCH /admin/members/:memberId/tags）

- queue を経由せず admin が member_tags を直接更新できる endpoint を追加

判定: **MAJOR (却下)**

理由: 不変条件 #13 違反（spec 12「タグは管理者レビューを通す」）。queue を回避すると audit と review の整合が崩れる。

### Alternative D: schema 変更を `/admin/sync/schema` に統合

- `/admin/schema/aliases` を廃止し、sync 経路に alias 割当 ロジックを混ぜる

判定: **MAJOR (却下)**

理由: 不変条件 #14 違反（spec 11「schema 変更は /admin/schema に集約」）。sync は forms.get 起動責務、alias は人間レビュー責務で分離しないと監査が崩れる。

### Alternative E: admin gate を全 handler 内で個別判定

- middleware を使わず handler 冒頭で `isAdmin` チェックを書く

判定: **MAJOR (却下)**

理由: 認可漏れの構造リスク（新 handler 追加時のチェック忘れ）。AC-1 を構造で保証できない。

### Alternative F: audit_log を opt-in（必要 endpoint のみ）

- 全 endpoint に強制せず handler ごとに audit を呼ぶ

判定: **MINOR (代替提案として保留)**

理由: パフォーマンス的には妥当だが、AC-9（全操作 audit）と矛盾する。middleware で全 mutation に強制する方が安全。read-only endpoint には audit を入れない設計（採用案 A）で 90% 解決済み。

## 判定サマリー

| 案 | 判定 | 採否 |
| --- | --- | --- |
| A (Phase 2) | PASS | 採用 |
| B (本文編集 PATCH) | MAJOR | 却下 |
| C (タグ直接編集) | MAJOR | 却下 |
| D (schema を sync に混ぜる) | MAJOR | 却下 |
| E (gate を handler 内) | MAJOR | 却下 |
| F (audit opt-in) | MINOR | 採用案 A に内包 |

## 実行タスク

- [ ] この Phase の成果物を作成する
- [ ] 参照資料、成果物、完了条件の整合を確認する
- [ ] artifacts.json の対象 Phase 状態更新条件を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | 不採用根拠 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | tag 不採用根拠 |
| 必須 | doc/00-getting-started-manual/specs/07-edit-delete.md | 本文編集禁止根拠 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用案 A を test matrix の入力にする |
| Phase 6 | 却下案 B / C / D / E が出現していないことを authz test で確認 |
| Phase 8 | DRY 化で middleware 共通化 |

## 多角的チェック観点（不変条件マッピング）

- #11: Alternative B 却下で構造保証
- #13: Alternative C 却下で構造保証
- #14: Alternative D 却下で構造保証
- 認可境界全般: Alternative E 却下で構造保証

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Alternative A〜F 記述 | 3 | pending | outputs/phase-03/main.md |
| 2 | PASS-MINOR-MAJOR 判定 | 3 | pending | 判定根拠を不変条件 # で説明 |
| 3 | 採用案確定 | 3 | pending | A 採用 |
| 4 | Phase 4 引き継ぎ | 3 | pending | test matrix 入力 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | Phase 3 主成果物 |
| メタ | artifacts.json | Phase 3 を completed に更新 |

## 完了条件

- [ ] alternative 5 案以上が記述されている
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
- 引き継ぎ事項: 採用案 A の 18 endpoint × admin gate を verify suite に展開
- ブロック条件: 採用案未確定なら次 Phase に進まない
