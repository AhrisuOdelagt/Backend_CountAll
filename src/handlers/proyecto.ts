import { check, validationResult } from 'express-validator'
import Proyecto from '../models/Proyecto.model'
import Usuario from '../models/Usuario.model'
import Etapa from '../models/Etapa.model'
import Tarea from '../models/Tarea.model'
import Riesgo from '../models/Riesgo.model'
import Estimacion from '../models/Estimacion.model'
import EquipoProyecto from '../models/EquipoProyecto.model'
import UsuarioEquipo from '../models/UsuarioEquipo.model'
import { emailProyectoModificado } from '../helpers/emails'
import { useInflection } from 'sequelize'

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
            attributes: ['id_proyecto', 'nombre_proyecto', 'descr_proyecto']
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
            attributes: ['id_estimacion', 'puntos_funcion', 'loc', 'personas_estimacion', 'tiempo_estimacion', 'precio_estimacion']
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
                { fecha_inicio_proyecto, fecha_fin_proyecto, estado_proyecto, metodologia_proyecto, numero_etapas_proyecto },
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

                    for (const tareaData of tareasData) {
                        await Tarea.create(tareaData)
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
                    where: { id_usuario: usuarioEncontrado.dataValues.id_usuario_fk_UE },
                    attributes: ['nombre_usuario', 'email_usuario']
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
                    await emailProyectoModificado({
                        email_usuario: datos.email_usuario,
                        nombre_integrante: datos.nombre_usuario,
                        email_creador: email_creador,
                        nombre_proyecto: proyectoEncontrado.dataValues.nombre_proyecto
                    })
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

export {
    verProyectos,
    verProyecto,
    crearProyecto,
    proporcionarDetalles,
    modificarProyecto
}
