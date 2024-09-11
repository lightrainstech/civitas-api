'use strict'
const Project = require('@models/projectModel.js')
const Launch = require('@models/launchModel.js')
const { pipeline } = require('stream')
const fs = require('fs')
const { saveToS3 } = require('../../utils')

module.exports = async function (fastify, opts) {
  fastify.post('/projects/list', {}, async function (request, reply) {
    const { searchTerm, chain, category, page } = request.body
    const projectModel = new Project()
    try {
      const projects = await projectModel.getProjects({
        searchTerm,
        chain,
        category,
        page
      })
      reply.success({
        message: 'Project created successfully',
        data: projects
      })
    } catch (error) {
      console.log(error)
    }
    return reply
  }),
    fastify.post(
      '/projects/image/upload/:project/:fileType',
      {},
      async function (request, reply) {
        try {
          let { fileType, project } = request.params
          let formData = await request.file(),
            mimeType = formData.mimetype,
            fileName = formData.filename.replace(/[^a-zA-Z0-9.]/g, ''),
            filePath = `${process.cwd()}/src/public/images/${Date.now()}${fileName}`
          pipeline(formData.file, fs.createWriteStream(filePath), async err => {
            if (err) {
              reply.error(err)
            }
            let imageUrl = await saveToS3({
              project,
              file: filePath,
              name: `${Date.now()}-${fileName}`,
              filetype: fileType
            })
            fs.unlinkSync(filePath)
            reply.success({
              message: 'Image uploaded successfully.',
              path: imageUrl,
              mimeType: mimeType
            })
          })
        } catch (err) {
          console.log(err)
          reply.error(err)
        }
        return reply
      }
    ),
    fastify.get(
      '/projects/detail/:projectId',
      {},
      async function (request, reply) {
        const { projectId } = request.params
        const projectModel = new Project()
        try {
          const projects = await projectModel.getProjectDetails(projectId)
          reply.success({
            message: 'Project created successfully',
            data: projects
          })
        } catch (error) {
          console.log(error)
          reply.error({ message: 'Failed to get Project' })
        }
        return reply
      }
    ),
    fastify.post('/launches/list', async function (request, reply) {
      const { searchTerm, chain, page } = request.body
      const launchModel = new Launch()
      try {
        const launches = await launchModel.getLaunches({
          searchTerm,
          chain,
          page
        })
        reply.success({
          message: 'Luunches list success',
          data: launches
        })
      } catch (error) {
        console.log(error)
        reply.error({ message: 'Failed to get Lunches' })
      }
      return reply
    }),
    fastify.get('/launches/detail/:launchId', async function (request, reply) {
      const { launchId } = request.params
      const launchModel = new Launch()

      try {
        const launch = await launchModel.getLauchDetails(launchId)
        reply.success({
          message: 'launch get successfully',
          data: launch
        })
      } catch (error) {
        console.log(error)
        reply.error({ message: 'Failed to get launchs' })
      }
      return reply
    }),
    fastify.get(
      '/is_available/:entitytype/:str',
      async function (request, reply) {
        const { entitytype, str } = request.params
        const launchModel = new Launch()
        const projectModel = new Project()

        try {
          if (entitytype === 'project') {
            const project = await projectModel.getProjectDetails(str)
            reply.success({
              message: 'success',
              available: project ? false : true
            })
          } else if (entitytype === 'launch') {
            const launch = await launchModel.getLauchDetails(str)
            reply.success({
              message: 'success',
              available: launch ? false : true
            })
          } else {
            reply.error({ message: 'Failed to fetch' })
          }
        } catch (error) {
          console.log(error)
          reply.error({ message: 'Failed to fetch' })
        }
        return reply
      }
    )
}
