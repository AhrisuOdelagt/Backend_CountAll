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
        <p>http://localhost:4444/api/usuario/confirmarUsuario/${token_usuario}</p>
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
        <p>http://localhost:4444/api/usuario/comprobarToken/${token_usuario}</p>
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
        <p>http://localhost:4444/api/equipo/aceptarInvitacion/${token_UE}</p>
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

export {
    emailRegistro,
    emailRestablecimiento,
    emailEquipos,
    emailEquipoRolModificado,
    emailEquipoMiembroEliminado,
    emailProyectoModificado,
    emailEtapaAgregada,
    emailEtapaModificada,
    emailEtapaEliminada
}
