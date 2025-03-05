import { check, validationResult } from 'express-validator'
import { UsuarioEquipo, Proyecto, Usuario, Equipo, Etapa, Tarea, Riesgo, Estimacion, EquipoProyecto, UsuarioTareaEquipo }from '../indexmodels';
import { emailProyectoModificado } from '../helpers/emails'

const verProyectos = async(req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Retornamos proyectos del usuario
    try {
        // Buscamos los proyectos
        const proyectos_usuario = await Proyecto.findAll({
            where: { id_usuario_fk_proyecto: usuario.dataValues.id_usuario },
            attributes: ['id_proyecto', 'nombre_proyecto', 'descr_proyecto', 'estado_proyecto'] // Incluimos estado_proyecto
        })

        // Verificamos que sí haya proyectos
        if (proyectos_usuario.length === 0) {
            return res.status(404).json({ message: 'No se encontraron proyectos para este usuario' })
        }

        // Enviamos la lista de proyectos en la respuesta
        res.json({
            proyectos_usuario: proyectos_usuario
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al mostrar los proyectos' })
    }
}

const verProyecto = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Retornamos información de un proyecto
    const { nombre_proyecto } = req.params
    try {
        // Buscamos el proyecto
        const proyectoEncontrado = await Proyecto.findOne({
            where: { nombre_proyecto: nombre_proyecto },
            attributes: ['id_proyecto', 'nombre_proyecto', 'descr_proyecto', 'fecha_inicio_proyecto', 'fecha_fin_proyecto', 'metodologia_proyecto', 'estado_proyecto']
        })

        // Obtenemos todos los riesgos asociados al proyecto
        const riesgosProyecto = await Riesgo.findAll({
            where: { id_riesgo_fk_proyecto: proyectoEncontrado.dataValues.id_proyecto },
            attributes: ['id_riesgo', 'nombre_riesgo', 'descr_riesgo', 'prob_riesgo']
        })

        // Obtenemos la estimación asociada con el proyecto
        const estimacionesProyecto = await Estimacion.findOne({
            where: { id_estimacion_fk_proyecto: proyectoEncontrado.dataValues.id_proyecto },
            attributes: ['id_estimacion']
        })

        // Verificamos que se haya encontrado un proyecto y lo enviamos de vuelta
        if (proyectoEncontrado) {
            res.json({
                proyecto: proyectoEncontrado,
                riesgos_proyecto: riesgosProyecto,
                estimaciones_proyecto: estimacionesProyecto
            })
        }
        else {
            res.status(500).json({ error: 'No existe este proyecto' })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al mostrar este proyecto' })
    }
}

const crearProyecto = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('nombre_proyecto').notEmpty().withMessage('Nombre de proyecto vacío').run(req)
    await check('descr_proyecto').notEmpty().withMessage('Descripción de proyecto vacía').run(req)

    // Manejo de errores
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const existingProyect = await Proyecto.findOne({ where: { nombre_proyecto: req.body.nombre_proyecto } })
    if (existingProyect) {
        return res.status(500).json({ error: 'Este proyecto ya existe' })
    }

    // Creamos el proyecto
    try {
        // Obtenemos el ID del usuario mediante su email
        const usuarioEncontrado = await Usuario.findOne({
            where: { email_usuario: usuario.dataValues.email_usuario },
            attributes: ['id_usuario']
        })

        if (!usuarioEncontrado) {
            return res.status(404).json({ error: 'Usuario no encontrado' })
        }

        // Creación del proyecto con el ID del usuario
        const proyectoData = {
            ...req.body,
            id_usuario_fk_proyecto: usuarioEncontrado.dataValues.id_usuario
        }

        await Proyecto.create(proyectoData)

        // Enviar respuesta exitosa
        res.json({
            msg: 'Se ha creado el proyecto'
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al crear proyecto' })
    }
}

const proporcionarDetalles = async (req, res) => {
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    const today = new Date().toISOString().split("T")[0]

    await check('fecha_inicio_proyecto')
        .notEmpty().withMessage('Fecha de inicio del proyecto vacía')
        .isISO8601().withMessage('Fecha requerida')
        .isAfter(today).withMessage('La fecha de inicio debe ser hoy o en el futuro')
        .run(req)

    await check('fecha_fin_proyecto')
        .notEmpty().withMessage('Fecha de finalización del proyecto vacía')
        .isISO8601().withMessage('Fecha requerida')
        .isAfter(req.body.fecha_inicio_proyecto).withMessage('La fecha de fin debe ser después de la fecha de inicio')
        .run(req)

    await check('estado_proyecto').notEmpty().withMessage('Estado de proyecto vacío').run(req)
    await check('metodologia_proyecto').notEmpty().withMessage('Metodología de proyecto vacía').run(req)
    await check('numero_etapas_proyecto').notEmpty().withMessage('Número de etapas de proyecto vacío').run(req)

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { nombre_proyecto } = req.params
    const { fecha_inicio_proyecto, fecha_fin_proyecto, estado_proyecto, metodologia_proyecto, numero_etapas_proyecto } = req.body

    try {
        const proyectoEncontrado = await Proyecto.findOne({ where: { nombre_proyecto } })

        if (proyectoEncontrado) {
            await Proyecto.update(
                {
                    fecha_inicio_proyecto: fecha_inicio_proyecto,
                    fecha_fin_proyecto: fecha_fin_proyecto,
                    estado_proyecto,
                    metodologia_proyecto,
                    numero_etapas_proyecto
                },
                { where: { nombre_proyecto } }
            )

            if (metodologia_proyecto === 'Scrum') {
                const startDate = new Date(fecha_inicio_proyecto)
                const endDate = new Date(fecha_fin_proyecto)
                const totalDuration = endDate.getTime() - startDate.getTime()
                const etapaDuration = totalDuration / numero_etapas_proyecto

                for (let index = 0; index < numero_etapas_proyecto; index++) {
                    const etapaStartDate = new Date(startDate.getTime() + etapaDuration * index)
                    const etapaEndDate = new Date(etapaStartDate.getTime() + etapaDuration)

                    const etapaData = {
                        nombre_etapa: `Sprint ${index + 1} (${proyectoEncontrado.dataValues.nombre_proyecto})`,
                        descr_etapa: `Sprint número ${index + 1} del proyecto ${proyectoEncontrado.dataValues.nombre_proyecto}`,
                        fecha_inicio_etapa: etapaStartDate.toISOString().split("T")[0],
                        fecha_fin_etapa: etapaEndDate.toISOString().split("T")[0],
                        id_proyecto_fk_etapa: proyectoEncontrado.dataValues.id_proyecto,
                    }
                    const etapa = await Etapa.create(etapaData)

                    const tareasData = [
                        { nombre_tarea: `Planificación del Sprint ${index + 1}`, descr_tarea: `Realizar una junta para identificar los hitos a conseguir en este Sprint`, id_etapa_fk_tarea: etapa.dataValues.id_etapa },
                        { nombre_tarea: `Actualización del backlog del Sprint ${index + 1}`, descr_tarea: `Realizar una identificación de las actividades a realizar en este Sprint`, id_etapa_fk_tarea: etapa.dataValues.id_etapa },
                        { nombre_tarea: `Evaluación con Product Owner`, descr_tarea: `Junta programada para obtener retroalimenación de los productos obtenidos con el Product Owner`, id_etapa_fk_tarea: etapa.dataValues.id_etapa },
                        { nombre_tarea: `Retrospectiva del Sprint ${index + 1}`, descr_tarea: `Realizar una junta para evaluar los resultados obtenidos en este Sprint`, id_etapa_fk_tarea: etapa.dataValues.id_etapa }
                    ]
                    
                    const datos_tareas = []
                    for (const tareaData of tareasData) {
                        const tarea = await Tarea.create(tareaData)
                        datos_tareas.push(tarea)
                    }

                    /* Asociamos la tarea al único equipo y a sus miembros */
                    // Ubicamos al equipo
                    const unicoEquipo = await EquipoProyecto.findOne({
                        where: { id_proyecto_fk_clas: proyectoEncontrado.dataValues.id_proyecto }
                    })
                    if (!unicoEquipo) {
                        return res.status(404).json({ error: 'El equipo asociado al proyecto no existe' })
                    }
                    const equipoEncontrado = await Equipo.findOne({
                        where: { id_equipo: unicoEquipo.dataValues.id_equipo_fk_clas }
                    })
                    if (!equipoEncontrado) {
                        return res.status(404).json({ error: 'El equipo no existe' })
                    }
                    // Encontramos a los miembros del equipo
                    const usuariosAsignados = await UsuarioEquipo.findAll({
                        where: { id_equipo_fk_UE: equipoEncontrado.dataValues.id_equipo }
                    })
                    for (const tarea of datos_tareas) {
                        // Asignamos la tarea a todos los miembros
                        const usuariosEncontrados = []
                        for (const user of usuariosAsignados) {
                            // Encontramos al usuario
                            const usuarioEncontrado = await Usuario.findOne({
                                where: { id_usuario: user.dataValues.id_usuario_fk_UE }
                            })
                            if (!usuarioEncontrado) {
                                return res.status(400).json({
                                    error: 'Este usuario no existe'
                                })
                            }
                            // Verificamos que sí esté en el equipo
                            const usuarioEnEquipo = await UsuarioEquipo.findOne({
                                where: { id_usuario_fk_UE: usuarioEncontrado.dataValues.id_usuario, id_equipo_fk_UE: equipoEncontrado.dataValues.id_equipo }
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
                                id_equipo_fk_UTE: equipoEncontrado.dataValues.id_equipo
                            }
                            await UsuarioTareaEquipo.create(dataUsuarioTareaEquipo)

                            // Incrementamos las tareas asignadas
                            const adicion = usuarioEnEquipo.dataValues.tareas_asignadas + 1
                            await UsuarioEquipo.update(
                                { tareas_asignadas: adicion },
                                { where: { id_usuario_fk_UE: usuarioEncontrado.dataValues.id_usuario, id_equipo_fk_UE: equipoEncontrado.dataValues.id_equipo }}
                            )
                        }
                    }
                }
            }

            return res.json({
                msg: 'Se ha concluido la creación del proyecto, revise las etapas y tareas para personalizarlas'
            })
        } else {
            return res.status(404).json({ error: 'No existe este proyecto' })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al crear proyecto' })
    }
}

const modificarProyecto = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario;
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' });
    }

    // Validación de la integridad de los datos de entrada
    const today = new Date().toISOString().split("T")[0];
    
    await check('fecha_inicio_proyecto')
        .notEmpty().withMessage('Fecha de inicio del proyecto vacía')
        .isISO8601().withMessage('Fecha inválida')
        .isAfter(today).withMessage('La fecha de inicio debe ser hoy o en el futuro')
        .run(req);

    await check('fecha_fin_proyecto')
        .notEmpty().withMessage('Fecha de finalización del proyecto vacía')
        .isISO8601().withMessage('Fecha inválida')
        .isAfter(req.body.fecha_inicio_proyecto).withMessage('La fecha de fin debe ser después de la fecha de inicio')
        .run(req);

    await check('estado_proyecto').notEmpty().withMessage('Estado de proyecto vacío').run(req);
    await check('metodologia_proyecto').notEmpty().withMessage('Metodología de proyecto vacía').run(req);
    await check('numero_etapas_proyecto').notEmpty().withMessage('Número de etapas de proyecto vacío').run(req);

    // Manejo de errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre_proyecto } = req.params;
    const { fecha_inicio_proyecto, fecha_fin_proyecto, estado_proyecto, metodologia_proyecto, numero_etapas_proyecto } = req.body;

    try {
        // Buscamos el proyecto por nombre
        const proyectoEncontrado = await Proyecto.findOne({ where: { nombre_proyecto } });
        
        // Verificamos que el proyecto exista
        if (!proyectoEncontrado) {
            return res.status(404).json({ error: 'No existe este proyecto' });
        }

        // Actualizamos los detalles del proyecto
        await Proyecto.update(
            { fecha_inicio_proyecto, fecha_fin_proyecto, estado_proyecto, metodologia_proyecto, numero_etapas_proyecto },
            { where: { nombre_proyecto } }
        );

        // Si se especifica Scrum, actualizamos o creamos las etapas correspondientes
        if (metodologia_proyecto === 'Scrum' && numero_etapas_proyecto !== proyectoEncontrado.dataValues.numero_etapas_proyecto) {
            const startDate = new Date(fecha_inicio_proyecto);
            const endDate = new Date(fecha_fin_proyecto);
            const totalDuration = endDate.getTime() - startDate.getTime();
            const etapaDuration = totalDuration / numero_etapas_proyecto;

            // Eliminar etapas y tareas anteriores asociadas al proyecto
            await Etapa.destroy({ where: { id_proyecto_fk_etapa: proyectoEncontrado.dataValues.id_proyecto } });

            // Crear nuevas etapas y tareas
            for (let index = 0; index < numero_etapas_proyecto; index++) {
                const etapaStartDate = new Date(startDate.getTime() + etapaDuration * index);
                const etapaEndDate = new Date(etapaStartDate.getTime() + etapaDuration);

                const etapaData = {
                    nombre_etapa: `Sprint ${index + 1} (${proyectoEncontrado.dataValues.nombre_proyecto})`,
                    descr_etapa: `Sprint número ${index + 1} del proyecto ${proyectoEncontrado.dataValues.nombre_proyecto}`,
                    fecha_inicio_etapa: etapaStartDate.toISOString().split("T")[0],
                    fecha_fin_etapa: etapaEndDate.toISOString().split("T")[0],
                    id_proyecto_fk_etapa: proyectoEncontrado.dataValues.id_proyecto,
                };
                const etapa = await Etapa.create(etapaData);

                const tareasData = [
                    { nombre_tarea: `Planificación del Sprint ${index + 1}`, descr_tarea: `Realizar una junta para identificar los hitos a conseguir en este Sprint`, id_etapa_fk_tarea: etapa.dataValues.id_etapa },
                    { nombre_tarea: `Actualización del backlog del Sprint ${index + 1}`, descr_tarea: `Realizar una identificación de las actividades a realizar en este Sprint`, id_etapa_fk_tarea: etapa.dataValues.id_etapa },
                    { nombre_tarea: `Evaluación con Product Owner`, descr_tarea: `Junta programada para obtener retroalimentación de los productos obtenidos con el Product Owner`, id_etapa_fk_tarea: etapa.dataValues.id_etapa },
                    { nombre_tarea: `Retrospectiva del Sprint ${index + 1}`, descr_tarea: `Realizar una junta para evaluar los resultados obtenidos en este Sprint`, id_etapa_fk_tarea: etapa.dataValues.id_etapa }
                ];

                for (const tareaData of tareasData) {
                    await Tarea.create(tareaData);
                }
            }
        }

        // Informamos a todos quienes trabajan en el proyecto por correo
        const email_creador = usuario.dataValues.email_usuario
        // Recopilamos la información de todos los usuarios que trabajan en el proyecto
        const equiposProyecto = await EquipoProyecto.findAll({
            where: { id_proyecto_fk_clas: proyectoEncontrado.dataValues.id_proyecto }
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
                        await emailProyectoModificado({
                            email_usuario: datos.email_usuario,
                            nombre_integrante: datos.nombre_usuario,
                            email_creador: email_creador,
                            nombre_proyecto: proyectoEncontrado.dataValues.nombre_proyecto
                        })
                    }
                }
            }
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error: 'Hubo un error al enviar el correo informativo de los cambios' })
        }

        // Respuesta exitosa
        res.json({
            msg: 'Se ha modificado el proyecto y actualizado sus detalles'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al modificar el proyecto' });
    }
}

const verEstadisticas = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Calculamos las estadísticas
    const { nombre_proyecto } = req.params
    try {
        /* Calculamos el avance general del proyecto */
        let total_tareas = 0
        let tareas_porHacer = 0
        let tareas_enProgreso = 0
        let tareas_completadas = 0
        let tareas_criticas = 0
        let porcentaje_avance = 0
        const proyectoEncontrado = await Proyecto.findOne({
            where: { nombre_proyecto }
        })
        const etapasProyecto = await Etapa.findAll({
            where: { id_proyecto_fk_etapa: proyectoEncontrado.dataValues.id_proyecto }
        })
        for (const etapa of etapasProyecto) {
            const tareasEncontradas = await Tarea.findAll({
                where: { id_etapa_fk_tarea: etapa.dataValues.id_etapa }
            })
            total_tareas += tareasEncontradas.length
            console.log(total_tareas)
            // Revisamos por tarea el estado
            for (const tarea of tareasEncontradas) {
                const estado = tarea.dataValues.estado_tarea
                if (estado === 'Completado') {
                    tareas_completadas += 1
                }
                if (estado === 'Por hacer') {
                    tareas_porHacer += 1
                }
                if (estado === 'En progreso') {
                    tareas_enProgreso += 1
                }
                // Revisamos si la tarea es crítica
                const prioridad = tarea.dataValues.prioridad_tarea
                if (prioridad === 'Alta') {
                    tareas_criticas += 1
                }
            }
        }

        // Calculamos porcentaje general de avance
        porcentaje_avance = (100 * tareas_completadas) / total_tareas

        // Conjuntamos la información
        const inicio_estadisticas = {
            porcentaje_avance: Math.round(porcentaje_avance * 100) / 100,
            tareas_criticas: tareas_criticas
        }

        /* Conjuntamos los datos para el grafico */
        const datos_grafico_avance = {
            total_tareas: total_tareas,
            tareas_porHacer: tareas_porHacer,
            tareas_enProgreso: tareas_enProgreso,
            tareas_completadas: tareas_completadas
        }

        /* Conjuntamos el rendimiento de cada miembro */
        const equiposProyecto = await EquipoProyecto.findAll({
            where: { id_proyecto_fk_clas: proyectoEncontrado.dataValues.id_proyecto }
        })
        // Encontramos todas las tareas por proyecto
        const listaUsuariosCompleta_Rend = {}

        for (const equipo of equiposProyecto) {
            // Buscamos las tareas completadas usuario por usuario
            const datosUsuarioEquipo = await UsuarioEquipo.findAll({
                where: { id_equipo_fk_UE: equipo.dataValues.id_equipo_fk_clas }
            })

            // Revisamos miembro por miembro sus tareas completadas
            for (const datosIntegrante of datosUsuarioEquipo) {
                const completadasIntegrante = datosIntegrante.dataValues.tareas_completadas

                // Encontramos al usuario para encontrar su username
                const integranteEncontrado = await Usuario.findOne({
                    where: { id_usuario: datosIntegrante.dataValues.id_usuario_fk_UE }
                })

                const usernameIntegrante = integranteEncontrado?.dataValues.nombre_usuario

                // Consolidamos las tareas completadas en el objeto intermedio
                if (listaUsuariosCompleta_Rend[usernameIntegrante]) {
                    listaUsuariosCompleta_Rend[usernameIntegrante] += completadasIntegrante
                } else {
                    listaUsuariosCompleta_Rend[usernameIntegrante] = completadasIntegrante
                }
            }
        }

        // Transformamos el objeto intermedio en un array final
        const listaUsuariosFinal = Object.entries(listaUsuariosCompleta_Rend).map(([username_integrante, revisadas_integrante]) => ({
            username_integrante,
            revisadas_integrante
        }))

        /* Conjuntamos el tiempo dedicado de cada miembro */
        const listaUsuariosCompleta_Temp = {}
        // Buscamos las tareas por etapa
        for (const etapa of etapasProyecto) {
            const tareasEncontradas = await Tarea.findAll({
                where: { id_etapa_fk_tarea: etapa.dataValues.id_etapa }
            })
            // Revisamos el estado de cada tarea
            for (const tarea of tareasEncontradas) {
                const estado = tarea.dataValues.estado_tarea
                // Si la tarea está completada, revisamos los tiempos de entrega de cada usuario asignado
                if (estado === 'Completado') {
                    const start = Math.round(new Date(tarea.dataValues.fecha_inicio_tarea).getTime() / 1000)
                    // Buscamos por usuario el tiempo de entrega
                    const entregaAsignados = await UsuarioTareaEquipo.findAll({
                        where: { id_tarea_fk_UTE: tarea.dataValues.id_tarea }
                    })
                    for (const asignado of entregaAsignados) {
                        // Encontramos al usuario
                        const asignadoEncontrado = await Usuario.findOne({
                            where: { id_usuario: asignado.dataValues.id_usuario_fk_UTE }
                        })
                        const datosEquipoAsignados = await UsuarioEquipo.findAll({
                            where: { id_usuario_fk_UE: asignado.dataValues.id_usuario_fk_UTE }
                        })
                        // Calculamos el total de tareas completadas para el asignado
                        let total_completadas = 0
                        for (const datosEquipoAsignado of datosEquipoAsignados) {
                            total_completadas += datosEquipoAsignado.dataValues.tareas_completadas
                        }

                        const username_asignado = asignadoEncontrado.dataValues.nombre_usuario
                        const fecha_entrega = Math.round(new Date(asignado.dataValues.fecha_asignacion).getTime() / 1000)
                        let horas_dedicadas = Math.round(((fecha_entrega - start) / 3600) * 100) / 100
                        if (horas_dedicadas < 0) {
                            horas_dedicadas *= -1
                        }

                        // Consolidamos las tareas completadas en el objeto intermedio
                        if (listaUsuariosCompleta_Temp[username_asignado]) {
                            listaUsuariosCompleta_Temp[username_asignado] += horas_dedicadas
                        } else {
                            listaUsuariosCompleta_Temp[username_asignado] = horas_dedicadas
                        }
                    }
                }
            }
        }

        // Transformamos el objeto intermedio en un array final
        const listaUsuariosFinal_Temp = Object.entries(listaUsuariosCompleta_Temp).map(([username_asignado, horas_dedicadas]) => ({
            username_asignado,
            horas_dedicadas
        }))

        /* Generamos la tabla de tareas por estado */
        let tareasProyecto = []
        for (const etapa of etapasProyecto) {
            const tareasEncontradas = await Tarea.findAll({
                where: { id_etapa_fk_tarea: etapa.dataValues.id_etapa },
                attributes: [
                    'id_tarea',
                    'nombre_tarea',
                    'fecha_fin_tarea',
                    'estado_tarea',
                    'prioridad_tarea',
                ],
            })
            tareasProyecto = tareasProyecto.concat(tareasEncontradas.map(tarea => tarea.dataValues))
        }

        // Buscamos a los asignados de cada tarea
        const tareas_equipo = []
        for (const tarea of tareasProyecto) {
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

        /* Generamos la tabla de miembros y desempeño */
        interface UsuarioDesempeno {
            totalHoras: number
            totalCompletadas: number
            totalAsignadas: number
        }

        // Inicializamos el objeto temporal con el tipo adecuado
        const listaUsuariosCompleta_Des: { [username: string]: UsuarioDesempeno } = {}

        // Buscamos las tareas por etapa
        for (const etapa of etapasProyecto) {
            const tareasEncontradas = await Tarea.findAll({
                where: { id_etapa_fk_tarea: etapa.dataValues.id_etapa }
            })

            // Revisamos el estado de cada tarea
            for (const tarea of tareasEncontradas) {
                const estado = tarea.dataValues.estado_tarea

                // Si la tarea está completada, revisamos los tiempos de entrega de cada usuario asignado
                if (estado === 'Completado') {
                    const start = Math.round(new Date(tarea.dataValues.fecha_inicio_tarea).getTime() / 1000)

                    // Buscamos por usuario el tiempo de entrega
                    const entregaAsignados = await UsuarioTareaEquipo.findAll({
                        where: { id_tarea_fk_UTE: tarea.dataValues.id_tarea }
                    })

                    for (const asignado of entregaAsignados) {
                        // Encontramos al usuario asignado
                        const asignadoEncontrado = await Usuario.findOne({
                            where: { id_usuario: asignado.dataValues.id_usuario_fk_UTE }
                        })

                        // Calculamos el total de tareas completadas y asignadas en todos los equipos donde participa el usuario
                        const datosEquipoAsignados = await UsuarioEquipo.findAll({
                            where: { id_usuario_fk_UE: asignado.dataValues.id_usuario_fk_UTE }
                        })

                        let total_completadas = 0
                        let total_asignadas = 0
                        datosEquipoAsignados.forEach(equipo => {
                            total_completadas += equipo.dataValues.tareas_completadas
                            total_asignadas += equipo.dataValues.tareas_asignadas
                        })

                        const username_asignado = asignadoEncontrado?.dataValues.nombre_usuario || 'Desconocido'
                        const fecha_entrega = Math.round(new Date(asignado.dataValues.fecha_asignacion).getTime() / 1000)
                        let horas_dedicadas = (fecha_entrega - start) / 3600
                        if (horas_dedicadas < 0) {
                            horas_dedicadas *= -1
                        }

                        // Consolidamos los datos en el objeto temporal
                        if (listaUsuariosCompleta_Des[username_asignado]) {
                            listaUsuariosCompleta_Des[username_asignado].totalHoras += horas_dedicadas
                            listaUsuariosCompleta_Des[username_asignado].totalCompletadas += total_completadas
                            listaUsuariosCompleta_Des[username_asignado].totalAsignadas += total_asignadas
                        } else {
                            listaUsuariosCompleta_Des[username_asignado] = {
                                totalHoras: horas_dedicadas,
                                totalCompletadas: total_completadas,
                                totalAsignadas: total_asignadas
                            }
                        }
                    }
                }
            }
        }

        console.log(listaUsuariosCompleta_Des)
        // Transformamos el objeto intermedio en un array final
        const listaUsuariosCompleta_DesFin = Object.entries(listaUsuariosCompleta_Des).map(
            ([username_asignado, { totalHoras, totalCompletadas, totalAsignadas }]) => ({
                username_asignado,
                total_horas_dedicadas: Math.round((totalHoras) * 100) / 100,
                total_tareas_revisadas: totalCompletadas,
                total_tareas_asignadas: totalAsignadas
            })
        )

        console.log(listaUsuariosCompleta_DesFin)

        /* Generamos la tabla de avance por etapa */
        const datos_tabla_etapas = []
        for (const etapa of etapasProyecto) {
            const tareasEncontradas = await Tarea.findAll({
                where: { id_etapa_fk_tarea: etapa.dataValues.id_etapa }
            })

            // Encontramos los datos
            const total_tareas_etapa = tareasEncontradas.length
            let tareas_completadas_etapa = 0
            for (const tarea of tareasEncontradas) {
                console.log(tarea.dataValues.estado_tarea)
                if (tarea.dataValues.estado_tarea === 'Completado') {
                    tareas_completadas_etapa += 1
                }
            }
            // Calculamos el porcentaje de compleción de la etapa
            const porcentaje_completado = Math.round(((100 * tareas_completadas_etapa) / total_tareas_etapa) * 100) / 100
            // Generamos los datos y los adjuntamos
            const datos_tabla_etapa = {
                nomnbre_etapa: etapa.dataValues.nombre_etapa,
                porcentaje_completado: porcentaje_completado
            }
            datos_tabla_etapas.push(datos_tabla_etapa)
        }

        /* Conjuntamos la información final */
        const estadisticas_proyecto = {
            inicio_estadisticas: inicio_estadisticas,
            datos_grafico_avance: datos_grafico_avance,
            datos_grafico_rendimiento: listaUsuariosFinal,
            datos_grafico_dedicado: listaUsuariosFinal_Temp,
            datos_tabla_tareas: tareas_equipo,
            datos_tabla_desempeno: listaUsuariosCompleta_DesFin,
            datos_tabla_etapas: datos_tabla_etapas
        }

        // Regresamos la información
        res.json({
            estadisticas_proyecto: estadisticas_proyecto
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al mostrar las estadísticas del proyecto' })
    }
}

const generarResumen = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Generamos el resumen
    const { nombre_proyecto } = req.params
    try {
        // Encontramos el proyecto
        const proyectoEncontrado = await Proyecto.findOne({
            where: { nombre_proyecto }
        })
        // Recuperamos la información directa
        const fecha_inicio = proyectoEncontrado.dataValues.fecha_inicio_proyecto
        const fecha_fin = proyectoEncontrado.dataValues.fecha_fin_proyecto
        const estado = proyectoEncontrado.dataValues.estado_proyecto
        // Buscamos las tareas
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
        // Contamos las tareas
        const total_tareas = tareasProyecto.length
        // Contamos tareas pendientes y completadas
        let tareas_completadas = 0
        let tareas_pendientes = 0
        for (const tarea of tareasProyecto) {
            if (tarea.estado_tarea === 'Completado') {
                tareas_completadas += 1
            } else {
                tareas_pendientes += 1
            }
        }
        // Calculamos el progreso del proyecto
        const progreso_general = (tareas_completadas * 100) / total_tareas
        const redondeado = Math.round(progreso_general * 100) / 100

        // Generamos el JSON del resumen
        const resumen_proyecto ={
            fecha_inicio: fecha_inicio,
            fecha_fin: fecha_fin,
            progreso_general: redondeado,
            estado: estado,
            total_tareas: total_tareas,
            tareas_completadas: tareas_completadas,
            tareas_pendientes: tareas_pendientes
        }

        // Regresamos los datos encontrados
        res.json({
            resumen_proyecto: resumen_proyecto
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Error al mostrar el resumen de proyecto' })
    }
}

export {
    verProyectos,
    verProyecto,
    crearProyecto,
    proporcionarDetalles,
    modificarProyecto,
    verEstadisticas,
    generarResumen
}
