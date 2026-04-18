/**
 * Deletion API Test Script
 * Run this in the browser console (F12) while on any application page.
 * Credentials provided: admin / 12345
 */

async function testDeletionApi() {
    console.log('🧪 Starting Deletion API Test...');

    try {
        // 1. Ensure Login (using session or provided credentials)
        console.log('--- 1. Authenticating ---');
        try {
            const loginResult = await apiClient.login('admin', '12345');
            console.log('✅ Login successful:', loginResult);
        } catch (e) {
            console.log('ℹ️ Already logged in or login failed (ignoring if session exists)');
        }

        // 2. Create a few test records to delete
        console.log('--- 2. Creating test records ---');
        const user1 = await apiClient.create('User', {
            username: `del_test_1_${Date.now()}`,
            password: 'pass', fullName: 'Del Test 1', email: `del1_${Date.now()}@test.com`, role: 'user', title_use: 'Mr.'
        });
        const user2 = await apiClient.create('User', {
            username: `del_test_2_${Date.now()}`,
            password: 'pass', fullName: 'Del Test 2', email: `del2_${Date.now()}@test.com`, role: 'user', title_use: 'Mr.'
        });

        const id1 = user1.record.id;
        const id2 = user2.record.id;
        console.log(`✅ Created records: ID ${id1} and ID ${id2}`);

        // 3. Test Single Delete
        console.log(`--- 3. Testing Single Delete (ID: ${id1}) ---`);
        const delResult = await apiClient.delete('User', id1);
        console.log('✅ Single Delete Success:', delResult);

        // 4. Test Bulk Delete
        console.log(`--- 4. Testing Bulk Delete (ID: ${id2}) ---`);
        const bulkDelResult = await apiClient.bulkDelete('User', [id2]);
        console.log('✅ Bulk Delete Success:', bulkDelResult);

        console.log('🎉 Deletion tests completed successfully!');
    } catch (error) {
        console.error('❌ Deletion test failed:', error);
        console.error('Error Details:', error.message);
    }
}

// execute it:
// testDeletionApi();
