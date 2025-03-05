import { check, validationResult } from 'express-validator'
import colors from 'colors'
import { Proyecto, Tarea, EquipoProyecto, Etapa, Equipo, UsuarioTareaEquipo, UsuarioEquipo, Usuario }from '../indexmodels';
import {
    NOX,
    NOX_Po,
    NOX_Pt
} from '../helpers/functions'
import {
    emailTareaAsignada,
    emailTareaEditada,
    emailCambiarEstadoFT,
    emailCambiarEstadoLider,
    emailTareaRevisada,
    emailTareaDesbloqueada,
    emailTareaEliminada
} from '../helpers/emails'
import Recompensa from '../models/Recompensa.model'
import UsuarioRecompensa from '../models/UsuarioRecompensa.model'

const verTareas = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Buscamos las tareas del equipo
    const { id_equipo } = req.params
    try {
        const tareasUnicas = await UsuarioTareaEquipo.findAll({
            where: { id_equipo_fk_UTE: id_equipo },
            attributes: ['id_tarea_fk_UTE'],
            include: [
                {
                    model: Tarea,
                    attributes: [
                        'id_tarea',
                        'nombre_tarea',
                        'descr_tarea',
                        'fecha_inicio_tarea',
                        'fecha_fin_tarea',
                        'estado_tarea',
                        'prioridad_tarea',
                        'dificultad_tarea',
                        'comentarios_tarea',
                        'is_locked'
                    ]
                }
            ],
            group: ['UsuarioTareaEquipo.id_tarea_fk_UTE', 'tarea.id_tarea'],
        })

        // Buscamos a los asignados de cada tarea
        const tareas_equipo = []
        for (const tarea of tareasUnicas) {
            console.log(tarea)
            const usuariosAsignados = []
            // Localizamos a los asignados por tarea
            const asignadosTarea = await UsuarioTareaEquipo.findAll({
                where: { id_tarea_fk_UTE: tarea.dataValues.id_tarea_fk_UTE }
            })
            // Obtenemos los datos necesarios para los usuarios
            for (const usuarioTabla of asignadosTarea) {
                const usuarioEncontrado = await Usuario.findOne({
                    where: { id_usuario: usuarioTabla.dataValues.id_usuario_fk_UTE },
                    attributes: ['nombre_usuario', 'url_avatar']
                })
                usuariosAsignados.push(usuarioEncontrado)
            }
            // Recopilamos los datos
            const datosTarea = {
                datos_tarea: tarea,
                asignados: usuariosAsignados
            }
            tareas_equipo.push(datosTarea)
        }

        // Devolvemos la lista de tareas
        res.json({
            tareas_equipo: tareas_equipo
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al mostrar las tareas del equipo' })
    }
}

const verTareasProyecto = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Buscamos las tareas del proyecto
    const { nombre_proyecto } = req.params
    try {
        // Buscamos al proyecto
        const proyectoEncontrado = await Proyecto.findOne({
            where: { nombre_proyecto }
        })
        // Buscamos las etapas asociadas al proyecto
        const etapasProyecto = await Etapa.findAll({
            where: { id_proyecto_fk_etapa: proyectoEncontrado.dataValues.id_proyecto }
        })

        // Juntamos todas las tareas del proyecto
        let tareasProyecto = []
        for (const etapa of etapasProyecto) {
            const tareasEncontradas = await Tarea.findAll({
                where: { id_etapa_fk_tarea: etapa.dataValues.id_etapa },
                attributes: [
                    'id_tarea',
                    'nombre_tarea',
                    'descr_tarea',
                    'fecha_inicio_tarea',
                    'fecha_fin_tarea',
                    'estado_tarea',
                    'prioridad_tarea',
                    'dificultad_tarea',
                    'comentarios_tarea'
                ],
            })
            tareasProyecto = tareasProyecto.concat(tareasEncontradas.map(tarea => tarea.dataValues))
        }

        // Buscamos a los asignados de cada tarea
        const tareas_equipo = []
        for (const tarea of tareasProyecto) {
            console.log(tarea)
            const usuariosAsignados = []
            // Localizamos a los asignados por tarea
            const asignadosTarea = await UsuarioTareaEquipo.findAll({
                where: { id_tarea_fk_UTE: tarea.id_tarea }
            })
            // Obtenemos los datos necesarios para los usuarios
            for (const usuarioTabla of asignadosTarea) {
                const usuarioEncontrado = await Usuario.findOne({
                    where: { id_usuario: usuarioTabla.dataValues.id_usuario_fk_UTE },
                    attributes: ['nombre_usuario', 'url_avatar']
                })
                usuariosAsignados.push(usuarioEncontrado)
            }
            // Recopilamos los datos
            const datosTarea = {
                datos_tarea: tarea,
                asignados: usuariosAsignados
            }
            tareas_equipo.push(datosTarea)
        }

        // Devolvemos la lista de tareas
        res.json({
            tareas_equipo: tareas_equipo
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al mostrar las tareas del equipo' })
    }
}

const verTarea = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Buscamos las tareas del usuario
    const { id_tarea } = req.params
    try {
        const tarea = await Tarea.findOne({
            where: { id_tarea },
            attributes: [
                'id_tarea',
                'nombre_tarea',
                'descr_tarea',
                'fecha_inicio_tarea',
                'fecha_fin_tarea',
                'prioridad_tarea',
                'comentarios_tarea'
            ]
        })
        if (!tarea) {
            return res.status(500).json({ error: 'La tarea no existe' })
        }

        // Buscamos a los asociados con la tarea
        const asignados = await UsuarioTareaEquipo.findAll({
            where: { id_tarea_fk_UTE: id_tarea }
        })
        // Encontramos a los usuarios asignados
        const usuariosAsignados = []
        for (const usuarioTabla of asignados) {
            const usuarioEncontrado = await Usuario.findOne({
                where: { id_usuario: usuarioTabla.dataValues.id_usuario_fk_UTE },
                attributes: ['nombre_usuario', 'url_avatar']
            })
            usuariosAsignados.push(usuarioEncontrado)
        }

        // Devolvemos la información de la tarea
        res.json({
            tarea: tarea,
            asignados: usuariosAsignados
        })
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al mostrar la tarea' })
    }
}

const asignarTarea = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('nombre_tarea').notEmpty().withMessage('Nombre de tarea vacío').run(req)
    await check('descr_tarea').notEmpty().withMessage('Descripción de tarea vacía').run(req)
    await check('prioridad_tarea').notEmpty().withMessage('Prioridad de tarea vacía').run(req)
    await check('dificultad_tarea').notEmpty().withMessage('Dificultad de tarea vacía').run(req)
    await check('fecha_inicio_tarea').notEmpty().withMessage('Fecha de inicio de tarea vacía').isISO8601().withMessage('Fecha inválida').run(req)
    await check('fecha_fin_tarea').notEmpty().withMessage('Fecha de finalización de tarea vacía').isISO8601().withMessage('Fecha inválida').run(req)
    await check('asignados_tarea').notEmpty().withMessage('Asignados de tarea vacío').run(req)
    await check('amonestacion').notEmpty().withMessage('Apartado de amonestación vacío').run(req)

    // Manejo de errores
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // Asignamos la tarea a los usuarios
    const { id_equipo } = req.params
    try {
        /* Encontramos los componentes necesarios */
        const equipoProyecto = await EquipoProyecto.findOne({
            where: { id_equipo_fk_clas: id_equipo }
        })
        const equipo = await Equipo.findOne({
            where: { id_equipo }
        })
        const id_proyecto = equipoProyecto.dataValues.id_proyecto_fk_clas
        // Encontramos las etapas que pertenecen al proyecto
        const etapasProyecto = await Etapa.findAll({
            where: { id_proyecto_fk_etapa: equipoProyecto.dataValues.id_proyecto_fk_clas }
        })
        if (!etapasProyecto) {
            return res.status(500).json({ error: 'Este proyecto no cuenta con etapas' })
        }
        const proyecto = await Proyecto.findOne({ where: { id_proyecto: id_proyecto } })
        if (!proyecto) {
            return res.status(404).json({ error: 'Proyecto no encontrado' })
        }

        /* Generamos el resto de atributos para la tarea */
        // Verificamos que la fecha se encuentre dentro de los límites del proyecto
        const projectStartDate = new Date(proyecto.dataValues.fecha_inicio_proyecto)
        const projectEndDate = new Date(proyecto.dataValues.fecha_fin_proyecto)
        const fechaInicio = new Date(req.body.fecha_inicio_tarea)
        const fechaFin = new Date(req.body.fecha_fin_tarea)
        if (fechaInicio < projectStartDate || fechaFin > projectEndDate) {
            return res.status(400).json({
                error: 'Las fechas de la tarea deben estar dentro de las fechas del proyecto'
            })
        }
        
        // Calculamos la fecha óptima (según dificultad)
        let fecha_optima_tarea = null
        if (req.body.dificultad_tarea === 'Fácil') {
            const fechaOptima = new Date(fechaInicio.getTime() + (fechaFin.getTime() - fechaInicio.getTime()) / 4)
            fecha_optima_tarea = fechaOptima.toISOString()
        }
        else if (req.body.dificultad_tarea === 'Media') {
            const fechaOptima = new Date(fechaInicio.getTime() + (fechaFin.getTime() - fechaInicio.getTime()) / 2)
            fecha_optima_tarea = fechaOptima.toISOString()
        }
        else if (req.body.dificultad_tarea === 'Difícil') {
            const triple = ((fechaFin.getTime() - fechaInicio.getTime()) / 4) * 3
            const fechaOptima = new Date(fechaInicio.getTime() + triple)
            fecha_optima_tarea = fechaOptima.toISOString()
        }
        else {
            return res.status(400).json({
                error: 'La dificultad seleccionada no se puede manejar'
            })
        }

        /* Determinamos la etapa a la que pertenece */
        let etapaAsociada = null
        let maxOverlap = 0

        etapasProyecto.forEach(etapa => {
            const etapaStartDate = new Date(etapa.dataValues.fecha_inicio_etapa)
            const etapaEndDate = new Date(etapa.dataValues.fecha_fin_etapa)

            // Verificar si la tarea está dentro del rango de la etapa
            if (fechaInicio <= etapaEndDate && fechaFin >= etapaStartDate) {
                // Calcular el tiempo de solapamiento entre la tarea y la etapa
                const overlapStart = fechaInicio > etapaStartDate ? fechaInicio : etapaStartDate // Máximo entre inicio tarea y etapa
                const overlapEnd = fechaFin < etapaEndDate ? fechaFin : etapaEndDate // Mínimo entre fin tarea y etapa
                const overlapTime = overlapEnd.getTime() - overlapStart.getTime() // Tiempo de solapamiento en milisegundos

                // Verificar si es el mayor solapamiento encontrado
                if (overlapTime > maxOverlap) {
                    maxOverlap = overlapTime
                    etapaAsociada = etapa // Asignar la etapa con el mayor tiempo de solapamiento
                }
            }
        })

        if (!etapaAsociada) {
            return res.status(400).json({
                error: 'La tarea no se encuentra dentro del rango de fechas de ninguna etapa del proyecto'
            })
        }

        // Agregar la etapa encontrada a los datos de la tarea
        const id_etapa_tarea = etapaAsociada.dataValues.id_etapa

        // Generamos los datos para la tarea
        const datosTarea = {
            nombre_tarea: req.body.nombre_tarea,
            descr_tarea: req.body.descr_tarea,
            prioridad_tarea: req.body.prioridad_tarea,
            dificultad_tarea: req.body.dificultad_tarea,
            fecha_inicio_tarea: req.body.fecha_inicio_tarea,
            fecha_fin_tarea: req.body.fecha_fin_tarea,
            fecha_optima_tarea: fecha_optima_tarea,
            amonestacion: req.body.amonestacion,
            id_etapa_fk_tarea: id_etapa_tarea
        }

        // Creamos la tarea y asociamos a los usuarios que fueron asignados
        const tarea = await Tarea.create(datosTarea)
        const usuariosAsignados = req.body.asignados_tarea
        const usuariosEncontrados = []
        if (!asignarTarea) {
            return res.status(400).json({
                error: 'No hay usuarios asignados'
            })
        }
        for (const username of usuariosAsignados) {
            // Encontramos al usuario
            const usuarioEncontrado = await Usuario.findOne({
                where: { nombre_usuario: username }
            })
            if (!usuarioEncontrado) {
                return res.status(400).json({
                    error: 'Este usuario no existe'
                })
            }
            // Verificamos que sí esté en el equipo
            const usuarioEnEquipo = await UsuarioEquipo.findOne({
                where: { id_usuario_fk_UE: usuarioEncontrado.dataValues.id_usuario, id_equipo_fk_UE: id_equipo }
            })
            if (!usuarioEnEquipo) {
                return res.status(400).json({
                    error: 'Este usuario no pertenece al equipo'
                })
            }
            usuariosEncontrados.push(usuarioEncontrado)
            // Lo asignamos a la tarea
            const dataUsuarioTareaEquipo = {
                fecha_asignacion: Date.now(),
                id_usuario_fk_UTE: usuarioEncontrado.dataValues.id_usuario,
                id_tarea_fk_UTE: tarea.dataValues.id_tarea,
                id_equipo_fk_UTE: id_equipo
            }
            await UsuarioTareaEquipo.create(dataUsuarioTareaEquipo)

            // Incrementamos las tareas asignadas
            const adicion = usuarioEnEquipo.dataValues.tareas_asignadas
            await UsuarioEquipo.update(
                { tareas_asignadas: adicion + 1 },
                { where: { id_usuario_fk_UE: usuarioEnEquipo.dataValues.id_usuario_fk_UE, id_equipo_fk_UE: id_equipo }}
            )

            /* Se les notifica sobre la tarea asignada */
            // Verificamos las preferencias del usuario en cuestión
            const pref_actividades = usuarioEncontrado.dataValues.pref_actividades
            if (pref_actividades) {
                try {
                    // Envío del correo de confirmación
                    await emailTareaAsignada({
                        email_asignado: usuarioEncontrado.dataValues.email_usuario,
                        nombre_asignado: usuarioEncontrado.dataValues.nombre_usuario,
                        email_lider: usuario.dataValues.email_usuario,
                        nombre_tarea: tarea.dataValues.nombre_tarea,
                        descr_tarea: tarea.dataValues.descr_tarea,
                        fecha_fin_tarea: tarea.dataValues.fecha_fin_tarea,
                        nombre_equipo: equipo.dataValues.nombre_equipo
                    })
                } catch (error) {
                    res.status(500).json({ error: 'Hubo un error al enviar el correo de notificación' })
                }
            }
        }

        // Enviar respuesta exitosa
        res.json({
            msg: 'Se ha asignado la tarea y notificado a los asignados'
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al asignar la tarea' })
    }
}

const editarTarea = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('nombre_tarea').notEmpty().withMessage('Nombre de tarea vacío').run(req)
    await check('descr_tarea').notEmpty().withMessage('Descripción de tarea vacía').run(req)
    await check('prioridad_tarea').notEmpty().withMessage('Prioridad de tarea vacía').run(req)
    await check('dificultad_tarea').notEmpty().withMessage('Dificultad de tarea vacía').run(req)
    await check('fecha_inicio_tarea').notEmpty().withMessage('Fecha de inicio de tarea vacía').isISO8601().withMessage('Fecha inválida').run(req)
    await check('fecha_fin_tarea').notEmpty().withMessage('Fecha de finalización de tarea vacía').isISO8601().withMessage('Fecha inválida').run(req)
    await check('nombre_equipo').notEmpty().withMessage('Equipo asignado de tarea vacío').run(req)
    await check('asignados_tarea').notEmpty().withMessage('Asignados de tarea vacío').run(req)

    // Manejo de errores
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { id_tarea } = req.params // ID de la tarea a editar

    try {
        // Encontrar la tarea
        const tarea = await Tarea.findOne({ where: { id_tarea } })
        if (!tarea) {
            return res.status(404).json({ error: 'Tarea no encontrada' })
        }
        const etapa = await Etapa.findOne({
            where: { id_etapa: tarea.dataValues.id_etapa_fk_tarea }
        })
        if (!etapa) {
            return res.status(404).json({ error: 'Etapa asociada a la tarea no encontrada' })
        }
        const proyecto = await Proyecto.findOne({
            where: { id_proyecto: etapa.dataValues.id_proyecto_fk_etapa }
        })
        if (!proyecto) {
            return res.status(404).json({ error: 'Proyecto no encontrado' })
        }

        // Verificamos que el equipo exista y pertenezca al proyecto de la tarea
        const equipo = await Equipo.findOne({
             where: { nombre_equipo: req.body.nombre_equipo }
        })
        if (!equipo) {
            return res.status(404).json({ error: 'Equipo no encontrado' })
        }
        const equipoProyecto = await EquipoProyecto.findOne({
            where: { id_equipo_fk_clas: equipo.dataValues.id_equipo, id_proyecto_fk_clas: proyecto.dataValues.id_proyecto }
        })
        if (!equipoProyecto) {
            return res.status(404).json({ error: 'Este equipo no está asociado al proyecto' })
        }

        // Validamos que las fechas se encuentren dentro del proyecto al que pertenece
        const projectStartDate = new Date(proyecto.dataValues.fecha_inicio_proyecto)
        const projectEndDate = new Date(proyecto.dataValues.fecha_fin_proyecto)
        const fechaInicio = new Date(req.body.fecha_inicio_tarea)
        const fechaFin = new Date(req.body.fecha_fin_tarea)

        if (fechaInicio < projectStartDate || fechaFin > projectEndDate) {
            return res.status(400).json({
                error: 'Las fechas de la tarea deben estar dentro de las fechas del proyecto'
            })
        }

        // Calculamos la fecha óptima (según dificultad)
        let fecha_optima_tarea = null
        if (req.body.dificultad_tarea === 'Fácil') {
            const fechaOptima = new Date(fechaInicio.getTime() + (fechaFin.getTime() - fechaInicio.getTime()) / 4)
            fecha_optima_tarea = fechaOptima.toISOString()
        }
        else if (req.body.dificultad_tarea === 'Media') {
            const fechaOptima = new Date(fechaInicio.getTime() + (fechaFin.getTime() - fechaInicio.getTime()) / 2)
            fecha_optima_tarea = fechaOptima.toISOString()
        }
        else if (req.body.dificultad_tarea === 'Difícil') {
            const triple = ((fechaFin.getTime() - fechaInicio.getTime()) / 4) * 3
            const fechaOptima = new Date(fechaInicio.getTime() + triple)
            fecha_optima_tarea = fechaOptima.toISOString()
        }
        else {
            return res.status(400).json({
                error: 'La dificultad seleccionada no se puede manejar'
            })
        }

        // Actualizamos los datos de la tarea
        await tarea.update({
            nombre_tarea: req.body.nombre_tarea,
            descr_tarea: req.body.descr_tarea,
            prioridad_tarea: req.body.prioridad_tarea,
            dificultad_tarea: req.body.dificultad_tarea,
            fecha_inicio_tarea: req.body.fecha_inicio_tarea,
            fecha_fin_tarea: req.body.fecha_fin_tarea,
            fecha_optima_tarea: fecha_optima_tarea
        })

        // Buscamos a los usuarios previos asociados con la tarea y quitamos la tarea asignada
        const usuariosAsociados = await UsuarioTareaEquipo.findAll({
            where: { id_tarea_fk_UTE: id_tarea }
        })
        // let disminucion = 0
        for (const asociado of usuariosAsociados) {
            const usuarioEquipo = await UsuarioEquipo.findOne({
                where: { id_usuario_fk_UE: asociado.dataValues.id_usuario_fk_UTE, id_equipo_fk_UE: equipo.dataValues.id_equipo }
            })
            console.log(usuarioEquipo.dataValues.tareas_asignadas)

            // Decrementamos las tareas asignadas
            const disminucion = usuarioEquipo.dataValues.tareas_asignadas
            console.log(colors.red.bold(`${disminucion}`))
            await UsuarioEquipo.update(
                { tareas_asignadas: disminucion - 1 },
                { where: { id_usuario_fk_UE: asociado.dataValues.id_usuario_fk_UTE, id_equipo_fk_UE: asociado.dataValues.id_equipo_fk_UTE }}
            )
        }

        // Actualizamos los usuarios asignados
        const usuariosAsignados = req.body.asignados_tarea
        if (usuariosAsignados && usuariosAsignados.length > 0) {
            // Eliminamos asignaciones previas
            await UsuarioTareaEquipo.destroy({
                where: { id_tarea_fk_UTE: id_tarea }
            })

            // Creamos nuevas asignaciones
            for (const username of usuariosAsignados) {
                const usuarioEncontrado = await Usuario.findOne({
                    where: { nombre_usuario: username }
                })

                if (!usuarioEncontrado) {
                    return res.status(400).json({
                        error: `El usuario ${username} no existe`
                    })
                }

                // Verificamos que pertenezca al equipo
                const usuarioEnEquipo = await UsuarioEquipo.findOne({
                    where: { id_usuario_fk_UE: usuarioEncontrado.dataValues.id_usuario, id_equipo_fk_UE: equipo.dataValues.id_equipo }
                })
                if (!usuarioEnEquipo) {
                    return res.status(400).json({
                        error: `El usuario ${username} no pertenece al equipo`
                    })
                }

                // Asignamos la tarea al usuario
                const dataUsuarioTareaEquipo = {
                    fecha_asignacion: Date.now(),
                    id_usuario_fk_UTE: usuarioEncontrado.dataValues.id_usuario,
                    id_tarea_fk_UTE: id_tarea,
                    id_equipo_fk_UTE: equipo.dataValues.id_equipo
                }
                await UsuarioTareaEquipo.create(dataUsuarioTareaEquipo)

                // Incrementamos las tareas asignadas para el usuario
                const usuarioEquipo = await UsuarioEquipo.findOne({
                    where: { id_usuario_fk_UE: usuarioEncontrado.dataValues.id_usuario, id_equipo_fk_UE: equipo.dataValues.id_equipo }
                })
                // Incrementamos las tareas asignadas
                console.log('previo')
                const adicion = usuarioEquipo.dataValues.tareas_asignadas
                console.log(colors.blue.bold(adicion))
                await UsuarioEquipo.update(
                    { tareas_asignadas: adicion + 1 },
                    { where: { id_usuario_fk_UE: usuarioEquipo.dataValues.id_usuario_fk_UE, id_equipo_fk_UE: usuarioEquipo.dataValues.id_equipo_fk_UE }}
                )
                console.log('posterior')

                /* Se les notifica sobre la tarea asignada */
                // Verificamos las preferencias del usuario en cuestión
                const pref_actividades = usuarioEncontrado.dataValues.pref_actividades
                if (pref_actividades) {
                    try {
                        // Envío del correo de confirmación
                        await emailTareaEditada({
                            email_asignado: usuarioEncontrado.dataValues.email_usuario,
                            nombre_asignado: usuarioEncontrado.dataValues.nombre_usuario,
                            email_lider: usuario.dataValues.email_usuario,
                            nombre_tarea: tarea.dataValues.nombre_tarea,
                            descr_tarea: tarea.dataValues.descr_tarea,
                            fecha_fin_tarea: tarea.dataValues.fecha_fin_tarea,
                            nombre_equipo: equipo.dataValues.nombre_equipo
                        })
                    } catch (error) {
                        res.status(500).json({ error: 'Hubo un error al enviar el correo de notificación' })
                    }
                }
            }
        }

        // Buscamos a los usuarios asociados con la tarea y quitamos la tarea asignada
        /*const usuariosAsociados2 = await UsuarioTareaEquipo.findAll({
            where: { id_tarea_fk_UTE: id_tarea }
        })
        for (const asociado of usuariosAsociados2) {
            const usuarioEquipo = await UsuarioEquipo.findOne({
                where: { id_usuario_fk_UE: asociado.dataValues.id_usuario_fk_UTE }
            })

            // Decrementamos las tareas asignadas
            const adicion = usuarioEquipo.dataValues.tareas_asignadas - 1
            await UsuarioEquipo.update(
                { tareas_asignadas: adicion },
                { where: { id_usuario_fk_UE: asociado.dataValues.id_usuario_fk_UTE, id_equipo_fk_UE: asociado.dataValues.id_equipo_fk_UTE }}
            )
        }*/

        // Enviamos respuesta exitosa
        res.json({
            msg: 'Tarea editada exitosamente. Se ha notificado a los asignados'
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al editar la tarea' })
    }
}

const cambiarEstado = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('estado_tarea').notEmpty().withMessage('Estado de tarea vacío').run(req)

    // Manejo de errores
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // Modificamos el estado de la tarea
    const { id_tarea } = req.params
    let is_locked = false
    let nMessage = 0
    try {
        // Encontramos la tarea
        const tareaEncontrada = await Tarea.findOne({
            where: { id_tarea }
        })
        if (!tareaEncontrada) {
            return res.status(500).json({ error: 'La tarea no existe' })
        }

        // Verificamos que la tarea no haya sido revisada antes
        if (tareaEncontrada.dataValues.dificultad_tarea === 'Revisada') {
            return res.status(500).json({ error: 'La tarea ya ha sido revisada' })
        }

        // Verificamos que el usuario tenga asignada la tarea o que sea un líder
        const usuarioTarea = await UsuarioTareaEquipo.findOne({
            where: { id_tarea_fk_UTE: id_tarea }
        })
        const estaAsignada = await UsuarioTareaEquipo.findOne({
            where: { id_usuario_fk_UTE: usuario.dataValues.id_usuario, id_tarea_fk_UTE: usuarioTarea.dataValues.id_tarea_fk_UTE }
        })
        const usuarioequipo = await UsuarioEquipo.findOne({
            where: { id_usuario_fk_UE: usuario.dataValues.id_usuario, id_equipo_fk_UE: usuarioTarea.dataValues.id_equipo_fk_UTE }
        })
        const rol = usuarioequipo.dataValues.rol    // Ya con esto consigues el rol
        console.log(rol)
        if (!estaAsignada) {
            // Verificamos aquí si el usuario es líder
            if (rol !== 'Líder') {
                return res.status(500).json({ error: 'Este usuario no puede entregar esta tarea' })
            }
        }

        // Denegamos la modificación si la tarea ya está compleada
        if (tareaEncontrada.dataValues.is_locked) {
            return res.status(500).json({ error: 'La tarea ya no puede modificarse' })
        }

        /* Modificamos el estado de la tarea */
        //    Si el estado es completado, se considera como entregada y se calcula el puntaje con NOX
        // Bloqueamos la tarea de completarse
        if (req.body.estado_tarea === 'Completado') {
            is_locked = true
            // Conseguimos las fechas de la tarea
            const start = Math.round(new Date(tareaEncontrada.dataValues.fecha_inicio_tarea).getTime() / 1000)
            const end = Math.round(new Date(tareaEncontrada.dataValues.fecha_fin_tarea).getTime() / 1000)
            const opt = Math.round(new Date(tareaEncontrada.dataValues.fecha_optima_tarea).getTime() / 1000)
            const now = Math.round(Date.now() / 1000)
            // Calculamos los datos para aplicar NOX
            const t = now - start
            const T = end - start
            const k = end - opt
            // Calculamos el puntaje obtenido de la tarea
            const puntaje_obtenido = Math.round(NOX_Pt(t, T, k))
            // Otorgamos el puntaje a todos los asignados de la tarea
            await UsuarioTareaEquipo.update(
                { puntuacion_provisional: puntaje_obtenido, fecha_asignacion: Date.now() },
                { where: { id_tarea_fk_UTE: tareaEncontrada.dataValues.id_tarea } }
            )

            /* Otorgamos una recompensa aleatoria a los usuarios */
            if (!tareaEncontrada.dataValues.first_time_comp) {
                nMessage = 1
                // Encontramos a todos los usuarios con la tarea asignada
                const asignados = await UsuarioTareaEquipo.findAll({
                    where: { id_tarea_fk_UTE: tareaEncontrada.dataValues.id_tarea }
                })
                for (const asignado of asignados) {
                    // Encontramos al usuario
                    const usuarioEncontrado = await Usuario.findOne({
                        where: { id_usuario: asignado.dataValues.id_usuario_fk_UTE }
                    })

                    // Entregamos una recompensa aleatoria
                    const dice = Math.random()
                    let rec = ''
                    console.log(dice)
                    // Determinamos el tipo de recompensa que se va a entregar
                    if (dice < 0.5) {
                        rec = 'baja'
                        console.log(colors.red.bold("Rareza baja"))
                    } else if (0.5 < dice && dice < 0.95) {
                        rec = 'media'
                        console.log(colors.blue.bold("Rareza media"))
                    } else if (0.95 < dice) {
                        rec = 'alta'
                        console.log(colors.yellow.bold("Rareza alta"))
                    }
                    // Entregamos las recompensas
                    const recompensas = await Recompensa.findAll({
                        where: { rareza: rec }
                    })
                    
                    // Elegimos una recompensa al azar
                    const indiceAleatorio = Math.floor(Math.random() * recompensas.length)
                    const recompensaElegida = recompensas[indiceAleatorio]

                    // Verificamos si el usuario que entrega la actividad ya tiene esta recompensa
                    const existeRecompensaUsuario = await UsuarioRecompensa.findOne({
                        where: { id_usuario_fk_UR: asignado.dataValues.id_usuario_fk_UTE, id_recompensa_fk_UR: recompensaElegida.dataValues.id_recompensa }
                    })

                    // Si no tiene la recompensa obtenida, se le otorga
                    let recompensa_obtenida = ''
                    if (!existeRecompensaUsuario) {
                        const usuarioRecompensaData = {
                        id_usuario_fk_UR: asignado.dataValues.id_usuario_fk_UTE,
                        id_recompensa_fk_UR: recompensaElegida.dataValues.id_recompensa
                        }
                        await UsuarioRecompensa.create(usuarioRecompensaData)
                        recompensa_obtenida = `${recompensaElegida.dataValues.nombre_recompensa} (${recompensaElegida.dataValues.descr_recompensa})`
                    }
                    // Si ya la tiene, entonces se suman 500 puntos a su puntuación provisional
                    else {
                        await UsuarioTareaEquipo.update(
                            { puntuacion_provisional: puntaje_obtenido + 500 },
                            { where: { id_tarea_fk_UTE: tareaEncontrada.dataValues.id_tarea, id_usuario_fk_UTE: usuario.dataValues.id_usuario } }
                        )
                        recompensa_obtenida = '+500 puntos sobre puntaje obtenido'
                    }

                    /* Notificamos a los asignados acerca de su recompensa */
                    // Verificamos las preferencias del usuario en cuestión
                    const pref_puntajes = usuarioEncontrado.dataValues.pref_puntajes
                    if (pref_puntajes) {
                        try {
                            // Envío del correo de confirmación
                            await emailCambiarEstadoFT({
                                email_asignado: usuarioEncontrado.dataValues.email_usuario,
                                nombre_asignado: usuarioEncontrado.dataValues.nombre_usuario,
                                nombre_tarea: tareaEncontrada.dataValues.nombre_tarea,
                                recompensa_obtenida: recompensa_obtenida,
                            })
                        } catch (error) {
                            res.status(500).json({ error: 'Hubo un error al enviar el correo de notificación (recompensas)' })
                        }
                    }
                }
            }

            /* Notificamos a los líderes de equipo */
            const integrantesEquipo = await UsuarioEquipo.findAll({
                where: { id_equipo_fk_UE: usuarioTarea.dataValues.id_equipo_fk_UTE }
            })
            const equipo = await Equipo.findOne({
                where: { id_equipo: usuarioTarea.dataValues.id_equipo_fk_UTE }
            })
            // Recorremos para encontrar a los líderes
            for (const integrante of integrantesEquipo) {
                // Encontramos al usuario
                const usuarioEncontrado = await Usuario.findOne({
                    where: { id_usuario: integrante.dataValues.id_usuario_fk_UE }
                })
                // Revisamos el rol del integrante
                const rol = integrante.dataValues.rol
                if (rol === 'Líder') {
                    // Envíamos el correo electrónico
                    // Verificamos las preferencias del usuario en cuestión
                    const pref_actividades = usuarioEncontrado.dataValues.pref_actividades
                    if (pref_actividades) {
                        try {
                            // Envío del correo de confirmación
                            await emailCambiarEstadoLider({
                                email_lider: usuarioEncontrado.dataValues.email_usuario,
                                nombre_lider: usuarioEncontrado.dataValues.nombre_usuario,
                                nombre_tarea: tareaEncontrada.dataValues.nombre_tarea,
                                nombre_equipo: equipo.dataValues.nombre_equipo,
                            })
                        } catch (error) {
                            console.log(error)
                            res.status(500).json({ error: 'Hubo un error al enviar el correo de notificación (avisos líderes)' })
                        }
                    }
                }
            }
        }

        // Actualizamos el estado de la tarea
        await Tarea.update(
            { estado_tarea: req.body.estado_tarea, is_locked: is_locked, first_time_comp: true },
            { where: { id_tarea } }
        )

        // Enviar respuesta exitosa según contexto
        if (nMessage === 0) {
            res.json({
                msg: 'Se ha modificado el estado de la tarea'
            })
        } else if (nMessage === 1) {
            res.json({
                msg: 'Se ha modificado el estado de la tarea y obtenido una recompensa nueva'
            })
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al cambiar el estado de la tarea' })
    }
}

const revisarTarea = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('nox_creatividad').notEmpty().withMessage('Modificador de creatividad vacío').run(req)
    await check('nox_calidad').notEmpty().withMessage('Modificador de calidad del trabajo vacío').run(req)
    await check('nox_colaboración').notEmpty().withMessage('Modificador de colaboración vacío').run(req)
    await check('nox_eficiencia').notEmpty().withMessage('Modificador de eficiencia vacío').run(req)
    await check('nox_doc_completa').notEmpty().withMessage('Modificador de documentación completa vacío').run(req)
    await check('nox_mala_implem').notEmpty().withMessage('Modificador de mala implementación vacío').run(req)
    await check('nox_doc_incompleta').notEmpty().withMessage('Modificador de falta de documentación vacío').run(req)
    await check('nox_baja_calidad').notEmpty().withMessage('Modificador de baja calidad vacío').run(req)
    await check('nox_no_comunicacion').notEmpty().withMessage('Modificador de falta de comunicación vacío').run(req)
    await check('nox_no_especificacion').notEmpty().withMessage('Modificador de incumplimiento de especificaciones vacío').run(req)

    // Manejo de errores
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    /* Revisamos la tarea */
    const { id_tarea } = req.params
    try {
        // Buscamos la tarea
        const tareaEncontrada = await Tarea.findOne({
            where: { id_tarea }
        })
        if (!tareaEncontrada) {
            return res.status(500).json({ error: 'La tarea no existe' })
        }

        // Verificamos que la tarea no haya sido revisada antes
        if (tareaEncontrada.dataValues.dificultad_tarea === 'Revisada') {
            return res.status(500).json({ error: 'La tarea ya ha sido revisada' })
        }

        // Buscamos al equipo
        const usuarioTareaEquipo = await UsuarioTareaEquipo.findOne({
            where: { id_tarea_fk_UTE: id_tarea }
        })
        const equipo = await Equipo.findOne({
            where: { id_equipo: usuarioTareaEquipo.dataValues.id_equipo_fk_UTE }
        })
        console.log(equipo.dataValues.nombre_equipo)

        // Verificamos que esté en un estado de revisión
        if (!tareaEncontrada.dataValues.is_locked) {
            return res.status(500).json({ error: 'La tarea no puede revisarse' })
        }

        // Revisamos si la tarea admite amonestaciones
        const amonestacion = tareaEncontrada.dataValues.amonestacion
        // Si hay amonestación, se aplican los modificadores
        if (amonestacion) {
            // Obtenemos el puntaje provisional de la tarea
            const asignados = await UsuarioTareaEquipo.findAll({
                where: { id_tarea_fk_UTE: id_tarea }
            })
            // Calculamos la amonestación acumulada
            const booleanos_amon = [
                req.body.nox_creatividad,
                req.body.nox_calidad,
                req.body.nox_colaboración,
                req.body.nox_eficiencia,
                req.body.nox_doc_completa,
                req.body.nox_mala_implem,
                req.body.nox_doc_incompleta,
                req.body.nox_baja_calidad,
                req.body.nox_no_comunicacion,
                req.body.nox_no_especificacion
            ]
            const acumulado_amon = NOX_Po(booleanos_amon)

            // Colocamos el puntaje provisional en el local de los usuarios asignados
            for (const usuario of asignados) {
                const miembroEquipo = await UsuarioEquipo.findOne({
                    where: { id_usuario_fk_UE: usuario.dataValues.id_usuario_fk_UTE, id_equipo_fk_UE: usuario.dataValues.id_equipo_fk_UTE }
                })
                // Obtenemos el puntaje provisional de la tarea
                const asignado = await UsuarioTareaEquipo.findOne({
                    where: { id_tarea_fk_UTE: id_tarea, id_usuario_fk_UTE: miembroEquipo.dataValues.id_usuario_fk_UE, id_equipo_fk_UTE: equipo.dataValues.id_equipo }
                })
                const puntaje = NOX(asignado.dataValues.puntuacion_provisional, acumulado_amon)
                const local = miembroEquipo.dataValues.puntuacion_local
                const asignadas = miembroEquipo.dataValues.tareas_asignadas
                console.log(colors.magenta.bold(asignadas))
                const completadas = miembroEquipo.dataValues.tareas_completadas
                console.log(colors.blue.bold(completadas))

                // Actualizamos las estadísticas locales
                await UsuarioEquipo.update(
                    {
                        puntuacion_local: local + puntaje,
                        tareas_asignadas: asignadas - 1,
                        tareas_completadas: completadas + 1
                    },
                    { where: { id_usuario_fk_UE: usuario.dataValues.id_usuario_fk_UTE, id_equipo_fk_UE: equipo.dataValues.id_equipo } }
                )
                // Actualizamos las estadísticas globales
                const usuarioEncontrado = await Usuario.findOne({
                    where: { id_usuario: usuario.dataValues.id_usuario_fk_UTE }
                })
                const global = usuarioEncontrado.dataValues.puntuacion_global + puntaje
                const completadas_g = usuarioEncontrado.dataValues.tareas_completadas_global
                await Usuario.update(
                    {
                        puntuacion_global: global,
                        tareas_completadas_global: completadas_g + 1
                    },
                    { where: { id_usuario: usuario.dataValues.id_usuario_fk_UTE } }
                )

                /* Se informa a los asignados de la tarea */
                const puntaje_obtenido = await UsuarioEquipo.findOne({
                    where: { id_usuario_fk_UE: usuarioEncontrado.dataValues.id_usuario, id_equipo_fk_UE: equipo.dataValues.id_equipo }
                })
                try {
                    // Envío del correo de confirmación
                    // Verificamos las preferencias del usuario en cuestión
                    const pref_actividades = usuarioEncontrado.dataValues.pref_actividades
                    if (pref_actividades) {
                        await emailTareaRevisada({
                            email_asignado: usuarioEncontrado.dataValues.email_usuario,
                            nombre_asignado: usuarioEncontrado.dataValues.nombre_usuario,
                            nombre_tarea: tareaEncontrada.dataValues.nombre_tarea,
                            nombre_equipo: equipo.dataValues.nombre_equipo,
                            puntaje_obtenido: puntaje_obtenido
                        })
                    }
                } catch (error) {
                    console.log(error)
                    res.status(500).json({ error: 'Hubo un error al enviar el correo de notificación' })
                }
            }
        }
        // Si no hay, se extrae la puntuación provicional y se suma a la clasificación
        else {
            // Obtenemos el puntaje provisional de la tarea
            const asignados = await UsuarioTareaEquipo.findAll({
                where: { id_tarea_fk_UTE: id_tarea }
            })
            // const puntaje = asignado.dataValues.puntuacion_provisional

            // Colocamos el puntaje provisional en el local de los usuarios asignados
            for (const usuario of asignados) {
                const miembroEquipo = await UsuarioEquipo.findOne({
                    where: { id_usuario_fk_UE: usuario.dataValues.id_usuario_fk_UTE, id_equipo_fk_UE: usuario.dataValues.id_equipo_fk_UTE }
                })
                // Obtenemos el puntaje provisional de la tarea
                const asignado = await UsuarioTareaEquipo.findOne({
                    where: { id_tarea_fk_UTE: id_tarea, id_usuario_fk_UTE: miembroEquipo.dataValues.id_usuario_fk_UE, id_equipo_fk_UTE: equipo.dataValues.id_equipo }
                })
                const puntaje = asignado.dataValues.puntuacion_provisional
                const local = miembroEquipo.dataValues.puntuacion_local
                const asignadas = miembroEquipo.dataValues.tareas_asignadas
                const completadas = miembroEquipo.dataValues.tareas_completadas
                // Actualizamos las estadísticas locales
                await UsuarioEquipo.update(
                    {
                        puntuacion_local: local + puntaje,
                        tareas_asignadas: asignadas - 1,
                        tareas_completadas: completadas + 1
                    },
                    { where: { id_usuario_fk_UE: usuario.dataValues.id_usuario_fk_UTE, id_equipo_fk_UE: equipo.dataValues.id_equipo } }
                )
                // Actualizamos las estadísticas globales
                const usuarioEncontrado = await Usuario.findOne({
                    where: { id_usuario: usuario.dataValues.id_usuario_fk_UTE }
                })
                const global = usuarioEncontrado.dataValues.puntuacion_global + puntaje
                const completadas_g = usuarioEncontrado.dataValues.tareas_completadas_global
                await Usuario.update(
                    {
                        puntuacion_global: global,
                        tareas_completadas_global: completadas_g + 1
                    },
                    { where: { id_usuario: usuario.dataValues.id_usuario_fk_UTE } }
                )

                /* Se informa a los asignados de la tarea */
                const puntaje_obtenido = await UsuarioEquipo.findOne({
                    where: { id_usuario_fk_UE: usuarioEncontrado.dataValues.id_usuario, id_equipo_fk_UE: equipo.dataValues.id_equipo }
                })
                try {
                    // Envío del correo de confirmación
                    // Verificamos las preferencias del usuario en cuestión
                    const pref_actividades = usuarioEncontrado.dataValues.pref_actividades
                    if (pref_actividades) {
                        await emailTareaRevisada({
                            email_asignado: usuarioEncontrado.dataValues.email_usuario,
                            nombre_asignado: usuarioEncontrado.dataValues.nombre_usuario,
                            nombre_tarea: tareaEncontrada.dataValues.nombre_tarea,
                            nombre_equipo: equipo.dataValues.nombre_equipo,
                            puntaje_obtenido: puntaje_obtenido.dataValues.puntuacion_local
                        })
                    }
                } catch (error) {
                    console.log(error)
                    res.status(500).json({ error: 'Hubo un error al enviar el correo de notificación' })
                }
            }
        }

        // Actualizamos la tarea
        await Tarea.update(
            { dificultad_tarea: 'Revisada' },
            { where: { id_tarea } }
        )

        // Enviar respuesta exitosa
        res.json({
            msg: 'Se ha devuelto la tarea y se han actualizado los puntajes de los asignados'
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al revisar la tarea' })
    }
}

const desbloquearTarea = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Modificamos el estado de la tarea
    const { id_tarea } = req.params
    const is_locked = false
    try {
        // Encontramos la tarea
        const tareaEncontrada = await Tarea.findOne({
            where: { id_tarea }
        })
        if (!tareaEncontrada) {
            return res.status(500).json({ error: 'La tarea no existe' })
        }

        // Verificamos que la tarea no haya sido revisada antes
        if (tareaEncontrada.dataValues.dificultad_tarea === 'Revisada') {
            return res.status(500).json({ error: 'La tarea ya ha sido revisada' })
        }

        // Actualizamos el estado de la tarea
        await Tarea.update(
            { estado_tarea: 'En progreso', is_locked: is_locked },
            { where: { id_tarea } }
        )

        // Reiniciamos el puntaje acumulado de la tarea
        await UsuarioTareaEquipo.update(
            { puntuacion_provisional: 0 },
            { where: { id_tarea_fk_UTE: tareaEncontrada.dataValues.id_tarea } }
        )

        /* Notificamos a los asignados */
        // Encontramos a los usuarios asignados
        const asignados = await UsuarioTareaEquipo.findAll({
            where: { id_tarea_fk_UTE: id_tarea }
        })
        for (const asignado of asignados) {
            const usuarioEncontrado = await Usuario.findOne({
                where: { id_usuario: asignado.dataValues.id_usuario_fk_UTE }
            })
            const equipo = await Equipo.findOne({
                where: { id_equipo: asignado.dataValues.id_equipo_fk_UTE }
            })

            // Intentamos enviar el correo
            try {
                // Envío del correo de confirmación
                // Verificamos las preferencias del usuario en cuestión
                const pref_actividades = usuarioEncontrado.dataValues.pref_actividades
                if (pref_actividades) {
                    await emailTareaDesbloqueada({
                        email_asignado: usuarioEncontrado.dataValues.email_usuario,
                        nombre_asignado: usuarioEncontrado.dataValues.nombre_usuario,
                        nombre_tarea: tareaEncontrada.dataValues.nombre_tarea,
                        nombre_equipo: equipo.dataValues.nombre_equipo,
                    })
                }
            } catch (error) {
                console.log(error)
                res.status(500).json({ error: 'Hubo un error al enviar el correo de notificación' })
            }    
        }
        
        // Enviar respuesta exitosa
        res.json({
            msg: 'Se ha desbloqueado la tarea para los asignados'
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al desbloquear la tarea' })
    }
}

const eliminarTarea = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Eliminamos la tarea
    const { id_tarea } = req.params
    try {
        const tareaEncontrada = await Tarea.findOne({
            where: { id_tarea }
        })
        if (!tareaEncontrada) {
            return res.status(500).json({ error: 'La tarea no existe' })
        }

        // Buscamos a los usuarios asociados con la tarea y quitamos la tarea asignada
        const usuariosAsociados = await UsuarioTareaEquipo.findAll({
            where: { id_tarea_fk_UTE: id_tarea }
        })
        for (const asociado of usuariosAsociados) {
            const usuarioEquipo = await UsuarioEquipo.findOne({
                where: { id_usuario_fk_UE: asociado.dataValues.id_usuario_fk_UTE, id_equipo_fk_UE: asociado.dataValues.id_equipo_fk_UTE }
            })
            const usuarioEncontrado = await Usuario.findOne({
                where: { id_usuario: usuarioEquipo.dataValues.id_usuario_fk_UE }
            })
            const equipo = await Equipo.findOne({
                where: { id_equipo: asociado.dataValues.id_equipo_fk_UTE }
            })

            // Decrementamos las tareas asignadas
            const disminucion = usuarioEquipo.dataValues.tareas_asignadas - 1
            await UsuarioEquipo.update(
                { tareas_asignadas: disminucion },
                { where: { id_usuario_fk_UE: asociado.dataValues.id_usuario_fk_UTE, id_equipo_fk_UE: asociado.dataValues.id_equipo_fk_UTE }}
            )

            try {
                // Envío del correo de confirmación
                // Verificamos las preferencias del usuario en cuestión
                const pref_actividades = usuarioEncontrado.dataValues.pref_actividades
                if (pref_actividades) {
                    await emailTareaEliminada({
                        email_asignado: usuarioEncontrado.dataValues.email_usuario,
                        nombre_asignado: usuarioEncontrado.dataValues.nombre_usuario,
                        email_lider: usuario.dataValues.email_usuario,
                        nombre_tarea: tareaEncontrada.dataValues.nombre_tarea,
                        nombre_equipo: equipo.dataValues.nombre_equipo
                    })
                }
            } catch (error) {
                res.status(500).json({ error: 'Hubo un error al enviar el correo de notificación' })
            }
        }

        // Eliminamos la tarea y sus incidencias
        await Tarea.destroy({
            where: { id_tarea }
        })

        // Enviar respuesta exitosa
        res.json({
            msg: 'Se ha eliminado la tarea'
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al eliminar la tarea' })
    }
}

export {
    verTareas,
    verTareasProyecto,
    verTarea,
    asignarTarea,
    editarTarea,
    cambiarEstado,
    revisarTarea,
    desbloquearTarea,
    eliminarTarea
}
