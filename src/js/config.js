import axios from 'axios';

const BASE_URL = 'https://api.thecatapi.com/v1';
const BREEDS_ENDPOINT = '/breeds';
const IMG_ENDPOINT = '/images/search';
const API_KEY = 'live_ykKjnCMpBbXGtoPQeGu9bmvUYlhM26LNIC9ciq3EMJHikdj5cqb1Z8EYbu2f2jyE';

const axiosInstance = axios.create();
// axiosInstance.defaults.timeout = 2000;
axiosInstance.defaults.baseURL = BASE_URL;
axiosInstance.defaults.headers.common['x-api-key'] = API_KEY;
axiosInstance.defaults.headers.common['Content-Type'] = 'application / json';

export { axiosInstance, BREEDS_ENDPOINT, IMG_ENDPOINT };
