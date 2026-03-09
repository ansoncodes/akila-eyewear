"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function segmentLabel(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AdminBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return <p className="text-sm text-[#8a7c73]">Dashboard</p>;
  }

  const links = segments.slice(1).map((segment, index) => {
    const href = `/${segments.slice(0, index + 2).join("/")}`;
    return {
      href,
      label: segmentLabel(segment),
      isLast: index === segments.length - 2,
    };
  });

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-[#8a7c73]">
      <Link href="/admin" className="hover:text-[#4f423a]">
        Dashboard
      </Link>
      {links.map((item) => (
        <span key={item.href} className="flex items-center gap-2">
          <span>/</span>
          {item.isLast ? (
            <span className="text-[#4f423a]">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-[#4f423a]">
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
