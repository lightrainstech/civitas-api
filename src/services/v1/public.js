'use strict'
const Project = require('@models/projectModel.js')

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
      '/projects/image/upload/:fileType',
      {},
      async function (request, reply) {
        try {
          let { fileType } = request.params
          let formData = await request.file(),
            mimeType = formData.mimetype,
            fileName = formData.filename.replace(/[^a-zA-Z0-9.]/g, ''),
            filePath = `${process.cwd()}/public/images/${Date.now()}${fileName}`
          pipeline(formData.file, fs.createWriteStream(filePath), async err => {
            if (err) {
              reply.error(err)
            }
            let imageUrl = await saveToS3(
              filePath,
              `${Date.now()}-${fileName}`,
              fileType
            )
            fs.unlinkSync(filePath)
            reply.success({
              message: 'Image uploaded successfully.',
              path: imageUrl.Location,
              mimeType: mimeType
            })
          })
        } catch (err) {
          reply.error(err)
        }
        return reply
      }
    )
}
