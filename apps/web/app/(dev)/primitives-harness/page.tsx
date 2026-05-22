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
} from "@/components/ui";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const sectionClass = "rounded-md border border-[var(--ubm-border-subtle)] bg-[var(--ubm-bg-surface)] p-4";

function PrimitiveSection({
  primitive,
  variant,
  children,
}: {
  primitive: string;
  variant: string;
  children: ReactNode;
}) {
  return (
    <section className={sectionClass} data-primitive={primitive} data-variant={variant} aria-label={`${primitive} ${variant}`}>
      {children}
    </section>
  );
}

export default function PrimitivesHarnessPage() {
  return (
    <main data-testid="primitives-harness" className="min-h-screen space-y-6 bg-[var(--ubm-bg-canvas)] p-6 text-[var(--ubm-text-primary)]">
      <header>
        <h1 className="text-xl font-semibold">UI primitives visual harness</h1>
        <p className="text-sm text-[var(--ubm-text-muted)]">Task-10 runtime screenshot and axe evidence surface.</p>
      </header>

      <h2 className="text-base font-semibold">Representative variants</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <PrimitiveSection primitive="Button" variant="primary">
          <Button variant="primary">Primary action</Button>
        </PrimitiveSection>
        <PrimitiveSection primitive="Button" variant="accent">
          <Button variant="accent">Accent action</Button>
        </PrimitiveSection>
        <PrimitiveSection primitive="Button" variant="ghost">
          <Button variant="ghost">Ghost action</Button>
        </PrimitiveSection>
        <PrimitiveSection primitive="Button" variant="soft">
          <Button variant="soft">Soft action</Button>
        </PrimitiveSection>
        <PrimitiveSection primitive="Button" variant="danger">
          <Button variant="danger">Danger action</Button>
        </PrimitiveSection>
        <PrimitiveSection primitive="Button" variant="loading">
          <Button loading>Loading action</Button>
        </PrimitiveSection>

        <PrimitiveSection primitive="Card" variant="default">
          <Card>
            <CardContent>Default card content</CardContent>
          </Card>
        </PrimitiveSection>
        <PrimitiveSection primitive="Card" variant="with-header">
          <Card>
            <CardHeader>
              <CardTitle>Card title</CardTitle>
              <CardDescription>Card description</CardDescription>
            </CardHeader>
            <CardContent>Body copy</CardContent>
          </Card>
        </PrimitiveSection>
        <PrimitiveSection primitive="Card" variant="with-footer">
          <Card>
            <CardContent>Footer card content</CardContent>
            <CardFooter>
              <Button variant="soft" size="sm">Secondary</Button>
            </CardFooter>
          </Card>
        </PrimitiveSection>

        <PrimitiveSection primitive="Badge" variant="default">
          <Badge>Default</Badge>
        </PrimitiveSection>
        <PrimitiveSection primitive="Badge" variant="success">
          <Badge tone="success" dot>Success</Badge>
        </PrimitiveSection>
        <PrimitiveSection primitive="Badge" variant="warning">
          <Badge tone="warning" dot>Warning</Badge>
        </PrimitiveSection>
        <PrimitiveSection primitive="Badge" variant="danger">
          <Badge tone="danger" dot>Danger</Badge>
        </PrimitiveSection>
        <PrimitiveSection primitive="Badge" variant="info">
          <Badge tone="info" outline>Info</Badge>
        </PrimitiveSection>

        <PrimitiveSection primitive="Input" variant="default">
          <Input aria-label="Default input" placeholder="Default input" />
        </PrimitiveSection>
        <PrimitiveSection primitive="Input" variant="with-label">
          <Field label="Member name">
            {(controlProps) => <Input {...controlProps} placeholder="Name" />}
          </Field>
        </PrimitiveSection>
        <PrimitiveSection primitive="Input" variant="error">
          <Field label="Email" error="Enter a valid email address">
            {(controlProps) => <Input {...controlProps} invalid placeholder="name@example.com" />}
          </Field>
        </PrimitiveSection>
        <PrimitiveSection primitive="Input" variant="disabled">
          <Input aria-label="Disabled input" disabled value="Disabled value" readOnly />
        </PrimitiveSection>

        <PrimitiveSection primitive="Select" variant="default">
          <Select aria-label="Default select" defaultValue="active" options={[{ value: "active", label: "Active" }]} />
        </PrimitiveSection>
        <PrimitiveSection primitive="Select" variant="with-placeholder">
          <Select aria-label="Placeholder select" defaultValue="">
            <option value="" disabled>Select status</option>
            <option value="published">Published</option>
          </Select>
        </PrimitiveSection>
        <PrimitiveSection primitive="Select" variant="disabled">
          <Select aria-label="Disabled select" disabled options={[{ value: "locked", label: "Locked" }]} />
        </PrimitiveSection>

        <PrimitiveSection primitive="Sidebar" variant="default">
          <Sidebar as="div" label="Harness primary sidebar" header={<strong>Admin</strong>}>
            <SidebarSection title="Main">
              <SidebarNavItem href="/harness-overview" icon={<span>H</span>} label="Harness" />
            </SidebarSection>
          </Sidebar>
        </PrimitiveSection>
        <PrimitiveSection primitive="Sidebar" variant="with-footer">
          <Sidebar as="div" label="Harness secondary sidebar" footer={<small>Signed in</small>}>
            <SidebarSection>
              <SidebarNavItem href="/members" icon={<span>M</span>} label="Members" />
            </SidebarSection>
          </Sidebar>
        </PrimitiveSection>

        <PrimitiveSection primitive="Stat" variant="default">
          <Stat label="Members" value="1,248" />
        </PrimitiveSection>
        <PrimitiveSection primitive="Stat" variant="with-delta-up">
          <Stat label="Published" value="82%" delta="+4.2%" tone="up" />
        </PrimitiveSection>
        <PrimitiveSection primitive="Stat" variant="with-delta-down">
          <Stat label="Pending" value="18" delta="-3" tone="down" />
        </PrimitiveSection>

        <PrimitiveSection primitive="EmptyState" variant="default">
          <EmptyState title="No requests" description="New requests will appear here." />
        </PrimitiveSection>
        <PrimitiveSection primitive="EmptyState" variant="with-action">
          <EmptyState title="No members" action={<Button variant="primary" size="sm">Add member</Button>} />
        </PrimitiveSection>

        <PrimitiveSection primitive="Avatar" variant="initials-fallback">
          <Avatar name="Hyogo Member" memberId="member-001" />
        </PrimitiveSection>
        <PrimitiveSection primitive="Avatar" variant="large">
          <Avatar name="Design Lead" memberId="member-002" size="xl" />
        </PrimitiveSection>

        <PrimitiveSection primitive="Field" variant="default">
          <Field label="Display name">
            {(controlProps) => <Input {...controlProps} />}
          </Field>
        </PrimitiveSection>
        <PrimitiveSection primitive="Field" variant="with-error">
          <Field label="Required field" required error="This field is required">
            {(controlProps) => <Input {...controlProps} invalid />}
          </Field>
        </PrimitiveSection>
        <PrimitiveSection primitive="Field" variant="with-hint">
          <Field label="Nickname" hint="Visible to other members">
            {(controlProps) => <Input {...controlProps} />}
          </Field>
        </PrimitiveSection>

        <PrimitiveSection primitive="Banner" variant="info">
          <Banner title="Info">Information banner</Banner>
        </PrimitiveSection>
        <PrimitiveSection primitive="Banner" variant="success">
          <Banner tone="success" title="Success">Success banner</Banner>
        </PrimitiveSection>
        <PrimitiveSection primitive="Banner" variant="warning">
          <Banner tone="warning" title="Warning">Warning banner</Banner>
        </PrimitiveSection>
        <PrimitiveSection primitive="Banner" variant="danger">
          <Banner tone="danger" title="Danger">Danger banner</Banner>
        </PrimitiveSection>
      </div>
    </main>
  );
}
