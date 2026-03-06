import { redirect } from "next/navigation"

// The main dashboard lives at /admin — redirect here for backwards compatibility.
export default function AdminDashboardRedirect() {
  redirect("/admin")
}