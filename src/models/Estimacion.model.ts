import { Table, Column, Model, DataType, ForeignKey, Default } from 'sequelize-typescript';
import Proyecto from './Proyecto.model';

@Table({
    tableName: 'estimacion'
})
class Estimacion extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    id_estimacion: number;

    @Column({
        type: DataType.INTEGER
    })
    entradas_externas: number;

    @Column({
        type: DataType.INTEGER
    })
    salidas_externas: number;

    @Column({
        type: DataType.INTEGER
    })
    peticiones: number;

    @Column({
        type: DataType.INTEGER
    })
    archivos_logicos: number;

    @Column({
        type: DataType.INTEGER
    })
    archivos_interfaz: number;

    @Column({
        type: DataType.INTEGER
    })
    puntos_funcion: number;

    @Column({
        type: DataType.STRING(256)
    })
    lenguaje_predominante: string;

    @Column({
        type: DataType.INTEGER
    })
    loc: number;

    @Column({
        type: DataType.STRING(256)
    })
    tipo_proyecto: string;

    @Column({
        type: DataType.INTEGER
    })
    personas_estimacion: number;

    @Column({
        type: DataType.INTEGER
    })
    tiempo_estimacion: number;

    @Column({
        type: DataType.FLOAT
    })
    precio_estimacion: number;

    @ForeignKey(() => Proyecto)
    @Column({
        type: DataType.INTEGER
    })
    id_estimacion_fk_proyecto: number;
}

export default Estimacion;
