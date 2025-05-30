// /src/controllers/authController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
const { sign, verify } = jwt;
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library'; // Import Google OAuth2 Client
import { ApiResponse } from '../middleware/ApiResponse.js'; // Assuming this is in your middleware folder
import { UserModel } from '../models/user.model.js'; // Make sure this path is correct
// import { sendNotification } from '../firebase/admin.js';

dotenv.config();

// Google OAuth client initialization
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper functions for generating JWT tokens
const generateToken = (userId: string, secret: string, expiresIn: string) => {
  const expiresInNumber = parseInt(expiresIn, 10);
  return sign({ userId }, secret, { expiresIn: expiresInNumber });
};

// Google Login
const googleLogin = async (req: Request, res: Response) => {
  const { token } = req.body;
  

  console.log('Received token:', token);
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
  try {
    // Google OAuth2 token verification logic
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // Ensure that you set the correct Google Client ID in .env
    });

    const payload = ticket.getPayload();
    if (!payload) return res.status(400).send(new ApiResponse(400, null, 'Invalid token'));

    const userId = payload.sub;
    const accessToken = generateToken(userId, process.env.JWT_SECRET!, process.env.JWT_ACCESS_EXPIRATION!);
    const refreshToken = generateToken(userId, process.env.JWT_REFRESH_SECRET!, process.env.JWT_REFRESH_EXPIRATION!);

    res.cookie(process.env.COOKIE_NAME!, refreshToken, {
      httpOnly: true,
      maxAge: Number(process.env.COOKIE_MAX_AGE),
      path: process.env.COOKIE_PATH!,
    });

    res.status(200).json(new ApiResponse(200, { accessToken, refreshToken }, 'Login successful'));

   const notificationPayload = {
  title: "Google Login",
  body: "Google login successful",
  imageUrl: "https://images.pexels.com/photos/674010/pexels-photo-674010.jpeg",
  url: "http://localhost:5173/",
};

// try {
//   const result = await sendNotification(notificationPayload);
//   console.log("Send result:", result);
// } catch (error) {
//   console.error("Error sending notification:", error);
// }



  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json(new ApiResponse(500, null, 'Google login failed'));
  }
};

// User Registration (email + password)
const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send(new ApiResponse(400, null, 'Email and password are required'));
  }

  try {
    // Ensure that you have a createUser method in the UserModel
    const user = await UserModel.createUser(email, password);
    console.log(user);
     // If `user` is an array, extract the first element
    // const newUser = user[0]; 
    res.status(201).json(new ApiResponse(201, { userId: user?._id }, 'User registered successfully'));
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json(new ApiResponse(500, null, 'Registration failed'));
  }
};

// User Login (email + password)
const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Ensure that you have a findUserByEmail method in UserModel
    const user = await UserModel.findUserByEmail(email);
    if (!user) {
      return res.status(404).send(new ApiResponse(404, null, 'User not found'));
    }

    // Ensure that you have a validatePassword method in UserModel
    const passwordIsValid = await UserModel.validatePassword(user.password, password);
    if (!passwordIsValid) {
      return res.status(401).send(new ApiResponse(401, null, 'Invalid password'));
    }

    const accessToken = generateToken(user.uid, process.env.JWT_SECRET!, process.env.JWT_ACCESS_EXPIRATION!);
    const refreshToken = generateToken(user.uid, process.env.JWT_REFRESH_SECRET!, process.env.JWT_REFRESH_EXPIRATION!);

    res.cookie(process.env.COOKIE_NAME!, refreshToken, {
      httpOnly: true,
      maxAge: Number(process.env.COOKIE_MAX_AGE),
      path: process.env.COOKIE_PATH!,
    });

    res.status(200).json(new ApiResponse(200, { accessToken, refreshToken }, 'Login successful'));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(new ApiResponse(500, null, 'Login failed'));
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies[process.env.COOKIE_NAME!];

  if (!refreshToken) {
    return res.status(401).json(new ApiResponse(401, null, 'Refresh token missing'));
  }

  try {
    // 1. Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { uid: string };

    // 2. Find user and validate token matches DB
    const user = await UserModel.findById(decoded.uid);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json(new ApiResponse(403, null, 'Invalid refresh token'));
    }

    // 3. Generate new access token
    const newAccessToken = generateToken(
      user.uid,
      process.env.JWT_SECRET!,
      process.env.JWT_ACCESS_EXPIRATION!
    );

    return res.status(200).json(
      new ApiResponse(200, { accessToken: newAccessToken }, 'Access token refreshed')
    );
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(403).json(new ApiResponse(403, null, 'Token verification failed'));
  }
};

// Logout
const logout = async (req: Request, res: Response) => {
  res.clearCookie(process.env.COOKIE_NAME!);
  res.status(200).json(new ApiResponse(200, null, 'Logout successful'));
};

export { googleLogin, register, login, logout };
