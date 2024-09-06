require('dotenv').config()
const AWS = require('aws-sdk')
AWS.config.update({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION
})
const s3 = new AWS.S3({ signatureVersion: 'v4' })

const saveToS3 = async args => {
  try {
    const { file, name, filetype, project } = args
    const readableStreamForFile = fs.createReadStream(file)
    return await s3
      .upload({
        Bucket: 'civitas',
        Key: `${project}/{filetype}/${name}`,
        Body: readableStreamForFile,
        ACL: `public-read`,
        ContentType: 'image/png'
      })
      .promise()
  } catch (e) {
    throw e
  }
}
