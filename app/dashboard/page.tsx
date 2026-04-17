import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

export default async function Dashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const [{ data: documents }, { data: agents }, { data: profile }] = await Promise.all([
        supabase.from("documents").select("*").order("created_at", { ascending: false }),
        supabase.from("agents").select("id, name, description, avatar_color").eq("is_active", true),
        supabase.from("profiles").select("role").eq("id", user.id).single(),
    ]);

    if (profile?.role === "admin") redirect("/admin");

    const firstName = user.email?.split("@")[0].split(".")[0] ?? "Chefe";
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

    return (
        <DashboardLayout
            firstName={capitalizedName}
            userEmail={user.email ?? ""}
            documents={documents || []}
            agents={agents || []}
        />
    );
}
