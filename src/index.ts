import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import authRoutes from './routes/auth';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

AppDataSource.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => console.log(error));
