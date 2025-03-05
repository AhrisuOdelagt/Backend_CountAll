import { Table, Column, Model, DataType, HasMany, ForeignKey, BelongsToMany, Default } from 'sequelize-typescript';
import Etapa from './Etapa.model';
import Equipo from './Equipo.model';
import EquipoProyecto from './EquipoProyecto.model';
import Usuario from './Usuario.model';
import Riesgo from './Riesgo.model';
import Estimacion from './Estimacion.model';

@Table({
    tableName: 'proyecto'
})
class Proyecto extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    id_proyecto: number;

    @Column({
        type: DataType.STRING(256),
        unique: true,
        allowNull: false
    })
    nombre_proyecto: string;

    @Column({
        type: DataType.STRING(256)
    })
    descr_proyecto: string;

    @Default(DataType.NOW)
    @Column({
        type: DataType.DATE
    })
    fecha_inicio_proyecto: Date;

    @Default(DataType.NOW)
    @Column({
        type: DataType.DATE
    })
    fecha_fin_proyecto: Date;

    @Default('')
    @Column({
        type: DataType.STRING(256)
    })
    estado_proyecto: string;

    @Default('Scrum')
    @Column({
        type: DataType.STRING(256)
    })
    metodologia_proyecto: string;

    @Default(5)
    @Column({
        type: DataType.INTEGER
    })
    numero_etapas_proyecto: number;

    @ForeignKey(() => Usuario)
    @Column({
        type: DataType.INTEGER
    })
    id_usuario_fk_proyecto: number;

    @HasMany(() => Etapa)
    etapas: Etapa[];

    @HasMany(() => Riesgo)
    riesgos: Riesgo[];

    @HasMany(() => Estimacion)
    estimaciones: Estimacion[];

    @BelongsToMany(() => Equipo, () => EquipoProyecto)
    equipos: Equipo[];
}

export default Proyecto;
