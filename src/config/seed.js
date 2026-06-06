require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { query } = require('./database');

const seed = async () => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await query(`
      INSERT INTO admins (username, password, role)
      VALUES ($1, $2, 'super_admin')
      ON CONFLICT (username) DO NOTHING
    `, ['admin', hashedPassword]);

    await query(`
      INSERT INTO payment_settings (upi_id, qr_code)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, ['admin@paisahipaida', null]);

    const demoPass = await bcrypt.hash('demo1234', 10);
    const users = [
      ['Rahul Sharma', 'rahul@test.com', '9876543210', demoPass, 'REF001'],
      ['Amit Kumar', 'amit@test.com', '9876543211', demoPass, 'REF002'],
      ['Suresh Patel', 'suresh@test.com', '9876543212', demoPass, 'REF003'],
    ];

    for (const [name, email, mobile, pass, ref] of users) {
      await query(`
        INSERT INTO users (full_name, email, mobile, password, referral_code, balance)
        VALUES ($1, $2, $3, $4, $5, floor(random() * 5000 + 500)::int)
        ON CONFLICT (email) DO NOTHING
      `, [name, email, mobile, pass, ref]);
    }

    console.log('Seed data created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seed();
