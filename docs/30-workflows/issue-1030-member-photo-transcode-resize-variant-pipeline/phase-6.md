# Phase 6 — テスト拡充（fail path / 回帰 guard）

> **実装区分: 実装仕様書**。Phase 4 の Green 後に追加する fail path・degrade・回帰 guard・境界補助テストを確定する。
> テストファイルは `*.spec.{ts,tsx}` のみ（invariant #8）。実装は user-gated。

## 1. fail path / degrade

| ケース ID | ファイル | 内容 | 期待値 |
|-----------|----------|------|--------|
| RESIZE-F-1 | `image-resize.spec.ts` | webp 非対応ブラウザ（`convertToBlob`/`toBlob` が `image/png` blob を返す or webp 拒否 → 実装が webp 生成不能を検知）| 例外なし・`original_fallback`・`display===` 原 File・`thumb===null` |
| RESIZE-F-2 | `image-resize.spec.ts` | thumb 用 canvas のみ失敗（display は成功・thumb の convertToBlob が null）| `display instanceof File`(webp 縮小成功)・`thumb===null`・`status` は仕様上 `original_fallback`（thumb 欠落のため）。display 縮小は活かす方針なら `client_generated` だが thumb null 整合を assert。実装方針に合わせ status を明示確認 |
| ROUTE-F-1 | `member-photo.contract.spec.ts` | サーバ受領: thumb 不在 multipart（client が thumb 生成失敗し display のみ送った想定）| 200・`processing_status="original_fallback"`・thumb 列 null（サーバは client の degrade をそのまま受理） |
| ROUTE-F-2 | `member-photo.contract.spec.ts` | `contentHash` 省略（null 許容）で display+thumb 送信 | 200・`content_hash IS NULL`・`processing_status="client_generated"`（hash 欠落は status に影響しない） |
| ROUTE-F-3 | `member-photo.contract.spec.ts` | GET detail: display presign 成功 + thumb presign が **両方** 失敗（display も thumb も null を返す mock）| 200・`photoUrl` undefined・`photoThumbUrl` undefined・detail 本体（identityMemberId/status/profile）は正常（200 維持・fail-soft） |

## 2. 境界・回帰 guard

| ケース ID | ファイル | 内容 | 期待値 |
|-----------|----------|------|--------|
| ROUTE-B-1 | `member-photo.contract.spec.ts` | display が 256KB ちょうど（262144B）+ thumb 64KB ちょうど（65536B）| 200・両 put（境界内許容） |
| ROUTE-B-2 | `member-photo.contract.spec.ts` | thumb が 65537B（1 超過）・display は正常 | 413・副作用ゼロ（display も put しない） |
| ROUTE-B-3 | `member-photo.contract.spec.ts` | display 262145B（1 超過）・thumb は正常 | 413・副作用ゼロ |
| ROUTE-R-1（回帰）| `member-photo.contract.spec.ts` | **旧 client 回帰**: 旧 `file` 単一 POST → 既存 ROUTE-C-1 相当が引き続き 200・avatar put・audit 1 件 | 既存挙動不変（破壊なし）+ `processing_status="original_fallback"` |
| ROUTE-R-2（回帰）| `member-photo.contract.spec.ts` | 0023 以前相当行（thumb 列 NULL）に対する GET detail | 200・`photoUrl` のみ（thumb presign 不呼び出し）・`photoThumbUrl` undefined |
| REPO-B-1 | `memberPhotos.spec.ts` | `content_hash` に空文字でなく NULL を保存 → get | `contentHash===null`（NULL 許容回帰） |
| SCHEMA-T-1 | `viewmodel-photo.spec.ts`（既存拡張）| `photoThumbUrl` 正しい url を parse 成功 | `result.success===true`・`data.photoThumbUrl` 一致 |
| SCHEMA-T-2 | `viewmodel-photo.spec.ts` | `photoThumbUrl` なしでも parse 成功（後方互換 `.strict()` 維持）| 成功 |
| SCHEMA-T-3 | `viewmodel-photo.spec.ts` | `photoThumbUrl` が非 url（"not-a-url"）| reject |
| SCHEMA-T-4 | `viewmodel-photo.spec.ts` | `photoUrl` + `photoThumbUrl` 同時 + 未知フィールド | strict reject（未知のみ拒否・両 url 単体は許容を別ケースで確認） |
| AVATAR-B-1 | `MemberAvatar.spec.tsx` | sm + `photoThumbUrl` 有 + thumb img onError → display へ自動 fallback しないこと（onError は Avatar 内 placeholder へ・src 二段切替は行わない）| `<img>` 消失 → hue placeholder（3 段の最終段は placeholder で確定） |

## 3. カバレッジ意図

- **fail-soft の網羅**: presign 片方失敗 / 両方失敗 / secret 未設定（既存 ROUTE-E-1）で detail が常に 200 を返すことを確認し、画像配信の degrade が UX を壊さないことを保証。
- **無料枠 invariant の回帰**: client 生成失敗時にサーバが原本を `original_fallback` で受理する経路（ROUTE-F-1）を固定し、サーバ側画像処理を後から混入させない gate とする。
- **後方互換 gate**: ROUTE-R-1/R-2・REPO-V-3・SCHEMA-T-2 を「旧 client / 旧行 / 旧 schema を壊さない」回帰スイートとして残す。
- **境界の二重化**: 256KB / 64KB の ちょうど / +1 を display・thumb 双方で持ち、上限定数変更時に必ず fail するようにする。

## 4. 実行・DoD

```bash
mise exec -- pnpm typecheck && mise exec -- pnpm lint
pnpm --filter @repo/api test
# web / shared 該当 vitest project
```
- [ ] §1・§2 全ケース pass（実装後）
- [ ] 既存スイート全 pass（回帰ゼロ）
- [ ] 上限定数を変えると ROUTE-B-1..3 が fail することを手動確認（guard 有効性）

## 完了条件（Phase 6）

- [x] fail path / degrade / 境界 / 回帰 guard のケース ID と期待値を列挙
- [x] webp 非対応 / thumb 生成失敗のサーバ受理 / content_hash null / display 256KB 超 / 旧 client / presign 両失敗を網羅
- [x] カバレッジ意図を明記
- [x] 出力: [outputs/phase-6/test-expansion-result.md](outputs/phase-6/test-expansion-result.md)（実装サイクルで生成）
