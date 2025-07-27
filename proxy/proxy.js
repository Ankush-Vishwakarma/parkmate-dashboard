

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;

const YOUR_AUTHENTICATION_TOKEN = 'fa5ecfef7484ef366ea16071edfa8267c65b1ac5'; 

app.use(cors({
    origin: 'http://127.0.0.1:5500' 
}));

app.get('/api/activity-proxy', async (req, res) => {
    const frontendQueryParams = req.query;
    console.log('Frontend Query Params for Activity:', frontendQueryParams);

    const externalApiBaseUrl = 'https://dashboard.asaelectra.in:9000/api/v1/activity/';

    const externalApiUrl = new URL(externalApiBaseUrl);
    for (const key in frontendQueryParams) {
        externalApiUrl.searchParams.append(key, frontendQueryParams[key]);
    }
    console.log('Proxying request to external API:', externalApiUrl.toString());

    try {
        const apiResponse = await axios.get(externalApiUrl.toString(), {
            headers: {
                'Authorization': `Token ${YOUR_AUTHENTICATION_TOKEN}`
            }
        });
        res.json(apiResponse.data);
    } catch (error) {
        console.error('Error in proxying request to external API:', error.message);
        if (error.response) {
            console.error('API Error Response:', error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ message: 'Internal Server Error while proxying request.' });
        }
    }
});

app.listen(PORT, () => {
    console.log(`CORS Proxy server listening on http://localhost:${PORT}`);
    console.log(`Your frontend will call: http://localhost:${PORT}/api/activity-proxy`);
});