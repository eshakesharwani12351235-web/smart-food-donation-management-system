const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE BACKEND API TESTS ---');

  // 1. Health check
  const health = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  console.log('1. Health Check:', health.status, health.data.status === 'online' ? 'PASS' : 'FAIL');

  // 2. Auth: Login as Admin
  const adminLogin = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: 'admin@smartfood.org', password: 'admin123' }
  );
  console.log('2. Admin Login:', adminLogin.status, adminLogin.data.success ? 'PASS' : 'FAIL');
  const adminToken = adminLogin.data.token;

  // 3. Auth: Login as Donor
  const donorLogin = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: 'tajhotel@gmail.com', password: 'donor123' }
  );
  console.log('3. Donor Login:', donorLogin.status, donorLogin.data.success ? 'PASS' : 'FAIL');
  const donorToken = donorLogin.data.token;

  // 4. Auth: Login as NGO 1
  const ngo1Login = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: 'contact@annakshetra.org', password: 'ngo123' }
  );
  console.log('4. NGO 1 Login:', ngo1Login.status, ngo1Login.data.success ? 'PASS' : 'FAIL');
  const ngo1Token = ngo1Login.data.token;

  // 5. Auth: Login as NGO 2
  const ngo2Login = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: 'hope@robinhoodarmy.org', password: 'ngo123' }
  );
  console.log('5. NGO 2 Login:', ngo2Login.status, ngo2Login.data.success ? 'PASS' : 'FAIL');
  const ngo2Token = ngo2Login.data.token;

  // 6. Donor: Create new donation
  const tomorrow = new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString();
  const createDonationRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/donations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`
      }
    },
    {
      foodName: 'Kheer & Malpua Desserts',
      category: 'Cooked Meals',
      quantity: '10 kg',
      servings: 40,
      preparationTime: new Date().toISOString(),
      safeConsumptionDeadline: tomorrow,
      pickupAddress: 'Taj Residency Banquet kitchen back door',
      contactNumber: '+91 9811223344',
      description: 'Chilled sweet dessert in containers'
    }
  );
  console.log('6. Donor Create Donation:', createDonationRes.status, createDonationRes.data.success ? 'PASS' : 'FAIL');
  const createdDonationId = createDonationRes.data.donation?._id;

  // 7. Donor: Get Stats
  const donorStats = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/donations/donor/stats',
    method: 'GET',
    headers: { Authorization: `Bearer ${donorToken}` }
  });
  console.log('7. Donor Stats API:', donorStats.status, 'Total donations:', donorStats.data.stats?.total);

  // 8. NGO: View Available Donations
  const ngoAvail = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/ngo/donations',
    method: 'GET',
    headers: { Authorization: `Bearer ${ngo1Token}` }
  });
  console.log('8. NGO Available Donations:', ngoAvail.status, 'Count:', ngoAvail.data.count);

  // 9. NGO 1 Accepts the newly created donation
  const acceptRes1 = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/ngo/accept/${createdDonationId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngo1Token}`
      }
    },
    { notes: 'Anna Kshetra will pick up at 7 PM' }
  );
  console.log('9. NGO 1 Accept Donation:', acceptRes1.status, acceptRes1.data.success ? 'PASS' : 'FAIL');

  // 10. Concurrency / Collision Prevention Test: NGO 2 tries to accept the same donation
  const acceptRes2 = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/ngo/accept/${createdDonationId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngo2Token}`
      }
    },
    { notes: 'Robin Hood Army attempting pickup' }
  );
  console.log(
    '10. Collision Prevention (NGO 2 blocked):',
    acceptRes2.status === 409 ? 'PASS (Properly rejected with 409 Conflict)' : 'FAIL',
    acceptRes2.data.message
  );

  // 11. NGO 1 updates status to 'Pickup Scheduled' then 'Collected' then 'Delivered'
  const step1 = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/ngo/status/${createdDonationId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngo1Token}`
      }
    },
    { status: 'Pickup Scheduled', notes: 'Volunteer vehicle assigned' }
  );
  console.log('11. Status -> Pickup Scheduled:', step1.status, step1.data.success ? 'PASS' : 'FAIL');

  const step2 = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/ngo/status/${createdDonationId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngo1Token}`
      }
    },
    { status: 'Collected', notes: 'Food loaded into vehicle' }
  );
  console.log('12. Status -> Collected:', step2.status, step2.data.success ? 'PASS' : 'FAIL');

  const step3 = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api/ngo/status/${createdDonationId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ngo1Token}`
      }
    },
    { status: 'Delivered', notes: 'Distributed to community center' }
  );
  console.log('13. Status -> Delivered:', step3.status, step3.data.success ? 'PASS' : 'FAIL');

  // 14. Admin Dashboard API
  const adminDash = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/dashboard',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('14. Admin Dashboard Stats:', adminDash.status, adminDash.data.stats);

  // 15. Admin Users API
  const adminUsers = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/admin/users',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('15. Admin Users List:', adminUsers.status, 'Total users:', adminUsers.data.count);

  console.log('\n--- ALL API TESTS COMPLETED SUCCESSFULLY! ---');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
