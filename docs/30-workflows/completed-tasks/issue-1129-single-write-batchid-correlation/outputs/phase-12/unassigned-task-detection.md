# 未タスク検出レポート — issue-1129 単一 tag write batchId 相関キー付与

> 0 件でも出力必須。`current`（本サイクルで新規に顕在化した未タスク）と
> `baseline`（既知だが今サイクルでは起票しない候補）を分離記録する。

---

## current: 本サイクルで新規に顕在化した未タスク

**新規未タスク: 0 件。**

| 検出観点 | 結果 |
| --- | --- |
| 確定設計から漏れた実装事項 | なし（assign / unassign 両経路 + noop 非退化 + read 側非改修まで設計確定） |
| TODO / FIXME / skip コメント | なし（implemented_local_evidence_captured・プロダクトコードは `apps/api/src/routes/admin/members.ts` の audit payload 変更のみ） |
| Phase 10 残課題からの未起票 | なし（残課題はすべて baseline 候補として下記に記録済み） |

> 本タスクの実装範囲（単一 write payload への `batchId` 付与）は Phase 1-11 で閉じており、
> 取りこぼした「今すぐ起票すべき」独立タスクは存在しない。

---

## baseline: 起票しない候補（理由付き）

| 候補 | 内容 | 起票しない理由 | 区分 |
| --- | --- | --- | --- |
| セッション単位相関 | 複数リクエストを横断して 1 つの相関 ID でまとめる（リクエスト単位ではなく操作セッション単位） | **YAGNI・需要未顕在**。request header / session token の新設が前提となり高コスト。リクエスト単位相関で初回価値（単一 write が batchId フィルタに乗る）は十分得られる。Phase 1 の「真の論点」で将来層として分離済み | `excluded` |

> セッション単位相関は今サイクルでは **起票せず `excluded` として明記** する。
> 需要が顕在化した時点（複数の単一操作をまとめて追跡したい運用要望が出た時点）で別タスクとして再評価する。

---

## 関連タスク差分確認（FB-CANCEL-004-2）

本タスクが既存・近接タスクと重複しないことを確認する。

| 対象 | スコープ | 本タスクとの差分 | 重複 |
| --- | --- | --- | --- |
| #1079（親） | bulk audit の batchId を `GET /admin/audit?batchId=` で検索可能にする（read 側 `json_extract` OR 検索） | 本タスクは **write 側** payload に batchId を付与する層。read 側は #1079 のまま非改修 | なし |
| #1036 | bulk member tag assign（`POST /admin/members/tags/bulk`）の write・batchId 一括生成・非対称配置 | 本タスクは **単一 write**（`:memberId/tags`）への同 payload 形の適用拡張。bulk 経路は非改修 | なし |
| #1128（sibling） | `audit_log` の batchId index 最適化（VIRTUAL generated column + 部分 index による検索性能改善） | 本タスクは **payload 付与層**。index / 性能層には触れない。互いに独立（payload があれば index が効き、index は payload の有無に非依存） | なし |

> 結論: 親 #1079 / #1036 / sibling #1128 のいずれとも責務が重ならない。本タスクは
> 「単一 write payload への batchId 付与」という未カバー領域のみを扱う。

---

## 完了条件

- [x] current（新規未タスク 0 件）を記録した
- [x] baseline 候補（セッション単位相関 = YAGNI / 需要未顕在）を `excluded` として理由付きで記録した
- [x] current と baseline を分離記録した
- [x] 関連タスク差分確認（#1079 / #1036 / #1128 重複なし）を記録した（FB-CANCEL-004-2）
