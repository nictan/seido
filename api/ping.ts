export default function handler(request: Request) {
    return new Response(JSON.stringify({
        message: "Pong!",
        hasDbUrl: !!process.env.DATABASE_URL,
        hasJwks: !!process.env.NEON_AUTH_JWKS_URL,
        nodeEnv: process.env.NODE_ENV,
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
