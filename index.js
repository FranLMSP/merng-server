const { ApolloServer } = require('apollo-server')
const gql = require('graphql-tag')
const mongoose = require('mongoose')

const Post = require('./models/Post')
const User = require('./models/User')
const { MONGODB } = require('./config.js')

const typeDefs = gql`
  type Post{
    id: ID!
    body: String!
    createdAt: String!
    username: String!
  }
  type Query{
    getPosts: [Post]
  }
`

const resolvers = {
  Query: {
    async getPosts() {
      try {
        const posts = await Post.find()
        return posts
      } catch(err) {
        throw new Error(err)
      }
      return 'Hello World!'
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers
})

mongoose.connect(MONGODB, { useUnifiedTopology: true, useNewUrlParser: true})
  .then(() => {
    console.log(`MongoDB Connected`)
    return server.listen({ port: 5000 })
  })
  .then(res => {
    console.log(`Apollo server running at ${res.url}`)
  })
