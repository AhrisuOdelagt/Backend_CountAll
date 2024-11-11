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

export const otorgarRecompensa = async (req, res) => {
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

export const cambiarAvatar = async (req, res) => {
    const { id_usuario, id_recompensa } = req.body;

    try {
        const usuario = await Usuario.findByPk(id_usuario);
        const recompensa = await Recompensa.findByPk(id_recompensa);

        if (!usuario || !recompensa) {
            return res.status(404).json({ error: 'Usuario o recompensa no encontrados' });
        }

        const usuarioRecompensa = await UsuarioRecompensa.findOne({
            where: {
                id_usuario_fk_UR: id_usuario,
                id_recompensa_fk_UR: id_recompensa
            }
        });

        if (!usuarioRecompensa) {
            return res.status(400).json({ error: 'El usuario no posee esta recompensa' });
        }

        const avatarUrl = recompensa.url_avatar || 'src/assets/img/avatars/A1.jpg'; // Usar imagen por defecto si no hay URL

        await Usuario.update(
            { url_avatar: avatarUrl },
            { where: { id_usuario } }
        );

        res.status(200).json({ msg: 'Avatar cambiado exitosamente' });
    } catch (error) {
        console.error('Error cambiando avatar:', error);
        res.status(500).json({ error: 'Error cambiando avatar' });
    }
};