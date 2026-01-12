import { PrismaClient, Permission } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // ========================================
  // 1. CREATE PERMISSIONS
  // ========================================
  console.log('📝 Creating permissions...');

  const permissionsData = [
    // SAS System Management
    { name: 'sas.view', module: 'sas', description: 'View SAS systems' },
    { name: 'sas.create', module: 'sas', description: 'Create SAS systems' },
    { name: 'sas.update', module: 'sas', description: 'Update SAS systems' },
    { name: 'sas.delete', module: 'sas', description: 'Delete SAS systems' },
    { name: 'sas.manage', module: 'sas', description: 'Full SAS management' },

    // User Management
    { name: 'users.view', module: 'users', description: 'View users' },
    { name: 'users.create', module: 'users', description: 'Create users' },
    { name: 'users.update', module: 'users', description: 'Update users' },
    { name: 'users.delete', module: 'users', description: 'Delete users' },
    { name: 'users.manage', module: 'users', description: 'Full user management' },

    // Agent Management
    { name: 'agents.view', module: 'agents', description: 'View agents' },
    { name: 'agents.create', module: 'agents', description: 'Create agents' },
    { name: 'agents.update', module: 'agents', description: 'Update agents' },
    { name: 'agents.delete', module: 'agents', description: 'Delete agents' },
    { name: 'agents.manage', module: 'agents', description: 'Full agent management' },

    // Role Management
    { name: 'roles.view', module: 'roles', description: 'View roles' },
    { name: 'roles.create', module: 'roles', description: 'Create roles' },
    { name: 'roles.update', module: 'roles', description: 'Update roles' },
    { name: 'roles.delete', module: 'roles', description: 'Delete roles' },
    { name: 'roles.manage', module: 'roles', description: 'Full role management' },

    // Permission Management
    { name: 'permissions.view', module: 'permissions', description: 'View permissions' },
    { name: 'permissions.create', module: 'permissions', description: 'Create permissions' },
    { name: 'permissions.update', module: 'permissions', description: 'Update permissions' },
    { name: 'permissions.delete', module: 'permissions', description: 'Delete permissions' },
    { name: 'permissions.manage', module: 'permissions', description: 'Full permission management' },

    // Audit Logs
    { name: 'audit.view', module: 'audit', description: 'View audit logs' },
    { name: 'audit.export', module: 'audit', description: 'Export audit logs' },
    { name: 'audit.manage', module: 'audit', description: 'Full audit management' },

    // Wallet & Transactions
    { name: 'wallet.view', module: 'wallet', description: 'View wallet balances' },
    { name: 'wallet.topup', module: 'wallet', description: 'Top up wallet' },
    { name: 'transactions.view', module: 'transactions', description: 'View transactions' },
    { name: 'transactions.export', module: 'transactions', description: 'Export transactions' },

    // Payment Management
    { name: 'payment.create', module: 'payment', description: 'Create payment' },
    { name: 'payment.view', module: 'payment', description: 'View payment' },
    { name: 'payment.refund', module: 'payment', description: 'Refund payment' },
    { name: 'payment.cancel', module: 'payment', description: 'Cancel payment' },
    { name: 'payment.manage', module: 'payment', description: 'Full payment management' },

    // System Settings
    { name: 'settings.view', module: 'settings', description: 'View system settings' },
    { name: 'settings.update', module: 'settings', description: 'Update system settings' },

    // Dashboard & Reports
    { name: 'dashboard.view', module: 'dashboard', description: 'View dashboard' },
    { name: 'reports.view', module: 'reports', description: 'View reports' },
    { name: 'reports.generate', module: 'reports', description: 'Generate reports' },
  ];

  const createdPermissions: Permission[] = [];
  for (const permData of permissionsData) {
    const permission = await prisma.permission.upsert({
      where: { name: permData.name },
      update: {},
      create: permData,
    });
    createdPermissions.push(permission);
  }

  console.log(`✅ Created ${createdPermissions.length} permissions`);

  // ========================================
  // 2. CREATE ADMIN ROLE
  // ========================================
  console.log('👑 Creating admin role...');

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'System Administrator with full access to all features',
      isSystem: true, // System role cannot be deleted
    },
  });

  console.log(`✅ Admin role created: ${adminRole.name}`);

  // ========================================
  // 3. ASSIGN ALL PERMISSIONS TO ADMIN ROLE
  // ========================================
  console.log('🔐 Assigning all permissions to admin role...');

  let assignedCount = 0;
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
    assignedCount++;
  }

  console.log(`✅ Assigned ${assignedCount} permissions to admin role`);

  // ========================================
  // 4. CREATE ADMIN USER
  // ========================================
  console.log('👤 Creating admin user...');

  const hashedPassword = await bcrypt.hash('Admin@123456', 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@wifiagentsportal.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+1234567890',
      isActive: true,
    },
  });

  console.log(`✅ Admin user created: ${adminUser.username} (${adminUser.email})`);

  // ========================================
  // 5. ASSIGN ADMIN ROLE TO ADMIN USER
  // ========================================
  console.log('🔗 Assigning admin role to admin user...');

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log(`✅ Admin role assigned to admin user`);

  // ========================================
  // 6. CREATE ADDITIONAL ROLES (OPTIONAL)
  // ========================================
  console.log('📋 Creating additional roles...');

  // Manager Role
  const managerRole = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: {
      name: 'MANAGER',
      description: 'Manager with access to most features except system settings',
      isSystem: true,
    },
  });

  // Assign manager permissions (exclude system-critical permissions)
  const managerPermissions = createdPermissions.filter(
    (p) =>
      !p.name.includes('delete') &&
      !p.name.includes('settings') &&
      !p.name.includes('permissions'),
  );

  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log(`✅ Manager role created with ${managerPermissions.length} permissions`);

  // Support Role
  const supportRole = await prisma.role.upsert({
    where: { name: 'SUPPORT' },
    update: {},
    create: {
      name: 'SUPPORT',
      description: 'Support staff with read access and basic operations',
      isSystem: true,
    },
  });

  // Assign support permissions (only view permissions)
  const supportPermissions = createdPermissions.filter((p) => p.name.includes('view'));

  for (const permission of supportPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: supportRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: supportRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log(`✅ Support role created with ${supportPermissions.length} permissions`);

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   • Permissions created: ${createdPermissions.length}`);
  console.log(`   • Roles created: 3 (ADMIN, MANAGER, SUPPORT)`);
  console.log(`   • Admin user created: 1`);
  console.log('');
  console.log('🔑 Admin Credentials:');
  console.log('   Username: admin');
  console.log('   Email: admin@wifiagentsportal.com');
  console.log('   Password: Admin@123456');
  console.log('');
  console.log('⚠️  IMPORTANT: Change the admin password after first login!');
  console.log('═══════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
