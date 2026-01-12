import 'dotenv/config';

const NEON_AUTH_URL = process.env.VITE_NEON_AUTH_URL || process.env.NEON_AUTH_URL;

async function main() {
    console.log('Testing Neon Auth Session Validation (Raw Fetch)...');
    console.log('URL:', NEON_AUTH_URL);

    const email = `test.session.fetch.${Date.now()}@seido.sg`;
    const password = 'password123';

    console.log(`Registering user: ${email}`);

    // Sign Up
    const signupRes = await fetch(`${NEON_AUTH_URL}/sign-up/email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:3000'
        },
        body: JSON.stringify({
            email,
            password,
            name: 'Session Tester'
        })
    });

    if (!signupRes.ok) {
        console.error('Registration failed:', signupRes.status, await signupRes.text());
        process.exit(1);
    }

    const data = await signupRes.json();
    console.log('Registration successful.');

    // Extract token
    const token = data.token || data?.session?.token;
    console.log('Session Token:', token);

    // Test 1: Bearer Token
    console.log('\n--- Test 1: Bearer Token ---');
    try {
        const res = await fetch(`${NEON_AUTH_URL}/get-session`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const body = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${body.substring(0, 200)}`);
    } catch (e) {
        console.error('Test 1 failed:', e);
    }

    // Test 3: Raw Cookie (Unsigned)
    console.log('\n--- Test 3: Raw Cookie (Unsigned) ---');
    try {
        const cookieHeader = `__Secure-neon-auth.session_token=${token}`;
        console.log(`Using Cookie: ${cookieHeader}`);

        const res = await fetch(`${NEON_AUTH_URL}/get-session`, {
            headers: {
                'Cookie': cookieHeader
            }
        });
        const body = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${body.substring(0, 200)}`);
    } catch (e) {
        console.error('Test 3 failed:', e);
    }

    // Test 4: POST Body
    console.log('\n--- Test 4: POST Body ---');
    try {
        const res = await fetch(`${NEON_AUTH_URL}/get-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token
            })
        });
        const body = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${body.substring(0, 200)}`);
    } catch (e) {
        console.error('Test 4 failed:', e);
    }

    // Test 5: Query Param
    console.log('\n--- Test 5: Query Param ---');
    try {
        const res = await fetch(`${NEON_AUTH_URL}/get-session?token=${token}`, {
            headers: {
                // Try without header, or with blank
            }
        });
        const body = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${body.substring(0, 200)}`);
    } catch (e) {
        console.error('Test 5 failed:', e);
    }

    // Test 6: List Sessions (Bearer)
    console.log('\n--- Test 6: List Sessions ---');
    try {
        const res = await fetch(`${NEON_AUTH_URL}/list-sessions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const body = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${body.substring(0, 200)}`);
    } catch (e) {
        console.error('Test 6 failed:', e);
    }

    // Test 7: User Profile (Bearer)
    console.log('\n--- Test 7: User/Me ---');
    try {
        const res = await fetch(`${NEON_AUTH_URL}/user-info`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const body = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Body: ${body.substring(0, 200)}`);
    } catch (e) {
        console.error('Test 7 failed:', e);
    }
}

main().catch(console.error);
