import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { supabaseAnonKey, supabaseUrl } from "./env"

const PUBLIC_PATHS = ["/login", "/signup", "/verify", "/auth/callback"]

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublic = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path))
  // API routes handle their own auth (requireUser -> 401 JSON via apiErrorResponse);
  // redirecting them to /login here would break fetch().json() on the client.
  const isApi = request.nextUrl.pathname.startsWith("/api/")

  if (!user && !isPublic && !isApi) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return response
}
