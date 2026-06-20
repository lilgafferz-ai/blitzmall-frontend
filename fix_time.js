const fs = require('fs');

function fixFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  c = c.replace(/toLocaleString\(\)/g, "toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })");
  c = c.replace(/toLocaleDateString\(\)/g, "toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })");
  c = c.replace(/toLocaleTimeString\(\)/g, "toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })");
  c = c.replace(/toLocaleTimeString\(\[\]/g, "toLocaleTimeString('en-KE'");
  fs.writeFileSync(filePath, c);
}

fixFile('src/Admin.jsx');
fixFile('src/App.jsx');
console.log('Fixed timezones');
