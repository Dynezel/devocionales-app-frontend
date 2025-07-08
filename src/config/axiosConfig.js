import axios from 'axios';

//axios config
const instance = axios.create({
    baseURL:"https://localhost:8080", 
    withCredentials: true, //Incluir cookies en las solicitudes
})

export default instance;