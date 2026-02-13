import {
  IconChevronLeft,
  IconChevronRight,
  IconDots,
} from "@tabler/icons-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      data-slot="pagination"
      role="navigation"
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("gap-0.5 flex items-center", className)}
      data-slot="pagination-content"
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
  noText?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">;

function PaginationLink({
  className,
  isActive,
  noText = false,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      asChild
      className={cn(className)}
      size={size}
      variant={isActive ? "outline" : "ghost"}
    >
      <a
        aria-current={isActive ? "page" : undefined}
        data-active={isActive}
        data-slot="pagination-link"
        {...props}
      />
    </Button>
  );
}

function PaginationPrevious({
  className,
  noText = false,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      className={cn("ps-1.5!", className)}
      size="default"
      {...props}
    >
      <IconChevronLeft className="rotate-rtl" data-icon="inline-start" />
      {!noText && <span className="hidden sm:block">Previous</span>}
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  noText = false,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      className={cn("pe-1.5!", className)}
      size="default"
      {...props}
    >
      {!noText && <span className="hidden sm:block">Next</span>}
      <IconChevronRight className="rotate-rtl" data-icon="inline-end" />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-8 justify-center [&_svg:not([class*='size-'])]:size-4 flex items-center",
        className
      )}
      data-slot="pagination-ellipsis"
      {...props}
    >
      <IconDots />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
