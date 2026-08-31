import type { Prisma } from '@prisma/client'
import type { BundleDTO, BundleDetailDTO } from './types'

/** Include padrão de bundle (itens → cursos) reutilizado por todas as rotas */
export function bundleBaseInclude() {
  return {
    items: {
      orderBy: { order: 'asc' as const },
      select: {
        courseId: true,
        order: true,
        course: {
          select: {
            id: true,
            title: true,
            coverUrl: true,
            price: true,
            isPublished: true,
            category: true,
          },
        },
      },
    },
    mentor: {
      select: {
        id: true,
        userId: true,
        headline: true,
        user: { select: { name: true, avatarUrl: true } },
      },
    },
  } satisfies Prisma.BundleInclude
}

export type BundleWithRelations = Prisma.BundleGetPayload<{
  include: ReturnType<typeof bundleBaseInclude>
}>

/**
 * Serializa um bundle p/ BundleDTO. coursesTotal = soma dos preços publicados;
 * discountPercent = 1 - price/total (arredondado, mínimo 0).
 */
export function serializeBundle(bundle: BundleWithRelations): BundleDTO {
  const courses = bundle.items
    .filter((i) => i.course.isPublished)
    .map((i) => ({
      id: i.course.id,
      title: i.course.title,
      coverUrl: i.course.coverUrl,
      price: i.course.price,
      category: i.course.category,
    }))
  const coursesTotal =
    Math.round(courses.reduce((a, c) => a + c.price, 0) * 100) / 100
  const discountPercent =
    coursesTotal > 0
      ? Math.max(0, Math.round((1 - bundle.price / coursesTotal) * 100))
      : 0

  return {
    id: bundle.id,
    title: bundle.title,
    description: bundle.description,
    price: bundle.price,
    isPublished: bundle.isPublished,
    createdAt: bundle.createdAt.toISOString(),
    mentor: {
      id: bundle.mentor.id,
      userId: bundle.mentor.userId,
      name: bundle.mentor.user.name,
      headline: bundle.mentor.headline,
      avatarUrl: bundle.mentor.user.avatarUrl,
    },
    courses,
    courseCount: courses.length,
    coursesTotal,
    discountPercent,
  }
}

export function serializeBundleDetail(
  bundle: BundleWithRelations,
  myEnrolledCourseIds: string[]
): BundleDetailDTO {
  return {
    ...serializeBundle(bundle),
    myEnrolledCourseIds,
  }
}
