const fetch = require('node-fetch');

async function testBranch() {
    console.log("Testing POST to create-branch...");
    try {
        const response = await fetch('https://wlcrbwansdbzanpovztq.supabase.co/functions/v1/create-branch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                gymName: 'Titan Test',
                branchName: 'Downtown',
                city: 'TestCity',
                state: 'TestState',
                country: 'TestCountry',
                street: '123 Test St',
                pincode: '12345',
                fullName: 'Test Owner',
                email: 'test@example.com',
                phone: '9876543210'
            })
        });

        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Headers:", response.headers.raw());
        console.log("Body:", text);
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

testBranch();
