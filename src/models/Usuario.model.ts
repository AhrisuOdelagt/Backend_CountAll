import { Table, Column, Model, DataType, HasMany, Default } from 'sequelize-typescript';
import { generarTokenAleatorio } from '../helpers/functions'
import UsuarioEquipo from './UsuarioEquipo.model';
import UsuarioTarea from './UsuarioTarea.model';
import UsuarioRecompensa from './UsuarioRecompensa.model';
import Proyecto from './Proyecto.model';
import PaginaBloqueada from './PaginaBloqueada.model';

@Table({
    tableName: 'usuario'
})
class Usuario extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    id_usuario: number;

    @Column({
        type: DataType.STRING(256),
    })
    name_usuario: string;

    @Column({
        type: DataType.STRING(256)
    })
    surname_usuario: string;

    @Column({
        type: DataType.STRING(256),
        unique: true,
        allowNull: false
    })
    nombre_usuario: string;

    @Column({
        type: DataType.STRING(256),
        unique: true,
        allowNull: false
    })
    email_usuario: string;

    @Column({
        type: DataType.STRING(256)
    })
    password_usuario: string;

    @Default('Sin número telefónico')
    @Column({
        type: DataType.STRING(256)
    })
    numero_telefonico: string;

    @Default(generarTokenAleatorio)
    @Column({
        type: DataType.STRING(10)
    })
    token_usuario: string

    @Default(0)
    @Column({
        type: DataType.INTEGER
    })
    puntuacion_global: number

    @Default(false)
    @Column({
        type: DataType.BOOLEAN
    })
    is_confirmed: boolean

    @Column({
        type: DataType.STRING(256)
    })
    url_avatar: string;

    @HasMany(() => UsuarioEquipo)
    usuarioEquipos: UsuarioEquipo[];

    @HasMany(() => UsuarioTarea)
    usuarioTareas: UsuarioTarea[];

    @HasMany(() => UsuarioRecompensa)
    usuarioRecompensas: UsuarioRecompensa[];

    @HasMany(() => PaginaBloqueada)
    PaginaBloqueadas: PaginaBloqueada[];

    @HasMany(() => Proyecto)
    proyectos: Proyecto[];
}

export default Usuario;
