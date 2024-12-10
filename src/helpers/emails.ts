import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

const emailRegistro = async (datos) => {
    const {email_usuario, nombre_usuario, token_usuario} = datos;

    const transport = nodemailer.createTransport({
        host: process.env.MASTER_H,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MASTER_EM,
          pass: process.env.MASTER_P
        }
      });
    // Información del email
    const info = await transport.sendMail({
        from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
        to: email_usuario,
        subject: "CountAll — Confirme su cuenta",
        text: "Compruebe su cuenta en CountAll",
        html: `
        <p>Hola, ${nombre_usuario}, compruebe su cuenta en CountAll.</p>
        <p>Su cuenta está casi lista; sólo es necesario finalizar su proceso de confirmación.</p>
        <p>Para finalizar este proceso, ingrese en el enlace que tiene a continuación:</p>
        <p>http://localhost:5173/account-verified/${token_usuario}</p>
        <p></b>Si usted no creó esta cuenta, por favor ignore este correo electrónico.</p>
        `
    })
}

const emailRestablecimiento = async (datos) => {
    const {email_usuario, nombre_usuario, token_usuario} = datos;

    const transport = nodemailer.createTransport({
        host: process.env.MASTER_H,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MASTER_EM,
          pass: process.env.MASTER_P
        }
      });
    // Información del email
    const info = await transport.sendMail({
        from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
        to: email_usuario,
        subject: "CountAll — Restablezca su contraseña",
        text: "Restablezca su contraseña en CountAll",
        html: `
        <p>Hola, ${nombre_usuario}, restablezca su contraseña en CountAll.</p>
        <p>Para continuar con este proceso, ingrese en el enlace que tiene a continuación:</p>
        <p>http://localhost:5173/new-password/${token_usuario}</p>
        <p></b>Si usted no creó esta cuenta o está vinculado con CountAll, por favor ignore este correo electrónico.</p>
        `
    })
}

const emailEquipos = async (datos) => {
  const {email_usuario, nombre_integrante, nombre_lider, email_lider, nombre_equipo, nombre_proyecto, token_UE} = datos;

    const transport = nodemailer.createTransport({
        host: process.env.MASTER_H,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MASTER_EM,
          pass: process.env.MASTER_P
        }
      });
    // Información del email
    const info = await transport.sendMail({
        from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
        to: email_usuario,
        subject: "CountAll — Ha sido invitado a un equipo",
        text: "Usted ha sido invitado a un equipo en CountAll",
        html: `
        <p>Hola, ${nombre_integrante}, usted ha sido invitado a un equipo de trabajo en CountAll por ${nombre_lider}.</p>
        <p>Pertenece al equipo «${nombre_equipo}» vinculado al proyecto «${nombre_proyecto}».</p>
        <p>Para confirmar la invitación, haga clic en el siguiente enlace:</p>
        <p>http://localhost:5173/invitation-accepted/${token_UE}</p>
        <p></b>Asimismo, recomendamos contactar con el líder de su equipo para solicitar más información a través de su correo electrónico: ${email_lider}.</p>
        <p>Si usted no creó esta cuenta o está vinculado con CountAll, por favor ignore este correo electrónico.</p>
        `
    })
}

const emailEquipoRolModificado = async (datos) => {
  const {email_usuario, nombre_integrante, email_lider, nombre_equipo, rol} = datos;

    const transport = nodemailer.createTransport({
        host: process.env.MASTER_H,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MASTER_EM,
          pass: process.env.MASTER_P
        }
      });
    // Información del email
    const info = await transport.sendMail({
        from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
        to: email_usuario,
        subject: "CountAll — Se ha modificado su rol",
        text: "Se ha modificado su rol en un equipo de CountAll",
        html: `
        <p>Hola, ${nombre_integrante}, el líder del equipo «${nombre_equipo}» ha actualizado su rol.</p>
        <p>El rol que le corresponde ahora es: ${rol}.</p>
        <p></b>Si considera que esto es un error, contacte al líder del equipo a través de su correo electrónico: ${email_lider}.</p>
        <p>Si usted no creó esta cuenta o está vinculado con CountAll, por favor ignore este correo electrónico.</p>
        `
    })
}

