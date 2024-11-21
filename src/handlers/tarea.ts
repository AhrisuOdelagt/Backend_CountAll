import { check, validationResult } from 'express-validator'
import Tarea from '../models/Tarea.model'
import EquipoProyecto from '../models/EquipoProyecto.model'
import Proyecto from '../models/Proyecto.model'
import Etapa from '../models/Etapa.model'
import Equipo from '../models/Equipo.model'
import UsuarioTareaEquipo from '../models/UsuarioTareaEquipo.model'
import UsuarioEquipo from '../models/UsuarioEquipo.model'
import Usuario from '../models/Usuario.model'
import {
    NOX,
    NOX_Po,
    NOX_Pt
} from '../helpers/functions'

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
                        'comentarios_tarea'
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
            const fechaOptima = new Date(fechaInicio.getTime() + (fechaFin.getTime() - ((fechaInicio.getTime()) / 4) * 3))
            fecha_optima_tarea = fechaOptima.toISOString()
        }
        else if (req.body.dificultad_tarea === 'Media') {
            const fechaOptima = new Date(fechaInicio.getTime() + (fechaFin.getTime() - fechaInicio.getTime()) / 2)
            fecha_optima_tarea = fechaOptima.toISOString()
        }
        else if (req.body.dificultad_tarea === 'Difícil') {
            const fechaOptima = new Date(fechaInicio.getTime() + (fechaFin.getTime() - fechaInicio.getTime()) / 4)
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
            const adicion = usuarioEnEquipo.dataValues.tareas_asignadas + 1
            await UsuarioEquipo.update(
                { tareas_asignadas: adicion },
                { where: { id_usuario_fk_UE: usuarioEncontrado.dataValues.id_usuario, id_equipo_fk_UE: id_equipo }}
            )
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
            const fechaOptima = new Date(fechaInicio.getTime() + (fechaFin.getTime() - ((fechaInicio.getTime()) / 4) * 3))
            fecha_optima_tarea = fechaOptima.toISOString()
        }
        else if (req.body.dificultad_tarea === 'Media') {
            const fechaOptima = new Date(fechaInicio.getTime() + (fechaFin.getTime() - fechaInicio.getTime()) / 2)
            fecha_optima_tarea = fechaOptima.toISOString()
        }
        else if (req.body.dificultad_tarea === 'Difícil') {
            const fechaOptima = new Date(fechaInicio.getTime() + (fechaFin.getTime() - fechaInicio.getTime()) / 4)
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
        for (const asociado of usuariosAsociados) {
            const usuarioEquipo = await UsuarioEquipo.findOne({
                where: { id_usuario_fk_UE: asociado.dataValues.id_usuario_fk_UTE }
            })

            // Decrementamos las tareas asignadas
            const disminucion = usuarioEquipo.dataValues.tareas_asignadas - 1
            await UsuarioEquipo.update(
                { tareas_asignadas: disminucion },
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
            }
        }

        // Buscamos a los usuarios asociados con la tarea y quitamos la tarea asignada
        const usuariosAsociados2 = await UsuarioTareaEquipo.findAll({
            where: { id_tarea_fk_UTE: id_tarea }
        })
        for (const asociado of usuariosAsociados2) {
            const usuarioEquipo = await UsuarioEquipo.findOne({
                where: { id_usuario_fk_UE: asociado.dataValues.id_usuario_fk_UTE }
            })

            // Decrementamos las tareas asignadas
            const adicion = usuarioEquipo.dataValues.tareas_asignadas + 1
            await UsuarioEquipo.update(
                { tareas_asignadas: adicion },
                { where: { id_usuario_fk_UE: asociado.dataValues.id_usuario_fk_UTE, id_equipo_fk_UE: asociado.dataValues.id_equipo_fk_UTE }}
            )
        }

        // Enviamos respuesta exitosa
        res.json({
            msg: 'Tarea editada exitosamente'
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
    try {
        // Encontramos la tarea
        const tareaEncontrada = await Tarea.findOne({
            where: { id_tarea }
        })
        if (!tareaEncontrada) {
            return res.status(500).json({ error: 'La tarea no existe' })
        }

        // Verificamos que el usuario tenga asignada la tarea
        const estaAsignada = await UsuarioTareaEquipo.findOne({
            where: { id_usuario_fk_UTE: usuario.dataValues.id_usuario, id_tarea_fk_UTE: id_tarea }
        })
        if (!estaAsignada) {
            return res.status(500).json({ error: 'Este usuario no puede entregar esta tarea' })
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
                { puntuacion_provisional: puntaje_obtenido },
                { where: { id_tarea_fk_UTE: tareaEncontrada.dataValues.id_tarea } }
            )
        }

        // Actualizamos el estado de la tarea
        await Tarea.update(
            { estado_tarea: req.body.estado_tarea, is_locked: is_locked },
            { where: { id_tarea } }
        )

        // Enviar respuesta exitosa
        res.json({
            msg: 'Se ha modificado el estado de la tarea'
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al cambiar el estado de la tarea' })
    }
}

const revisarTarea = async (req, res) => {

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

        // Actualizamos el estado de la tarea
        await Tarea.update(
            { estado_tarea: 'En progreso', is_locked: is_locked },
            { where: { id_tarea } }
        )

        // Enviar respuesta exitosa
        res.json({
            msg: 'Se ha desbloqueado la tarea'
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
                where: { id_usuario_fk_UE: asociado.dataValues.id_usuario_fk_UTE }
            })

            // Decrementamos las tareas asignadas
            const disminucion = usuarioEquipo.dataValues.tareas_asignadas - 1
            await UsuarioEquipo.update(
                { tareas_asignadas: disminucion },
                { where: { id_usuario_fk_UE: asociado.dataValues.id_usuario_fk_UTE, id_equipo_fk_UE: asociado.dataValues.id_equipo_fk_UTE }}
            )
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
