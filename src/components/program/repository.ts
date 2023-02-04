import type { Prisma, Program } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

import { CacheContainer } from 'node-ts-cache'
import { MemoryStorage } from 'node-ts-cache-storage-memory'

import type { ProgramsResponse } from '../../interfaces/program'

import { PAGE_DEFAULT, SIZE_DEFAULT, TTL_DEFAULT } from '../../constants/repository'

import isEmpty from 'just-is-empty'
import { Response } from 'express'

export const excludedFields = ['password', 'verified', 'verificationCode']

const programCache = new CacheContainer(new MemoryStorage())

const prisma = new PrismaClient()

export const getPrograms = async (name?: string, email?: string, page = PAGE_DEFAULT, size = SIZE_DEFAULT): Promise<ProgramsResponse> => {
  const take = size ?? SIZE_DEFAULT
  const skip = (page - 1) * take

  const cachedPrograms = await programCache.getItem<Program[]>('get-programs') ?? []
  const cachedTotalPrograms = await programCache.getItem<number>('total-programs') ?? 0

  // params
  const cachedName = await programCache.getItem<number>('get-name-programs')
  const cachedEmail = await programCache.getItem<number>('get-email-programs')
  const cachedSize = await programCache.getItem<number>('get-size-programs')
  const cachedPage = await programCache.getItem<number>('get-page-programs')

  if (!isEmpty(cachedPrograms) && cachedName === name && cachedEmail === email && cachedSize === size && cachedPage === page) {
    return { count: cachedPrograms.length, total: cachedTotalPrograms, programs: cachedPrograms }
  }

  const [total, programs] = await prisma.$transaction([
    prisma.program.count(),
    prisma.program.findMany({
      where: {
        name: { contains: name?.toString(), mode: 'insensitive' },
      },
      take,
      skip,
      orderBy: {
        updatedAt: 'asc'
      }
    })
  ])

  const count = programs.length

  await programCache.setItem('get-programs', programs, { ttl: TTL_DEFAULT })
  await programCache.setItem('total-programs', total, { ttl: TTL_DEFAULT })

  // params
  await programCache.setItem('get-name-programs', name, { ttl: TTL_DEFAULT })
  await programCache.setItem('get-email-programs', email, { ttl: TTL_DEFAULT })
  await programCache.setItem('get-size-programs', size, { ttl: TTL_DEFAULT })
  await programCache.setItem('get-page-programs', page, { ttl: TTL_DEFAULT })

  void prisma.$disconnect()
  return { count, total, programs }
}

export const getProgramById = async (programId: string): Promise<Program | null> => {
  const cachedProgramById = await programCache.getItem<Program>('get-program-by-id') ?? null
  const cachedProgramId = await programCache.getItem<string>('get-id-program')

  if (!isEmpty(cachedProgramById) && cachedProgramId === programId) {
    return cachedProgramById
  }

  const program = await prisma.program.findFirst({
    where: {
      id: programId
    }
  }) as Program

  await programCache.setItem('get-program-by-id', program, { ttl: TTL_DEFAULT })

  // params
  await programCache.setItem('get-id-program', programId, { ttl: TTL_DEFAULT })

  void prisma.$disconnect()
  return program
}

export const getProgram = async (name?: string, email?: string): Promise<Program> => {
  const cachedProgram = await programCache.getItem<Program>('get-only-program') as Program

  // params
  const cachedName = await programCache.getItem<number>('get-only-name')
  const cachedEmail = await programCache.getItem<number>('get-only-email')

  if (!isEmpty(cachedProgram) && cachedName === name && cachedEmail === email) {
    return cachedProgram
  }

  const program = await prisma.program.findFirst({
    where: {
      name: { contains: name, mode: 'insensitive' },
    }
  }) as Program

  await programCache.setItem('get-only-program', program, { ttl: TTL_DEFAULT })

  // params
  await programCache.setItem('get-only-name', name, { ttl: TTL_DEFAULT })
  await programCache.setItem('get-only-email', email, { ttl: TTL_DEFAULT })

  void prisma.$disconnect()
  return program
}

export const getUniqueProgram = async (where: Prisma.ProgramWhereUniqueInput, select?: Prisma.ProgramSelect): Promise<Program> => {
  const program = (await prisma.program.findUnique({
    where,
    select
  })) as Program

  void prisma.$disconnect()
  return program
}

export const createProgram = async (programInput: Prisma.ProgramCreateInput): Promise<Program> => {
  const program = await prisma.program.create({ data: programInput })
  void prisma.$disconnect()
  return program
}

export const updateProgram = async (programId: string, programInput: Program): Promise<Program> => {
  const program = await prisma.program.update({
    where: {
      id: programId
    },
    data: programInput
  })
  void prisma.$disconnect()
  return program
}

export const deleteProgram = async (programId: string): Promise<Program> => {
  const program = await prisma.program.delete({
    where: {
      id: programId
    }
  })
  void prisma.$disconnect()
  return program
}