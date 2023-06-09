import type { Prisma, Certificate } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

import { CacheContainer } from 'node-ts-cache'
import { MemoryStorage } from 'node-ts-cache-storage-memory'

import type { CertificatesResponse } from '../../interfaces/certificate'

import { PAGE_DEFAULT, SIZE_DEFAULT, TTL_DEFAULT } from '../../constants/repository'

import isEmpty from 'just-is-empty'

export const excludedFields = ['password', 'verified', 'verificationCode']

const certificateCache = new CacheContainer(new MemoryStorage())

const prisma = new PrismaClient()

export const getCertificates = async (dateOfIssue?: string, url?: string, page = PAGE_DEFAULT, limit = SIZE_DEFAULT): Promise<CertificatesResponse> => {
  const take = limit ?? SIZE_DEFAULT
  const skip = (page - 1) * take

  const cachedCertificates = await certificateCache.getItem<Certificate[]>('get-certificates') ?? []
  const cachedTotalCertificates = await certificateCache.getItem<number>('total-certificates') ?? 0

  // params
  const cachedName = await certificateCache.getItem<number>('get-dateOfIssue-certificates')
  const cachedCode = await certificateCache.getItem<number>('get-url-certificates')
  const cachedSize = await certificateCache.getItem<number>('get-limit-certificates')
  const cachedPage = await certificateCache.getItem<number>('get-page-certificates')

  if (!isEmpty(cachedCertificates) && cachedName === dateOfIssue && cachedCode === url && cachedSize === limit && cachedPage === page) {
    return { count: cachedCertificates.length, total: cachedTotalCertificates, certificates: cachedCertificates }
  }

  const [total, certificates] = await prisma.$transaction([
    prisma.certificate.count(),
    prisma.certificate.findMany({
      where: {
        dateOfIssue,
        url
      },
      take,
      skip,
      orderBy: {
        updatedAt: 'asc'
      }
    })
  ])

  const count = certificates.length

  await certificateCache.setItem('get-certificates', certificates, { ttl: TTL_DEFAULT })
  await certificateCache.setItem('total-certificates', total, { ttl: TTL_DEFAULT })

  // params
  await certificateCache.setItem('get-dateOfIssue-certificates', dateOfIssue, { ttl: TTL_DEFAULT })
  await certificateCache.setItem('get-url-certificates', url, { ttl: TTL_DEFAULT })
  await certificateCache.setItem('get-limit-certificates', limit, { ttl: TTL_DEFAULT })
  await certificateCache.setItem('get-page-certificates', page, { ttl: TTL_DEFAULT })

  void prisma.$disconnect()
  return { count, total, certificates }
}

export const getCertificateById = async (certificateId: string): Promise<Certificate> => {
  const cachedCertificateById = await certificateCache.getItem<Certificate>('get-certificate-by-id') as Certificate
  const cachedCertificateId = await certificateCache.getItem<string>('get-id-certificate')

  if (!isEmpty(cachedCertificateById) && cachedCertificateId === certificateId) {
    return cachedCertificateById
  }

  const certificate = await prisma.certificate.findFirst({
    where: {
      id: certificateId
    }
  }) as Certificate

  await certificateCache.setItem('get-certificate-by-id', certificate, { ttl: TTL_DEFAULT })

  // params
  await certificateCache.setItem('get-id-certificate', certificateId, { ttl: TTL_DEFAULT })

  void prisma.$disconnect()
  return certificate
}

export const getCertificate = async (dateOfIssue?: string, url?: string): Promise<Certificate> => {
  const cachedCertificate = await certificateCache.getItem<Certificate>('get-only-certificate') as Certificate

  // params
  const cachedName = await certificateCache.getItem<number>('get-only-dateOfIssue')
  const cachedCode = await certificateCache.getItem<number>('get-only-url')

  if (!isEmpty(cachedCertificate) && cachedName === dateOfIssue && cachedCode === url) {
    return cachedCertificate
  }

  const certificate = await prisma.certificate.findFirst({
    where: {
      dateOfIssue,
      url
    }
  }) as Certificate

  await certificateCache.setItem('get-only-certificate', certificate, { ttl: TTL_DEFAULT })

  // params
  await certificateCache.setItem('get-only-dateOfIssue', dateOfIssue, { ttl: TTL_DEFAULT })
  await certificateCache.setItem('get-only-url', url, { ttl: TTL_DEFAULT })

  void prisma.$disconnect()
  return certificate
}

export const getUniqueCertificate = async (where: Prisma.CertificateWhereUniqueInput, select?: Prisma.CertificateSelect): Promise<Certificate> => {
  const certificate = (await prisma.certificate.findUnique({
    where,
    select
  })) as Certificate

  void prisma.$disconnect()
  return certificate
}

export const createCertificate = async (certificateInput: Prisma.CertificateCreateInput): Promise<Certificate> => {
  const certificate = await prisma.certificate.create({ data: certificateInput })
  void prisma.$disconnect()
  return certificate
}

export const updateCertificate = async (certificateId: string, certificateInput: Certificate): Promise<Certificate> => {
  const certificate = await prisma.certificate.update({
    where: {
      id: certificateId
    },
    data: certificateInput
  })
  void prisma.$disconnect()
  return certificate
}

export const deleteCertificate = async (certificateId: string): Promise<number> => {
  const certificate = await prisma.certificate.deleteMany({
    where: {
      id: {
        in: [certificateId]
      }
    }
  })
  void prisma.$disconnect()
  return certificate.count
}
