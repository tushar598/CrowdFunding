// "use client";

// import Link from "next/link";
// import { ConnectButton } from "@rainbow-me/rainbowkit";
// import { useRef, useState } from "react";
// import { usePathname } from "next/navigation";

// /** SVG Starburst decoration used in the brand */
// function Starburst({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
//   return (
//     <svg
//       viewBox="0 0 100 100"
//       fill={color}
//       stroke="var(--border-color)"
//       strokeWidth="2"
//       strokeLinejoin="round"
//       width={size}
//       height={size}
//     >
//       <polygon points="50,0 62,35 98,35 69,57 80,92 50,71 20,92 31,57 2,35 38,35" />
//     </svg>
//   );
// }

// function HamburgerIcon({ open }: { open: boolean }) {
//   return (
//     <svg
//       width="22"
//       height="22"
//       viewBox="0 0 22 22"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2.5"
//       strokeLinecap="round"
//     >
//       {open ? (
//         <>
//           <line x1="4" y1="4" x2="18" y2="18" />
//           <line x1="18" y1="4" x2="4" y2="18" />
//         </>
//       ) : (
//         <>
//           <line x1="3" y1="6" x2="19" y2="6" />
//           <line x1="3" y1="11" x2="19" y2="11" />
//           <line x1="3" y1="16" x2="19" y2="16" />
//         </>
//       )}
//     </svg>
//   );
// }

// export function Navbar() {
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const pathname = usePathname();
//   const drawerRef = useRef<HTMLDivElement>(null);
//   const prevPathRef = useRef(pathname);

//   // Close drawer on route change — computed during render, no useEffect needed
//   if (prevPathRef.current !== pathname) {
//     prevPathRef.current = pathname;
//     if (mobileOpen) {
//       setMobileOpen(false);
//     }
//   }

//   const closeMobile = () => setMobileOpen(false);

//   const isActive = (href: string) =>
//     href === "/" ? pathname === "/" : pathname.startsWith(href);

//   return (
//     <>
//       <nav className="navbar">
//         {/* Logo */}
//         <Link href="/" className="navbar-logo">
//           <Starburst size={22} color="var(--lime)" />
//           <span className="navbar-logo-text">MiniCrowdfund</span>
//           <span className="navbar-logo-dot" />
//         </Link>

//         {/* Right side: desktop links + wallet + hamburger */}
//         <div className="navbar-right">
//           {/* Desktop nav links */}
//           <div className="navbar-desktop-links">
//             <Link
//               href="/explore"
//               className={`nav-link${isActive("/explore") ? " nav-link-active" : ""}`}
//             >
//               Explore
//             </Link>
//             <Link
//               href="/dashboard"
//               className={`nav-link${isActive("/dashboard") ? " nav-link-active" : ""}`}
//             >
//               Dashboard
//             </Link>
//             <Link href="/create" className="btn btn-primary btn-sm">
//               + New Campaign
//             </Link>
//           </div>

//           <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
//           <button
//             className="hamburger-btn"
//             onClick={() => setMobileOpen((o) => !o)}
//             aria-label="Toggle navigation menu"
//             aria-expanded={mobileOpen}
//           >
//             <HamburgerIcon open={mobileOpen} />
//           </button>
//         </div>
//       </nav>

//       {/* Overlay */}
//       {mobileOpen && (
//         <div
//           className="mobile-overlay"
//           onClick={closeMobile}
//           aria-hidden="true"
//         />
//       )}

//       {/* Mobile Drawer */}
//       <div
//         ref={drawerRef}
//         className={`mobile-drawer${mobileOpen ? " mobile-drawer-open" : ""}`}
//         aria-hidden={!mobileOpen}
//       >
//         <div className="mobile-drawer-inner">
//           <Link
//             href="/explore"
//             className={`mobile-nav-link${isActive("/explore") ? " mobile-nav-link-active" : ""}`}
//             onClick={closeMobile}
//           >
//             <span>🔍</span> Explore
//           </Link>
//           <Link
//             href="/dashboard"
//             className={`mobile-nav-link${isActive("/dashboard") ? " mobile-nav-link-active" : ""}`}
//             onClick={closeMobile}
//           >
//             <span>📊</span> Dashboard
//           </Link>
//           <div className="mobile-drawer-divider" />
//           <Link
//             href="/create"
//             className="btn btn-primary"
//             style={{ width: "100%", justifyContent: "center" }}
//             onClick={closeMobile}
//           >
//             + New Campaign
//           </Link>
//         </div>
//       </div>
//     </>
//   );
// }


"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/explore", label: "Explore", icon: "🔍" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
] as const;

/** SVG Starburst decoration used in the brand */
function Starburst({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill={color}
      stroke="var(--border-color)"
      strokeWidth="2"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <polygon points="50,0 62,35 98,35 69,57 80,92 50,71 20,92 31,57 2,35 38,35" />
    </svg>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      {open ? (
        <>
          <line x1="4" y1="4" x2="18" y2="18" />
          <line x1="18" y1="4" x2="4" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="19" y2="6" />
          <line x1="3" y1="11" x2="19" y2="11" />
          <line x1="3" y1="16" x2="19" y2="16" />
        </>
      )}
    </svg>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change (back/forward buttons included).
  // React-sanctioned "adjust state during render" pattern: state, not a mutated ref.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // While the drawer is open: Escape closes it, page behind doesn't scroll,
  // and it auto-closes if the viewport grows to desktop width.
  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    mq.addEventListener("change", onChange);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      mq.removeEventListener("change", onChange);
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  // Segment-safe match: "/explore" matches "/explore/42" but not "/explorer"
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav className="navbar" aria-label="Main">
        {/* Logo */}
        <Link href="/" className="navbar-logo" aria-label="MiniCrowdfund home">
          <Starburst size={22} color="var(--lime)" />
          <span className="navbar-logo-text">MiniCrowdfund</span>
          <span className="navbar-logo-dot" aria-hidden="true" />
        </Link>

        {/* Right side: desktop links + wallet + hamburger */}
        <div className="navbar-right">
          <div className="navbar-desktop-links">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link${isActive(href) ? " nav-link-active" : ""}`}
                aria-current={isActive(href) ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
            <Link href="/create" className="btn btn-primary btn-sm">
              + New Campaign
            </Link>
          </div>

          <ConnectButton
            showBalance={false}
            chainStatus={{ smallScreen: "none", largeScreen: "icon" }}
            accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
          />

          <button
            type="button"
            className="hamburger-btn"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-drawer"
          >
            <HamburgerIcon open={mobileOpen} />
          </button>
        </div>
      </nav>

      {/* Overlay */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={closeMobile} aria-hidden="true" />
      )}

      {/* Mobile Drawer — hidden via CSS `visibility` when closed, so its links
          are removed from the tab order and the accessibility tree */}
      <div
        id="mobile-drawer"
        className={`mobile-drawer${mobileOpen ? " mobile-drawer-open" : ""}`}
      >
        <div className="mobile-drawer-inner">
          {NAV_LINKS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`mobile-nav-link${isActive(href) ? " mobile-nav-link-active" : ""}`}
              aria-current={isActive(href) ? "page" : undefined}
              onClick={closeMobile}
            >
              <span aria-hidden="true">{icon}</span> {label}
            </Link>
          ))}
          <div className="mobile-drawer-divider" />
          <Link href="/create" className="btn btn-primary mobile-cta" onClick={closeMobile}>
            + New Campaign
          </Link>
        </div>
      </div>
    </>
  );
}