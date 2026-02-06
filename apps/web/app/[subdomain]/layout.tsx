"use client";

import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { subdomain } = useParams();
  const [hasSubdomain, setHasSubdomain] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSubdomain = async () => {
      try {
        const res = await fetch(
          `/api/check-subdomain?subdomain=${subdomain}`
        );
        const data = await res.json();
        setHasSubdomain(data.hasSubdomain);
      } catch (error) {
        setHasSubdomain(false);
      }
    };
    checkSubdomain();
  }, [subdomain]);

  if (hasSubdomain === null) {
    return null;
  }
  console.log(hasSubdomain);

  if (!hasSubdomain) {
    return (<div className="flex min-h-screen items-center justify-center">Subdomain not found</div>);
  }

  return <>{children}</>;
}
