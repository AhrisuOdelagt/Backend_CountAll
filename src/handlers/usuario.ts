/* Importación de módulos externos */
import { check, validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

/* Importación de módulos propios del proyecto */
import Usuario from "../models/Usuario.model"
import UsuarioRecompensa from '../models/UsuarioRecompensa.model'
import Recompensa from '../models/Recompensa.model'
import { generarTokenAleatorio } from '../helpers/functions'
import {
    emailRegistro,
    emailRestablecimiento
} from '../helpers/emails'

const registrarUsuario = async (req, res) => {
    // Validación de la integridad de los datos
    await check('name_usuario').notEmpty().withMessage('Nombre de usuario vacío').run(req)
    await check('surname_usuario').notEmpty().withMessage('Apellido de usuario vacío').run(req)
    await check('nombre_usuario').notEmpty().withMessage('Username vacío').matches(/^[a-zA-Z0-9]+$/).withMessage('El nombre de usuario solo puede contener letras y números').run(req)
    await check('email_usuario').notEmpty().withMessage('Correo electrónico vacío').isEmail().withMessage('Correo electrónico no válido').run(req)
    await check('password_usuario').notEmpty().withMessage('Contraseña vacía').run(req)

    // Manejo de errores
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // Verificar si el correo electrónico ya existe
    let existingUser = await Usuario.findOne({ where: { email_usuario: req.body.email_usuario } })
    if (existingUser) {
        return res.status(400).json({ errors: [{ msg: 'El correo electrónico ya está en uso' }] })
    }

    // Verificar si el username ya existe
    existingUser = await Usuario.findOne({ where: { nombre_usuario: req.body.nombre_usuario } })
    if (existingUser) {
        return res.status(400).json({ errors: [{ msg: 'Este username ya está en uso' }] })
    }

    try {
        // Hash de la contraseña
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(req.body.password_usuario, salt)

        // Guardar usuario en la BD
        const usuario = await Usuario.create({ ...req.body, password_usuario: hashedPassword })

        // Otorgar la recompensa por defecto
        const recompensa = await Recompensa.findOne({ where: { id_recompensa : 3 } })
        if (usuario && recompensa) {
            await UsuarioRecompensa.create({
                id_usuario_fk_UR: usuario.dataValues.id_usuario,
                id_recompensa_fk_UR: recompensa.dataValues.id_recompensa,
                fecha_obtencion: new Date()
            })
        } else {
            console.error('No se pudo crear la recompensa del usuario:', {
                usuario: usuario?.dataValues?.id_usuario,
                recompensa: recompensa?.dataValues?.id_recompensa
            })
        }

        // Enviamos el correo de confirmación
        if (usuario) {
            try {
                // Envío del correo de confirmación
                await emailRegistro({
                    email_usuario: usuario.dataValues.email_usuario,
                    nombre_usuario: usuario.dataValues.nombre_usuario,
                    token_usuario: usuario.dataValues.token_usuario
                })
            } catch (error) {
                res.status(500).json({ error: 'Hubo un error al enviar el correo de confirmación' })
            }
        }

        // Enviar respuesta exitosa
        res.json({
            msg: 'Se ha enviado un correo de confirmación'
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al crear el usuario' })
    }
}

const iniciarSesion = async (req, res) => {
    // Validación de la integridad de los datos
    await check('email_usuario').notEmpty().withMessage('Correo electrónico vacío').isEmail().withMessage('Correo electrónico no válido').run(req)
    await check('password_usuario').notEmpty().withMessage('Contraseña vacía').run(req)

    // Manejo de errores
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // Verificamos que el correo exista en la BD
    const existingUser = await Usuario.findOne({ where: { email_usuario: req.body.email_usuario } })
    if (!existingUser) {
        return res.status(400).json({ errors: [{ msg: 'El usuario no existe' }] })
    }

    // Comparar la contraseña proporcionada con la hasheada
    const validPassword = await bcrypt.compare(req.body.password_usuario, existingUser.dataValues.password_usuario)
    if (!validPassword) {
        return res.status(400).json({ errors: [{ msg: 'Contraseña incorrecta' }] })
    }

    // Verificamos que el usuario esté confirmado
    const isConfirmed = existingUser.dataValues.is_confirmed
    if (!isConfirmed) {
        return res.status(400).json({ errors: [{ msg: 'El usuario no ha sido confirmado' }] })
    }

    // Generamos el JsonWebToken del inicio de sesión
    const token = jwt.sign(
        { id: existingUser.dataValues.id, nombre_usuario: existingUser.dataValues.nombre_usuario, email_usuario: existingUser.dataValues.email_usuario },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    )

    // Enviar respuesta exitosa
    res.json({
        msg: 'Inicio de sesión exitoso',
        token
    })
}

const confirmarUsuario = async (req, res) => {
    // Recuperamos el token desde la URL
    const { token_usuario } = req.params

    // Buscamos a un usuario con el token aislado
    const existingUser = await Usuario.findOne({ where: { token_usuario: token_usuario } })
    if (!existingUser) {
        return res.status(400).json({ errors: [{ msg: 'El usuario no existe' }] })
    }

    // Confirmamos al usuario
    try {
        await Usuario.update(
            { is_confirmed: true, token_usuario: null },
            { where: { token_usuario: token_usuario } }
        )
        res.json({
            msg: 'usuario confirmado'
        })
    } catch (error) {
        res.status(500).json({
            msg: 'Error al confirmar usuario'
        })
    }
}

const olvidePassword = async (req, res) => {
    // Validación de la integridad de los datos
    await check('email_usuario').notEmpty().withMessage('Correo electrónico vacío').isEmail().withMessage('Correo electrónico no válido').run(req)
    
    // Manejo de errores
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // Verificamos que el correo exista en la BD
    const existingUser = await Usuario.findOne({ where: { email_usuario: req.body.email_usuario } })
    if (!existingUser) {
        return res.status(400).json({ errors: [{ msg: 'El usuario no existe' }] })
    }

    // Generamos un token nuevo para el usuario
    const newToken = generarTokenAleatorio()
    try {
        await Usuario.update(
            { token_usuario: newToken },
            { where: { email_usuario: req.body.email_usuario } }
        )

        // Recuperamos el usuario actualizado para obtener el nuevo token
        const updatedUser = await Usuario.findOne({ where: { email_usuario: req.body.email_usuario } })

        // Enviamos el correo de confirmación
        try {
            await emailRestablecimiento({
                email_usuario: updatedUser.dataValues.email_usuario,
                nombre_usuario: updatedUser.dataValues.nombre_usuario,
                token_usuario: updatedUser.dataValues.token_usuario
            })
        } catch (error) {
            return res.status(500).json({ error: 'Hubo un error al enviar el correo de confirmación' })
        }

        // Enviamos respuesta exitosa
        res.json({
            msg: 'Token generado y correo enviado exitosamente'
        })
    } catch (error) {
        res.status(500).json({
            msg: 'Error al generar token'
        })
    }
}


const reenviarCorreoConfirmacion = async (req, res) => {
    // Validación de la integridad de los datos
    await check('email_usuario').notEmpty().withMessage('Correo electrónico vacío').isEmail().withMessage('Correo electrónico no válido').run(req)
    
    // Manejo de errores
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    
    const { email_usuario } = req.body

    // Verificar si el correo electrónico existe
    const existingUser = await Usuario.findOne({ where: { email_usuario } })
    if (!existingUser) {
        return res.status(400).json({ errors: [{ msg: 'El usuario no existe' }] })
    }

    // Verificar si el usuario ya está confirmado
    if (existingUser.dataValues.is_confirmed) {
        return res.status(400).json({ errors: [{ msg: 'El usuario ya está confirmado' }] })
    }

    try {
        // Envío del correo de confirmación
        await emailRegistro({
            email_usuario: existingUser.dataValues.email_usuario,
            nombre_usuario: existingUser.dataValues.nombre_usuario,
            token_usuario: existingUser.dataValues.token_usuario
        })

        res.json({ msg: 'El correo de confirmación ha sido reenviado' })
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error al enviar el correo de confirmación' })
    }
}

const comprobarToken = async (req, res) => {
    // Recuperamos el token desde la URL
    const { token_usuario } = req.params

    // Buscamos a un usuario con el token aislado
    const existingUser = await Usuario.findOne({ where: { token_usuario: token_usuario } })
    if (existingUser) {
        res.json({
            msg: 'El token es válido'
        })
    }
    else {
        return res.status(400).json({ errors: [{ msg: 'El usuario no existe' }] })
    }
}

const restablecerPassword = async (req, res) => {
    // Recuperamos el token desde la URL
    const { token_usuario } = req.params

    // Validación de la integridad de los datos
    await check('nuevo_password').notEmpty().withMessage('Contraseña vacía').run(req)

    // Manejo de errores
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // Revisamos el token y actualizamos contraseña
    try {
        // Hash de la nueva contraseña
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(req.body.nuevo_password, salt)

        await Usuario.update(
            { token_usuario: null, password_usuario: hashedPassword },
            { where: { token_usuario: token_usuario } }
        )

        res.json({
            msg: 'Contraseña restablecida'
        })
    } catch (error) {
        res.status(500).json({
            msg: 'Error al restablecer contraseña'
        })
    }
}

const verPerfil = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Mostramos la información del usuario
    try {
        const info_usuario = {
            id_usuario: usuario.dataValues.id_usuario,
            name_usuario: usuario.dataValues.name_usuario,
            surname_usuario: usuario.dataValues.surname_usuario,
            username_usuario: usuario.dataValues.nombre_usuario,
            email_usuario: usuario.dataValues.email_usuario,
            numero_telefonico: usuario.dataValues.numero_telefonico,
            puntuacion_global: usuario.dataValues.puntuacion_global,
            total_tareas: usuario.dataValues.tareas_completadas_global
        }
        // Enviamos la información como respuesta
        res.json({
            info_usuario: info_usuario
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            msg: 'Error al mostrar información del usuario'
        })
    }
}

const obtenerUsuarioActual = async (req, res) => {
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    try {
        const info_usuario = {
            id_usuario: usuario.dataValues.id_usuario,
            nombre_usuario: usuario.dataValues.nombre_usuario,
            name_usuario: usuario.dataValues.name_usuario,
            surname_usuario: usuario.dataValues.surname_usuario,
            url_avatar: usuario.dataValues.url_avatar
        }
        res.json(info_usuario)
    } catch (error) {
        console.log(error)
        res.status(500).json({ msg: 'Error al obtener la información del usuario' })
    }
}

const modificarDatos = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('name_usuario').notEmpty().withMessage('Nombre de usuario vacío').run(req)
    await check('surname_usuario').notEmpty().withMessage('Apellido de usuario vacío').run(req)
    await check('nombre_usuario').notEmpty().withMessage('Username de usuario vacío').matches(/^[a-zA-Z0-9]+$/).withMessage('El nombre de usuario solo puede contener letras y números').run(req)
    await check('numero_telefonico').notEmpty().withMessage('Número telefónico vacío').run(req)

    // Manejo de errores
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // Verificamos si el username ha sido modificado
    if (req.body.nombre_usuario !== usuario.dataValues.nombre_usuario) {
        const existingUser = await Usuario.findOne({ where: { nombre_usuario: req.body.nombre_usuario } })
        if (existingUser) {
            return res.status(400).json({ errors: [{ msg: 'Este username ya se encuentra en uso' }] })
        }
    }

    // Modificamos la información del usuario
    try {
        await Usuario.update(
            {
                name_usuario: req.body.name_usuario,
                surname_usuario: req.body.surname_usuario,
                nombre_usuario: req.body.nombre_usuario,
                numero_telefonico: req.body.numero_telefonico,
            },
            { where: { id_usuario: usuario.dataValues.id_usuario } }
        )
        // Enviamos la información como respuesta
        res.json({
            msg: 'Se han modificado los datos'
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            msg: 'Error al modificar los datos del usuario'
        })
    }
}

const verPreferencias = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Regresamos las preferencias del usuario
    try {
        // Generamos el JSON de retorno
        const preferencias = {
            pref_actividades: usuario.dataValues.pref_actividades,
            pref_recordatorio: usuario.dataValues.pref_recordatorio,
            pref_puntajes: usuario.dataValues.pref_puntajes
        }

        // Enviamos la información como respuesta
        res.json({
            preferencias: preferencias
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            msg: 'Error al mostrar las preferencias del usuario'
        })
    }
}

