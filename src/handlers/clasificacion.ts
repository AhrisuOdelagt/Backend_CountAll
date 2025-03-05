import { Request, Response } from 'express';
import { UsuarioEquipo, Usuario }from '../indexmodels';

export const obtenerClasificaciones = async (req: Request, res: Response) => {
    const { id_equipo } = req.params;

    try {
        const clasificaciones = await UsuarioEquipo.findAll({
            where: { id_equipo_fk_UE: id_equipo },
            attributes: ['id_usuario_fk_UE', 'puntuacion_local', 'rol'],
            include: [{
                model: Usuario,
                attributes: ['id_usuario', 'nombre_usuario', 'url_avatar']
            }],
            order: [['puntuacion_local', 'DESC']]
        });

        res.status(200).json(clasificaciones);
    } catch (error) {
        console.error('Error fetching clasificaciones:', error);
        res.status(500).json({ error: 'Error fetching clasificaciones' });
    }
};