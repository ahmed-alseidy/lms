"use client";

import { IconLogout } from "@tabler/icons-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarFooter } from "@/components/ui/sidebar";
import { logout } from "@/lib/auth";

export function LowerSidebar({ user }: { user: any }) {
  return (
    <SidebarFooter>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{user.name}</span>
        </div>
        <Button onClick={logout} size="icon" variant="ghost">
          <IconLogout color="red" />
        </Button>
      </div>
    </SidebarFooter>
  );
}
