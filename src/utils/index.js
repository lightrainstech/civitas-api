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
      Bucket: 'smooth-dao-assets',
      Key: `${project}/${filetype}/${name}`,
      Body: readableStreamForFile,
      ACL: `public-read`,
      ContentType: 'image/png'
    }
    await s3.send(new PutObjectCommand(uploadParams))
    return `https://d3i6jy4wk7u935.cloudfront.net/${uploadParams.Key}`
  } catch (e) {
    throw e
  }
}

const isAdminWallet = wallet => {
  const commaSeparatedStr = process.env.ADMIN_WALLETS
  return commaSeparatedStr
    .split(',')
    .map(item => item.trim())
    .includes(wallet)
}

module.exports = {
  saveToS3,
  isAdminWallet
}
