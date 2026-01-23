
import axios from 'axios';

const client = axios.create({
    baseURL: 'http://localhost:4000/game',
    headers: {
        'Content-Type': 'application/json'
    }
});

export default client;
