// Native fetch is available in Node.js 18+

const BASE_URL = 'http://localhost:3001/api/auth';

async function register() {
    const email = 'auto_test@example.com';
    const password = 'password123';
    const username = 'auto_test_user';

    console.log('1. Sending verification code...');
    const sendCodeRes = await fetch(`${BASE_URL}/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });

    const sendCodeData = await sendCodeRes.json();
    console.log('Send Code Response:', sendCodeData);

    if (!sendCodeData.code) {
        throw new Error('Failed to get code via API');
    }

    const code = sendCodeData.code;
    console.log(`2. Got code: ${code}. Registering user...`);

    const registerRes = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username,
            email,
            password,
            verificationCode: code
        })
    });

    const registerData = await registerRes.json();
    console.log('Register Response:', registerData);
}

register().catch(console.error);
