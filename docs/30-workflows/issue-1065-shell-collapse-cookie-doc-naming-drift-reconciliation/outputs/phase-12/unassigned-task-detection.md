# Unassigned Task Detection — issue-1065

- 区分: 実装仕様書（NON_VISUAL / spec_created）
- 判定: **新規未タスク 0 件**

---

## current / baseline 分離

| 区分 | 内容 |
| --- | --- |
| baseline | issue-1065 起点の source unassigned-task（`issue-1024-followup-002-...`）= 本 workflow が consume 済み（再起票しない） |
| current（本タスク完了で残る差分） | 設計 doc の他 phase（履歴）への旧名残存 / Phase 10 §10.4 候補 |

## 関連タスク差分確認（FB-CANCEL-004-2）

既存 `issue-1024-followup` 系との重複チェック:

| followup | 概要 | 本タスクとの重複 |
| --- | --- | --- |
| `issue-1024-followup-002-shell-collapse-cookie-doc-naming-drift-reconciliation` | 命名 drift 整合（= 本タスク） | **consumed**（本 workflow が昇格・新規起票不要） |
| その他 issue-1024-followup 系 | （命名 drift 以外の関心） | 重複なし（別関心） |

→ 重複起票の懸念なし。

## 検出ソース表

| 検出ソース | 検出結果 | 未タスク化 |
| --- | --- | --- |
| 元タスク仕様書スコープ外項目 | shell-collapse-cookie 命名整合に限定。スコープ外残件なし | 0 件 |
| Phase 3 M-1 / M-2（minor 指摘） | doc 整合範囲内で吸収。残る独立タスクなし | 0 件 |
| Phase 10 §10.4 候補 | 「設計 doc 他 phase の旧名残存」を SSOT 完遂レビューで本サイクル内に全整合（後述・user 決定） | 0 件（in-cycle 解消・未タスク化不要） |
| コードコメント TODO | shell-collapse-cookie.ts に TODO / FIXME なし | 0 件 |
| `describe.skip` / テスト skip | 該当なし | 0 件 |

## 判定根拠（新規未タスク 0 件）

1. **source unassigned-task は本 workflow が consume 済み** → 再起票しない。
2. **issue-1024 配下の他 phase doc の alias 残存**は当初「履歴ドキュメントとして保全（整合対象外）」と判断していたが、SSOT 完遂レビューで *phase-2-design は整合済なのに phase-5-implementation は旧名のまま* という内部矛盾（検証 4 条件「矛盾なし」違反）が露見した。user 決定（全整合 / SSOT 完遂）に基づき、本サイクル内で issue-1024 配下の旧名残存 doc（phase-4/5/6/7/8/9/13 + outputs/phase-12 系）を primary 名へ**全整合済み**。dead alias 名が残るのは「削除済みを説明する枠組み」（implementation-guide の SSOT 節・本 detection doc・本 workflow の spec 群）のみ。→ 別タスク化不要（in-cycle 完了）。
3. **Phase 10 §10.4 の改善候補は機能影響なし** だが SSOT の単一性を損なうため上記 2 で本サイクル内に解消した（独立タスク化はしない）。
4. コードコメント TODO / テスト skip 由来の検出は 0 件。

→ **新規未タスク 0 件**。新規 Issue / spec は作成しない。
