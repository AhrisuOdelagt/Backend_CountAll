import { Table, Column, Model, DataType, ForeignKey, PrimaryKey, BelongsTo, Default } from 'sequelize-typescript';
import Usuario from './Usuario.model';
import Recompensa from './Recompensa.model';

@Table({
    tableName: 'usuario_recompensa'
})
class UsuarioRecompensa extends Model {
    @Default(DataType.NOW)
    @Column({
        type: DataType.DATE
    })
    fecha_obtencion: Date;

    @PrimaryKey
    @ForeignKey(() => Usuario)
    @Column({
        type: DataType.INTEGER
    })
    id_usuario_fk_UR: number;

    @PrimaryKey
    @ForeignKey(() => Recompensa)
    @Column({
        type: DataType.INTEGER
    })
    id_recompensa_fk_UR: number;

    @BelongsTo(() => Usuario)
    usuario: Usuario;

    @BelongsTo(() => Recompensa)
    recompensa: Recompensa;
}

export default UsuarioRecompensa;
