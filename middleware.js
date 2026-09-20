export const config = {
  matcher:
    "/((?!favicon.ico|icon-192.png|icon-512.png|manifest.webmanifest|assets).*)",
};

export default function middleware(request) {
  const basicAuth = request.headers.get("authorization");

  if (basicAuth) {
    const authValue = basicAuth.split(" ")[1];
    const [user, pwd] = atob(authValue).split(":");

    const validUser = process.env.AUTH_USER || "admin";
    const validPass = process.env.AUTH_PASS || "changeme123";

    if (user === validUser && pwd === validPass) {
      return;
    }
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}
