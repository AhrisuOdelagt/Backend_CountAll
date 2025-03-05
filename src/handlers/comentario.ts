import { check, validationResult } from 'express-validator'
import { Tarea, Usuario, Comentario }from '../indexmodels';

const verComentarios = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Mostramos los comentarios de la tarea
    const { id_tarea } = req.params
    try {
        // Encontramos la tarea
        const tareaEncontrada = await Tarea.findOne({
            where: { id_tarea }
        })
        if (!tareaEncontrada) {
            return res.status(500).json({ error: 'La tarea no existe' })
        }

        // Encontramos todos los comentarios relacionados
        const comentariosTarea = await Comentario.findAll({
            where: { id_tarea_fk_comentario: id_tarea }
        })

        // Conjuntamos la información
        const comentarios = []
        for (const comentario of comentariosTarea) {
            // Buscamos la información del usuario que comentó
            const usuarioEncontrado = await Usuario.findOne({
                where: { id_usuario: comentario.dataValues.id_usuario_fk_comentario }
            })
            const infoComentario = {
                contenido_comentario: comentario.dataValues.contenido_comentario,
                username: usuarioEncontrado.dataValues.nombre_usuario,
                url_avatar: usuarioEncontrado.dataValues.url_avatar
            }
            comentarios.push(infoComentario)
        }
        
        // Devolvemos la información
        res.json({
            comentarios_tarea: comentarios
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al ver los comentarios' })
    }
}

const escribirComentario = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('contenido_comentario').notEmpty().withMessage('Contenido del comentario vacío').run(req)

    // Manejo de errores
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // Escribimos el comentario
    const { id_tarea } = req.params
    try {
        // Encontramos la tarea
        const tareaEncontrada = await Tarea.findOne({
            where: { id_tarea }
        })
        if (!tareaEncontrada) {
            return res.status(500).json({ error: 'La tarea no existe' })
        }

        // Escribimos el comentario
        const datosComentario = {
            contenido_comentario: req.body.contenido_comentario,
            id_tarea_fk_comentario: id_tarea,
            id_usuario_fk_comentario: usuario.dataValues.id_usuario
        }
        await Comentario.create(datosComentario)

        // Incrementamos el número de comentarios en la tarea
        const comentariosActuales = tareaEncontrada.dataValues.comentarios_tarea + 1
        await Tarea.update(
            { comentarios_tarea: comentariosActuales },
            { where: { id_tarea } }
        )

        // Devolvemos mensaje de éxito
        res.json({
            msg: 'Se ha publicado el comentario'
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al escribir el comentario' })
    }
}

const modificarComentario  = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('contenido_comentario').notEmpty().withMessage('Contenido del comentario vacío').run(req)

    // Manejo de errores
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // Modificamos el comentario
    const { id_comentario } = req.params
    try {
        // Encontramos el comentario
        const comentarioEncontrado = await Comentario.findOne({
            where: { id_comentario }
        })
        if (!comentarioEncontrado) {
            return res.status(500).json({ error: 'El comentario no existe' })
        }

        // Modificamos el comentario
        await Comentario.update(
            { contenido_comentario: req.body.contenido_comentario },
            { where: { id_comentario }}
        )

        // Devolvemos mensaje de éxito
        res.json({
            msg: 'Se ha modificado el comentario'
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al modificar el comentario' })
    }
}

const borrarComentario  = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Eliminamos el comentario
    const { id_comentario } = req.params
    try {
        // Encontramos el comentario
        const comentarioEncontrado = await Comentario.findOne({
            where: { id_comentario }
        })
        if (!comentarioEncontrado) {
            return res.status(500).json({ error: 'El comentario no existe' })
        }

        // Encontramos la tarea asociada al comentario
        const tareaEncontrada = await Tarea.findOne({
            where: { id_tarea: comentarioEncontrado.dataValues.id_tarea_fk_comentario }
        })
        if (!tareaEncontrada) {
            return res.status(500).json({ error: 'La tarea no existe' })
        }

        // Eliminamos el comentario
        await Comentario.destroy({
            where: { id_comentario }
        })

        // Disminuimos el número de comentarios en la tarea
        const comentariosActuales = tareaEncontrada.dataValues.comentarios_tarea - 1
        await Tarea.update(
            { comentarios_tarea: comentariosActuales },
            { where: { id_tarea: tareaEncontrada.dataValues.id_tarea } }
        )

        // Devolvemos mensaje de éxito
        res.json({
            msg: 'Se ha eliminado el comentario'
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al eliminar el comentario' })
    }
}

export {
    verComentarios,
    escribirComentario,
    modificarComentario,
    borrarComentario
}
