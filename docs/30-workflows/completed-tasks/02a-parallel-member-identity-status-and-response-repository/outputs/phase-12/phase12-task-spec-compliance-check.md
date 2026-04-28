# Phase 12 タスク仕様準拠チェック

## チェックリスト

| 仕様要件 | 準拠状況 | 備考 |
|---------|---------|------|
| outputs/ ディレクトリ作成 | ✓ | Phase 1-12 全作成 |
| brand.ts 実装 | ✓ | @ubm-hyogo/shared re-export |
| db.ts 独自 interface | ✓ | D1Db, D1Stmt, DbCtx 定義 |
| sql.ts placeholders | ✓ | 実装済み |
| members.ts 実装 | ✓ | findMemberById, listMembersByIds, upsertMember |
| identities.ts 実装 | ✓ | findIdentityByEmail, findIdentityByMemberId, updateCurrentResponse |
| status.ts 実装 | ✓ | getStatus, listStatusesByMemberIds, setConsentSnapshot, setPublishState, setDeleted |
| responses.ts 実装 | ✓ | findResponseById, listResponsesByIds, findCurrentResponse, listResponsesByEmail, upsertResponse |
| responseSections.ts 実装 | ✓ | listSectionsByResponseId |
| responseFields.ts 実装 | ✓ | listFieldsByResponseId |
| fieldVisibility.ts 実装 | ✓ | listVisibilityByMemberId, setVisibility |
| memberTags.ts 実装（read-only） | ✓ | listTagsByMemberId, listTagsByMemberIds |
| builder.ts 実装 | △ | buildPublicMemberProfile, buildMemberProfile, buildAdminMemberDetailView, buildPublicMemberListItems（バッチ読み取り）。section-field metadata の完全正規化は `UT-02A-SECTION-FIELD-MAPPING-METADATA.md` へ formalize |
| d1mock.ts 実装 | ✓ | MockStore, MockD1, createMockDbCtx |
| members.fixture.ts 実装 | ✓ | テストデータ定義 |
| 全テストファイル実装 | ✓ | repository / shared targeted suite |
| テスト全 PASS | ✓ | 14 files / 163 tests targeted PASS、review後 3 files / 36 tests PASS |
| 型チェック PASS | △ | SubAgent検証では PASS。現ローカル Node は v22.21.1 で repo 要求 Node 24.x と差異あり |
| partial update 禁止 | ✓ | responses.ts に patch API なし |
| admin write 限定 | ✓ | setPublishState, setDeleted のみ |
| adminNotes 分離 | ✓ | builder.ts 引数受け取り |
| @cloudflare/workers-types 非依存（テスト） | ✓ | 独自 D1Db interface |
| artifacts.json 更新 | ✓ | Phase 1-12 completed |
| outputs/artifacts.json 更新 | ✓ | root artifacts と同期 |
| Phase 11 NON_VISUAL 証跡 | ✓ | manual-smoke-log.md / link-checklist.md 追加 |
| root pnpm test | △ | `scripts/with-env.sh` authorization timeout のため環境ブロック |

## 最終判定: PASS WITH ENVIRONMENT NOTE

コード・Phase 12成果物・台帳同期はPASS。section-field metadata の完全正規化は後続High taskとして明示済み。root `pnpm test` はこの作業環境の認可待ちでブロックされたため、対象範囲を絞ったVitest結果を証跡とする。
