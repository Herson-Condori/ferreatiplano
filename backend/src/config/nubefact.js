import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NUBEFACT_API = process.env.NUBEFACT_API_URL || 'https://api.nubefact.com/v1';
const API_TOKEN = process.env.NUBEFACT_API_TOKEN;

const nubefactClient = axios.create({
  baseURL: NUBEFACT_API,
  headers: {
    'Authorization': `Token token=${API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

export default nubefactClient;