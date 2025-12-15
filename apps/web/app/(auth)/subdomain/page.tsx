"use client";

import { Loader } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";

function SubdomainContent() {
  const searchParams = useSearchParams();
  const querySubdomain = searchParams?.get("subdomain") || "";
  const [subdomain] = useState(querySubdomain);

  const handleGo = () => {
    const { protocol, hostname, port } = window.location;
    const isLocal = hostname.includes("localhost");
    const rootDomain = isLocal ? "localhost" : hostname;
    const portSegment = port ? ":" + port : "";
    const target = `${protocol}//${subdomain}.${rootDomain}${portSegment}`;
    window.location.href = target;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-2 text-3xl font-semibold">{subdomain}</h1>
      <p className="text-muted-foreground text-lg">
        {subdomain ? `${subdomain}.example.com` : "No subdomain provided"}
      </p>
      <Button className="mt-6" disabled={!subdomain} onClick={handleGo}>
        Go to my platform
      </Button>
    </div>
  );
}

export default function SubdomainPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <Loader className="text-muted-foreground size-10 animate-spin" />
        </div>
      }
    >
      <SubdomainContent />
    </Suspense>
  );
}
