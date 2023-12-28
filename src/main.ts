import * as core from '@actions/core'
import {Maybe} from './Maybe'
import {TwitterApi} from 'twitter-api-v2'
import {MediaId, StatusId, Tweet} from './Tweet'
import * as fs from 'fs'

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

    const uploadMedia: (media: string) => Promise<MediaId[]> = async (
      media: string
    ) => {
      if (fs.existsSync(media)) {
        const files = await fs.promises.readdir(media)
        return await Promise.all(
          files.map(file => {
            const path = `${media}/${file}`
            core.debug(`🐦 uploading media ${path}`)
            return tweet.upload(path)
          })
        )
      }
      return []
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
      core.error(error)
      core.setFailed(error.message)
    }
  }
}

run()