const modificarPreferencias = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('pref_actividades').notEmpty().withMessage('Preferencias de actividades vacío').run(req)
    await check('pref_recordatorio').notEmpty().withMessage('Preferencias de recordatorios vacío').run(req)
    await check('pref_puntajes').notEmpty().withMessage('Preferencias de puntajes vacío').run(req)

    // Manejo de errores
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // Modificamos las preferencias del usuario
    try {
        // Conseguimos las preferencias
        const preferencias = {
            pref_actividades: req.body.pref_actividades,
            pref_recordatorio: req.body.pref_recordatorio,
            pref_puntajes: req.body.pref_puntajes
        }

        // Modificamos las preferencias
        await Usuario.update(
            {
                pref_actividades: preferencias.pref_actividades,
                pref_recordatorio: preferencias.pref_recordatorio,
                pref_puntajes: preferencias.pref_puntajes,
            },
            { where: { id_usuario: usuario.dataValues.id_usuario } }
        )

        // Enviamos mensaje de éxito
        res.json({
            msg: 'Se han modificado las preferencias de usuario'
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            msg: 'Error al modificar las preferencias del usuario'
        })
    }
}

export { 
    registrarUsuario,
    iniciarSesion,
    confirmarUsuario,
    olvidePassword,
    comprobarToken,
    reenviarCorreoConfirmacion,
    restablecerPassword,
    verPerfil,
    modificarDatos,
    obtenerUsuarioActual,
    verPreferencias,
    modificarPreferencias
}
