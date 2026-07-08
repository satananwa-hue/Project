import { getAdminSession } from "@/lib/admin-session";
import { AdminLoginForm } from "./login-form";
import { AdminDashboard } from "./dashboard";

export default async function AdminPage() {
  const profile = await getAdminSession();

  if (!profile) {
    return <AdminLoginForm />;
  }

  return <AdminDashboard profile={profile} />;
}
