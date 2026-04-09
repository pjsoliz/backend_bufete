const bcrypt = require('bcrypt');

const password = process.argv[2] || '123456';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  console.log('='.repeat(40));
  console.log(`Password original: ${password}`);
  console.log(`Hash generado para SQL: ${hash}`);
  console.log('='.repeat(40));
  console.log(`\nCopia y pega este hash en tu columna 'password' de PGAdmin.`);
});
