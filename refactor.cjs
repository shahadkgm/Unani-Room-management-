const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Ensure new directories exist
ensureDir(path.join(srcDir, 'backend'));
ensureDir(path.join(srcDir, 'frontend/store'));
ensureDir(path.join(srcDir, 'frontend/api'));
ensureDir(path.join(srcDir, 'shared'));

// Move functions
function move(src, dest) {
  const fullSrc = path.join(__dirname, src);
  const fullDest = path.join(__dirname, dest);
  if (fs.existsSync(fullSrc)) {
    fs.renameSync(fullSrc, fullDest);
    console.log(`Moved ${src} to ${dest}`);
  } else {
    console.warn(`Could not find ${src}`);
  }
}

function copyAndRemove(src, dest) {
  const fullSrc = path.join(__dirname, src);
  const fullDest = path.join(__dirname, dest);
  if (fs.existsSync(fullSrc)) {
    fs.cpSync(fullSrc, fullDest, { recursive: true });
    console.log(`Copied ${src} to ${dest}`);
    try {
      fs.rmSync(fullSrc, { recursive: true, force: true });
      console.log(`Removed ${src}`);
    } catch(e) {
      console.warn(`Could not remove ${src} (might be locked by IDE). Please close the files and delete manually later.`);
    }
  } else {
    console.warn(`Could not find ${src}`);
  }
}

// 1. Move backend files
move('src/lib/db.ts', 'src/backend/db.ts');
move('src/lib/hospital/seed.ts', 'src/backend/seed.ts');
move('src/lib/hospital/controllers', 'src/backend/controllers');
move('src/lib/hospital/services', 'src/backend/services');
move('src/lib/hospital/repositories', 'src/backend/repositories');

// 2. Move shared files
move('src/lib/hospital/types.ts', 'src/shared/types.ts');
move('src/lib/hospital/dates.ts', 'src/shared/dates.ts');

// 3. Move frontend files
move('src/lib/hospital/store.tsx', 'src/frontend/store/hospitalStore.tsx');
move('src/lib/hospital/serverFunctions.ts', 'src/frontend/api/index.ts');

copyAndRemove('src/components', 'src/frontend/components');

// 4. Update imports in all .ts and .tsx files
function getAllFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    // Ignore the old locked src/components so we don't double replace
    if (filePath === path.join(__dirname, 'src', 'components')) continue;
    
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllFiles(filePath, files);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      files.push(filePath);
    }
  }
  return files;
}

const allFiles = getAllFiles(srcDir);

// Mapping of old paths (in regex or exact) to new paths
const replacements = [
  { search: /@\/components\//g, replace: "@/frontend/components/" },
  { search: /@\/lib\/hospital\/store/g, replace: "@/frontend/store/hospitalStore" },
  { search: /@\/lib\/hospital\/serverFunctions/g, replace: "@/frontend/api" },
  { search: /@\/lib\/hospital\/types/g, replace: "@/shared/types" },
  { search: /@\/lib\/hospital\/dates/g, replace: "@/shared/dates" },
  { search: /@\/lib\/hospital\/seed/g, replace: "@/backend/seed" },
  { search: /@\/lib\/hospital\/controllers/g, replace: "@/backend/controllers" },
  { search: /@\/lib\/hospital\/services/g, replace: "@/backend/services" },
  { search: /@\/lib\/hospital\/repositories/g, replace: "@/backend/repositories" },
  { search: /@\/lib\/db/g, replace: "@/backend/db" },
  
  // Handle relative imports
  { search: /"\.\.\/\.\.\/db"/g, replace: "\"@/backend/db\"" },
  { search: /"\.\.\/db"/g, replace: "\"@/backend/db\"" },
  { search: /"\.\.\/types"/g, replace: "\"@/shared/types\"" },
  { search: /"\.\.\/seed"/g, replace: "\"@/backend/seed\"" },
  { search: /"\.\/serverFunctions"/g, replace: "\"@/frontend/api\"" },
  { search: /"\.\/types"/g, replace: "\"@/shared/types\"" },
  { search: /"\.\/seed"/g, replace: "\"@/backend/seed\"" },
  { search: /"\.\/dates"/g, replace: "\"@/shared/dates\"" },
  { search: /"\.\/controllers\/HospitalController"/g, replace: "\"@/backend/controllers/HospitalController\"" },
  { search: /"\.\/controllers\/UserController"/g, replace: "\"@/backend/controllers/UserController\"" },
  
  { search: /'\.\.\/\.\.\/db'/g, replace: "'@/backend/db'" },
  { search: /'\.\.\/db'/g, replace: "'@/backend/db'" },
  { search: /'\.\.\/types'/g, replace: "'@/shared/types'" },
  { search: /'\.\.\/seed'/g, replace: "'@/backend/seed'" },
  { search: /'\.\/serverFunctions'/g, replace: "'@/frontend/api'" },
  { search: /'\.\/types'/g, replace: "'@/shared/types'" },
  { search: /'\.\/seed'/g, replace: "'@/backend/seed'" },
  { search: /'\.\/dates'/g, replace: "'@/shared/dates'" },
  
  // Specific relative ones inside components or routes
  { search: /"\.\.\/lib\/lovable-error-reporting"/g, replace: "\"@/lib/lovable-error-reporting\"" }
];

let filesUpdated = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  for (const { search, replace } of replacements) {
    content = content.replace(search, replace);
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    filesUpdated++;
  }
}

console.log(`Updated imports in ${filesUpdated} files.`);
