import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from 'dotenv';
import admin from "firebase-admin";
import cors from 'cors'
import notificationRoutes from './routes/notifications.js';
// import serviceAccount from "./firebase/serviceAccountKey.json" with { type: "json" };
import { errorHandler } from "./middleware/errorHandler.js";




const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: ['https://vermillion-gaufre-a3e944.netlify.app','http://localhost:5173'], credentials: true }));
dotenv.config();




const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

import { router as authRoutes } from './routes/auth.routes.js';


app.use(notificationRoutes);
app.use('/auth', authRoutes);





// Global error handler (keep it last)
app.use(errorHandler);

export default app;
