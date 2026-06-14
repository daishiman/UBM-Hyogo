# Phase 6 成果物: edge-cases（TC-E-XX 一覧）

> 状態: completed。異常系・境界値テストケース。

## 1. テストケース一覧（異常系・境界値 TC-E-XX）

| ID | 対象 | 入力 | 操作 | 期待 | 配置 spec | AC |
| --- | --- | --- | --- | --- | --- | --- |
| TC-E-01 | `formatPublishStateLabel` 未知値 | `"unknown"` / `""` / `"foo"` | unit | いずれも「不明」を返す（throw なし） | RequestQueueDetail.spec.tsx | AC-3 |
| TC-E-02 | `buildPublishStateDiff` visibility before 未知 | publishState=`"unknown"`, desiredState=`"hidden"` | unit | before=「不明」/ after=「非公開」/ kind=visibility（throw なし） | RequestQueueDetail.spec.tsx | AC-3 |
| TC-E-03 | `desiredState` キー不在 | visibility, payload=`{}` | unit | after=「不明」（throw なし） | RequestQueueDetail.spec.tsx | AC-3 |
| TC-E-04 | `desiredState` 型不一致 | visibility, payload=`null` / `[]` / `{ desiredState: 123 }` | unit | after=「不明」（throw なし。非 object / 配列 / 非 string を narrowing で弾く） | RequestQueueDetail.spec.tsx | AC-3 |
| TC-E-05 | 対象外 note_type | noteType=`"other"`（or 想定外値） | unit | `buildPublishStateDiff` が `null` を返す | RequestQueueDetail.spec.tsx | AC-2, AC-10 |
| TC-E-06 | item null / 描画なし | `buildPublishStateDiff(null)` / 対象外 item を render | unit + render | `null` 返却。diff 行（`.admin-state-diff`）が DOM に存在しない | RequestQueueDetail.spec.tsx | AC-10 |
| TC-E-07 | `destructiveMessage` fallback | visibility だが diff 構築不能（desiredState 欠落） | render（Panel） | 既存汎用文言「公開状態を申請内容に応じて変更します。会員へ即時反映されます。」を返す | RequestQueuePanel.component.spec.tsx | AC-8 |
| TC-E-08 | delete の visibility 非露出（再確認） | D01 | render | `[data-diff-kind="visibility"]` が DOM に存在しない（混同なし） | RequestQueueDetail.spec.tsx | AC-2 |
| TC-E-09 | 矢印 aria-hidden 境界維持 | TC-E-02 / TC-E-03 のように after=「不明」でも diff 行描画されるケース | render | `.admin-state-diff__arrow` が `aria-hidden="true"` を維持 | RequestQueueDetail.spec.tsx | AC-9 |

## 2. 境界値マトリクス

| publishState \ desiredState | `"public"` | `"hidden"` | キー不在 | 非 string |
| --- | --- | --- | --- | --- |
| `"public"` | 公開→公開 | 公開→非公開（TC-01） | 公開→不明（TC-E-03） | 公開→不明（TC-E-04） |
| `"hidden"` | 非公開→公開（TC-02） | 非公開→非公開 | 非公開→不明 | 非公開→不明 |
| `"unknown"` | 不明→公開 | 不明→非公開（TC-E-02） | 不明→不明 | 不明→不明 |

> visibility の before/after はいずれも `formatPublishStateLabel` を通すため、どの組合せでも throw せず日本語ラベル（または「不明」）になる。

## 3. fail-soft 契約の網羅確認

| 関数 | 入力異常 | 期待 |
| --- | --- | --- |
| `formatPublishStateLabel` | 列挙外・空文字 | 「不明」（throw なし） |
| `buildPublishStateDiff` | desiredState 欠落/型不一致 | after「不明」（throw なし） |
| `buildPublishStateDiff` | 対象外 note_type / null | `null`（throw なし） |
| `destructiveMessage` 生成 | diff 構築不能 visibility | 既存汎用文言 fallback |

## 4. 回帰 guard

- `verify-design-tokens`（HEX 0 件・AC-5）。
- HEX grep（対象 3 ファイル・ローカル）。
- VISUAL staging capture（V01/V02/D01・user-gated・Gate-C）は Phase 11。
