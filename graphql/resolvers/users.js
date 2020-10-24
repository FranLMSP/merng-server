const jwt = require('jsonwebtoken')
const argon2 = require('argon2')

const { validateRegisterInput, validateLoginInput } = require('../../util/validators')
const { SECRET_KEY } = require('../../config')
const User = require('../../models/User')
const { UserInputError } = require('apollo-server')

const generateToken = user => {
  return  jwt.sign({
    id: user.id,
    email: user.email,
    username: user.username,
  }, SECRET_KEY, { expiresIn: '1h'})
}

module.exports = {
  Mutation: {
    async login(_, {username, password}, context, info) {
      const { errors, valid } = validateLoginInput(username, password)
      if(!valid) {
        throw new UserInputError('Errors', { errors })
      }
      const user = await User.findOne({ username })
      if(!user) {
        errors.general = 'User not found'
        throw new UserInputError('User not found', { errors })
      }

      const validPassword = await argon2.verify(user.password, password)
      if(!validPassword) {
        errors.general = 'Wrong credentials'
        throw new UserInputError('Wrong credentials', { errors })
      }

      const token = generateToken(user)

      return {
        ...user._doc,
        id: user._id,
        token
      }
    },
    async register(
      _,
      {
        registerInput: { username, email, password, confirmPassword }
      },
      context,
      info
    ) {
      // Validate user data
      const { valid, errors } = validateRegisterInput(username, email, password, confirmPassword)
      if(!valid) {
        throw new UserInputError('Errors', { errors })
      }
      // Make sure user doesn't already exist
      const existingUser = await User.findOne({ username })
      if(existingUser) {
        throw new UserInputError('Username is already taken', {
          errors: {
            username: 'This username is taken'

          }
        })
      }

      // hash password and create an auth token
      const hashedPassword = await argon2.hash(password)

      const newUser = new User({
        email,
        username: username.trim(),
        password: hashedPassword,
        createdAt: new Date().toISOString()
      })

      const res = await newUser.save()

      const token = generateToken(res)

      return {
        ...res._doc,
        id: res._id,
        token
      }

    }
  }
}
