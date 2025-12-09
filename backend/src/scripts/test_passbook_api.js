require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testPassbookApi() {
    try {
        console.log('Generating Admin Token...');
        const token = jwt.sign(
            { id: 1, username: 'admin', role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log('Token generated.');

        const customerId = 6; // Based on previous debug output (Kamlesh Yadav)
        const fromDate = '2025-11-30';
        const toDate = '2025-12-08';

        console.log(`Calling API for Customer ${customerId} (${fromDate} to ${toDate})...`);
        
        try {
            const response = await axios.get(`http://localhost:5000/api/customers/${customerId}/passbook`, {
                params: { from: fromDate, to: toDate },
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('API Response Status:', response.status);
            console.log('Summary:', response.data.summary);
            console.log('Transaction Count:', response.data.transactions.length);
            
            if (response.data.transactions.length > 0) {
                console.log('Sample Transaction:', response.data.transactions[0]);
            } else {
                console.log('WARNING: No transactions returned!');
            }

        } catch (apiError) {
            console.error('API Call Failed:', apiError.response ? apiError.response.data : apiError.message);
        }

    } catch (error) {
        console.error('Script Error:', error);
    }
}

testPassbookApi();
