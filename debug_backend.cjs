const jwt = require('jsonwebtoken');

// Since server is ES module, and we are using .cjs, we can just use built-in fetch if node version > 18.
// Node version in logs is v24.12.0, so global fetch is available.

const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production-12345'; // From .env
const API_URL = 'http://localhost:3001/api/admin';

// 1. Generate Token
const token = jwt.sign(
    { userId: 1, username: 'admin', email: 'admin@example.com', role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
);

console.log('--- Generated Debug Token ---');
// console.log(token);

const styleId = 'debug_style_' + Date.now();
const config = {
    groups: [
        { id: 'g1', label: 'Test Group', type: 'text', default: 'hello' }
    ]
};

async function runTest() {
    console.log(`\nTesting StyleID: ${styleId}`);

    // 2. Test Error Case (Publish before Save)
    console.log('\n[Step 1] Try Publish before Save (Should Fail 404)');
    await callApi(`${API_URL}/advanced-settings/${styleId}/publish`, 'POST');

    // 3. Test Save
    console.log('\n[Step 2] Save Draft');
    await callApi(`${API_URL}/advanced-settings/${styleId}`, 'PUT', { config });

    // 4. Test Publish
    console.log('\n[Step 3] Publish');
    await callApi(`${API_URL}/advanced-settings/${styleId}/publish`, 'POST');

    // 5. Verify via Public API
    console.log('\n[Step 4] Verify Public API (Generator)');
    // Use encodeURIComponent just in case, though styleId here is safe
    const verifyUrl = `http://localhost:3001/api/advanced-settings/${encodeURIComponent(styleId)}`;
    const res = await fetch(verifyUrl);
    const data = await res.json();
    console.log('Params:', verifyUrl);
    console.log('Result:', JSON.stringify(data, null, 2));
}

async function callApi(url, method, body) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(url, options);
        console.log(`> ${method} ${url} -> Status: ${res.status}`);
        const text = await res.text();
        try {
            console.log('  Response:', JSON.parse(text));
        } catch {
            console.log('  Response:', text);
        }
    } catch (err) {
        console.error('Request failed:', err.message);
    }
}

runTest();
