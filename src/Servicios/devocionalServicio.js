import axios from 'axios';

const URL1 = "https://devocionales-app-backend.onrender.com/devocionales"
const URL2 = "https://devocionales-app-backend.onrender.com/devocionalesPorUsuario"
const URL3 = "https://devocionales-app-backend.onrender.com/usuario"

export const conseguirDatos = async () => {
    //Respuesta de los datos de la url
    const response = await axios.get(URL1)
    //Trae los datos de la respuesta
    const data = response.data

    return data;
}

export const publicarDatos = async () => {
    try {
        const response = await axios.post(URL1)
        return response.data
    }
    catch(error) {
        console.error("Hubo un error al publicar la tarea: ", error)
        throw error
    }
}

export const conseguirDevocionalesPorUsuario = async (usuarioId) => {
    try {
      const response = await axios.get(`${URL3}/${usuarioId}/devocionales`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error("Error al obtener devocionales por usuario:", error);
      throw error;
    }
  };