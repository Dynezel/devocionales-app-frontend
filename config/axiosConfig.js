import axios from 'axios';

//axios config
const instance = axios.create({
    baseURL:"http://localhost:8080", 
    withCredentials: true, //Incluir cookies en las solicitudes
})

export default instance;