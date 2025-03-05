import { check, validationResult } from 'express-validator'
import Riesgo from '../models/Riesgo.model'
import Proyecto from '../models/Proyecto.model'

const crearRiesgo = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('nombre_riesgo').notEmpty().withMessage('Nombre de riesgo vacío').run(req)
    await check('descr_riesgo').notEmpty().withMessage('Descripción de riesgo vacía').run(req)
    await check('prob_riesgo').notEmpty().withMessage('Probabilidad de riesgo vacía').isNumeric().withMessage('La probabilidad debe ser un número').run(req)

    // Manejo de errores
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // Agregamos el riesgo al proyecto
    const { nombre_proyecto } = req.params
    const proyectoEncontrado = await Proyecto.findOne({
        where: { nombre_proyecto },
    })
    if (!proyectoEncontrado) {
        return res.status(500).json({ error: 'El proyecto no existe' })
    }
    try {
        // Creamos el riesgo y lo asociamos al proyecto
        const datosRiesgo = {
            nombre_riesgo: req.body.nombre_riesgo,
            descr_riesgo: req.body.descr_riesgo,
            prob_riesgo: req.body.prob_riesgo,
            id_riesgo_fk_proyecto: proyectoEncontrado.dataValues.id_proyecto
        }
        await Riesgo.create(datosRiesgo)

        // Enviar respuesta exitosa
        res.json({
            msg: 'Se ha asociado el riesgo al proyecto'
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al crear el riesgo' })
    }

}

const modificarRiesgo = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('nombre_riesgo').notEmpty().withMessage('Nombre de riesgo vacío').run(req)
    await check('descr_riesgo').notEmpty().withMessage('Descripción de riesgo vacía').run(req)
    await check('prob_riesgo').notEmpty().withMessage('Probabilidad de riesgo vacía').isNumeric().withMessage('La probabilidad debe ser un número').run(req)

    // Manejo de errores
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // Modificamos el riesgo
    const { id_riesgo } = req.params
    const { nombre_riesgo, descr_riesgo, prob_riesgo } = req.body
    const riesgoEncontrado = await Riesgo.findOne({
        where: { id_riesgo },
    })
    if (!riesgoEncontrado) {
        return res.status(500).json({ error: 'El riesgo no existe' })
    }
    try {
        await Riesgo.update(
            {
                nombre_riesgo,
                descr_riesgo,
                prob_riesgo,
            },
            { where: { id_riesgo } }
        )

        // Enviar respuesta exitosa
        res.json({
            msg: 'Se ha modificado el riesgo'
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al modificar el riesgo' })
    }
}

const eliminarRiesgo = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Eliminamos el riesgo
    const { id_riesgo } = req.params
    const riesgoEncontrado = await Riesgo.findOne({
        where: { id_riesgo },
    })
    if (!riesgoEncontrado) {
        return res.status(500).json({ error: 'El riesgo no existe' })
    }
    try {
        await riesgoEncontrado.destroy()

        // Enviar respuesta exitosa
        res.json({
            msg: 'Se ha eliminado el riesgo'
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al eliminar el riesgo' })
    }
}

export {
    crearRiesgo,
    modificarRiesgo,
    eliminarRiesgo
}