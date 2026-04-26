import { describeRuntimeFoundation, runtimeFoundation } from "@ubm-hyogo/shared";

export default function Home() {
  return (
    <main>
      <h1>UBM Hyogo Runtime Foundation</h1>
      <dl>
        <div>
          <dt>Web runtime</dt>
          <dd>{runtimeFoundation.webRuntime}</dd>
        </div>
        <div>
          <dt>API runtime</dt>
          <dd>{runtimeFoundation.apiRuntime}</dd>
        </div>
        <div>
          <dt>Version policy</dt>
          <dd>{describeRuntimeFoundation()}</dd>
        </div>
      </dl>
    </main>
  );
}