const emailEquipoMiembroEliminado = async (datos) => {
  const {email_usuario, nombre_integrante, email_lider, nombre_equipo} = datos;

    const transport = nodemailer.createTransport({
        host: process.env.MASTER_H,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MASTER_EM,
          pass: process.env.MASTER_P
        }
      });
    // Información del email
    const info = await transport.sendMail({
        from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
        to: email_usuario,
        subject: "CountAll — Ha sido eliminado un equipo",
        text: "Usted ha sido eliminado de un equipo de CountAll",
        html: `
        <p>Hola, ${nombre_integrante}, el líder del equipo «${nombre_equipo}» lo ha eliminado y ya no está asociado con el equipo.</p>
        <p></b>Si considera que esto es un error, contacte al líder del equipo a través de su correo electrónico: ${email_lider}.</p>
        <p>Si usted no creó esta cuenta o está vinculado con CountAll, por favor ignore este correo electrónico.</p>
        `
    })
}

const emailProyectoModificado = async (datos) => {
  const {email_usuario, nombre_integrante, email_creador, nombre_proyecto} = datos;

    const transport = nodemailer.createTransport({
        host: process.env.MASTER_H,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MASTER_EM,
          pass: process.env.MASTER_P
        }
      });
    // Información del email
    const info = await transport.sendMail({
        from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
        to: email_usuario,
        subject: "CountAll — Un proyecto donde que trabaja ha cambiado",
        text: "Se ha modificado la información de un proyecto",
        html: `
        <p>Hola, ${nombre_integrante}, la información del proyecto ${nombre_proyecto} que desarrolla fue modificada por su creador.</p>
        <p>Sugerimos que consulte los cambios realizados para evitar confusiones.</p>
        <p></b>Si considera que esto es un error, contacte al creador del proyecto a través de su correo electrónico: ${email_creador}.</p>
        <p>Si usted no creó esta cuenta o está vinculado con CountAll, por favor ignore este correo electrónico.</p>
        `
    })
}

const emailEtapaAgregada = async (datos) => {
  const {email_usuario, nombre_integrante, email_lider, nombre_proyecto} = datos;

    const transport = nodemailer.createTransport({
        host: process.env.MASTER_H,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MASTER_EM,
          pass: process.env.MASTER_P
        }
      });
    // Información del email
    const info = await transport.sendMail({
        from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
        to: email_usuario,
        subject: "CountAll — Un proyecto donde trabaja adquirió una nueva etapa",
        text: "Se ha agregado una nueva etapa al proyecto",
        html: `
        <p>Hola, ${nombre_integrante}, el creador del proyecto «${nombre_proyecto}» ha agregado una etapa nueva al proyecto.</p>
        <p>Sugerimos que consulte los cambios realizados para evitar confusiones.</p>
        <p></b>Si considera que esto es un error, contacte al líder del equipo a través de su correo electrónico: ${email_lider}.</p>
        <p>Si usted no creó esta cuenta o está vinculado con CountAll, por favor ignore este correo electrónico.</p>
        `
    })
}

const emailEtapaModificada = async (datos) => {
  const {email_usuario, nombre_integrante, email_lider, nombre_proyecto} = datos;

    const transport = nodemailer.createTransport({
        host: process.env.MASTER_H,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MASTER_EM,
          pass: process.env.MASTER_P
        }
      });
    // Información del email
    const info = await transport.sendMail({
        from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
        to: email_usuario,
        subject: "CountAll — Un proyecto donde trabaja tiene una etapa modificada",
        text: "Se ha modificado una etapa en el proyecto",
        html: `
        <p>Hola, ${nombre_integrante}, el creador del proyecto «${nombre_proyecto}» ha modificado una de las etapas del proyecto.</p>
        <p>Sugerimos que consulte los cambios realizados para evitar confusiones.</p>
        <p></b>Si considera que esto es un error, contacte al líder del equipo a través de su correo electrónico: ${email_lider}.</p>
        <p>Si usted no creó esta cuenta o está vinculado con CountAll, por favor ignore este correo electrónico.</p>
        `
    })
}

