// src/components/nav-element.tsx
import Link from 'next/link';
import { FC } from 'react';

export interface NavElementProps {
  label: string;
  href: string;
  navigationStarts?: () => void;
  className?: string;
}

const NavElement: FC<NavElementProps> = ({ label, href, navigationStarts, className }) => {
  return (
    <Link
      href={href}
      onClick={() => navigationStarts && navigationStarts()}
      className={`px-3 py-2 font-medium transition-colors hover:text-[var(--primary)] ${className ?? ''}`}
    >
      {label}
    </Link>
  );
};

export default NavElement;
