import * as core from '@actions/core'
import {TwitterApi} from 'twitter-api-v2'

function validateInput(name: string): void {
  if (!core.getInput(name)) throw new Error(`${name} is a required input`)
}

async function run(): Promise<void> {
  try {
    validateInput('id')
    validateInput('status')
    validateInput('consumer-key')
    validateInput('consumer-secret')
    validateInput('access-token')
    validateInput('access-token-secret')

    const id = core.getInput('id')
    const existingId = core.getState(id)

    if (!existingId) {
      const twitter = new TwitterApi({
        appKey: core.getInput('consumer-key'),
        appSecret: core.getInput('consumer-secret'),
        accessToken: core.getInput('access-token'),
        accessSecret: core.getInput('access-token-secret')
      })

      const replyToId = core.getInput('replyto')

      if (replyToId) {
        const replyStatus = core.getState(replyToId)

        if (replyStatus) {
          const tweet = await twitter.v2.reply(
            core.getInput('status'),
            replyStatus
          )
          core.saveState(id, tweet.data.id)
        }
      } else {
        const tweet = await twitter.v2.tweet(core.getInput('status'))
        core.saveState(id, tweet.data.id)
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(error)
      core.setFailed(error.message)
    }
  }
}

run()
