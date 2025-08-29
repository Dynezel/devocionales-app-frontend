import React from "react";
import "../css/Mensajeria.css";

const MensajeItem = React.memo(function MensajeItem({ mensaje, esActual, imagenUsuario, imagenOtro, mostrarFecha, fechaTexto, horaTexto }) {
  return (
    <div className="mensajes">
      {mostrarFecha && <div className="mensaje-fecha-separador">{fechaTexto}</div>}
      <div className={`mensaje ${esActual ? "enviado" : "recibido"}`}>
        {esActual ? (
          <div className="mensaje-contenido enviado">
            <div className="mensaje-texto">{mensaje.contenido}</div>
            <img
              src={imagenUsuario}
              alt="Tu Imagen de Perfil"
              className="profile-picture profile-picture-usuario"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="mensaje-contenido recibido">
            <img
              src={imagenOtro}
              alt="Imagen de Perfil del Otro Usuario"
              className="profile-picture profile-picture-otro"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <div className="mensaje-texto">{mensaje.contenido}</div>
          </div>
        )}
        <div className="mensaje-fecha">{horaTexto}</div>
      </div>
    </div>
  );
});
export default MensajeItem;