"use client";

import { IconWorld } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { localeAtom } from "@/lib/atoms";

export default function LanguageSwitcher() {
  const router = useRouter();
  const [locale, setLocale] = useAtom(localeAtom);

  useEffect(() => {
    const currentLocale =
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("NEXT_LOCALE="))
        ?.split("=")[1] || "ar";
    setLocale(currentLocale as "ar" | "en");
  }, []);
  console.log("locale", locale);

  const languages = [
    { code: "ar", name: "عربي", flag: "🇪🇬" },
    { code: "en", name: "Eng", flag: "🇺🇸" },
  ];

  const handleLanguageChange = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setLocale(newLocale as "ar" | "en");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2" size="icon" variant="outline">
          <IconWorld />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            className={locale === language.code ? "bg-accent" : ""}
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
