import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// IMPORTANT: In a real production application, these keys should be stored
// securely as an environment variables and not be hardcoded.
const firebaseConfig = {
    apiKey: "AIzaSyCsAZjQYSkd6GnRMZjlTj9gE3er0C6T7CU",
    authDomain: "redirect-2a90a.firebaseapp.com",
    projectId: "redirect-2a90a",
    storageBucket: "redirect-2a90a.firebasestorage.app",
    messagingSenderId: "339748579597",
    appId: "1:339748579597:web:8bef1a3182649cecdc6844",
    measurementId: "G-E7VW58JM16"
};


// Initialize Firebase
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();

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
    const docRef = await addDoc(collection(db, 'captures'), dataToSave);
    
    // Respond with success. sendBeacon does not process the response, but fetch does.
    return res.status(201).json({ success: true, id: docRef.id });

  } catch (error: any) {
    console.error('Error saving data to Firestore:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
