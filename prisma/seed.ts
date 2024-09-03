// prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {

  await prisma.user.deleteMany({});
  const users = [
    {
      username: "john_doe",
      email: "john.doe@example.com",
      password: "password1",
      lastActive: new Date("2024-08-24T12:00:00Z"),
      createdAt: new Date("2024-08-01T08:30:00Z"),
    },
    {
      username: "jane_smith",
      email: "jane.smith@example.com",
      password: "password2",
      lastActive: new Date("2024-08-23T15:00:00Z"),
      createdAt: new Date("2024-08-02T09:00:00Z"),
    },
    {
      username: "alice_jones",
      email: "alice.jones@example.com",
      password: "password3",
      lastActive: new Date("2024-08-22T10:00:00Z"),
      createdAt: new Date("2024-08-03T10:30:00Z"),
    },
    {
      username: "bob_brown",
      email: "bob.brown@example.com",
      password: "password4",
      lastActive: new Date("2024-08-21T18:00:00Z"),
      createdAt: new Date("2024-08-04T11:00:00Z"),
    },
    {
      username: "carol_white",
      email: "carol.white@example.com",
      password: "password5",
      lastActive: new Date("2024-08-20T08:00:00Z"),
      createdAt: new Date("2024-08-05T12:00:00Z"),
    },
    {
      username: "david_martin",
      email: "david.martin@example.com",
      password: "password6",
      lastActive: new Date("2024-08-19T09:00:00Z"),
      createdAt: new Date("2024-08-06T13:30:00Z"),
    },
    {
      username: "emma_clark",
      email: "emma.clark@example.com",
      password: "password7",
      lastActive: new Date("2024-08-18T16:00:00Z"),
      createdAt: new Date("2024-08-07T14:30:00Z"),
    },
    {
      username: "frank_lee",
      email: "frank.lee@example.com",
      password: "password8",
      lastActive: new Date("2024-08-17T11:00:00Z"),
      createdAt: new Date("2024-08-08T15:00:00Z"),
    },
    {
      username: "grace_evans",
      email: "grace.evans@example.com",
      password: "password9",
      lastActive: new Date("2024-08-16T13:00:00Z"),
      createdAt: new Date("2024-08-09T16:30:00Z"),
    },
    {
      username: "hank_wilson",
      email: "hank.wilson@example.com",
      password: "password10",
      lastActive: new Date("2024-08-15T14:00:00Z"),
      createdAt: new Date("2024-08-10T17:00:00Z"),
    },
    {
      username: "olivia_thompson",
      email: "olivia.thompson@example.com",
      password: "password11",
      lastActive: new Date("2024-08-25T06:00:00Z"),
      createdAt: new Date("2024-08-10T18:30:00Z"),
    },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.create({
      data: {
        username: user.username,
        email: user.email,
        password: hashedPassword,
        lastActive: user.lastActive,
        createdAt: user.createdAt,
      },
    });
  }

  console.log("Seed data inserted");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
