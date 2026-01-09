import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Department from '../models/Department.js';

dotenv.config();

const defaultDepartments = [
  { name: 'Engineering', code: 'ENG', description: 'Software development and engineering' },
  { name: 'Marketing', code: 'MKT', description: 'Marketing and communications' },
  { name: 'Sales', code: 'SALES', description: 'Sales and business development' },
  { name: 'Human Resources', code: 'HR', description: 'Human resources and talent management' },
  { name: 'Finance', code: 'FIN', description: 'Finance and accounting' },
  { name: 'Operations', code: 'OPS', description: 'Operations and administration' },
  { name: 'Customer Support', code: 'CS', description: 'Customer service and support' },
  { name: 'Product', code: 'PROD', description: 'Product management and development' },
];

const seedDepartments = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    console.log('📦 Seeding departments...\n');

    let created = 0;
    let skipped = 0;

    for (const dept of defaultDepartments) {
      try {
        const existing = await Department.findOne({ name: dept.name });
        if (existing) {
          console.log(`⏭️  Skipped: ${dept.name} (already exists)`);
          skipped++;
          continue;
        }

        await Department.create({
          ...dept,
          status: 'active',
          employeeCount: 0,
          activeEmployeeCount: 0,
          createdAt: new Date(),
        });

        console.log(`✅ Created: ${dept.name} (${dept.code})`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating ${dept.name}:`, error.message);
      }
    }

    console.log(`\n✨ Seeding complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${defaultDepartments.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDepartments();

