import { check, validationResult } from 'express-validator'
import { Op } from 'sequelize';
import { Etapa, Proyecto, Tarea, Usuario, EquipoProyecto, UsuarioEquipo }from '../indexmodels';

import {
    emailEtapaAgregada,
    emailEtapaEliminada,
    emailEtapaModificada
} from '../helpers/emails';

const verEtapas = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Verificamos las etapas del proyecto
    const { nombre_proyecto } = req.params
    const proyectoEncontrado = await Proyecto.findOne({
        where: { nombre_proyecto: nombre_proyecto }
    })
    if (!proyectoEncontrado) {
        return res.status(500).json({ error: 'No se encontró el proyecto' })
    }
    try {
        const etapasProyecto = await Etapa.findAll({
            where: { id_proyecto_fk_etapa: proyectoEncontrado.dataValues.id_proyecto }
        })

        // Enviamos la lista de etapas en la respuesta
        res.json({
            etapasProyecto: etapasProyecto
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: `Error al mostrar las etapas del proyecto ${nombre_proyecto}` })
    }
}

const verEtapa = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Verificamos la etapa solicitada
    const { id_etapa } = req.params
    const etapaEncontrada = await Etapa.findOne({
        where: { id_etapa: id_etapa }
    })
    if (!etapaEncontrada) {
        return res.status(500).json({ error: 'La etapa no existe' })
    }
    try {
        // Buscamos las tareas asociadas a esa etapa
        const tareasEtapa = await Tarea.findAll({
            where: { id_etapa_fk_tarea: id_etapa }
        })

        // Regresamos la información de la etapa más sus tareas
        res.json({
            datosEtapa: etapaEncontrada,
            tareasEtapa: tareasEtapa
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: `Error al mostrar información de la etapa` })
    }
}

const agregarEtapa = async (req, res) => {
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    await check('nombre_etapa').notEmpty().withMessage('Nombre de etapa vacío').run(req)
    await check('descr_etapa').notEmpty().withMessage('Descripción de etapa vacía').run(req)
    await check('fecha_inicio_etapa').notEmpty().withMessage('Fecha de inicio de etapa vacía').isISO8601().withMessage('Fecha inválida').run(req)
    await check('fecha_fin_etapa').notEmpty().withMessage('Fecha de fin de etapa vacía').isISO8601().withMessage('Fecha inválida').run(req)
    await check('estado_etapa').notEmpty().withMessage('Estado de etapa vacío').run(req)

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { nombre_etapa, descr_etapa, fecha_inicio_etapa, fecha_fin_etapa, estado_etapa } = req.body
    const { nombre_proyecto } = req.params

    try {
        // Obtén las fechas del proyecto para validar los límites
        const proyecto = await Proyecto.findOne({ where: { nombre_proyecto } })
        if (!proyecto) {
            return res.status(404).json({ error: 'Proyecto no encontrado' })
        }

        const projectStartDate = new Date(proyecto.fecha_inicio_proyecto)
        const projectEndDate = new Date(proyecto.fecha_fin_proyecto)
        const etapaStartDate = new Date(fecha_inicio_etapa)
        const etapaEndDate = new Date(fecha_fin_etapa)

        // Validar que la etapa esté dentro de los límites del proyecto
        if (etapaStartDate < projectStartDate || etapaEndDate > projectEndDate) {
            return res.status(400).json({
                error: 'Las fechas de la etapa deben estar dentro de las fechas del proyecto'
            })
        }

        // Verificar solapamientos con otras etapas del mismo proyecto
        const etapasExistentes = await Etapa.findAll({
            where: {
                id_proyecto_fk_etapa: proyecto.dataValues.id_proyecto,
                [Op.or]: [
                    { 
                        fecha_inicio_etapa: { 
                            [Op.between]: [fecha_inicio_etapa, fecha_fin_etapa] 
                        } 
                    },
                    { 
                        fecha_fin_etapa: { 
                            [Op.between]: [fecha_inicio_etapa, fecha_fin_etapa] 
                        } 
                    },
                    {
                        [Op.and]: [
                            { fecha_inicio_etapa: { [Op.lte]: fecha_inicio_etapa } },
                            { fecha_fin_etapa: { [Op.gte]: fecha_fin_etapa } }
                        ]
                    }
                ]
            }
        })

        if (etapasExistentes.length > 0) {
            return res.status(400).json({
                error: 'Las fechas de la etapa se solapan con otra etapa existente en el proyecto'
            })
        }

        // Crear la nueva etapa
        const nuevaEtapa = await Etapa.create({
            nombre_etapa,
            descr_etapa,
            fecha_inicio_etapa,
            fecha_fin_etapa,
            estado_etapa,
            id_proyecto_fk_etapa: proyecto.dataValues.id_proyecto
        })

        // Informamos a los usuarios por correo electrónico
        const email_creador = usuario.dataValues.email_usuario
        // Recopilamos la información de todos los usuarios que trabajan en el proyecto
        const equiposProyecto = await EquipoProyecto.findAll({
            where: { id_proyecto_fk_clas: proyecto.dataValues.id_proyecto }
        })
        let usuariosInforme = []
        let datosUsuarios = []
        // Encontramos los id de todos los usuarios dentro de algún equipo relacionado con el proyecto
        for (const equipo of equiposProyecto) {
            const idUsuarios = await UsuarioEquipo.findAll({
                where: { id_equipo_fk_UE: equipo.dataValues.id_equipo_fk_clas }
            })
            usuariosInforme.push(idUsuarios)
        }
        // Obtenemos los nombres & emails de cada usuario
        for (const UE of usuariosInforme) {
            for (const usuarioEncontrado of UE) {
                const datos = await Usuario.findOne({
                    where: { id_usuario: usuarioEncontrado.dataValues.id_usuario_fk_UE }
                })
                const datosUsuario = {
                    nombre_usuario: datos.dataValues.nombre_usuario,
                    email_usuario: datos.dataValues.email_usuario,
                    rol: usuarioEncontrado.dataValues.rol
                }
                datosUsuarios.push(datosUsuario)
            }
        }

        // Enviamos el email
        try {
            for (const datos of datosUsuarios) {
                if (datos.rol !== 'Líder') {
                    // Verificamos el permiso del usuario en cuestión
                    const pref_recordatorio = datos.dataValues.pref_recordatorio
                    if (pref_recordatorio) {
                        await emailEtapaAgregada({
                            email_usuario: datos.email_usuario,
                            nombre_integrante: datos.nombre_usuario,
                            email_lider: email_creador,
                            nombre_proyecto: proyecto.dataValues.nombre_proyecto
                        })
                    }
                }
            }
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: 'Hubo un error al enviar el correo informativo de los cambios' })
        }

        return res.json({
            msg: 'Etapa agregada exitosamente',
            etapa: nuevaEtapa
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al agregar la etapa' })
    }
}

