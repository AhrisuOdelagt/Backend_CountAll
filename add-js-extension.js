import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist'); // Ajusta la ruta si es necesario

console.log('📂 Procesando archivos en:', distDir);


function addJsExtensionToImports(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');

  const updatedContent = fileContent.replace(/from\s+['"]([^'"]+)['"]/g, (match, importPath) => {
    // Solo modificar importaciones relativas (./ o ../)
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      if (!importPath.endsWith('.js')) {
        return `from '${importPath}.js'`;
      }
    }
    return match;
  });

  fs.writeFileSync(filePath, updatedContent, 'utf8');
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.js')) {
      addJsExtensionToImports(fullPath);
    }
  });
}

processDirectory(distDir);
console.log('✅ Extensiones .js añadidas solo a importaciones relativas.');
