# Phase 8 — リスクと対策

元 spec.md セクション 10 を含め拡張。各リスクに detection（gate）と mitigation（実装）を対で記述。

## RISK-1: tag code fetch — suggestedTags の信頼性

**現象**: `suggestedTagsJson` が壊れた JSON / 非 string 配列だと drawer が空 / クラッシュ。

**Detection**: `_tagQueueStatus.spec.ts` および drawer spec で「`suggestedTags=[]` 時に confirmed 不可（validation error）」を assert。

**Mitigation**: `TagQueuePanel` の `parseTags` を share し、drawer に `string[]` のみ渡す。`suggestedTags.length === 0` の場合は confirmed radio を disabled にし rejected のみ受付。

## RISK-2: idempotent UX — 重複 resolve 警告

**現象**: API が `idempotent: true` で返した場合、UI は成功扱いだが「既に処理済」を伝えないと混乱。

**Detection**: drawer spec に「response `idempotent: true` を mock し、toast 文言が `既に処理済です` を含む」assertion を追加。

**Mitigation**: `useAdminMutation` の `onSuccess` で `data.result?.idempotent` を判定し toast 文言を分岐。

## RISK-3: dlq 扱い — terminal items の resolve 拒否

**現象**: `status="dlq"` items も従来 list に並ぶが UI から resolve すると 4xx になる。

**Detection**: drawer spec の TC-D-09。

**Mitigation**: terminal status (`resolved` / `rejected` / `dlq`) のときは submit button を `disabled` + `aria-disabled`、tooltip で理由を提示。drawer 自体は read-only として open 可能（監査向け）。

## RISK-4: drawer state leakage

**現象**: drawer を閉じても `action` / `tagCodes` / `reason` state が残り、別 queue item を開いたとき混入。

**Mitigation**: drawer を `open=false → open=true` の遷移で state を再初期化する `useEffect([queueId], ...)`。または `key={queueId}` で remount。

## RISK-5: form validation の二重実装

**現象**: client validation と `tagQueueResolveBodySchema` の意味が乖離する。

**Mitigation**: client validation は `tagQueueResolveBodySchema.safeParse` を使い、独自 if 文での 1 文字判定は最低限の UX hint のみ。schema を single source of truth に。

## RISK-6: a11y focus trap の取りこぼし

**現象**: focus trap が `Tab` のみで `Shift+Tab` で外に逃げる / open 直後に focus が当たらない。

**Mitigation**: drawer spec で initial focus / Tab / Shift+Tab / return focus を 4 ケース assert。

## RISK-7: design token drift

**現象**: status badge を `bg-[#...]` で書いてしまい token guard で CI が落ちる。

**Mitigation**: `verify-design-tokens` を local で Phase 5 の Step 1 完了後すぐに実行（V-6）。
