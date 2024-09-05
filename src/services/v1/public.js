'use strict'
const Project = require('@models/projectModel.js')

module.exports = async function (fastify, opts) {
  fastify.post('/projects/list', {}, async function (request, reply) {
    const { searchTerm, chain, category, page } = request.body
    const projectModel = new Project()
    try {
      const projects = await projectModel.getProjects(
        searchTerm,
        chain,
        category,
        page
      )
      reply.success({
        message: 'Project created successfully',
        data: projects
      })
    } catch (error) {
      console.log(error)
    }
    return reply
  })
}
