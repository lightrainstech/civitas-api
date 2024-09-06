require('dotenv').config()
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET
  }
})

const saveToS3 = async args => {
  try {
    const { file, name, filetype, project } = args
    const readableStreamForFile = fs.createReadStream(file)
    const uploadParams = {
      Bucket: 'travelmate-s3',
      Key: `${project}/${filetype}/${name}`,
      Body: readableStreamForFile,
      ACL: `public-read`,
      ContentType: 'image/png'
    }
    await s3.send(new PutObjectCommand(uploadParams))
    return `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`
  } catch (e) {
    throw e
  }
}

module.exports = {
  saveToS3
}
