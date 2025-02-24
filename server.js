// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const productRoutes = require('./Routes/route');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/images', express.static('images'));





app.use('/products', productRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
