import { check, validationResult } from 'express-validator'
import PaginaWeb from '../models/PaginaWeb.model'
import PaginaBloqueada from '../models/PaginaBloqueada.model'
import Equipo from '../models/Equipo.model'
import UsuarioEquipo from '../models/UsuarioEquipo.model'
import { normalizeUrl } from '../helpers/functions'

const verPaginasBloqueadas = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Regresamos las páginas bloqueadas del usuario
    try {
        const bloqueadas = await PaginaBloqueada.findAll({
            where: { id_usuario_fk_bloqueo: usuario.dataValues.id_usuario }
        })
        const datosPaginas = []
        if (bloqueadas) {
            for (const pagina of bloqueadas) {
                const datoPagina = await PaginaWeb.findOne({
                    where: { id_pagina: pagina.dataValues.id_pagina_fk_bloqueo }
                })
                const datosPagina = {
                    id_pagina: datoPagina.dataValues.id_pagina,
                    nivel_bloqueo: pagina.dataValues.nivel_bloqueo,
                    nombre_pagina: datoPagina.dataValues.nombre_pagina,
                    descr_pagina: datoPagina.dataValues.descr_pagina,
                    url_pagina: datoPagina.dataValues.url_pagina
                }
                datosPaginas.push(datosPagina)
            }
        }

        // Enviar páginas bloqueadas del usuario
        res.json({
            paginas_bloqueadas: datosPaginas
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al mostrar las páginas bloqueadas' })
    }
}

const bloquearPagina = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('nombre_pagina').notEmpty().withMessage('Nombre de página web vacío').run(req)
    await check('descr_pagina').notEmpty().withMessage('Descripción de página web vacía').run(req)
    await check('url_pagina').notEmpty().withMessage('URL de página web vacía').run(req)

    // Manejo de errores
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // Normalizamos la URL antes de usarla
    const urlNormalizada = normalizeUrl(req.body.url_pagina)

    // Revisamos si la página ya está en la Base para decidir qué hacer
    const existePagina = await PaginaWeb.findOne({
        where: { url_pagina: urlNormalizada }
    })

    if (!existePagina) {
        // Registramos la página web y la bloqueamos
        try {
            const datosPagina = {
                nombre_pagina: req.body.nombre_pagina,
                descr_pagina: req.body.descr_pagina,
                url_pagina: urlNormalizada // Asignamos la URL normalizada
            }
            const paginaWeb = await PaginaWeb.create(datosPagina)

            // Bloqueamos la página para el usuario
            const datosPaginaBloqueada = {
                nivel_bloqueo: 0,
                id_usuario_fk_bloqueo: usuario.dataValues.id_usuario,
                id_pagina_fk_bloqueo: paginaWeb.dataValues.id_pagina
            }
            await PaginaBloqueada.create(datosPaginaBloqueada)

            // Enviar respuesta exitosa
            res.json({
                msg: 'Se ha bloqueado la página web'
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Error al registrar y bloquear la página web' })
        }
    } else {
        // Revisamos si ya está bloqueada
        const estaBloqueada = await PaginaBloqueada.findOne({
            where: {
                id_usuario_fk_bloqueo: usuario.dataValues.id_usuario,
                id_pagina_fk_bloqueo: existePagina.dataValues.id_pagina,
                nivel_bloqueo: 0
            }
        })
        if (estaBloqueada) {
            return res.status(500).json({ error: 'Esta página ya está bloqueada' })
        }
        // Bloqueamos la página
        try {
            // Bloqueamos la página para el usuario
            const datosPaginaBloqueada = {
                nivel_bloqueo: 0,
                id_usuario_fk_bloqueo: usuario.dataValues.id_usuario,
                id_pagina_fk_bloqueo: existePagina.dataValues.id_pagina
            }
            await PaginaBloqueada.create(datosPaginaBloqueada)

            // Enviar respuesta exitosa
            res.json({
                msg: 'Se ha bloqueado la página web'
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Error al bloquear la página web' })
        }
    }
}

const desbloquearPagina = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Desbloqueamos la página al usuario
    const { id_pagina } = req.params
    const urlNormalizada = normalizeUrl(id_pagina)

    // Buscamos la página por URL normalizada
    const pagina = await PaginaWeb.findOne({
        where: { url_pagina: urlNormalizada }
    })

    if (!pagina) {
        return res.status(500).json({ error: 'La página no existe' })
    }

    // Revisamos si ya está desbloqueada
    const estaBloqueada = await PaginaBloqueada.findOne({
        where: {
            id_usuario_fk_bloqueo: usuario.dataValues.id_usuario,
            id_pagina_fk_bloqueo: pagina.dataValues.id_pagina,
            nivel_bloqueo: 0
        }
    })
    if (!estaBloqueada) {
        return res.status(500).json({ error: 'Esta página ya está desbloqueada' })
    }
    try {
        await PaginaBloqueada.destroy({
            where: {
                id_usuario_fk_bloqueo: usuario.dataValues.id_usuario,
                id_pagina_fk_bloqueo: pagina.dataValues.id_pagina
            }
        })

        // Enviar respuesta exitosa
        res.json({
            msg: 'Se ha desbloqueado la página web'
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al desbloquear la página web' })
    }
}

const bloquearPaginaEquipo = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario;
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' });
    }

    // Validación de la integridad de los datos
    await check('nombre_pagina').notEmpty().withMessage('Nombre de página web vacío').run(req);
    await check('descr_pagina').notEmpty().withMessage('Descripción de página web vacía').run(req);
    await check('url_pagina').notEmpty().withMessage('URL de página web vacía').run(req);

    // Manejo de errores
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Normalizamos la URL antes de usarla
    const urlNormalizada = normalizeUrl(req.body.url_pagina);

    // Revisamos si la página ya está en la Base para decidir qué hacer
    const { id_equipo } = req.params;
    const existePagina = await PaginaWeb.findOne({
        where: { url_pagina: urlNormalizada }  // Usamos la URL normalizada
    });

    if (!existePagina) {
        // Registramos la página web y la bloqueamos
        try {
            const datosPagina = {
                nombre_pagina: req.body.nombre_pagina,
                descr_pagina: req.body.descr_pagina,
                url_pagina: urlNormalizada // Asignamos la URL normalizada
            };
            const paginaWeb = await PaginaWeb.create(datosPagina);

            // Buscamos al equipo para bloquear la página con todos los usuarios
            const equipoEncontrado = await Equipo.findOne({
                where: { id_equipo: id_equipo }
            });
            if (!equipoEncontrado) {
                return res.status(500).json({ error: 'Este equipo no existe' });
            }

            // Buscamos a los usuarios del equipo
            const UE = await UsuarioEquipo.findAll({
                where: { id_equipo_fk_UE: id_equipo }
            });

            // Bloqueamos la página para todos los usuarios
            for (const usuarioUE of UE) {
                const datosPaginaBloqueada = {
                    nivel_bloqueo: 1,
                    id_usuario_fk_bloqueo: usuarioUE.dataValues.id_usuario_fk_UE,
                    id_pagina_fk_bloqueo: paginaWeb.dataValues.id_pagina
                };
                await PaginaBloqueada.create(datosPaginaBloqueada);
            }

            // Enviar respuesta exitosa
            res.json({
                msg: 'Se ha bloqueado la página web para todo el equipo'
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Error al registrar y bloquear la página web para todo el equipo' });
        }
    } else {
        // Revisamos si ya está bloqueada
        const estaBloqueada = await PaginaBloqueada.findOne({
            where: {
                id_usuario_fk_bloqueo: usuario.dataValues.id_usuario,
                id_pagina_fk_bloqueo: existePagina.dataValues.id_pagina,
                nivel_bloqueo: 1
            }
        });
        if (estaBloqueada) {
            return res.status(500).json({ error: 'Esta página ya está bloqueada para el equipo' });
        }

        // Bloqueamos la página
        try {
            // Buscamos al equipo para bloquear la página con todos los usuarios
            const equipoEncontrado = await Equipo.findOne({
                where: { id_equipo: id_equipo }
            });
            if (!equipoEncontrado) {
                return res.status(500).json({ error: 'Este equipo no existe' });
            }

            // Buscamos a los usuarios del equipo
            const UE = await UsuarioEquipo.findAll({
                where: { id_equipo_fk_UE: id_equipo }
            });

            // Bloqueamos la página para todos los usuarios
            for (const usuarioUE of UE) {
                const datosPaginaBloqueada = {
                    nivel_bloqueo: 1,
                    id_usuario_fk_bloqueo: usuarioUE.dataValues.id_usuario_fk_UE,
                    id_pagina_fk_bloqueo: existePagina.dataValues.id_pagina
                };
                await PaginaBloqueada.create(datosPaginaBloqueada);
            }

            // Enviar respuesta exitosa
            res.json({
                msg: 'Se ha bloqueado la página web para el equipo'
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Error al bloquear la página web' });
        }
    }
};

const desbloquearPaginaEquipo = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario;
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' });
    }

    // Desbloqueamos la página para el equipo
    const { id_equipo, id_pagina } = req.params;
    const urlNormalizada = normalizeUrl(id_pagina);

    // Buscamos la página por URL normalizada
    const pagina = await PaginaWeb.findOne({
        where: { url_pagina: urlNormalizada }
    });

    if (!pagina) {
        return res.status(500).json({ error: 'La página no existe' });
    }

    // Revisamos si ya está desbloqueada
    const estaBloqueada = await PaginaBloqueada.findOne({
        where: {
            id_usuario_fk_bloqueo: usuario.dataValues.id_usuario,
            id_pagina_fk_bloqueo: pagina.dataValues.id_pagina,
            nivel_bloqueo: 1
        }
    });
    if (!estaBloqueada) {
        return res.status(500).json({ error: 'Esta página ya está desbloqueada para el equipo' });
    }
    try {
        // Buscamos al equipo para desbloquear la página con todos los usuarios
        const equipoEncontrado = await Equipo.findOne({
            where: { id_equipo: id_equipo }
        });
        if (!equipoEncontrado) {
            return res.status(500).json({ error: 'Este equipo no existe' });
        }
        // Buscamos a los usuarios del equipo
        const UE = await UsuarioEquipo.findAll({
            where: { id_equipo_fk_UE: id_equipo }
        });
        // Desbloqueamos la página para todos los usuarios
        for (const usuarioUE of UE) {
            await PaginaBloqueada.destroy({
                where: {
                    id_usuario_fk_bloqueo: usuarioUE.dataValues.id_usuario_fk_UE,
                    id_pagina_fk_bloqueo: pagina.dataValues.id_pagina
                }
            });
        }

        // Enviar respuesta exitosa
        res.json({
            msg: 'Se ha desbloqueado la página web para el equipo'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al desbloquear la página web para el equipo' });
    }
};

export {
    verPaginasBloqueadas,
    bloquearPagina,
    desbloquearPagina,
    bloquearPaginaEquipo,
    desbloquearPaginaEquipo
}
