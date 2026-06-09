import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminTagCatalogPage() {
  redirect("/admin/tag-master");
}
