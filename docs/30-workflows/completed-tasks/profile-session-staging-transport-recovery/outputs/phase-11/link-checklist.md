# Phase 11 Link Checklist

| Link | Status |
| --- | --- |
| `/profile` 本体描画（復旧確認・RT-C） | pending（user-gated・implemented_local_runtime_pending では未実施） |
| `/login?redirect=/profile` redirect（401 回帰・page.spec.tsx で固定） | PASS（focused tests で確認） |
| 再ログイン CTA（404 回帰・page.spec.tsx で固定） | PASS（focused tests で確認） |
| staging `/profile` authenticated route | user-gated |
| web `/api/me` proxy probe（RT-B） | pending（user-gated） |
| API direct `${API_BASE}/me` probe（RT-B） | pending（user-gated） |
