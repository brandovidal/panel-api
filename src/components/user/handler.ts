import { Prisma } from '@prisma/client'
import type { NextFunction, Request, Response } from 'express'

import isEmpty from 'just-is-empty'

import { HttpCode } from '../../types/response'

import { AppError, AppSuccess, AppSuccessByList, logger } from '../../utils'

import UserController from './controller'

const controller = new UserController()

// Find users
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query

    const name = query.name?.toString()
    const email = query.email?.toString()
    const page = parseInt(query.page?.toString() ?? '1')
    const limit = parseInt(query.limit?.toString() ?? '10')
    const revalidate = query.revalidate?.toString()

    const { count, total, users } = await controller.getUsers(
      name,
      email,
      page,
      limit,
      revalidate
    )

    res
      .status(HttpCode.OK)
      .json(
        AppSuccessByList(
          HttpCode.OK,
          'success',
          'user list successfully',
          users,
          count,
          total
        )
      )
  } catch (err) {
    res
      .status(HttpCode.FORBIDDEN)
      .json(AppError(HttpCode.FORBIDDEN, 'users_not_exist', 'Users not exist'))
  }
}

// Find only one user
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query

    const name = query.name?.toString() ?? ''
    const email = query.email?.toString() ?? ''

    const user = await controller.getUser(name, email)

    if (isEmpty(user)) {
      res
        .status(HttpCode.CONFLICT)
        .json(AppError(HttpCode.CONFLICT, 'user_not_exist', 'User not exist'))
      return
    }

    res
      .status(HttpCode.OK)
      .json(AppSuccess(HttpCode.OK, 'success', 'find user successfully', user))
  } catch (err) {
    next(err)
  }
}

// Find users
export const getUserbyId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId: string = req.params?.id
    const user = await controller.getUserId(userId)

    if (isEmpty(user)) {
      res
        .status(HttpCode.CONFLICT)
        .json(
          AppError(
            HttpCode.CONFLICT,
            'id_error',
            'ID malformed, please check again'
          )
        )
      return
    }

    res
      .status(HttpCode.OK)
      .json(AppSuccess(HttpCode.OK, 'success', 'find user by ID successfully', user))
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2023') {
        res
          .status(HttpCode.CONFLICT)
          .json(
            AppError(
              HttpCode.CONFLICT,
              'user_id_error',
              'User  id malformed, please check again'
            )
          )
        return
      }
    }
    next(err)
  }
}

// get me user
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userProfile = res.locals.user

    res
      .status(HttpCode.OK)
      .json(AppSuccess(HttpCode.OK, 'success', 'Get me profile', userProfile))
  } catch (err) {
    next(err)
  }
}

// create user
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const createdUser = await controller.createUser(req.body)

    res
      .status(HttpCode.CREATED)
      .json(
        AppSuccess(
          HttpCode.CREATED,
          'success',
          'user created successfully',
          createdUser
        )
      )
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        res
          .status(HttpCode.CONFLICT)
          .json(AppError(HttpCode.CONFLICT, 'user_exist', 'User already exist'))
        return
      }
    }
    if (err instanceof Prisma.PrismaClientValidationError) {
      res
        .status(HttpCode.CONFLICT)
        .json(
          AppError(
            HttpCode.CONFLICT,
            'prisma_validation_error',
            'Error de validación de campos'
          )
        )
      return
    }
    next(err)
  }
}

// update user
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId: string = req.params?.id
    const updatedUser = await controller.updateUser(userId, req.body)

    res
      .status(HttpCode.OK)
      .json(
        AppSuccess(
          HttpCode.OK,
          'success',
          'user updated successfully',
          updatedUser
        )
      )
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        res
          .status(HttpCode.CONFLICT)
          .json(AppError(HttpCode.CONFLICT, 'user_not_exist', 'User not exist'))
        return
      }
    }
    if (err instanceof Prisma.PrismaClientValidationError) {
      logger.error(err)
      res
        .status(HttpCode.CONFLICT)
        .json(
          AppError(
            HttpCode.CONFLICT,
            'prisma_validation_error',
            'Error de validación de campos'
          )
        )
      return
    }
    next(err)
  }
}

// delete user
export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId: string = req.params?.id
    const deletedUser = await controller.deleteUser(userId)

    res
      .status(HttpCode.OK)
      .json(
        AppSuccess(
          HttpCode.OK,
          'success',
          'user deleted successfully',
          deletedUser
        )
      )
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        res
          .status(HttpCode.CONFLICT)
          .json(AppError(HttpCode.CONFLICT, 'user_not_exist', 'User not exist'))
        return
      }
    }
    next(err)
  }
}
