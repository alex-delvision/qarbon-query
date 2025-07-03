const express = require('express');
const app = express();

app.use(express.json());

// Mock carbon marketplace API endpoints
app.get('/', (req, res) => {
  res.send('Welcome to the mock Carbon Marketplace API!');
});

app.get('/api/v1/credits', (req, res) => {
  res.json({
    credits: [
      {
        id: '1',
        name: 'Solar Panel Offset',
        type: 'renewable_energy',
        price: 50,
      },
      {
        id: '2',
        name: 'Wind Farm Offset',
        type: 'renewable_energy',
        price: 75,
      },
      { id: '3', name: 'Reforestation Offset', type: 'forest', price: 30 },
    ],
  });
});

app.post('/api/v1/purchase', (req, res) => {
  const { creditId, quantity } = req.body;
  res.json({
    message: `Purchased ${quantity} of credit ${creditId}`,
  });
});

const PORT = 3004;
app.listen(PORT, () => {
  console.log(
    `Mock Carbon Marketplace API running on http://localhost:${PORT}`
  );
});
