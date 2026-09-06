import axios from 'axios';

// 1. Detectamos automáticamente si estás en tu laptop o en otro dispositivo
const currentHost = window.location.hostname;

const BASE_URL = `http://${currentHost}:8080/api/v1`; 

export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, 
    headers: {
        'Content-Type': 'application/json'
    }
});