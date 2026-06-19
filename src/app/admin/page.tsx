import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin — Suckstobeanik",
};

export default function AdminPage() {
  redirect("/admin/dashboard");
}
