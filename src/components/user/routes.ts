import { Router } from 'express'

// Schemas
import { registerUserSchema, updateUserSchema } from './schema'

// Middlewarea
import { deserializeUser } from '../../middlewares/deserializeUser'
import { validate } from '../../middlewares/validate'

// Handler
import { create, getMe, getUser, getUserbyId, getUsers, remove, update } from './handler'

const router = Router()

// router.use(deserializeUser)

router.get('/', getUsers)
router.get('/user', getUser)
router.get('/me', [deserializeUser], getMe)
router.get('/:id', getUserbyId)
router.post('/', [validate(registerUserSchema)], create)
router.put('/:id', [validate(updateUserSchema)], update)
router.delete('/:id', remove)

export default router
