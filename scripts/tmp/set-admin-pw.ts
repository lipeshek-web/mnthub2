import { PrismaClient } from '@prisma/client'
import { scryptSync, randomBytes } from 'node:crypto'
const prisma = new PrismaClient()
const salt = randomBytes(16).toString('hex')
const hash = scryptSync('orbita-test-123', salt, 64).toString('hex')
const u = await prisma.user.update({ where: { email: 'gustavonv@yandex.com' }, data: { passwordHash: `${salt}:${hash}` } })
console.log('senha local do admin atualizada:', u.email)
process.exit(0)
