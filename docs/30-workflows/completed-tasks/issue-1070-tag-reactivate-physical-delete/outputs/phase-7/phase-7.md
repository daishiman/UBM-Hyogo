# Phase 7: カバレッジ確認

> 変更ブロック（追加 3 関数 + 2 route）のカバレッジ対象範囲・分岐網羅・実測方針を記録する。
> 実装と focused D1 Vitest は後続実装サイクルで完了させる（本 Phase は spec_created のため網羅設計まで）。

## 1. カバレッジ対象範囲（変更ファイルに限定 / FB-BEFORE-QUIT-002）

カバレッジは「本タスクで追加した関数・route の分岐」のみを評価対象とする。広域（`apps/api/**` 全体）指定はしない（既存コードの未カバー行を巻き込まないため、変更ブロックの実測値を残す）。

| # | ファイル | カバレッジ対象 | 対象外（除外理由） |
|---|---------|---------------|-------------------|
| 1 | `apps/api/src/repository/tagDefinitions.ts` | 新規 3 関数（`reactivateTagDefinition` / `countMemberTagReferences` / `physicalDeleteTagDefinition`）+ 型 `PhysicalDeleteTagDefinitionResult` | 既存 write/read 関数（issue-1035 landed）は無変更。型定義は非実行行 |
| 2 | `apps/api/src/routes/admin/tags.ts` | 新規 2 route（`POST /tags/:tagId/reactivate` / `DELETE /tags/:tagId/physical`）+ `appendTagAudit` union 拡張分岐 + `ERROR_TO_STATUS.tag_has_references` | 既存 4 route（GET/POST/PATCH/DELETE logical）は無変更 |
| 3 | `apps/api/src/repository/auditLog.ts` | **対象外**（`AuditTargetType` は既に `"tag"` を含むため変更なし。新 action は `RepoBrand<string>` で型変更不要） | — |
| 4 | `docs/.../01-api-schema.md` | **対象外**（spec doc。実行行を生まない） | ドキュメント |

## 2. 追加 3 関数 + 2 route の分岐網羅表

各 reason 分岐・changed 分岐を 1 ケース以上で網羅する。

### 2.1 repository 関数

| 対象 | concern | 分岐（branch） | カバーするケース | line / branch 目標 |
|------|---------|---------------|-----------------|-------------------|
| `reactivateTagDefinition` | 再有効化 + 冪等 | (a) 不在=null / (b) 既 active → changed:false / (c) active=0→1 → changed:true | L-R3 / L-R2 / L-R1, L-R5 | 100% / 100%（3 分岐） |
| `countMemberTagReferences` | 参照件数 COUNT | (a) 行あり → n / (b) 行なし → 0（`?? 0`） | L-C2(N) / L-C1, L-C3(0) | 100% / 100%（2 分岐） |
| `physicalDeleteTagDefinition` | ガード込み hard delete | (a) 不在 → not_found / (b) referenceCount>0 → has_references / (c) referenceCount===0 → ok:true + DELETE | L-P4 / L-P3 / L-P1, L-P5 | 100% / 100%（3 分岐） |

> 合計 repository 分岐 = 8。各分岐に最低 1 ケース割当済（Phase 4 + Phase 6）。`reactivateTagDefinition` の `if (!row) throw`（UPDATE 後再取得 null）は race 防御の実行不能パスのため branch coverage 計上から除外し、コメントで明示する。

### 2.2 route endpoint

| 対象 | concern | 分岐（branch） | カバーするケース | line / branch 目標 |
|------|---------|---------------|-----------------|-------------------|
| `POST /tags/:tagId/reactivate` | 再有効化 + 404 + 変化時のみ audit | (a) null → 404 / (b) changed:true → audit 1 + 200 / (c) changed:false → audit 0 + 200 | C-R4, E-G1 / C-R1, E-G3 / C-R3, E-G2 | 100% / 100%（3 分岐） |
| `DELETE /tags/:tagId/physical` | hard delete + 404 + 409 + audit | (a) not_found → 404 / (b) has_references → 409 + referenceCount / (c) ok → audit 1 + 204 | C-P4, E-G4 / C-P3, E-G5, E-PR5 / C-P1, E-G6, E-G7 | 100% / 100%（3 分岐） |

