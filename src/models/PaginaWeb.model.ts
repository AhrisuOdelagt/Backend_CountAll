import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import PaginaBloqueada from './PaginaBloqueada.model';

@Table({
    tableName: 'pagina_web'
})
class PaginaWeb extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    id_pagina: number;

    @Column({
        type: DataType.STRING(256)
    })
    nombre_pagina: string;

    @Column({
        type: DataType.STRING(256)
    })
    descr_pagina: string;

    @Column({
        type: DataType.STRING(256)
    })
    url_pagina: string;

    @HasMany(() => PaginaBloqueada)
    paginaBloqueadas: PaginaBloqueada[];
}

export default PaginaWeb;
