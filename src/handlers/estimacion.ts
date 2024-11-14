import { check, validationResult, body } from 'express-validator'
import Estimacion from '../models/Estimacion.model'
import Proyecto from '../models/Proyecto.model'

const realizarCOCOMO = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Validación de la integridad de los datos
    await check('entradas_externas.cantidad').notEmpty().withMessage('Entradas externas vacías').isNumeric().run(req)
    await check('entradas_externas.parametro').isIn(['Simple', 'Medio', 'Complejo']).withMessage('Parámetro inválido en entradas externas').run(req)
    
    await check('salidas_externas.cantidad').notEmpty().withMessage('Salidas externas vacías').isNumeric().run(req)
    await check('salidas_externas.parametro').isIn(['Simple', 'Medio', 'Complejo']).withMessage('Parámetro inválido en salidas externas').run(req)

    await check('peticiones.cantidad').notEmpty().withMessage('Peticiones vacías').isNumeric().run(req)
    await check('peticiones.parametro').isIn(['Simple', 'Medio', 'Complejo']).withMessage('Parámetro inválido en peticiones').run(req)
    
    await check('archivos_logicos.cantidad').notEmpty().withMessage('Archivos lógicos vacíos').isNumeric().run(req)
    await check('archivos_logicos.parametro').isIn(['Simple', 'Medio', 'Complejo']).withMessage('Parámetro inválido en archivos lógicos').run(req)
    
    await check('archivos_interfaz.cantidad').notEmpty().withMessage('Archivos de interfaz vacíos').isNumeric().run(req)
    await check('archivos_interfaz.parametro').isIn(['Simple', 'Medio', 'Complejo']).withMessage('Parámetro inválido en archivos de interfaz').run(req)

    // Validación para el campo respuestas (solo enteros de 1 a 5)
    /* await body('respuestas').isArray({ min: 14, max: 14 }).withMessage('Debe haber exactamente 14 respuestas').run(req)
    for (let i = 0; i < 13; i++) {
        await check(`respuestas[${i}]`).isInt({ min: 0, max: 5 }).withMessage(`Respuesta ${i + 1} debe ser un entero entre 0 y 5`).run(req)
    }*/

    await check('lenguaje').notEmpty().withMessage('Lenguaje predominante vacío').run(req)

    // Manejo de errores
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    // Realizamos la estimación COCOMO
    const { nombre_proyecto } = req.params
    try {
        const { entradas_externas, salidas_externas, peticiones, archivos_logicos, archivos_interfaz, respuestas, lenguaje } = req.body

        /* Realizamos el conteo total */
        let conteo_total = 0
        // Entradas externas
        if (entradas_externas.parametro === 'Simple') {
            conteo_total += entradas_externas.cantidad * 3
        } else if (entradas_externas.parametro === 'Medio') {
            conteo_total += entradas_externas.cantidad * 4
        } else if (entradas_externas.parametro === 'Complejo') {
            conteo_total += entradas_externas.cantidad * 6
        }
        
        // Salidas externas
        if (salidas_externas.parametro === 'Simple') {
            conteo_total += salidas_externas.cantidad * 4
        } else if (salidas_externas.parametro === 'Medio') {
            conteo_total += salidas_externas.cantidad * 5
        } else if (salidas_externas.parametro === 'Complejo') {
            conteo_total += salidas_externas.cantidad * 7
        }

        // Peticiones
        if (peticiones.parametro === 'Simple') {
            conteo_total += peticiones.cantidad * 3
        } else if (peticiones.parametro === 'Medio') {
            conteo_total += peticiones.cantidad * 4
        } else if (peticiones.parametro === 'Complejo') {
            conteo_total += peticiones.cantidad * 6
        }

        // Archivos lógicos
        if (archivos_logicos.parametro === 'Simple') {
            conteo_total += archivos_logicos.cantidad * 7
        } else if (archivos_logicos.parametro === 'Medio') {
            conteo_total += archivos_logicos.cantidad * 10
        } else if (archivos_logicos.parametro === 'Complejo') {
            conteo_total += archivos_logicos.cantidad * 15
        }

        // Archivos de interfaz
        if (archivos_interfaz.parametro === 'Simple') {
            conteo_total += archivos_interfaz.cantidad * 5
        } else if (archivos_interfaz.parametro === 'Medio') {
            conteo_total += archivos_interfaz.cantidad * 7
        } else if (archivos_interfaz.parametro === 'Complejo') {
            conteo_total += archivos_interfaz.cantidad * 10
        }
        
        /* Calculamos fi */
        // Generamos un arreglo con las respuestas y lo sumamos
        let fi = (
            respuestas.r1 +
            respuestas.r2 +
            respuestas.r3 +
            respuestas.r4 +
            respuestas.r5 +
            respuestas.r6 +
            respuestas.r7 +
            respuestas.r8 +
            respuestas.r9 +
            respuestas.r10 +
            respuestas.r11 +
            respuestas.r12 +
            respuestas.r13 +
            respuestas.r14
        )

        /* Calculamos los puntos de función */
        const puntos_funcion = conteo_total * (0.65 + (0.01 * fi))

        /* Calculamos las LOC */
        let puntos_lenguaje = 0
        switch (lenguaje) {
            case 'Access': puntos_lenguaje = 35; break;
            case 'Ada': puntos_lenguaje = 154; break;
            case 'APS': puntos_lenguaje = 86; break;
            case 'ASP 69': puntos_lenguaje = 62; break;
            case 'Ensamblador': puntos_lenguaje = 337; break;
            case 'C': puntos_lenguaje = 162; break;
            case 'C++': puntos_lenguaje = 66; break;
            case 'Clipper': puntos_lenguaje = 38; break;
            case 'COBOL': puntos_lenguaje = 77; break;
            case 'Cool:Gen/IEF': puntos_lenguaje = 38; break;
            case 'Culprit': puntos_lenguaje = 51; break;
            case 'DBase IV': puntos_lenguaje = 52; break;
            case 'Easytrieve+': puntos_lenguaje = 33; break;
            case 'Excel/47': puntos_lenguaje = 46; break;
            case 'Focus': puntos_lenguaje = 43; break;
            case 'FORTRAN': puntos_lenguaje = 54; break;
            case 'FoxPro': puntos_lenguaje = 32; break;
            case 'Ideal': puntos_lenguaje = 66; break;
            case 'IEF/Cool:Gen': puntos_lenguaje = 38; break;
            case 'Informix': puntos_lenguaje = 42; break;
            case 'Java': puntos_lenguaje = 63; break;
            case 'JavaScript': puntos_lenguaje = 58; break;
            case 'JCL': puntos_lenguaje = 91; break;
            case 'JSP': puntos_lenguaje = 59; break;
            case 'Lotus Notes': puntos_lenguaje = 21; break;
            case 'Mantis': puntos_lenguaje = 71; break;
            case 'Mapper': puntos_lenguaje = 118; break;
            case 'Natural': puntos_lenguaje = 60; break;
            case 'Oracle': puntos_lenguaje = 30; break;
            case 'PeopleSoft': puntos_lenguaje = 33; break;
            case 'Perl': puntos_lenguaje = 60; break;
            case 'PL/1': puntos_lenguaje = 78; break;
            case 'Powerbuilder': puntos_lenguaje = 32; break;
            case 'REXX': puntos_lenguaje = 67; break;
            case 'RPG II/III': puntos_lenguaje = 61; break;
            case 'SAS': puntos_lenguaje = 40; break;
            case 'Smalltalk': puntos_lenguaje = 26; break;
            case 'SQL': puntos_lenguaje = 40; break;
            case 'VBScript36': puntos_lenguaje = 34; break;
            case 'Visual Basic': puntos_lenguaje = 47; break;
            default: 
                console.error("Lenguaje no reconocido")
                break
        }
        // Calculamos las loc
        const loc = puntos_funcion * puntos_lenguaje
        console.log(loc)

        /* Calculamos las personas/mes */
        // Definimos el tipo de proyecto
        let tipo_proyecto = ''
        if (loc <= 50000) {
            tipo_proyecto = 'Organico'
        }
        else if (loc > 50000 && loc <= 300000 ) {
            tipo_proyecto = 'Semiencajado'
        }
        else if (loc > 300000 ) {
            tipo_proyecto = 'Empotrado'
        }
        // Definimos cuál es el valor de Ab y Bb
        let Ab = 0
        let Bb = 0
        if (tipo_proyecto === 'Organico') {
            Ab = 2.4
            Bb = 1.05
        }
        else if (tipo_proyecto === 'Semiencajado') {
            Ab = 3.0
            Bb = 1.12
        }
        else if (tipo_proyecto === 'Empotrado') {
            Ab = 3.6
            Bb = 1.2
        }
        // Calculamos las personas/mes
        const KLDC = loc / 1000
        const E = Ab * (KLDC ** Bb)
        
        /* Estimación de la duración del proyecto en meses */
        const td = 2.5 * (E ** 0.35)

        /* Estimación del número de personas necesarias */
        const P = E / td

        /* Estimación del precio del proyecto */
        const PS = 20266 * td * P

        /* Guardamos la estimación en la BD y la asociamos al proyecto */
        const proyectoEncontrado = await Proyecto.findOne({
            where: { nombre_proyecto: nombre_proyecto }
        })
        const estimacionData = {
            entradas_externas: entradas_externas.cantidad,
            salidas_externas: salidas_externas.cantidad,
            peticiones: peticiones.cantidad,
            archivos_logicos: archivos_logicos.cantidad,
            archivos_interfaz: archivos_interfaz.cantidad,
            puntos_funcion: Math.round(puntos_funcion),
            lenguaje_predominante: lenguaje,
            loc: Math.round(loc),
            tipo_proyecto: tipo_proyecto,
            personas_estimacion: Math.round(P),
            tiempo_estimacion: Math.round(td),
            precio_estimacion: PS,
            id_estimacion_fk_proyecto: proyectoEncontrado.dataValues.id_proyecto
        }
        // Creamos la estimación o la actualizamos si es que existe
        const estimacionExistente = await Estimacion.findOne({ where: { id_estimacion_fk_proyecto: proyectoEncontrado.dataValues.id_proyecto } })
        if(estimacionExistente) {
            await Estimacion.update(estimacionData, { where: { id_estimacion_fk_proyecto: proyectoEncontrado.dataValues.id_proyecto } })
        }
        else {
            await Estimacion.create(estimacionData)
        }

        // Enviar respuesta exitosa
        res.json({
            msg: 'Se ha terminado la estimación COCOMO'
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al realizar la estimación COCOMO' })
    }
}

const verCOCOMO = async (req, res) => {
    // Verificamos una sesión iniciada
    const usuario = req.usuario
    if (!usuario) {
        return res.status(500).json({ error: 'No hay sesión iniciada' })
    }

    // Recuperamos información de la estimación
    const { id_estimacion } = req.params
    try {
        const estimacionEncontrada = await Estimacion.findOne({
            where: { id_estimacion: id_estimacion }
        })

        // Enviar estimación encontrada
        res.json({
            estimacion: estimacionEncontrada
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error al ver la estimación COCOMO' })
    }
}

export {
    realizarCOCOMO,
    verCOCOMO
}
