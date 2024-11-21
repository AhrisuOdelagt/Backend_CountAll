import { Table, Column, Model, DataType, ForeignKey, Default, PrimaryKey, BelongsTo } from 'sequelize-typescript';
import { generarTokenAleatorio } from '../helpers/functions';
import Usuario from './Usuario.model';
import Equipo from './Equipo.model';

function fechaFinConUnaSemana(): Date {
    const fechaActual = new Date();
    fechaActual.setDate(fechaActual.getDate() + 7);
    return fechaActual;
}

@Table({
    tableName: 'usuario_equipo'
})
class UsuarioEquipo extends Model {
    @Default(DataType.NOW)
    @Column({
        type: DataType.DATE
    })
    fecha_integracion_UE: Date;

    @Default('Miembro')
    @Column({
        type: DataType.STRING(256)
    })
    rol: string;

    @Default(0)
    @Column({
        type: DataType.INTEGER
    })
    puntuacion_local: number;

    @Default(0)
    @Column({
        type: DataType.INTEGER
    })
    tareas_asignadas: number;

    @Default(0)
    @Column({
        type: DataType.INTEGER
    })
    tareas_completadas: number;

    @Default(DataType.NOW)
    @Column({
        type: DataType.DATE
    })
    fecha_inicio_clas: Date;

    @Default(fechaFinConUnaSemana)
    @Column({
        type: DataType.DATE
    })
    fecha_fin_clas: Date;

    @Default(generarTokenAleatorio)
    @Column({
        type: DataType.STRING(10)
    })
    token_UE: string;

    @Default(false)
    @Column({
        type: DataType.BOOLEAN
    })
    is_confirmed_UE: boolean;

    @PrimaryKey
    @ForeignKey(() => Usuario)
    @Column({
        type: DataType.INTEGER
    })
    id_usuario_fk_UE: number;

    @PrimaryKey
    @ForeignKey(() => Equipo)
    @Column({
        type: DataType.INTEGER
    })
    id_equipo_fk_UE: number;

    @BelongsTo(() => Usuario)
    usuario: Usuario;

    @BelongsTo(() => Equipo)
    equipo: Equipo;
}

export default UsuarioEquipo;
