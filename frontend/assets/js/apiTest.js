/**
 * Mock Data Testing Script
 * Run this in the browser console on the dashboard page
 */

async function testApiFormSaving() {
    console.log('🧪 Starting API Form Saving Test...');

    try {
        // 1. Test Create (New User)
        console.log('--- 1. Testing Create (New User) ---');
        const newUser = {
            username: `test_user_${Date.now()}`,
            password: 'password123',
            fullName: 'Test User Mockup',
            email: `test_${Date.now()}@example.com`,
            role: 'user'
        };

        const createResult = await apiClient.create('User', newUser);
        console.log('✅ Create Success:', createResult);
        const recordId = createResult.record.id;

        // 2. Test Update (Edit User)
        console.log(`--- 2. Testing Update (User ID: ${recordId}) ---`);
        const updateData = {
            fullName: 'Updated Name Mockup',
            phone: '0812345678'
        };

        const updateResult = await apiClient.update('User', recordId, updateData);
        console.log('✅ Update Success:', updateResult);

        // 3. Verify in List
        console.log('--- 3. Verifying in List ---');
        const listResult = await apiClient.list('User', { filters: { username: newUser.username } });
        console.log('✅ List Result (should find 1):', listResult);

        console.log('🎉 All tests passed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.message.includes('redirect')) {
            console.warn('Note: If you got redirected, your session might have expired.');
        }
    }
}

// Call it:
// testApiFormSaving();
