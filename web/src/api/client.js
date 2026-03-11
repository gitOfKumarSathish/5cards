
import axios from 'axios';

const baseURL = import.meta.env.PROD 
    ? 'https://5cards-api.vercel.app/game'
    : 'http://localhost:4000/game';

const client = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default client;
