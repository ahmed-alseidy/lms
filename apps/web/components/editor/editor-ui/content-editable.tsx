import { ContentEditable as LexicalContentEditable } from "@lexical/react/LexicalContentEditable";
import { useAtom } from "jotai";
import { JSX } from "react";
import { localeAtom } from "@/lib/atoms";

type Props = {
  placeholder: string;
  className?: string;
  placeholderClassName?: string;
};

export function ContentEditable({
  placeholder,
  className,
  placeholderClassName,
}: Props): JSX.Element {
  const [locale] = useAtom(localeAtom);

  return (
    <LexicalContentEditable
      aria-placeholder={placeholder}
      className={
        className ??
        `ContentEditable__root relative block min-h-72 overflow-auto  px-8 py-4 focus:outline-none ${locale === "ar" ? "text-right" : "text-left"}`
      }
      placeholder={
        <div
          className={
            placeholderClassName ??
            `pointer-events-none absolute left-0 top-0 select-none overflow-hidden text-ellipsis px-8 py-[18px] text-muted-foreground`
          }
        >
          {placeholder}
        </div>
      }
    />
  );
}