const modificarEtapa = async (req, res) => {
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('nombre_etapa').notEmpty().withMessage('Nombre de etapa vacío').run(req)
    await check('descr_etapa').notEmpty().withMessage('Descripción de etapa vacía').run(req)
    await check('fecha_inicio_etapa').notEmpty().withMessage('Fecha de inicio de etapa vacía').isISO8601().withMessage('Fecha inválida').run(req)
    await check('fecha_fin_etapa').notEmpty().withMessage('Fecha de fin de etapa vacía').isISO8601().withMessage('Fecha inválida').run(req)
    await check('estado_etapa').notEmpty().withMessage('Estado de etapa vacío').run(req)

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { nombre_etapa, descr_etapa, fecha_inicio_etapa, fecha_fin_etapa, estado_etapa } = req.body
    const { id_etapa } = req.params
    const etapaEncontrada = await Etapa.findOne({
        where: { id_etapa: id_etapa }
    })
    const id_proyecto = etapaEncontrada.dataValues.id_proyecto_fk_etapa

    try {
        // Validar que el proyecto exista
        const proyecto = await Proyecto.findOne({ where: { id_proyecto } })
        if (!proyecto) {
            return res.status(404).json({ error: 'Proyecto no encontrado' })
        }

        const projectStartDate = new Date(proyecto.fecha_inicio_proyecto)
        const projectEndDate = new Date(proyecto.fecha_fin_proyecto)
        const etapaStartDate = new Date(fecha_inicio_etapa)
        const etapaEndDate = new Date(fecha_fin_etapa)

        // Validar que las fechas de la etapa estén dentro del rango del proyecto
        if (etapaStartDate < projectStartDate || etapaEndDate > projectEndDate) {
            return res.status(400).json({
                error: 'Las fechas de la etapa deben estar dentro de las fechas del proyecto'
            })
        }

        // Verificar que las fechas no se solapen con otras etapas del mismo proyecto
        const etapasExistentes = await Etapa.findAll({
            where: {
                id_proyecto_fk_etapa: id_proyecto,
                id_etapa: { [Op.ne]: id_etapa }, // Excluir la etapa actual
                [Op.or]: [
                    { fecha_inicio_etapa: { [Op.between]: [fecha_inicio_etapa, fecha_fin_etapa] } },
                    { fecha_fin_etapa: { [Op.between]: [fecha_inicio_etapa, fecha_fin_etapa] } },
                    {
                        [Op.and]: [
                            { fecha_inicio_etapa: { [Op.lte]: fecha_inicio_etapa } },
                            { fecha_fin_etapa: { [Op.gte]: fecha_fin_etapa } }
                        ]
                    }
                ]
            }
        })

        if (etapasExistentes.length > 0) {
            return res.status(400).json({
                error: 'Las fechas de la etapa se solapan con otra etapa existente en el proyecto'
            })
        }

        // Actualizar la etapa
        await Etapa.update(
            { nombre_etapa, descr_etapa, fecha_inicio_etapa, fecha_fin_etapa, estado_etapa },
            { where: { id_etapa } }
        )

        // Informamos a los usuarios por correo electrónico
        const email_creador = usuario.dataValues.email_usuario
        // Recopilamos la información de todos los usuarios que trabajan en el proyecto
        const equiposProyecto = await EquipoProyecto.findAll({
            where: { id_proyecto_fk_clas: proyecto.dataValues.id_proyecto }
        })
        let usuariosInforme = []
        let datosUsuarios = []
        // Encontramos los id de todos los usuarios dentro de algún equipo relacionado con el proyecto
        for (const equipo of equiposProyecto) {
            const idUsuarios = await UsuarioEquipo.findAll({
                where: { id_equipo_fk_UE: equipo.dataValues.id_equipo_fk_clas }
            })
            usuariosInforme.push(idUsuarios)
        }
        // Obtenemos los nombres & emails de cada usuario
        for (const UE of usuariosInforme) {
            for (const usuarioEncontrado of UE) {
                const datos = await Usuario.findOne({
                    where: { id_usuario: usuarioEncontrado.dataValues.id_usuario_fk_UE }
                })
                const datosUsuario = {
                    nombre_usuario: datos.dataValues.nombre_usuario,
                    email_usuario: datos.dataValues.email_usuario,
                    rol: usuarioEncontrado.dataValues.rol
                }
                datosUsuarios.push(datosUsuario)
            }
        }

        // Enviamos el email
        try {
            for (const datos of datosUsuarios) {
                if (datos.rol !== 'Líder') {
                    // Verificamos el permiso del usuario en cuestión
                    const pref_recordatorio = datos.dataValues.pref_recordatorio
                    if (pref_recordatorio) {
                        await emailEtapaModificada({
                            email_usuario: datos.email_usuario,
                            nombre_integrante: datos.nombre_usuario,
                            email_lider: email_creador,
                            nombre_proyecto: proyecto.dataValues.nombre_proyecto
                        })
                    }
                }
            }
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: 'Hubo un error al enviar el correo informativo de los cambios' })
        }

        return res.json({ msg: 'Etapa modificada exitosamente' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al modificar la etapa' })
    }
}

