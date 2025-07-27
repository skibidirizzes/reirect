import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// --- Firebase Admin SDK Initialization ---
// This method is more robust for Vercel deployment by using a Base64 encoded key.
const hasEnvVars =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PRIVATE_KEY_BASE64 && // Check for the Base64 key
  process.env.FIREBASE_CLIENT_EMAIL;

if (hasEnvVars && !admin.apps.length) {
  try {
    // Decode the private key from Base64
    const privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64!, 'base64').toString('utf-8');
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        privateKey: privateKey, // Use the decoded key
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

const db = admin.apps.length ? admin.firestore() : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check if Firebase Admin SDK is initialized
  if (!db) {
    console.error('Firestore is not initialized. Check server logs and environment variables.');
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: 'The server is not configured correctly to connect to the database. Ensure FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY_BASE64, and FIREBASE_CLIENT_EMAIL environment variables are set correctly in Vercel.' 
    });
  }

  try {
    let dataToSave = req.body;
    
    // navigator.sendBeacon sends data as a string, not parsed JSON
    if (typeof req.body === 'string') {
        try {
            dataToSave = JSON.parse(req.body);
        } catch(e) {
            return res.status(400).json({ error: 'Invalid JSON format in request body' });
        }
    }

    if (!dataToSave || typeof dataToSave !== 'object') {
      return res.status(400).json({ error: 'Invalid data payload' });
    }
    
    // Ensure essential fields are present
    if (!dataToSave.redirectId || !dataToSave.timestamp) {
        return res.status(400).json({ error: 'Missing required fields: redirectId and timestamp' });
    }
    
    // Save to Firestore
    const docRef = await db.collection('captures').add(dataToSave);
    
    // Respond with success. sendBeacon does not process the response, but fetch does.
    return res.status(201).json({ success: true, id: docRef.id });

  } catch (error: any) {
    console.error('Error saving data to Firestore:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}