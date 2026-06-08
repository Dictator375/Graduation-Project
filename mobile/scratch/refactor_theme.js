const fs = require('fs');
const path = require('path');

const ADMIN_DIR = path.join(__dirname, '../src/screens/admin');
const WORKER_DIR = path.join(__dirname, '../src/screens/worker');

const dirs = [ADMIN_DIR, WORKER_DIR];

const COLOR_MAP = {
  "'#0f1117'": 'c.bg',
  "'#1c2133'": 'c.card',
  "'rgba(255,255,255,0.07)'": 'c.border',
  "'#eef0f6'": 'c.text',
  "'#8b92a9'": 'c.sub',
  "'#555e7a'": 'c.muted',
  '"#0f1117"': 'c.bg',
  '"#1c2133"': 'c.card',
  '"rgba(255,255,255,0.07)"': 'c.border',
  '"#eef0f6"': 'c.text',
  '"#8b92a9"': 'c.sub',
  '"#555e7a"': 'c.muted',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip files that already use c.bg explicitly like Dashboard.js
  if (content.includes('c.bg') && content.includes('theme === \'light\'')) {
     console.log('Skipping', filePath);
     return;
  }

  let modified = false;

  // Replace colors in StyleSheet
  if (content.includes('const s = StyleSheet.create({')) {
    content = content.replace(/const s = StyleSheet\.create\({/, 'const getStyles = (c) => StyleSheet.create({');
    
    // Replace hardcoded colors in the whole file
    for (const [hex, variable] of Object.entries(COLOR_MAP)) {
      content = content.split(hex).join(variable);
    }

    // Add import
    if (!content.includes('getThemeColors')) {
      content = content.replace(/import { useAuth } from '\.\.\/\.\.\/context\/AuthContext';/, `import { useAuth } from '../../context/AuthContext';\nimport { getThemeColors } from '../../utils/theme';`);
    }

    // Add theme to useAuth
    if (content.match(/const\s*{\s*([^}]+)\s*}\s*=\s*useAuth\(\);/)) {
      content = content.replace(/const\s*{\s*([^}]+)\s*}\s*=\s*useAuth\(\);/, (match, p1) => {
        if (!p1.includes('theme')) {
          return `const { ${p1.trim()}, theme } = useAuth();`;
        }
        return match;
      });
    } else {
      console.log('useAuth not found in', filePath);
    }

    // Add const c and const s to component
    content = content.replace(/export default function (\w+)\(([^)]*)\) \{/, (match, p1, p2) => {
      return `export default function ${p1}(${p2}) {\n   const c = getThemeColors(theme || 'dark');\n   const s = getStyles(c);`;
    });

    // Also fix Status bar: <StatusBar backgroundColor="#1c2133" barStyle="light-content" />
    content = content.replace(/<StatusBar[^>]+>/, `<StatusBar backgroundColor={c.statusBar} barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />`);

    fs.writeFileSync(filePath, content, 'utf8');
    modified = true;
    console.log('Processed', filePath);
  }
}

dirs.forEach(dir => {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    if (f.endsWith('.js') && f !== 'menu.js' && f !== 'Dashboard.js' && f !== 'chat.js') {
      processFile(path.join(dir, f));
    }
  });
});
