import { check, validationResult } from 'express-validator'
import Tarea from '../models/Tarea.model'
import EquipoProyecto from '../models/EquipoProyecto.model'
import Proyecto from '../models/Proyecto.model'
import Etapa from '../models/Etapa.model'
import Equipo from '../models/Equipo.model'
import UsuarioTareaEquipo from '../models/UsuarioTareaEquipo.model'
import UsuarioEquipo from '../models/UsuarioEquipo.model'
import Usuario from '../models/Usuario.model'

const verTareas = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario;
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' });
    }

    // Buscamos las tareas del usuario
    const { id_equipo } = req.params;
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

        // Devolvemos la lista de tareas
        res.json({
            tareas_equipo: tareasUnicas,
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al mostrar las tareas del equipo' });
    }
}

const verTarea = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario;
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' });
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
            return res.status(500).json({ error: 'La tarea no existe' });
        }

        // Devolvemos la información de la tarea
        res.json({
            tarea: tarea,
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al mostrar la tarea' });
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
        const fechaOptima = new Date(fechaInicio.getTime() + (fechaFin.getTime() - fechaInicio.getTime()) / 2)
        const fecha_optima_tarea = fechaOptima.toISOString()

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

}

const cambiarEstado = async (req, res) => {

}

const enviarTarea = async (req, res) => { // Borrar por simplicidad

}

const revisarTarea = async (req, res) => {

}

const desbloquearTarea = async (req, res) => {

}

const eliminarTarea = async (req, res) => {

}

export {
    verTareas,
    verTarea,
    asignarTarea,
    editarTarea,
    enviarTarea,
    revisarTarea,
    desbloquearTarea,
    eliminarTarea
}
