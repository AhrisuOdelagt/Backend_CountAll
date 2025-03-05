import { Table, Column, Model, DataType, ForeignKey, PrimaryKey, BelongsTo, Default } from 'sequelize-typescript';
import Usuario from './Usuario.model';
import Tarea from './Tarea.model';
import Equipo from './Equipo.model';

@Table({
    tableName: 'usuario_tarea_equipo'
})
class UsuarioTareaEquipo extends Model {
    @Column({
        type: DataType.DATE
    })
    fecha_asignacion: Date;

    @Default(0)
    @Column({
        type: DataType.INTEGER
    })
    puntuacion_provisional: number;

    @PrimaryKey
    @ForeignKey(() => Usuario)
    @Column({
        type: DataType.INTEGER
    })
    id_usuario_fk_UTE: number;

    @PrimaryKey
    @ForeignKey(() => Tarea)
    @Column({
        type: DataType.INTEGER
    })
    id_tarea_fk_UTE: number;

    @PrimaryKey
    @ForeignKey(() => Equipo)
    @Column({
        type: DataType.INTEGER
    })
    id_equipo_fk_UTE: number;
}

export default UsuarioTareaEquipo;
