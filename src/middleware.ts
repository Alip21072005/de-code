import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

const matchers = Object.keys(routeAccessMap)
  .filter(route => routeAccessMap[route]) // Pastikan ada akses yang ditentukan
  .map(route => ({
    matcher: createRouteMatcher([route]),
    allowedRoles: routeAccessMap[route],
  }));

console.log("Middleware Matchers:", matchers);

export default clerkMiddleware((auth, req) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role; // Hindari `role!`, gunakan optional chaining

  if (!role) {
    console.warn("User tanpa role mencoba mengakses halaman:", req.url);
    return NextResponse.redirect(new URL("/login", req.url)); // Redirect ke login jika role tidak ditemukan
  }

  for (const { matcher, allowedRoles } of matchers) {
    if (matcher(req) && !allowedRoles.includes(role)) {
      console.warn(`Akses ditolak untuk ${role} ke ${req.url}`);
      return NextResponse.redirect(new URL(`/${role}`, req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)", // Middleware tetap berjalan di API routes
  ],
};
