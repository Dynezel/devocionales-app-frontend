import axios from 'axios';

//axios config
const instance = axios.create({
    baseURL:"https://devocionales-app-backend.onrender.com", 
    withCredentials: true, //Incluir cookies en las solicitudes
})

export default instance;