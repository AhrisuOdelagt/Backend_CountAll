import { Request, Response } from 'express';
import UsuarioEquipo from '../models/UsuarioEquipo.model';
import Usuario from '../models/Usuario.model';

export const obtenerClasificaciones = async (req: Request, res: Response) => {
    try {
        const clasificaciones = await UsuarioEquipo.findAll({
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