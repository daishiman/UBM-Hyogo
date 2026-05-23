import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  Select,
  Sidebar,
  SidebarNavItem,
  SidebarSection,
  Stat,
} from "../../../src/components/ui";

export default function UiPrimitivesSmokePage() {
  return (
    <main style={{ display: "grid", gap: 24, padding: 24 }}>
      <section aria-labelledby="task10-buttons">
        <h1 id="task10-buttons">Task 10 UI primitives smoke</h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button variant="primary">Primary</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="soft">Soft</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Card title</CardTitle>
          <CardDescription>Reusable card primitive with header, content, and footer.</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Badge tone="default">Default</Badge>
            <Badge tone="success" dot>
              Success
            </Badge>
            <Badge tone="warning" outline>
              Warning
            </Badge>
            <Badge tone="danger">Danger</Badge>
            <Badge tone="info">Info</Badge>
          </div>
        </CardContent>
        <CardFooter>
          <Button size="sm" variant="primary">
            Footer action
          </Button>
        </CardFooter>
      </Card>

      <section aria-labelledby="task10-form" style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <h2 id="task10-form">Form primitives</h2>
        <Field label="Member name" description="Input primitive with aria-describedby passthrough">
          {(controlProps) => <Input {...controlProps} defaultValue="佐藤 花子" inputSize="md" />}
        </Field>
        <Field label="Zone" hint="Select primitive supports option arrays">
          {(controlProps) => (
            <Select
              {...controlProps}
              defaultValue="kobe"
              options={[
                { value: "kobe", label: "神戸" },
                { value: "himeji", label: "姫路" },
              ]}
            />
          )}
        </Field>
        <Field label="Invalid sample" error="入力内容を確認してください">
          {(controlProps) => <Input {...controlProps} invalid defaultValue="invalid" />}
        </Field>
      </section>

      <section aria-labelledby="task10-status" style={{ display: "grid", gap: 12 }}>
        <h2 id="task10-status">Status primitives</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <Stat label="公開中" value="128" delta="+12" tone="up" />
          <Stat label="未解決" value="7" delta="-3" tone="down" />
        </div>
        <Banner tone="info" title="Information">
          Runtime visual and axe evidence target.
        </Banner>
        <Banner tone="warning" title="Warning">
          Warning banners use alert semantics.
        </Banner>
        <EmptyState title="No pending items" description="Empty state uses status semantics." action={<Button>Reload</Button>} />
      </section>

      <section aria-labelledby="task10-nav" style={{ display: "grid", gap: 12 }}>
        <h2 id="task10-nav">Navigation primitives</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar memberId="member-001" name="佐藤 花子" size="lg" />
          <Avatar name="山田 太郎" size="xl" hue={210} />
        </div>
        <Sidebar label="Task 10 smoke sidebar" header={<strong>Admin</strong>} footer={<small>Footer</small>}>
          <SidebarSection title="Main">
            <SidebarNavItem href="/__smoke__/ui-primitives" icon="D" label="Dashboard" />
            <SidebarNavItem href="/members" icon="M" label="Members" matchPrefix="/members" />
          </SidebarSection>
        </Sidebar>
      </section>
    </main>
  );
}