const emailEtapaEliminada = async (datos) => {
  const {email_usuario, nombre_integrante, email_lider, nombre_proyecto} = datos;

    const transport = nodemailer.createTransport({
        host: process.env.MASTER_H,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MASTER_EM,
          pass: process.env.MASTER_P
        }
      });
    // Información del email
    const info = await transport.sendMail({
        from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
        to: email_usuario,
        subject: "CountAll — Un proyecto donde trabaja tiene una etapa menos",
        text: "Se ha eliminado una etapa en el proyecto",
        html: `
        <p>Hola, ${nombre_integrante}, el creador del proyecto «${nombre_proyecto}» ha eliminado una de las etapas del proyecto.</p>
        <p>Sugerimos que consulte los cambios realizados para evitar confusiones.</p>
        <p></b>Si considera que esto es un error, contacte al líder del equipo a través de su correo electrónico: ${email_lider}.</p>
        <p>Si usted no creó esta cuenta o está vinculado con CountAll, por favor ignore este correo electrónico.</p>
        `
    })
}

const emailTareaAsignada = async (datos) => {
  const {email_asignado, nombre_asignado, email_lider, nombre_tarea, descr_tarea, fecha_fin_tarea, nombre_equipo} = datos;

    const transport = nodemailer.createTransport({
        host: process.env.MASTER_H,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MASTER_EM,
          pass: process.env.MASTER_P
        }
      });
    // Información del email
    const info = await transport.sendMail({
        from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
        to: email_asignado,
        subject: "CountAll — Tiene una tarea nueva",
        text: "Se le ha asignado una tarea nueva en CountAll",
        html: `
        <p>Hola, ${nombre_asignado}, el líder del equipo «${nombre_equipo}» le ha asignado una tarea nueva.</p>
        <p>Se le notifican datos de relevancia acerca de la tarea:</p>
        <p>Nombre de la tarea: «${nombre_tarea}»</p>
        <p>Descripción de la tarea: «${descr_tarea}»</p>
        <p>Fecha de entrega: «${fecha_fin_tarea}»</p>
        <p></b>Si considera que esto es un error, contacte al líder del equipo a través de su correo electrónico: ${email_lider}.</p>
        <p>Si usted no creó esta cuenta o está vinculado con CountAll, por favor ignore este correo electrónico.</p>
        `
    })
}

const emailTareaEditada = async (datos) => {
  const {email_asignado, nombre_asignado, email_lider, nombre_tarea, descr_tarea, fecha_fin_tarea, nombre_equipo} = datos;

    const transport = nodemailer.createTransport({
        host: process.env.MASTER_H,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MASTER_EM,
          pass: process.env.MASTER_P
        }
      });
    // Información del email
    const info = await transport.sendMail({
        from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
        to: email_asignado,
        subject: "CountAll — Una tarea se ha modificado",
        text: "Una tarea asignada en CountAll acaba de ser modificada",
        html: `
        <p>Hola, ${nombre_asignado}, el líder del equipo «${nombre_equipo}» ha modificado una tarea que tenía asignada.</p>
        <p>Estos son los nuevos datos de la tarea:</p>
        <p>Nombre de la tarea: «${nombre_tarea}»</p>
        <p>Descripción de la tarea: «${descr_tarea}»</p>
        <p>Fecha de entrega: «${fecha_fin_tarea}»</p>
        <p></b>Si considera que esto es un error, contacte al líder del equipo a través de su correo electrónico: ${email_lider}.</p>
        <p>Si usted no creó esta cuenta o está vinculado con CountAll, por favor ignore este correo electrónico.</p>
        `
    })
}

const emailCambiarEstadoFT = async (datos) => {
  const {email_asignado, nombre_asignado, nombre_tarea, recompensa_obtenida} = datos;

    const transport = nodemailer.createTransport({
        host: process.env.MASTER_H,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MASTER_EM,
          pass: process.env.MASTER_P
        }
      });
    // Información del email
    const info = await transport.sendMail({
        from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
        to: email_asignado,
        subject: "CountAll — ¡Ha completado una tarea!",
        text: "Ha marcado una tarea como completada y recibido una recompensa",
        html: `
        <p>Hola, ${nombre_asignado}, ha recibido una recompensa por haber marcado la tarea «${nombre_tarea}».</p>
        <p>Esta es la recompensa que obtuvo al completar la tarea:</p>
        <p>¡Ha obtenido: ${recompensa_obtenida}!</p>
        <p></b>Si usted no creó esta cuenta o está vinculado con CountAll, por favor ignore este correo electrónico.</p>
        `
    })
}

