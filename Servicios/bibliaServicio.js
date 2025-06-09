import axios from "axios";

const URL = "https://bible-api.deno.dev/api/";

export const conseguirDatosBiblia = async () => {
    try {
        const response = await axios.get(`${URL}books`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener los datos de la Biblia:", error);
        throw error; // Propaga el error para que sea manejado por el código que llama a esta función
    }
};