> 合計 route 分岐 = 6。`appendTagAudit` の action union 拡張は型のみ（実行分岐は呼び出し側 if で網羅済み）。`ERROR_TO_STATUS.tag_has_references` は has_references ケースで通過。

## 3. 変更行の branch を 100% で保護する実測方針（FB-Feedback-5）

以下の「変更ブロックに固有の分岐」を repository / contract test で**全網羅**し、coverage report の該当行 branch が 100% であることを実測値として残す:

- **reactivate changed true/false**: active=0→1（changed:true, audit 1）vs 既 active（changed:false, audit 0）の 2 経路。idempotency と audit 件数に直結。
- **physical 3 variant**: `not_found` / `has_references`(+referenceCount) / `ok`(204+audit) の判別共用体 3 経路。
- **参照件数境界**: count==0（削除可）/ count==1（最小拒否）/ count==N（複数件数の透過）。
- **physical の active 非依存**: active=1 の tag も参照0なら削除可（E-G7）の分岐通過。
- **code 解放**: physical 後の同 code 再 create 成功（branch ではなく状態遷移の証跡だが coverage と併せて確認）。
- **audit 拒否時 0**: not_found / has_references / reactivate no-op で audit append しない（append 分岐の false 側通過）。

> 実装サイクルでは、これら分岐に各 1 ケース以上を割り当て、未通過 branch（coverage report の `Uncovered Line #s`）が変更ブロックに残らないことを確認する。残った場合は test を追加する。

## 4. カバレッジ取得コマンド（targeted・D1 config 必須）

全件実行は重い（FB-UI-02-2）ため、対象 spec のみで coverage を取得する:

```bash
mise exec -- pnpm exec vitest run --coverage --root=. --config=vitest.d1.config.ts \
  apps/api/src/repository/__tests__/tagDefinitions.lifecycle.repository.spec.ts \
  apps/api/src/routes/admin/tags.lifecycle.contract.spec.ts
```

regression（`tags.contract.spec.ts`）は Phase 9 の品質保証で別途実行する（カバレッジ計測対象は本タスクの新規変更ブロックに限定するため、ここでは含めない）。

## 5. 想定カバレッジ・未到達分岐が無いことの確認手順

| 区分 | 想定 | 確認手順 |
|------|------|----------|
| repository 3 関数 line | 100%（race 防御 throw 除く） | coverage report で `tagDefinitions.ts` の追加 3 関数行に未カバー無し |
| repository 8 分岐 | 100% | §2.1 の各 (a)(b)(c) に対応ケースが PASS していること |
| route 2 endpoint line | 100% | coverage report で 2 route handler に未カバー無し |
| route 6 分岐 | 100% | §2.2 の各 variant（not_found/has_references/ok・null/changed true/false）に対応ケースが PASS |
| 未到達分岐 | 0（実行不能 throw のみ除外） | report の `Uncovered Line #s` が変更ブロックに残らないこと。残れば §3 の対応 case を追加 |

確認手順:
1. §4 のコマンドで coverage 取得。
2. report の `tagDefinitions.ts` / `tags.ts` 行を確認し、追加 3 関数 + 2 route の `Uncovered Line #s` が空であることを確認。
3. `reactivateTagDefinition` の `if (!row) throw`（race 防御）のみ未到達が許容され、コメントで実行不能を明示する。
4. それ以外に未到達がある場合、§2/§3 の対応ケースを Phase 6 spec へ追記して再取得。

## 6. runtime boundary

focused D1 Vitest（`vitest.d1.config.ts`）の PASS を一次証跡とする。coverage 数値のフル取得はコストが高いため、本 wave では対象テスト PASS を主証跡とし、未通過 branch が疑われる場合のみ §4 の coverage command で追加取得する。staging runtime smoke / production physical delete（不可逆）/ PR は user-gated。

## 7. 成果物

| 成果物 | 内容 |
|--------|------|
| 分岐網羅表 | §2（repository 8 分岐 + route 6 分岐、各ケース対応付き） |
| カバレッジ取得方針 | §3 / §4（targeted・D1 config 必須） |
| 未到達分岐 0 の確認手順 | §5（実行不能 throw のみ除外を明示） |