const emailCambiarEstadoLider = async (datos) => {
  const {email_lider, nombre_lider, nombre_tarea, nombre_equipo} = datos;

    const transport = nodemailer.createTransport({
        host: process.env.MASTER_H,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MASTER_EM,
          pass: process.env.MASTER_P
        }
      });
    // Información del email
    const info = await transport.sendMail({
        from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
        to: email_lider,
        subject: "CountAll — Tiene una tarea pendiente por revisar",
        text: `Un usuario del equipo «${nombre_equipo}» ha completado una tarea y espera revisión`,
        html: `
        <p>Hola, ${nombre_lider}, un usuario ha completado la tarea «${nombre_tarea}» y está lista para su revisión.</p>
        <p></b>Si usted no creó esta cuenta o está vinculado con CountAll, por favor ignore este correo electrónico.</p>
        `
    })
}

const emailTareaRevisada = async (datos) => {
  const {email_asignado, nombre_asignado, nombre_tarea, nombre_equipo, puntaje_obtenido} = datos;

  const transport = nodemailer.createTransport({
      host: process.env.MASTER_H,
      port: 465,
      secure: true,
      auth: {
        user: process.env.MASTER_EM,
        pass: process.env.MASTER_P
      }
    });
  // Información del email
  const info = await transport.sendMail({
      from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
      to: email_asignado,
      subject: "CountAll — ¡Su tarea ha sido aprobada!",
      text: `Un líder del equipo «${nombre_equipo}» ha aprobado una tarea`,
      html: `
      <p>Hola, ${nombre_asignado} ¡Un líder ha devuelto la tarea «${nombre_tarea}» y ha aumentado su clasificación!.</p>
      <p>Su puntaje actual dentro de la clasificación del equipo «${nombre_equipo}» es: ${puntaje_obtenido}.</p>
      <p></b>Si usted no creó esta cuenta o está vinculado con CountAll, por favor ignore este correo electrónico.</p>
      `
  })
}

const emailTareaDesbloqueada = async (datos) => {
  const {email_asignado, nombre_asignado, nombre_tarea, nombre_equipo} = datos;

    const transport = nodemailer.createTransport({
        host: process.env.MASTER_H,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MASTER_EM,
          pass: process.env.MASTER_P
        }
      });
    // Información del email
    const info = await transport.sendMail({
        from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
        to: email_asignado,
        subject: "CountAll — Una tarea ha sido devuelta",
        text: `Un líder del equipo «${nombre_equipo}» ha devuelto una tarea`,
        html: `
        <p>Hola, ${nombre_asignado}, un líder ha devuelto la tarea «${nombre_tarea}» para aplicar prontas correcciones.</p>
        <p></b>Si usted no creó esta cuenta o está vinculado con CountAll, por favor ignore este correo electrónico.</p>
        `
    })
}

const emailTareaEliminada = async (datos) => {
  const {email_asignado, nombre_asignado, email_lider, nombre_tarea, nombre_equipo} = datos;

    const transport = nodemailer.createTransport({
        host: process.env.MASTER_H,
        port: 465,
        secure: true,
        auth: {
          user: process.env.MASTER_EM,
          pass: process.env.MASTER_P
        }
      });
    // Información del email
    const info = await transport.sendMail({
        from: '"CountAll — Administrador de la Base de Datos" «countall2024b021@gmail.com»',
        to: email_asignado,
        subject: "CountAll — Una tarea se ha eliminado",
        text: "Una tarea asignada en CountAll acaba de ser eliminada del sistema",
        html: `
        <p>Hola, ${nombre_asignado}, el líder del equipo «${nombre_equipo}» ha eliminado una tarea que tenía asignada.</p>
        <p>La tarea «${nombre_tarea}» ha sido eliminada del sistema, por lo que ya no la tendrá asignada y cualquier puntaje que se podría haber obtenido se ha perdido.</p>
        <p></b>Si considera que esto es un error, contacte al líder del equipo a través de su correo electrónico: ${email_lider}.</p>
        <p>Si usted no creó esta cuenta o está vinculado con CountAll, por favor ignore este correo electrónico.</p>
        `
    })
}

export {
    emailRegistro,
    emailRestablecimiento,
    emailEquipos,
    emailEquipoRolModificado,
    emailEquipoMiembroEliminado,
    emailProyectoModificado,
    emailEtapaAgregada,
    emailEtapaModificada,
    emailEtapaEliminada,
    emailTareaAsignada,
    emailTareaEditada,
    emailCambiarEstadoFT,
    emailCambiarEstadoLider,
    emailTareaRevisada,
    emailTareaDesbloqueada,
    emailTareaEliminada
}
