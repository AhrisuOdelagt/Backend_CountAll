import { Request, Response } from 'express';
import UsuarioRecompensa from '../models/UsuarioRecompensa.model';
import Recompensa from '../models/Recompensa.model';
import Usuario from '../models/Usuario.model';

export const obtenerRecompensas = async (req: Request, res: Response) => {
    try {
        const recompensas = await Recompensa.findAll();
        res.status(200).json(recompensas);
    } catch (error) {
        console.error('Error obteniendo recompensas:', error);
        res.status(500).json({ error: 'Error obteniendo recompensas' });
    }
};

export const otorgarRecompensa = async (req: Request, res: Response) => {
    const { id_usuario, id_recompensa } = req.body;

    try {
        const usuario = await Usuario.findByPk(id_usuario);
        const recompensa = await Recompensa.findByPk(id_recompensa);

        if (!usuario || !recompensa) {
            return res.status(404).json({ error: 'Usuario o recompensa no encontrados' });
        }

        await UsuarioRecompensa.create({
            id_usuario_fk_UR: id_usuario,
            id_recompensa_fk_UR: id_recompensa,
            fecha_obtencion: new Date()
        });

        res.status(200).json({ msg: 'Recompensa otorgada exitosamente' });
    } catch (error) {
        console.error('Error otorgando recompensa:', error);
        res.status(500).json({ error: 'Error otorgando recompensa' });
    }
};



export const cambiarAvatar = async (req: Request, res: Response) => {
    const { id_usuario, id_recompensa } = req.body;

    try {
        // Buscar usuario
        const usuario = await Usuario.findByPk(id_usuario);
        
        // Buscar recompensa
        const recompensa = await Recompensa.findByPk(id_recompensa);

        // Log para debug
        console.log('Datos de la recompensa:', recompensa?.toJSON());

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (!recompensa) {
            return res.status(404).json({ error: 'Recompensa no encontrada' });
        }

        // Verificar si el usuario tiene la recompensa
        const usuarioRecompensa = await UsuarioRecompensa.findOne({
            where: {
                id_usuario_fk_UR: id_usuario,
                id_recompensa_fk_UR: id_recompensa
            }
        });

        if (!usuarioRecompensa) {
            return res.status(400).json({ error: 'El usuario no posee esta recompensa' });
        }

        // Verificar que la recompensa tenga una URL de avatar (modificado)
        if (!recompensa.getDataValue('url_avatar')) {
            return res.status(400).json({ 
                error: 'La recompensa no tiene una URL de avatar válida',
                recompensa_id: id_recompensa,
                url_actual: recompensa.getDataValue('url_avatar')
            });
        }

        const nuevaUrl = recompensa.getDataValue('url_avatar');
        
        // Actualizar el avatar del usuario
        await usuario.update({ url_avatar: nuevaUrl });

        res.status(200).json({ 
            msg: 'Avatar cambiado exitosamente',
            nuevo_avatar: nuevaUrl
        });
    } catch (error) {
        console.error('Error cambiando avatar:', error);
        res.status(500).json({ error: 'Error cambiando avatar' });
    }
};