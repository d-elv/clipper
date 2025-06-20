"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/util/cn";
import { Bars3Icon, FilmIcon, HomeIcon } from "@heroicons/react/24/solid";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface MobileLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  onOpenChange: (open: boolean) => void;
}
function MobileLink({ onOpenChange, className, ...props }: MobileLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === props.href;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex w-full flex-row items-center rounded px-4 py-2 aria-[current='page']:bg-gray-100",
        className,
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost">
          <Bars3Icon className="size-5" />
          <span className="sr-only">menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <nav className="mt-3">
          <ul className="flex flex-col gap-3">
            <li>
              <MobileLink onOpenChange={setOpen} href="/">
                <HomeIcon className="mr-2 size-4" /> Home
              </MobileLink>
            </li>
            <li>
              <MobileLink onOpenChange={setOpen} href="/edit">
                <FilmIcon className="mr-2 size-4" /> Edit
              </MobileLink>
            </li>
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function TopNav() {
  return (
    <div className="sticky top-0 z-10 flex flex-col bg-orange-50">
      <div className="flex flex-row items-center justify-between">
        <MobileNav />
      </div>
      <Separator />
    </div>
  );
}
