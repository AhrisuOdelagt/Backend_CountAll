import { check, validationResult } from 'express-validator'
import {
    emailEquipos,
    emailEquipoRolModificado,
    emailEquipoMiembroEliminado
} from '../helpers/emails'
import Equipo from '../models/Equipo.model'
import Proyecto from '../models/Proyecto.model'
import Usuario from '../models/Usuario.model'
import EquipoProyecto from '../models/EquipoProyecto.model'
import UsuarioEquipo from '../models/UsuarioEquipo.model'
import PaginaBloqueada from '../models/PaginaBloqueada.model'
import PaginaWeb from '../models/PaginaWeb.model'

const verEquipos = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Retornamos equipos del usuario UsuarioEquipo
    try {
        // Buscamos los equipos en la tabla 
        const equipos_usuario_keys = await UsuarioEquipo.findAll({
            where: { id_usuario_fk_UE: usuario.dataValues.id_usuario },
            attributes: ['id_equipo_fk_UE']
        })

        // Verificamos que sí haya equipos
        if (equipos_usuario_keys.length === 0) {
            return res.status(404).json({ message: 'No se encontraron equipos para este usuario' })
        }

        // Recuperamos la información de los equipos
        let equipos_usuario = []
        try {
            for (const equipo of equipos_usuario_keys) {
                const equipoEncontrado = await Equipo.findOne({
                    where: { id_equipo: equipo.dataValues.id_equipo_fk_UE },
                    attributes: ['id_equipo', 'nombre_equipo', 'descr_equipo']
                })
                equipos_usuario.push(equipoEncontrado)
            }

            // Enviamos la lista de proyectos en la respuesta
            res.json({
                equipos_usuario: equipos_usuario
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Hubo un problema al recuperar información de los equipos' })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al mostrar los equipos' })
    }
}

const verEquiposProyecto = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Retornamos equipos del usuario EquipoProyecto
    const { nombre_proyecto } = req.params
    try {
        // Buscamos al proyecto
        const proyectoEncontrado = await Proyecto.findOne({
            where: { nombre_proyecto: nombre_proyecto },
        })

        // Buscamos los equipos en la tabla 
        const equipos_usuario_keys = await EquipoProyecto.findAll({
            where: { id_proyecto_fk_clas: proyectoEncontrado.dataValues.id_proyecto },
            attributes: ['id_equipo_fk_clas']
        })

        // Verificamos que sí haya equipos
        if (equipos_usuario_keys.length === 0) {
            return res.status(404).json({ message: 'No se encontraron equipos para este usuario' })
        }

        // Recuperamos la información de los equipos
        let equipos_usuario = []
        try {
            for (const equipo of equipos_usuario_keys) {
                const equipoEncontrado = await Equipo.findOne({
                    where: { id_equipo: equipo.dataValues.id_equipo_fk_clas },
                    attributes: ['id_equipo', 'nombre_equipo', 'descr_equipo']
                })
                equipos_usuario.push(equipoEncontrado)
            }

            // Enviamos la lista de proyectos en la respuesta
            res.json({
                equipos_usuario: equipos_usuario
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Hubo un problema al recuperar información de los equipos' })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al mostrar los equipos' })
    }
}

