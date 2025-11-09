import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase } from './db';
import dataRoutes from './routes';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const ADDITIONAL_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
const CLIENT_ORIGINS = [
        'http://localhost:3000', // Local client
        process.env.VITE_SERVER_URL, // Allow server URL if it's used as a proxy/client origin
        ...ADDITIONAL_ORIGINS,
].filter(Boolean) as string[];

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests from React Native (no Origin) and pre-configured origins.
        const allowAll = process.env.ALLOW_ALL_CORS === 'true';
        if (allowAll || !origin || CLIENT_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));
app.use(express.json());

// Optional API Key middleware to restrict access to test devices only
const apiKey = process.env.API_KEY;
app.use((req, res, next) => {
    // Always allow health/status endpoint and preflight
    if (req.method === 'OPTIONS' || req.path === '/api/status') return next();
    if (!apiKey) return next(); // If no API_KEY is set, don't enforce

    const key = req.header('x-api-key');
    if (key && key === apiKey) return next();
    return res.status(401).json({ error: 'Unauthorized' });
});

async function run() {
    try {
        await connectToDatabase();

        // 1. Static Asset Serving (Task 11)
        // Assets will be served from /assets route
        app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
        console.log(`Serving static assets from: /assets`);

        // 2. API Routes (Task 14)
        app.use('/api', dataRoutes);

        app.get('/api/status', (req: Request, res: Response) => {
            res.status(200).send({ status: 'Server is running', db: 'Connected' });
        });

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on http://0.0.0.0:${PORT}`);
            console.log(`Server running on port ${PORT}, accessible via network IP.`);
            console.log(`Client CORS allowed from: ${CLIENT_ORIGINS.join(', ')}`);
            if (process.env.ALLOW_ALL_CORS === 'true') {
                console.log('CORS: Allowing all origins (testing).');
            }
            if (apiKey) {
                console.log('API Key auth is ENABLED. Only clients sending x-api-key can access API.');
            } else {
                console.log('API Key auth is DISABLED. All clients can access API.');
            }
        });

    } catch (err) {
        console.error("Failed to connect to MongoDB or start server:", err);
        process.exit(1);
    }
}

run().catch(console.dir);