import * as core from '@actions/core'
import {Maybe} from './Maybe'
import {TwitterApi} from 'twitter-api-v2'
import {Media, StatusId, Tweet} from './Tweet'
import * as fs from 'fs'
import mime from 'mime'

function validateInput(name: string): void {
  if (!core.getInput(name)) throw new Error(`${name} is a required input`)
}

async function run(): Promise<void> {
  try {
    validateInput('status')
    validateInput('consumer-key')
    validateInput('consumer-secret')
    validateInput('access-token')
    validateInput('access-token-secret')

    core.setSecret(core.getInput('consumer-key'))
    core.setSecret(core.getInput('consumer-secret'))
    core.setSecret(core.getInput('access-token'))
    core.setSecret(core.getInput('access-token-secret'))

    const status: string = core.getInput('status')
    const replyTo: Maybe<StatusId> = core.getInput('replyto') as Maybe<StatusId>
    const media: Maybe<string> = core.getInput('media') as Maybe<StatusId>

    core.info(`🐦 Sending tweet [${status}]`)

    const twitter = new TwitterApi({
      appKey: core.getInput('consumer-key'),
      appSecret: core.getInput('consumer-secret'),
      accessToken: core.getInput('access-token'),
      accessSecret: core.getInput('access-token-secret')
    })

    const tweet = new Tweet(twitter, status)

    const uploadMedia: (media: string) => Promise<Media | undefined> = async (
      media: string
    ) => {
      if (fs.existsSync(media)) {
        const files = await fs.promises.readdir(media)

        const uploads = await Promise.all(
          files
            .map(file => `${media}/${file}`)
            .filter(path => {
              const mimeType = mime.getType(path)
              return mimeType?.startsWith('image/')
            })
            .map(path => {
              core.debug(`🐦 uploading media [${path}]`)
              return tweet.upload(path)
            })
        )

        if (uploads.length >= 4) {
          const [a, b, c, d, ...tails] = uploads
          return [a, b, c, d]
        } else if (uploads.length == 3) {
          const [a, b, c] = uploads
          return [a, b, c]
        } else if (uploads.length == 2) {
          const [a, b] = uploads
          return [a, b]
        } else if (uploads.length == 1) {
          const [a] = uploads
          return [a]
        }
        return undefined
      }
      return undefined
    }

    const uploads = media && media !== '' ? await uploadMedia(media) : undefined

    if (uploads && uploads.length > 0) {
      core.info(`🐦 sending tweet with media [${uploads}] from [${media}]`)
    }

    if (replyTo) {
      core.info(`🐦 replying to ${replyTo}`)
      const id = await tweet.replyTo(replyTo, uploads)
      core.info(`🐦 sent reply tweet [${id}]`)
      core.setOutput('status', id)
    } else {
      const id = await tweet.send(uploads)
      core.info(`🐦 sent tweet [${id}]`)
      core.setOutput('status', id)
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log(error)
      core.error(error)
      core.setFailed(error.message)
    }
  }
}

run()
