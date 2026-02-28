async function testQuizApi() {
    const url = 'http://localhost:3000/api/quiz';
    console.log(`Testing Quiz API stability: ${url}`);

    for (let i = 1; i <= 3; i++) {
        console.log(`Test case ${i}: Fetching...`);
        const startTime = Date.now();
        try {
            const res = await fetch(url);
            const duration = Date.now() - startTime;

            if (res.ok) {
                const data = await res.json();
                console.log(`✅ Success in ${duration}ms`);
                console.log(`   Ayah: ${data.ayah.substring(0, 50)}...`);
                console.log(`   Options count: ${data.options?.length}`);
            } else {
                const errorData = await res.json();
                console.log(`❌ Failed in ${duration}ms:`, errorData.error);
            }
        } catch (err) {
            console.log(`❌ Error: ${err.message}`);
        }
        console.log('---');
    }
}

testQuizApi();