const eliminarEtapa = async (req, res) => {
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    const { id_etapa } = req.params
    const etapaEncontrada = await Etapa.findOne({
        where: { id_etapa: id_etapa }
    })
    const id_proyecto = etapaEncontrada.dataValues.id_proyecto_fk_etapa

    try {
        // Validar que el proyecto y la etapa existan
        const proyecto = await Proyecto.findOne({ where: { id_proyecto } })
        if (!proyecto) {
            return res.status(404).json({ error: 'Proyecto no encontrado' })
        }

        const etapa = await Etapa.findOne({ where: { id_etapa, id_proyecto_fk_etapa: id_proyecto } })
        if (!etapa) {
            return res.status(404).json({ error: 'Etapa no encontrada' })
        }

        // Eliminar la etapa
        await Etapa.destroy({ where: { id_etapa } })

        // Informamos a los usuarios por correo electrónico
        const email_creador = usuario.dataValues.email_usuario
        // Recopilamos la información de todos los usuarios que trabajan en el proyecto
        const equiposProyecto = await EquipoProyecto.findAll({
            where: { id_proyecto_fk_clas: proyecto.dataValues.id_proyecto }
        })
        let usuariosInforme = []
        let datosUsuarios = []
        // Encontramos los id de todos los usuarios dentro de algún equipo relacionado con el proyecto
        for (const equipo of equiposProyecto) {
            const idUsuarios = await UsuarioEquipo.findAll({
                where: { id_equipo_fk_UE: equipo.dataValues.id_equipo_fk_clas }
            })
            usuariosInforme.push(idUsuarios)
        }
        // Obtenemos los nombres & emails de cada usuario
        for (const UE of usuariosInforme) {
            for (const usuarioEncontrado of UE) {
                const datos = await Usuario.findOne({
                    where: { id_usuario: usuarioEncontrado.dataValues.id_usuario_fk_UE }
                })
                const datosUsuario = {
                    nombre_usuario: datos.dataValues.nombre_usuario,
                    email_usuario: datos.dataValues.email_usuario,
                    rol: usuarioEncontrado.dataValues.rol
                }
                datosUsuarios.push(datosUsuario)
            }
        }

        // Enviamos el email
        try {
            for (const datos of datosUsuarios) {
                if (datos.rol !== 'Líder') {
                    // Verificamos el permiso del usuario en cuestión
                    const pref_recordatorio = datos.dataValues.pref_recordatorio
                    if (pref_recordatorio) {
                        await emailEtapaEliminada({
                            email_usuario: datos.email_usuario,
                            nombre_integrante: datos.nombre_usuario,
                            email_lider: email_creador,
                            nombre_proyecto: proyecto.dataValues.nombre_proyecto
                        })
                    }
                }
            }
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: 'Hubo un error al enviar el correo informativo de los cambios' })
        }

        return res.json({ msg: 'Etapa eliminada exitosamente' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al eliminar la etapa' })
    }
}

export {
    verEtapas,
    verEtapa,
    agregarEtapa,
    modificarEtapa,
    eliminarEtapa
}
