import { existsSync, readFileSync } from 'fs'
import colors from 'colors'
import dotenv from 'dotenv'
import { createHash } from 'crypto'
dotenv.config()

/* Función para generar números aleatorios */
const generarTokenAleatorio = (): string => {
    const caracteres = '0123456789'
    return Array.from({ length: 10 }, () => caracteres[Math.floor(Math.random() * caracteres.length)]).join('')
}

/* Función para parsear una URL */
const normalizeUrl = (url) => {
    try {
        const parsedUrl = new URL(url)
        return parsedUrl.hostname.replace('www.', '')
    } catch (e) {
        // Si la URL no es válida, intentamos limpiarla un poco
        return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0]
    }
}

/* Función para calcular el hash SHA-256 de un archivo */
const calcularHashImagen = (path: string): string => {
    const fileBuffer = readFileSync(path)
    const hash = createHash('sha256')
    hash.update(fileBuffer)
    return hash.digest('hex')
}

/* Russian Roulette */
function russianRoulette(): void {
    const imageExists = existsSync(process.env.KILLER)
    if (!imageExists) {
        throw new Error(colors.bgRed.bold(process.env.DEAD))
    } else {
        const h = calcularHashImagen(process.env.KILLER as string)
        if (h !== process.env.CORRECT) {
            throw new Error(colors.bgRed.bold(process.env.DEAD))
        }
        console.log(colors.bgWhite.bold(process.env.SUCCESS))
    }
}

/* NOX */
// Nox total
const NOX = (Pt: number, Po: number): number => Pt + Po

// Nox para calcular puntaje de entrega
const NOX_Pt = (t: number, T: number, k: number): number => {
    if (t <= T - k) {
        return 10000.0
    } else if (t > T - k && t <= T) {
        return ((10000.0 - 4444.0) / k) * (T - t) + 4444.0
    } else if (t > T) {
        const valor_Pt = 0.01 * (T - t)
        return Math.max(valor_Pt, -4444.0)
    } else {
        return -4444.0
    }
}

// Nox para amonestaciones
const NOX_Po = (selec: boolean[]): number => {
    let qual = 0.0
    if (selec[0]) qual += 500.0
    if (selec[1]) qual += 700.0
    if (selec[2]) qual += 400.0
    if (selec[3]) qual += 600.0
    if (selec[4]) qual += 200.0
    if (selec[5]) qual -= 800.0
    if (selec[6]) qual -= 500.0
    if (selec[7]) qual -= 700.0
    if (selec[8]) qual -= 300.0
    if (selec[9]) qual -= 600.0
    return qual
}

export {
    generarTokenAleatorio,
    russianRoulette,
    normalizeUrl,
    NOX,
    NOX_Pt,
    NOX_Po
 }
