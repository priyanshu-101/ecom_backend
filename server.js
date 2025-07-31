
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database');
const productsRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

connectDB();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));


app.use('/api/products', productsRoutes);
app.use('/api/auth', authRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