const verEquipo = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Retornamos información de un equipo
    const { id_equipo } = req.params
    try {
        // Encontramos al equipo
        const equipoEncontrado = await Equipo.findOne({
            where: { id_equipo: id_equipo }
        })

        // Encontramos usuarios y roles relacionados con el equipo
        let usuariosRoles = await UsuarioEquipo.findAll({
            where: { id_equipo_fk_UE: equipoEncontrado.dataValues.id_equipo, is_confirmed_UE: true },
            attributes: ['id_usuario_fk_UE', 'rol', 'tareas_asignadas', 'tareas_completadas']
        })
        // Encontramos los nombres de los usuarios
        let usuarios = []
        for (const usuario of usuariosRoles) {
            const usuarioEncontrado = await Usuario.findOne({
                where: { id_usuario: usuario.dataValues.id_usuario_fk_UE },
                attributes: ['nombre_usuario', 'email_usuario']
            })
            usuarios.push(usuarioEncontrado)
        }

        // Conjuntamos la información de los usuarios
        // Encontramos el rol del usuario (para ver qué información se muestra en el Front)
        const sesionUsuario = await UsuarioEquipo.findOne({
            where: { id_usuario_fk_UE: usuario.dataValues.id_usuario, id_equipo_fk_UE: equipoEncontrado.dataValues.id_equipo, is_confirmed_UE: true },
            attributes: ['id_usuario_fk_UE', 'rol']
        })
        let infoEquipo = {
            id_equipo: equipoEncontrado.dataValues.id_equipo,
            nombre_equipo: equipoEncontrado.dataValues.nombre_equipo,
            descr_equipo: equipoEncontrado.dataValues.descr_equipo,
            integrantes_equipo: []
        }
        for (let index = 0; index < usuarios.length; index++) {
            const integrante = {
                nombre_usuario: usuarios[index].dataValues.nombre_usuario,
                id_usuario: usuariosRoles[index].dataValues.id_usuario_fk_UE,
                email_usuario: usuarios[index].dataValues.email_usuario,
                rol: usuariosRoles[index].dataValues.rol,
                tareas_asignadas: usuariosRoles[index].dataValues.tareas_asignadas,
                tareas_completadas: usuariosRoles[index].dataValues.tareas_completadas
            }
            infoEquipo.integrantes_equipo.push(integrante)
        }

        // Buscamos las páginas bloqueadas
        const paginasBloqueadasEquipo = await PaginaBloqueada.findAll({
            where: { id_usuario_fk_bloqueo: usuario.dataValues.id_usuario, nivel_bloqueo: 1 }
        })
        const datosPaginas = []
        if (paginasBloqueadasEquipo) {
            for (const pagina of paginasBloqueadasEquipo) {
                const datoPagina = await PaginaWeb.findOne({
                    where: { id_pagina: pagina.dataValues.id_pagina_fk_bloqueo }
                })
                const datosPagina = {
                    id_pagina: datoPagina.dataValues.id_pagina,
                    nombre_pagina: datoPagina.dataValues.nombre_pagina,
                    descr_pagina: datoPagina.dataValues.descr_pagina,
                    url_pagina: datoPagina.dataValues.url_pagina
                }
                datosPaginas.push(datosPagina)
            }
        }

        // Enviamos la información del equipo como respuesta
        res.json({
            rol_sesion: sesionUsuario.dataValues.rol,
            equipo: infoEquipo,
            paginas_bloqueadas: datosPaginas
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Hubo un problema al recuperar información de este equipo' })
    }
}

const crearEquipo = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('nombre_equipo').notEmpty().withMessage('Nombre de equipo vacío').run(req)
    await check('descr_equipo').notEmpty().withMessage('Descripción de equipo vacía').run(req)
    await check('usuarios').notEmpty().withMessage('Lista de usuarios vacía').run(req)
    await check('proyecto').notEmpty().withMessage('Nombre de proyecto vacío').run(req)

    // Manejo de errores
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        // Obtenemos el Id del proyecto
        const proyectoEncontrado = await Proyecto.findOne({
            where: { nombre_proyecto: req.body.proyecto },
            attributes: ['id_proyecto', 'nombre_proyecto']
        })
        
        if (!proyectoEncontrado) {
            return res.status(404).json({ error: 'Proyecto no encontrado' })
        }

        // Obtenemos Id's & emails de todos los usuarios
        let usuarios = []
        const nombre = usuario.dataValues.nombre_usuario
        const usuarioEncontrado = await Usuario.findOne({
            where: { nombre_usuario: nombre },
            attributes: ['id_usuario', 'nombre_usuario', 'email_usuario']
        })
        usuarios.push(usuarioEncontrado)

        for (const nombre_usuario of req.body.usuarios) {
            const usuarioEncontrado = await Usuario.findOne({
                where: { nombre_usuario },
                attributes: ['id_usuario', 'nombre_usuario', 'email_usuario']
            })
            
            if (!usuarioEncontrado) {
                return res.status(404).json({ error: `Este usuario no existe: ${nombre_usuario}` })
            }
            usuarios.push(usuarioEncontrado)
        }

        // Estructura y creación del equipo
        const equipoData = {
            nombre_equipo: req.body.nombre_equipo,
            descr_equipo: req.body.descr_equipo,
        }
        const equipoCreado = await Equipo.create(equipoData)

        // Estructura y creación de los campos en la tabla EquipoProyecto
        const equipoProyectoData = {
            id_equipo_fk_clas: equipoCreado.dataValues.id_equipo,
            id_proyecto_fk_clas: proyectoEncontrado.dataValues.id_proyecto
        }
        await EquipoProyecto.create(equipoProyectoData)

        // Definimos el rol de los usuarios en el equipo
        const nombre_lider = usuario.dataValues.nombre_usuario
        const email_lider = usuario.dataValues.email_usuario

        for (const [index, usuario] of usuarios.entries()) {
            const usuarioEquipoData = {
                rol: index === 0 ? 'Líder' : 'Miembro',  // Solo el primer usuario en la lista es el líder
                id_usuario_fk_UE: usuario.dataValues.id_usuario,
                id_equipo_fk_UE: equipoCreado.dataValues.id_equipo,
                is_confirmed_UE: index === 0 ? true : false  // Confirma automáticamente al creador del equipo
            }
            const usuarioEquipo = await UsuarioEquipo.create(usuarioEquipoData)

            // Envío del correo de confirmación solo a los miembros
            if (usuarioEquipoData.rol === 'Miembro') {
                try {
                    await emailEquipos({
                        email_usuario: usuario.dataValues.email_usuario,
                        nombre_integrante: usuario.dataValues.nombre_usuario,
                        nombre_lider: nombre_lider,
                        email_lider: email_lider,
                        nombre_equipo: equipoCreado.dataValues.nombre_equipo, 
                        nombre_proyecto: proyectoEncontrado.dataValues.nombre_proyecto,
                        token_UE: usuarioEquipo.dataValues.token_UE
                    })
                } catch (error) {
                    return res.status(500).json({ error: 'Hubo un error al enviar el correo de integración de los equipos' })
                }
            }
        }

        // Enviamos respuesta exitosa
        res.json({
            msg: 'Se ha creado el equipo y notificado a los miembros'
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al crear equipo' })
    }
}

const aceptarInvitacion = async (req, res) => {
    // Recuperamos el token desde la URL
    const { token_UE } = req.params

    // Buscamos al usuario con el token para aceptarlo en el equipo
    try {
        await UsuarioEquipo.update(
                { is_confirmed_UE: true, token_UE: null },
            { where: { token_UE: token_UE } }
        )
        // Enviamos respuesta exitosa
        res.json({
            msg: 'Ha confirmado la invitación al equipo'
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al crear equipo' })
    }
}

const asignarRoles = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('nombre_usuario').notEmpty().withMessage('Nombre de usuario vacío').run(req)
    await check('rol').notEmpty().withMessage('Campo de rol vacío').run(req)

    // Retornamos información de un equipo
    const { id_equipo } = req.params
    try {
        // Encontramos al equipo
        const equipoEncontrado = await Equipo.findOne({
            where: { id_equipo: id_equipo },
            attributes: ['id_equipo', 'nombre_equipo', 'descr_equipo']
        })
        if (!equipoEncontrado) {
            return res.status(500).json({ error: 'Este equipo no existe' })
        }

        // Verificamos que el usuario se encuentre en el equipo
        const usuarioEncontrado = await Usuario.findOne({
            where: { nombre_usuario: req.body.nombre_usuario },
            attributes: ['id_usuario', 'nombre_usuario', 'email_usuario']
        })
        if (!usuarioEncontrado) {
            return res.status(500).json({ error: 'Este usuario no existe' })
        }
        const existeEnEquipo = await UsuarioEquipo.findOne({
            where: { id_usuario_fk_UE: usuarioEncontrado.dataValues.id_usuario },
            attributes: ['id_usuario_fk_UE', 'rol', 'is_confirmed_UE']
        })
        console.log(existeEnEquipo)
        if (!existeEnEquipo) {
            return res.status(500).json({ error: 'Este usuario no está en el equipo' })
        }
        if (!existeEnEquipo.dataValues.is_confirmed_UE) {
            return res.status(500).json({ error: 'Este usuario aún no acepta la invitación al equipo' })
        }

        // Modificamos el rol del integrante
        await UsuarioEquipo.update(
            { rol: req.body.rol },
            { where: { id_usuario_fk_UE: existeEnEquipo.dataValues.id_usuario_fk_UE, id_equipo_fk_UE: equipoEncontrado.dataValues.id_equipo } }
        )

        // Se notifica al usuario
        const email_lider = req.usuario.dataValues.email_usuario
        try {
            // Envío del correo de confirmación
            await emailEquipoRolModificado({
                email_usuario: usuarioEncontrado.dataValues.email_usuario,
                nombre_integrante: usuarioEncontrado.dataValues.nombre_usuario,
                email_lider: email_lider,
                nombre_equipo: equipoEncontrado.dataValues.nombre_equipo,
                rol: req.body.rol
            })
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error al enviar el correo de notificación de cambio de rol' })
        }

        // Enviamos respuesta exitosa
        res.json({
            msg: 'Se ha actualizado el rol del integrante'
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al modificar el rol' })
    }
}

const agregarMiembro = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('email_usuario').notEmpty().withMessage('Correo electrónico de usuario vacío').run(req)

    // Manejo de errores
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        // Encontramos el equipo
        const equipoEncontrado = await Equipo.findOne({
            where: { id_equipo: req.params.id_equipo },
            attributes: ['id_equipo', 'nombre_equipo']
        })
        if (!equipoEncontrado) {
            return res.status(404).json({ error: 'Equipo no encontrado' })
        }

        // Verificamos la existencia del usuario
        const usuarioEncontrado = await Usuario.findOne({
            where: { email_usuario: req.body.email_usuario },
            attributes: ['id_usuario', 'nombre_usuario', 'email_usuario']
        })
        if (!usuarioEncontrado) {
            return res.status(404).json({ error: 'Usuario no encontrado' })
        }

        // Verificamos si el usuario ya está en el equipo
        const miembroExistente = await UsuarioEquipo.findOne({
            where: {
                id_usuario_fk_UE: usuarioEncontrado.dataValues.id_usuario,
                id_equipo_fk_UE: equipoEncontrado.dataValues.id_equipo
            }
        })
        if (miembroExistente) {
            return res.status(400).json({ error: 'El usuario ya es miembro del equipo' })
        }

        // Añadimos el usuario al equipo
        const UE = await UsuarioEquipo.create({
            id_usuario_fk_UE: usuarioEncontrado.dataValues.id_usuario,
            id_equipo_fk_UE: equipoEncontrado.dataValues.id_equipo
        })

        // Notificamos al usuario
        const nombre_lider = req.usuario.dataValues.nombre_usuario
        const email_lider = req.usuario.dataValues.email_usuario
        const EP = await EquipoProyecto.findOne({
            where: { id_equipo_fk_clas: equipoEncontrado.dataValues.id_equipo },
            attributes: ['id_proyecto_fk_clas']
        })
        const proyectoEncontrado = await Proyecto.findOne({
            where: { id_proyecto: EP.dataValues.id_proyecto_fk_clas },
            attributes: ['id_proyecto', 'nombre_proyecto']
        })
        if (!proyectoEncontrado) {
            return res.status(404).json({ error: 'Proyecto no encontrado' })
        }
        try {
            // Envío del correo de confirmación
            await emailEquipos({
                email_usuario: usuarioEncontrado.dataValues.email_usuario,
                nombre_integrante: usuarioEncontrado.dataValues.nombre_usuario,
                nombre_lider: nombre_lider,
                email_lider: email_lider,
                nombre_equipo: equipoEncontrado.dataValues.nombre_equipo, 
                nombre_proyecto: proyectoEncontrado.dataValues.nombre_proyecto,
                token_UE: UE.dataValues.token_UE
            })
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error al enviar el correo de integración de los equipos' })
        }

        res.json({ msg: 'El miembro ha sido agregado al equipo' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al agregar el miembro al equipo' })
    }
}

const eliminarMiembro = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('nombre_usuario').notEmpty().withMessage('Nombre de usuario vacío').run(req)

    // Manejo de errores
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        // Encontramos el equipo
        const equipoEncontrado = await Equipo.findOne({
            where: { id_equipo: req.params.id_equipo },
            attributes: ['id_equipo', 'nombre_equipo']
        })
        if (!equipoEncontrado) {
            return res.status(404).json({ error: 'Equipo no encontrado' })
        }

        // Encontramos al usuario
        const usuarioEncontrado = await Usuario.findOne({
            where: { nombre_usuario: req.body.nombre_usuario },
            attributes: ['id_usuario', 'nombre_usuario', 'email_usuario']
        })
        if (!usuarioEncontrado) {
            return res.status(404).json({ error: 'Usuario no encontrado' })
        }

        // Verificamos si el usuario es el mismo que maneja la función
        const id_encontrado = usuarioEncontrado.dataValues.id_usuario
        const id_sesion = usuario.dataValues.id_sesion
        if (id_encontrado === id_sesion) {
            return res.status(404).json({ error: 'Este usuario no puede eliminarse' })
        }

        // Verificamos si el usuario pertenece al equipo
        const miembroExistente = await UsuarioEquipo.findOne({
            where: {
                id_usuario_fk_UE: usuarioEncontrado.dataValues.id_usuario,
                id_equipo_fk_UE: equipoEncontrado.dataValues.id_equipo
            }
        })
        if (!miembroExistente) {
            return res.status(400).json({ error: 'El usuario no es miembro del equipo' })
        }

        // Eliminamos al usuario del equipo
        await UsuarioEquipo.destroy({
            where: {
                id_usuario_fk_UE: usuarioEncontrado.dataValues.id_usuario,
                id_equipo_fk_UE: equipoEncontrado.dataValues.id_equipo
            }
        })

        // Se notifica al usuario
        const email_lider = req.usuario.dataValues.email_usuario
        console.log(usuarioEncontrado.dataValues.nombre_usuario)
        console.log(usuarioEncontrado.dataValues.email_usuario)
        try {
            // Envío del correo de confirmación
            await emailEquipoMiembroEliminado({
                email_usuario: usuarioEncontrado.dataValues.email_usuario,
                nombre_integrante: usuarioEncontrado.dataValues.nombre_usuario,
                email_lider: email_lider,
                nombre_equipo: equipoEncontrado.dataValues.nombre_equipo,
            })
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error al enviar el correo de notificación de eliminación' })
        }

        res.json({ msg: 'El miembro ha sido eliminado del equipo' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al eliminar el miembro del equipo' })
    }
}

export {
    verEquipos,
    verEquiposProyecto,
    verEquipo,
    crearEquipo,
    aceptarInvitacion,
    asignarRoles,
    agregarMiembro,
    eliminarMiembro
}
