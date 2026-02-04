import { getCurrentSession } from "@/lib/session";
import { getTeacherProfileServer } from "@/lib/users-server";
import { SettingsContent } from "./_components/settings-content";

export default async function SettingsPage() {
  const session = await getCurrentSession();
  const teacherProfile = await getTeacherProfileServer();

  if (!session?.user) {
    return null;
  }

  return (
    <SettingsContent
      teacherProfile={teacherProfile}
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
    />
  );
}
