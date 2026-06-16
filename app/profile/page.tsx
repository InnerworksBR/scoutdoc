import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/ProfileClient";

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("id", user.id)
        .single();

    return (
        <ProfileClient
            userEmail={user.email ?? ""}
            avatarUrl={profile?.avatar_url ?? null}
            displayName={profile?.display_name ?? null}
        />
    );
}
