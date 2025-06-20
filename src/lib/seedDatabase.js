import { PrismaClient } from './prisma/generated/index.js';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    // Очистка БД
    await prisma.$transaction([
      prisma.apiKey.deleteMany(),
      prisma.form.deleteMany(),
      prisma.category.deleteMany(),
      prisma.formFieldCategory.deleteMany(),
      prisma.formAssignment.deleteMany(),
      prisma.formField.deleteMany(),
      prisma.formFieldGroup.deleteMany(),
      prisma.formResponse.deleteMany(),
      prisma.formResponseField.deleteMany(),
      prisma.formResponseGroupInstance.deleteMany(),
      prisma.organization.deleteMany(),
      prisma.teamMember.deleteMany(),
      prisma.account.deleteMany(),
      prisma.patient.deleteMany(),
      prisma.providerAssignment.deleteMany(),
    ]);

    const organization = await prisma.organization.create({
      data: {
        id: faker.string.uuid(),
        name: faker.company.name(),
        updatedAt: new Date(),
      },
    });

    const account = await prisma.account.create({
      data: {
        id: faker.string.uuid(),
        userId: faker.string.uuid(),
        fullName: faker.person.fullName(),
        email: faker.internet.email(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const patient = await prisma.patient.create({
      data: {
        id: faker.string.uuid(),
        organizationId: organization.id,
        patientAccountId: account.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const teamMember = await prisma.teamMember.create({
      data: {
        id: 1,
        organizationId: organization.id,
        accountId: account.id,
        role: 'provider',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.apiKey.create({
      data: {
        id: 1,
        keyHash: faker.string.alphanumeric(32),
        userId: account.id,
        description: faker.lorem.sentence(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const form = await prisma.form.create({
      data: {
        id: 1,
        createdBy: 1,
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        organizationId: organization.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const category = await prisma.category.create({
      data: {
        id: 1,
        formId: form.id,
        name: faker.lorem.word(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const formField = await prisma.formField.create({
      data: {
        id: 1,
        formId: form.id,
        label: faker.lorem.word(),
        type: 'text',
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.formFieldCategory.create({
      data: {
        formFieldId: formField.id,
        categoryId: category.id,
      },
    });

    await prisma.formAssignment.create({
      data: {
        id: 1,
        formId: form.id,
        patientId: patient.id,
        patientEmail: faker.internet.email(),
        createdAt: new Date(),
        updatedAt: new Date(),
        dueDate: faker.date.future(),
      },
    });

    const formResponse = await prisma.formResponse.create({
      data: {
        id: 1,
        formId: form.id,
        patientId: patient.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.formResponseField.create({
      data: {
        id: 1,
        responseId: formResponse.id,
        fieldId: formField.id,
        valueString: faker.lorem.sentence(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const formFieldGroup = await prisma.formFieldGroup.create({
      data: {
        id: 1,
        formId: form.id,
        label: faker.lorem.word(),
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.formResponseGroupInstance.create({
      data: {
        id: 1,
        formResponseId: formResponse.id,
        formFieldGroupId: formFieldGroup.id,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.providerAssignment.create({
      data: {
        id: 1,
        teamMemberId: teamMember.id,
        patientId: patient.id,
        acceptedAt: faker.date.past(),
      },
    });

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();